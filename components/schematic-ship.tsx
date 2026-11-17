import { memo, useMemo } from "react";
import { ExtrudeGeometry, Shape, Vector3 } from "three";
import type { ObjectId } from "@/lib/domain";

type Triple = [number,number,number];
const stations = [[-7.8,.36,-.45],[-7.1,1.18,-.75],[-6,1.52,-1.25],[-4,1.76,-1.29],[-1,1.8,-1.29],[3.4,1.77,-1.29],[5.6,1.37,-1.10],[7.3,.75,-.61],[8.1,.03,-.19]];
const ring = [[0,1],[.83,1],[1,.76],[.98,.46],[.80,.12],[.47,0],[-.47,0],[-.80,.12],[-.98,.46],[-1,.76],[-.83,1]];

function Hull() {
  const buffers = useMemo(() => {
    const vertices: number[] = [], indices: [number[],number[],number[]] = [[],[],[]];
    for (const [x,w,b] of stations) {
      const top = 1.02 + Math.max(0,x-5.5)*.09;
      for (const [d,h] of ring) vertices.push(x,b+(top-b)*h,w*d);
    }
    const n = ring.length;
    for (let i=0;i<stations.length-1;i++) for (let j=0;j<n;j++) {
      const k=(j+1)%n, a=i*n+j,b=i*n+k,c=(i+1)*n+j,d=(i+1)*n+k;
      indices[j===0 || j===n-1 ? 2 : j===1 || j===2 || j===8 || j===9 ? 1 : 0].push(a,b,c,b,d,c);
    }
    for (const end of [0,stations.length-1]) {
      const [x,,bottom]=stations[end];
      const cap=vertices.length/3; vertices.push(x,(bottom+1)/2,0);
      for (let j=0;j<n;j++) {
        const a=end*n+j,b=end*n+(j+1)%n;
        indices[j>=3 && j<=7 ? 0 : 1].push(...(end===0?[cap,b,a]:[cap,a,b]));
      }
    }
    return {pos:new Float32Array(vertices), index:new Uint16Array(indices.flat()), groups:indices.map(a => a.length)};
  }, []);
  return <mesh>
    <bufferGeometry onUpdate={g => { g.clearGroups(); let i=0; buffers.groups.forEach((n,m)=>{g.addGroup(i,n,m);i+=n;}); g.computeVertexNormals(); }}>
      <bufferAttribute attach="attributes-position" args={[buffers.pos,3]}/><bufferAttribute attach="index" args={[buffers.index,1]}/>
    </bufferGeometry>
    <meshStandardMaterial attach="material-0" color="#aa513c" roughness={.68} side={2}/>
    <meshStandardMaterial attach="material-1" color="#265069" roughness={.55} side={2}/>
    <meshStandardMaterial attach="material-2" color="#789194" roughness={.77} side={2}/>
  </mesh>;
}
export function BoxPiece({p,s,color}: {p:Triple;s:Triple;color:string}) {
  return <mesh position={p}><boxGeometry args={s}/><meshStandardMaterial color={color} roughness={.72}/></mesh>;
}
function Rod({a,b,r=.05,color="#b9c2b7"}:{a:Triple;b:Triple;r?:number;color?:string}) {
  const [center,rotation,length] = useMemo(() => {
    const from=new Vector3(...a), to=new Vector3(...b), delta=to.clone().sub(from);
    return [from.lerp(to,.5),delta.clone().normalize(),delta.length()] as const;
  },[a,b]);
  return <mesh position={center} onUpdate={m=>m.quaternion.setFromUnitVectors(new Vector3(0,1,0),rotation)}>
    <cylinderGeometry args={[r,r,length,9]}/><meshStandardMaterial color={color} roughness={.5}/>
  </mesh>;
}
const rudderShape = new Shape().moveTo(-.58,.71).lineTo(.53,.47).lineTo(.39,-.71).lineTo(-.48,-.76).lineTo(-.67,-.47).closePath();
const bladeShape = new Shape().moveTo(-.16,.12).quadraticCurveTo(-.67,.78,-.33,1.10).quadraticCurveTo(.2,1.05,.37,.7).quadraticCurveTo(.30,.43,.13,.14).closePath();
const bladeAngles = Array.from({length:4},(_,i)=>i*Math.PI/2);
const hatches = [-3.1,-.35,2.38,4.7];
const windows = [-6.68,-6.34,-6,-5.66,-5.32];
const railing = [-6.8,-4.6,-2.4,0,2.8,4.8,6.5];
const vents = Array.from({length:5},(_,i)=>i);
const port = [-1,1];
const object = (id: ObjectId) => ({ name: id, userData: { object: id } });

export const SchematicShip = memo(function SchematicShip({ simplified = false }: {simplified?: boolean}) {
  const rudder = useMemo(()=>new ExtrudeGeometry(rudderShape,{depth:.19,bevelEnabled:true,bevelThickness:.045,bevelSize:.052,bevelSegments:1}),[]);
  const blade = useMemo(()=>new ExtrudeGeometry(bladeShape,{depth:.09,bevelEnabled:true,bevelThickness:.027,bevelSize:.029,bevelSegments:1}),[]);
  return <group name="schematic-ship">
    <group {...object("hull")}><Hull/></group>
    <group {...object("deck")}>
      {hatches.map((x,i)=><group key={x}><BoxPiece p={[x,1.09,0]} s={[i===3?1.5:2.26,.20,i===3?1.44:2.45]} color="#aab6af"/>
        {!simplified && <BoxPiece p={[x,1.22,0]} s={[i===3?1.34:2.11,.07,i===3?1.29:2.31]} color="#5c7781"/>}</group>)}
      <BoxPiece p={[-6.06,1.62,0]} s={[2.18,1.16,2.52]} color="#ccd5ca"/>
      <BoxPiece p={[-6.14,2.34,0]} s={[1.76,.43,2.11]} color="#dce2d2"/>
      <BoxPiece p={[-6.17,2.59,0]} s={[1.88,.095,2.21]} color="#839d9e"/>
      {port.map(side=>windows.map(x=><BoxPiece key={x+":"+side} p={[x,2.37,side*1.06]} s={[.25,.19,.025]} color="#12374a"/>))}
      <BoxPiece p={[-5.19,2.55,0]} s={[.025,.20,1.51]} color="#153547"/>
      <BoxPiece p={[-7.0,2.58,0]} s={[.58,1.13,.59]} color="#b5704b"/>
      <BoxPiece p={[-7.0,3.16,0]} s={[.61,.20,.62]} color="#283943"/>
      <Rod a={[-5.9,2.55,0]} b={[-5.9,3.63,0]} r={.043}/>
      <Rod a={[-5.9,3.44,-.46]} b={[-5.9,3.44,.46]} r={.025}/>
      {!simplified && port.map(side=>railing.map((x,i)=>{
        const w=[1.20,1.67,1.75,1.77,1.74,1.52,.96][i]*side;
        return <Rod key={x+":"+side} a={[x,1.06,w]} b={[x,1.29,w]} r={.021}/>;
      }))}
    </group>
    <group {...object("bow")}><mesh position={[7.17,.083,0]} scale={[.92,.34,.37]}><sphereGeometry args={[1,18,12]}/><meshStandardMaterial color="#a9503b"/></mesh></group>
    <group {...object("stern")}><BoxPiece p={[-7.32,-.33,0]} s={[.80,.45,.39]} color="#914c3c"/></group>
    <group {...object("rudder")} position={[-7.89,-1.04,-.10]}>
      <mesh geometry={rudder}><meshStandardMaterial color="#b05c46" metalness={.1} roughness={.57}/></mesh>
    </group>
    <group {...object("rudder-stock")}><Rod a={[-7.70,-.5,0]} b={[-7.70,.24,0]} r={.14}/></group>
    <group {...object("shaft")}><Rod a={[-7.11,-1.22,0]} b={[-5.84,-1.22,0]} r={.14} /></group>
    <group {...object("propeller")} position={[-7.12,-1.22,0]} rotation={[0,Math.PI/2,0]}>
      {bladeAngles.map(a=><group key={a} rotation={[0,0,a]}><mesh geometry={blade} scale={[.61,.61,.89]}><meshStandardMaterial color="#d8ae67" metalness={.30} roughness={.4}/></mesh></group>)}
      <group {...object("propeller-boss")}><mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.28,.21,.49,18]}/><meshStandardMaterial color="#d9a760" metalness={.33} roughness={.44}/></mesh></group>
    </group>
    {port.map(side=><group key={side} {...object("bilge-keel")}><BoxPiece p={[.30,-.84,side*1.58]} s={[7.8,.095,.26]} color="#823f30"/></group>)}
    {port.map(side=><group key={side} {...object("sea-chest")} position={[-2.78,-.31,side*1.74]}>
      <BoxPiece p={[0,0,0]} s={[.66,.39,.065]} color="#485e66"/>
      {vents.map(i=><BoxPiece key={i} p={[-.24+i*.12,0,side*.04]} s={[.045,.28,.035]} color="#122a34"/>)}
    </group>)}
    <group {...object("anodes")}>{port.map(side=>[-5.95,-5.31,-4.68].map(x=><BoxPiece key={x+":"+side} p={[x,-.68,side*1.42]} s={[.31,.115,.08]} color="#c2cbbe"/>))}</group>
    <group {...object("anchor")} position={[6.42,.35,1.31]} rotation={[.20,0,-.55]}>
      <mesh position={[0,.39,0]}><torusGeometry args={[.126,.041,8,15]}/><meshStandardMaterial color="#c5ac7d" metalness={.35} roughness={.49}/></mesh>
      <Rod a={[0,-.32,0]} b={[0,.29,0]} r={.059} color="#c5ac7d"/>
      <Rod a={[-.33,-.25,.02]} b={[.33,-.25,.02]} r={.08} color="#c5ac7d"/>
      {port.map(side=><mesh key={side} position={[side*.32,-.11,.04]} rotation={[0,0,side*-.28]}><boxGeometry args={[.20,.29,.10]}/><meshStandardMaterial color="#c5ac7d" metalness={.3}/></mesh>)}
    </group>
  </group>;
});
