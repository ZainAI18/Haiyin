"use client";
import type {RefObject} from "react";
import type {MoveDirection} from "@/lib/hai-yin-navigation";
import type {WalkAPI,WalkState} from "@/lib/hai-yin-walk-controller";
import interior from "@/public/hai-yin-i/geometry/interior-layout.json";
export function HaiYinWalkPanel({api,state,onExit}:{api:RefObject<WalkAPI|undefined>;state:WalkState;onExit:()=>void}){
  function direction(dir:MoveDirection,label:string){return <button type="button" aria-label={label} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);api.current?.hold(dir,true);}} onPointerUp={()=>api.current?.hold(dir,false)} onPointerCancel={()=>api.current?.hold(dir,false)} onLostPointerCapture={()=>api.current?.hold(dir,false)} onKeyDown={e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();api.current?.hold(dir,true,false);}}} onKeyUp={()=>api.current?.hold(dir,false)} onBlur={()=>api.current?.hold(dir,false)}>{label}</button>;}
  return <div className="hyi-walk-panel">
    <div className="hyi-walk-location" role="status"><strong>{interior.zones[state.zone].name_cn}</strong><span>{state.room}</span></div>
    <p>拖动画面环视 360°。先点画面，再用方向键 / WASD 前后左右移动，Q / E 转向；手机可长按下方按钮。</p>
    <div className="hyi-walk-actions"><div className="hyi-dpad">{direction("forward","↑ 前进")}<div>{direction("left","← 左移")}{direction("back","↓ 后退")}{direction("right","→ 右移")}</div></div><div className="hyi-turn">{direction("turnLeft","↶ 左转")}{direction("turnRight","右转 ↷")}</div>
      {state.zone!=="engine"&&<button type="button" onClick={()=>api.current?.stairs()}>{state.zone==="main"?"去楼梯上楼":"去楼梯下楼"}</button>}
      <button type="button" onClick={onExit}>退出第一视角</button>
    </div>
    {state.zone!=="engine"&&<p className="fine">到楼梯后向前走即可{state.zone==="main"?"上楼":"下楼"}。也可用上方一层 / 二层按钮直接切换。</p>}
    <label className="hyi-room-select">定位房间（虚拟入口）<select value="" onChange={e=>{const r=interior.rooms.find(r=>r.id===e.target.value);if(r)api.current?.enter(state.zone,r.id);}}><option value="">选择房间查看内部…</option>{interior.rooms.filter(r=>r.zone===state.zone).map(r=><option key={r.id} value={r.id}>{r.name_cn}</option>)}</select></label>
    <small>虚拟定位可进入外门独立房间，不表示真实连通或逃生路线。门槛自动跨越，楼梯踏步与家具高度简化。</small>
  </div>;
}
