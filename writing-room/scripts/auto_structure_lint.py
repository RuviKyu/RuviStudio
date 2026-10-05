#!/usr/bin/env python3
"""
AUTO STRUCTURE LINT — (r11, Video_AutoStructure.md) validate [Subject]_auto_video_structure.txt
against the STAMPED FULL breakdown, then emit its machine twin [Subject]_auto_video_structure.json
(the Conductor reads the .txt; the .json is a convenience mirror).

The file is a BONUS deliverable for the RUVI Conductor: when it is absent this script
WARNs and exits 0 (nothing else in the package depends on it). When it is present:
FAIL when: an item's header is unreadable; TIMECODEs do not tile the video exactly
(gap/overlap, wrong start/end, an AI section whose parts do not cover it, a special
section whose TIMECODE differs from the breakdown); a special item's RENDER is not
S###_TYPE#; a PAN is not one of N NE E SE S SW W NW or repeats the previous AI
sub-section's; AI IMAGE numbers are not 1,2,3… in running order; a PROMPT is missing,
still carries the [REWRITE …] marker, or does not end with the channel STYLE SUFFIX.
WARN when an AI sub-section is outside 10–20 s (±0.5 s tolerance).
Usage: python3 auto_structure_lint.py <folder>      Exit 1 on any FAIL.
"""
import re, os, sys, glob, json
OUT = sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/outputs"
PANS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p, encoding="utf-8", errors="ignore").read()))
    except Exception: return 0
cands = [p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and "special" not in os.path.basename(p).lower()
         and "_original" not in os.path.basename(p).lower() and "auto_video_structure" not in os.path.basename(p).lower()]
if not cands: sys.exit("No FULL breakdown found.")
FULL = max(cands, key=is_breakdown); subj = re.sub(r'(_breakdown)?\.txt$', '', os.path.basename(FULL))
autos = glob.glob(f"{OUT}/{subj}_auto_video_structure.txt") or glob.glob(f"{OUT}/*_auto_video_structure.txt")
if not autos:
    # BONUS FILE (r12): the auto structure only feeds the RUVI Conductor. A package without it is
    # still a complete, valid deliverable for everything else — so its absence is a WARN, never a FAIL.
    print(f"[warn] no {subj}_auto_video_structure.txt in the folder — Phase S2 (Video_AutoStructure.md) not run; the Conductor cannot use this package, everything else is unaffected")
    print("AUTO STRUCTURE LINT: 0 FAIL / 1 WARN · (file absent, skipped)"); sys.exit(0)
AUTO = autos[0]
TC = re.compile(r'TIMECODE:\s*(\d\d):(\d\d):(\d\d)\.(\d{3})\s*(?:→|->)\s*(\d\d):(\d\d):(\d\d)\.(\d{3})')
def ms(h, m, s, f): return ((int(h) * 60 + int(m)) * 60 + int(s)) * 1000 + int(f)
def hms(t):
    t = max(0, int(round(t))); return f"{t // 3600000:02d}:{t // 60000 % 60:02d}:{t // 1000 % 60:02d}.{t % 1000:03d}"
# breakdown
bd, cur = [], None; SUFFIX = ""
for l in open(FULL, encoding="utf-8").read().split("\n"):
    m = re.match(r'^SECTION\s+(\d+)\s*\|\s*\d+\s*words\s*\|\s*(.+?)\s*$', l)
    if m: cur = {"num": int(m.group(1)), "type": m.group(2).split()[0].upper(), "t0": None, "t1": None}; bd.append(cur); continue
    if cur is None:
        sm = re.match(r'^STYLE SUFFIX:\s*"(.+)"\s*$', l)
        if sm: SUFFIX = sm.group(1)
        continue
    t = TC.search(l)
    if t: cur["t0"] = ms(*t.groups()[:4]); cur["t1"] = ms(*t.groups()[4:])
cnt = {"MAP": 0, "REF": 0, "CHAR": 0}
for s in bd:
    if s["type"] in cnt: cnt[s["type"]] += 1; s["ord"] = cnt[s["type"]]
    elif s["type"] == "HOOK": s["ord"] = 1
bynum = {s["num"]: s for s in bd}
# auto file
items, cur = [], None
AH = re.compile(r'^AUTO\s+(\d+)\s*\|\s*(.+?)\s*$')
lines = open(AUTO, encoding="utf-8").read().split("\n")
i = 0
while i < len(lines):
    l = lines[i]; m = AH.match(l)
    if m:
        rest = m.group(2); it = {"auto": int(m.group(1)), "kind": "?", "section": None, "image": None, "render": "", "pan": "", "t0": None, "t1": None, "prompt": ""}
        f = re.search(r'from\s+SECTION\s+(\d+)\s*\(AI\)\s*\|\s*part\s+(\d+)/(\d+)\s*\|\s*AI IMAGE\s+(\d+)', rest, re.I)
        g = re.search(r'SECTION\s+(\d+)\s*\((HOOK|MAP|REF|CHAR)(?:\s+\d+)?\)\s*\|\s*RENDER:\s*(\S+)', rest, re.I)
        if f: it.update(kind="AI", section=int(f.group(1)), part=f"{f.group(2)}/{f.group(3)}", image=int(f.group(4)))
        elif g: it.update(kind=g.group(2).upper(), section=int(g.group(1)), render=g.group(3))
        items.append(it); cur = it; i += 1; continue
    if cur is not None:
        t = TC.search(l)
        if t: cur["t0"] = ms(*t.groups()[:4]); cur["t1"] = ms(*t.groups()[4:])
        elif l.startswith("PAN:"): cur["pan"] = l[4:].strip().upper()
        elif l.strip() == "PROMPT:":
            out = []; j = i + 1
            while j < len(lines) and not AH.match(lines[j]) and not (re.match(r'^-{10,}$', lines[j]) and j + 1 < len(lines) and AH.match(lines[j + 1])):
                out.append(lines[j]); j += 1
            cur["prompt"] = "\n".join(out).strip(); i = j; continue
    i += 1
E, W = [], []
expect_img, prev_pan = 1, ""
for k, it in enumerate(items):
    tag = f"AUTO {it['auto']:03d}"
    if it["kind"] == "?": E.append(f"{tag}: unreadable header"); continue
    if it["t0"] is None: E.append(f"{tag}: missing TIMECODE"); continue
    if k and items[k - 1]["t1"] is not None and abs(items[k - 1]["t1"] - it["t0"]) > 1: E.append(f"{tag}: gap/overlap with the previous item")
    if it["kind"] == "AI":
        d = (it["t1"] - it["t0"]) / 1000
        if d < 9.5 or d > 25.0: W.append(f"{tag}: AI sub-section is {d:.2f}s (want 10–20; a whole AI section may run to the 25 s ceiling)")
        if it["pan"] not in PANS: E.append(f"{tag}: PAN must be one of {'/'.join(PANS)}")
        elif it["pan"] == prev_pan: E.append(f"{tag}: same PAN as the previous AI sub-section")
        prev_pan = it["pan"]
        if it["image"] != expect_img: E.append(f"{tag}: AI IMAGE {it['image']} (expected {expect_img})")
        expect_img = max(expect_img, (it["image"] or 0) + 1)
        if not it["prompt"]: E.append(f"{tag}: missing PROMPT")
        else:
            if it["prompt"].startswith("[REWRITE"): E.append(f"{tag}: PROMPT still carries the [REWRITE …] marker — write the sub-section's own prompt")
            if SUFFIX and not it["prompt"].rstrip().endswith(SUFFIX): E.append(f"{tag}: PROMPT does not end with the channel STYLE SUFFIX")
        s = bynum.get(it["section"])
        if not s or s["type"] != "AI": E.append(f"{tag}: SECTION {it['section']} is not an AI section of the breakdown")
    else:
        prev_pan = ""
        s = bynum.get(it["section"])
        if not s: E.append(f"{tag}: SECTION {it['section']} is not in the breakdown")
        else:
            if s["type"] != it["kind"]: E.append(f"{tag}: type {it['kind']} but SECTION {it['section']} is {s['type']}")
            if s["t0"] is not None and (abs(s["t0"] - it["t0"]) > 1 or abs(s["t1"] - it["t1"]) > 1): E.append(f"{tag}: TIMECODE differs from SECTION {it['section']}")
            want = f"S{s['num']:03d}_{s['type']}{'' if s['type'] == 'HOOK' else s.get('ord', 1)}"
            if it["render"] != want: E.append(f"{tag}: RENDER must be {want}")
for s in bd:
    parts = [it for it in items if it["section"] == s["num"]]
    if not parts: E.append(f"SECTION {s['num']} ({s['type']}) has no AUTO item"); continue
    if s["type"] == "AI":
        t0 = min(p["t0"] for p in parts if p["t0"] is not None); t1 = max(p["t1"] for p in parts if p["t1"] is not None)
        if abs(t0 - s["t0"]) > 1 or abs(t1 - s["t1"]) > 1: E.append(f"SECTION {s['num']} (AI): its parts do not cover its TIMECODE exactly")
    elif len(parts) != 1: E.append(f"SECTION {s['num']} ({s['type']}) appears {len(parts)} times")
if items and bd and items[-1]["t1"] is not None and abs(items[-1]["t1"] - bd[-1]["t1"]) > 1: E.append(f"AUTO structure ends at {hms(items[-1]['t1'])}, breakdown at {hms(bd[-1]['t1'])}")
if items and items[0]["t0"] not in (None, 0): E.append("AUTO 001 must start at 00:00:00.000")
twin = f"{OUT}/{subj}_auto_video_structure.json"
json.dump({"subject": subj, "source": os.path.basename(FULL), "items": items, "aiImages": sum(1 for it in items if it["kind"] == "AI"),
           "specials": [it["render"] for it in items if it["kind"] not in ("AI", "?")], "durationMs": items[-1]["t1"] if items else 0}, open(twin, "w", encoding="utf-8"), indent=1)
for w in W: print(f"[warn] {w}")
for e in E: print(f"[FAIL] {e}")
print(f"AUTO STRUCTURE LINT: {len(E)} FAIL / {len(W)} WARN · {len(items)} items · {sum(1 for it in items if it['kind'] == 'AI')} AI images → {os.path.basename(twin)}")
sys.exit(1 if E else 0)
