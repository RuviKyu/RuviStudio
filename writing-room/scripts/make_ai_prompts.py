#!/usr/bin/env python3
"""
MAKE AI PROMPTS — (r16) writes [Subject]_ai_prompts.txt: ONE prompt per line, in
AI IMAGE order (001, 002 …), straight from [Subject]_auto_video_structure.json
(the .json twin that auto_structure_lint.py writes). Bulk image tools (TurboFlow and
the other Google-Flow automators, BulkImagen, AutoFly …) import exactly this shape;
the generated files, taken in name order, become AI Images\\001.jpg, 002.jpg …
Also writes [Subject]_ai_prompts.csv (index,prompt) for tools that want a CSV.

Optional argv[1] = the working folder.
"""
import glob, json, os, sys, csv

args=[a for a in sys.argv[1:] if not a.startswith("--")]
OUT=(args[0] if args else "/mnt/user-data/outputs")
cands=sorted(glob.glob(os.path.join(OUT, "*_auto_video_structure.json")))
if not cands:
    sys.exit("make_ai_prompts: no *_auto_video_structure.json in the folder (run auto_structure_lint.py first)")
src=cands[0]; subj=os.path.basename(src).replace("_auto_video_structure.json","")
data=json.load(open(src, encoding="utf-8"))
items=data.get("items") or data.get("structure") or []
ai=[it for it in items if str(it.get("kind","")).upper()=="AI" or it.get("image") is not None]
ai.sort(key=lambda it: int(it.get("image") or 0))
lines=[]
for it in ai:
    pr=" ".join(str(it.get("prompt","")).split())
    if not pr: sys.exit(f"make_ai_prompts: AI IMAGE {it.get('image')} has no prompt")
    lines.append(pr)
txt=os.path.join(OUT, f"{subj}_ai_prompts.txt"); open(txt,"w",encoding="utf-8").write("\n".join(lines)+"\n")
with open(os.path.join(OUT, f"{subj}_ai_prompts.csv"),"w",encoding="utf-8",newline="") as f:
    w=csv.writer(f); w.writerow(["index","file","prompt"])
    for i,pr in enumerate(lines,1): w.writerow([i, f"{i:03d}.jpg", pr])
print(f"AI PROMPTS: {txt}  ({len(lines)} prompt(s), one per line, AI IMAGE order)")
