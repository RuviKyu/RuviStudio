#!/usr/bin/env python3
"""
DESCRIPTION CHECK — <Subject>_description.txt against the channel's DESCRIPTION template (Phase D).

    python3 description_check.py <folder>
FAIL · file missing or under 400 characters · a FIXED template line (one without {…}) missing verbatim
     · no hashtag line, or the hashtag line is not the last line of the description body
     · the channel has a PINNED COMMENT line but the file has none (after a blank line, last)
WARN · fewer hashtags than the template asks · any "{" left (an unfilled field) · the title's key names
       absent from the first two sentences cannot be judged mechanically — re-read the brief.
Exit 1 on FAIL. (Absent file = FAIL: the Studio copies it beside the finished video.)
"""
import os, re, sys, glob
F = sys.argv[1] if len(sys.argv) > 1 else "."
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from suffixes import parse_suffix_file, find_suffix_file
bds = [p for p in glob.glob(os.path.join(F, "*_breakdown.txt")) if not re.search(r"special|_original", p)]
if not bds: sys.exit("no FULL breakdown")
SUBJ = os.path.basename(bds[0]).replace("_breakdown.txt", ""); text = open(bds[0], encoding="utf-8").read()
mch = re.search(r"(?m)^CHANNEL:\s*(.+?)\s*$", text); chan = mch.group(1).strip().strip("[]").upper() if mch else ""
sp = find_suffix_file(F, os.path.join(F, ".packet")); blk = parse_suffix_file(sp).get(chan) if sp else None
dp = os.path.join(F, f"{SUBJ}_description.txt"); E, W = [], []
if not os.path.exists(dp): print(f"[FAIL] {SUBJ}_description.txt missing"); sys.exit(1)
d = open(dp, encoding="utf-8").read().replace("\r\n", "\n"); body = d.rstrip("\n").split("\n")
if len(d) < 400: E.append("description shorter than 400 characters")
if "{" in d or "}" in d: W.append("an unfilled {…} field remains")
pinned = [i for i, l in enumerate(body) if l.startswith("PINNED COMMENT:")]
main = body[:pinned[0]] if pinned else body
while main and not main[-1].strip(): main.pop()
hash_lines = [i for i, l in enumerate(main) if re.match(r"^\s*#\w", l)]
if not hash_lines: E.append("no hashtag line")
elif hash_lines[-1] != len(main) - 1: E.append("the hashtag line must be the last line of the description (before the PINNED COMMENT)")
if blk:
    fixed = [l for l in blk["description"] if l.strip() and "{" not in l and not l.startswith("PINNED COMMENT")]
    for l in fixed:
        if l.strip() not in d: E.append(f"fixed template line missing verbatim: {l.strip()[:70]}")
    want = re.search(r"\{HASHTAGS[^}]*?(\w+):", "\n".join(blk["description"]))
    if hash_lines:
        n = len(re.findall(r"#\w+", main[hash_lines[-1]])); need = {"twelve": 12, "six": 6, "ten": 10, "eight": 8}.get((want.group(1).lower() if want else ""), 0)
        if need and n < need: W.append(f"{n} hashtags on the line; the template asks for {need}")
    if blk.get("pinned_comment"):
        if not pinned: E.append("the channel keeps its ebook link in a PINNED COMMENT line — add it after a blank line at the end")
        elif pinned[0] > 0 and body[pinned[0] - 1].strip(): W.append("the PINNED COMMENT line should follow a blank line")
        elif blk["pinned_comment"] not in body[pinned[0]]: E.append("the PINNED COMMENT text differs from the channel's")
else: W.append(f"channel {chan!r} not found in the suffix file — template lines not checked")
for x in E: print("[FAIL] " + x)
for x in W: print("[warn] " + x)
print(f"DESCRIPTION CHECK: {len(E)} FAIL / {len(W)} WARN · {len(d)} chars · {len(main)} lines")
sys.exit(1 if E else 0)
