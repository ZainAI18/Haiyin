import {Box3,Material,Mesh,Object3D,Vector3} from "three";
import {walkingZone,type ShipPreset} from "./hai-yin-view";
export {walkingZone} from "./hai-yin-view";
export type {ShipPreset,ShipTarget} from "./hai-yin-view";
export function inspectId(object:Object3D):string|undefined {
  for(let current:Object3D|null=object;current;current=current.parent)if(current.userData.inspectId)return current.userData.inspectId;
}
function layer(object:Object3D):string {
  for(let current:Object3D|null=object;current;current=current.parent)if(current.userData.layer)return current.userData.layer;
  return "fittings";
}
export function createShipActions(root:Object3D){
  const meshes:Mesh[]=[];const originals=new Set<Material>();
  root.traverse(object=>{if(!(object instanceof Mesh))return;meshes.push(object);const clone=(m:Material)=>{originals.add(m);return m.clone();};object.material=Array.isArray(object.material)?object.material.map(clone):clone(object.material);});
  originals.forEach(m=>m.dispose());
  let preset:ShipPreset="exterior";
  function applyPreset(value:ShipPreset){
    preset=value;
    for(const object of meshes){
      const kind=layer(object);let opacity=1,visible=true;
      if(walkingZone(value)){
        const zone=walkingZone(value);let tags:string[]=[];
        for(let ancestor:Object3D|null=object;ancestor;ancestor=ancestor.parent)if(ancestor.userData.walkZones){tags=ancestor.userData.walkZones;break;}
        visible=zone==="engine"?tags.includes("engine"):tags.some(z=>z==="main"||z==="upper");
      }
      else if(value==="fire"){visible=!["cargo","ballast","structure"].includes(kind);if(kind==="shell"||kind==="deck"||kind==="superstructure")opacity=.08;if(kind==="interior")opacity=.20;}
      else if(value==="exterior")visible=!["cargo","ballast","structure","machinery","interior","safety"].includes(kind);
      else if(value==="xray"){
        if(kind==="deck"||kind==="structure")visible=false;
        if(kind==="shell")opacity=.12;if(kind==="superstructure")opacity=.22;if(kind==="cargo")opacity=.72;if(kind==="ballast")opacity=.23;
      }else{
        visible=!["deck","superstructure","fittings","structure"].includes(kind);
        if(kind==="shell")opacity=.09;
        if(value==="cargo"){if(kind==="machinery")visible=false;if(kind==="ballast")opacity=.20;}
        if(value==="engine"&&["cargo","ballast"].includes(kind))visible=false;
      }
      object.visible=visible;
      for(let ancestor:Object3D|null=object;ancestor;ancestor=ancestor.parent)if(ancestor.userData.symbolicMarker)object.visible=false;
      for(const material of Array.isArray(object.material)?object.material:[object.material]){
        material.opacity=opacity;material.transparent=opacity<1;material.depthWrite=opacity===1;material.needsUpdate=true;
        if("emissive" in material)(material as Material&{emissive:{setHex:(v:number)=>void}}).emissive.setHex(0);
      }
    }
  }
  function select(id:string,preservePreset=false){
    const object=root.getObjectByName(id);if(!object)return;
    const kind=layer(object);
    if(preservePreset)applyPreset(preset);
    else if(kind==="safety")applyPreset("fire");
    else if(kind==="interior")applyPreset("xray");
    else if(kind==="cargo"||kind==="ballast")applyPreset("cargo");
    else if(kind==="machinery")applyPreset("engine");
    else if(["exterior","cargo","engine"].includes(preset))applyPreset("exterior");
    else applyPreset(preset);
    const selected=new Set<Object3D>();object.traverse(o=>selected.add(o));
    for(const mesh of meshes)if(selected.has(mesh)){if(object.userData.symbolicMarker)mesh.visible=true;for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])if("emissive" in m)(m as Material&{emissive:{setHex:(v:number)=>void}}).emissive.setHex(0x493415);}
    return preset;
  }
  function focus(id?:string){
    const object=id?root.getObjectByName(id):root;
    const bounds=new Box3().setFromObject(object||root),size=bounds.getSize(new Vector3()),centre=bounds.getCenter(new Vector3());
    if(!id)centre.set(0,5,0);
    const distance=id?Math.max(3.8,Math.max(size.x,size.y,size.z)*1.8):76;
    return {centre,distance};
  }
  function setWireframe(value:boolean){for(const object of meshes)for(const material of Array.isArray(object.material)?object.material:[object.material])if("wireframe" in material){(material as Material&{wireframe:boolean}).wireframe=value;material.needsUpdate=true;}}
  function canPick(object:Object3D){if(!object.visible)return false;const m=(object as Mesh).material;if(m&&(Array.isArray(m)?m[0]:m).opacity<.35)return false;return true;}
  applyPreset("exterior");
  return {applyPreset,select,focus,setWireframe,canPick,getPreset:()=>preset};
}
