"use client";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Box3, Color, Group, Mesh, MeshStandardMaterial, Vector3, type Object3D } from "three";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import type { ObjectId, OverlayId } from "@/lib/domain";
import type { ModelLoadState, ViewerProps, ModelManifest } from "./visual-types";
import { SchematicShip } from "./schematic-ship";
import { DockGeometry } from "./dock-geometry";
import { useProductionAsset } from "./production-asset";

type Props = ViewerProps & {model:ModelManifest|null;onModelState:(state:ModelLoadState)=>void; onContextLost:()=>void};
const isObject = (o: Object3D): o is Object3D & {userData:{object:ObjectId}} => typeof o.userData.object === "string";
const orbitShip: [number,number,number] = [-16,8.0,22.5];
const orbitDock: [number,number,number] = [-21,18,27];
const origin: [number,number,number] = [0,0,0];
const amber = new Color("#ff944d");
const focusDirections: Partial<Record<ObjectId, [number, number, number]>> = {
  bow: [.53,.32,1], stem: [.86,.17,1], "fore-bottom": [.82,-.65,1], forecastle: [.50,.9,1],
  hawse: [.32,.14,1], "bow-thruster": [.34,-.29,1], "thruster-grid": [.22,-.21,1],
  "bottom-shell": [-.38,-.65,1], stern: [-1.12,.3,.65],
  anchor: [.48,.28,1], "anchor-shank": [.34,.12,1], "anchor-arm": [.34,.12,1],
  "anchor-ring": [.34,.18,1], fluke: [.34,.12,1], crown: [.34,.12,1],
  propeller: [-1.14,-.14,.72], "propeller-boss": [-1.14,-.14,.72], "propeller-blade": [.76,-.57,1],
  "shaft-outlet": [-.64,-.36,1], "rudder-drain-plug": [-.14,-.13,1], hatch: [.12,1,1], superstructure: [-.5,.56,1],
};

function Defect({ type, point, size }: {type:OverlayId; point:Vector3;size:number}) {
  const paths = [[-.48,.17,-.22,.03],[-.22,.03,-.025,.10],[-.025,.1,.19,-.14],[.19,-.14,.45,-.11],[.19,-.14,.23,-.33]];
  return <group position={point} scale={size}>
    {type==="crack" ? paths.map(([x,y,a,b],i)=><mesh key={i} renderOrder={5} position={[(x+a)/2,(y+b)/2,0]} rotation={[0,0,Math.atan2(b-y,a-x)]}><planeGeometry args={[Math.hypot(a-x,b-y)+.013,.032]}/><meshBasicMaterial color="#381207" side={2} depthTest={false}/></mesh>) :
    type==="dent" ? <mesh renderOrder={5}><ringGeometry args={[.34,.39,40]}/><meshBasicMaterial color="#ffb980" side={2} depthTest={false}/></mesh> :
      Array.from({length:9},(_,i)=><mesh key={i} renderOrder={5} position={[(i%4-1.5)*.20,(Math.floor(i/4)-.7)*.21,0]}><circleGeometry args={[(i%3+2)*.029,12]}/><meshBasicMaterial color={type==="ingress"?"#76cee0":type==="wear"?"#cfaa82":"#6c2915"} side={2} depthTest={false}/></mesh>)}
  </group>;
}

function World({ scene,target,overlay,stage=0,reset,onPick,model,onModelState,onContextLost,reduced }:Props & {reduced:boolean}) {
  const group=useRef<Group>(null);
  const controls=useRef<OrbitImpl>(null);
  const goal=useRef<{look:Vector3;cam:Vector3} | null>(null);
  const [mark,setMark]=useState<{point:Vector3;size:number}>();
  const { camera, invalidate, gl, size }=useThree();
  const asset = useProductionAsset(model,onModelState);
  const detailed = asset && (!target || asset.getObjectByName(target)?.userData.object === target) ? asset : undefined;
  useEffect(()=>{
    const lost = (e:Event)=>{e.preventDefault();onContextLost();};
    gl.domElement.addEventListener("webglcontextlost",lost);
    return ()=>gl.domElement.removeEventListener("webglcontextlost",lost);
  },[gl,onContextLost]);

  useLayoutEffect(()=>{
    if (!controls.current || !group.current) return;
    const base = scene ? orbitDock : orbitShip;
    const ratio = Math.min(1, size.width / size.height / 1.3);
    const look = new Vector3(...origin), cam = new Vector3(...base).multiplyScalar(1/Math.max(.6,ratio));
    if (scene==="synchrolift") {look.x = 3; cam.x += 2; cam.multiplyScalar(1.12);}
    const previous: {mat:MeshStandardMaterial;color:Color;intensity:number}[]=[];
    let marker:{point:Vector3;size:number}|undefined;
    if (!scene && target) {
      group.current.updateWorldMatrix(true,true);
      const candidates=group.current.getObjectsByProperty("name",target).filter(o=>o.userData.object===target);
      const node=candidates.at(-1);
      const box=node && new Box3().setFromObject(node);
      if (node && box && !box.isEmpty()) {
        box.getCenter(look);
        const ext=box.getSize(new Vector3());
        const whole=target==="hull" || target==="deck";
        const direction=new Vector3(...(focusDirections[target] ?? [-.72,whole?.36:.28,1])).normalize();
        const minimumDistance = ext.length() < .8 ? 1.9 : 3.65;
        const distance=Math.max(minimumDistance, ext.length()*(whole?1.62:2.5))/Math.max(.65,ratio);
        cam.copy(look).addScaledVector(direction,distance);
        const selectedMats=new Set<MeshStandardMaterial>();
        candidates.forEach(root=>root.traverse(child=>{
          if (!(child instanceof Mesh)) return;
          for(const m of Array.isArray(child.material)?child.material:[child.material]) if(m instanceof MeshStandardMaterial) selectedMats.add(m);
        }));
        for(const mat of selectedMats) {
          previous.push({mat,color:mat.emissive.clone(),intensity:mat.emissiveIntensity});
          mat.emissive.copy(amber);mat.emissiveIntensity=.39;
        }
        if (overlay) marker={point:new Vector3(look.x+(whole?1.0:0),look.y+(whole?-.62:0),box.max.z+.04),size:Math.max(.37,Math.min(1.15,ext.length()*.48))};
      }
    }
    setMark(marker);
    goal.current={look,cam};
    invalidate();
    return ()=>{for(const {mat,color,intensity} of previous){mat.emissive.copy(color);mat.emissiveIntensity=intensity;}};
  },[target,overlay,reset,asset,camera,invalidate,size.width,size.height,scene]);

  useFrame((_,delta)=>{
    const c=controls.current;
    const g=goal.current;
    if (!c || !g) return;
    const t=reduced ? 1 : 1-Math.exp(-Math.max(.014,Math.min(delta,.065))*8);
    camera.position.lerp(g.cam,t);c.target.lerp(g.look,t);
    if (camera.position.distanceToSquared(g.cam)+c.target.distanceToSquared(g.look)<.00008) {
      camera.position.copy(g.cam);c.target.copy(g.look);goal.current=null;
    }
    c.update();
    if (goal.current) invalidate();
  });

  const pick=(e:ThreeEvent<MouseEvent>)=>{
    if (e.delta>5 || !onPick) return;
    let node:Object3D|null=e.object;
    while(node && !isObject(node)) node=node.parent;
    if(node && isObject(node)){e.stopPropagation();onPick(node.userData.object);}
  };
  return <>
    <ambientLight intensity={.68}/><hemisphereLight args={["#dceef5","#735656",1.15]}/>
    <directionalLight color="#f9e2c4" intensity={2.20} position={[2,8,8]}/>
    <directionalLight color="#8ac4e5" intensity={.75} position={[1,5,-9]}/>
    <gridHelper args={[64,64,"#385463","#284450"]} position={[0,scene ? -4.11 : -2.65,0]}/>
    <group ref={group} onClick={scene || !onPick?undefined:pick}>
      {scene ? <DockGeometry scene={scene} stage={stage} reduced={reduced}/>
        : detailed ? <primitive object={detailed} dispose={null}/> : <SchematicShip/>}
      {!scene && overlay && mark && <Defect type={overlay} {...mark}/>}
    </group>
    <OrbitControls ref={controls} makeDefault enableDamping={false} minDistance={1.7} maxDistance={90} maxPolarAngle={Math.PI*.88} onStart={()=>{goal.current=null;}}/>
  </>;
}

export default function CanvasView(props:Props) {
  const [pref,setPref]=useState({mobile:false,reduced:false});
  useEffect(()=>{
    const small=window.matchMedia("(max-width: 720px), (pointer: coarse)");
    const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>setPref({mobile:small.matches,reduced:motion.matches});
    update(); small.addEventListener("change",update);motion.addEventListener("change",update);
    return ()=>{small.removeEventListener("change",update);motion.removeEventListener("change",update);};
  },[]);
  return <div className="canvas-wrap" aria-hidden="true">
    <Canvas frameloop="demand" dpr={[1,pref.mobile?1.25:1.6]} shadows={false}
      camera={{position:props.scene?orbitDock:orbitShip, fov:45, near:.1, far:115}}
      gl={{antialias:!pref.mobile,alpha:true,powerPreference:"default"}}>
      <Suspense fallback={null}><World {...props} reduced={pref.reduced}/></Suspense>
    </Canvas></div>;
}
