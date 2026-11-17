import { readFile } from "node:fs/promises";
const { production: model } = JSON.parse(await readFile(new URL("../data/ship-model.json", import.meta.url)));
if (!model) {
  console.log("No detailed model configured. The schematic ship and 2D diagram are available.");
  process.exit(0);
}
for (const field of ["url", "title", "author", "source", "license"]) {
  if (typeof model[field] !== "string" || !model[field].trim()) throw new Error("Model manifest is missing " + field);
}
if (!/^\/models\/[a-z0-9_/-]+\.glb$/i.test(model.url)) throw new Error("Production model URL must be a versioned path under public/models.");
if (!/^https:\/\//i.test(model.source)) throw new Error("Model source must be an HTTPS provenance URL.");
const bytes = await readFile(new URL("../public" + model.url, import.meta.url));
if (bytes.length > 16 * 1024 * 1024) throw new Error("Detailed GLB exceeds the 16 MiB delivery budget.");
if (bytes.length < 20 || bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.length || bytes.readUInt32LE(16) !== 0x4e4f534a || bytes.readUInt32LE(12)+20 > bytes.length)
  throw new Error("Expected a valid glTF 2.0 binary.");
const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString("utf8"));
if (!json.images?.length || !json.textures?.length ||
    !json.materials?.some(m=>m.pbrMetallicRoughness?.baseColorTexture) ||
    json.images.some(image=>image.uri && !image.uri.startsWith("data:")) || json.buffers?.some(b=>b.uri))
  throw new Error("Use a self-contained textured GLB with a base-color map.");
const names = ["hull","bow","stern","rudder","rudder-stock","propeller","propeller-boss","shaft","anchor","sea-chest","bilge-keel","anodes","deck"];
for (const name of names) {
  const nodes = (json.nodes ?? []).filter(n=>n.name===name);
  if (nodes.length!==1) throw new Error("Expected exactly one node named " + name);
  const seen = new Set();
  const hasMesh = node => {
    if (!node || seen.has(node)) return false;
    seen.add(node);
    return Number.isInteger(node.mesh) || (node.children ?? []).some(i => hasMesh(json.nodes[i]));
  };
  if (!hasMesh(nodes[0])) throw new Error("No mesh under node " + name);
}
console.log("GLB passes texture, naming, and size checks. Confirm placement and license separately.");
