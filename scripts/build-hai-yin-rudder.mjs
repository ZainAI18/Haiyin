import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Box3, ExtrudeGeometry, Mesh, MeshStandardMaterial, Scene, Shape, Vector2, Vector3 } from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

// GLTFExporter uses the browser FileReader API. Node supplies Blob but not FileReader.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then(result => {
      this.result = `data:${blob.type};base64,${Buffer.from(result).toString("base64")}`;
      this.onloadend?.();
    });
  }
};

const input = resolve(process.argv[2] ?? "public/hai-yin-i/geometry/rudder-profile.json");
const output = resolve(process.argv[3] ?? "public/hai-yin-i/models/rudder-blade-envelope.glb");
const data = JSON.parse(await readFile(input, "utf8"));
if (data.unit !== "metre" || data.status !== "drawing_derived_envelope_not_complete_component") {
  throw new Error("Review source units and reconstruction status before building.");
}
const shape = new Shape(data.profile_xy_m.map(([x,y]) => new Vector2(x,y)));
const geometry = new ExtrudeGeometry(shape, { depth:data.height_m, steps:1, bevelEnabled:false });
geometry.rotateX(-Math.PI/2);
const material = new MeshStandardMaterial({ color:0x397f8c, metalness:0.2, roughness:0.65 });
const mesh = new Mesh(geometry, material);
mesh.name = data.id;
mesh.userData = {
  status:data.status, source:data.source, unit:data.unit,
  exclusions:"flange, internal webs, holes, welds, installation transform",
  precision_note:data.precision_note,
};
const scene = new Scene();
scene.name = "hai_yin_i_partial_reconstruction";
scene.userData = { unit:"metre", full_vessel:false, quantity_on_ship:2, definition_count:1 };
scene.add(mesh);
const size = new Box3().setFromObject(mesh).getSize(new Vector3());
if (Math.abs(size.x-data.chord_m)>1e-6 || Math.abs(size.y-data.height_m)>1e-6) {
  throw new Error("GLB geometry does not match the dimensioned chord and height.");
}
const glb = await new GLTFExporter().parseAsync(scene, { binary:true });
await mkdir(dirname(output), {recursive:true});
await writeFile(output,Buffer.from(glb));
await writeFile(output.replace(/\.glb$/, ".validation.json"),JSON.stringify({
  unit:"metre", dimensions_m:{chord:size.x,height:size.y,thickness:size.z},
  source:data.source, status:data.status, full_vessel:false,
},null,2));
geometry.dispose(); material.dispose();
console.log(JSON.stringify({file:output,bytes:glb.byteLength,dimensions_m:size.toArray()}));
