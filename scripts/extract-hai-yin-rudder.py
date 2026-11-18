"""Extract the actual PDF vector outline; do not substitute a generic foil."""
import hashlib
import argparse
import json
import math
import sys
from pathlib import Path

import pymupdf

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument("source_dir",type=Path,help="Directory containing the original supplied PDF")
parser.add_argument("--output",type=Path,default=Path(__file__).parent.parent/"public"/"hai-yin-i")
args=parser.parse_args()
output=args.output
source = args.source_dir / "Rudder Blade Construction.pdf"
expected_sha256="86df18f229c76bcea97749819e459000b864e937fed06f41f60f8741e7617335"
if hashlib.sha256(source.read_bytes()).hexdigest()!=expected_sha256:
    raise ValueError("Source bytes differ from the reviewed drawing. Review its title block, approval and geometry before updating this extractor.")
page = pymupdf.open(source)[0]
chains = []
for index, drawing in enumerate(page.get_drawings()):
    if drawing["color"] != (0, 0, 0):
        continue
    current = []
    for item in drawing["items"]:
        if item[0] != "l":
            if current:
                chains.append((index, current))
            current = []
            continue
        a, b = list(item[1]), list(item[2])
        if current and math.dist(current[-1], a) > .01:
            chains.append((index, current))
            current = []
        if not current:
            current = [a]
        current.append(b)
    if current:
        chains.append((index, current))

# Only the two complete outer-profile chains in the "RUDDER MOULD NUMBER" view.
profiles = []
for index, points in chains:
    xs, ys = [p[0] for p in points], [p[1] for p in points]
    if 179 < min(xs) < 181 and 374 < max(xs) < 377 and 733 < min(ys) and max(ys) < 770 and len(points) >= 15:
        profiles.append((index, points))
assert len(profiles) == 2, "Source geometry changed: review the extraction window."
upper = min(profiles, key=lambda c: min(p[1] for p in c[1]))
lower = max(profiles, key=lambda c: max(p[1] for p in c[1]))
assert math.dist(upper[1][0], lower[1][0]) < .01
points = upper[1] + lower[1][:0:-1]
x0, x1 = min(p[0] for p in points), max(p[0] for p in points)
centre = upper[1][0][1]
# The dimensioned chord (1400 mm), rather than the scan's nominal print scale,
# controls the metre conversion. Height is the separately dimensioned 2080 mm.
scale = 1.4 / (x1-x0)
profile = [[round((x-x0)*scale, 9), round((centre-y)*scale, 9)] for x, y in points]
data = {
    "id": "rudder_blade_envelope",
    "description_cn": "从舵叶结构图矢量轮廓提取的舵叶外形包络；尚不包含法兰、内部隔板、焊缝、孔及船上安装坐标。",
    "status": "drawing_derived_envelope_not_complete_component",
    "unit": "metre",
    "chord_m": 1.4,
    "height_m": 2.08,
    "profile_xy_m": profile,
    "source": {
        "file": source.name, "page": 1, "drawing_no": "WUT513B-231-02",
        "class_reference": "SHST-8439", "stamp_date": "2011-11-29",
        "stamp_status": "Approved with remarks",
        "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "pdf_path_indices": [upper[0], lower[0]],
        "pdf_bounds": [x0, min(p[1] for p in points), x1, max(p[1] for p in points)],
    },
    "method": "Extrude the supplied vector profile through the separately dimensioned height. Preserve the supplied polyline; no invented spline smoothing.",
    "precision_note": "The 1:1 unit scale does not establish fabrication accuracy. PDF polyline/rounding and unmodelled features remain; no geometric tolerance is certified.",
    "instances": {"quantity_on_ship": 2, "definition_count": 1, "installation_transform": None},
}
(output/"geometry").mkdir(parents=True,exist_ok=True)
(output/"geometry"/"rudder-profile.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf8")
svg_points = " ".join(f"{80+x*650:.3f},{145-y*650:.3f}" for x,y in profile)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="350" viewBox="0 0 1120 350">
<rect width="1120" height="350" fill="#f4f1e9"/><g font-family="Arial,sans-serif" fill="#192d33">
<text x="40" y="35" font-size="21">HAI YIN I / RUDDER BLADE PROFILE</text>
<polygon points="{svg_points}" fill="#2b6c78" stroke="#142b37" stroke-width="2"/>
<path d="M80 145H990" stroke="#688084" stroke-dasharray="6 6"/>
<path d="M80 245V260H990V245" fill="none" stroke="#192d33"/>
<text x="445" y="285" font-size="20">1.400 m chord</text>
<text x="40" y="316" font-size="14">WUT513B-231-02 / p.1 / vector outline / envelope only / height 2.080 m</text>
</g></svg>'''
(output/"geometry"/"rudder-profile.svg").write_text(svg, encoding="utf8")
print(json.dumps({"vertices":len(profile), "width_m":max(p[1] for p in profile)-min(p[1] for p in profile), "chord_m":1.4,"height_m":2.08}))
