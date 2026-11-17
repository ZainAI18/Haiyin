"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Play, Pause } from "lucide-react";
import { sceneIds, type SceneId } from "@/lib/domain";
import { scenes } from "@/components/scene-data";
import { Viewer } from "@/components/viewer";

export function ProcessView({ scene }: {scene:SceneId}) {
  const [stage, setStage] = useState(0);
  const [auto, setAuto] = useState(false);
  const data = scenes[scene];
  const item = data.stages[stage];
  useEffect(() => {
    if (!auto) return;
    const timeout = window.setTimeout(() => {
      if (stage === data.stages.length - 1) setAuto(false);
      else setStage(stage + 1);
    }, 3800);
    return () => window.clearTimeout(timeout);
  }, [stage,auto,data.stages.length]);
  const jump = (i:number) => { setAuto(false); setStage(i); };
  return <>
    <div className="page-heading"><p className="eyebrow">03 / Docking process scenes</p><h1>{data.title}<span>.</span></h1><p>{data.caption} <span lang="zh-Hans">{data.zh}</span></p></div>
    <nav className="filters scene-tabs" aria-label="Docking methods">{sceneIds.map(id=><Link key={id} aria-current={id===scene ? "page" : undefined} href={"/scenes/" + id}>{scenes[id].title}</Link>)}</nav>
    <div className="process-layout">
      <section className="card station"><div className="station-title"><h2>{data.title} sequence</h2><span>STEP 0{stage+1} / 0{data.stages.length}</span></div>
        <Viewer scene={scene} stage={stage}/>
        <div className="process-controls">
          <button disabled={stage===0} onClick={()=>jump(stage-1)}><ArrowLeft size={16}/> Previous</button>
          <button onClick={()=> {if (!auto && stage===data.stages.length-1) setStage(0); setAuto(v=>!v);}}>{auto?<Pause size={16}/>:<Play size={16}/>} {auto?"Pause":"Play stages"}</button>
          <button disabled={stage===data.stages.length-1} onClick={()=>jump(stage+1)}>Next <ArrowRight size={16}/></button>
        </div>
      </section>
      <aside className="card detail">
        <p className="eyebrow">Process log / 0{stage+1}</p>
        <article aria-live="polite"><h2>{item.name}</h2><p className="fine" lang="zh-Hans">{item.zh}</p><p>{item.summary}</p><p className="fine">{item.note}</p></article>
        <ol className="steps">{data.stages.map((s,i)=><li key={s.name}><button aria-current={stage===i?"step":undefined} onClick={()=>jump(i)}><span>0{i+1}</span>{s.name}</button></li>)}</ol>
        <p className="fine">Docking Survey Study Notes · EN p. 2 · CN p. 2. Intermediate states illustrate the principle.</p>
      </aside>
    </div>
  </>;
}
