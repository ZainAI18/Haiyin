import { useEffect, useState } from "react";
import { Material, Mesh, Object3D, Texture } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { objectIds, requiredObjectIds, type ObjectId } from "@/lib/domain";
import type { ModelLoadState, ModelManifest } from "./visual-types";

function release(root: Object3D) {
  const geometries = new Set<Mesh["geometry"]>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  const bitmaps = new Set<ImageBitmap>();
  root.traverse(o => {
    if (!(o instanceof Mesh)) return;
    geometries.add(o.geometry);
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      materials.add(m);
      for (const value of Object.values(m)) if (value instanceof Texture) textures.add(value);
    }
  });
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
  for (const t of textures) {
    if (typeof ImageBitmap !== "undefined" && t.source.data instanceof ImageBitmap) bitmaps.add(t.source.data);
    t.dispose();
  }
  for (const b of bitmaps) b.close();
}

export function useProductionAsset(manifest: ModelManifest | null, status: (state: ModelLoadState) => void) {
  const [root,setRoot] = useState<Object3D>();
  useEffect(() => {
    if (!manifest) return;
    const abort = new AbortController();
    let loaded: Object3D | undefined;
    status("pending");
    async function load(url: string) {
      const response = await fetch(url, {signal:abort.signal});
      if (!response.ok) throw new Error("GLB download failed.");
      const loader = new GLTFLoader();
      const data = await response.arrayBuffer();
      if (abort.signal.aborted) return;
      const gltf = await loader.parseAsync(data, new URL(".", response.url).href);
      loaded = gltf.scene;
      if (abort.signal.aborted) { release(loaded); return; }
      const counts = new Map<ObjectId,number>();
      loaded.traverse(node => {
        const id = objectIds.find(id => id === node.name);
        if (id && node.getObjectByProperty("isMesh", true)) {
          node.userData.object = id;
          counts.set(id, (counts.get(id) ?? 0) + 1);
        }
      });
      const textured = loaded.getObjectsByProperty("isMesh",true).some(node => {
        const m = (node as Mesh).material;
        return (Array.isArray(m) ? m : [m]).some(mat => "map" in mat && mat.map instanceof Texture);
      });
      if (!textured || [...counts.values()].some(count => count !== 1) || requiredObjectIds.some(id => !counts.has(id))) {
        release(loaded); loaded = undefined; throw new Error("GLB does not meet the documented model contract.");
      }
      // glTF nodes can share a material. Isolate it so selection only lights the selected meshes.
      const originals = new Set<Material>();
      loaded.traverse(node => {
        if (!(node instanceof Mesh)) return;
        const clone = (mat: Material) => { originals.add(mat); return mat.clone(); };
        node.material = Array.isArray(node.material) ? node.material.map(clone) : clone(node.material);
      });
      originals.forEach(mat => mat.dispose());
      setRoot(loaded);
      status({ targets: new Set(counts.keys()) });
    }
    void load(manifest.url).catch(() => { if (!abort.signal.aborted) status("fallback"); });
    return () => { abort.abort(); if (loaded) release(loaded); };
  },[manifest,status]);
  return root;
}
