import argparse,hashlib,json,math,sys
from pathlib import Path
import pymupdf
parser=argparse.ArgumentParser(description="Extract reviewed Hai Yin I B-plan vector outlines; preserve metre scale and provenance.")
parser.add_argument("source_dir",type=Path)
parser.add_argument("--output",type=Path,default=Path(__file__).parent.parent/"public"/"hai-yin-i"/"geometry"/"ship-plan.json")
args=parser.parse_args()
source=args.source_dir/"General Structure Plan Rev2.pdf"
if hashlib.sha256(source.read_bytes()).hexdigest()!="ed1a7557233f57bc98e368189fb6d5fa1e0b31431fd34f10d4c1c2493b9ea9db":raise ValueError("Source bytes changed. Review revision, approval and vector paths before updating extraction.")
page=pymupdf.open(source)[0];drawings=page.get_drawings();scale=2200/page.rect.width
def chains(index):
    result=[];current=[]
    for q in drawings[index]["items"]:
        if q[0]!="l":continue
        a,b=list(q[1]),list(q[2])
        if current and math.dist(current[-1],a)>.03:result.append(current);current=[]
        if not current:current=[a]
        current.append(b)
    if current:result.append(current)
    return result
def points(index):return max(chains(index),key=len)
ids=[8194,8195,8196,8199,8200,8201,8202]
trace=points(ids[0])
for i in ids[1:]:
    p=points(i)
    if math.dist(trace[-1],p[-1])<math.dist(trace[-1],p[0]):p=p[::-1]
    assert math.dist(trace[-1],p[0])<.04,(i,trace[-1],p[0])
    trace+=p[1:]
trace=[[x*scale,y*scale] for x,y in trace]
# B-plan frame grid FR20 -> FR34, 14 spaces of 560 mm.
x20,x34=529.207,731.959
xscale=(x34-x20)/(14*.56)
centre=trace[0][1]
yscale=(centre-min(p[1] for p in trace))/4.9
stern=trace[0][0]
frame_zero=-24.95+(x20-20*.56*xscale-stern)/xscale
outline=[[round((x-stern)/xscale-24.95,7),round((centre-y)/yscale,7)] for x,y in trace[1:]]
keel=points(8269)[::-1];keel=[[x*scale,y*scale] for x,y in keel]
baseline=max(p[1] for p in keel)
aft=[[round((x-keel[0][0])/xscale-24.95,7),round((baseline-y)/xscale,7)] for x,y in keel]
fc=points(14028);fc=[[x*scale,y*scale] for x,y in fc]
fc_tip=max(p[0] for p in fc);fc_cl=min(p[1] for p in fc)
forecastle=[[round(24.95+(x-fc_tip)/xscale,7),round((y-fc_cl)/xscale,7)] for x,y in fc]
bow=points(8270);bow=[[x*scale,y*scale] for x,y in bow]
bow_profile=[[round((x-stern)/xscale-24.95,7),round((baseline-y)/xscale,7)] for x,y in bow]
data={"id":"hai-yin-i-whole-vessel","unit":"metre","loa_m":49.9,"breadth_m":9.8,"depth_m":4.18,"frame_spacing_m":.56,
      "frame_zero_x_m":frame_zero,"upper_deck_half_outline_xz_m":outline,"aft_keel_profile_xy_m":aft,
      "forecastle_half_outline_xz_m":forecastle,"bow_profile_xy_m":bow_profile,
      "source":{"file":source.name,"page":1,"drawing_no":"WUT513B-110-04","stamp_date":"2012-02-08","class_reference":"SHST-9013","sha256":hashlib.sha256(source.read_bytes()).hexdigest(),"path_indices":ids+[8269,8270,14028]},
      "calibration":{"reference":"FR20–FR34 / 14 × 560 mm; half moulded breadth 4.9 m","plan_pixel_units_per_m_x":xscale,"plan_pixel_units_per_m_z":yscale,"reference_image_width":2200},
      "precision_cn":"甲板轮廓及艏楼轮廓来自有效 B 版总结构图矢量线，按肋距和型宽标定；完整肋骨站位曲线尚未全部核对。船壳为结合横剖面圆舭的插值外形，艉轴隧道及球鼻艏横剖面未精确复原。"}
out=args.output
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding="utf8")
print(json.dumps({"main_outline_points":len(outline),"main_hull_length_m":outline[-1][0]-outline[0][0],"forecastle_root_frame":(forecastle[0][0]-frame_zero)/.56,"frame_zero":frame_zero,"forecastle_tip":forecastle[-1]},ensure_ascii=False))
