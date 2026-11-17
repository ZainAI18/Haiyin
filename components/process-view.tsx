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
  const lastStage = data.stages.length - 1;
  const item = data.stages[stage];
  useEffect(() => {
    if (!auto) return;
    const timeout = window.setTimeout(() => {
      const next = stage + 1;
      setStage(next);
      if (next === lastStage) setAuto(false);
    }, 3800);
    return () => window.clearTimeout(timeout);
  }, [stage, auto, lastStage]);
  const jump = (i:number) => { setAuto(false); setStage(i); };
  const togglePlayback = () => {
    if (auto) {
      setAuto(false);
      return;
    }
    const next = stage === lastStage ? 0 : stage + 1;
    setStage(next);
    setAuto(next < lastStage);
  };
  return <>
    <div className="page-heading"><p className="eyebrow">03 / Docking process scenes</p><h1>{data.title}<span>.</span></h1><p>{data.caption} <span lang="zh-Hans">{data.zh}</span></p></div>
    <nav className="filters scene-tabs" aria-label="Docking methods">{sceneIds.map(id=><Link key={id} aria-current={id===scene ? "page" : undefined} href={"/scenes/" + id}>{scenes[id].title}</Link>)}</nav>
    <div className="process-layout">
      <section className="card station"><div className="station-title"><h2>{data.title} sequence</h2><span>STEP 0{stage+1} / 0{data.stages.length}</span></div>
        <Viewer scene={scene} stage={stage}/>
        <div className="process-controls">
          <button disabled={stage===0} onClick={()=>jump(stage-1)}><ArrowLeft size={16}/> Previous</button>
          <button onClick={togglePlayback}>{auto?<Pause size={16}/>:<Play size={16}/>} {auto?"Pause":"Play stages"}</button>
          <button disabled={stage===lastStage} onClick={()=>jump(stage+1)}>Next <ArrowRight size={16}/></button>
        </div>
        <p className="inline-note" role="status"><strong>{item.name}</strong> <span lang="zh-Hans">{item.zh}</span>
          {scene === "dry-dock" && stage === lastStage && <span> · Marked areas: hull, rudder, and propeller</span>}
        </p>
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
