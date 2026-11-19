export type WalkZone="main"|"upper"|"engine";
export type Rect=readonly number[];
export type WalkLayout={eye_height_m:number;body_radius_m:number;walk_speed_m_s:number;zones:Record<WalkZone,{name_cn:string;floor:number;bounds:Rect;spawn:number[]}>;rooms:{id:string;name_cn:string;zone:string;rect:Rect;spawn:number[]}[];blockers:{id:string;zone:string;rect:Rect}[];stair:{rect:Rect;lower_floor:number;upper_floor:number;landing_x:number}};
export type WalkPosition={x:number;z:number;floor:number;zone:WalkZone;onStair:boolean};
export type MoveDirection="forward"|"back"|"left"|"right"|"turnLeft"|"turnRight";
function inside(x:number,z:number,r:Rect,pad=0){return x>r[0]-pad&&x<r[1]+pad&&z>r[2]-pad&&z<r[3]+pad;}
export function spawnPosition(data:WalkLayout,zone:WalkZone,roomId?:string):WalkPosition{
  const room=data.rooms.find(r=>r.id===roomId&&r.zone===zone),p=room?.spawn??data.zones[zone].spawn;
  return {x:p[0],z:p[1],zone,floor:data.zones[zone].floor,onStair:false};
}
export function canStand(data:WalkLayout,p:WalkPosition,x=p.x,z=p.z){
  const r=data.zones[p.zone].bounds,b=data.body_radius_m;
  if(x<r[0]+b||x>r[1]-b||z<r[2]+b||z>r[3]-b)return false;
  if(p.onStair&&!inside(x,z,data.stair.rect,-.04))return false;
  return !data.blockers.some(w=>w.zone===p.zone&&inside(x,z,w.rect,b));
}
export function roomName(data:WalkLayout,p:WalkPosition){if(p.onStair)return "内楼梯 · 两层之间";return data.rooms.find(r=>r.zone===p.zone&&inside(p.x,p.z,r.rect))?.name_cn??(p.zone==="engine"?"机舱通道":"生活区走廊 / 楼梯入口");}
export function stairLanding(data:WalkLayout,zone:WalkZone):WalkPosition{
  if(zone==="engine")return spawnPosition(data,zone);
  return {x:data.stair.landing_x,z:zone==="main"?data.stair.rect[2]-.22:data.stair.rect[3]+.22,zone,floor:data.zones[zone].floor,onStair:false};
}
export function movePosition(data:WalkLayout,start:WalkPosition,dx:number,dz:number):WalkPosition{
  let p={...start};const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.04));
  const stair=data.stair.rect;
  function step(x:number,z:number){
    let next={...p};
    if(p.zone!=="engine"){
      const inWidth=x>stair[0]+data.body_radius_m&&x<stair[1]-data.body_radius_m;
      if(!p.onStair&&inWidth&&z>=stair[2]&&z<=stair[3]){
        // A stair can only be entered at its two landings, never from the side or through a floor.
        if(p.zone==="main"&&p.z<stair[2]+.06||p.zone==="upper"&&p.z>stair[3]-.06)next.onStair=true;else return;
      }
      if(p.onStair){
        if(!inWidth)return;
        if(z<stair[2]){next.onStair=false;next.zone="main";next.floor=data.stair.lower_floor;}
        else if(z>stair[3]){next.onStair=false;next.zone="upper";next.floor=data.stair.upper_floor;}
      }
      if(next.onStair){next.x=x;next.z=z;next.floor=data.stair.lower_floor+(z-stair[2])/(stair[3]-stair[2])*(data.stair.upper_floor-data.stair.lower_floor);p=next;return;}
    }
    if(canStand(data,next,x,z)){next.x=x;next.z=z;p=next;}
  }
  for(let i=0;i<steps;i++){step(p.x+dx/steps,p.z);step(p.x,p.z+dz/steps);}return p;
}
