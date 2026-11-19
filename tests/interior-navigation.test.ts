import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import data from "../public/hai-yin-i/geometry/interior-layout.json";
import {canStand,movePosition,spawnPosition,stairLanding,type WalkZone} from "../lib/hai-yin-navigation";
import {createShipActions} from "../lib/hai-yin-scene";
import {BoxGeometry,Group,Mesh,MeshStandardMaterial} from "three";

test("every interior entry and room locator lands on a clear floor with page and hash provenance",()=>{
  for(const z of ["main","upper","engine"] as const)assert.ok(canStand(data,spawnPosition(data,z)),z);
  for(const r of data.rooms){assert.ok(canStand(data,spawnPosition(data,r.zone as WalkZone,r.id)),r.id);assert.ok(r.sources.every(s=>s.page>0&&/^[a-f0-9]{64}$/.test(s.sha256)));}
  assert.equal(data.rooms.filter(r=>r.id.includes("crew_")).length,4);
  assert.equal(data.source_review.fire.replaces,"SHFP-4280");
  assert.ok(data.fire_register.conflicts[0].sources.some(s=>s.page===16));
});
test("two floors connect through the stair flight in both directions without a side-entry teleport",()=>{
  let p=stairLanding(data,"main");
  for(let i=0;i<80;i++)p=movePosition(data,p,0,.04);
  assert.equal(p.zone,"upper");assert.equal(p.floor,6.48);assert.equal(p.onStair,false);
  p=stairLanding(data,"upper");for(let i=0;i<80;i++)p=movePosition(data,p,0,-.04);
  assert.equal(p.zone,"main");assert.equal(p.floor,4.18);assert.equal(p.onStair,false);
  const middle={...spawnPosition(data,"upper"),x:data.stair.rect[1]+.25,z:0};
  const blocked=movePosition(data,middle,-.6,0);assert.equal(blocked.onStair,false);assert.equal(blocked.floor,6.48);
});
test("walking cannot tunnel through cabin partitions, machinery or outer hull boundaries",()=>{
  const crew=spawnPosition(data,"main","hyi_main_crew_port");
  assert.ok(movePosition(data,crew,0,-8).z>.14,"centre cabin partition blocks crossing");
  assert.ok(movePosition(data,crew,100,0).x<data.zones.main.bounds[1],"forward wall bounds");
  const engine=spawnPosition(data,"engine");
  const towardGenerator=movePosition(data,engine,-1.5,.87);
  assert.ok(canStand(data,towardGenerator));
  const cabinDoor={...spawnPosition(data,"main"),z:1.5};
  assert.ok(movePosition(data,cabinDoor,1,0).x>data.rooms.find(r=>r.id==="hyi_main_crew_port")!.rect[0],"685 mm clear doorway stays passable");
});
test("first-person reveals opaque local interiors and preserves its camera mode when inspecting equipment",()=>{
  const root=new Group(),local=new Group(),outside=new Group();root.add(local,outside);
  local.name="hyi_fire_demo";local.userData={layer:"safety",walkZones:["main"],inspectId:local.name};outside.userData={layer:"shell"};
  const geometry=new BoxGeometry(),material=new MeshStandardMaterial(),a=new Mesh(geometry,material),b=new Mesh(geometry,material);local.add(a);outside.add(b);
  const actions=createShipActions(root);actions.applyPreset("walk-main");assert.equal(a.visible,true);assert.equal(b.visible,false);assert.equal((a.material as MeshStandardMaterial).opacity,1);
  assert.equal(actions.select(local.name,true),"walk-main");actions.applyPreset("walk-engine");assert.equal(a.visible,false);
  actions.applyPreset("exterior");assert.equal(b.visible,true);assert.equal(a.visible,false);
  root.traverse(o=>{if(o instanceof Mesh)(o.material as MeshStandardMaterial).dispose();});geometry.dispose();
});
test("GLB contains room partitions and furniture instead of the old solid accommodation envelope",()=>{
  const bytes=readFileSync(new URL("../public/hai-yin-i/models/hai-yin-i-visual-assembly.glb",import.meta.url));const g=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString("utf8"));
  const names=g.nodes.map((n:{name:string})=>n.name);assert.ok(!names.includes("accommodation_lower"));assert.ok(names.includes("hyi_internal_stairs"));assert.ok(names.includes("galley_sink"));assert.ok(names.includes("ventilation_duct_300x240"));
});
