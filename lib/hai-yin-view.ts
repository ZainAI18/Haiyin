import type {WalkZone} from "./hai-yin-navigation";
// Keep UI mode helpers free of Three.js so the surrounding page remains code split.
export type ShipPreset="exterior"|"xray"|"cargo"|"engine"|"fire"|"walk-main"|"walk-upper"|"walk-engine";
export type ShipTarget={id:string;name_cn:string;layer:string;confidence:string;note_cn:string;sources:{file:string;page:number}[]};
export function walkingZone(preset:ShipPreset):WalkZone|undefined{return preset==="walk-main"?"main":preset==="walk-upper"?"upper":preset==="walk-engine"?"engine":undefined;}
