"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useRef, useState, type ComponentRef } from "react";
import { Mesh, type Object3D } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

function release(root:Object3D) {
  root.traverse(node => {
    if (node instanceof Mesh) {
      node.geometry.dispose();
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) material.dispose();
    }
  });
}

function Rudder({onFailure,onReady}:{onFailure:()=>void;onReady:()=>void}) {
  const [object,setObject]=useState<Object3D>();
  const invalidate=useThree(state=>state.invalidate);
  useEffect(() => {
    const abort=new AbortController();
    let asset:Object3D|undefined;
    async function load() {
      const response=await fetch("/hai-yin-i/models/rudder-blade-envelope.glb",{signal:abort.signal});
      if (!response.ok) throw new Error("Model unavailable");
      const bytes=await response.arrayBuffer();
      if (abort.signal.aborted) return;
      const result=await new GLTFLoader().parseAsync(bytes,"");
      asset=result.scene;
      if (abort.signal.aborted) { release(asset); asset=undefined; return; }
      setObject(asset); invalidate(); onReady();
    }
    void load().catch(() => { if(!abort.signal.aborted) onFailure(); });
    return () => { abort.abort(); if(asset) release(asset); };
  },[invalidate,onFailure,onReady]);
  return object ? <primitive object={object} dispose={null}/> : null;
}

function Controls({reset}:{reset:number}) {
  const controls=useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera=useThree(state=>state.camera);
  const invalidate=useThree(state=>state.invalidate);
  useEffect(()=>{
    camera.position.set(3.3,2.8,3.6);
    controls.current?.target.set(.7,1.04,0);
    controls.current?.update();
    invalidate();
  },[reset,camera,invalidate]);
  return <OrbitControls ref={controls} makeDefault target={[.7,1.04,0]} minDistance={.7} maxDistance={10} enableDamping={false}/>;
}

function ContextLoss({onFailure}:{onFailure:()=>void}) {
  const canvas=useThree(state=>state.gl.domElement);
  useEffect(()=>{
    const lost=(event:Event)=>{event.preventDefault();onFailure();};
    canvas.addEventListener("webglcontextlost",lost);
    return ()=>canvas.removeEventListener("webglcontextlost",lost);
  },[canvas,onFailure]);
  return null;
}

export default function HaiYinCanvas({onFailure,reset}:{onFailure:()=>void;reset:number}) {
  const [ready,setReady]=useState(false);
  const onReady=useCallback(()=>setReady(true),[]);
  return <div className="canvas-wrap" aria-label="海银一号舵叶 3D 外形包络">
    <Canvas frameloop="demand" dpr={[1,1.5]} shadows={false}
      camera={{position:[3.3,2.8,3.6],fov:40,near:.02,far:50}}
      gl={{antialias:true,powerPreference:"low-power"}}>
      <ambientLight intensity={1.6}/>
      <directionalLight position={[3,5,4]} intensity={3}/>
      <Rudder onFailure={onFailure} onReady={onReady}/>
      <Controls reset={reset}/>
      <ContextLoss onFailure={onFailure}/>
      <gridHelper args={[4,8,"#73969b","#35565e"]}/>
    </Canvas>
    {!ready && <div className="viewer-loading" role="status">正在加载舵叶 GLB…</div>}
  </div>;
}
