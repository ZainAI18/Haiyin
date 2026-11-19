import {PerspectiveCamera,type Camera} from "three";
import {movePosition,roomName,spawnPosition,stairLanding,type MoveDirection,type WalkLayout,type WalkPosition,type WalkZone} from "./hai-yin-navigation";
export type WalkState={zone:WalkZone;room:string;onStair:boolean};
export type WalkAPI={enter:(zone:WalkZone,room?:string)=>void;exit:()=>void;hold:(direction:MoveDirection,pressed:boolean,focusCanvas?:boolean)=>void;look:(dx:number,dy:number)=>void;stairs:()=>void;tick:(delta:number)=>boolean;dispose:()=>void;active:()=>boolean};
export function createWalkController(camera:Camera,canvas:HTMLCanvasElement,data:WalkLayout,invalidate:()=>void,onState:(s:WalkState)=>void):WalkAPI{
  let active=false,p:WalkPosition=spawnPosition(data,"main"),yaw=-Math.PI/2,pitch=0,lastState="",drag:{id:number;x:number;y:number}|undefined;
  const held=new Set<MoveDirection>(),keys=new Set<MoveDirection>();
  const keyMap:Record<string,MoveDirection>={ArrowUp:"forward",KeyW:"forward",ArrowDown:"back",KeyS:"back",ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right",KeyQ:"turnLeft",KeyE:"turnRight"};
  canvas.tabIndex=0;canvas.style.touchAction="none";
  function update(){camera.up.set(0,1,0);camera.position.set(p.x,p.floor+data.eye_height_m,p.z);camera.rotation.set(pitch,yaw,0,"YXZ");camera.updateMatrixWorld();canvas.dataset.walkZone=p.zone;canvas.dataset.walkPosition=JSON.stringify([p.x,p.floor,p.z]);canvas.dataset.walkYaw=String(yaw);canvas.dataset.walkPitch=String(pitch);
    const state={zone:p.zone,room:roomName(data,p),onStair:p.onStair},key=JSON.stringify(state);if(key!==lastState){lastState=key;onState(state);}invalidate();
  }
  const clear=()=>{held.clear();keys.clear();drag=undefined;};
  const editing=(event:KeyboardEvent)=>event.target instanceof HTMLElement&&!!event.target.closest("input,select,textarea,[contenteditable=true]");
  const keydown=(event:KeyboardEvent)=>{if(!active||editing(event)||document.activeElement!==canvas)return;const direction=keyMap[event.code];if(direction){event.preventDefault();keys.add(direction);invalidate();}};
  const keyup=(event:KeyboardEvent)=>{const direction=keyMap[event.code];if(direction){if(active&&document.activeElement===canvas)event.preventDefault();keys.delete(direction);}};
  const down=(event:PointerEvent)=>{if(!active||event.button!==0)return;canvas.focus({preventScroll:true});drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);};
  const move=(event:PointerEvent)=>{if(!active||!drag||drag.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;drag.x=event.clientX;drag.y=event.clientY;api.look(dx,dy);};
  const up=()=>{drag=undefined;};
  const visibility=()=>{clear();};
  canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);canvas.addEventListener("lostpointercapture",up);canvas.addEventListener("blur",clear);window.addEventListener("keydown",keydown);window.addEventListener("keyup",keyup);window.addEventListener("blur",clear);document.addEventListener("visibilitychange",visibility);
  const api:WalkAPI={
    enter(zone,room){clear();active=true;if(camera instanceof PerspectiveCamera){camera.fov=65;camera.updateProjectionMatrix();}p=spawnPosition(data,zone,room);const r=data.rooms.find(r=>r.id===room&&r.zone===zone);yaw=(r?.spawn??data.zones[zone].spawn)[2]??-Math.PI/2;pitch=-.20;lastState="";canvas.dataset.walkActive="true";canvas.focus({preventScroll:true});update();},
    exit(){clear();active=false;if(camera instanceof PerspectiveCamera){camera.fov=40;camera.updateProjectionMatrix();}delete canvas.dataset.walkActive;invalidate();},
    hold(direction,pressed,focusCanvas=true){if(!active)return;if(pressed){if(focusCanvas)canvas.focus({preventScroll:true});held.add(direction);invalidate();}else held.delete(direction);},
    look(dx,dy){if(!active)return;yaw-=dx*.004;pitch=Math.max(-1.45,Math.min(1.45,pitch-dy*.004));update();},
    stairs(){if(!active||p.zone==="engine")return;p=stairLanding(data,p.zone);yaw=p.zone==="main"?Math.PI:0;pitch=0;canvas.focus({preventScroll:true});update();},
    tick(delta){if(!active)return false;const directions=new Set([...held,...keys]);if(!directions.size)return false;const dt=Math.min(.05,Math.max(0,delta));const turn=Number(directions.has("turnLeft"))-Number(directions.has("turnRight"));yaw+=turn*1.25*dt;
      let f=Number(directions.has("forward"))-Number(directions.has("back")),r=Number(directions.has("right"))-Number(directions.has("left"));const length=Math.hypot(f,r)||1;f/=length;r/=length;const d=data.walk_speed_m_s*dt;p=movePosition(data,p,(-Math.sin(yaw)*f+Math.cos(yaw)*r)*d,(-Math.cos(yaw)*f-Math.sin(yaw)*r)*d);update();return true;},
    active:()=>active,
    dispose(){clear();active=false;canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",up);canvas.removeEventListener("lostpointercapture",up);canvas.removeEventListener("blur",clear);window.removeEventListener("keydown",keydown);window.removeEventListener("keyup",keyup);window.removeEventListener("blur",clear);document.removeEventListener("visibilitychange",visibility);delete canvas.dataset.walkActive;},
  };return api;
}
