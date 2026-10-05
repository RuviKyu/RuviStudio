#!/usr/bin/env python3
"""
BUNDLE — build + validate <Subject>_allanimations.json (schema 6.14 = maps v6.13 + stills 1.0).

    python3 bundle.py build <folder>                     assemble from .selftest/maps/*.json + .selftest/stills.json
    python3 bundle.py times <folder> <section> "Name" …  first in-window mention of each name in the word SRT
                                                          (fuzzy ≥ 0.8), absolute + comp-local ms

YOU write (the creative part only):
  .selftest/maps/<asset>.json  one per HOOK / MAP section, named like the sheet ("HOOK 1.json", "MAP 3.json"):
     {"render": "route" | "highlight" | "pins", "route": true (optional),
      "locations": [{"name": "Nassau", "x": 2480, "y": 1320, "highlight": true, "shape": [[x,y],…] (optional),
                     "timeMs": 1500 (optional — resolved from the word SRT when absent), "spoken": "nassaw" (optional
                     ASR spelling to match), "estimated": false, "color": [r,g,b] (optional)}]}
  .selftest/stills.json       an array, one object per REF / CHAR section:
     {"source_file": "REF 2.jpg", "still_type": "REF", "focus": {"xNorm": .62, "yNorm": .41}, "move": "auto"}
     {"source_file": "CHAR 1.jpg", "still_type": "CHAR", "name": "Charles Vane", "side": "left", "background": "dark",
      "face": {"xNorm": .5, "yNorm": .3}, "crop": {"xNorm":0,"yNorm":0,"wNorm":1,"hNorm":.8} (optional), "treatment": "auto"}
THE SCRIPT fills everything mechanical: map_name, source_file (from the file name), map_width/height and
image_width/height (from the downloaded file / refs.json), coordinate_space, comp_start_ms /
comp_duration_ms (the section's TIMECODE), time_base, xNorm/yNorm, shapeNorm, section numbers, the
HOOK-first order, and every timeMs it can read from the SRT (clamped to the comp; outside → warning).
Then it validates (required keys, ranges, one object per special section) and writes the bundle.
Exit 1 on any error.
"""
import os, re, sys, json, glob, difflib
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
if len(sys.argv) < 3: sys.exit(__doc__)
CMD, F = sys.argv[1], sys.argv[2]; ST = os.path.join(F, ".selftest")
HDR = re.compile(r"^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$")
TC = re.compile(r"TIMECODE:\s*(\d\d):(\d\d):(\d\d)\.(\d{3})\s*(?:→|->)\s*(\d\d):(\d\d):(\d\d)\.(\d{3})")
def ms(h, m, s, f): return ((int(h) * 60 + int(m)) * 60 + int(s)) * 1000 + int(f)
def is_bd(p):
    try: return len(re.findall(r"(?m)^SECTION\s+\d+\s*\|", open(p, encoding="utf-8", errors="ignore").read()))
    except Exception: return 0
cands = [p for p in glob.glob(os.path.join(F, "*.txt")) if is_bd(p) and not re.search(r"special|_original|auto_video", os.path.basename(p), re.I)]
if not cands: sys.exit("no FULL breakdown")
FULL = max(cands, key=is_bd); SUBJ = re.sub(r"(_breakdown)?\.txt$", "", os.path.basename(FULL))
secs = []; cur = None; title = ""; cnt = {"MAP": 0, "REF": 0, "CHAR": 0}
for ln in open(FULL, encoding="utf-8").read().split("\n"):
    m = HDR.match(ln)
    if m:
        ty = m.group(3).split()[0].upper(); cur = {"num": int(m.group(1)), "type": ty, "label": m.group(3), "t0": None, "t1": None, "script": ""}
        if ty in cnt: cnt[ty] += 1
        cur["asset"] = "HOOK 1" if ty == "HOOK" else (f"{ty} {cnt[ty]}" if ty in cnt else ""); secs.append(cur); continue
    if cur is None:
        if ln.startswith("HISTORY MAPS CHANNELS — "): title = ln.split("— ", 1)[1].strip()
        continue
    t = TC.search(ln)
    if t: cur["t0"] = ms(*t.groups()[:4]); cur["t1"] = ms(*t.groups()[4:])
if any(s["t0"] is None for s in secs): sys.exit("the breakdown is not stamped — run run_all.py first")
by_asset = {s["asset"]: s for s in secs if s["asset"]}

# word stream for pin times
W = []
for p in [os.path.join(F, f"{SUBJ}_word_level.srt")] + glob.glob(os.path.join(F, "*.srt")):
    if not os.path.exists(p): continue
    raw = open(p, encoding="utf-8-sig", errors="ignore").read()
    for blk in re.split(r"\n\s*\n", raw.strip()):
        L = blk.strip().split("\n")
        if len(L) < 3: continue
        m = re.match(r"(\d\d):(\d\d):(\d\d)[,.](\d{3})\s*-->\s*(\d\d):(\d\d):(\d\d)[,.](\d{3})", L[1])
        if not m: continue
        g = m.groups(); t0 = ms(*g[:4]); t1 = ms(*g[4:])
        ws = re.findall(r"[a-z0-9']+", " ".join(L[2:]).lower()); n = len(ws) or 1
        for k, w in enumerate(ws): W.append((t0 + (t1 - t0) * k // n, w))
    if W: break
def first_mention(name, t0, t1, spoken=None):
    toks = re.findall(r"[a-z0-9']+", (spoken or name).lower()); win = [(t, w) for (t, w) in W if t0 <= t < t1]
    if not toks or not win: return None
    best = None
    for i in range(len(win)):
        seg = " ".join(w for _, w in win[i:i + len(toks)]); r = difflib.SequenceMatcher(None, seg, " ".join(toks)).ratio()
        if r >= 0.8 and (best is None or r > best[1]):
            best = (win[i][0], r, seg)
            if r >= 0.98: break
    return best
if CMD == "times":
    sec = next((s for s in secs if s["num"] == int(sys.argv[3])), None)
    if not sec: sys.exit("no such section")
    for name in sys.argv[4:]:
        b = first_mention(name, sec["t0"], sec["t1"])
        print(f"{name}: " + (f"abs {b[0]} ms → comp-local {b[0] - sec['t0']} ms (ASR '{b[2]}', match {b[1]:.2f})" if b else "NOT spoken in the window (set timeMs by hand with \"estimated\": true, or give \"spoken\")"))
    sys.exit(0)

refs = json.load(open(os.path.join(ST, "refs.json"))) if os.path.exists(os.path.join(ST, "refs.json")) else {}
E, Wn = [], []
maps = []
for p in sorted(glob.glob(os.path.join(ST, "maps", "*.json"))):
    asset = os.path.splitext(os.path.basename(p))[0]; sec = by_asset.get(asset)
    if not sec: E.append(f"{os.path.basename(p)}: no {asset} section in the breakdown"); continue
    try: o = json.load(open(p, encoding="utf-8"))
    except Exception as e: E.append(f"{asset}.json: {e}"); continue
    img = next((x for x in glob.glob(os.path.join(ST, "maps", asset + ".*")) if not x.endswith(".json")), None)
    ref = next((v for k, v in refs.items() if os.path.splitext(k)[0] == asset), None)
    if img: Wd, Hd = Image.open(img).size; src = os.path.basename(img)
    elif ref: Wd, Hd = ref["w"], ref["h"]; src = asset + os.path.splitext(ref["source_url"])[1].lower().replace(".jpeg", ".jpg")
    else: E.append(f"{asset}: no downloaded sheet and no refs.json record (run link_verify + fetch_assets)"); continue
    o["map_name"] = o.get("map_name") or f"Section {sec['num']} — {sec['label']}"; o["source_file"] = src
    o["map_width"], o["map_height"] = int(Wd), int(Hd); o["coordinate_space"] = "image_pixels_top_left_origin"
    o["comp_start_ms"] = sec["t0"]; o["comp_duration_ms"] = sec["t1"] - sec["t0"]; o["time_base"] = "comp_local"
    o["render"] = o.get("render") or "pins"
    if o["render"] not in ("route", "highlight", "pins"): E.append(f"{asset}: render must be route|highlight|pins")
    locs = o.get("locations") or []
    if not locs: E.append(f"{asset}: no locations")
    for loc in locs:
        if "x" not in loc or "y" not in loc:
            if "xNorm" in loc: loc["x"] = int(round(loc["xNorm"] * Wd)); loc["y"] = int(round(loc["yNorm"] * Hd))
            else: E.append(f"{asset}/{loc.get('name')}: no x/y"); continue
        loc["x"], loc["y"] = int(round(loc["x"])), int(round(loc["y"]))
        loc["xNorm"] = round(loc["x"] / Wd, 4); loc["yNorm"] = round(loc["y"] / Hd, 4)
        if not (0 <= loc["xNorm"] <= 1 and 0 <= loc["yNorm"] <= 1): E.append(f"{asset}/{loc.get('name')}: off the sheet")
        if "shape" in loc:
            loc["shape"] = [[int(round(x)), int(round(y))] for x, y in loc["shape"]]
            loc["shapeNorm"] = [[round(x / Wd, 4), round(y / Hd, 4)] for x, y in loc["shape"]]
            if len(loc["shape"]) < 3: E.append(f"{asset}/{loc.get('name')}: shape needs ≥ 3 points")
        if loc.get("timeMs") is None:
            b = first_mention(loc.get("name", ""), sec["t0"], sec["t1"], loc.get("spoken"))
            if b: loc["timeMs"] = b[0] - sec["t0"]; loc.setdefault("estimated", False); loc["_asr"] = b[2]
            else: E.append(f"{asset}/{loc.get('name')}: not spoken in the window — give timeMs (comp-local) with \"estimated\": true, or \"spoken\"")
        if loc.get("timeMs") is not None:
            loc["timeMs"] = int(round(loc["timeMs"]))
            if not (0 <= loc["timeMs"] <= o["comp_duration_ms"]): Wn.append(f"{asset}/{loc.get('name')}: timeMs {loc['timeMs']} outside the comp (0–{o['comp_duration_ms']}) — clamped"); loc["timeMs"] = max(0, min(o["comp_duration_ms"], loc["timeMs"]))
            loc.setdefault("estimated", False)
        loc.pop("spoken", None)
    if o["render"] == "route" and len(locs) < 2: E.append(f"{asset}: a route needs 2+ locations")
    maps.append((sec["num"], o))
for s in secs:
    if s["type"] in ("HOOK", "MAP") and not any(n == s["num"] for n, _ in maps): E.append(f"S{s['num']} {s['asset']}: no map object (.selftest/maps/{s['asset']}.json)")
maps.sort(key=lambda t: (0 if by_asset.get(t[1]["source_file"].rsplit(".", 1)[0], {}).get("type") == "HOOK" else 1, t[0]))
stills = []
sp = os.path.join(ST, "stills.json")
if os.path.exists(sp):
    try: arr = json.load(open(sp, encoding="utf-8"))
    except Exception as e: E.append(f"stills.json: {e}"); arr = []
    for o in arr:
        sf = str(o.get("source_file", "")); asset = os.path.splitext(sf)[0]; sec = by_asset.get(asset)
        if not sec: E.append(f"stills {sf}: no such section asset"); continue
        ref = next((v for k, v in refs.items() if os.path.splitext(k)[0] == asset), None)
        if ref: o["source_file"] = asset + os.path.splitext(ref["source_url"])[1].lower().replace(".jpeg", ".jpg"); o["image_width"], o["image_height"] = ref["w"], ref["h"]
        o["still_type"] = sec["type"]; o["section"] = sec["num"]; o["comp_start_ms"] = sec["t0"]; o["comp_duration_ms"] = sec["t1"] - sec["t0"]; o["time_base"] = "comp_local"
        o.setdefault("move", "auto")
        if sec["type"] == "REF":
            f = o.get("focus") or {}
            if not (0 <= f.get("xNorm", -1) <= 1 and 0 <= f.get("yNorm", -1) <= 1): E.append(f"{sf}: focus xNorm/yNorm required (0..1)")
        else:
            if not o.get("name"): E.append(f"{sf}: name")
            if o.get("side") not in ("left", "right"): E.append(f"{sf}: side left|right")
            if o.get("background") not in ("dark", "light", "busy"): E.append(f"{sf}: background dark|light|busy")
            if o.get("treatment", "auto") not in ("auto", "cutout", "blend", "framed"): E.append(f"{sf}: treatment")
        stills.append((sec["num"], o))
for s in secs:
    if s["type"] in ("REF", "CHAR") and not any(n == s["num"] for n, _ in stills): E.append(f"S{s['num']} {s['asset']}: no still object (.selftest/stills.json)")
stills.sort(key=lambda t: t[0])
bundle = {"n8n_maps_bundle": 1, "project": title or SUBJ, "stills_schema": "1.0", "maps": [o for _, o in maps], "stills": [o for _, o in stills]}
for w in Wn: print("[warn] " + w)
for e in E: print("[FAIL] " + e)
if E: print(f"BUNDLE: {len(E)} error(s) — nothing written"); sys.exit(1)
dest = os.path.join(F, f"{SUBJ}_allanimations.json"); json.dump(bundle, open(dest, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
asr = [(o["source_file"], l["name"], l["_asr"]) for o in bundle["maps"] for l in o["locations"] if l.get("_asr") and l["_asr"].replace(" ", "") != re.sub(r"[^a-z0-9']", "", l["name"].lower())]
for o in bundle["maps"]:
    for l in o["locations"]: l.pop("_asr", None)
json.dump(bundle, open(dest, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print(f"BUNDLE: {dest}  ({len(bundle['maps'])} map(s) incl. HOOK, {len(bundle['stills'])} still(s)) · VALIDATION: 0 errors")
if asr: print("  ASR spellings matched: " + "; ".join(f"{a}/{n} ← '{s}'" for a, n, s in asr))
