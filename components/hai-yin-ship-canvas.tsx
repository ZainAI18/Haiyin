"use client";
import {Canvas,useFrame,useThree,type ThreeEvent} from "@react-three/fiber";
import {OrbitControls} from "@react-three/drei";
import {useCallback,useEffect,useRef,useState,type ComponentRef} from "react";
import {Mesh,Object3D,Vector3} from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {createShipActions,inspectId,type ShipPreset} from "@/lib/hai-yin-scene";

type Actions=ReturnType<typeof createShipActions>;
type Props={preset:ShipPreset;selected?:string;view:string;reset:number;onPick:(id:string)=>void;onFailure:()=>void};
function release(root:Object3D){root.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
function Ship({preset,selected,onPick,onReady,onFailure}:{preset:ShipPreset;selected?:string;onPick:(id:string)=>void;onReady:(actions:Actions)=>void;onFailure:()=>void}){
  const [asset,setAsset]=useState<{root:Object3D;actions:Actions}>();const invalidate=useThree(s=>s.invalidate);
  useEffect(()=>{
    const abort=new AbortController();let loaded:Object3D|undefined;
    async function load(){const response=await fetch("/hai-yin-i/models/hai-yin-i-visual-assembly.glb",{signal:abort.signal});if(!response.ok)throw Error("Model unavailable");const bytes=await response.arrayBuffer();if(abort.signal.aborted)return;const gltf=await new GLTFLoader().parseAsync(bytes,"");loaded=gltf.scene;if(abort.signal.aborted){release(loaded);loaded=undefined;return;}const actions=createShipActions(loaded);setAsset({root:loaded,actions});onReady(actions);invalidate();}
    void load().catch(()=>{if(!abort.signal.aborted)onFailure();});return()=>{abort.abort();if(loaded)release(loaded);};
  },[invalidate,onFailure,onReady]);
  useEffect(()=>{if(!asset)return;asset.actions.applyPreset(preset);if(selected)asset.actions.select(selected);invalidate();},[asset,preset,selected,invalidate]);
  const pick=(event:ThreeEvent<PointerEvent>)=>{if(event.delta>4||!asset)return;const hit=event.intersections.find(hit=>asset.actions.canPick(hit.object));const id=hit&&inspectId(hit.object);if(id){event.stopPropagation();onPick(id);}};
  return asset?<primitive object={asset.root} dispose={null} onPointerUp={pick}/>:null;
}
function Controls({actions,preset,selected,view,reset}:{actions?:Actions;preset:ShipPreset;selected?:string;view:string;reset:number}){
  const controls=useRef<ComponentRef<typeof OrbitControls>>(null),camera=useThree(s=>s.camera),invalidate=useThree(s=>s.invalidate);
  const flight=useRef<{start:number;from:Vector3;to:Vector3;targetFrom:Vector3;targetTo:Vector3}|undefined>(undefined);
  const initialized=useRef(false);
  useEffect(()=>{
    if(!actions||!controls.current)return;
    const focus=actions.focus(selected||(preset==="engine"?"hyi_engine_room":preset==="cargo"?"hyi_cargo_tanks":undefined));
    const direction=view==="front"?new Vector3(0,.12,1):view==="side"?new Vector3(1,.13,0):view==="top"?new Vector3(0,1,.0001):new Vector3(.82,.46,1);
    camera.up.set(0,view==="top"?0:1,view==="top"?-1:0);const to=focus.centre.clone().add(direction.normalize().multiplyScalar(focus.distance));
    if(!initialized.current||matchMedia("(prefers-reduced-motion:reduce)").matches){camera.position.copy(to);controls.current.target.copy(focus.centre);controls.current.update();initialized.current=true;}
    else flight.current={start:performance.now(),from:camera.position.clone(),to,targetFrom:controls.current.target.clone(),targetTo:focus.centre};
    invalidate();
  },[actions,preset,selected,view,reset,camera,invalidate]);
  useFrame(()=>{const f=flight.current;if(!f||!controls.current)return;const t=Math.min(1,(performance.now()-f.start)/650),e=t*t*(3-2*t);camera.position.lerpVectors(f.from,f.to,e);controls.current.target.lerpVectors(f.targetFrom,f.targetTo,e);controls.current.update();if(t===1)flight.current=undefined;else invalidate();});
  return <OrbitControls ref={controls} makeDefault target={[0,5,0]} minDistance={1.5} maxDistance={180} enableDamping={false} onStart={()=>{flight.current=undefined;}}/>;
}
function ContextLoss({onFailure}:{onFailure:()=>void}){const canvas=useThree(s=>s.gl.domElement);useEffect(()=>{const handler=(event:Event)=>{event.preventDefault();onFailure();};canvas.addEventListener("webglcontextlost",handler);return()=>canvas.removeEventListener("webglcontextlost",handler);},[canvas,onFailure]);return null;}
export default function HaiYinShipCanvas(props:Props){const [actions,setActions]=useState<Actions>();const ready=useCallback((value:Actions)=>setActions(value),[]);return <div className="canvas-wrap" aria-label="独立的海银一号整船三维装配">
  <Canvas frameloop="demand" dpr={[1,1.25]} shadows={false} camera={{position:[46,31,54],fov:40,near:.04,far:500}} gl={{antialias:true,powerPreference:"low-power"}}>
    <ambientLight intensity={1.8}/><directionalLight position={[30,45,25]} intensity={3}/>
    <Ship {...props} onReady={ready}/><Controls {...props} actions={actions}/><ContextLoss onFailure={props.onFailure}/>
    <gridHelper args={[100,50,"#64878c","#2d5059"]} position={[0,-.04,0]}/>
  </Canvas>{!actions&&<div className="viewer-loading" role="status">正在加载 Hai Yin I 整船模型…</div>}
  </div>;}
