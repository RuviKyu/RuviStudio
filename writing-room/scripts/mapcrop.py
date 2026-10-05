#!/usr/bin/env python3
"""
MAPCROP — the Cartographer's pixel tools (Video_Cartographer.md Step 3), on the native file in .selftest/maps/.

  python3 mapcrop.py grid <image> <x0> <y0> <x1> <y1> [--step 100] [--out file]
        a native-resolution crop with grid lines labelled in FULL-IMAGE pixels (read positions straight
        off the grid; the crop is downscaled only if wider than 1600 px, labels stay in native px)
  python3 mapcrop.py gridn <image> <x0n> <y0n> <x1n> <y1n> [--step 100]    the same with 0..1 fractions
  python3 mapcrop.py contact <image> <points.json> [--size 260] [--out file]
        points = [{"name": "Nassau", "x": 2480, "y": 1320}, …] → one tile per point, a crosshair at its
        centre and the name + coords in the header; every pin must sit under its crosshair before it is
        written to JSON (a traced shape: at least one vertex tile)
  python3 mapcrop.py predict <image> <lat> <lon>
        the pixel neighbourhood from the kit's georef calibration (.kit/<image>.calib.json from
        `kit.py georef auto|add`) — the GRATICULE ANCHOR: crop THERE, and a crop that contradicts the
        prediction means the identification or the scale is wrong
  python3 mapcrop.py anchor <image> <px1> <py1> <lon1> <lat1> <px2> <py2> <lon2> <lat2> <lat> <lon>
        a two-point linear anchor (two meridian/parallel intersections read off the sheet) → predicted px
Outputs land in .selftest/crops/ next to the image unless --out is given. Print-only otherwise.
"""
import os, sys, json, argparse
from PIL import Image, ImageDraw, ImageFont
Image.MAX_IMAGE_PIXELS = None
def font(sz):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"):
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()
def outdir(img):
    d = os.path.join(os.path.dirname(os.path.abspath(img)), "..", "crops"); os.makedirs(d, exist_ok=True); return os.path.normpath(d)
def cmd_grid(a, normalized=False):
    im = Image.open(a.image); W, H = im.size
    x0, y0, x1, y1 = (int(a.x0 * W), int(a.y0 * H), int(a.x1 * W), int(a.y1 * H)) if normalized else (int(a.x0), int(a.y0), int(a.x1), int(a.y1))
    x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(W, x1), min(H, y1)
    if x1 <= x0 or y1 <= y0: sys.exit("empty crop")
    crop = im.crop((x0, y0, x1, y1)).convert("RGB"); cw, ch = crop.size; s = min(1.0, 1600 / cw)
    if s < 1: crop = crop.resize((int(cw * s), int(ch * s)), Image.LANCZOS)
    d = ImageDraw.Draw(crop); f = font(14); step = a.step
    gx = (x0 // step + 1) * step
    while gx < x1:
        X = int((gx - x0) * s); d.line([(X, 0), (X, crop.size[1])], fill=(255, 0, 255), width=1); d.text((X + 2, 2), str(gx), fill=(255, 0, 255), font=f); gx += step
    gy = (y0 // step + 1) * step
    while gy < y1:
        Y = int((gy - y0) * s); d.line([(0, Y), (crop.size[0], Y)], fill=(255, 0, 255), width=1); d.text((2, Y + 2), str(gy), fill=(255, 0, 255), font=f); gy += step
    cap = f"{os.path.basename(a.image)} crop x {x0}–{x1} y {y0}–{y1} (native {W}×{H}; shown at {s:.2f}×; grid every {step} px)"
    d.rectangle([0, crop.size[1] - 18, crop.size[0], crop.size[1]], fill=(0, 0, 0)); d.text((4, crop.size[1] - 16), cap, fill=(255, 255, 255), font=f)
    out = a.out or os.path.join(outdir(a.image), f"grid_{os.path.splitext(os.path.basename(a.image))[0].replace(' ', '_')}_{x0}_{y0}_{x1}_{y1}.png")
    crop.save(out); print(out); print("  " + cap)
def cmd_contact(a):
    im = Image.open(a.image).convert("RGB"); W, H = im.size; pts = json.load(open(a.points)); S = a.size; half = S // 2
    cols = min(4, max(1, len(pts))); rows = (len(pts) + cols - 1) // cols; f = font(13)
    sheet = Image.new("RGB", (cols * (S + 6), rows * (S + 26)), (30, 30, 30)); d = ImageDraw.Draw(sheet)
    for i, p in enumerate(pts):
        x, y = int(p["x"]), int(p["y"]); t = im.crop((x - half, y - half, x + half, y + half))
        X = (i % cols) * (S + 6); Y = (i // cols) * (S + 26) + 20; sheet.paste(t, (X, Y))
        d.line([(X + half - 14, Y + half), (X + half + 14, Y + half)], fill=(255, 0, 0), width=2); d.line([(X + half, Y + half - 14), (X + half, Y + half + 14)], fill=(255, 0, 0), width=2)
        d.ellipse([X + half - 4, Y + half - 4, X + half + 4, Y + half + 4], outline=(255, 0, 0), width=1)
        d.text((X + 2, Y - 18), f"{p.get('name', '?')} ({x},{y})", fill=(255, 255, 0), font=f)
    out = a.out or os.path.join(outdir(a.image), f"contact_{os.path.splitext(os.path.basename(a.image))[0].replace(' ', '_')}.png"); sheet.save(out)
    print(out); print(f"  {len(pts)} tile(s) · {S}px windows · native {W}×{H} — every named feature must sit under its crosshair")
def cmd_predict(a):
    kd = os.path.join(os.getcwd(), ".kit", os.path.basename(a.image) + ".calib.json")
    cands = [kd, os.path.join(os.path.dirname(os.path.abspath(a.image)), "..", "..", ".kit", os.path.basename(a.image) + ".calib.json")]
    cal = next((json.load(open(p)) for p in cands if os.path.exists(p)), None)
    if not cal: sys.exit("no calibration for this sheet (run kit.py georef auto <img> or georef add … first, from the project folder)")
    fit = cal.get("fit") or cal
    try:
        ax, bx, cx = fit["x"]; ay, by, cy = fit["y"]     # px = a*lon + b*lat + c
        px = ax * a.lon + bx * a.lat + cx; py = ay * a.lon + by * a.lat + cy
        print(f"predicted px ≈ ({px:.0f}, {py:.0f}) for {a.lat},{a.lon}  (rms {fit.get('rms_px', '?')} px) → crop a ±400 px window there: mapcrop.py grid <img> {int(px) - 400} {int(py) - 400} {int(px) + 400} {int(py) + 400}")
    except Exception:
        print("calibration file has an unexpected shape:", json.dumps(cal)[:300])
def cmd_anchor(a):
    sx = (a.px2 - a.px1) / ((a.lon2 - a.lon1) or 1e-9); sy = (a.py2 - a.py1) / ((a.lat2 - a.lat1) or 1e-9)
    px = a.px1 + (a.lon - a.lon1) * sx; py = a.py1 + (a.lat - a.lat1) * sy
    print(f"predicted px ≈ ({px:.0f}, {py:.0f})  scale {abs(sx):.1f} px/°lon, {abs(sy):.1f} px/°lat  → mapcrop.py grid <img> {int(px) - 400} {int(py) - 400} {int(px) + 400} {int(py) + 400}")
ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="cmd", required=True)
for name in ("grid", "gridn"):
    g = sub.add_parser(name); g.add_argument("image"); [g.add_argument(k, type=float) for k in ("x0", "y0", "x1", "y1")]; g.add_argument("--step", type=int, default=100); g.add_argument("--out", default="")
c = sub.add_parser("contact"); c.add_argument("image"); c.add_argument("points"); c.add_argument("--size", type=int, default=260); c.add_argument("--out", default="")
p = sub.add_parser("predict"); p.add_argument("image"); p.add_argument("lat", type=float); p.add_argument("lon", type=float)
q = sub.add_parser("anchor"); q.add_argument("image"); [q.add_argument(k, type=float) for k in ("px1", "py1", "lon1", "lat1", "px2", "py2", "lon2", "lat2", "lat", "lon")]
a = ap.parse_args()
{"grid": lambda: cmd_grid(a), "gridn": lambda: cmd_grid(a, True), "contact": lambda: cmd_contact(a), "predict": lambda: cmd_predict(a), "anchor": lambda: cmd_anchor(a)}[a.cmd]()
