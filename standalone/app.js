import { AmbientLight, Color, DirectionalLight, GridHelper, Mesh, PerspectiveCamera, Raycaster, Scene, Texture, Vector2, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {createShipActions,inspectId,walkingZone} from "../lib/hai-yin-scene";
import {createWalkController} from "../lib/hai-yin-walk-controller";

const data=JSON.parse(document.getElementById("atlas-data").textContent);
const {vessel,register,equipment,profile,shipAssembly}=data;
const $=id=>document.getElementById(id);
$("interior-precision").textContent=data.interior.precision_cn;
$("fire-scope").textContent=data.interior.fire_register.modeled_scope_cn;
$("fire-conflict").textContent=data.interior.fire_register.conflicts[0].text_cn;
const node=(tag,className,text)=>{
  const value=document.createElement(tag);
  if(className) value.className=className;
  if(text!==undefined) value.textContent=String(text);
  return value;
};
const statusLabels={
  verified_source:"关键来源已核对",verified_latest_in_family:"图组内最新来源已核对",
  candidate_latest_stamp:"最新日期候选 · 待核验",candidate_single_source:"单一来源 · 待核验",
  earlier_stamp_candidate:"较早日期候选",exact_duplicate:"字节重复 · 归并",
  excluded_not_approved:"未获批准 · 排除",revision_review_required:"修订关系待核验",
};
const stampLabels={approved:"Approved（OCR / 人工状态见详情）",filed:"Filed · 不等同于 Approved",not_approved:"Not Approved",unconfirmed:"印章状态未确认"};
const normalize=value=>String(value??"").normalize("NFKC").toLowerCase().replace(/[\s_\-–—.,，。:：/\\()（）]+/g,"");
const sourceText=source=>`${source.file} · 第 ${source.page} 页`;
const detailDialog=$("detail-dialog");
function showDetails(title,fields){
  $("dialog-title").textContent=title;
  const list=node("dl","dialog-fields");
  for(const [label,value] of fields){
    const row=node("div");row.append(node("dt",null,label),node("dd",null,value||"未确认 / 未提供"));list.append(row);
  }
  $("dialog-content").replaceChildren(list);
  detailDialog.showModal();
}
$("dialog-close").addEventListener("click",()=>detailDialog.close());
detailDialog.addEventListener("click",event=>{if(event.target===detailDialog){const r=detailDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) detailDialog.close();}});

for(const [value,label] of [[vessel.sources.pdf_count,`PDF / ${vessel.sources.page_count} 页`],[vessel.sources.byte_duplicate_count,"份字节重复文件已归并"],[vessel.sources.not_approved_count,"份 Not Approved 图纸已排除"],[`${vessel.sources.verified_family_count} / ${vessel.sources.filename_family_count}`,"候选图组已人工核对关键来源"]]){
  const item=node("div");item.append(node("strong",null,value),node("span",null,label));$("stats").append(item);
}
const primaryFacts=new Set(["loa","lpp","breadth","depth","design-draft","frame-spacing"]);
for(const fact of vessel.facts){
  const item=node("div"),label=node("dt"),button=node("button",null,fact.label_cn);
  button.type="button";button.title="查看尺寸来源";
  button.addEventListener("click",()=>showDetails(fact.label_cn,[["数值",`${fact.value} ${fact.unit}`],["原始来源",sourceText(fact.source)],["核对状态","标注尺寸已核对"],["说明",fact.note_cn||"已保留来源页码。"],["原 PDF SHA-256",fact.source.sha256]]));
  label.append(button);item.append(label,node("dd",null,`${fact.value.toFixed(fact.id==="frame-spacing"?3:2)} ${fact.unit}`));
  $(primaryFacts.has(fact.id)?"dimensions":"extra-dimensions").append(item);
}
const coverageLabels={drawing_derived_envelope:"原矢量部件外形",drawing_calibrated_visualization:"按图标定的整船外形",compartment_envelopes:"按肋位布置的内舱包络",dimensioned_parameterization:"原尺寸参数化 · 剖面待核对",equipment_envelopes:"安装布置与设备包络",plan_measured_interior:"按图量取的可行走内部",source_location_symbolic_equipment:"原图位置 · 器材外形示意",source_tracing_in_progress:"型线核对与建模中",dimensions_registered:"肋位与舱容已登记",source_available_not_reconstructed:"原图可用 · 三维未完成",installation_data_available_detail_incomplete:"安装资料可用 · 细节未完成",topology_only_nts:"系统连接关系 · 无精确空间路由"};
for(const part of vessel.components){
  const item=node("article","coverage-item"),button=node("button",null,"查看来源与状态 →");button.type="button";
  item.append(node("p","status",coverageLabels[part.status]||part.status),node("h3",null,part.name_cn),node("p",null,part.note_cn));
  button.addEventListener("click",()=>showDetails(part.name_cn,[["数量",`${part.quantity}（资料登记）`],["完成状态",coverageLabels[part.status]||part.status],["当前范围",part.note_cn],["来源",sourceText(part.source)],["原 PDF SHA-256",part.source.sha256]]));
  item.append(button);$("coverage").append(item);
}
for(const tank of vessel.cargo_tanks){
  const item=node("div","tank");item.append(node("h3",null,`No.${tank.number} 货油舱`),node("strong",null,`${tank.capacity_each_m3.toFixed(1)} m³ × 2`),node("span",null,`FR${tank.frames[0]}–${tank.frames[1]} · 左舷 / 右舷`));$("tanks").append(item);
}
for(const conflict of vessel.conflicts){
  const item=node("div","conflict");item.append(node("p",null,conflict.text_cn),node("small",null,conflict.sources.map(sourceText).join("；")));$("conflicts").append(item);
}
for(const gap of vessel.required_for_complete_geometry) $("gaps").append(node("li",null,gap));

function decodeBase64(value){return Uint8Array.from(atob(value),c=>c.charCodeAt(0));}
const downloads={
  interior:()=>[JSON.stringify(data.interior,null,2),"hai-yin-i-interior-layout.json","application/json"],
  glb:()=>[decodeBase64(data.glb),"rudder-blade-envelope.glb","model/gltf-binary"],
  "ship-glb":()=>[decodeBase64(data.shipGlb),"hai-yin-i-visual-assembly.glb","model/gltf-binary"],
  assembly:()=>[JSON.stringify(shipAssembly,null,2),"hai-yin-i-ship-assembly.json","application/json"],
  profile:()=>[JSON.stringify(profile,null,2),"rudder-profile.json","application/json"],
  master:()=>[JSON.stringify(vessel,null,2),"hai-yin-i-master-data.json","application/json"],
  register:()=>[JSON.stringify(register,null,2),"source-register.json","application/json"],
  "drawings-csv":()=>[data.drawingCsv,"drawing-register.csv","text/csv;charset=utf-8"],
  "equipment-csv":()=>[data.equipmentCsv,"machinery-equipment-tables.csv","text/csv;charset=utf-8"],
  "equipment-json":()=>[JSON.stringify(equipment,null,2),"machinery-equipment-tables.json","application/json"],
};
document.querySelectorAll("[data-download]").forEach(button=>button.addEventListener("click",()=>{
  const [content,name,type]=downloads[button.dataset.download]();
  const url=URL.createObjectURL(new Blob([content],{type})),link=node("a");
  link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);$("download-status").textContent=`已准备下载：${name}`;
}));

const drawingTerms=[
  ["舵",/rudder|steering/i],["机舱",/engine|machinery|\ber\b/i],["主机",/main engine|\bme\b/i],
  ["锚",/anchor|windlass/i],["艏",/bow|stem|forecastle/i],["艉",/aft|stern/i],
  ["货油",/cargo|oil loading|oil transporting/i],["消防",/fire|co2/i],["阀",/valve/i],
  ["通风",/ventilation|air conditioning/i],["轴",/shaft/i],["桨",/propeller/i],
  ["结构",/structure|construction|bulkhead|shell/i],["电",/alarm|switchboard|electr|telephone|communication/i],
];
const drawingEntries=register.source_records.map(record=>({record,search:normalize(`${record.file} ${record.source_id} ${record.drawing_no_verified} ${record.class_reference_verified} ${statusLabels[record.selection]||record.selection} ${drawingTerms.filter(([,pattern])=>pattern.test(record.file)).map(([word])=>word).join(" ")}`)}));
let drawingPage=0,drawingMatches=drawingEntries;
const drawingSize=20;
function showDrawing(record){
  showDetails(record.file,[["资料编号",record.source_id],["PDF 页数",record.page_count],["文件大小",`${(record.bytes/1024).toFixed(1)} KB`],["候选状态",statusLabels[record.selection]||record.selection],["印章状态",stampLabels[record.stamp_status_detected]||record.stamp_status_detected],["人工核对",record.date_review==="visually_verified"?"关键来源已人工核对":"待人工复核；OCR 日期排序仅为候选筛选"],["候选日期",record.stamp_date_candidate],["日期 / 复核依据",record.date_evidence],["已核对图号",record.drawing_no_verified],["已核对船级参考号",record.class_reference_verified],["图组所选候选",record.selected_family_file],["字节重复，归并至",record.duplicate_of],["原文替代关系摘录",record.replacement_text],["原 PDF SHA-256",record.sha256],["资料范围","此 HTML 内嵌索引和提取数据，未包含原始 PDF。"]]);
}
function renderDrawings(){
  const count=drawingMatches.length,pages=Math.max(1,Math.ceil(count/drawingSize));drawingPage=Math.min(drawingPage,pages-1);
  $("drawing-count").textContent=`显示 ${count} / ${drawingEntries.length} 份文件`;
  const fragment=document.createDocumentFragment();
  for(const {record:r} of drawingMatches.slice(drawingPage*drawingSize,(drawingPage+1)*drawingSize)){
    const row=node("tr"),name=node("th");name.scope="row";name.append(node("small",null,r.source_id),document.createTextNode(r.file));
    const status=node("td",null,statusLabels[r.selection]||r.selection);status.append(node("span","cell-note",stampLabels[r.stamp_status_detected]||r.stamp_status_detected));
    const action=node("td"),button=node("button",null,"详情");button.type="button";button.setAttribute("aria-label",`查看 ${r.file} 详情`);button.addEventListener("click",()=>showDrawing(r));action.append(button);
    row.append(name,node("td",null,r.page_count),status,node("td",null,r.stamp_date_candidate||"待核对"),action);fragment.append(row);
  }
  if(!count){const row=node("tr"),cell=node("td","empty","没有匹配的图纸。可调整关键词或清除筛选。");cell.colSpan=5;row.append(cell);fragment.append(row);}
  $("drawing-rows").replaceChildren(fragment);$("drawing-page").textContent=`第 ${drawingPage+1} / ${pages} 页`;
  $("drawing-prev").disabled=drawingPage===0;$("drawing-next").disabled=drawingPage>=pages-1;
}
function filterDrawings(){
  const query=normalize($("drawing-search").value),filter=$("drawing-filter").value;
  drawingMatches=drawingEntries.filter(({record:r,search})=>(!query||search.includes(query))&&(
    filter==="all"||filter==="rejected"&&r.selection==="excluded_not_approved"||filter==="duplicates"&&r.selection==="exact_duplicate"||filter==="verified"&&r.date_review==="visually_verified"||filter==="pending"&&r.date_review!=="visually_verified"&&!["excluded_not_approved","exact_duplicate"].includes(r.selection)));
  drawingPage=0;renderDrawings();
}
$("drawing-search").addEventListener("input",filterDrawings);$("drawing-filter").addEventListener("change",filterDrawings);
$("drawing-clear").addEventListener("click",()=>{$("drawing-search").value="";$("drawing-filter").value="all";filterDrawings();});
$("drawing-prev").addEventListener("click",()=>{drawingPage--;renderDrawings();});$("drawing-next").addEventListener("click",()=>{drawingPage++;renderDrawings();});renderDrawings();

const equipmentEntries=equipment.rows.map(record=>({record,search:normalize(Object.values(record).join(" "))}));
let equipmentPage=0,equipmentMatches=equipmentEntries;
const equipmentSize=20;
function showEquipment(r){
  showDetails(`设备原表 · 第 ${r.source_page} 页 · ${r.row_id}`,[["原始来源",`${r.source_file} · 第 ${r.source_page} 页`],["原序号",r.sequence_raw],["图号 / 型号 / 名称原文",r.drawing_or_model_raw],["名称及规格原文",r.name_and_spec_raw],["数量原文",r.quantity_raw],["单位原文",r.unit_raw],["单件重量原文（kg）",r.weight_each_kg_raw],["总计重量原文（kg）",r.weight_total_kg_raw],["制造单位原文",r.manufacturer_raw],["附注原文",r.notes_raw],["复核状态","原表单元格已提取；续行、子项、型号适用性与双语重复仍待人工核对。不能把本行直接等同于一台设备。"]]);
}
function renderEquipment(){
  const count=equipmentMatches.length,pages=Math.max(1,Math.ceil(count/equipmentSize));equipmentPage=Math.min(equipmentPage,pages-1);
  $("equipment-count").textContent=`显示 ${count} / ${equipmentEntries.length} 个原表行 · 不是设备数量`;
  const fragment=document.createDocumentFragment();
  for(const {record:r} of equipmentMatches.slice(equipmentPage*equipmentSize,(equipmentPage+1)*equipmentSize)){
    const row=node("tr"),source=node("th",null,`第 ${r.source_page} 页`);source.scope="row";source.append(node("span","cell-note",`序号 ${r.sequence_raw||"续行"}`));
    const action=node("td"),button=node("button",null,"详情");button.type="button";button.setAttribute("aria-label",`查看设备原表行 ${r.row_id}`);button.addEventListener("click",()=>showEquipment(r));action.append(button);
    row.append(source,node("td",null,r.drawing_or_model_raw||"—"),node("td",null,r.name_and_spec_raw||"—"),node("td",null,`${r.quantity_raw||"—"} ${r.unit_raw}`),action);fragment.append(row);
  }
  if(!count){const row=node("tr"),cell=node("td","empty","没有匹配的原表行。请尝试另一关键词或页码。");cell.colSpan=5;row.append(cell);fragment.append(row);}
  $("equipment-rows").replaceChildren(fragment);$("equipment-page").textContent=`第 ${equipmentPage+1} / ${pages} 页`;
  $("equipment-prev").disabled=equipmentPage===0;$("equipment-next").disabled=equipmentPage>=pages-1;
}
function filterEquipment(){
  const query=normalize($("equipment-search").value),page=$("equipment-page-filter").value;
  equipmentMatches=equipmentEntries.filter(({record:r,search})=>(!query||search.includes(query))&&(page==="all"||String(r.source_page)===page));equipmentPage=0;renderEquipment();
}
for(const page of equipment.pages){
  for(const id of ["equipment-page-filter","native-page"]){const option=node("option",null,`第 ${page.page} 页`);option.value=String(page.page);$(id).append(option);}
}
$("equipment-search").addEventListener("input",filterEquipment);$("equipment-page-filter").addEventListener("change",filterEquipment);
$("equipment-clear").addEventListener("click",()=>{$("equipment-search").value="";$("equipment-page-filter").value="all";filterEquipment();});
$("equipment-prev").addEventListener("click",()=>{equipmentPage--;renderEquipment();});$("equipment-next").addEventListener("click",()=>{equipmentPage++;renderEquipment();});renderEquipment();
function nativePage(){const p=equipment.pages.find(p=>String(p.page)===$("native-page").value);$("native-text").textContent=p?.native_text||"此页没有可提取的原生文字，请查阅原 PDF。";}
$("native-page").value="2";$("native-page").addEventListener("change",nativePage);nativePage();

let viewer=null,generation=0;
let selectedId="",activePreset="exterior";
for(const target of shipAssembly.targets){const option=node("option",null,target.name_cn);option.value=target.id;$("ship-target").append(option);}
function selectionInfo(id=""){
  const target=shipAssembly.targets.find(t=>t.id===id);$("ship-target").value=id;
  const box=$("ship-selection");box.replaceChildren(node("strong",null,target?.name_cn||"独立 Hai Yin I · 整船可视化装配"),node("p",null,target?.note_cn||shipAssembly.scope_cn));
  if(target)box.append(node("small",null,`来源：${target.sources.map(sourceText).join("；")} / 精度：${target.confidence}`));
}
selectionInfo();
function disposeScene(scene){
  const geometries=new Set(),materials=new Set(),textures=new Set();
  scene.traverse(object=>{
    if(object.geometry) geometries.add(object.geometry);
    for(const material of object.material?(Array.isArray(object.material)?object.material:[object.material]):[]){materials.add(material);for(const value of Object.values(material)) if(value instanceof Texture) textures.add(value);}
  });
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}
function fallback(message="Hai Yin I 二维整船布置 · 可打开三维"){
  generation++;if(viewer){viewer.dispose();viewer=null;}
  $("profile").hidden=false;$("three-host").hidden=true;$("model-loading").hidden=true;
  $("three-host").removeAttribute("data-ready");
  $("open-3d").hidden=false;$("open-3d").disabled=false;$("show-profile").hidden=true;$("camera-tools").hidden=true;
  $("viewer-status").textContent=message;$("wireframe").checked=false;
  $("walk-panel").hidden=true;
}
async function openModel(){
  const version=++generation;$("open-3d").hidden=true;$("show-profile").hidden=false;$("model-loading").hidden=false;
  $("viewer-status").textContent="正在准备三维模型…";
  let renderer,scene,controls,walk,resizeObserver,frame=0,disposed=false,lossHandler,visibilityHandler,flight=null,lastTime=0;
  const host=$("three-host");
  const cleanup=()=>{
    if(disposed) return;disposed=true;cancelAnimationFrame(frame);
    resizeObserver?.disconnect();if(visibilityHandler) document.removeEventListener("visibilitychange",visibilityHandler);
    if(renderer&&lossHandler) renderer.domElement.removeEventListener("webglcontextlost",lossHandler);
    walk?.dispose();controls?.dispose();if(scene) disposeScene(scene);
    if(renderer){renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
  };
  try{
    const canvas=document.createElement("canvas");
    const context=canvas.getContext("webgl2",{antialias:true,alpha:false,powerPreference:"low-power",failIfMajorPerformanceCaveat:true});
    if(!context) throw new Error("unsupported");
    renderer=new WebGLRenderer({canvas,context});renderer.setClearColor(new Color("#173541"));
    scene=new Scene();const camera=new PerspectiveCamera(40,1,.04,500);
    scene.add(new AmbientLight(0xffffff,1.8));const light=new DirectionalLight(0xffffff,3);light.position.set(30,45,25);scene.add(light);
    const grid=new GridHelper(100,50,0x73969b,0x35565e);grid.position.y=-.04;scene.add(grid);
    const bytes=decodeBase64(data.shipGlb);const asset=await new GLTFLoader().parseAsync(bytes.buffer,"");scene.add(asset.scene);
    if(version!==generation){cleanup();return;}
    host.replaceChildren(canvas);host.hidden=false;$("profile").hidden=true;
    canvas.setAttribute("aria-label","海银一号独立整船模型，点选部件聚焦，拖动旋转");
    controls=new OrbitControls(camera,canvas);controls.enableDamping=false;controls.minDistance=1.5;controls.maxDistance=180;
    const actions=createShipActions(asset.scene);
    const invalidate=()=>{if(disposed||frame||document.hidden)return;frame=requestAnimationFrame(now=>{
      frame=0;if(disposed)return;
      const delta=Math.min(.05,(now-(lastTime||now-16))/1000);lastTime=now;if(walk?.tick(delta))invalidate();
      if(flight){const t=Math.min(1,(now-flight.start)/650),e=t*t*(3-2*t);camera.position.lerpVectors(flight.from,flight.to,e);controls.target.lerpVectors(flight.targetFrom,flight.targetTo,e);controls.update();if(t===1)flight=null;else invalidate();}
      renderer.render(scene,camera);
    });};
    const setCamera=(view,immediate=false)=>{
      if(walk?.active())return;
      const focus=actions.focus(selectedId||(activePreset==="engine"?"hyi_engine_room":activePreset==="cargo"?"hyi_cargo_tanks":undefined));
      camera.up.set(0,view==="top"?0:1,view==="top"?-1:0);
      const direction=view==="front"?new Vector3(0,.12,1):view==="side"?new Vector3(1,.13,0):view==="top"?new Vector3(0,1,.0001):new Vector3(.82,.46,1);
      const to=focus.centre.clone().add(direction.normalize().multiplyScalar(focus.distance));
      if(immediate||matchMedia("(prefers-reduced-motion:reduce)").matches){camera.position.copy(to);controls.target.copy(focus.centre);controls.update();}
      else flight={start:performance.now(),from:camera.position.clone(),to,targetFrom:controls.target.clone(),targetTo:focus.centre};
      invalidate();
      host.dataset.camera=view;document.querySelectorAll("[data-camera]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.camera===view)));
    };
    function syncPreset(){host.dataset.preset=activePreset;document.querySelectorAll("[data-preset]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.preset===activePreset)));}
    walk=createWalkController(camera,canvas,data.interior,invalidate,updateWalkState);
    function choose(id){if(!id){preset("exterior");return;}selectedId=id;activePreset=actions.select(id,walk.active())||activePreset;selectionInfo(id);syncPreset();setCamera("reset");}
    function preset(value){activePreset=value;selectedId="";flight=null;actions.applyPreset(value);const zone=walkingZone(value);controls.enabled=!zone;$("walk-panel").hidden=!zone;document.querySelectorAll("[data-camera]").forEach(b=>b.disabled=!!zone);if(zone)walk.enter(zone);else walk.exit();selectionInfo(value==="cargo"?"hyi_cargo_tanks":value==="engine"?"hyi_engine_room":"");syncPreset();setCamera("reset");invalidate();}
    const raycaster=new Raycaster(),pointer=new Vector2();let pointerStart=null;
    canvas.addEventListener("pointerdown",event=>{pointerStart=[event.clientX,event.clientY];});
    canvas.addEventListener("pointerup",event=>{if(!pointerStart||Math.hypot(event.clientX-pointerStart[0],event.clientY-pointerStart[1])>4)return;const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(asset.scene,true).find(hit=>actions.canPick(hit.object));const id=hit&&inspectId(hit.object);if(id)choose(id);});
    const resize=()=>{
      if(disposed)return;const {width,height}=host.getBoundingClientRect();
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,matchMedia("(max-width:760px), (pointer:coarse)").matches?1.25:1.5));
      renderer.setSize(Math.max(1,width),Math.max(1,height));camera.aspect=Math.max(1,width)/Math.max(1,height);camera.updateProjectionMatrix();invalidate();
    };
    lossHandler=event=>{event.preventDefault();fallback("3D 上下文已中断 · 已恢复二维整船布置，可重新打开三维");};
    canvas.addEventListener("webglcontextlost",lossHandler);controls.addEventListener("change",invalidate);
    controls.addEventListener("start",()=>{flight=null;});
    visibilityHandler=()=>{if(!document.hidden)invalidate();};document.addEventListener("visibilitychange",visibilityHandler);
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();actions.applyPreset(activePreset);syncPreset();setCamera("reset",true);
    viewer={dispose:cleanup,setCamera,choose,preset,walk,setWireframe(value){actions.setWireframe(value);invalidate();}};
    if(walkingZone(activePreset))preset(activePreset);
    host.dataset.ready="true";$("camera-tools").hidden=false;$("model-loading").hidden=true;
    $("viewer-status").textContent="Hai Yin I 整船 · 点选聚焦 · 拖动旋转 · 静止时停止渲染";
  }catch(error){cleanup();if(version===generation)fallback("3D 不可用 · 已显示二维整船布置，可重试打开三维");}
}
$("open-3d").addEventListener("click",openModel);$("show-profile").addEventListener("click",()=>fallback());
document.querySelectorAll("[data-camera]").forEach(button=>button.addEventListener("click",()=>viewer?.setCamera(button.dataset.camera)));
$("wireframe").addEventListener("change",event=>viewer?.setWireframe(event.target.checked));
$("ship-target").addEventListener("change",event=>{if(viewer)viewer.choose(event.target.value);else selectionInfo(event.target.value);});
document.querySelectorAll("[data-preset]").forEach(button=>button.addEventListener("click",async()=>{if(!viewer)await openModel();viewer?.preset(button.dataset.preset);}));
$("ship-reset").addEventListener("click",()=>viewer?.choose(""));
window.addEventListener("pagehide",()=>fallback());
let currentWalkZone="main";
function updateWalkState(state){currentWalkZone=state.zone;$("walk-level").textContent=data.interior.zones[state.zone].name_cn;$("walk-room").textContent=state.room;$("walk-stairs").hidden=state.zone==="engine";$("stair-hint").hidden=state.zone==="engine";$("walk-stairs").textContent=state.zone==="main"?"去楼梯上楼":"去楼梯下楼";const select=$("walk-room-select");select.replaceChildren(node("option",null,"选择房间查看内部…"));select.firstChild.value="";for(const room of data.interior.rooms.filter(r=>r.zone===state.zone)){const option=node("option",null,room.name_cn);option.value=room.id;select.append(option);}}
$("walk-room-select").addEventListener("change",event=>{if(event.target.value)viewer?.walk.enter(currentWalkZone,event.target.value);event.target.value="";});
$("walk-stairs").addEventListener("click",()=>viewer?.walk.stairs());$("walk-exit").addEventListener("click",()=>viewer?.preset("exterior"));
document.querySelectorAll("[data-walk-dir]").forEach(button=>{const direction=button.dataset.walkDir;const release=()=>viewer?.walk.hold(direction,false);button.addEventListener("pointerdown",event=>{event.preventDefault();button.setPointerCapture(event.pointerId);viewer?.walk.hold(direction,true);});for(const name of ["pointerup","pointercancel","lostpointercapture","blur"])button.addEventListener(name,release);button.addEventListener("keydown",event=>{if(event.key===" "||event.key==="Enter"){event.preventDefault();viewer?.walk.hold(direction,true,false);}});button.addEventListener("keyup",release);});
requestAnimationFrame(()=>openModel());
