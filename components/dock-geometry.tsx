import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, MathUtils, Mesh } from "three";
import type { SceneId } from "@/lib/domain";
import { BoxPiece, SchematicShip } from "./schematic-ship";

const frames: Record<SceneId,{ship:number[];water:number[];platform:number[];x:number[];gate:number[]}> = {
  "dry-dock": {ship:[.15,-.63,-1.33,-1.33],water:[.55,-.46,-3.69,-3.69],platform:[0,0,0,0],x:[0,0,0,0],gate:[-5.08,-1.46,-1.46,-1.46]},
  "floating-dock": {ship:[.15,.15,1.03,2.11],water:[.52,.52,.52,.52],platform:[-1.55,-1.55,-.05,1.03],x:[9.6,0,0,0],gate:[0,0,0,0]},
  "synchrolift": {ship:[.15,.15,1.45,1.45],water:[.52,.52,.52,.52],platform:[-1.55,-1.55,.62,.62],x:[-8,0,0,10.2],gate:[0,0,0,0]},
};
const blocks = [-6,-4,-2,0,2,4,6];
const sides = [-1,1];
const winches = [-7,-2.4,2.4,7];
function Blocks({ y }: {y:number}) {
  return <group>{blocks.map(x => <group key={x}>
    <BoxPiece p={[x,y,0]} s={[.8,.32,.85]} color="#8d8070"/>
    <BoxPiece p={[x,y+.23,0]} s={[.73,.15,.7]} color="#bf9c6b"/>
    {sides.map(s => <BoxPiece key={s} p={[x,y,s*1.19]} s={[.74,.37,.47]} color="#9d917e"/>)}
  </group>)}</group>;
}
function slide(object: Group | Mesh | null, axis: "y" | "x", goal: number, dt:number) {
  if (!object) return false;
  const v = object.position[axis];
  if (Math.abs(v-goal) < .007) { object.position[axis]=goal; return false; }
  object.position[axis]=MathUtils.damp(v,goal,3.9,dt);
  return true;
}
export function DockGeometry({scene,stage,reduced}: {scene:SceneId;stage:number;reduced:boolean}) {
  const ship=useRef<Group>(null), platform=useRef<Group>(null), water=useRef<Mesh>(null), gate=useRef<Group>(null);
  const cords=useRef<Group>(null);
  const invalidate=useThree(s=>s.invalidate);
  const state=frames[scene];
  const initial = useRef([state.x[stage],state.ship[stage],state.water[stage],state.platform[stage],state.gate[stage]]);
  useEffect(()=>invalidate(),[stage,invalidate]);
  useFrame((_,delta)=>{
    const dt=reduced ? 10 : Math.min(delta,.06);
    const motion = [
      slide(ship.current,"y",state.ship[stage],dt),slide(ship.current,"x",state.x[stage],dt),
      slide(water.current,"y",state.water[stage],dt),slide(platform.current,"y",state.platform[stage],dt),
      slide(gate.current,"y",state.gate[stage],dt),
    ];
    if (cords.current && platform.current) {
      const lower=platform.current.position.y-.69;
      cords.current.children.forEach(c=>{c.position.y=(lower+2.37)/2;c.scale.y=2.37-lower;});
    }
    if (!reduced && motion.some(Boolean)) invalidate();
  });
  return <>
    {scene === "dry-dock" ? <>
      <BoxPiece p={[0,-3.84,0]} s={[24,.46,10.6]} color="#405762"/>
      <BoxPiece p={[0,-1.43,-4.76]} s={[24,4.36,.62]} color="#536972"/>
      <BoxPiece p={[0,.75,-4.76]} s={[24,.16,.80]} color="#9b9b87"/>
      {stage < 2 ? <>
        <BoxPiece p={[0,-1.43,4.76]} s={[24,4.36,.62]} color="#536972"/>
        <BoxPiece p={[0,.75,4.76]} s={[24,.16,.80]} color="#9b9b87"/>
      </> : <BoxPiece p={[0,-3.41,4.76]} s={[24,.40,.62]} color="#536972"/>}
      <BoxPiece p={[-11.69,-1.43,0]} s={[.62,4.36,9.4]} color="#536972"/>
      <group ref={gate} position={[11.65,initial.current[4],0]}><BoxPiece p={[0,0,0]} s={[.43,4.29,9.45]} color="#a16e50"/></group>
      {blocks.map(x=><BoxPiece key={x} p={[x,-3.39,0]} s={[1.02,.44,1.08]} color="#6c665e"/>)}
      <Blocks y={-2.925}/>
    </> : scene === "floating-dock" ? <>
      <group ref={platform} position={[0,initial.current[3],0]}>
        <BoxPiece p={[0,-.91,0]} s={[23,.43,9.25]} color="#4d6771"/>
        {sides.map(s=><group key={s}>
          <BoxPiece p={[0,-.02,s*4.56]} s={[23,2.20,.64]} color="#586f77"/>
          <BoxPiece p={[0,1.11,s*4.56]} s={[23,.11,.75]} color="#bc9468"/>
        </group>)}
        <Blocks y={-.51}/>
      </group>
    </> : <>
      {sides.map(s=><group key={s}>
        <BoxPiece p={[3.5,-.62,s*4.51]} s={[26,2.2,.99]} color="#58707c"/>
        {winches.map(x=><group key={x}><BoxPiece p={[x,1.42,s*4.24]} s={[.57,2.08,.63]} color="#648490"/>
          <BoxPiece p={[x,2.43,s*3.94]} s={[.62,.24,1.08]} color="#bb996a"/></group>)}
      </group>)}
      <group ref={cords}>{sides.flatMap(s=>winches.map(x=><mesh key={x+":"+s} position={[x,0,s*3.65]}><cylinderGeometry args={[.025,.025,1,7]}/><meshStandardMaterial color="#ddbe86"/></mesh>))}</group>
      <group ref={platform} position={[0,initial.current[3],0]}>
        <BoxPiece p={[0,-.89,0]} s={[17.7,.39,7.62]} color="#5e7d88"/>
        {sides.map(s=><BoxPiece key={s} p={[0,-.64,s*2.25]} s={[17.68,.13,.10]} color="#b18c61"/>)}
      </group>
      <BoxPiece p={[13.1,.24,0]} s={[8.5,.56,8.7]} color="#687b82"/>
      {sides.map(s=><BoxPiece key={s} p={[13.1,.58,s*2.25]} s={[8.51,.13,.10]} color="#b18c61"/>)}
    </>}
    <group ref={ship} position={[initial.current[0],initial.current[1],0]}>
      {scene==="synchrolift" && <group position={[0,-1.65,0]}>
        <BoxPiece p={[0,-.05,0]} s={[14.9,.10,4.6]} color="#7d6b54"/><Blocks y={.10}/>
      </group>}
      <SchematicShip simplified/>
    </group>
    <mesh ref={water} position={[scene==="dry-dock" ? 0 : 1,initial.current[2],0]} rotation={[-Math.PI/2,0,0]} renderOrder={4}>
      <planeGeometry args={scene==="dry-dock" ? [22.8,8.9] : [46,27]}/>
      <meshStandardMaterial color="#2c8ca9" transparent opacity={.35} depthWrite={false} side={2} roughness={.35}/>
    </mesh>
  </>;
}
