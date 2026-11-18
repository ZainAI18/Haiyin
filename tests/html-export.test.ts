import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const html=readFileSync(new URL("../standalone/Hai_Yin_I_Atlas.html",import.meta.url),"utf8");
const match=html.match(/<script type="application\/json" id="atlas-data">([\s\S]*?)<\/script>/);
assert.ok(match,"The standalone artifact must embed its own data snapshot.");
const embedded=JSON.parse(match[1]);
const asset=(path:string)=>readFileSync(new URL("../public/hai-yin-i/"+path,import.meta.url));

test("offline HTML preserves all source data and requires re-export when the source snapshot changes",()=>{
  for(const [key,path] of [["vessel","master-data.json"],["register","audit/source-register.json"],
    ["equipment","audit/machinery-equipment-tables.json"],["profile","geometry/rudder-profile.json"]]) {
    assert.deepEqual(embedded[key],JSON.parse(asset(path).toString("utf8")),key);
  }
  assert.equal(embedded.vessel.status,"partial_reconstruction");
});

test("embedded GLB and CSV downloads preserve the original bytes",()=>{
  assert.ok(Buffer.from(embedded.glb,"base64").equals(asset("models/rudder-blade-envelope.glb")));
  assert.ok(Buffer.from(embedded.shipGlb,"base64").equals(asset("models/hai-yin-i-visual-assembly.glb")));
  assert.deepEqual(embedded.shipAssembly,JSON.parse(asset("geometry/ship-assembly.json").toString("utf8")));
  assert.equal(embedded.drawingCsv,asset("audit/drawing-register.csv").toString("utf8"));
  assert.equal(embedded.equipmentCsv,asset("audit/machinery-equipment-tables.csv").toString("utf8"));
});

test("standalone HTML has no external script, stylesheet, iframe, or unfilled build placeholder",()=>{
  assert.doesNotMatch(html,/<(?:script|link)\b[^>]+(?:src|href)\s*=\s*["']https?:/i);
  assert.doesNotMatch(html,/<iframe\b/i);
  assert.doesNotMatch(html,/\/\*__(?:STYLE|DATA|SCRIPT)__\*\//);
  assert.match(html,/Copyright © 2010-2026 three\.js authors/);
});
