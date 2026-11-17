"use client";
import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useState, type ReactNode } from "react";
import { Box, Crosshair, Image, RotateCcw } from "lucide-react";
import modelFile from "@/data/ship-model.json";
import { Diagram } from "./diagram";
import type { ModelManifest, ViewerProps } from "./visual-types";

const CanvasView = dynamic(() => import("./canvas-view"), { ssr: false, loading: () => <div className="viewer-loading" role="status">Loading 3D viewer…</div> });
const model = modelFile.production as ModelManifest | null;

class ViewerBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function Viewer({ onOverview, ...props }: ViewerProps & { onOverview?: () => void }) {
  const { scene, target, overlay, stage, onPick } = props;
  const [capable, setCapable] = useState<boolean>();
  const [failed3D, setFailed3D] = useState(false);
  const [twoD, setTwoD] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [revision, setRevision] = useState(0);
  const [modelState, setModelState] = useState<"pending" | "ready" | "fallback">("pending");
  const report3DFailure = useCallback(() => setFailed3D(true), []);
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
  const staticView = twoD || capable !== true || failed3D;
  const activeTarget = showOverview ? undefined : target;
  const activeOverlay = activeTarget ? overlay : undefined;
  const diagram = <Diagram scene={scene} target={activeTarget} overlay={activeOverlay} stage={stage} onPick={onPick}/>;
  const viewStatus = capable === false ? "3D unavailable · showing diagram"
    : failed3D ? "3D interrupted · showing diagram"
    : capable === undefined ? "Preparing 3D · showing diagram"
    : twoD ? "2D profile diagram"
    : "Drag to orbit · Scroll or pinch to zoom";
  const assetLabel = !scene && model && modelState === "ready" && !staticView ? model.title : "Schematic · not to scale";
  const resetOverview = () => {
    if (onOverview) onOverview();
    else setShowOverview(true);
    setRevision(n => n + 1);
  };
  const switchView = () => {
    if (failed3D) {
      setFailed3D(false);
      setTwoD(false);
    } else {
      setTwoD(v => !v);
    }
    setModelState("pending");
  };
  return <div className="viewer">
    <div className="viewport">
      <div className="viewport-top"><span><span className="status-dot"/> {scene ? "PROCESS VIEW" : "VESSEL VIEW"}</span><span>{assetLabel}</span></div>
      {staticView ? diagram : <ViewerBoundary fallback={diagram} onFailure={report3DFailure}>
          <CanvasView {...props} target={activeTarget} overlay={activeOverlay} reset={(props.reset ?? 0) + revision} model={scene ? null : model}
            onModelState={setModelState} onContextLost={report3DFailure}/>
        </ViewerBoundary>}
      {!staticView && capable && !scene && model && modelState === "pending" && <span className="viewport-note" role="status">Loading detailed model · showing schematic</span>}
      {!staticView && capable && !scene && model && modelState === "fallback" && <span className="viewport-note" role="status">Detailed model unavailable · showing schematic</span>}
      <div className="viewport-toolbar" aria-label="View controls">
        {target && showOverview
          ? <button type="button" onClick={() => setShowOverview(false)}><Crosshair size={16}/> Focus part</button>
          : (!staticView || activeTarget) && <button type="button" onClick={resetOverview}><RotateCcw size={16}/> Overview</button>}
        {capable === true && <button type="button" onClick={switchView}>{staticView ? <Box size={16}/> : <Image size={16}/>} {failed3D ? "Retry 3D" : twoD ? "3D" : "2D"}</button>}
      </div>
    </div>
    <div className="viewer-caption"><span role="status">{viewStatus}</span><span>{activeTarget ? "Focused / " + activeTarget.replaceAll("-", " ") : "Overview"}</span></div>
    {model && !scene && modelState === "ready" && !staticView && <p className="fine"><a className="underline" href={model.source}>{model.title}</a> · {model.author} · {model.license}</p>}
  </div>;
}
