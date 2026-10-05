#!/usr/bin/env python3
"""
SFX CHECK — (r17) validates [Subject]_sfx.json (the ambience plan) against the stamped breakdown:
cues name real sections, ranges ordered, levels within -12..+3 dB, words present, ≤ 3 cues on any section.
Writes nothing. Exit 1 on FAIL. Optional argv[1] = the working folder.
"""
import glob, json, os, re, sys
args=[a for a in sys.argv[1:] if not a.startswith("--")]
OUT=(args[0] if args else "/mnt/user-data/outputs")
sfx=sorted(glob.glob(os.path.join(OUT,"*_sfx.json")))
bds=[p for p in sorted(glob.glob(os.path.join(OUT,"*_breakdown.txt"))) if "_original" not in p and "_special" not in p]
if not sfx: sys.exit("sfx_check: no *_sfx.json in the folder (Phase X writes it)")
if not bds: sys.exit("sfx_check: no *_breakdown.txt to check against")
R=json.load(open(sfx[0],encoding="utf-8")); text=open(bds[0],encoding="utf-8-sig").read()
secs=sorted(int(m) for m in re.findall(r"^SECTION\s+(\d+)\s*\|", text, re.M))
if not secs: sys.exit("sfx_check: the breakdown has no SECTION headers")
E,W=[],[]; cover={}
cues=R.get("cues") or []
if not cues: E.append("no cues — every video needs an ambience plan")
def num(x):
    if x is None: return None
    m=re.match(r"^S?0*(\d+)$", str(x).strip(), re.I); return int(m.group(1)) if m else None
for i,c in enumerate(cues,1):
    words=[w for w in re.findall(r"[a-z0-9]+", str(c.get("sound","")).lower()) if len(w)>2]
    if not words: E.append(f"cue {i}: no words in \"sound\"")
    elif len(words)==1 and words[0] in ("water","wind","sea","noise","sound","night","day"): W.append(f"cue {i}: \"{c.get('sound')}\" is a single generic word — add the place/texture (e.g. \"ocean waves shore\")")
    a,b=num(c.get("from")),num(c.get("to"))
    if c.get("fromMs") is not None and c.get("toMs") is not None:
        if c["toMs"]<=c["fromMs"]: E.append(f"cue {i}: toMs ≤ fromMs")
        continue
    if a is None or b is None: E.append(f"cue {i}: from/to must be section numbers"); continue
    if a not in secs or b not in secs: E.append(f"cue {i}: section {a if a not in secs else b} is not in the breakdown (sections {secs[0]}–{secs[-1]})"); continue
    if b<a: E.append(f"cue {i}: to ({b}) before from ({a})")
    lv=c.get("level",0)
    try: lv=float(lv)
    except Exception: E.append(f"cue {i}: level not a number"); lv=0
    if lv>3 or lv<-12: E.append(f"cue {i}: level {lv} dB out of range (-12…+3)")
    for s in range(a,b+1): cover[s]=cover.get(s,0)+1
for s,n in cover.items():
    if n>3: E.append(f"section {s}: {n} cues stacked (max 3)")
# long runs must breathe: a single cue covering more than ~6 minutes of sections with nothing else layered over any part of it
import collections
spans={}
for i,c in enumerate(cues,1):
    a,b=num(c.get("from")),num(c.get("to"))
    if a is None or b is None or a not in secs or b not in secs: continue
    spans[i]=(a,b)
tc={}
for m2 in re.finditer(r"^SECTION\s+(\d+)\s*\|[\s\S]*?TIMECODE:\s*(\d\d):(\d\d):(\d\d)\.(\d{3})\s*(?:→|->)\s*(\d\d):(\d\d):(\d\d)\.(\d{3})", text, re.M):
    g=m2.groups(); tc[int(g[0])]=(int(g[1])*3600+int(g[2])*60+int(g[3])+int(g[4])/1000, int(g[5])*3600+int(g[6])*60+int(g[7])+int(g[8])/1000)
for i,(a,b) in spans.items():
    if a in tc and b in tc:
        mins=(tc[b][1]-tc[a][0])/60
        others=[j for j,(x,y) in spans.items() if j!=i and not (y<a or x>b)]
        if mins>6 and len(others)<2: W.append(f"cue {i} (\"{cues[i-1].get('sound')}\") covers {mins:.0f} min with {len(others)} other cue(s) over it — long runs must breathe: add a texture every 2–3 minutes")
silent=[s for s in secs if s not in cover]
if silent: E.append(f"{len(silent)} section(s) have NO ambience ({silent[:8]}{'…' if len(silent)>8 else ''}) — the bed never goes silent: give every section at least a base layer")
# long stretches with nothing new: a texture should start every 3–5 minutes so the bed evolves on an hour-long video
starts=sorted(set(num(c.get("from")) for c in cues if num(c.get("from")) is not None))
tc=dict((int(m.group(1)), (int(m.group(2))*3600+int(m.group(3))*60+float(m.group(4)))) for m in re.finditer(r"^SECTION\s+(\d+)\s*\|[\s\S]*?TIMECODE:\s*(\d\d):(\d\d):(\d\d\.\d{3})", text, re.M))
if len(starts)>=2 and tc:
    for a,b in zip(starts, starts[1:]):
        if a in tc and b in tc and tc[b]-tc[a]>330: W.append(f"no new cue between sections {a} and {b} ({int((tc[b]-tc[a])//60)} min) — start a fresh texture every 3–5 minutes inside long runs")
for w in W: print("WARN  "+w)
for e in E: print("FAIL  "+e)
print(f"sfx_check: {len(cues)} cue(s), {len(secs)} section(s), {len(E)} FAIL, {len(W)} WARN")
sys.exit(1 if E else 0)
