#!/usr/bin/env python3
"""
GEO — coordinates READ from live gazetteers (never recalled), many places per call, with provenance.

    python3 geo.py "Nassau, Bahamas" "Port Royal, Jamaica" "Green Turtle Cay" [--json out.json]

For each place: Wikipedia's coordinates API (the article's primary coordinate; redirects followed;
a title search when the exact title has none) cross-checked against OpenStreetMap Nominatim.
Prints one line per place:
    Nassau, Bahamas @ 25.0600,-77.3450  [gazetteer: wikipedia "Nassau, Bahamas" · nominatim 0.4 km · AGREE]
AGREE (< 5 km) = record it; DISAGREE = look at both candidates and decide which entity the script
means (a same-named place elsewhere is the usual cause); NONE = no gazetteer hit — try a fuller name
("Spanish Town, Jamaica"), the modern name, or the nearest named settlement (A2.7: a region with no
entity anchors on a named representative inside it; say so in the changes file).
Provenance for the kit / MAP SUBJECT line: --coord-source gazetteer (upgrade to google-maps only when
a browser is connected and you read the marker !3d/!4d pair yourself).
"""
import sys, json, time, math, argparse, urllib.request, urllib.parse

ap = argparse.ArgumentParser(); ap.add_argument("places", nargs="+"); ap.add_argument("--json", default=""); a = ap.parse_args()
UA = "RuviWritingRoom/3.12 (history-video pipeline; contact via GitHub)"
def get(url, tries=3):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=45) as r: return json.load(r)
        except Exception as e: err = e; time.sleep(1.5 * (k + 1))
    raise err
def wiki(name):
    base = "https://en.wikipedia.org/w/api.php?"
    try:
        d = get(base + urllib.parse.urlencode({"action": "query", "format": "json", "prop": "coordinates", "redirects": 1, "titles": name}))
        for pg in d.get("query", {}).get("pages", {}).values():
            c = (pg.get("coordinates") or [None])[0]
            if c: return pg["title"], c["lat"], c["lon"]
        d = get(base + urllib.parse.urlencode({"action": "query", "format": "json", "list": "search", "srsearch": name, "srlimit": 3}))
        for h in d.get("query", {}).get("search", []):
            d2 = get(base + urllib.parse.urlencode({"action": "query", "format": "json", "prop": "coordinates", "redirects": 1, "titles": h["title"]}))
            for pg in d2.get("query", {}).get("pages", {}).values():
                c = (pg.get("coordinates") or [None])[0]
                if c: return pg["title"], c["lat"], c["lon"]
    except Exception: return None
    return None
def nomi(name):
    try:
        d = get("https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({"q": name, "format": "json", "limit": 1}))
        if d: return d[0].get("display_name", "")[:60], float(d[0]["lat"]), float(d[0]["lon"])
    except Exception: return None
    return None
def km(a1, o1, a2, o2):
    p = math.pi / 180; x = math.sin((a2 - a1) * p / 2) ** 2 + math.cos(a1 * p) * math.cos(a2 * p) * math.sin((o2 - o1) * p / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(x))
out = {}
for name in a.places:
    w = wiki(name); n = nomi(name); time.sleep(1.0)
    if w and n:
        d = km(w[1], w[2], n[1], n[2]); verdict = "AGREE" if d < 5 else "DISAGREE"
        lat, lon = w[1], w[2]
        print(f"{name} @ {lat:.4f},{lon:.4f}  [gazetteer: wikipedia \"{w[0]}\" · nominatim {d:.1f} km ({n[0]}) · {verdict}]")
        out[name] = {"lat": round(lat, 4), "lon": round(lon, 4), "wikipedia": w[0], "nominatim": [n[1], n[2], n[0]], "distance_km": round(d, 1), "verdict": verdict, "coord_source": "gazetteer"}
    elif w:
        print(f"{name} @ {w[1]:.4f},{w[2]:.4f}  [gazetteer: wikipedia \"{w[0]}\" only · nominatim none]"); out[name] = {"lat": round(w[1], 4), "lon": round(w[2], 4), "wikipedia": w[0], "verdict": "WIKI-ONLY", "coord_source": "gazetteer"}
    elif n:
        print(f"{name} @ {n[1]:.4f},{n[2]:.4f}  [gazetteer: nominatim only ({n[0]}) · wikipedia none]"); out[name] = {"lat": round(n[1], 4), "lon": round(n[2], 4), "nominatim": [n[1], n[2], n[0]], "verdict": "NOMI-ONLY", "coord_source": "gazetteer"}
    else:
        print(f"{name} @ NONE  [no gazetteer hit — try a fuller or modern name]"); out[name] = {"verdict": "NONE"}
if a.json: json.dump(out, open(a.json, "w", encoding="utf-8"), indent=1)
