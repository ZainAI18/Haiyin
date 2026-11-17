import { memo, useMemo } from "react";
import { BufferAttribute, BufferGeometry, ExtrudeGeometry, Shape, Vector3 } from "three";
import type { ObjectId } from "@/lib/domain";

type Triple = [number,number,number];
const stations = [[-7.8,.36,-.45],[-7.1,1.18,-.75],[-6,1.52,-1.25],[-4,1.76,-1.29],[-1,1.8,-1.29],[3.4,1.77,-1.29],[5.6,1.37,-1.10],[7.3,.75,-.61],[7.94,.17,-.26],[8.1,.03,-.19]];
const ring = [[0,1],[.83,1],[1,.76],[.98,.46],[.80,.12],[.47,0],[-.47,0],[-.80,.12],[-.98,.46],[-1,.76],[-.83,1]];
const hullRegions = ["hull", "side-shell", "bottom-shell", "bow", "fore-bottom", "stem", "stern"] as const;
type HullRegion = (typeof hullRegions)[number];
const outerHullMaterials = ["#aa513c", "#265069", "#789194"];
const object = (id: ObjectId) => ({ name: id, userData: { object: id } });

function makeHullBuffers(simplified: boolean) {
  const vertices: number[] = [];
  const partitions = new Map<HullRegion, number[][]>(hullRegions.map(id => [id, [[], [], []]]));
  const last = stations.length - 1;
  const topAt = (x: number) => 1.02 + Math.max(0, x - 5.5) * .09;
  const rake = (i: number, height: number) => i >= last - 1 ? (height - 1) * .24 : 0;

  stations.forEach(([x, width, bottom], i) => {
    for (const [offset, height] of ring) {
      vertices.push(x + rake(i, height), bottom + (topAt(x) - bottom) * height, width * offset);
    }
  });
  const count = ring.length;
  for (let i = 0; i < last; i++) {
    for (let j = 0; j < count; j++) {
      const next = (j + 1) % count;
      const a = i * count + j, b = i * count + next;
      const c = (i + 1) * count + j, d = (i + 1) * count + next;
      const paint = j === 0 || j === count - 1 ? 2 : j >= 3 && j <= 7 ? 0 : 1;
      let region: HullRegion = "hull";
      if (!simplified) {
        if (i === last - 1) region = "stem";
        else if (paint === 0) region = i >= 6 ? "fore-bottom" : "bottom-shell";
        else if (paint === 1) region = i >= 6 ? "bow" : "side-shell";
      }
      partitions.get(region)![paint].push(a, b, c, b, d, c);
    }
  }
  for (const end of [0, last]) {
    const [x, , bottom] = stations[end];
    const center = vertices.length / 3;
    vertices.push(x + rake(end, .5), (bottom + topAt(x)) / 2, 0);
    const region = simplified ? "hull" : end === 0 ? "stern" : "stem";
    for (let j = 0; j < count; j++) {
      const a = end * count + j, b = end * count + (j + 1) % count;
      partitions.get(region)![j >= 3 && j <= 7 ? 0 : 1].push(...(end === 0 ? [center, b, a] : [center, a, b]));
    }
  }

  // Calculate bounds and normals from connected faces before splitting the selectable regions.
  const positions = new Float32Array(vertices);
  const smoothing = new BufferGeometry();
  smoothing.setAttribute("position", new BufferAttribute(positions, 3));
  smoothing.setIndex([...partitions.values()].flat(2));
  smoothing.computeVertexNormals();
  const normals = smoothing.getAttribute("normal").array;
  smoothing.dispose();
  return [...partitions].flatMap(([id, faces]) => {
    const used = [...new Set(faces.flat())];
    if (!used.length) return [];
    const remap = new Map(used.map((index, local) => [index, local]));
    return [{
      id, sizes: faces.map(face => face.length),
      positions: new Float32Array(used.flatMap(i => Array.from(positions.subarray(i * 3, i * 3 + 3)))),
      normals: new Float32Array(used.flatMap(i => Array.from(normals.slice(i * 3, i * 3 + 3)))),
      index: new Uint16Array(faces.flat().map(i => remap.get(i)!)),
    }];
  });
}

function Hull({ simplified }: { simplified: boolean }) {
  const parts = useMemo(() => makeHullBuffers(simplified), [simplified]);
  return parts.map(part => <mesh key={part.id} {...(part.id === "hull" ? {} : object(part.id))}>
    <bufferGeometry onUpdate={geometry => {
      geometry.clearGroups();
      let start = 0;
      part.sizes.forEach((size, material) => {
        if (size) geometry.addGroup(start, size, material);
        start += size;
      });
    }}>
      <bufferAttribute attach="attributes-position" args={[part.positions, 3]}/>
      <bufferAttribute attach="attributes-normal" args={[part.normals, 3]}/>
      <bufferAttribute attach="index" args={[part.index, 1]}/>
    </bufferGeometry>
    {outerHullMaterials.map((color, i) => <meshStandardMaterial key={color} attach={`material-${i}`} color={color} roughness={.68} side={2}/>)}
  </mesh>);
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
const forecastleShape = new Shape().moveTo(5.55,-1.04).lineTo(6.55,-.88)
  .lineTo(7.78,-.20).lineTo(7.78,.20).lineTo(6.55,.88).lineTo(5.55,1.04).closePath();

function BowFittings() {
  return <>{port.map(side => <group key={side}>
    <group {...object("hawse")} position={[6.68,.68,side*1.03]}>
      <mesh scale={[1,.72,1]}>
        <circleGeometry args={[.158,20]}/>
        <meshStandardMaterial color="#1c2c34" side={2}/>
      </mesh>
      <mesh scale={[1,.72,1]}>
        <torusGeometry args={[.16,.035,8,20]}/>
        <meshStandardMaterial color="#7e939a" roughness={.68}/>
      </mesh>
    </group>
    <group {...object("bow-thruster")} position={[5.82,-.61,side*1.15]}>
      <mesh>
        <circleGeometry args={[.195,22]}/>
        <meshStandardMaterial color="#25333a" side={2}/>
      </mesh>
      <mesh>
        <torusGeometry args={[.201,.033,8,22]}/>
        <meshStandardMaterial color="#734038" roughness={.63}/>
      </mesh>
      <group {...object("thruster-grid")}>
        {[-.1,0,.1].map(x => <BoxPiece key={x} p={[x,0,side*.035]} s={[.027,x ? .31 : .38,.03]} color="#9ca8a4"/>)}
      </group>
    </group>
  </group>)}</>;
}

export const SchematicShip = memo(function SchematicShip({ simplified = false }: {simplified?: boolean}) {
  const rudder = useMemo(()=>new ExtrudeGeometry(rudderShape,{depth:.19,bevelEnabled:true,bevelThickness:.045,bevelSize:.052,bevelSegments:1}),[]);
  const blade = useMemo(()=>new ExtrudeGeometry(bladeShape,{depth:.09,bevelEnabled:true,bevelThickness:.027,bevelSize:.029,bevelSegments:1}),[]);
  return <group name="schematic-ship">
    <group {...object("hull")}><Hull simplified={simplified}/></group>
    <group {...object("deck")}>
      <group {...object("hatch")}>{hatches.map((x,i)=><group key={x}><BoxPiece p={[x,1.09,0]} s={[i===3?1.5:2.26,.20,i===3?1.44:2.45]} color="#aab6af"/>
        {!simplified && <BoxPiece p={[x,1.22,0]} s={[i===3?1.34:2.11,.07,i===3?1.29:2.31]} color="#5c7781"/>}</group>)}</group>
      <group {...object("superstructure")}>
      <BoxPiece p={[-6.06,1.62,0]} s={[2.18,1.16,2.52]} color="#ccd5ca"/>
      <BoxPiece p={[-6.14,2.34,0]} s={[1.76,.43,2.11]} color="#dce2d2"/>
      <BoxPiece p={[-6.17,2.59,0]} s={[1.88,.095,2.21]} color="#839d9e"/>
      {port.map(side=>windows.map(x=><BoxPiece key={x+":"+side} p={[x,2.37,side*1.06]} s={[.25,.19,.025]} color="#12374a"/>))}
      <BoxPiece p={[-5.19,2.55,0]} s={[.025,.20,1.51]} color="#153547"/>
      <BoxPiece p={[-7.0,2.58,0]} s={[.58,1.13,.59]} color="#b5704b"/>
      <BoxPiece p={[-7.0,3.16,0]} s={[.61,.20,.62]} color="#283943"/>
      <Rod a={[-5.9,2.55,0]} b={[-5.9,3.63,0]} r={.043}/>
      <Rod a={[-5.9,3.44,-.46]} b={[-5.9,3.44,.46]} r={.025}/>
      </group>
      {!simplified && port.map(side=>railing.map((x,i)=>{
        const w=[1.20,1.67,1.75,1.77,1.74,1.52,.96][i]*side;
        return <Rod key={x+":"+side} a={[x,1.06,w]} b={[x,1.29,w]} r={.021}/>;
      }))}
    </group>
    <mesh {...object("forecastle")} position={[0,1.09,0]} rotation={[-Math.PI/2,0,0]}>
      <extrudeGeometry args={[forecastleShape,{depth:.24,bevelEnabled:false}]}/>
      <meshStandardMaterial color="#8b9c9b" roughness={.72}/>
    </mesh>
    <mesh name="bow-bulb" userData={{object:"bow"}} position={[7.05,-.23,0]} scale={[.92,.31,.37]}>
      <sphereGeometry args={[1,18,12]}/><meshStandardMaterial color="#a9503b"/>
    </mesh>
    {!simplified && <BowFittings/>}
    <group {...object("rudder")} position={[-7.89,-1.04,-.10]}>
      <mesh geometry={rudder}><meshStandardMaterial color="#b05c46" metalness={.1} roughness={.57}/></mesh>
      {!simplified && <mesh {...object("rudder-drain-plug")} position={[-.21,-.58,.217]} rotation={[Math.PI/2,0,0]}>
        <cylinderGeometry args={[.066,.066,.06,6]}/>
        <meshStandardMaterial color="#b6b9a2" roughness={.61}/>
      </mesh>}
    </group>
    <group {...object("rudder-stock")}><Rod a={[-7.70,-.5,0]} b={[-7.70,.24,0]} r={.14}/></group>
    <group {...object("shaft")}><Rod a={[-7.11,-1.22,0]} b={[-5.84,-1.22,0]} r={.14} /></group>
    {!simplified && <group {...object("shaft-outlet")}>
      <Rod a={[-6.05,-1.22,0]} b={[-5.85,-1.22,0]} r={.24} color="#695a51"/>
    </group>}
    <group {...object("propeller")} position={[-7.12,-1.22,0]} rotation={[0,Math.PI/2,0]}>
      <group {...object("propeller-blade")}>{bladeAngles.map(a=><group key={a} rotation={[0,0,a]}><mesh geometry={blade} scale={[.61,.61,.89]}><meshStandardMaterial color="#d8ae67" metalness={.30} roughness={.4}/></mesh></group>)}</group>
      <group {...object("propeller-boss")}><mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.28,.21,.49,18]}/><meshStandardMaterial color="#d9a760" metalness={.33} roughness={.44}/></mesh></group>
    </group>
    {port.map(side=><group key={side} {...object("bilge-keel")}><BoxPiece p={[.30,-.84,side*1.58]} s={[7.8,.095,.26]} color="#823f30"/></group>)}
    {port.map(side=><group key={side} {...object("sea-chest")} position={[-2.78,-.31,side*1.74]}>
      <BoxPiece p={[0,0,0]} s={[.66,.39,.065]} color="#485e66"/>
      {vents.map(i=><BoxPiece key={i} p={[-.24+i*.12,0,side*.04]} s={[.045,.28,.035]} color="#122a34"/>)}
    </group>)}
    <group {...object("anodes")}>{port.map(side=>[-5.95,-5.31,-4.68].map(x=><BoxPiece key={x+":"+side} p={[x,-.68,side*1.42]} s={[.31,.115,.08]} color="#c2cbbe"/>))}</group>
    <group {...object("anchor")} position={[6.42,.35,1.31]} rotation={[.20,0,-.55]}>
      <mesh {...object("anchor-ring")} position={[0,.39,0]}><torusGeometry args={[.126,.041,8,15]}/><meshStandardMaterial color="#c5ac7d" metalness={.35} roughness={.49}/></mesh>
      <group {...object("anchor-shank")}><Rod a={[0,-.32,0]} b={[0,.29,0]} r={.059} color="#c5ac7d"/></group>
      <group {...object("anchor-arm")}><Rod a={[-.33,-.25,.02]} b={[.33,-.25,.02]} r={.08} color="#c5ac7d"/></group>
      <group {...object("fluke")}>{port.map(side=><mesh key={side} position={[side*.32,-.11,.04]} rotation={[0,0,side*-.28]}><boxGeometry args={[.20,.29,.10]}/><meshStandardMaterial color="#c5ac7d" metalness={.3}/></mesh>)}</group>
      {!simplified && <mesh {...object("crown")} position={[0,-.26,.04]} scale={[1,.8,.85]}>
        <sphereGeometry args={[.122,14,10]}/><meshStandardMaterial color="#8c795d" roughness={.64}/>
      </mesh>}
    </group>
  </group>;
});
