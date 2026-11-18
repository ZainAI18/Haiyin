import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {Box3,BoxGeometry,BufferGeometry,Color,CylinderGeometry,DoubleSide,ExtrudeGeometry,Float32BufferAttribute,Group,Mesh,MeshStandardMaterial,Quaternion,Scene,Shape,SphereGeometry,Vector2,Vector3} from "three";
import {GLTFExporter} from "three/addons/exporters/GLTFExporter.js";
import {mergeGeometries} from "three/addons/utils/BufferGeometryUtils.js";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const base=resolve(root,"public/hai-yin-i");
const plan=JSON.parse(await readFile(resolve(base,"geometry/ship-plan.json"),"utf8"));
const rudder=JSON.parse(await readFile(resolve(base,"geometry/rudder-profile.json"),"utf8"));
const register=JSON.parse(await readFile(resolve(base,"audit/source-register.json"),"utf8"));
const materials={};
for(const [id,color] of Object.entries({hull:0x194859,red:0xa84232,deck:0x647a66,white:0xe9e5d8,trim:0x243c43,glass:0x28566b,bronze:0x99703c,steel:0x7d9090,engine:0x436f86,tank1:0xe0a15b,tank2:0xbea65d,tank3:0xcb8656,tank4:0xad9277,ballast:0x668eac,black:0x273233,aux:0x6e8390})){
  materials[id]=new MeshStandardMaterial({color,roughness:id==="glass"?.2:.72,metalness:id==="bronze"?.7:.18,side:DoubleSide});
}
const scene=new Scene();scene.name="hai_yin_i_whole_vessel_visualization";
scene.userData={vessel:"MT Hai Yin I",vessel_identity:"RI88792 / WZ029",unit:"metre",full_exterior_extent:true,detailed_reconstruction_complete:false,independent_of_teaching_vessel:true,precision:"Mixed: dimensioned parameters, vector-plan contours, interpolated hull and symbolic equipment. Not a verified fabrication model."};
const targets=[];
function source(file,page=1){const record=register.source_records.find(r=>r.file===file);if(!record)throw Error(file);if(record.stamp_status_detected==="not_approved")throw Error("Rejected geometry source: "+file);return {file,page,sha256:record.sha256};}
const structural=source("General Structure Plan Rev2.pdf"),ga=source("General Arrangement Plan RevA1.pdf"),spec=source("Hull Specification.pdf",6);
function component(id,name,layer,confidence,note,sources=[structural],parent=scene){
  const group=new Group();group.name=id;group.userData={inspectId:id,name_cn:name,layer,confidence,note_cn:note,sources};parent.add(group);
  targets.push({id,name_cn:name,layer,confidence,note_cn:note,sources});return group;
}
function mesh(name,geometry,material,parent){const value=new Mesh(geometry,materials[material]||material);value.name=name;parent.add(value);return value;}
function box(name,size,pos,mat,parent){const m=mesh(name,new BoxGeometry(...size),mat,parent);m.position.set(...pos);return m;}
function cylinder(name,radius,height,pos,mat,parent,radiusTop=radius){const m=mesh(name,new CylinderGeometry(radiusTop,radius,height,16),mat,parent);m.position.set(...pos);return m;}
function beam(name,a,b,r,mat,parent){const av=new Vector3(...a),bv=new Vector3(...b),d=bv.clone().sub(av);const m=mesh(name,new CylinderGeometry(r,r,d.length(),8),mat,parent);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new Vector3(0,1,0),d.normalize());return m;}
function mergeChildren(group,name){const geometries=[];let material;for(const child of [...group.children])if(child instanceof Mesh){child.updateMatrix();geometries.push(child.geometry.clone().applyMatrix4(child.matrix));material=child.material;child.geometry.dispose();group.remove(child);}if(geometries.length){const joined=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());mesh(name,joined,material,group);}}
function sample(points,x){if(x<=points[0][0])return points[0][1];for(let i=1;i<points.length;i++){if(x<=points[i][0]){const t=(x-points[i-1][0])/(points[i][0]-points[i-1][0]);return points[i-1][1]+t*(points[i][1]-points[i-1][1]);}}return points.at(-1)[1];}
const fx=f=>plan.frame_zero_x_m+f*.56;
const outline=plan.upper_deck_half_outline_xz_m;
const end=outline.at(-1)[0],start=outline[0][0];
const width=x=>Math.max(.003,sample(outline,x));
const deckY=x=>4.18+.05*Math.max(0,(-x-17)/8)**2+.535*Math.max(0,(x-15)/(end-15))**2;
function hullSection(x){
  const w=width(x),bottom=x<plan.aft_keel_profile_xy_m.at(-1)[0]?sample(plan.aft_keel_profile_xy_m,x):0;
  const top=deckY(x),radius=Math.min(1.35,w*.7,(top-bottom)*.7),right=[[0,bottom],[Math.max(0,w-radius),bottom]];
  for(let i=1;i<=9;i++){const t=i/9*Math.PI/2;right.push([w-radius+radius*Math.sin(t),bottom+radius*(1-Math.cos(t))]);}
  right.push([w,(bottom+radius+top)/2],[w,top]);
  return [...right,...[[w*.5,top+.075],[0,top+.1],[-w*.5,top+.075]],...right.slice(1).reverse().map(([z,y])=>[-z,y])];
}
function loft(rings,paint=false){
  const positions=[],indices=[],colors=[];const n=rings[0].length;
  rings.forEach(ring=>ring.forEach(p=>{positions.push(...p);if(paint){const color=new Color(p[1]<3.4?0x983f31:0x214e5c);colors.push(color.r,color.g,color.b);}}));
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n,c=(i+1)*n+j,d=(i+1)*n+(j+1)%n;indices.push(a,c,b,b,c,d);}
  for(const [ringIndex,flip] of [[0,false],[rings.length-1,true]]){const centre=[0,0,0];rings[ringIndex].forEach(p=>p.forEach((v,i)=>centre[i]+=v/n));const ci=positions.length/3;positions.push(...centre);if(paint){const color=new Color(centre[1]<3.4?0x983f31:0x214e5c);colors.push(color.r,color.g,color.b);}for(let j=0;j<n;j++){const a=ringIndex*n+j,b=ringIndex*n+(j+1)%n;indices.push(...(flip?[ci,a,b]:[ci,b,a]));}}
  const g=new BufferGeometry();g.setAttribute("position",new Float32BufferAttribute(positions,3));if(paint)g.setAttribute("color",new Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function planSolid(half,bottom,top){const polygon=[...half,...half.slice(0,-1).reverse().map(([x,z])=>[x,-z])];const shape=new Shape(polygon.map(([x,z])=>new Vector2(x,-z)));const g=new ExtrudeGeometry(shape,{depth:top-bottom,bevelEnabled:false,steps:1});g.rotateX(-Math.PI/2);g.translate(0,bottom,0);return g;}

const hull=component("hyi_hull","船体外壳","shell","interpolated_envelope",plan.precision_cn);
const stations=[start,...Array.from({length:100},(_,i)=>start+(end-start)*(i+1)/101),end];
const hullMaterial=materials.hull.clone();hullMaterial.vertexColors=true;hullMaterial.color.setHex(0xffffff);
mesh("closed_hull_shell",loft(stations.map(x=>hullSection(x).map(([z,y])=>[x,y,z])),true),hullMaterial,hull);
const bulb=component("hyi_bow_bulb","球鼻艏（横剖面待核对）","shell","provisional_lateral_section","侧轮廓来自总结构图；横向截面用椭圆近似，尚未按各站型线完成校验。非制造精确外形。");
const bow=plan.bow_profile_xy_m,bulbMax=Math.max(...bow.map(p=>p[0]));
const bulbMesh=mesh("bow_bulb_envelope",new SphereGeometry(1,28,16),"red",bulb);bulbMesh.scale.set(2.3,1.52,.9);bulbMesh.position.set(bulbMax-2.3,1.52,0);
const deck=component("hyi_main_deck","主甲板","deck","plan_contour_envelope","平面外轮廓按 B 版总结构图提取；面形简化，未重建每根甲板梁。整体单位为米。");
function deckRing(x,w,y){const top=[-1,-.5,0,.5,1].map(t=>[x,y+.1*(1-t*t)+.025,w*t]);return [...top,...top.slice().reverse().map(([x,y,z])=>[x,y-.02,z])];}
mesh("main_deck",loft(stations.map(x=>deckRing(x,width(x),deckY(x)))),"deck",deck);
const fc=component("hyi_forecastle","艏楼及艏甲板","shell","two_view_interpolation","B 版艏楼甲板矢量轮廓；艉缘约 FR77，艏端与总长 49.90 m 对齐。上下轮廓之间采用插值面。",[structural,source("Forecastle Deck Structure Rev3.pdf")]);
const fp=plan.forecastle_half_outline_xz_m,fcStart=fp[0][0],fcEnd=fp.at(-1)[0];
const fcRings=Array.from({length:28},(_,i)=>{const t=i/27,x=fcStart+(fcEnd-fcStart)*t,bx=fcStart+(end-fcStart)*t,w=sample(fp,x),bw=width(bx),y=6.08+.535*t*t;return [[bx,deckY(bx),-bw],[bx,deckY(bx),bw],[x,y,w],[x,y+.10,0],[x,y,-w]];});
mesh("forecastle_flared_shell",loft(fcRings),"hull",fc);
const fcDeck=component("hyi_forecastle_deck","艏楼甲板面","deck","plan_contour_envelope","艏楼平面轮廓与 FR77 位置来自 B 版总结构图；舷弧按标注值插值。");
mesh("forecastle_deck",loft(Array.from({length:28},(_,i)=>{const t=i/27,x=fcStart+(fcEnd-fcStart)*t;return deckRing(x,sample(fp,x),6.08+.535*t*t);})),"deck",fcDeck);

const house=component("hyi_accommodation","艉部生活楼","superstructure","projection_measured_envelope","独立 Hai Yin I 上层建筑。层高依据规格书；平面边界按总布置投影量取，门窗和房间未全部施工级复原。",[ga,source("Hull Specification.pdf",5)]);
box("accommodation_lower",[(17-4)*.56,2.3,7.8],[fx(10.5),5.33,0],"white",house);
box("life_saving_deck",[(20-1)*.56,.10,9.4],[fx(10.5),6.48,0],"white",house);
box("accommodation_upper",[(17-7)*.56,2.2,6.2],[fx(12),7.58,0],"white",house);
box("navigation_deck",[6.1,.10,7.6],[fx(12),8.68,0],"white",house);
const bridge=component("hyi_bridge","驾驶室","superstructure","projection_measured_envelope","驾驶甲板、罗经甲板高度分别按 8.68 m / 11.08 m；玻璃分格为示意，待按门窗图逐项核对。",[ga,source("Hull Specification.pdf",5)]);
box("wheelhouse",[4.7,2.4,5.4],[fx(12),9.88,0],"white",bridge);
box("compass_deck",[5.1,.12,5.8],[fx(12),11.08,0],"white",bridge);
for(const side of [-1,1]){
  for(let i=0;i<4;i++)box(`bridge_side_window_${side}_${i}`,[.78,.85,.035],[fx(12)-1.65+i*1.08,10.2,side*2.715],"glass",bridge);
  if(side===1)for(let i=0;i<4;i++)box(`wheelhouse_forward_window_${i}`,[.035,.85,1.02],[fx(12)+2.365,10.2,(i-1.5)*1.22],"glass",bridge);
  for(const f of [7,10,14,16]){const p=cylinder(`porthole_${side}_${f}`,.16,.045,[fx(f),5.55,side*3.92],"glass",house);p.rotation.x=Math.PI/2;}
  for(const f of [8,11,15])box(`upper_window_${side}_${f}`,[.48,.6,.035],[fx(f),7.72,side*3.115],"glass",house);
  // Stair geometry is illustrative, with deck levels controlled by the source.
  const stairGroup=new Group();house.add(stairGroup);for(let i=0;i<12;i++)box("stair_step",[.26,.10,.8],[fx(3)+i*.24,4.3+i*.19,side*4.28],"steel",stairGroup);mergeChildren(stairGroup,`stair_${side}`);
}

const bulkheads=component("hyi_bulkheads","主要横舱壁","structure","frame_positioned_surfaces","FR20、34、48、63、79 位置来自最新总结构图；只建主要舱壁外形，尚无全部加强材和开孔。");
for(const f of [20,34,48,63,79]){const x=fx(f),w=Math.max(.1,width(x)-.86);box(`transverse_bulkhead_fr${f}`,[.01,3.30,w*2],[x,2.51,0],"steel",bulkheads);}
const tanks=component("hyi_cargo_tanks","八个货油舱","cargo","compartment_envelopes","四对八舱按最新 B 版规格书的肋位布置。显示几何为内舱包络，未用于反算容积；标注容量来自原表。",[spec]);
const tankDefs=[[1,63,79,85.6],[2,48,63,112.3],[3,34,48,104.9],[4,20,34,100.7]];
for(const [number,a,b,capacity] of tankDefs)for(const [side,sign] of [["port",1],["starboard",-1]]){
  const tank=component(`hyi_cargo_${number}_${side}`,`No.${number} 货油舱 · ${side==="port"?"左舷":"右舷"}`,"cargo","compartment_envelope",`FR${a}–${b}；单舱 ${capacity} m³（原表）。包络包含简化舭部，细部及真实容积尚未几何校验。`,[spec],tanks);
  const rings=Array.from({length:12},(_,i)=>{const x=fx(a)+(fx(b)-fx(a))*i/11,w=Math.max(.03,width(x)-.86),r=Math.min(.50,w*.4);return [[x,.86,sign*.01],[x,.86,sign*(w-r)],[x,1.24,sign*w],[x,4.14,sign*w],[x,4.14,sign*.01]];});
  const tankMaterial=materials[`tank${number}`].clone();if(sign<0)tankMaterial.color.offsetHSL(0,0,-.10);
  mesh(`cargo_tank_no${number}_${side}`,loft(rings),tankMaterial,tank);tank.userData.capacity_source_m3=capacity;tank.userData.frames=[a,b];
}
const ballast=component("hyi_ballast_tanks","双舷压载舱包络","ballast","compartment_envelopes","按货油区域外侧与双层底概念显示四对舷侧压载包络。肋位对应 B 版规格书，局部舱形仍需逐站复核。",[spec]);
for(const [number,a,b] of tankDefs)for(const sign of [-1,1]){
  const rings=Array.from({length:10},(_,i)=>{const x=fx(a)+(fx(b)-fx(a))*i/9,w=width(x);return [[x,.86,sign*Math.max(.01,w-.86)],[x,.86,sign*w],[x,4.14,sign*w],[x,4.14,sign*Math.max(.01,w-.86)]];});
  mesh(`ballast_no${number}_${sign>0?"port":"starboard"}`,loft(rings),"ballast",ballast);
}
const engineRoom=component("hyi_engine_room","机舱及双机布置","machinery","mixed_installation_and_proxies","机舱与双机独立重建。双轴中心距中线 ±2.500 m、轴线 BL+0.950 m 有原图尺寸；设备外形为安装图量取包络，辅助设备位置未完成施工级校验。",[source("Main Engine and Gearbox Installation.pdf"),ga]);
box("engine_room_floor",[14*.56,.06,8.0],[fx(13),.86,0],"steel",engineRoom);
function engineTemplate(){const group=new Group();box("engine_block",[1.62,.83,.70],[0,.55,0],"engine",group);box("sump",[1.58,.25,.60],[0,.05,0],"trim",group);box("cylinder_head",[1.7,.18,.78],[0,1.04,0],"engine",group);for(let i=0;i<6;i++)box("head_cover",[.21,.13,.65],[-.64+i*.255,1.19,0],"steel",group);const turbo=cylinder("turbocharger",.23,.36,[.62,1.38,.20],"steel",group);turbo.rotation.x=Math.PI/2;beam("exhaust_manifold",[-.7,1.07,-.42],[.65,1.07,-.42],.09,"trim",group);return group;}
const template=engineTemplate();
for(const [side,sign] of [["port",1],["starboard",-1]]){
  const group=component(`hyi_main_engine_${side}`,`NT855-M 主机 · ${side==="port"?"左舷":"右舷"}`,"machinery","equipment_envelope",`两台主机之一，201 kW。横向轴线 ${sign*2.5} m，轴线高度 0.950 m；外壳、附件与安装纵坐标仍是按图量取的包络，不代表厂家精确 CAD。`,[source("Main Engine and Gearbox Installation.pdf"),source("List of Machinery Equipments.pdf",2)],engineRoom);
  const engine=template.clone(true);engine.name=`nt855m_${side}`;engine.position.set(fx(11.5),.98,sign*2.5);group.add(engine);
  box(`gearbox_d300_${side}`,[.72,.78,.83],[fx(8.8),1.12,sign*2.5],"engine",group);
  beam(`shaft_${side}`,[fx(2.5),.95,sign*2.5],[fx(8.8),.95,sign*2.5],.075,"steel",group);
}
const aux=component("hyi_generators","两台柴油发电机组（包络）","machinery","symbolic_equipment","CCFJ50J-Y，2 台，来自机械设备明细表第 3 页。当前为辅助设备占位包络，安装位置和厂家外形待核实。",[source("List of Machinery Equipments.pdf",3)],engineRoom);
for(const sign of [-1,1]){box(`generator_envelope_${sign}`,[1.65,.85,.78],[fx(15.3),1.32,sign*2.65],"aux",aux);cylinder(`alternator_${sign}`,.30,.65,[fx(16.6),1.3,sign*2.65],"steel",aux).rotation.z=Math.PI/2;}
const fuel=component("hyi_diesel_tanks","柴油舱位置标记","machinery","location_markers","最新规格书将柴油舱由 FR8–11 移至 FR17–20，单舱 6.4 m³。圆球仅标记位置，不代表舱形或尺寸。",[spec],engineRoom);
fuel.userData.symbolicMarker=true;
for(const sign of [-1,1]){const m=mesh(`diesel_location_${sign}`,new SphereGeometry(.22,12,8),"bronze",fuel);m.position.set(fx(18.5),2.3,sign*3.4);}

const propellers=component("hyi_propellers","双螺旋桨","propulsion","dimensioned_outline_parameterization","MAU、直径 1.730 m、4 叶、螺距比 0.664、后倾 10°来自桨图。弦长/厚度用原表参数化，剖面曲线仍为近似，尚未逐条复原原偏移表。",[source("Propeller Plan.pdf")]);
const radial=[.2,.3,.4,.5,.6,.7,.8,.9,.95,1],ct=[109.32,130.78,151.54,170.23,187.51,200.69,204.83,189.59,164.49,67.60],cl=[150.84,173.01,188.92,198.62,199.99,188.88,158.46,98.25,52.98,0],thick=[50.63,45.37,40.10,34.83,29.57,24.30,19.03,13.77,11.13,8.50];
const bladeRings=radial.map((rr,i)=>{const radius=.865*rr,pitch=Math.atan(1.730*.664/(2*Math.PI*radius)),ring=[];for(let j=0;j<24;j++){const t=j/24*2*Math.PI,u=(1-Math.cos(t))/2,chord=(ct[i]+cl[i])/1000,s=(u-.5)*chord,th=thick[i]/2000*Math.sin(t),axial=radius*Math.tan(Math.PI/18)+s*Math.sin(pitch)+th*Math.cos(pitch),tangential=s*Math.cos(pitch)-th*Math.sin(pitch);ring.push([axial,radius,tangential]);}return ring;});
const bladeGeometry=loft(bladeRings);
for(const [side,sign] of [["port",1],["starboard",-1]]){const p=new Group();p.name=`propeller_${side}`;p.position.set(fx(2.5),.95,sign*2.5);p.scale.z=sign;propellers.add(p);const hub=cylinder("propeller_hub",.145,.40,[0,0,0],"bronze",p,.12);hub.rotation.z=Math.PI/2;for(let i=0;i<4;i++){const blade=mesh(`propeller_blade_${i+1}`,bladeGeometry,"bronze",p);blade.rotation.x=i*Math.PI/2;}}
const rudders=component("hyi_rudders","双舵叶及舵杆","propulsion","mixed_vector_outline_and_layout","舵叶轮廓为原矢量提取，弦长 1.400 m、高 2.080 m；船上纵向安装位置仍按总布置量取，舵杆外形及法兰未完成精确重建。",[source("Rudder Blade Construction.pdf"),ga]);
const rudderGeometry=new ExtrudeGeometry(new Shape(rudder.profile_xy_m.map(([x,y])=>new Vector2(x,y))),{depth:rudder.height_m,steps:1,bevelEnabled:false});rudderGeometry.rotateX(-Math.PI/2);
for(const [side,sign] of [["port",1],["starboard",-1]]){const r=mesh(`rudder_${side}`,rudderGeometry,"steel",rudders);r.position.set(fx(-1),.08,sign*2.5);cylinder(`rudder_stock_${side}`,.09,1.8,[fx(-1)+.98,2.46,sign*2.5],"steel",rudders);}

const rails=component("hyi_rails","舷墙、栏杆与通道","fittings","schematic_fittings","栏杆、支柱与舷墙用可见简化构件表达，尚未逐件复原节点和所有局部尺寸。",[source("Hand Rail & Bulwark & Ladder Arrangement Rev2.pdf"),ga]);
for(const sign of [-1,1]){const g=new Group();rails.add(g);for(let i=1;i<outline.length;i++){const a=outline[i-1],b=outline[i];if(b[0]>fcStart)continue;beam("guardrail",[a[0],deckY(a[0])+1.0,sign*a[1]],[b[0],deckY(b[0])+1.0,sign*b[1]],.025,"white",g);beam("guardrail_mid",[a[0],deckY(a[0])+.5,sign*a[1]],[b[0],deckY(b[0])+.5,sign*b[1]],.018,"white",g);}for(let x=start+.5;x<fcStart;x+=2)beam("stanchion",[x,deckY(x),sign*width(x)],[x,deckY(x)+1,sign*width(x)],.023,"white",g);mergeChildren(g,`side_guardrails_${sign}`);}
for(const sign of [-1,1]){const g=new Group();rails.add(g);for(let i=1;i<fp.length;i++){const a=fp[i-1],b=fp[i],ay=6.08+.535*((a[0]-fcStart)/(fcEnd-fcStart))**2,by=6.08+.535*((b[0]-fcStart)/(fcEnd-fcStart))**2;beam("forecastle_guardrail",[a[0],ay+.45,sign*a[1]],[b[0],by+.45,sign*b[1]],.025,"white",g);beam("forecastle_stanchion",[a[0],ay,sign*a[1]],[a[0],ay+.45,sign*a[1]],.02,"white",g);}mergeChildren(g,`forecastle_guardrails_${sign}`);}
const windlass=component("hyi_windlass","艏部双锚机组","fittings","schematic_equipment","位置依据总布置；现为锚机示意构件。未采用盖 Not Approved 的基座提交图作为几何依据，厂家细节待核对。",[ga]);
box("windlass_bed",[1.3,.16,3.0],[fx(81.2),6.35,0],"trim",windlass);beam("windlass_shaft",[fx(81.2),6.85,-1.65],[fx(81.2),6.85,1.65],.11,"steel",windlass);
for(const sign of [-1,1]){const wheel=cylinder(`chain_wheel_${sign}`,.38,.34,[fx(81.2),6.85,sign*.9],"steel",windlass);wheel.rotation.x=Math.PI/2;}
const anchors=component("hyi_anchors","左右舷锚与锚链标记","fittings","schematic_equipment","总布置可辨认的双锚位置；锚爪、链节尺寸为示意，不能作为真实锚具加工或校核尺寸。",[ga]);
for(const sign of [-1,1]){const a=new Group();a.name=`anchor_${sign>0?"port":"starboard"}`;a.position.set(23.2,4.7,sign*2.05);anchors.add(a);beam("anchor_shank",[0,.55,0],[0,-.5,0],.065,"steel",a);beam("anchor_arm_left",[0,-.5,0],[-.4,-.22,0],.07,"steel",a);beam("anchor_arm_right",[0,-.5,0],[.4,-.22,0],.07,"steel",a);box("anchor_fluke_left",[.22,.4,.08],[-.4,-.13,0],"steel",a);box("anchor_fluke_right",[.22,.4,.08],[.4,-.13,0],"steel",a);}
const deckFittings=component("hyi_deck_fittings","货油舱口、通气与系泊件","fittings","schematic_fittings","按总布置的分布设置可视化舱口、通气标记与系泊柱，细部尺寸和全部管系未复原。",[ga]);
for(const f of [24,38,53,68])for(const sign of [-1,1]){const x=fx(f);cylinder(`cargo_access_fr${f}_${sign}`,.32,.12,[x,4.28,sign*3.7],"white",deckFittings);beam("vent_symbol",[x,4.3,sign*.6],[x,5.2,sign*.6],.07,"steel",deckFittings);cylinder("vent_head",.16,.12,[x,5.26,sign*.6],"steel",deckFittings);}
for(const f of [0,4,74])for(const sign of [-1,1]){const w=width(fx(f));for(const d of [-.22,.22])cylinder("mooring_bitt",.13,.45,[fx(f)+d,deckY(fx(f))+.25,sign*Math.max(.4,w-.5)],"steel",deckFittings);}
const arm=component("hyi_loading_arm","输油臂","fittings","reach_based_symbol","总布置标示 R12000 作业范围。现为设备位置及工作尺度示意，臂段长度、铰接点和真实管径尚未按厂家图精确复原。",[ga,source("Marine Oil Loading Arm Foundation Structure Plan.pdf")]);
cylinder("loading_arm_pedestal",.40,1.3,[fx(48),4.9,.7],"white",arm);beam("loading_arm_primary",[fx(48),5.5,.7],[fx(37),9.6,.7],.15,"white",arm);beam("loading_arm_secondary",[fx(37),9.6,.7],[fx(28),10.5,.7],.13,"white",arm);beam("loading_arm_hose",[fx(28),10.5,.7],[fx(28)-.4,8.5,.7],.10,"black",arm);
const masts=component("hyi_masts","主桅、艏桅及导航设备","fittings","projection_measured_envelope","桅杆、雷达横臂与天线按总布置可见外形量取和简化；仪器及支架细部未完成。",[ga]);
beam("main_mast",[fx(10),11.15,0],[fx(10),20.7,0],.055,"white",masts);beam("radar_yard",[fx(10),16.5,-1.8],[fx(10),16.5,1.8],.035,"white",masts);box("radar_scanner",[1.7,.12,.20],[fx(10)+.35,16.7,0],"white",masts);beam("fore_mast",[fx(77),6.3,0],[fx(77),14.8,0],.045,"white",masts);
const lifesaving=component("hyi_lifesaving","两舷救生筏","fittings","schematic_equipment","两舷位置参考总布置救生甲板图；筏架和筏壳目前为示意几何。",[ga]);
for(const sign of [-1,1]){const raft=cylinder(`liferaft_${sign}`,.40,1.0,[fx(10),7.05,sign*4.0],"white",lifesaving);raft.rotation.x=Math.PI/2;}

scene.updateMatrixWorld(true);
for(const target of targets){const object=scene.getObjectByName(target.id);const bounds=new Box3().setFromObject(object);target.bounds_m={min:bounds.min.toArray(),max:bounds.max.toArray()};}
let meshes=0,triangles=0;const geometries=new Set();scene.traverse(o=>{if(o instanceof Mesh){meshes++;geometries.add(o.geometry);triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
globalThis.FileReader??=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result=`data:${blob.type};base64,${Buffer.from(result).toString("base64")}`;this.onloadend?.();});}};
const glb=await new GLTFExporter().parseAsync(scene,{binary:true});
await mkdir(resolve(base,"models"),{recursive:true});await writeFile(resolve(base,"models/hai-yin-i-visual-assembly.glb"),Buffer.from(glb));
const manifest={id:plan.id,name:"MT Hai Yin I",unit:"metre",model_url:"/hai-yin-i/models/hai-yin-i-visual-assembly.glb",status:"whole_vessel_visual_assembly",detailed_reconstruction_complete:false,teaching_ship_route:"/atlas",vessel_route:"/vessels/hai-yin-i",scope_cn:"整船可视化装配，包括闭合外壳、艏楼、三层艉楼、八个货油舱、双舷压载包络、双机双轴双桨双舵及甲板设备。各部件精度不同，尚不是全部细节已校核的 1:1 工程模型。",precision_cn:plan.precision_cn,frame_zero_x_m:plan.frame_zero_x_m,metrics:{bytes:glb.byteLength,mesh_nodes:meshes,triangles,unique_geometries:geometries.size},targets};
await writeFile(resolve(base,"geometry/ship-assembly.json"),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({file:"hai-yin-i-visual-assembly.glb",...manifest.metrics,targets:targets.length,teaching_ship_changed:false},null,2));
