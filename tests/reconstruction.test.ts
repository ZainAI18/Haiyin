import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vessel from "../data/hai-yin-i.json";

const register=JSON.parse(readFileSync(new URL("../public/hai-yin-i/audit/source-register.json",import.meta.url),"utf8"));

test("reconstruction accounts for every supplied PDF and preserves byte-level duplicate identity",()=>{
  assert.equal(register.source_records.length,160);
  assert.equal(register.source_records.reduce((n:number,r:{page_count:number})=>n+r.page_count,0),782);
  const hashes=new Set(register.source_records.map((r:{sha256:string})=>r.sha256));
  assert.equal(hashes.size,157);
  for(const record of register.source_records) {
    if(!record.duplicate_of) continue;
    const canonical=register.source_records.find((r:{file:string})=>r.file===record.duplicate_of);
    assert.equal(canonical?.sha256,record.sha256);
    assert.equal(record.selection,"exact_duplicate");
  }
  const rev0=register.source_records.find((r:{file:string})=>r.file.includes("Cybermarine Rev0"));
  const rev3=register.source_records.find((r:{file:string})=>r.file.includes("Cybermarine Rev3"));
  assert.equal(rev0.sha256,rev3.sha256);
});

test("Not Approved drawings are excluded even when newer and information-only filing stays distinct",()=>{
  const rejected=register.source_records.filter((r:{stamp_status_detected:string})=>r.stamp_status_detected==="not_approved");
  assert.equal(rejected.length,5);
  for(const record of rejected) {
    assert.equal(record.selection,"excluded_not_approved");
    assert.notEqual(record.selected_family_file,record.file);
  }
  const body=register.source_records.find((r:{file:string})=>r.file==="Body Line on Frames.pdf");
  assert.equal(body.stamp_status_detected,"filed");
  assert.equal(vessel.status,"partial_reconstruction");
  assert.ok(vessel.conflicts.some(c=>c.id==="draft"));
  assert.ok(vessel.components.some(c=>c.status==="topology_only_nts"));
});

test("cargo tank register has eight distinct compartments with the latest specification capacity",()=>{
  assert.equal(vessel.cargo_tanks.flatMap(t=>t.sides).length,8);
  assert.ok(Math.abs(vessel.cargo_tanks.reduce((n,t)=>n+t.capacity_each_m3*2,0)-807)<1e-9);
  for(const tank of vessel.cargo_tanks) {
    assert.equal(tank.source.file,"Hull Specification.pdf");
    assert.equal(tank.source.page,6);
    assert.equal(tank.geometry_status,"not_reconstructed");
  }
});

test("exported GLB has metre-sized geometry and does not claim a complete vessel or duplicate two rudders",()=>{
  const bytes=readFileSync(new URL("../public/hai-yin-i/models/rudder-blade-envelope.glb",import.meta.url));
  assert.equal(bytes.readUInt32LE(0),0x46546c67);
  assert.equal(bytes.readUInt32LE(4),2);
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  const length=bytes.readUInt32LE(12);
  const gltf=JSON.parse(bytes.subarray(20,20+length).toString("utf8"));
  assert.equal(gltf.meshes.length,1);
  assert.equal(gltf.scenes[0].extras.unit,"metre");
  assert.equal(gltf.scenes[0].extras.full_vessel,false);
  assert.equal(gltf.scenes[0].extras.quantity_on_ship,2);
  const node=gltf.nodes.find((n:{name:string})=>n.name==="rudder_blade_envelope");
  assert.equal(node.extras.source.drawing_no,"WUT513B-231-02");
  assert.equal(node.extras.source.page,1);
  const position=gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION];
  assert.ok(Math.abs(position.max[0]-position.min[0]-1.4)<1e-6);
  assert.ok(Math.abs(position.max[1]-position.min[1]-2.08)<1e-6);
  assert.ok(position.max[2]-position.min[2]>.251 && position.max[2]-position.min[2]<.253);
});
