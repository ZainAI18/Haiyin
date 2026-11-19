// Plan-derived, metre-scale interiors. Room footprints are measured from drawings;
// furniture heights and equipment casings are explicitly simplified, not manufacturer CAD.
export function addHaiYinInterior({component,box,cylinder,beam,fx,source,house,engineRoom,aux}){
  const fire=source("Fire Control Plan approved 06Jun2012.pdf"),vent=source("Engine & Pump Room Ventilation Pipeline Arrangement approved 09Dec2011.pdf",3),doors=source("Door & Window Arrangement.pdf"),spec=source("Hull Specification.pdf",21);
  const refs=[fire,vent,doors,spec];
  const note="房间边界按 2012 完工消防图和通风图平面量取，米制；不是逐项标注的施工尺寸。家具平面参考原图，家具高度、饰面和附件为简化示意。";
  const zones={main:{id:"main",name_cn:"Accommodation 一层 · 主甲板",floor:4.18,bounds:[fx(6),fx(17),-3.6,3.6],spawn:[fx(12),0,-Math.PI/2]},upper:{id:"upper",name_cn:"Accommodation 二层 · 救生甲板",floor:6.48,bounds:[fx(9),fx(17),-3.6,3.6],spawn:[fx(12),0,-Math.PI/2]},engine:{id:"engine",name_cn:"Engine Room · 机舱",floor:1.42,bounds:[fx(6),fx(17),-4,4],spawn:[fx(15.9),-3.35,Math.PI/2]}};
  const rooms=[],blockers=[];
  const groups={};
  function group(id,name,zone,confidence="plan_measured_interior",sources=refs){const g=component(id,name,"interior",confidence,note,sources);g.userData.walkZones=[zone];if(zone!=="engine")house.add(g);groups[id]=g;return g;}
  function solid(name,size,pos,mat,parent,zone,collide=true){const m=box(name,size,pos,mat,parent);if(collide&&zone)blockers.push({id:name,zone,rect:[pos[0]-size[0]/2,pos[0]+size[0]/2,pos[2]-size[2]/2,pos[2]+size[2]/2]});return m;}
  function table(name,x,z,w,d,h,parent,zone){const y=zones[zone].floor;blockers.push({id:name,zone,rect:[x-w/2,x+w/2,z-d/2,z+d/2]});box(name+"_top",[w,.06,d],[x,y+h-.03,z],"bronze",parent);for(const a of [-1,1])for(const b of [-1,1])box(name+"_leg",[.045,h-.06,.045],[x+a*(w/2-.06),y+(h-.06)/2,z+b*(d/2-.06)],"steel",parent);}
  function partition(name,zone,axis,at,lo,hi,parent,gap){
    const y=zones[zone].floor,h=zone==="engine"?2.65:zone==="main"?2.3:2.2;
    const pieces=gap?[[lo,gap[0]],[gap[1],hi]]:[[lo,hi]];
    for(const [a,b] of pieces)if(b>a)solid(name,[axis==="x"?.09:b-a,h,axis==="x"?b-a:.09],axis==="x"?[at,y+h/2,(a+b)/2]:[(a+b)/2,y+h/2,at],"white",parent,zone);
    if(gap){const top=y+.25+1.735,remaining=y+h-top;if(remaining>0)box(name+"_door_header",[axis==="x"?.09:gap[1]-gap[0],remaining,axis==="x"?gap[1]-gap[0]:.09],axis==="x"?[at,top+remaining/2,(gap[0]+gap[1])/2]:[(gap[0]+gap[1])/2,top+remaining/2,at],"white",parent);
      // Door is held open for inspection; thresholds are shown but virtually stepped over.
      box(name+"_threshold",[axis==="x"?.10:gap[1]-gap[0],.25,axis==="x"?gap[1]-gap[0]:.10],axis==="x"?[at,y+.125,(gap[0]+gap[1])/2]:[(gap[0]+gap[1])/2,y+.125,at],"steel",parent);
    }
  }
  function room(id,name,zone,fa,fb,z0,z1,spawn){const g=group("hyi_"+id,name,zone);rooms.push({id:g.name,name_cn:name,zone,rect:[fx(fa),fx(fb),z0,z1],spawn:[fx(spawn[0]),spawn[1],spawn[2]??-Math.PI/2],sources:refs,confidence:"projection_measured_footprint_simplified_furniture"});return g;}
  // Replace earlier solid envelope blocks; retain the separate bridge and teaching vessel.
  for(const child of [...house.children]){house.remove(child);child.traverse(o=>o.geometry?.dispose());}
  house.userData.note_cn="两层生活区按最新消防完工图、通风图及门窗图重建。内部平面为按图量取；楼梯踏步和家具高度简化。";
  house.userData.sources=refs;
  for(const id of ["main","upper"]){const z=zones[id],a=id==="main"?6:9,y=z.floor,h=id==="main"?2.3:2.2;const shell=group("hyi_"+id+"_interior_shell",id==="main"?"生活区一层墙体与门口":"生活区二层墙体与门口",id);shell.userData.layer="superstructure";
    // Floor plates have a real stair opening in the upper floor.
    if(id==="main"){box("main_accommodation_floor",[(17-a)*.56,.08,7.2],[fx((17+a)/2),y-.04,0],"deck",shell);box("galley_toilet_ceiling",[3*.56,.08,7.2],[fx(7.5),6.52,0],"white",shell);}
    else {box("upper_floor_forward",[(17-11.2)*.56,.08,7.2],[fx(14.1),y-.04,0],"deck",shell);for(const side of [-1,1])box("upper_floor_side",[(11.2-9)*.56,.08,2.4],[fx(10.1),y-.04,side*2.4],"deck",shell);}
    // Ceiling opening above the lower stair; second-floor roof remains solid.
    if(id==="upper")box("accommodation_roof",[(17-a)*.56,.08,7.2],[fx((17+a)/2),y+h+.04,0],"white",shell);
    partition(id+"_forward_wall",id,"x",fx(17),-3.6,3.6,shell);
    partition(id+"_aft_wall",id,"x",fx(a),-3.6,3.6,shell);
    for(const side of [-1,1]){partition(id+"_side_wall_"+side,id,"z",side*3.6,fx(a),fx(17),shell);for(const f of (id==="main"?[7.5,10.5,15]:[10,12,15]))box(id+"_window",[.50,id==="main"?.36:.68,.025],[fx(f),y+1.50,side*3.546],"glass",shell);}
    // Two cabin entrances, B-0 doors: actual opening width 685 mm (Door & Window p1).
    const port=room(id+"_crew_port",id==="main"?"一层左舷船员室":"二层左舷船员室",id,13,17,0,3.6,[14.1,1.1,-2.89]);
    const star=room(id+"_crew_starboard",id==="main"?"一层右舷船员室":"二层右舷船员室",id,13,17,-3.6,0,[14.1,-1.1,-.25]);
    partition(id+"_crew_center",id,"z",0,fx(13),fx(17),shell);
    for(const [sign,g] of [[1,port],[-1,star]]){partition(id+"_crew_door_"+sign,id,"x",fx(13),sign>0?0:-3.6,sign>0?3.6:0,shell,[sign*1.5-.3425,sign*1.5+.3425]);
      solid(id+"_bed_"+sign,[2.02,.42,.86],[fx(15),y+.21,sign*3.05],"trim",g,id);box("mattress",[1.96,.13,.82],[fx(15),y+.485,sign*3.05],"white",g);box("pillow",[.4,.12,.65],[fx(16.35),y+.59,sign*3.05],"aux",g);
      table(id+"_desk_"+sign,fx(16),sign*1.48,.80,.44,.74,g,id);solid(id+"_wardrobe_"+sign,[.48,1.70,.55],[fx(13.7),y+.85,sign*.46],"bronze",g,id);box("chair_seat",[.38,.05,.38],[fx(15.3),y+.43,sign*1.45],"aux",g);box("chair_back",[.05,.36,.38],[fx(15.3)-.16,y+.63,sign*1.45],"aux",g);for(const a of [-1,1])for(const b of [-1,1])box("chair_leg",[.035,.42,.035],[fx(15.3)+a*.14,y+.21,sign*1.45+b*.14],"steel",g);
    }
    const stair=group("hyi_"+id+"_stair_enclosure",id==="main"?"一层内楼梯间":"二层内楼梯间",id);for(const f of [9.2,11.1])partition(id+"_stair_side",id,"x",fx(f),-1.1,1.1,stair);
  }
  const galley=room("galley","厨房 Galley","main",6,9,1.05,3.6,[7.7,1.65,3.03]);
  partition("galley_forward_door","main","x",fx(9),1.05,3.6,galley,[1.4-.3425,1.4+.3425]);partition("galley_inner","main","z",1.05,fx(6),fx(9),galley);
  for(const [i,name] of ["range","sink","counter"].entries()){solid("galley_"+name,[.45,.85,.58],[fx(6.6)+i*.48,4.605,3.13],"steel",galley,"main");if(i===0)for(const dx of [-.1,.1])cylinder("cooking_hob",.075,.018,[fx(6.6)+dx,5.04,3.13],"black",galley);}
  solid("galley_fridge",[.48,1.6,.52],[fx(6.6),4.98,1.76],"white",galley,"main");
  box("sink_bowl_symbol",[.32,.015,.40],[fx(6.6)+.48,5.04,3.13],"trim",galley);beam("galley_tap",[fx(6.6)+.48,5.05,3.36],[fx(6.6)+.48,5.29,3.36],.018,"steel",galley);beam("tap_spout",[fx(6.6)+.48,5.29,3.36],[fx(6.6)+.48,5.29,3.18],.018,"steel",galley);
  const mess=room("mess","餐厅 Mess Room","main",9,13,1.05,3.6,[11.8,1.35,2.78]);table("mess_table",fx(11),2.55,1.35,.72,.76,mess,"main");for(const sign of [-1,1])for(const dx of [-.4,.4]){box("mess_chair_seat",[.32,.05,.32],[fx(11)+dx,4.61,2.55+sign*.63],"aux",mess);box("mess_chair_back",[.32,.32,.04],[fx(11)+dx,4.81,2.55+sign*.77],"aux",mess);for(const a of [-1,1])for(const b of [-1,1])box("mess_chair_leg",[.035,.42,.035],[fx(11)+dx+a*.12,4.39,2.55+sign*.63+b*.12],"steel",mess);}
  const toilet=room("toilet","公共卫生间 / 淋浴","main",6,11,-3.6,-2.0,[9.8,-2.7,1.27]);partition("toilet_inner","main","z",-2,fx(6),fx(11),toilet);partition("toilet_door","main","x",fx(11),-3.6,-2,toilet,[-3.04,-2.355]);
  for(const f of [6.8,8.3]){solid("toilet_fixture",[.48,.35,.52],[fx(f),4.355,-3.1],"white",toilet,"main");box("toilet_basin",[.32,.07,.38],[fx(f),4.55,-3.1],"glass",toilet);}solid("wash_basin",[.45,.8,.40],[fx(10.2),4.58,-3.14],"white",toilet,"main");beam("shower_riser",[fx(7),4.7,-3.5],[fx(7),6.1,-3.5],.018,"steel",toilet);
  const casing=group("hyi_engine_casing","机舱围井（不能穿越）","main");solid("engine_casing",[3*.56,2.3,2.1],[fx(7.5),5.33,0],"trim",casing,"main");
  const co2=room("co2_room","CO₂ 瓶间 · 外侧独立入口","main",11,13,-3.6,-2.4,[12,-2.95,.647]);partition("co2_corridor_wall","main","z",-2.4,fx(11),fx(13),co2); // External access; jump menu is virtual inspection, not an invented inner door.
  const battery=room("battery_room","蓄电池室 Battery Room","upper",9,11,1.9,3.6,[10,2.2,-2.96]);const charge=room("charge_room","充放电室 Charge / Discharge","upper",11,13,1.9,3.6,[12,2.2,Math.PI]);const hvac=room("air_conditioning_room","空调室 Air Conditioning","upper",9,13,-3.6,-1.9,[12,-2.4,.84]);
  // These service rooms have external access on the source plan. Virtual room entry is explicit in UI.
  partition("battery_charge_partition","upper","x",fx(11),1.9,3.6,battery);partition("upper_port_service_wall","upper","z",1.9,fx(9),fx(13),battery);partition("upper_hvac_wall","upper","z",-1.9,fx(9),fx(13),hvac);
  for(let i=0;i<3;i++)solid("battery_rack_"+i,[.34,.72,.48],[fx(9.6)+i*.38,6.84,3.12],"black",battery,"upper");solid("charging_panel",[.7,1.4,.3],[fx(12),7.18,3.35],"aux",charge,"upper");solid("ac_unit",[1.2,1.2,.65],[fx(10.7),7.08,-3.05],"aux",hvac,"upper");
  const stairs=component("hyi_internal_stairs","生活区两层内楼梯","interior","source_position_simplified_flight","楼梯位置与 4.18 / 6.48 m 层高按原图；直跑踏步及行走坡面为教学简化，不是施工放样。",refs);stairs.userData.walkZones=["main","upper"];
  house.add(stairs);
  const stairRect=[fx(9.2)+.05,fx(11.1)-.05,-1.2,1.2];for(let i=0;i<13;i++)box("internal_stair_tread_"+i,[stairRect[1]-stairRect[0],.08,2.4/13],[(stairRect[0]+stairRect[1])/2,4.18+(i+1)/13*2.3-.04,-1.2+(i+.5)/13*2.4],"steel",stairs);
  for(const x of [stairRect[0]+.03,stairRect[1]-.03])beam("stair_handrail",[x,5.08,-1.2],[x,7.38,1.2],.025,"bronze",stairs);
  // Machinery layout corrected against ventilation arrangement p2: generators between the main engines.
  for(const child of [...aux.children]){aux.remove(child);child.geometry?.dispose();}
  for(const sign of [-1,1]){solid("generator_envelope_"+sign,[1.55,.85,.66],[fx(12.8),1.845,sign*.87],"aux",aux,"engine");const a=cylinder("alternator_"+sign,.27,.60,[fx(14.45),1.82,sign*.87],"steel",aux);a.rotation.z=Math.PI/2;}
  aux.userData.note_cn="两台柴油发电机位于两主机之间，按通风布置第 2 页平面量取；设备壳体不是厂家 CAD。";aux.userData.sources=[source(vent.file,2),source("List of Machinery Equipments.pdf",3)];
  engineRoom.userData.walkZones=["engine"];
  for(const sign of [-1,1])blockers.push({id:"main_engine_"+sign,zone:"engine",rect:[fx(8.1),fx(13.2),sign*2.5-.47,sign*2.5+.47]});
  const er=group("hyi_engine_interior","机舱舱壁、平台与通风管","engine","plan_measured_shell_simplified_platform",[source(vent.file,1),source(vent.file,2),fire]);
  er.userData.note_cn="机舱 FR6–17；FR17–20 为泵舱 / 两舷柴油舱。平台 BL+1.42 m 按剖面比例量取，未经尺寸标注校核；通风管截面采用原表 300×240 mm。设备附件及全部管系未完成。";
  box("engine_walk_platform",[11*.56,.06,8],[fx(11.5),1.39,0],"deck",er);box("engine_ceiling",[11*.56,.08,8],[fx(11.5),4.10,0],"steel",er);
  partition("engine_aft_bulkhead","engine","x",fx(6),-4,4,er);partition("engine_forward_bulkhead","engine","x",fx(17),-4,4,er);for(const sign of [-1,1]){partition("engine_side_bulkhead","engine","z",sign*4,fx(6),fx(17),er);box("ventilation_duct_300x240",[9*.56,.24,.30],[fx(11.5),3.65,sign*3.5],"steel",er);for(const f of [8,12,15])box("ventilation_grille",[.30,.12,.32],[fx(f),3.49,sign*3.5],"black",er);}
  rooms.push({id:er.name,name_cn:"机舱双机、发电机与通风",zone:"engine",rect:zones.engine.bounds,spawn:zones.engine.spawn,sources:[source(vent.file,2),fire],confidence:"mixed_dimensioned_axes_plan_measured_equipment"});
  const safety=[];
  function safetyGroup(id,name,zone,frame,z,type){const g=component("hyi_fire_"+id,name,"safety","source_location_symbolic_equipment","位置参考最新消防完工图；器材外形、尺寸与支架为示意。仅供布置学习，不是操作指导。",[fire]);g.userData.walkZones=[zone];const y=zones[zone].floor;safety.push({id:g.name,name_cn:name,zone,type,frame,z,source:fire});
    if(type==="detector"){cylinder("smoke_detector",.10,.045,[fx(frame),y+2.05,z],"white",g);}
    else if(type==="hydrant"){box("fire_hose_cabinet",[.35,.55,.20],[fx(frame),y+1,z],"red",g);beam("hydrant_pipe",[fx(frame)+.23,y+.1,z],[fx(frame)+.23,y+1,z],.025,"red",g);}
    else if(type==="callpoint"){box("manual_fire_call_point",[.14,.17,.06],[fx(frame),y+1.35,z],"red",g);}
    else {cylinder("extinguisher_body",.085,.42,[fx(frame),y+.50,z],"red",g);beam("extinguisher_hose",[fx(frame)+.10,y+.45,z],[fx(frame)+.10,y+.78,z],.012,"black",g);box("extinguisher_handle",[.12,.04,.055],[fx(frame),y+.74,z],"black",g);}return g;}
  safetyGroup("main_foam","一层泡沫灭火器（示意）","main",11.6,1.65,"extinguisher");safetyGroup("main_call","一层手动报警按钮","main",12.8,.65,"callpoint");safetyGroup("main_smoke","一层烟感探测器","main",12,0,"detector");safetyGroup("upper_foam","二层灭火器（示意）","upper",11.6,1.65,"extinguisher");safetyGroup("upper_smoke","二层烟感探测器","upper",12,0,"detector");safetyGroup("engine_foam","机舱泡沫灭火器（示意）","engine",16,3.3,"extinguisher");safetyGroup("engine_call","机舱手动报警按钮","engine",16.3,.1,"callpoint");safetyGroup("engine_hose","机舱消火栓与水带箱（示意）","engine",15.5,-3.7,"hydrant");
  const pumps=component("hyi_fire_pumps","机舱双消防泵 · 示意壳体","safety","plan_measured_location_symbolic_casing","按消防完工图机舱布置及机械设备表表达两台消防泵。位置为按图量取，泵壳和电机为示意，未铺设未经坐标核实的全船管路。",[fire,source("List of Machinery Equipments.pdf")]);pumps.userData.walkZones=["engine"];
  for(const sign of [-1,1]){const x=fx(15.5),z=sign*2.9;solid("fire_pump_base_"+sign,[.72,.08,.48],[x,1.46,z],"steel",pumps,"engine");cylinder("fire_pump_casing_"+sign,.18,.32,[x,1.65,z],"red",pumps).rotation.z=Math.PI/2;cylinder("fire_pump_motor_"+sign,.15,.30,[x+.27,1.66,z],"engine",pumps).rotation.z=Math.PI/2;}
  const co2bank=component("hyi_co2_bank","CO₂ 固定灭火系统 · 瓶组示意","safety","symbolic_system_bank","最新消防图标明 CO₂ 瓶间与保护机舱 / 泵舱。此处用瓶组符号表示一套系统，瓶数和连接细节未据厂家图重建，不代表真实瓶数。",[fire,source("Principle of CO2 Fire Extinguishing System.pdf")]);co2bank.userData.walkZones=["main"];cylinder("co2_bank_symbol",.13,1.2,[fx(11.5),4.78,-3.32],"red",co2bank);box("co2_system_header_symbol",[.55,.06,.06],[fx(12),5.5,-3.32],"steel",co2bank);
  return {version:1,unit:"metre",eye_height_m:1.55,body_radius_m:.14,walk_speed_m_s:1.15,source_review:{fire:{...fire,drawing:"WUT513B-050-05",approval:"SHFP-4292 / 06 JUN 2012 / Approved with Remarks",replaces:"SHFP-4280",completion_date:"2012-04"},ventilation:{...vent,drawing:"WUT513B-424-01",approval:"SHFP-3955 / 09 DEC 2011",replaces:"SHFP-3886 for RI88792"},doors:{...doors,approval:"SHST-8445 / 30 NOV 2011"}},precision_cn:note+"门洞宽度 685 mm 来自门窗表；虚拟行走自动跨门槛。独立外门的服务房间通过房间菜单定位，不能视为实际逃生通路。",zones,rooms,blockers,stair:{rect:stairRect,lower:"main",upper:"upper",lower_floor:4.18,upper_floor:6.48,landing_x:(stairRect[0]+stairRect[1])/2},safety,fire_register:{source:fire,modeled_scope_cn:"展示部分有原图位置依据的消防器材和一套 CO₂ 瓶组符号；尚未逐件复原全船所有设施、支架及管线。",conflicts:[{text_cn:"2012-06 消防完工图列消火栓 / 水带箱各 8；Hull Specification 第 16 页存在 9 的记录。本次布置以较晚的消防完工图为依据，数量差异保留，未凭规格书添加第九套。",sources:[fire,source("Hull Specification.pdf",16)]}]}};
}
