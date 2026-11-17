import { z } from "zod";

export const requiredObjectIds = ["hull", "bow", "stern", "rudder", "rudder-stock", "propeller", "propeller-boss", "shaft", "anchor", "sea-chest", "bilge-keel", "anodes", "deck"] as const;
export const objectIds = [
  ...requiredObjectIds, "stem", "fore-bottom", "forecastle", "hawse", "bow-thruster", "thruster-grid",
  "bottom-shell", "side-shell", "hatch", "superstructure", "anchor-shank", "anchor-arm", "anchor-ring",
  "fluke", "crown", "propeller-blade", "shaft-outlet", "rudder-drain-plug",
] as const;
export type ObjectId = (typeof objectIds)[number];
export const sceneIds = ["dry-dock", "floating-dock", "synchrolift"] as const;
export type SceneId = (typeof sceneIds)[number];
export const topics = ["bow", "hull", "stern", "steering", "propeller", "anchor", "valves", "measurements", "docking"] as const;
export type Topic = (typeof topics)[number];
export const kindLabels = { component: "Physical component", process: "Process", defect: "Defect", measurement: "Measurement", rule: "Rule / reference" };
export const topicLabels: Record<Topic, [string, string]> = {
  bow: ["Bow", "船首"], hull: ["Hull", "船体"], stern: ["Stern", "船尾"], steering: ["Steering", "舵系"],
  propeller: ["Propeller", "推进系统"], anchor: ["Anchor", "锚系"], valves: ["Valves", "阀件"],
  measurements: ["Measurements", "测量"], docking: ["Docking", "进坞"],
};
export const overlayIds = ["crack", "corrosion", "dent", "wear", "ingress"] as const;
export type OverlayId = (typeof overlayIds)[number];
export const mappingSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("schematic"), object: z.enum(objectIds) }),
  z.object({ status: z.literal("context"), object: z.enum(objectIds) }),
  z.object({ status: z.literal("demo"), object: z.enum(objectIds), overlay: z.enum(overlayIds) }),
  z.object({ status: z.literal("scene"), scene: z.enum(sceneIds) }),
  z.object({ status: z.literal("text") }),
]);
export const termSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  en: z.string().min(1), zh: z.string().min(1),
  explanationZh: z.string().min(1), aliases: z.array(z.string()),
  kind: z.enum(["component", "process", "defect", "measurement", "rule"]),
  topic: z.enum(topics), confidence: z.enum(["high", "medium", "provisional"]),
  mapping: mappingSchema, historical: z.boolean(),
  sources: z.array(z.object({ edition: z.enum(["EN", "CN"]), page: z.number().int().min(1).max(9) })).min(1),
  manual: z.string().optional(),
});
export type Term = z.infer<typeof termSchema>;
export type Mapping = Term["mapping"];
export const mappingLabels: Record<Mapping["status"], string> = {
  schematic: "Schematic part", context: "Related area only", demo: "Illustrative defect", scene: "Process scene", text: "Reading only",
};
export function searchTerms(terms: readonly Term[], input: string, topic?: Topic): Term[] {
  const normalize = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const tokens = normalize(input).split(/\s+/).filter(Boolean);
  return terms.filter(term => {
    if (topic && term.topic !== topic) return false;
    const searchable = normalize([term.en, term.zh, ...term.aliases, term.explanationZh].join(" "));
    return tokens.every(token => {
      if (token === "sterm") return ["stem", "stern", "stem-distortion", "stern-frame"].includes(term.slug);
      return searchable.includes(token);
    });
  });
}
export const focusTermByObject: Record<ObjectId, string> = {
  hull: "shell-plating", bow: "bow", stern: "stern", rudder: "rudder-plate", "rudder-stock": "rudder-stock",
  propeller: "propeller", "propeller-boss": "propeller-boss", shaft: "propeller-shaft", anchor: "stockless-anchor",
  "sea-chest": "sea-chest", "bilge-keel": "bilge-keel", anodes: "sacrificial-anode", deck: "freeboard-deck",
  stem: "stem", "fore-bottom": "fore-bottom", forecastle: "forecastle", hawse: "hawse",
  "bow-thruster": "bow-thruster", "thruster-grid": "thruster-grid", "bottom-shell": "bottom-shell", "side-shell": "side-shell",
  hatch: "hatch", superstructure: "superstructure", "anchor-shank": "anchor-shank", "anchor-arm": "anchor-arm",
  "anchor-ring": "anchor-ring", fluke: "fluke", crown: "crown", "propeller-blade": "propeller-blade",
  "shaft-outlet": "shaft-outlet", "rudder-drain-plug": "rudder-drain-plug",
};
