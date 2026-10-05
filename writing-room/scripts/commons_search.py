#!/usr/bin/env python3
"""
COMMONS SEARCH — candidate files from Wikimedia Commons, several queries per call, with the facts
that decide a link (pixel size, mime, a year in the title, license) so you can choose without a
browser and without web_search.

    python3 commons_search.py "1770 map Jamaica" "Charles Vane pirate" [--limit 12] [--min 2000] [--maps]
      --limit n     results kept per query (after filtering; the API is asked for 40)
      --min px      drop files whose long edge is under px (default 1200; use 2000 for map sheets)
      --maps        map mode: prefer titles carrying a year 1700–1920 or the words map/chart/plan/atlas,
                    and sort by year then size
Output per query: rank · WxH · mime · year · license · File title · File page URL.
Tip: search by place + era words ("1750 map Hispaniola", "Jamaica 18th century map Jefferys"), by the
object's name for REF ("Queen Anne's Revenge anchor"), by the person for CHAR ("Charles Vane engraving").
"""
import re, sys, json, time, argparse, urllib.request, urllib.parse

ap = argparse.ArgumentParser(); ap.add_argument("queries", nargs="+"); ap.add_argument("--limit", type=int, default=12)
ap.add_argument("--min", type=int, default=1200); ap.add_argument("--maps", action="store_true"); ap.add_argument("--json", default=""); a = ap.parse_args()
UA = "RuviWritingRoom/3.12 (history-video pipeline; contact via GitHub)"; API = "https://commons.wikimedia.org/w/api.php"
def api(params, tries=4):
    for k in range(tries):
        try:
            req = urllib.request.Request(API + "?" + urllib.parse.urlencode(params), headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r: return json.load(r)
        except Exception as e: err = e; time.sleep(2 * (k + 1))
    raise err
OK_MIME = ("image/jpeg", "image/png", "image/webp")
allres = {}
for q in a.queries:
    try:
        sr = api({"action": "query", "format": "json", "list": "search", "srnamespace": 6, "srsearch": q, "srlimit": 40, "srprop": "size"})
    except Exception as e: print(f"## {q}\n  network failure: {e}"); continue
    titles = [h["title"] for h in sr.get("query", {}).get("search", [])]
    rows = []
    for k in range(0, len(titles), 50):
        try: ii = api({"action": "query", "format": "json", "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiextmetadatafilter": "LicenseShortName|DateTimeOriginal", "titles": "|".join(titles[k:k + 50])})
        except Exception as e: print(f"  imageinfo failure: {e}"); break
        for pg in ii.get("query", {}).get("pages", {}).values():
            x = (pg.get("imageinfo") or [None])[0]
            if not x: continue
            t = pg["title"][5:] if pg["title"].startswith("File:") else pg["title"]
            md = x.get("extmetadata") or {}; lic = (md.get("LicenseShortName") or {}).get("value", "")
            yr = re.search(r"\b(1[5-9]\d\d)\b", t) or re.search(r"\b(1[5-9]\d\d)\b", (md.get("DateTimeOriginal") or {}).get("value", ""))
            rows.append({"title": t, "w": x.get("width") or 0, "h": x.get("height") or 0, "mime": x.get("mime", ""), "year": int(yr.group(1)) if yr else None, "license": lic,
                         "page": "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(t.replace(" ", "_"), safe="(),'!"), "url": x.get("url", "").split("?")[0]})
    rows = [r for r in rows if max(r["w"], r["h"]) >= a.min and r["mime"] in OK_MIME]
    if a.maps:
        rows = [r for r in rows if (r["year"] and 1650 <= r["year"] <= 1930) or re.search(r"\b(map|chart|plan|atlas|carte|karte)\b", r["title"], re.I)]
        rows.sort(key=lambda r: (0 if r["year"] else 1, -(r["w"] * r["h"])))
    else: rows.sort(key=lambda r: -(r["w"] * r["h"]))
    rows = rows[:a.limit]; allres[q] = rows
    print(f"## {q}   ({len(rows)} candidate(s); {len(titles)} raw hits)")
    for i, r in enumerate(rows, 1):
        print(f"  {i:2}. {r['w']}x{r['h']}  {r['mime'].split('/')[1]:4}  {r['year'] or '----'}  {r['license'][:12]:12}  {r['title'][:90]}\n      {r['page']}")
if a.json: json.dump(allres, open(a.json, "w", encoding="utf-8"), indent=1)
