import assert from "node:assert/strict";
import { test } from "node:test";
import raw from "../data/terms.json";
import { focusTermByObject, objectIds, sceneIds, searchTerms, termSchema, topics } from "../lib/domain";
import { scenes } from "../components/scene-data";

const catalog = raw.map(value => termSchema.parse(value));
const bySlug = new Map(catalog.map(t => [t.slug,t]));
test("catalog has distinct, route-safe slugs and page citations from both editions", () => {
  assert.equal(bySlug.size, catalog.length);
  for (const edition of ["EN","CN"]) {
    const pages = new Set(catalog.flatMap(t => t.sources.filter(s=>s.edition===edition).map(s=>s.page)));
    assert.deepEqual([...pages].sort(), [1,2,3,4,5,6,7,8,9]);
  }
  for (const t of catalog) {
    assert.equal(new Set(t.sources.map(s => s.edition+":"+s.page)).size,t.sources.length,t.slug);
    assert.match(t.explanationZh,/\p{Script=Han}/u,t.slug);
  }
});
test("mesh picking resolves to the cited catalog entry and all required direct targets exist", () => {
  for (const id of objectIds) {
    const match = bySlug.get(focusTermByObject[id]);
    assert.ok(match && "object" in match.mapping, id);
    assert.equal(match.mapping.object,id);
  }
  for (const [slug,object] of [["rudder-plate","rudder"],["propeller","propeller"],["stockless-anchor","anchor"]]) {
    assert.deepEqual(bySlug.get(slug)?.mapping,{status:"schematic",object});
  }
  assert.equal(bySlug.get("pintle")?.mapping.status,"context");
});
test("process links resolve and each process has four independently selectable stages", () => {
  for (const id of sceneIds) {
    assert.deepEqual(bySlug.get(id)?.mapping,{status:"scene",scene:id});
    assert.equal(scenes[id].stages.length,4);
    assert.equal(new Set(scenes[id].stages.map(s=>s.name)).size,4);
  }
});
test("defect mappings carry an overlay and cannot conflict with a process route", () => {
  const demo = catalog.filter(t=>t.mapping.status==="demo");
  assert.ok(demo.length);
  for (const t of demo) assert.equal(t.kind,"defect",t.slug);
  assert.deepEqual(bySlug.get("propeller-root-crack")?.mapping,{status:"demo",object:"propeller",overlay:"crack"});
  assert.equal(bySlug.get("link-fracture")?.mapping.status,"text");
});
test("1996 acceptance examples are explicitly historical and retain page provenance", () => {
  for (const [slug, page] of [
    ["historic-rudder-clearance",42],["historic-stern-bearing-clearance",59],["historic-chain-wear",74],
    ["historic-jumping-stopper-gap",48],["historic-docking-interval",84],["historic-propeller-zones",57],
  ] as const) {
    const item=bySlug.get(slug);
    assert.ok(item?.historical,slug);
    assert.ok(item.sources.some(s=>s.page===8));
    assert.ok(item.manual?.includes(String(page)),slug);
  }
});
test("bilingual, punctuation tolerant search and area filters locate real entries", () => {
  assert.ok(searchTerms(catalog,"无损检测","measurements").some(t=>t.slug==="ndt"));
  assert.ok(searchTerms(catalog,"Ｋｅｎｔｅｒ","anchor").some(t=>t.slug==="kenter-shackle"));
  assert.deepEqual(searchTerms(catalog,"drawing-that-does-not-exist"),[]);
  for (const topic of topics) assert.ok(searchTerms(catalog,"",topic).length);
});
