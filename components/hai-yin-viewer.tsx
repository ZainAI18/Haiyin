"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useState, type ReactNode } from "react";

const RudderCanvas = dynamic(() => import("./hai-yin-canvas"), {
  ssr:false, loading:() => <div className="viewer-loading" role="status">正在加载 3D 查看器…</div>,
});

class ModelBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

const profile = <div className="reconstruction-profile">
  {/* A local, source-derived SVG doubles as the no-WebGL fallback. */}
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src="/hai-yin-i/geometry/rudder-profile.svg" alt="海银一号舵叶原图矢量轮廓，弦长 1.400 米，高度 2.080 米。" width={1120} height={350}/>
</div>;

export function HaiYinViewer() {
  const [mode,setMode]=useState<"profile"|"model"|"unsupported">("profile");
  const [reset,setReset]=useState(0);
  const reportFailure=useCallback(() => setMode("unsupported"),[]);
  function openModel() {
    try {
      const canvas=document.createElement("canvas");
      const context=canvas.getContext("webgl2",{failIfMajorPerformanceCaveat:true});
      if (!context) { setMode("unsupported"); return; }
      context.getExtension("WEBGL_lose_context")?.loseContext();
      setMode("model");
    } catch { setMode("unsupported"); }
  }
  return <div className="viewer">
    <div className="viewport">
      <div className="viewport-top"><span>HAI YIN I · RUDDER</span><span>1 UNIT = 1 METRE</span></div>
      {mode==="model" ? <ModelBoundary fallback={profile}>
        <RudderCanvas reset={reset} onFailure={reportFailure}/>
      </ModelBoundary> : profile}
      <div className="viewport-toolbar" aria-label="舵叶查看器控制">
        {mode==="model" ? <>
          <button type="button" onClick={() => setReset(n=>n+1)}>复位视角</button>
          <button type="button" onClick={() => setMode("profile")}>二维轮廓</button>
        </> : <button type="button" onClick={openModel}>{mode==="unsupported" ? "重试 3D" : "查看 3D 舵叶"}</button>}
      </div>
    </div>
    <div className="viewer-caption" role="status">
      <span>{mode==="unsupported" ? "3D 不可用，显示有尺寸的二维轮廓" : mode==="model" ? "拖动旋转 · 滚轮/双指缩放" : "按需加载 3D · 当前显示原图轮廓"}</span>
      <span>外形包络 · 部件未完成</span>
    </div>
  </div>;
}
