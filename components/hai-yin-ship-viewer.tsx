"use client";
import dynamic from "next/dynamic";
import {Component,useCallback,useEffect,useState,type ReactNode} from "react";
import assembly from "@/public/hai-yin-i/geometry/ship-assembly.json";
import type {ShipPreset,ShipTarget} from "@/lib/hai-yin-scene";
const ShipCanvas=dynamic(()=>import("./hai-yin-ship-canvas"),{ssr:false,loading:()=> <div className="viewer-loading" role="status">正在加载三维查看器…</div>});
const targets:ShipTarget[]=assembly.targets;
class Boundary extends Component<{children:ReactNode;fallback:ReactNode;onFailure:()=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true};}componentDidCatch(){this.props.onFailure();}render(){return this.state.failed?this.props.fallback:this.props.children;}}
export function HaiYinShipViewer(){
  const [capable,setCapable]=useState<boolean>(),[twoD,setTwoD]=useState(false),[failed,setFailed]=useState(false);
  const [preset,setPreset]=useState<ShipPreset>("exterior"),[selected,setSelected]=useState<string>(),[view,setView]=useState("reset"),[reset,setReset]=useState(0);
  const failure=useCallback(()=>setFailed(true),[]);
  useEffect(()=>{let supported=false;try{const gl=document.createElement("canvas").getContext("webgl2",{failIfMajorPerformanceCaveat:true});supported=!!gl;gl?.getExtension("WEBGL_lose_context")?.loseContext();}catch{}setCapable(supported);},[]);
  const choose=useCallback((id:string)=>{const target=targets.find(t=>t.id===id);if(!target)return;setSelected(id);setView("reset");setPreset(target.layer==="machinery"?"engine":["cargo","ballast"].includes(target.layer)?"cargo":"exterior");},[]);
  const target=targets.find(t=>t.id===selected);
  const fallback=<div className="reconstruction-profile">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/hai-yin-i/geometry/ship-overview.svg" width={1120} height={500} alt="Hai Yin I 独立整船二维布置：艉楼、双机、八个货油舱与艏楼。"/></div>;
  const staticView=capable!==true||twoD||failed;
  const apply=(p:ShipPreset)=>{setPreset(p);setSelected(p==="cargo"?"hyi_cargo_tanks":p==="engine"?"hyi_engine_room":undefined);setView("reset");setReset(n=>n+1);};
  return <div className="viewer hyi-ship-viewer">
    <div className="hyi-presets" aria-label="Hai Yin I 查看模式">{([["exterior","整船外观"],["xray","透视全船"],["cargo","货油舱"],["engine","机舱"]] as const).map(([id,label])=><button type="button" key={id} aria-pressed={preset===id} onClick={()=>apply(id)}>{label}</button>)}</div>
    <div className="viewport"><div className="viewport-top"><span>MT HAI YIN I · 独立船舶</span><span>49.90 × 9.80 m · 米制</span></div>
      {staticView?fallback:<Boundary fallback={fallback} onFailure={failure}><ShipCanvas preset={preset} selected={selected} view={view} reset={reset} onPick={choose} onFailure={failure}/></Boundary>}
      <div className="viewport-toolbar"><button type="button" onClick={()=>apply("exterior")}>全船复位</button>{capable&&<button type="button" onClick={()=>{setTwoD(!twoD);setFailed(false);}}>{staticView?"打开 3D":"二维布置"}</button>}</div>
    </div>
    <div className="viewer-caption" role="status"><span>{staticView?"二维布置 · 3D 暂未显示":"拖动旋转 · 点选部件聚焦 · 静止停止渲染"}</span><span>{target?.name_cn||"Hai Yin I 全船"}</span></div>
    <div className="hyi-focus-controls"><label>定位部件<select aria-label="定位 Hai Yin I 部件" value={selected||""} onChange={e=>{if(e.target.value)choose(e.target.value);else apply("exterior");}}><option value="">全船总览</option>{targets.map(t=><option key={t.id} value={t.id}>{t.name_cn}</option>)}</select></label><div className="quick-targets">{[["reset","立体"],["front","左舷"],["side","艏视"],["top","俯视"]].map(([id,label])=><button type="button" key={id} disabled={staticView} onClick={()=>{setView(id);setReset(n=>n+1);}}>{label}</button>)}</div></div>
    <div className="hyi-selection"><strong>{target?.name_cn||"整船装配已建立 · 细节继续核对"}</strong><p>{target?.note_cn||assembly.scope_cn}</p>{target&&<small>来源：{target.sources.map(s=>`${s.file} 第 ${s.page} 页`).join("；")}</small>}</div>
    <a className="primary" href="/hai-yin-i/models/hai-yin-i-visual-assembly.glb" download>下载 Hai Yin I 整船 GLB ↓</a>
  </div>;
}
