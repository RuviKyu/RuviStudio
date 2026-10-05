#!/usr/bin/env python3
"""
MAKE AUTO STRUCTURE — (r11, Video_AutoStructure.md) derive [Subject]_auto_video_structure.txt
from the STAMPED FULL breakdown and the word-level SRT.

Every HOOK / MAP / REF / CHAR section becomes ONE auto item that keeps the section's
identity and TIMECODE and names the render the Conductor will look for
(RENDER: S###_TYPE#). Every AI section is split into SUB-SECTIONS of ~10–20 s that
end on sentence boundaries (from the word timings), each with:
  • its own TIMECODE (the parts tile the section exactly),
  • a PAN — one of the eight compass directions, pseudo-random, never the same as
    the previous AI sub-section,
  • ONE AI IMAGE number (running order over the whole video → AI Images\\<nnn>.jpg, three digits),
  • ONE PROMPT. This script seeds it with the parent section's PROMPT 1 and marks it
    [REWRITE]; Phase S2 rewrites every prompt to describe THAT sub-section's own
    sentences (one image per idea), keeping the channel suffix.

Usage:  python3 make_auto_structure.py <folder> [--min 10 --max 20 --seed <n>]
Exit 1 if the breakdown is unstamped or the SRT is missing.
"""
import re, os, sys, glob, json

OUT = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "/mnt/user-data/outputs"
def arg(k, d):
    if k in sys.argv:
        try: return type(d)(sys.argv[sys.argv.index(k) + 1])
        except Exception: return d
    return d
MIN_S, MAX_S, SEED = arg("--min", 10.0), arg("--max", 20.0), arg("--seed", 0)
PANS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]

def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p, encoding="utf-8", errors="ignore").read()))
    except Exception: return 0
cands = [p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and "special" not in os.path.basename(p).lower()
         and "_original" not in os.path.basename(p).lower() and "auto_video_structure" not in os.path.basename(p).lower()]
if not cands: sys.exit("No FULL breakdown found.")
FULL = max(cands, key=is_breakdown)
subj = re.sub(r'(_breakdown)?\.txt$', '', os.path.basename(FULL))
text = open(FULL, encoding="utf-8").read()

HDR = re.compile(r'^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$')
TC = re.compile(r'TIMECODE:\s*(\d\d):(\d\d):(\d\d)\.(\d{3})\s*(?:→|->)\s*(\d\d):(\d\d):(\d\d)\.(\d{3})')
def ms(h, m, s, f): return ((int(h) * 60 + int(m)) * 60 + int(s)) * 1000 + int(f)
def hms(t):
    t = max(0, int(round(t))); f = t % 1000; s = t // 1000 % 60; m = t // 60000 % 60; h = t // 3600000
    return f"{h:02d}:{m:02d}:{s:02d}.{f:03d}"

secs, cur = [], None
title = ""
for l in text.split("\n"):
    m = HDR.match(l)
    if m:
        cur = {"num": int(m.group(1)), "label": m.group(3), "type": m.group(3).split()[0].upper(), "t0": None, "t1": None, "script": [], "prompt1": [], "lines": []}
        secs.append(cur); continue
    if cur is None:
        if l.startswith("HISTORY MAPS CHANNELS — "): title = l.split("— ", 1)[1].strip()
        continue
    cur["lines"].append(l)
    t = TC.search(l)
    if t: cur["t0"] = ms(*t.groups()[:4]); cur["t1"] = ms(*t.groups()[4:])
suffix_m = re.search(r'^STYLE SUFFIX:\s*"(.+)"\s*$', text, re.M)
SUFFIX = suffix_m.group(1) if suffix_m else ""
for s in secs:
    L = s["lines"]
    if "SCRIPT:" in L:
        k = L.index("SCRIPT:")
        for ln in L[k + 1:]:
            if not ln.strip() or ln.startswith("MAP SUBJECT:"): break
            s["script"].append(ln)
    for i, ln in enumerate(L):
        if re.match(r'^PROMPT 1:', ln):
            for ln2 in L[i + 1:]:
                if not ln2.strip(): break
                s["prompt1"].append(ln2)
            break
if any(s["t0"] is None for s in secs): sys.exit("The FULL breakdown is not stamped (TIMECODE: [PENDING]) — run time_breakdown.py first.")

# word timings (for sentence-boundary cuts inside AI sections)
wl = [p for p in glob.glob(f"{OUT}/*_word_level.srt")]
words = []
if wl:
    srt = open(wl[0], encoding="utf-8", errors="ignore").read()
    for blk in re.split(r'\n\s*\n', srt.strip()):
        ls = blk.strip().split("\n")
        if len(ls) < 3: continue
        tm = re.match(r'(\d\d):(\d\d):(\d\d)[,.](\d{3})\s*-->\s*(\d\d):(\d\d):(\d\d)[,.](\d{3})', ls[1])
        if not tm: continue
        words.append({"t0": ms(*tm.groups()[:4]), "t1": ms(*tm.groups()[4:]), "w": " ".join(ls[2:]).strip()})
else:
    print("[warn] no *_word_level.srt — AI sub-sections are cut at equal parts (not on sentence ends)")

def sentence_ends_between(t0, t1):
    """word end-times inside (t0,t1) where the word ends a sentence"""
    out = []
    for w in words:
        if w["t1"] <= t0 or w["t1"] >= t1: continue
        if re.search(r'[.!?…]["”)]?$', w["w"]): out.append(w["t1"])
    return out

def split_ai(s):
    d = s["t1"] - s["t0"]; lo, hi = MIN_S * 1000, MAX_S * 1000
    if d <= hi + 5000: return [(s["t0"], s["t1"])]      # (r18) every AI section up to the 25 s ceiling stays ONE part = one image, PROMPT 1 verbatim
    n = max(2, int(round(d / ((lo + hi) / 2))))
    while n > 1 and d / n < lo: n -= 1
    while d / n > hi: n += 1
    ideal = [s["t0"] + d * k / n for k in range(1, n)]
    ends = sentence_ends_between(s["t0"], s["t1"])
    cuts, last = [], s["t0"]
    for goal in ideal:
        best = None
        for e in ends:
            if e - last < lo or s["t1"] - e < lo: continue
            if best is None or abs(e - goal) < abs(best - goal): best = e
        cut = best if best is not None and abs(best - goal) <= 3000 else goal
        cuts.append(int(round(cut))); last = cut
    bounds = [s["t0"]] + cuts + [s["t1"]]
    parts = [(bounds[i], bounds[i + 1]) for i in range(len(bounds) - 1)]
    # merge any sliver
    fixed = []
    for p in parts:
        if fixed and (p[1] - p[0]) < lo * 0.6: fixed[-1] = (fixed[-1][0], p[1])
        else: fixed.append(p)
    return fixed

def rnd(seed):
    x = (seed * 1103515245 + 12345) & 0x7fffffff
    def nxt():
        nonlocal x; x = (x * 1103515245 + 12345) & 0x7fffffff; return x
    return nxt
R = rnd(SEED or len(secs))
items, img, prev_pan = [], 0, ""
cnt = {"MAP": 0, "REF": 0, "CHAR": 0}
for s in secs:
    ty = s["type"]
    if ty in cnt: cnt[ty] += 1
    if ty != "AI":
        ordn = 1 if ty == "HOOK" else cnt.get(ty, 1)
        items.append({"kind": ty, "section": s["num"], "render": f"S{s['num']:03d}_{ty}{'' if ty == 'HOOK' else ordn}", "t0": s["t0"], "t1": s["t1"]})
        prev_pan = ""
        continue
    parts = split_ai(s)
    for pi, (a, b) in enumerate(parts, 1):
        img += 1
        choices = [p for p in PANS if p != prev_pan]; pan = choices[R() % len(choices)]; prev_pan = pan
        seed = " ".join(s["prompt1"]).strip() or ("A scene from this section. " + SUFFIX)
        items.append({"kind": "AI", "section": s["num"], "part": f"{pi}/{len(parts)}", "image": img, "pan": pan, "t0": a, "t1": b,
                      "prompt": ("[REWRITE for this sub-section] " if len(parts) > 1 else "") + seed,
                      "words": " ".join(w["w"] for w in words if a <= w["t0"] < b)})

L = []
a = L.append
a("=" * 40); a(f"AUTO VIDEO STRUCTURE — {title or subj}"); a("=" * 40)
a(f"SOURCE: {os.path.basename(FULL)}")
a(f"SECTIONS: {len(secs)} FULL → {len(items)} AUTO")
a(f"AI SUB-SECTION LENGTH: {MIN_S:g}-{MAX_S:g} s, one prompt each")
a("TRANSITION: fade 0.5s at every cut (fade out to black, fade in)")
a("AI MOVE: ken burns, 8 compass directions, pseudo-random, never twice in a row")
a(f"AI IMAGES: {img} (AI Images\\001.jpg … {img:03d}.jpg, numbered in running order)")
a(f"SPECIAL RENDERS: {sum(1 for it in items if it['kind'] != 'AI')} (Output\\parts\\S###_TYPE#.mp4 from Ruvi Studio's native renderer)")
a("=" * 40); a("")
n = 0
for it in items:
    n += 1
    a("-" * 40)
    if it["kind"] == "AI": a(f"AUTO {n:03d} | from SECTION {it['section']} (AI) | part {it['part']} | AI IMAGE {it['image']}")
    else: a(f"AUTO {n:03d} | SECTION {it['section']} ({it['kind']}) | RENDER: {it['render']}")
    a("-" * 40)
    a(f"TIMECODE: {hms(it['t0'])} → {hms(it['t1'])} ({(it['t1'] - it['t0']) / 1000:.2f}s)")
    if it["kind"] == "AI":
        a(f"PAN: {it['pan']}")
        if it.get("words"): a(f"NARRATION: {it['words']}")
        a("PROMPT:"); a(it["prompt"])
    a("")
dest = f"{OUT}/{subj}_auto_video_structure.txt"
open(dest, "w", encoding="utf-8").write("\n".join(L))
print(f"Auto structure: {dest}")
print(f"  {len(secs)} sections → {len(items)} items · {img} AI images · {sum(1 for it in items if it['kind'] != 'AI')} special renders")
rew = sum(1 for it in items if it["kind"] == "AI" and it["prompt"].startswith("[REWRITE"))
print(f"  prompts to rewrite in Phase S2: {rew} (marked [REWRITE …]); every other AI prompt is the section's PROMPT 1 verbatim — review it too")
