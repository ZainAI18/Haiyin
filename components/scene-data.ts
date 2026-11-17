import type { SceneId } from "@/lib/domain";
type Stage = { name:string; zh:string; summary:string; note:string };
export const scenes: Record<SceneId,{title:string;zh:string;caption:string;stages:Stage[]}> = {
  "dry-dock":{title:"Dry dock",zh:"干船坞",caption:"A fixed basin is drained around the ship until the hull rests on prepared blocks.",stages:[
    {name:"Flood & enter",zh:"注水进坞",summary:"The dock is open and flooded; the vessel floats over the prepared block line.",note:"A docking plan determines support locations and positioning."},
    {name:"Close & pump",zh:"关门排水",summary:"Close the dock gate and pump down the water. The ship settles toward the keel blocks.",note:"The water level is shown schematically. Keep inspection access closed during pump-down."},
    {name:"Land on blocks",zh:"船体坐墩",summary:"Buoyancy reduces and the load transfers to the prepared supports as the basin empties.",note:"The drawing cuts away the near wall to show the blocks. Their layout is illustrative."},
    {name:"Inspect",zh:"开展检验",summary:"With the basin dry, the exposed shell, rudder and propeller can be examined.",note:"The near wall remains hidden in this cutaway. Verify safe access and the docking condition before inspection."},
  ]},
  "floating-dock":{title:"Floating dock",zh:"浮船坞",caption:"Ballast tanks let a floating dock submerge to receive a vessel and rise to expose its hull.",stages:[
    {name:"Take ballast",zh:"压载下沉",summary:"Ballast lowers the dock until its central deck and the blocks are below the water surface.",note:"The dock is buoyant; water outside the dock stays at the same level."},
    {name:"Position vessel",zh:"船舶定位",summary:"The ship floats between the wing walls and is aligned over the blocks.",note:"Alignment and ballast balance matter throughout the operation."},
    {name:"Deballast & lift",zh:"排压载抬升",summary:"The dock rises as ballast is removed. The blocks meet the hull and begin lifting the ship.",note:"The wing walls and pontoon rise together."},
    {name:"Expose the hull",zh:"露出船底",summary:"The dock carries the ship above the surrounding water for inspection.",note:"Actual ballast sequences and stability checks are specific to the dock."},
  ]},
  synchrolift:{title:"Synchrolift",zh:"升船平台",caption:"Coordinated winches raise a submerged platform to the yard transfer level.",stages:[
    {name:"Lower platform",zh:"平台下沉",summary:"Winches lower the platform and its supports beneath the water surface.",note:"The shore structures stay fixed throughout the operation."},
    {name:"Align on supports",zh:"对准承载墩",summary:"The vessel floats over the platform and is aligned with the planned supports.",note:"The exact supports and alignment come from the installation and vessel plan."},
    {name:"Lift in sync",zh:"同步提升",summary:"The winches raise the platform together until its rails align with the ashore transfer system.",note:"The cords visualize the lift; their number and layout are illustrative."},
    {name:"Transfer ashore",zh:"移船到陆上",summary:"A transfer cradle moves the supported vessel from the platform onto the yard rails.",note:"The landward transfer position is shown without operational dimensions."},
  ]},
};
