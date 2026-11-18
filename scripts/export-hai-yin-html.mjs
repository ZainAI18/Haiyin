import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const base=resolve(root,"public/hai-yin-i");
const files={
  vessel:"master-data.json",register:"audit/source-register.json",equipment:"audit/machinery-equipment-tables.json",
  profile:"geometry/rudder-profile.json",drawingCsv:"audit/drawing-register.csv",equipmentCsv:"audit/machinery-equipment-tables.csv",
  glb:"models/rudder-blade-envelope.glb",
};
const entries=await Promise.all(Object.entries(files).map(async([key,path])=>{
  const content=await readFile(resolve(base,path));
  return [key,key==="glb"?content.toString("base64"):path.endsWith(".json")?JSON.parse(content.toString("utf8")):content.toString("utf8")];
}));
const data=Object.fromEntries(entries);
if(data.register.source_records.length!==160||data.vessel.status!=="partial_reconstruction") throw new Error("Review the expected source snapshot and model scope.");
const [template,style,profileSvg,license,bundle]=await Promise.all([
  readFile(resolve(root,"standalone/template.html"),"utf8"),readFile(resolve(root,"standalone/style.css"),"utf8"),
  readFile(resolve(base,"geometry/rudder-profile.svg"),"utf8"),readFile(resolve(root,"node_modules/three/LICENSE"),"utf8"),
  build({entryPoints:[resolve(root,"standalone/app.js")],bundle:true,format:"iife",platform:"browser",target:["es2022"],minify:true,write:false,legalComments:"inline"}),
]);
const safeJson=JSON.stringify(data).replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");
const script=bundle.outputFiles[0].text.replace(/<\/script/gi,"<\\/script");
const replacements={"/*__STYLE__*/":style,"<!--__PROFILE__-->":profileSvg,"/*__DATA__*/":safeJson,"/*__SCRIPT__*/":script};
let html=template;
for(const [marker,value] of Object.entries(replacements)){
  if(!html.includes(marker))throw new Error(`Missing template marker: ${marker}`);
  html=html.replace(marker,()=>value);
}
html=html.replace("</body>",`<!--\nBundled Three.js / OrbitControls / GLTFLoader license:\n${license.replace(/-->/g,"-- >")}\n-->\n</body>`);
const output=process.argv[2]?resolve(process.argv[2]):resolve(root,"standalone/Hai_Yin_I_Atlas.html");
await mkdir(dirname(output),{recursive:true});await writeFile(output,html,"utf8");
console.log(JSON.stringify({file:output,bytes:Buffer.byteLength(html),source_files:data.register.source_records.length,equipment_rows:data.equipment.rows.length,external_dependencies:0,scope:data.vessel.status},null,2));
