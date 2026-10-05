#!/usr/bin/env python3
"""
LINK VERIFY — every Wikimedia link in the FULL breakdown, confirmed LIVE through the Commons imageinfo
API in one batched call (the container has network; no browser, no web_fetch loop).

    python3 link_verify.py <folder> [--dry-run] [--map-floor 2000] [--still-floor 800]

For each LINK / ALT LINK n / REF/MAP LINK n / REFERENCE slot that points at a Commons File: page or an
upload.wikimedia.org file:
  • asks the API (titles=File:…, iiprop=url|size|sha1|mime|extmetadata) — 50 titles per request;
  • a page that comes back "missing" DOES NOT EXIST → the slot's tag becomes [NOT FOUND - …], FAIL;
  • otherwise the slot is rewritten to the canonical download URL (imageinfo url, query string stripped),
    ALT / REF-MAP LINK 2 slots repeat slot 1 verbatim, and the summary's trailing [tag] is rewritten
    [VERIFIED - Commons imageinfo API, this run; WxH px; <license>] (the summary text itself is yours);
  • MAP / HOOK sheets under --map-floor px on the long edge FAIL (replace the sheet), 2000–3500 WARN;
    REF / CHAR stills under --still-floor WARN; non-image mimes (pdf, djvu, tif, svg) FAIL — the renderer
    cannot load them.
Writes .selftest/refs.json {"MAP 1.jpg": {sha1,size,w,h,source_url,title,license,mime}} keyed by the
Studio's asset name (for fetch_assets.py and the kit's hashmatch) and .selftest/link_verify.md.
Exit 1 when any slot FAILs. Network trouble → exit 2 with the ladder note (Video_Structure.md).
"""
import os, re, sys, json, glob, time, hashlib, argparse, urllib.request, urllib.parse

ap = argparse.ArgumentParser(); ap.add_argument("folder"); ap.add_argument("--dry-run", action="store_true")
ap.add_argument("--map-floor", type=int, default=2000); ap.add_argument("--still-floor", type=int, default=800); a = ap.parse_args()
F = a.folder; UA = "RuviWritingRoom/3.12 (https://github.com/ruvi; history-video pipeline; contact via GitHub)"
API = "https://commons.wikimedia.org/w/api.php"

def is_breakdown(p):
    try: return len(re.findall(r"(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|", open(p, encoding="utf-8", errors="ignore").read()))
    except Exception: return 0
cands = [p for p in glob.glob(os.path.join(F, "*.txt")) if is_breakdown(p) and not re.search(r"special|_original|auto_video_structure", os.path.basename(p), re.I)]
if not cands: sys.exit("no FULL breakdown in the folder")
FULL = max(cands, key=is_breakdown); SUBJ = re.sub(r"(_breakdown)?\.txt$", "", os.path.basename(FULL))
L = open(FULL, encoding="utf-8").read().split("\n")

HDR = re.compile(r"^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$")
LINK = re.compile(r"^(\s*)(VIDEO LINK|REF/MAP LINK \d+|ALT LINK \d+|LINK|REFERENCE)\s*:\s*(\S+)\s*$")
def title_of(u):
    u = u.split("#")[0]
    m = re.match(r"https?://commons\.wikimedia\.org/wiki/File:(.+)$", u) or re.match(r"https?://commons\.wikimedia\.org/w/index\.php\?title=File:([^&]+)", u)
    if m: return urllib.parse.unquote(m.group(1)).replace("_", " ")
    m = re.match(r"https?://upload\.wikimedia\.org/wikipedia/commons/(?:thumb/)?[0-9a-f]/[0-9a-f]{2}/([^/?]+)", u)
    if m: return urllib.parse.unquote(m.group(1)).replace("_", " ")
    return None

# ---- inventory: sections → slots ----
secs = []; cur = None; cnt = {"MAP": 0, "REF": 0, "CHAR": 0}
for i, ln in enumerate(L):
    m = HDR.match(ln)
    if m:
        ty = m.group(3).split()[0].upper(); cur = {"num": int(m.group(1)), "type": ty, "slots": [], "line": i}
        if ty in cnt: cnt[ty] += 1
        cur["asset"] = "HOOK 1" if ty == "HOOK" else (f"{ty} {cnt[ty]}" if ty in cnt else "")
        secs.append(cur); continue
    if cur is None: continue
    lk = LINK.match(ln)
    if lk: cur["slots"].append({"line": i, "label": lk.group(2), "url": lk.group(3), "indent": lk.group(1), "title": title_of(lk.group(3))})
titles = sorted({s["title"] for sec in secs for s in sec["slots"] if s["title"]})
if not titles: print("link_verify: no Wikimedia links found"); sys.exit(0)

def api(params, tries=4):
    data = urllib.parse.urlencode(params).encode()
    for k in range(tries):
        try:
            req = urllib.request.Request(API, data=data, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r: return json.load(r)
        except Exception as e:
            err = e; time.sleep(2 * (k + 1))
    raise err
info = {}
try:
    for k in range(0, len(titles), 50):
        chunk = titles[k:k + 50]
        res = api({"action": "query", "format": "json", "prop": "imageinfo", "iiprop": "url|size|sha1|mime|extmetadata", "iiextmetadatafilter": "LicenseShortName|Artist",
                   "titles": "|".join("File:" + t for t in chunk), "redirects": 1})
        q = res.get("query", {}); norm = {}
        for n in q.get("normalized", []) + q.get("redirects", []): norm[n["to"]] = n["from"]
        for pid, pg in q.get("pages", {}).items():
            t = pg.get("title", ""); orig = norm.get(t, t)
            key = orig[5:] if orig.startswith("File:") else orig
            key = key.replace("_", " ")
            ii = (pg.get("imageinfo") or [None])[0]
            if "missing" in pg or not ii: info[key] = None; continue
            md = ii.get("extmetadata") or {}
            info[key] = {"url": ii["url"].split("?")[0], "w": ii.get("width"), "h": ii.get("height"), "size": ii.get("size"), "sha1": ii.get("sha1"), "mime": ii.get("mime"),
                         "license": (md.get("LicenseShortName") or {}).get("value", ""), "title": t[5:] if t.startswith("File:") else t}
except Exception as e:
    print(f"link_verify: network failure ({e}). Fall back to the WIKIMEDIA ACCESS LADDER (Video_Structure.md) and re-run."); sys.exit(2)

# ---- apply ----
fails, warns, rows = [], [], []; refs = {}
for sec in secs:
    if not sec["slots"]: continue
    primary = None
    for s in sec["slots"]:
        if s["label"] in ("VIDEO LINK",): continue
        t = s["title"]
        if not t:
            if s["label"] in ("LINK", "REF/MAP LINK 1", "REFERENCE"): fails.append(f"S{sec['num']} {s['label']}: not a Wikimedia file URL ({s['url'][:60]})")
            continue
        rec = info.get(t)
        if rec is None and t not in info: rec = next((v for k2, v in info.items() if k2.lower() == t.lower()), None)
        if s["label"] in ("LINK", "REF/MAP LINK 1", "REFERENCE") or primary is None: primary = (s, rec)
    if primary is None: continue
    s0, rec = primary; tag = ""
    if rec is None:
        fails.append(f"S{sec['num']} {sec['type']}: FILE MISSING on Commons → {s0['title']}"); tag = "[NOT FOUND - Commons imageinfo API says the file does not exist, this run]"; newurl = s0["url"]
    else:
        newurl = rec["url"]; long_edge = max(rec.get("w") or 0, rec.get("h") or 0); mime = rec.get("mime") or ""
        if not mime.startswith("image/") or mime in ("image/svg+xml", "image/tiff", "image/vnd.djvu"): fails.append(f"S{sec['num']} {sec['type']}: mime {mime} — the renderer needs jpg/png/webp: {rec['title'][:60]}")
        if sec["type"] in ("MAP", "HOOK"):
            if long_edge < a.map_floor: fails.append(f"S{sec['num']} {sec['type']}: sheet is only {rec['w']}×{rec['h']} px (floor {a.map_floor}) — replace it")
            elif long_edge < 3500: warns.append(f"S{sec['num']} {sec['type']}: marginal {rec['w']}×{rec['h']} px (3500+ preferred)")
        elif long_edge < a.still_floor: warns.append(f"S{sec['num']} {sec['type']}: low-res {rec['w']}×{rec['h']} px")
        tag = f"[VERIFIED - Commons imageinfo API, this run; {rec['w']}x{rec['h']} px; {rec['license'] or 'license n/a'}]"
        ext = os.path.splitext(urllib.parse.urlparse(newurl).path)[1].lower().replace(".jpeg", ".jpg") or ".jpg"
        if sec["asset"]: refs[sec["asset"] + ext] = {"sha1": rec["sha1"], "size": rec["size"], "w": rec["w"], "h": rec["h"], "source_url": newurl, "title": rec["title"], "license": rec["license"], "mime": mime, "section": sec["num"], "type": sec["type"]}
    rows.append(f"| S{sec['num']} | {sec['type']} | {s0['title'][:60]} | {('%s×%s' % (rec['w'], rec['h'])) if rec else 'MISSING'} | {(rec or {}).get('license', '')} |")
    # rewrite the slots of this section
    for s in sec["slots"]:
        if s["label"] == "VIDEO LINK": continue
        L[s["line"]] = f"{s['indent']}{s['label']}: {newurl}"
        j = s["line"] + 1
        if j < len(L) and L[j].startswith("      ") or (j < len(L) and L[j].startswith("   ") and sec["type"] == "CHAR"):
            if s["label"] in ("LINK", "REF/MAP LINK 1", "REFERENCE"):
                body = re.sub(r"\s*\[(VERIFIED|FOUND|UNCONFIRMED|NOT FOUND)[^\]]*\]\s*$", "", L[j].rstrip(), flags=re.I)
                L[j] = body + " " + tag
            else:
                L[j] = ("      Repeat of REF/MAP LINK 1. " if s["label"].startswith("REF/MAP") else "      Repeat of link slot 1. ") + ("[VERIFIED - same file as slot 1]" if rec else "[NOT FOUND - same slot as link 1]")
os.makedirs(os.path.join(F, ".selftest"), exist_ok=True)
json.dump(refs, open(os.path.join(F, ".selftest", "refs.json"), "w", encoding="utf-8"), indent=1)
if not a.dry_run: open(FULL, "w", encoding="utf-8").write("\n".join(L))
rep = ["# link_verify — " + SUBJ, "", f"**{len(fails)} FAIL · {len(warns)} WARN · {len(rows)} link(s)**", "", "| section | type | file | px | license |", "|---|---|---|---|---|"] + rows + [""] + [f"- ❌ {x}" for x in fails] + [f"- ⚠️ {x}" for x in warns]
open(os.path.join(F, ".selftest", "link_verify.md"), "w", encoding="utf-8").write("\n".join(rep) + "\n")
for x in fails: print("[FAIL] " + x)
for x in warns: print("[warn] " + x)
print(f"LINK VERIFY: {len(fails)} FAIL / {len(warns)} WARN · {len(rows)} link(s) checked live · refs.json: {len(refs)} asset(s)" + ("  (dry run — breakdown untouched)" if a.dry_run else "  (slots rewritten to canonical download URLs)"))
sys.exit(1 if fails else 0)
