import type { ObjectId, OverlayId, SceneId } from "@/lib/domain";
export type ViewerProps = {
  scene?: SceneId;
  target?: ObjectId;
  overlay?: OverlayId;
  stage?: number;
  reset?: number;
  onPick?: (object: ObjectId) => void;
};
export type ModelManifest = {
  url: string; title: string; author: string; source: string; license: string; optional?: boolean;
};
export type ModelLoadState = "pending" | "fallback" | { targets: ReadonlySet<ObjectId> };
