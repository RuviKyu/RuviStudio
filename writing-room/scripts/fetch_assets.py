#!/usr/bin/env python3
"""
FETCH ASSETS — pull the verified files into the container so Phase C / C2 can look at REAL pixels.

    python3 fetch_assets.py <folder> [--thumb 1600] [--no-sheets]

Reads .selftest/refs.json (link_verify.py). Downloads
  MAP n / HOOK 1   → .selftest/maps/<asset>.<ext>    the ORIGINAL file (native resolution; the kit hashmatches it)
  REF n / CHAR n   → .selftest/stills/<asset>.<ext>  a --thumb px rendition (API iiurlwidth; the original when smaller)
and builds contact sheets in .selftest/sheets/:
  stills_<k>.png   2×2 tiles, each still with a 0.1-step xNorm/yNorm grid and its asset name + native px —
                   enough to choose focus / face / side / background / crop for every REF and CHAR;
  maps_<k>.png     one map per sheet, scaled to 1400 px with the same normalized grid — to spot the
                   cartouche, the graticule labels and each named place's region before native crops.
Idempotent: files already on disk are kept (sha1-checked for the originals).
"""
import os, re, sys, json, time, hashlib, argparse, urllib.request, urllib.parse
from PIL import Image, ImageDraw, ImageFont
Image.MAX_IMAGE_PIXELS = None
ap = argparse.ArgumentParser(); ap.add_argument("folder"); ap.add_argument("--thumb", type=int, default=1600); ap.add_argument("--no-sheets", action="store_true"); a = ap.parse_args()
F = a.folder; ST = os.path.join(F, ".selftest"); UA = "RuviWritingRoom/3.12 (history-video pipeline; contact via GitHub)"; API = "https://commons.wikimedia.org/w/api.php"
refs = json.load(open(os.path.join(ST, "refs.json"), encoding="utf-8"))
for d in ("maps", "stills", "sheets"): os.makedirs(os.path.join(ST, d), exist_ok=True)
def fetch(url, dest, tries=4):
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=180) as r, open(dest, "wb") as f:
                while True:
                    b = r.read(1 << 20)
                    if not b: break
                    f.write(b)
            return True
        except Exception as e: err = e; time.sleep(3 * (k + 1))
    print(f"  [FAIL] {os.path.basename(dest)}: {err}"); return False
def sha1(p):
    h = hashlib.sha1()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()
def thumb_url(title, width):
    try:
        q = urllib.parse.urlencode({"action": "query", "format": "json", "prop": "imageinfo", "iiprop": "url", "iiurlwidth": width, "titles": "File:" + title})
        with urllib.request.urlopen(urllib.request.Request(API + "?" + q, headers={"User-Agent": UA}), timeout=60) as r: d = json.load(r)
        for pg in d.get("query", {}).get("pages", {}).values():
            x = (pg.get("imageinfo") or [None])[0]
            if x and x.get("thumburl"): return x["thumburl"]
    except Exception: pass
    return None
got = {"maps": [], "stills": []}
for asset, r in sorted(refs.items()):
    kind = "maps" if r.get("type") in ("MAP", "HOOK") else "stills"
    dest = os.path.join(ST, kind, asset)
    if kind == "stills" and max(r.get("w") or 0, r.get("h") or 0) > a.thumb:
        dest = os.path.splitext(dest)[0] + ".jpg"
    if os.path.exists(dest) and os.path.getsize(dest) > 1024 and (kind == "stills" or not r.get("sha1") or sha1(dest) == r["sha1"]):
        got[kind].append((asset, dest, r)); print(f"  kept   {asset}"); continue
    url = r["source_url"]
    if kind == "stills" and max(r.get("w") or 0, r.get("h") or 0) > a.thumb: url = thumb_url(r["title"], a.thumb) or url
    if fetch(url, dest):
        ok = (kind == "stills") or not r.get("sha1") or sha1(dest) == r["sha1"]
        print(f"  {'fetched' if ok else 'fetched (sha1 differs!)'} {asset}  ← {url[:80]}"); got[kind].append((asset, dest, r))
if a.no_sheets: sys.exit(0)
def font(sz):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"):
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()
def tile(path, asset, r, width):
    im = Image.open(path).convert("RGB"); W, H = im.size; s = width / W; im = im.resize((width, max(1, int(H * s))), Image.LANCZOS)
    d = ImageDraw.Draw(im); w, h = im.size; f = font(max(12, width // 60))
    for k in range(1, 10):
        x = int(w * k / 10); y = int(h * k / 10)
        d.line([(x, 0), (x, h)], fill=(255, 0, 255), width=1); d.line([(0, y), (w, y)], fill=(255, 0, 255), width=1)
        d.text((x + 2, 2), f"{k/10:.1f}", fill=(255, 0, 255), font=f); d.text((2, y + 2), f"{k/10:.1f}", fill=(255, 0, 255), font=f)
    cap = Image.new("RGB", (w, max(24, width // 30)), (20, 20, 20)); dc = ImageDraw.Draw(cap)
    dc.text((6, 4), f"{asset}  native {r.get('w')}×{r.get('h')}  S{r.get('section')}  {r.get('title', '')[:70]}", fill=(255, 255, 255), font=f)
    out = Image.new("RGB", (w, h + cap.size[1]), (0, 0, 0)); out.paste(cap, (0, 0)); out.paste(im, (0, cap.size[1])); return out
k = 0
for i in range(0, len(got["stills"]), 4):
    group = got["stills"][i:i + 4]; tiles = [tile(p, asset_, r, 800) for asset_, p, r in group]
    cols = 2; rows = (len(tiles) + 1) // 2; cw = 800; rh = max(t.size[1] for t in tiles)
    sheet = Image.new("RGB", (cols * cw + 10, rows * rh + 10), (40, 40, 40))
    for j, t in enumerate(tiles): sheet.paste(t, (5 + (j % cols) * cw, 5 + (j // cols) * rh))
    k += 1; out = os.path.join(ST, "sheets", f"stills_{k}.png"); sheet.save(out); print(f"  sheet  {out}  ({', '.join(x[0] for x in group)})")
for j, (asset_, p, r) in enumerate(got["maps"], 1):
    t = tile(p, asset_, r, 1400); out = os.path.join(ST, "sheets", f"maps_{j}.png"); t.save(out); print(f"  sheet  {out}  ({asset_}: {r.get('w')}×{r.get('h')})")
print(f"FETCH ASSETS: {len(got['maps'])} map sheet(s) at native res, {len(got['stills'])} still(s) → {ST}")
