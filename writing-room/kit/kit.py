#!/usr/bin/env python3
# ============================================================================
# CARTOGRAPHER VISION-RELIABILITY KIT  ·  KIT REVISION A4-2026-08-03
# Companion to Video_Cartographer.md v7.4 ADDENDA A2+A4 (matched set 2026-08-03-r4).
# CANONICAL SCRIPT — ships only in cartographer_kit.zip. Never retype it.
# Subcommands:
#   selftest                                   environment + deps check
#   canary new                                 make a random proof-of-vision image
#                                              (A4.4: truth is SEALED — salted sha256, no
#                                              plaintext code on disk; fails don't leak it)
#   canary check <CODE> --via view|ocr|user     verify what was read + HOW; only --via view
#                                              certifies VISUAL verdicts (A2 faculty rule)
#   canary read [--check]                      A4.3 voting OCR reader (whitelist + multi-psm);
#                                              --check submits the best read --via ocr
#   canary fail "<reason>"                     log a vision outage explicitly
#   ocr probe <img> "<phrase>" [...]           OCR label-presence check (vision-free)
#   ocr grid <img>                             OCR the border graticule numerals
#   georef auto <img>                          calibrate from grid output (vision-free)
#   georef add <img> <px> <py> <lat> <lon>     add a manual control point
#   georef fit <img>                           (re)fit + residual report
#   georef place <img> <lat> <lon> [name]      real-world coords -> map px + norm
#   phasea scan <maps_dir>                     dims/MP/aspect + low-res tripwire -> state
#   phasea georef <maps_dir> [--fresh]         Phase-A DRY-RUN: grid+auto per sheet; ACTUAL
#                                              result recorded in state (never predicted)
#   phasea set <img> --cartouche .. --scale .. --subject .. --lat .. --lon .. --source ..
#              --coord-source google-maps|gazetteer|user --verdict .. --evidence ..
#                                              structured per-sheet Phase-A record (A2.8:
#                                              coords read LIVE from Google Maps, never memory)
#   phasea hashref <refs.json>                 A4.2 load reference records (sha1/size/dims/
#                                              source_url per expected local filename)
#   phasea hashmatch <maps_dir|img>            A4.2 CRYPTOGRAPHIC identity: sha1 vs the
#                                              recorded original -> exact|meta|scaled|none
#   phasea audit                               MECHANICAL GATE: blocks Phase B until every
#                                              sheet has cartouche+class+subject+verdict+
#                                              evidence; settlement-title rule; vision rule;
#                                              A4.2: hash-match evidence needs an EXACT sha1
#   state init|set <key> <json>|get [key]|note "<txt>"
#   bundle [out.zip]                           resume bundle (state+calib+crops list);
#                                              A4.1: mints the NEXT session's canary so
#                                              certification rides WITH the maps
# All artifacts live under ./.kit/ of the CWD (the project folder).
# ============================================================================
import sys, os, json, time, random, string, argparse, hashlib, zipfile, glob, re

KIT_REV = "A4-2026-08-03"
KDIR = os.path.join(os.getcwd(), ".kit")
STATE = os.path.join(KDIR, "cartographer_state.json")

def _ensure(): os.makedirs(KDIR, exist_ok=True)

def _load():
    if os.path.exists(STATE):
        with open(STATE) as f: return json.load(f)
    return {"kit_revision": KIT_REV, "created": time.strftime("%Y-%m-%d %H:%M:%S"),
            "inputs": {}, "sections": {}, "maps": {}, "canary_log": [], "notes": [],
            "view_count": 0}

def _save(s):
    _ensure(); s["updated"] = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(STATE, "w") as f: json.dump(s, f, indent=2)

def sha12(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()[:12]

# ---------------------------------------------------------------- selftest --
def cmd_selftest(_):
    ok = True
    try:
        from PIL import Image; print("PIL           OK")
    except Exception as e: ok = False; print("PIL           MISSING:", e)
    try:
        import numpy; print("numpy         OK")
    except Exception as e: ok = False; print("numpy         MISSING  (pip install numpy --break-system-packages):", e)
    try:
        import pytesseract
        v = str(pytesseract.get_tesseract_version()); print("tesseract     OK", v)
    except Exception as e:
        ok = False
        print("tesseract     MISSING  (apt-get install -y tesseract-ocr; pip install pytesseract --break-system-packages):", e)
    _ensure(); t = os.path.join(KDIR, ".w"); open(t, "w").write("w"); os.remove(t)
    print("state dir     OK", KDIR)
    print("SELFTEST", "PASS" if ok else "FAIL")
    return 0 if ok else 1

# ------------------------------------------------------------------ canary --
# A4.3: alphabet drops 9 (both production canary failures misread this glyph: 9->Q, 9->O)
# and U (U/V confusion on bold sans). Still no 0O 1I B8 S5 2Z G6 Q.
CAN_ALPHA = "ACDEFHJKLMNPRTVWXY3467"

def cmd_canary_new(_):
    from PIL import Image, ImageDraw, ImageFont
    _ensure()
    code = "".join(random.choice(CAN_ALPHA) for _ in range(6))
    # A4.3: much bigger glyphs + explicit letterspacing (no touching pairs), plain field.
    W, H = 1500, 460
    im = Image.new("RGB", (W, H), (252, 252, 250)); d = ImageDraw.Draw(im)
    try: font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 230)
    except Exception:
        try: font = ImageFont.load_default(size=230)
        except Exception: font = ImageFont.load_default()
    x = 70
    for ch in code:
        d.text((x, 90), ch, fill=(10, 10, 10), font=font)
        try: adv = d.textlength(ch, font=font)
        except Exception: adv = 150
        x += int(adv) + 45
    d.rectangle([8, 8, W-9, H-9], outline=(150, 150, 150), width=3)
    ts = time.strftime("%H%M%S")
    img_path = os.path.join(KDIR, f"canary_{ts}.png")
    im.save(img_path)
    # A4.4: SEALED TRUTH — only a salted sha256 of the code touches disk. Nothing on the
    # filesystem (state, truth, bundle) can reveal the code; a failed check cannot leak it,
    # so a failed canary is retryable and the truth file is safe to ship in resume bundles.
    salt = os.urandom(8).hex()
    digest = hashlib.sha256((salt + code).encode()).hexdigest()
    with open(os.path.join(KDIR, f"canary_{ts}.truth.json"), "w") as f:
        json.dump({"v": 2, "ts": ts, "n": len(code), "alpha": CAN_ALPHA,
                   "salt": salt, "sha256": digest}, f)
    print("CANARY IMAGE:", img_path)
    print("Now VIEW that image and run:  python3 kit.py canary check <code-you-read> --via view")
    print("(--via ocr / --via user if that is honestly how the code was read; only --via view certifies visual verdicts)")
    print("Automated fallback reader:    python3 kit.py canary read --check   (certifies the OCR path only)")
    return 0

def _latest_truth():
    fs = sorted(glob.glob(os.path.join(KDIR, "canary_*.truth.json")))
    if not fs: return None, None
    with open(fs[-1]) as f: return fs[-1], json.load(f)

def _truth_match(truth, got):
    if truth.get("v", 1) >= 2:
        return hashlib.sha256((truth["salt"] + got).encode()).hexdigest() == truth["sha256"]
    return got == (truth.get("code") or "").upper()      # legacy v1 truth files

def cmd_canary_check(a):
    s = _load(); path, truth = _latest_truth()
    if not truth: print("No canary issued. Run: canary new"); return 2
    got = (a.code or "").strip().upper()
    ok = _truth_match(truth, got)
    via = getattr(a, "via", None) or "view"
    cts = truth.get("ts", "?")
    attempt = 1 + sum(1 for r in s["canary_log"]
                      if r.get("canary_ts") == cts and r.get("result") == "FAIL")
    # A4.4: the expected code is NEVER printed or logged — a failed check leaks nothing,
    # so this same canary stays live and retryable (every attempt is on the record).
    rec = {"ts": time.strftime("%H:%M:%S"), "result": "PASS" if ok else "FAIL", "via": via,
           "read": got, "canary_ts": cts, "attempt": attempt,
           "view_count_at": s.get("view_count", 0)}
    s["canary_log"].append(rec); _save(s)
    print("CANARY", rec["result"], f"(read {got or '<blank>'}, via {via}, canary {cts}, attempt {attempt})")
    if ok and via != "view":
        print("NOTE (A2 faculty rule): this PASS certifies the", via.upper(), "path only.")
        print("VISUAL verdicts remain UNCERTIFIED until a canary passes --via view;")
        print("phasea audit will downgrade model-view PASSes to UNVERIFIED meanwhile.")
    if not ok:
        print("This canary remains live (sealed truth leaked nothing). Re-read and retry,")
        print("or after ~3 attempts mint a fresh one: canary new")
        print("VISION DOWN protocol if the faculty is out: stop visual claims -> mark pending"
              " verdicts UNVERIFIED -> kit.py bundle -> hand off.")
    return 0 if ok else 1

def cmd_canary_read(a):
    # A4.3: automated fallback reader for the OCR path — whitelist-constrained,
    # multi-scale, multi-psm VOTING instead of a single font-dependent guess.
    from PIL import Image, ImageOps, ImageFilter
    import pytesseract
    path, truth = _latest_truth()
    if not truth: print("No canary issued. Run: canary new"); return 2
    img = os.path.join(KDIR, f"canary_{truth.get('ts','')}.png")
    if not os.path.exists(img):
        cands = sorted(glob.glob(os.path.join(KDIR, "canary_*.png")))
        if not cands: print("No canary image found."); return 2
        img = cands[-1]
    alpha = truth.get("alpha", CAN_ALPHA)
    im = Image.open(img).convert("L")
    votes = {}
    for scale in (2, 3):
        g = im.resize((im.width*scale, im.height*scale), Image.LANCZOS)
        g = ImageOps.autocontrast(g).filter(ImageFilter.MedianFilter(3))
        bw = g.point(lambda v: 0 if v < 150 else 255)
        for psm in ("7", "8", "6", "13"):
            cfg = f"--psm {psm} -c tessedit_char_whitelist={alpha}"
            t = pytesseract.image_to_string(bw, config=cfg)
            t = re.sub(r"[^A-Z0-9]", "", (t or "").upper())
            if t: votes[t] = votes.get(t, 0) + 1
    if not votes: print("OCR returned nothing readable from", os.path.basename(img)); return 1
    # A4.3: the sealed truth records the code LENGTH (n) — reads of the wrong length are
    # OCR artefacts (dropped/merged glyphs); prefer full-length candidates when any exist.
    n = truth.get("n")
    if n and any(len(t) == n for t in votes):
        votes = {t: c for t, c in votes.items() if len(t) == n}
    total = sum(votes.values()); best = max(votes, key=votes.get)
    for t, n in sorted(votes.items(), key=lambda kv: -kv[1]): print(f"  {n}/{total}  {t}")
    print(f"BEST OCR READ: {best}  (agreement {votes[best]}/{total})")
    if getattr(a, "check", False):
        import types
        return cmd_canary_check(types.SimpleNamespace(code=best, via="ocr"))
    print("To certify the OCR path:  canary check", best, "--via ocr")
    return 0

def cmd_canary_fail(a):
    s = _load()
    s["canary_log"].append({"ts": time.strftime("%H:%M:%S"), "result": "FAIL",
                            "reason": a.reason, "view_count_at": s.get("view_count", 0)})
    _save(s); print("CANARY FAIL logged:", a.reason); return 1

# --------------------------------------------------------------------- ocr --
def _norm_txt(t):
    t = t.upper()
    t = (t.replace("ſ", "S").replace("Ñ", "N").replace("É", "E").replace("È", "E")
           .replace("Á", "A").replace("Ó", "O").replace("Ú", "U"))
    return re.sub(r"[^A-Z0-9 ]+", " ", t)

def _ocr_words(img, region=None, scale=2, psm=6, whitelist=None):
    from PIL import Image, ImageOps
    import pytesseract
    Image.MAX_IMAGE_PIXELS = None
    im = Image.open(img).convert("L")
    ox, oy = 0, 0
    if region:
        x0, y0, x1, y1 = region; im = im.crop(region); ox, oy = x0, y0
    if scale != 1: im = im.resize((im.width*scale, im.height*scale), Image.LANCZOS)
    im = ImageOps.autocontrast(im)
    cfg = f"--psm {psm}"
    if whitelist: cfg += f" -c tessedit_char_whitelist={whitelist}"
    data = pytesseract.image_to_data(im, config=cfg, output_type=pytesseract.Output.DICT)
    out = []
    for i, w in enumerate(data["text"]):
        w = (w or "").strip()
        if not w: continue
        try: conf = float(data["conf"][i])
        except Exception: conf = -1
        cx = ox + (data["left"][i] + data["width"][i]/2)/scale
        cy = oy + (data["top"][i] + data["height"][i]/2)/scale
        out.append({"word": w, "conf": conf, "cx": round(cx, 1), "cy": round(cy, 1)})
    return out

def cmd_ocr_probe(a):
    words = _ocr_words(a.image, region=tuple(a.region) if a.region else None,
                       scale=a.scale, psm=a.psm)
    joined = _norm_txt(" ".join(w["word"] for w in words))
    import difflib
    any_hit = False
    for phrase in a.phrases:
        p = _norm_txt(phrase).strip()
        hit = p in joined
        best = 0.0
        if not hit:                      # fuzzy window scan
            toks = joined.split(); n = max(1, len(p.split()))
            for i in range(0, max(1, len(toks)-n+1)):
                r = difflib.SequenceMatcher(None, p, " ".join(toks[i:i+n])).ratio()
                best = max(best, r)
            hit = best >= 0.84
        any_hit = any_hit or hit
        tag = "HIT " if hit else "MISS"
        extra = "" if p in joined else f" (best fuzzy {best:.2f})"
        print(f"{tag} {phrase!r}{extra}")
        if hit:
            for w in words:
                if _norm_txt(w['word']).strip() and _norm_txt(w['word']).split()[0] in p.split():
                    if w["conf"] >= a.minconf:
                        print(f"      ~{w['word']!r} conf={w['conf']:.0f} at ({w['cx']:.0f},{w['cy']:.0f})")
    print("NOTE: an OCR MISS never proves absence on antique type - escalate to a model view / user eyes.")
    return 0 if any_hit else 1

def _band_words(img, side):
    # Graticule numerals sit just INSIDE the neatline, not at the sheet edge:
    # bands are inner spans (fractions of W/H), tuned on real period sheets.
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None
    W, H = Image.open(img).size
    b = {"top":    (0, int(H*0.03), W, int(H*0.115)),
         "bottom": (0, int(H*0.89), W, int(H*0.975)),
         "left":   (int(W*0.025), 0, int(W*0.095), H),
         "right":  (int(W*0.885), 0, int(W*0.975), H)}[side]
    out = []
    for psm in (11, 6):                       # sparse pass + line pass, merged
        for w in _ocr_words(img, region=b, scale=2, psm=psm, whitelist="0123456789"):
            if re.fullmatch(r"\d{2,3}", w["word"]) and w["conf"] >= 35:
                v = {"val": int(w["word"]), "cx": w["cx"], "cy": w["cy"], "conf": w["conf"]}
                dup = next((o for o in out if o["val"] == v["val"]
                            and abs(o["cx"]-v["cx"]) < 40 and abs(o["cy"]-v["cy"]) < 40), None)
                if dup is None: out.append(v)
                elif v["conf"] > dup["conf"]: dup.update(v)
    return out, (W, H)

def cmd_ocr_grid(a):
    _ensure(); res = {}
    for side in ["top", "bottom", "left", "right"]:
        ws, (W, H) = _band_words(a.image, side)
        res[side] = ws
        print(f"{side:<7}", sorted({w['val'] for w in ws}) or "-")
    out = os.path.join(KDIR, os.path.basename(a.image) + ".grid.json")
    with open(out, "w") as f: json.dump({"image": a.image, "W": W, "H": H, "bands": res}, f, indent=2)
    print("GRID ->", out)
    return 0

# ------------------------------------------------------------------ georef --
def _calib_path(img): return os.path.join(KDIR, os.path.basename(img) + ".calib.json")

def _fit(points):
    import numpy as np
    if len(points) < 3: return None
    A = np.array([[p["lon"], p["lat"], 1.0] for p in points])
    px = np.array([p["px"] for p in points]); py = np.array([p["py"] for p in points])
    cx, *_ = np.linalg.lstsq(A, px, rcond=None)
    cy, *_ = np.linalg.lstsq(A, py, rcond=None)
    rx = A@cx - px; ry = A@cy - py
    rms = float((np.mean(rx**2 + ry**2))**0.5)
    return {"cx": cx.tolist(), "cy": cy.tolist(), "rms_px": round(rms, 1), "n": len(points)}

def cmd_georef_auto(a):
    gpath = os.path.join(KDIR, os.path.basename(a.image) + ".grid.json")
    if not os.path.exists(gpath): print("Run first: ocr grid", a.image); return 2
    g = json.load(open(gpath)); b = g["bands"]
    def best(band):                       # keep highest-conf instance per value
        d = {}
        for w in band:
            if w["val"] not in d or w["conf"] > d[w["val"]]["conf"]: d[w["val"]] = w
        return d
    top, bot, lef, rig = best(b["top"]), best(b["bottom"]), best(b["left"]), best(b["right"])
    # A2: windows are configurable (A1 hardcoded lon 90..180 W / lat 20..60 - Modoc-era,
    # unusable outside western North America). Antique prime meridians (Ferro etc.) often
    # defeat auto anyway - the point of the Phase-A dry-run is to RECORD the real outcome.
    lo0, lo1 = (a.lon_range if getattr(a, "lon_range", None) else (0.0, 180.0))
    la0, la1 = (a.lat_range if getattr(a, "lat_range", None) else (5.0, 85.0))
    hemi = getattr(a, "hemi", None) or "W"
    sgn = -1.0 if hemi == "W" else 1.0
    merid = {v: (top[v], bot[v]) for v in top if v in bot and lo0 <= v <= lo1}
    paral = {v: (lef[v], rig[v]) for v in lef if v in rig and la0 <= v <= la1}
    pts = []
    for mv, (t, bo) in merid.items():
        for pv, (l, r) in paral.items():
            # meridian as a line t->bo, parallel as l->r; intersect
            x1, y1, x2, y2 = t["cx"], t["cy"], bo["cx"], bo["cy"]
            x3, y3, x4, y4 = l["cx"], l["cy"], r["cx"], r["cy"]
            den = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4)
            if abs(den) < 1e-9: continue
            px = ((x1*y2-y1*x2)*(x3-x4) - (x1-x2)*(x3*y4-y3*x4))/den
            py = ((x1*y2-y1*x2)*(y3-y4) - (y1-y2)*(x3*y4-y3*x4))/den
            pts.append({"px": round(px, 1), "py": round(py, 1),
                        "lat": float(pv), "lon": sgn*float(mv), "src": "grid-auto"})
    if len(pts) < 3:
        print(f"AUTO-CALIB INSUFFICIENT (meridians {len(merid)}, parallels {len(paral)}, points {len(pts)};"
              f" hemi={hemi} lon {lo0}-{lo1} lat {la0}-{la1})."
              " Antique sheets often label a non-Greenwich prime meridian - fall back to manual"
              " control points during a canary-PASS window: georef add ...")
        return 1
    fit = _fit(pts)
    calib = {"image": a.image, "W": g["W"], "H": g["H"], "points": pts, "fit": fit,
             "made": time.strftime("%Y-%m-%d %H:%M:%S"), "kit": KIT_REV}
    with open(_calib_path(a.image), "w") as f: json.dump(calib, f, indent=2)
    print(f"AUTO-CALIB OK: meridians {sorted(merid)}, parallels {sorted(paral)}, "
          f"{len(pts)} control points, RMS {fit['rms_px']} px ({100*fit['rms_px']/max(g['W'],g['H']):.2f}% of long edge)")
    print("CALIB ->", _calib_path(a.image))
    return 0

def cmd_georef_add(a):
    p = _calib_path(a.image)
    calib = json.load(open(p)) if os.path.exists(p) else {"image": a.image, "points": []}
    if "W" not in calib:
        from PIL import Image; Image.MAX_IMAGE_PIXELS = None
        calib["W"], calib["H"] = Image.open(a.image).size
    calib["points"].append({"px": a.px, "py": a.py, "lat": a.lat, "lon": a.lon, "src": "manual"})
    calib["fit"] = _fit(calib["points"]); calib["kit"] = KIT_REV
    with open(p, "w") as f: json.dump(calib, f, indent=2)
    print(f"added ({a.px},{a.py}) <- ({a.lat},{a.lon}); n={len(calib['points'])}",
          f"RMS={calib['fit']['rms_px']}px" if calib["fit"] else "(need >=3 to fit)")
    return 0

def cmd_georef_fit(a):
    p = _calib_path(a.image)
    if not os.path.exists(p): print("no calib for", a.image); return 2
    calib = json.load(open(p)); calib["fit"] = _fit(calib["points"])
    with open(p, "w") as f: json.dump(calib, f, indent=2)
    f = calib["fit"]; print(f"fit n={f['n']} RMS={f['rms_px']}px" if f else "need >=3 points")
    return 0

def cmd_georef_place(a):
    p = _calib_path(a.image)
    if not os.path.exists(p): print("no calib for", a.image, "- run georef auto/add first"); return 2
    calib = json.load(open(p)); f = calib.get("fit")
    if not f: print("calib not fitted"); return 2
    lon, lat = a.lon, a.lat
    x = f["cx"][0]*lon + f["cx"][1]*lat + f["cx"][2]
    y = f["cy"][0]*lon + f["cy"][1]*lat + f["cy"][2]
    W, H = calib["W"], calib["H"]
    xn, yn = x/W, y/H
    on = (0.0 <= xn <= 1.0) and (0.0 <= yn <= 1.0)
    name = a.name or f"({lat},{lon})"
    print(f"{name}: px=({x:.0f},{y:.0f})  norm=({xn:.3f},{yn:.3f})  on-sheet={'YES' if on else 'NO'}"
          f"  [affine, RMS {f['rms_px']}px - antique distortion applies; spot-check per A1.3]")
    return 0 if on else 1

# ------------------------------------------------------------------- state --
def cmd_state(a):
    s = _load()
    if a.op == "init": _save(s); print("state ->", STATE)
    elif a.op == "set":
        cur = s; keys = a.key.split(".")
        for k in keys[:-1]: cur = cur.setdefault(k, {})
        try: cur[keys[-1]] = json.loads(a.value)
        except Exception: cur[keys[-1]] = a.value
        _save(s); print("set", a.key)
    elif a.op == "get":
        cur = s
        for k in (a.key.split(".") if a.key else []): cur = cur.get(k, {})
        print(json.dumps(cur, indent=2))
    elif a.op == "note":
        s["notes"].append({"ts": time.strftime("%H:%M:%S"), "note": a.key}); _save(s)
        print("noted")
    elif a.op == "view":
        s["view_count"] = s.get("view_count", 0) + 1; _save(s)
        print("view_count =", s["view_count"],
              "-> canary due" if s["view_count"] % 8 == 0 else "")
    return 0

# ------------------------------------------------------------------ bundle --
def cmd_bundle(a):
    s = _load(); _save(s)
    # A4.1 CHANNEL-MATCHED CANARY: mint the NEXT session's canary FIRST so its sealed
    # truth ships inside this bundle; the PNG itself travels as a chat attachment
    # ALONGSIDE the map images — certification then rides the same channel as the work.
    print("A4.1 - minting the next-session canary (sealed truth ships in this bundle):")
    cmd_canary_new(None)
    out = a.out or "resume_bundle.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for f in glob.glob(os.path.join(KDIR, "*")):
            if f.endswith(".png"): continue          # canary PNGs travel via chat, not the zip
            z.write(f, os.path.join(".kit", os.path.basename(f)))
        for f in glob.glob("crops/*"):
            if os.path.getsize(f) < 900_000: z.write(f)
    print("RESUME BUNDLE ->", out)
    print('Resume line for a fresh chat: attach package + MAP files + cartographer_kit.zip'
          ' + this bundle, then say: "RESUME CARTOGRAPHER".')
    print("A4.1: attach the canary image printed above ALONGSIDE the map files in that upload;")
    print("      intake reads it FIRST (canary check <code> --via view) before any visual verdict.")
    return 0


# ------------------------------------------------------------------ phasea --
# A2 SEMANTIC GATE. Structured Phase-A record per sheet + a mechanical audit
# that blocks Phase B until designation-by-content, subject, verdict and
# evidence are all on record. Born from the Enclosure gate-escape (a town
# street-plan passed for a county subject off a filename + an assumption).
SCALE_CLASSES = ["settlement", "city-view", "county", "country", "region"]
# A4.2: "hash-match" = plate identity proven by BYTES (sha1 == the recorded original).
# It is exempt from the canary faculty rule because no perception is involved — but the
# audit only honours it when the recorded hashmatch result is "exact".
EVIDENCE = ["ocr-hit", "model-view", "user-confirmed", "hash-match"]
VERDICTS = ["PASS", "FAIL", "UNVERIFIED"]

def sha1_full(p):
    h = hashlib.sha1()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()

def _nrm(t): return re.sub(r"[^a-z0-9]", "", (t or "").lower())

def _primary(subj): return (subj or "").split(",")[0].strip()

def _name_match(subject, cartouche):
    t = _nrm(_primary(subject))
    if not t: return False
    for w in re.split(r"\s+", cartouche or ""):
        w = _nrm(w)
        if len(w) < 3: continue
        if t in w or w in t: return True
        k = 0
        for x, y in zip(t, w):
            if x != y: break
            k += 1
        if k >= 4: return True          # LONDON ~ LONDINVM, latinised spellings
    return False

def _vision_certified(s):
    for r in reversed(s.get("canary_log", [])):
        if r.get("result") == "PASS": return r.get("via", "view") == "view"
        if r.get("result") == "FAIL": return False
    return False

def _map_images(d):
    out = []
    for pat in ("*.jpg", "*.jpeg", "*.png"):
        out += glob.glob(os.path.join(d, pat))
    return sorted(out)

def cmd_phasea_scan(a):
    from PIL import Image; Image.MAX_IMAGE_PIXELS = None
    s = _load()
    for p in _map_images(a.maps_dir):
        w, h = Image.open(p).size; mp = w*h/1e6
        k = os.path.basename(p)
        e = s["maps"].setdefault(k, {})
        e.update({"file": p, "px": [w, h], "mp": round(mp, 1),
                  "sha12": sha12(p)})
        fl = [f for f in e.get("flags", []) if not f.startswith("LOW-RES")]
        if mp < 5:
            fl.append(f"LOW-RES {mp:.1f}MP: verify scale class by CONTENT; expect soft 3D zooms")
        e["flags"] = fl
        print(f"{k:16} {w}x{h:<6} {mp:5.1f}MP  {'; '.join(fl)}")
    _save(s); return 0

def cmd_phasea_georef(a):
    import types
    s = _load(); done = []
    for p in _map_images(a.maps_dir):
        k = os.path.basename(p)
        gpath = os.path.join(KDIR, k + ".grid.json")
        if a.fresh or not os.path.exists(gpath):
            print(f"-- {k}: ocr grid --")
            cmd_ocr_grid(types.SimpleNamespace(image=p))
        ns = types.SimpleNamespace(image=p, lat_range=a.lat_range, lon_range=a.lon_range, hemi=a.hemi)
        rc = cmd_georef_auto(ns)
        res = {"result": "ok" if rc == 0 else "insufficient",
               "ts": time.strftime("%H:%M:%S"), "hemi": a.hemi or "W"}
        if rc == 0:
            try: res["rms_px"] = json.load(open(_calib_path(p)))["fit"]["rms_px"]
            except Exception: pass
        s["maps"].setdefault(k, {})["georef_auto"] = res
        done.append((k, res["result"]))
    _save(s)
    print("\nGEOREF DRY-RUN RECORDED:", ", ".join(f"{k}={r}" for k, r in done))
    return 0

def cmd_phasea_hashref(a):
    # A4.2: reference records come from OUTSIDE the kit (the kit stays offline-pure):
    # the builder queries the Commons imageinfo API (iiprop=sha1|size|url) for the plates
    # the breakdown selected and writes refs.json {local_filename: {sha1,size,w,h,source_url}}.
    s = _load()
    refs = json.load(open(a.refs))
    bad = [k for k, r in refs.items() if not isinstance(r, dict)]
    if bad: print("malformed ref record(s):", bad); return 2
    s["hash_refs"] = refs; _save(s)
    print(f"HASH REFS loaded: {len(refs)} record(s) ->", ", ".join(sorted(refs)))
    return 0

def cmd_phasea_hashmatch(a):
    from PIL import Image; Image.MAX_IMAGE_PIXELS = None
    s = _load(); refs = s.get("hash_refs") or {}
    if not refs: print("No hash refs loaded. Run: phasea hashref <refs.json>"); return 2
    paths = _map_images(a.path) if os.path.isdir(a.path) else [a.path]
    rc = 0
    for p in paths:
        k = os.path.basename(p); r = refs.get(k)
        e = s["maps"].setdefault(k, {})
        if not r:
            e["hash_match"] = {"result": "none", "why": "no reference record", "ts": time.strftime("%H:%M:%S")}
            print(f"{k:16} none      (no reference record)"); rc = 1; continue
        w, h = Image.open(p).size; size = os.path.getsize(p); sha = sha1_full(p)
        res, why = "none", "no relation to the recorded original"
        if r.get("sha1") and sha == r["sha1"]:
            res, why = "exact", "sha1 == recorded Commons original (byte-identical)"
        elif size == r.get("size") and [w, h] == [r.get("w"), r.get("h")]:
            res, why = "meta", "byte-size + dims == record (re-encode possible; no sha1 proof)"
        elif r.get("w") and r.get("h") and w <= r["w"] and abs(w*r["h"] - h*r["w"]) <= 0.005*r["w"]*r["h"]:
            res, why = "scaled", f"downscaled copy: aspect matches record at {w}/{r['w']} of full width"
        e["hash_match"] = {"result": res, "why": why, "sha1": sha, "px": [w, h], "size": size,
                           "ref": {kk: r.get(kk) for kk in ("sha1", "size", "w", "h", "source_url")},
                           "ts": time.strftime("%H:%M:%S")}
        print(f"{k:16} {res:8} {why}")
        if res != "exact": rc = 1
    _save(s)
    print("(only result=exact supports --evidence hash-match; meta/scaled still need view/ocr/user)")
    return rc

def cmd_phasea_set(a):
    s = _load(); k = os.path.basename(a.image)
    e = s["maps"].setdefault(k, {})
    if a.scale not in SCALE_CLASSES:
        print("scale_class must be one of", SCALE_CLASSES); return 2
    if a.source not in ("script", "narrative", "user"):
        print("subject --source must be script|narrative|user"); return 2
    if a.coord_source not in ("google-maps", "gazetteer", "user"):
        print("--coord-source must be google-maps|gazetteer|user (A2.8: no memory-recalled coords)"); return 2
    if a.verdict not in VERDICTS: print("verdict must be", VERDICTS); return 2
    if a.evidence not in EVIDENCE:
        print("evidence must be one of", EVIDENCE, "- 'inferred' is banned by design"); return 2
    e.update({"file": e.get("file", a.image), "cartouche": a.cartouche.strip(),
              "scale_class": a.scale,
              "subject": {"name": a.subject.strip(), "lat": a.lat, "lon": a.lon,
                           "source": a.source, "coord_source": a.coord_source},
              "verdict": a.verdict, "evidence": a.evidence})
    if a.note: e.setdefault("notes", []).append(a.note)
    _save(s)
    print(f"{k}: cartouche='{a.cartouche.strip()}' class={a.scale} "
          f"subject='{a.subject.strip()}' @({a.lat},{a.lon})[{a.source}] "
          f"verdict={a.verdict} evidence={a.evidence}")
    return 0

def cmd_phasea_audit(_):
    s = _load(); vis = _vision_certified(s)
    fails = unv = 0; legacy = 0
    print(f"PHASE-A AUDIT (kit {KIT_REV})  vision_certified_for_visual_verdicts={vis}")
    for k, e in sorted(s.get("maps", {}).items()):
        if not isinstance(e, dict) or "px" not in e:
            legacy += 1; continue
        probs = list(e.get("flags", []))
        cart = (e.get("cartouche") or "").strip()
        if not cart: probs.append("cartouche MISSING - designate by the sheet's OWN words")
        elif _nrm(cart) == _nrm(os.path.splitext(k)[0]):
            probs.append("cartouche == filename - not read from the sheet")
        sc = e.get("scale_class", "")
        if sc not in SCALE_CLASSES: probs.append(f"scale_class missing/invalid ({sc!r})")
        sub = e.get("subject") or {}
        nm, lat, lon, srcv = sub.get("name", ""), sub.get("lat"), sub.get("lon"), sub.get("source")
        if not nm or lat is None or lon is None or srcv not in ("script", "narrative", "user"):
            probs.append("MAP SUBJECT incomplete (name + lat + lon + source required)")
        cs = sub.get("coord_source")
        if cs not in ("google-maps", "gazetteer", "user"):
            probs.append("coordinate provenance missing/invalid - Google cross-reference required (A2.8)")
        elif cs == "gazetteer":
            probs.append("gazetteer coords - confirm against Google Maps when a browser is available (A2.8)")
        elif not (-90 <= lat <= 90 and -180 <= lon <= 180):
            probs.append("MAP SUBJECT lat/lon out of range")
        v = e.get("verdict", ""); ev = e.get("evidence", "")
        if v not in VERDICTS: probs.append("verdict missing/invalid")
        if ev not in EVIDENCE: probs.append("evidence missing/invalid ('inferred' is banned)")
        if sc in ("settlement", "city-view") and nm and cart and not _name_match(nm, cart):
            v = "FAIL"
            probs.append(f"SETTLEMENT-TITLE RULE: '{cart}' is a {sc} sheet and cannot serve subject '{_primary(nm)}'")
        if "georef_auto" not in e:
            probs.append("georef dry-run not recorded (run: phasea georef <maps_dir>)")
        if ev == "hash-match":
            hm = (e.get("hash_match") or {}).get("result")
            if hm != "exact":
                v = "UNVERIFIED"
                probs.append(f"hash-match evidence without an exact sha1 match (recorded: {hm or 'none'}) -> UNVERIFIED (A4.2)")
        if v == "PASS" and ev == "model-view" and not vis:
            v = "UNVERIFIED"
            probs.append("model-view evidence without a view-certified canary -> UNVERIFIED (A2 faculty rule)")
        e["audit_verdict"] = v
        hard = (v == "FAIL") or any(("MISSING" in p) or ("missing" in p) or ("invalid" in p)
                                     or ("incomplete" in p) or ("RULE:" in p) for p in probs)
        if hard: fails += 1
        elif v == "UNVERIFIED": unv += 1
        print(f"  {v:10} {k:16} {'; '.join(probs) if probs else 'ok'}")
    if legacy: print(f"  (skipped {legacy} legacy state entr{'y' if legacy==1 else 'ies'} without px)")
    _save(s)
    print(f"PHASE-A AUDIT: {fails} FAIL / {unv} UNVERIFIED -> "
          + ("PHASE B BLOCKED" if fails or unv else "GATE CLEAR (pending the user's explicit go)"))
    return 1 if (fails or unv) else 0

# -------------------------------------------------------------------- main --
def main():
    ap = argparse.ArgumentParser(prog="kit.py")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("selftest")
    c = sub.add_parser("canary"); cs = c.add_subparsers(dest="op", required=True)
    cs.add_parser("new")
    k = cs.add_parser("check"); k.add_argument("code")
    k.add_argument("--via", choices=["view", "ocr", "user"], required=True,
                   help="faculty that read the code; only view certifies visual verdicts")
    rd = cs.add_parser("read"); rd.add_argument("--check", action="store_true",
                   help="submit the best voting-OCR read as: canary check <best> --via ocr")
    fl = cs.add_parser("fail"); fl.add_argument("reason")
    o = sub.add_parser("ocr"); osub = o.add_subparsers(dest="op", required=True)
    pr = osub.add_parser("probe"); pr.add_argument("image"); pr.add_argument("phrases", nargs="+")
    pr.add_argument("--region", nargs=4, type=int); pr.add_argument("--scale", type=int, default=2)
    pr.add_argument("--psm", type=int, default=6); pr.add_argument("--minconf", type=float, default=40)
    gr = osub.add_parser("grid"); gr.add_argument("image")
    g = sub.add_parser("georef"); gsub = g.add_subparsers(dest="op", required=True)
    au = gsub.add_parser("auto"); au.add_argument("image")
    au.add_argument("--hemi", choices=["E", "W"]); au.add_argument("--lat-range", nargs=2, type=float)
    au.add_argument("--lon-range", nargs=2, type=float)
    ad = gsub.add_parser("add"); ad.add_argument("image")
    [ad.add_argument(x, type=float) for x in ("px", "py", "lat", "lon")]
    ft = gsub.add_parser("fit"); ft.add_argument("image")
    pl = gsub.add_parser("place"); pl.add_argument("image"); pl.add_argument("lat", type=float)
    pl.add_argument("lon", type=float); pl.add_argument("name", nargs="?")
    ph = sub.add_parser("phasea"); psub = ph.add_subparsers(dest="op", required=True)
    sc = psub.add_parser("scan"); sc.add_argument("maps_dir")
    ge = psub.add_parser("georef"); ge.add_argument("maps_dir"); ge.add_argument("--fresh", action="store_true")
    ge.add_argument("--hemi", choices=["E", "W"]); ge.add_argument("--lat-range", nargs=2, type=float)
    ge.add_argument("--lon-range", nargs=2, type=float)
    se = psub.add_parser("set"); se.add_argument("image")
    for nm, req in (("--cartouche", True), ("--scale", True), ("--subject", True), ("--source", True),
                    ("--coord-source", True), ("--verdict", True), ("--evidence", True), ("--note", False)):
        se.add_argument(nm, required=req)
    se.add_argument("--lat", type=float, required=True); se.add_argument("--lon", type=float, required=True)
    hr = psub.add_parser("hashref"); hr.add_argument("refs")
    hm = psub.add_parser("hashmatch"); hm.add_argument("path")
    psub.add_parser("audit")
    st = sub.add_parser("state"); st.add_argument("op", choices=["init", "set", "get", "note", "view"])
    st.add_argument("key", nargs="?", default=""); st.add_argument("value", nargs="?", default="")
    b = sub.add_parser("bundle"); b.add_argument("out", nargs="?")
    a = ap.parse_args()
    if a.cmd == "selftest": rc = cmd_selftest(a)
    elif a.cmd == "canary": rc = {"new": cmd_canary_new, "check": cmd_canary_check,
                                  "read": cmd_canary_read, "fail": cmd_canary_fail}[a.op](a)
    elif a.cmd == "ocr":    rc = {"probe": cmd_ocr_probe, "grid": cmd_ocr_grid}[a.op](a)
    elif a.cmd == "georef": rc = {"auto": cmd_georef_auto, "add": cmd_georef_add,
                                  "fit": cmd_georef_fit, "place": cmd_georef_place}[a.op](a)
    elif a.cmd == "phasea": rc = {"scan": cmd_phasea_scan, "georef": cmd_phasea_georef,
                                  "hashref": cmd_phasea_hashref, "hashmatch": cmd_phasea_hashmatch,
                                  "set": cmd_phasea_set, "audit": cmd_phasea_audit}[a.op](a)
    elif a.cmd == "state":  rc = cmd_state(a)
    elif a.cmd == "bundle": rc = cmd_bundle(a)
    sys.exit(rc)

if __name__ == "__main__":
    main()
