"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import { Box, Image, RotateCcw } from "lucide-react";
import modelFile from "@/data/ship-model.json";
import { Diagram } from "./diagram";
import type { ModelManifest, ViewerProps } from "./visual-types";

const CanvasView = dynamic(() => import("./canvas-view"), { ssr: false, loading: () => <div className="viewer-loading" role="status">Loading 3D viewer…</div> });
const model = modelFile.production as ModelManifest | null;

class ViewerBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function Viewer(props: ViewerProps) {
  const { scene, target, overlay, stage, onPick } = props;
  const [capable, setCapable] = useState<boolean>();
  const [contextLost, setContextLost] = useState(false);
  const [twoD, setTwoD] = useState(false);
  const [revision, setRevision] = useState(0);
  const [modelState, setModelState] = useState<"pending" | "ready" | "fallback">("pending");
  useEffect(() => {
    const canvas = document.createElement("canvas");
    let supported = false;
    try {
      const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
      supported = Boolean(gl);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch { /* the diagram is the fallback */ }
    setCapable(supported);
  }, []);
  const diagram = (notice: string) => <><Diagram scene={scene} target={target} overlay={overlay} stage={stage} onPick={onPick}/><span className="viewport-note">{notice}</span></>;
  const staticView = twoD || capable === false || contextLost;
  const assetLabel = !scene && model && modelState === "ready" && !staticView ? model.title : "Schematic · not to scale";
  return <div className="viewer">
    <div className="viewport">
      <div className="viewport-top"><span><span className="status-dot"/> {scene ? "PROCESS VIEW" : "VESSEL VIEW"}</span><span>{assetLabel}</span></div>
      {staticView ? diagram(twoD ? "2D diagram" : "3D unavailable · showing diagram") : capable === undefined
        ? <div className="viewer-loading" role="status">Preparing diagram and 3D view…</div>
        : <ViewerBoundary fallback={diagram("3D could not load · showing diagram")}>
          <CanvasView {...props} reset={(props.reset ?? 0) + revision} model={scene ? null : model}
            onModelState={setModelState} onContextLost={() => setContextLost(true)}/>
        </ViewerBoundary>}
      {!staticView && capable && !scene && model && modelState === "pending" && <span className="viewport-note" role="status">Loading detailed model · showing schematic</span>}
      {!staticView && capable && !scene && model && modelState === "fallback" && <span className="viewport-note" role="status">Detailed model unavailable · showing schematic</span>}
      <div className="viewport-toolbar" aria-label="View controls">
        <button type="button" onClick={() => setRevision(n => n + 1)} disabled={staticView || !capable} title="Recenter view" aria-label="Recenter view"><RotateCcw size={17}/></button>
        <button type="button" disabled={capable === false || contextLost} className={twoD ? "active" : ""} onClick={() => { setTwoD(v => !v); setModelState("pending"); }}>{twoD ? <Box size={16}/> : <Image size={16}/>} {twoD ? "3D" : "2D"}</button>
      </div>
    </div>
    <div className="viewer-caption"><span>{staticView ? "Profile view · labeled inspection areas" : "Drag to orbit · Scroll or pinch to zoom"}</span><span>{target ? "Focused / " + target.replaceAll("-", " ") : "Perspective / exterior"}</span></div>
    {model && !scene && modelState === "ready" && !staticView && <p className="fine"><a className="underline" href={model.source}>{model.title}</a> · {model.author} · {model.license}</p>}
  </div>;
}
