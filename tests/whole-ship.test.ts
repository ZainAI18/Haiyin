import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {objectIds} from "../lib/domain";
import {createShipActions,inspectId} from "../lib/hai-yin-scene";
import {BoxGeometry,Group,Mesh,MeshStandardMaterial} from "three";
const base=new URL("../public/hai-yin-i/",import.meta.url);
const plan=JSON.parse(readFileSync(new URL("geometry/ship-plan.json",base),"utf8"));
const assembly=JSON.parse(readFileSync(new URL("geometry/ship-assembly.json",base),"utf8"));
const bytes=readFileSync(new URL("models/hai-yin-i-visual-assembly.glb",base));
const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString("utf8"));

test("Hai Yin I is an independent whole-vessel asset with metre geometry and two separate routes",()=>{
  assert.notEqual(assembly.teaching_ship_route,assembly.vessel_route);
  assert.equal(assembly.teaching_ship_route,"/atlas");
  assert.equal(gltf.scenes[0].extras.vessel,"MT Hai Yin I");
  assert.equal(gltf.scenes[0].extras.unit,"metre");
  assert.equal(gltf.scenes[0].extras.independent_of_teaching_vessel,true);
  assert.equal(gltf.scenes[0].extras.detailed_reconstruction_complete,false);
  assert.equal(new Set(assembly.targets.map((t:{id:string})=>t.id)).size,32);
  for(const target of assembly.targets)assert.ok(!objectIds.includes(target.id));
  const hull=assembly.targets.find((t:{id:string})=>t.id==="hyi_hull").bounds_m;
  const bow=assembly.targets.find((t:{id:string})=>t.id==="hyi_forecastle").bounds_m;
  assert.ok(Math.abs(bow.max[0]-hull.min[0]-49.9)<1e-5);
  assert.ok(Math.abs(hull.max[2]-hull.min[2]-9.8)<1e-3);
  assert.ok(Math.abs((plan.forecastle_half_outline_xz_m[0][0]-plan.frame_zero_x_m)/.56-77)<.01);
});

test("whole assembly has eight distinct cargo compartments and twin propulsion without duplicate rudder definitions",()=>{
  const nodes=gltf.nodes as {name:string;mesh?:number;translation?:number[];matrix?:number[]}[];
  assert.equal(nodes.filter(n=>/^cargo_tank_no[1-4]_(port|starboard)$/.test(n.name)).length,8);
  assert.equal(nodes.filter(n=>/^nt855m_(port|starboard)$/.test(n.name)).length,2);
  assert.equal(nodes.filter(n=>/^propeller_(port|starboard)$/.test(n.name)).length,2);
  assert.equal(nodes.filter(n=>/^propeller_blade_[1-4]$/.test(n.name)).length,8);
  const port=nodes.find(n=>n.name==="rudder_port"),starboard=nodes.find(n=>n.name==="rudder_starboard");
  assert.ok(port&&starboard);assert.equal(port.mesh,starboard.mesh,"two rudders reuse one geometry definition");
  for(const side of ["port","starboard"]){const p=nodes.find(n=>n.name===`propeller_${side}`),y=p?.translation?.[1]??p?.matrix?.[13],z=p?.translation?.[2]??p?.matrix?.[14];assert.ok(Math.abs((y??0)-.95)<1e-6);assert.equal(Math.abs(z??0),2.5);}
  assert.ok(assembly.targets.every((t:{confidence:string;sources:unknown[]})=>t.confidence&&t.sources.length));
});

test("interior selection reveals the correct independent vessel layer and does not highlight shared-material siblings",()=>{
  const root=new Group(),cargo=new Group(),engine=new Group(),shell=new Group();
  cargo.name="hyi_cargo_1_port";cargo.userData={inspectId:cargo.name,layer:"cargo"};
  engine.name="hyi_main_engine_port";engine.userData={inspectId:engine.name,layer:"machinery"};
  shell.userData={inspectId:"hyi_hull",layer:"shell"};root.add(cargo,engine,shell);
  const material=new MeshStandardMaterial(),geometry=new BoxGeometry();
  const c=new Mesh(geometry,material),e=new Mesh(geometry,material),h=new Mesh(geometry,material);cargo.add(c);engine.add(e);shell.add(h);
  const actions=createShipActions(root);assert.equal(c.visible,false);assert.equal(e.visible,false);
  assert.equal(actions.select(cargo.name),"cargo");assert.equal(c.visible,true);assert.equal(e.visible,false);
  assert.equal(inspectId(c),cargo.name);assert.notEqual(c.material,e.material);
  assert.equal(actions.canPick(h),false,"transparent shell must not block interior picking");
  assert.equal(actions.select(engine.name),"engine");assert.equal(e.visible,true);assert.equal(c.visible,false);
  actions.applyPreset("exterior");assert.equal(e.visible,false);assert.equal(h.visible,true);
  root.traverse(n=>{if(n instanceof Mesh)(n.material as MeshStandardMaterial).dispose();});geometry.dispose();
});
