#!/usr/bin/env python3
"""
MAKE DOWNLOAD LINKS — (Q4) emit [Subject]_download_links.txt: one line per
non-AI asset, "SAVE AS | URL", taken from link slot 1 of each section in the
FULL breakdown (the same slot After Effects consumes — ALT slots are ignored).

Wikimedia Commons URLs get "?download" appended: the media servers answer that
query with "Content-Disposition: attachment" (it is the switch the Commons
Download button itself uses), so a normal left-click in a browser SAVES the
file instead of opening it. The browser keeps the Commons filename; the SAVE AS
column gives the type-ordinal name RUVI Studio uses (MAP 1.jpg, REF 2.jpg,
CHAR 3.jpg, HOOK 1.jpg). Non-Commons links (e.g. an archive.org video page)
are listed as-is with a note, since only Commons guarantees the attachment
header. The Studio still downloads everything itself; this file is the manual
fallback and the human-friendly index.

Exit 1 if any MAP/REF/CHAR/HOOK section is missing its link.
Optional argv[1] = the working folder.
"""
import re, glob, os, sys
from urllib.parse import urlsplit

OUT = (sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/outputs")

def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p, encoding="utf-8", errors="ignore").read()))
    except Exception: return 0

cands = [p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p)
         and "special" not in os.path.basename(p).lower()
         and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
if not cands: sys.exit("No breakdown .txt found.")
FULL = max(cands, key=is_breakdown)
subj = re.sub(r'(_breakdown)?.txt$', '', os.path.basename(FULL))

lines = open(FULL, encoding="utf-8").read().split('\n')
hdr = re.compile(r'^SECTION\s+(\d+)\s*\|\s*\d+\s*words\s*\|\s*(.+?)\s*$')

# split into (section_no, type_label, body_lines)
secs = []
cur = None
for l in lines:
    m = hdr.match(l)
    if m:
        cur = (int(m.group(1)), m.group(2).strip(), [])
        secs.append(cur)
    elif cur is not None:
        cur[2].append(l)

def ext_of(url):
    e = os.path.splitext(urlsplit(url).path)[1].lower()
    return e if e else ".jpg"

def clickable(url):
    """(save-note, url) — append ?download on Commons upload URLs."""
    host = urlsplit(url).netloc.lower()
    if host == "upload.wikimedia.org" and "?" not in url:
        return "", url + "?download"
    if "archive.org" in host:
        return "   (video page — use its DOWNLOAD OPTIONS panel; a direct click plays inline)", url
    return "   (no attachment header guaranteed on this host)", url

def first(body, pat):
    rx = re.compile(pat)
    for l in body:
        m = rx.match(l)
        if m: return m.group(1)
    return None

rows, missing = [], []
for n, typ, body in secs:
    t0 = typ.split()[0]
    if t0 == "AI":
        continue
    if t0 in ("MAP", "REF"):
        url = first(body, r'\s*LINK:\s*(\S+)')
        if not url: missing.append(f"S{n} {typ}"); continue
        note, u = clickable(url)
        rows.append((n, f"{typ}{ext_of(url)}", u, note))
    elif t0 == "CHAR":
        url = first(body, r'\s*REFERENCE:\s*(\S+)')
        if not url: missing.append(f"S{n} {typ}"); continue
        note, u = clickable(url)
        rows.append((n, f"{typ}{ext_of(url)}", u, note))
    elif t0 == "HOOK":
        img = first(body, r'\s*REF/MAP LINK 1:\s*(\S+)')
        vid = first(body, r'\s*VIDEO LINK:\s*(\S+)')
        if img:
            note, u = clickable(img)
            rows.append((n, f"HOOK 1{ext_of(img)}", u, note))
        else: missing.append(f"S{n} HOOK image")
        if vid:                                           # (r9) optional: the HOOK is a map animation; a video, if listed, is index-only
            note, u = clickable(vid)
            rows.append((n, "HOOK video", u, note))

rows.sort(key=lambda r: (r[0], r[1]))
n_click = sum(1 for r in rows if not r[3])
head = [
 f"# DOWNLOAD LINKS — {subj}",
 "# One line per non-AI asset: SAVE AS | URL  (link slot 1 of each section — the",
 "# same link After Effects consumes; ALT slots are repeats and are not listed).",
 "# Commons URLs end in ?download: the server replies Content-Disposition:",
 "# attachment, so a normal left-click SAVES the file instead of opening it. The",
 "# browser keeps the Commons filename — rename to the SAVE AS name if filing by",
 "# hand. RUVI Studio downloads and names every asset itself; this file is the",
 "# manual fallback and the human index.",
 "",
]
body = [f"{name} | {url}{note}" for _, name, url, note in rows]
dest = f"{OUT}/{subj}_download_links.txt"
open(dest, "w", encoding="utf-8").write("\n".join(head + body) + "\n")

print(f"Download links: {dest}")
print(f"  assets: {len(rows)} | click-saves (Commons ?download): {n_click} | page links: {len(rows)-n_click}")
if missing:
    for x in missing: print(f"  [FAIL] no link found for {x}")
    sys.exit(1)
