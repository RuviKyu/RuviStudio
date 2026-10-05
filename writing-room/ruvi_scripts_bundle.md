# RUVI scripts bundle (canonical toolchain)

Project-knowledge form of writing-room/scripts/ (bundle revision 2026-10-06-r18). Prefer the plain files when /mnt/project carries them.

**Do not retype code from this document.** Extract byte-perfect copies with the extractor at the bottom, then verify the SHA-256 table. If any hash mismatches, stop and tell the user.

## File table

| file | bytes | sha256 |
|---|---|---|
| `apply_resolved_links.py` | 5332 | `c9cc610383eb4bad3d165596348ed40322d6ae450577ff349f3b4ec2d4445b58` |
| `auto_structure_lint.py` | 8549 | `3ea6dae786f5867c7a5ab969bd863ff90fb694683c24318f13a41bb51c6d6071` |
| `bootstrap.py` | 7643 | `304234281385cf46dda51dd50f4f721dd37ceeb55c34a855e86740f5dd12e2e1` |
| `build_breakdown.py` | 14399 | `0fbc5b5766a6eeb7b7da4023a9c647c7be9bddb2474cdcacc0dbee4b53d0aea2` |
| `bundle.py` | 11806 | `0a32ae7d673c91e3a8cc8bf8ac0a9baa8e625e5b18eda6f47a4e1bdeae017fee` |
| `commons_search.py` | 4132 | `e22c3725631d00b971a4a824df10f0ad28714c9648fec09387ecf38ae93d9ccc` |
| `description_check.py` | 3532 | `62167f3564937ba2f37b517d6ccfcd57d30d3c6ae2e25451cc95662d2f8e660d` |
| `fetch_assets.py` | 5918 | `0b18557aa91b7bb5348a62e4a4d3a7da58246a8f65c59fee7e68b6453566bc71` |
| `format_lint.py` | 8367 | `a31b5d8f75ef647a37aff407bc11e3be855fe05df9673a47d6ada47f46ee8f68` |
| `geo.py` | 4387 | `945ce52341ba2b56781ba0f093b47c6d272d2b427b593571c3c479705a3f8281` |
| `link_check.py` | 9021 | `2b68ee0ddfccdfa21403d0acb70884377197038f2a791019bfdef876797fd678` |
| `link_verify.py` | 9840 | `3da5528cac6d229fe2657ed6cf2d7032c97f82cc81ff2c5b8e608fec78cbeb7d` |
| `make_ai_prompts.py` | 1832 | `e1c403ee1b25108f744645e986a6ad70ad55fe96e656a38b3446918a47a94d16` |
| `make_auto_structure.py` | 8791 | `9d1a3b5941020ee42d53b9751b42e034c670992f289987fdc12915e0394bc900` |
| `make_diff.py` | 5824 | `7ee553d974ca797b71e20cd9505472434b08a695c3c6e3961402dda29c047429` |
| `make_download_links.py` | 4943 | `acc6dce41137eea61a47607f351f00bff0d914ecc1a05b4c1187ee44a2cae3ab` |
| `make_link_resolver.py` | 7447 | `e6006fbba7ba31a931bb265cd8894b32a220bcd2064ca0c1a999ac0737349022` |
| `make_manifest.py` | 6833 | `a7f3d5794fc04fe77d4447ed035eb1b0a5dd19d83ffb10c8fec1f1658e3434eb` |
| `make_special.py` | 5654 | `3f9c549a88269802627da358115d3989f09e1b512453f089344627e5716ad06b` |
| `make_zip.py` | 2850 | `10abbc188fe63693475c21a1512564547c4917e7f9c28c720a163ea8a90a5523` |
| `mapcrop.py` | 7110 | `dce13d914164ea659c738a87789c1c53d8fb703f0dec2bc0797cadb269dc0484` |
| `preflight.py` | 11150 | `dd7990d5d3842c08386ad6b2c9376938819a1bed61ccec320bf15043cc898357` |
| `prompt_lint.py` | 8797 | `336ddb680bcc9662a31a9c97f3cc3174094ce86ace2efbb66f508a0756c8f5fe` |
| `propose_sections.py` | 9175 | `28797f492b9f724a861b7d70b570159d1945dc32f83efee2b85636be8870c5be` |
| `rebuild.py` | 6854 | `bed546b291d31f3349f4a327aca1bf2a2c7745f6a81798e0234a6373f0a26183` |
| `review_audit.py` | 29614 | `465ba7843596610fcaba215574c99b56c97b73fcd0ff709ce1009c830602dc6a` |
| `review_run.py` | 3417 | `c51b9b0a4a7f0e81f9da5cff78ce9723f2fedc22cf7b497011a78522f80928cb` |
| `run_all.py` | 3319 | `43e611a89ce2c1cdee40ebc04f9754210593f51932c095bbf45c1a8628a18da4` |
| `selftest.py` | 4750 | `2d06d123f27f4f94f6f3bc4dc13da9fec2b031e547022f46575ecab67e58309c` |
| `sfx_check.py` | 4612 | `e7b78128b0c40db1bb7a6215d31ac82bc639877b98ad633f6db5f133c3b12bbb` |
| `snap.py` | 4360 | `b607deb9f770a290f28eaa434a35597bc470bc819ce5ee3620d150c07b934056` |
| `subtitles_from_timecodes.py` | 5755 | `6f7f1eeb02d15a8c2f6b4583d8ae4cd35dd241d069e5df20d092f3fc4adb3205` |
| `suffixes.py` | 4000 | `db7b65874bdc76914e1e294087d021910062c911c4b4532245486923101dcd64` |
| `time_breakdown.py` | 15092 | `db9c6d91744368b71e3a1cc40c32be0408f609b7d3efda14f2389b3ec44ad697` |
| `timing_check.py` | 7087 | `b9a74554242989959e5d78915c4244c89ec120859deb1e139bcf5cf9aaa9e59f` |
| `word_level_srt.py` | 6585 | `e6885178502333b67d7e677cbf88099f6d06a25a8adfd35f231dbc510deeed29` |
| `BUNDLE_VERSION.txt` | 15 | `cc2ba04e37de0ab601e751adfc54ccf9d27730425874cf9ff3932b5c7090c320` |

## Files

### FILE: apply_resolved_links.py

~~~~
#!/usr/bin/env python3
"""
APPLY RESOLVED LINKS — (R9) close the RUNG-3 loop deterministically.

Reads the newest [Subject]_resolved_links.json (downloaded from the link-resolver
page and uploaded back) and edits the FULL breakdown IN PLACE:

  • every image link whose File: title the resolver CONFIRMED gets its URL replaced
    with the API's canonical `url` VERBATIM (never edited, never rebuilt), and its
    confidence tag rewritten to
        [VERIFIED - Commons imageinfo API url via resolver JSON this run; <license kept>]
    (anything after the last ";" of the old tag — usually the license note — is kept);
  • every title the resolver reported MISSING gets
        [NOT FOUND - not on Commons per resolver JSON this run; replace or rely on -ALTERNATIVE- prompts]
    and its URL is left untouched so the slot is easy to find and fix;
  • VIDEO LINKs are never touched.

A pristine copy of the breakdown is saved once as <breakdown>.pre_resolve.bak.
Exits 1 while any NOT FOUND slot remains (so a runner stops for replacements);
exits 0 when every image link resolved. Re-run link_check.py afterwards — every
swapped URL passes the md5 /x/xy/ gate by construction (it came from the API).

Optional argv[1] = the working folder.
"""
import re, glob, os, sys, json, shutil
from urllib.parse import unquote

OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs")
hdr=re.compile(r'^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$')
linkre=re.compile(r'^(\s*)(VIDEO LINK|REF/MAP LINK \d+|ALT LINK \d+|LINK|REFERENCE)\s*:\s*(\S+)(\s*)$')
tagre=re.compile(r'\[((?:VERIFIED|NOT FOUND|UNCONFIRMED|FOUND)[^\]]*)\]')

def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p,encoding="utf-8",errors="ignore").read()))
    except Exception: return 0
def is_special(p):
    try: return "SPECIAL" in open(p,encoding="utf-8",errors="ignore").read(1500).upper().replace("SPECIAL:FILEPATH","")
    except Exception: return False
def title_of(u):
    m=re.search(r'/wiki/(File:[^?#]+)', u)
    if m: return unquote(m.group(1))
    m=re.search(r'/wikipedia/commons/(?:thumb/)?[0-9a-f]/[0-9a-f]{2}/([^/?#]+)', u)
    if m: return "File:"+unquote(m.group(1))
    return None
def norm_title(t): return (t or "").replace("_"," ").strip()

cands=[p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and not is_special(p)
       and "special" not in os.path.basename(p).lower()
       and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
if not cands: sys.exit("No FULL breakdown found in the folder.")
FULL=max(cands,key=is_breakdown)

jsons=glob.glob(f"{OUT}/*_resolved_links.json")+glob.glob("/mnt/user-data/uploads/*_resolved_links.json")
if not jsons: sys.exit("No *_resolved_links.json found — run make_link_resolver.py, have the user resolve, and upload the JSON.")
JP=max(jsons,key=os.path.getmtime)
data=json.load(open(JP,encoding="utf-8"))
resolved={}
for e in (data.get("links") or []):
    t=norm_title(e.get("title"))
    if not t: continue
    resolved[t]={"url":e.get("url"), "missing":bool(e.get("missing", not e.get("url")))}

bak=FULL+".pre_resolve.bak"
if not os.path.exists(bak): shutil.copyfile(FULL,bak)

L=open(FULL,encoding="utf-8").read().split('\n')
swapped=[]; missing=[]; untouched=0

def rewrite_tag(start, end, new_tag):
    """Rewrite (or append) the confidence tag inside the summary lines start..end."""
    for q in range(start, end):
        if not L[q].strip(): break
        if linkre.match(L[q]) or L[q].strip()=='-ALTERNATIVE-' or re.match(r'^\s*PROMPT\s+\d', L[q]): break
        m=tagre.search(L[q])
        if m:
            old=m.group(1)
            lic=old.rsplit(';',1)[1].strip() if ';' in old else ""
            tag=new_tag+(f"; {lic}" if lic and new_tag.startswith("VERIFIED") else "")
            L[q]=L[q][:m.start()]+"["+tag+"]"+L[q][m.end():]
            return True
    # no tag found in the summary — append one on its own line, template-indented
    L.insert(start, "      ["+new_tag+"]")
    return False

heads=[i for i,l in enumerate(L) if hdr.match(l)]
i=0
while i < len(L):
    lm=linkre.match(L[i])
    if lm and lm.group(2)!="VIDEO LINK":
        indent,label,url,trail=lm.groups()
        t=norm_title(title_of(url))
        r=resolved.get(t)
        if r is None:
            untouched+=1
        elif r["missing"] or not r["url"]:
            rewrite_tag(i+1, len(L), "NOT FOUND - not on Commons per resolver JSON this run; replace or rely on -ALTERNATIVE- prompts")
            missing.append(f"{label}: {t}")
        else:
            L[i]=f"{indent}{label}: {r['url']}"
            rewrite_tag(i+1, len(L), "VERIFIED - Commons imageinfo API url via resolver JSON this run")
            swapped.append(f"{label}: {t}")
    i+=1

open(FULL,"w",encoding="utf-8").write('\n'.join(L))
print(f"Breakdown: {os.path.basename(FULL)}   (backup: {os.path.basename(bak)})")
print(f"Resolver JSON: {os.path.basename(JP)}  ({len(resolved)} titles)")
print(f"Swapped to API urls: {len(swapped)} | NOT FOUND (need replacements): {len(missing)} | links not in the JSON: {untouched}")
for m in missing: print(f"  [NOT FOUND] {m}")
print("Next: re-run link_check.py; every swapped URL passes the md5 gate by construction.")
sys.exit(1 if missing else 0)
~~~~

### FILE: auto_structure_lint.py

~~~~
#!/usr/bin/env python3
"""
AUTO STRUCTURE LINT — (r11, Video_AutoStructure.md) validate [Subject]_auto_video_structure.txt
against the STAMPED FULL breakdown, then emit its machine twin [Subject]_auto_video_structure.json
(the Conductor reads the .txt; the .json is a convenience mirror).

The file is a BONUS deliverable for the RUVI Conductor: when it is absent this script
WARNs and exits 0 (nothing else in the package depends on it). When it is present:
FAIL when: an item's header is unreadable; TIMECODEs do not tile the video exactly
(gap/overlap, wrong start/end, an AI section whose parts do not cover it, a special
section whose TIMECODE differs from the breakdown); a special item's RENDER is not
S###_TYPE#; a PAN is not one of N NE E SE S SW W NW or repeats the previous AI
sub-section's; AI IMAGE numbers are not 1,2,3… in running order; a PROMPT is missing,
still carries the [REWRITE …] marker, or does not end with the channel STYLE SUFFIX.
WARN when an AI sub-section is outside 10–20 s (±0.5 s tolerance).
Usage: python3 auto_structure_lint.py <folder>      Exit 1 on any FAIL.
"""
import re, os, sys, glob, json
OUT = sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/outputs"
PANS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p, encoding="utf-8", errors="ignore").read()))
    except Exception: return 0
cands = [p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and "special" not in os.path.basename(p).lower()
         and "_original" not in os.path.basename(p).lower() and "auto_video_structure" not in os.path.basename(p).lower()]
if not cands: sys.exit("No FULL breakdown found.")
FULL = max(cands, key=is_breakdown); subj = re.sub(r'(_breakdown)?\.txt$', '', os.path.basename(FULL))
autos = glob.glob(f"{OUT}/{subj}_auto_video_structure.txt") or glob.glob(f"{OUT}/*_auto_video_structure.txt")
if not autos:
    # BONUS FILE (r12): the auto structure only feeds the RUVI Conductor. A package without it is
    # still a complete, valid deliverable for everything else — so its absence is a WARN, never a FAIL.
    print(f"[warn] no {subj}_auto_video_structure.txt in the folder — Phase S2 (Video_AutoStructure.md) not run; the Conductor cannot use this package, everything else is unaffected")
    print("AUTO STRUCTURE LINT: 0 FAIL / 1 WARN · (file absent, skipped)"); sys.exit(0)
AUTO = autos[0]
TC = re.compile(r'TIMECODE:\s*(\d\d):(\d\d):(\d\d)\.(\d{3})\s*(?:→|->)\s*(\d\d):(\d\d):(\d\d)\.(\d{3})')
def ms(h, m, s, f): return ((int(h) * 60 + int(m)) * 60 + int(s)) * 1000 + int(f)
def hms(t):
    t = max(0, int(round(t))); return f"{t // 3600000:02d}:{t // 60000 % 60:02d}:{t // 1000 % 60:02d}.{t % 1000:03d}"
# breakdown
bd, cur = [], None; SUFFIX = ""
for l in open(FULL, encoding="utf-8").read().split("\n"):
    m = re.match(r'^SECTION\s+(\d+)\s*\|\s*\d+\s*words\s*\|\s*(.+?)\s*$', l)
    if m: cur = {"num": int(m.group(1)), "type": m.group(2).split()[0].upper(), "t0": None, "t1": None}; bd.append(cur); continue
    if cur is None:
        sm = re.match(r'^STYLE SUFFIX:\s*"(.+)"\s*$', l)
        if sm: SUFFIX = sm.group(1)
        continue
    t = TC.search(l)
    if t: cur["t0"] = ms(*t.groups()[:4]); cur["t1"] = ms(*t.groups()[4:])
cnt = {"MAP": 0, "REF": 0, "CHAR": 0}
for s in bd:
    if s["type"] in cnt: cnt[s["type"]] += 1; s["ord"] = cnt[s["type"]]
    elif s["type"] == "HOOK": s["ord"] = 1
bynum = {s["num"]: s for s in bd}
# auto file
items, cur = [], None
AH = re.compile(r'^AUTO\s+(\d+)\s*\|\s*(.+?)\s*$')
lines = open(AUTO, encoding="utf-8").read().split("\n")
i = 0
while i < len(lines):
    l = lines[i]; m = AH.match(l)
    if m:
        rest = m.group(2); it = {"auto": int(m.group(1)), "kind": "?", "section": None, "image": None, "render": "", "pan": "", "t0": None, "t1": None, "prompt": ""}
        f = re.search(r'from\s+SECTION\s+(\d+)\s*\(AI\)\s*\|\s*part\s+(\d+)/(\d+)\s*\|\s*AI IMAGE\s+(\d+)', rest, re.I)
        g = re.search(r'SECTION\s+(\d+)\s*\((HOOK|MAP|REF|CHAR)(?:\s+\d+)?\)\s*\|\s*RENDER:\s*(\S+)', rest, re.I)
        if f: it.update(kind="AI", section=int(f.group(1)), part=f"{f.group(2)}/{f.group(3)}", image=int(f.group(4)))
        elif g: it.update(kind=g.group(2).upper(), section=int(g.group(1)), render=g.group(3))
        items.append(it); cur = it; i += 1; continue
    if cur is not None:
        t = TC.search(l)
        if t: cur["t0"] = ms(*t.groups()[:4]); cur["t1"] = ms(*t.groups()[4:])
        elif l.startswith("PAN:"): cur["pan"] = l[4:].strip().upper()
        elif l.strip() == "PROMPT:":
            out = []; j = i + 1
            while j < len(lines) and not AH.match(lines[j]) and not (re.match(r'^-{10,}$', lines[j]) and j + 1 < len(lines) and AH.match(lines[j + 1])):
                out.append(lines[j]); j += 1
            cur["prompt"] = "\n".join(out).strip(); i = j; continue
    i += 1
E, W = [], []
expect_img, prev_pan = 1, ""
for k, it in enumerate(items):
    tag = f"AUTO {it['auto']:03d}"
    if it["kind"] == "?": E.append(f"{tag}: unreadable header"); continue
    if it["t0"] is None: E.append(f"{tag}: missing TIMECODE"); continue
    if k and items[k - 1]["t1"] is not None and abs(items[k - 1]["t1"] - it["t0"]) > 1: E.append(f"{tag}: gap/overlap with the previous item")
    if it["kind"] == "AI":
        d = (it["t1"] - it["t0"]) / 1000
        if d < 9.5 or d > 25.0: W.append(f"{tag}: AI sub-section is {d:.2f}s (want 10–20; a whole AI section may run to the 25 s ceiling)")
        if it["pan"] not in PANS: E.append(f"{tag}: PAN must be one of {'/'.join(PANS)}")
        elif it["pan"] == prev_pan: E.append(f"{tag}: same PAN as the previous AI sub-section")
        prev_pan = it["pan"]
        if it["image"] != expect_img: E.append(f"{tag}: AI IMAGE {it['image']} (expected {expect_img})")
        expect_img = max(expect_img, (it["image"] or 0) + 1)
        if not it["prompt"]: E.append(f"{tag}: missing PROMPT")
        else:
            if it["prompt"].startswith("[REWRITE"): E.append(f"{tag}: PROMPT still carries the [REWRITE …] marker — write the sub-section's own prompt")
            if SUFFIX and not it["prompt"].rstrip().endswith(SUFFIX): E.append(f"{tag}: PROMPT does not end with the channel STYLE SUFFIX")
        s = bynum.get(it["section"])
        if not s or s["type"] != "AI": E.append(f"{tag}: SECTION {it['section']} is not an AI section of the breakdown")
    else:
        prev_pan = ""
        s = bynum.get(it["section"])
        if not s: E.append(f"{tag}: SECTION {it['section']} is not in the breakdown")
        else:
            if s["type"] != it["kind"]: E.append(f"{tag}: type {it['kind']} but SECTION {it['section']} is {s['type']}")
            if s["t0"] is not None and (abs(s["t0"] - it["t0"]) > 1 or abs(s["t1"] - it["t1"]) > 1): E.append(f"{tag}: TIMECODE differs from SECTION {it['section']}")
            want = f"S{s['num']:03d}_{s['type']}{'' if s['type'] == 'HOOK' else s.get('ord', 1)}"
            if it["render"] != want: E.append(f"{tag}: RENDER must be {want}")
for s in bd:
    parts = [it for it in items if it["section"] == s["num"]]
    if not parts: E.append(f"SECTION {s['num']} ({s['type']}) has no AUTO item"); continue
    if s["type"] == "AI":
        t0 = min(p["t0"] for p in parts if p["t0"] is not None); t1 = max(p["t1"] for p in parts if p["t1"] is not None)
        if abs(t0 - s["t0"]) > 1 or abs(t1 - s["t1"]) > 1: E.append(f"SECTION {s['num']} (AI): its parts do not cover its TIMECODE exactly")
    elif len(parts) != 1: E.append(f"SECTION {s['num']} ({s['type']}) appears {len(parts)} times")
if items and bd and items[-1]["t1"] is not None and abs(items[-1]["t1"] - bd[-1]["t1"]) > 1: E.append(f"AUTO structure ends at {hms(items[-1]['t1'])}, breakdown at {hms(bd[-1]['t1'])}")
if items and items[0]["t0"] not in (None, 0): E.append("AUTO 001 must start at 00:00:00.000")
twin = f"{OUT}/{subj}_auto_video_structure.json"
json.dump({"subject": subj, "source": os.path.basename(FULL), "items": items, "aiImages": sum(1 for it in items if it["kind"] == "AI"),
           "specials": [it["render"] for it in items if it["kind"] not in ("AI", "?")], "durationMs": items[-1]["t1"] if items else 0}, open(twin, "w", encoding="utf-8"), indent=1)
for w in W: print(f"[warn] {w}")
for e in E: print(f"[FAIL] {e}")
print(f"AUTO STRUCTURE LINT: {len(E)} FAIL / {len(W)} WARN · {len(items)} items · {sum(1 for it in items if it['kind'] == 'AI')} AI images → {os.path.basename(twin)}")
sys.exit(1 if E else 0)
~~~~

### FILE: bootstrap.py

~~~~
#!/usr/bin/env python3
"""
BOOTSTRAP — one call turns the packet into a ready working folder.

    python3 bootstrap.py <packet.zip> --subject <Subject> [--out /mnt/user-data/outputs]

Does, in order:
  • unzips the packet into <out>/<Subject>/.packet/ (never touched by make_zip)
  • reads 00_README_FOR_CLAUDE.md → channel, title folder, machine path
  • the narration .docx → <Subject>_source.txt (paragraphs verbatim, blank line between them)
  • the whisper word SRT → <Subject>.srt (the ASR source the chain reads) and *_words.json →
    <Subject>_words.json (exact per-word times; the best timing source)
  • Channel_Prompt_Suffixes.txt → the folder root (the scripts resolve the channel from it;
    make_zip leaves it out of the package), resolves the channel and prints its rules
  • <Subject>_meta.json (channel, title, paths, counts) for build_breakdown.py and friends
  • <Subject>_changes.md with the TITLE → SUBJECT line (the run's decision log; make_diff keeps it)
[Subject]: 3–20 chars, letters / digits / underscores (Video_Structure.md GROUND RULES).
Exit 1 on a fatally missing input (no docx / no SRT).
"""
import os, re, sys, json, glob, zipfile, shutil, subprocess, argparse, datetime

ap = argparse.ArgumentParser()
ap.add_argument("packet")
ap.add_argument("--subject", required=True)
ap.add_argument("--out", default="/mnt/user-data/outputs")
a = ap.parse_args()
SUBJ = a.subject
if not re.fullmatch(r"[A-Za-z0-9_]{3,20}", SUBJ): sys.exit(f"bad [Subject] '{SUBJ}': 3–20 chars, letters/digits/underscores only")
F = os.path.join(a.out, SUBJ); P = os.path.join(F, ".packet"); os.makedirs(P, exist_ok=True); os.makedirs(os.path.join(F, ".selftest"), exist_ok=True)
with zipfile.ZipFile(a.packet) as z:
    for n in z.namelist():
        if n.endswith("/"): continue
        data = z.read(n); dest = os.path.join(P, os.path.basename(n)); open(dest, "wb").write(data)
names = sorted(os.listdir(P))

# ---- README ----
rm = [n for n in names if re.match(r"^00_README", n, re.I)]
meta = {"subject": SUBJ, "channel": "", "title_folder": "", "machine_path": "", "readme": rm[0] if rm else "", "packet_files": names}
if rm:
    txt = open(os.path.join(P, rm[0]), encoding="utf-8", errors="ignore").read()
    m = re.search(r"^-\s*channel:\s*(\[[^\]]+\])", txt, re.M);      meta["channel"] = m.group(1).strip() if m else ""
    m = re.search(r"^-\s*title folder:\s*(.+?)\s*$", txt, re.M);   meta["title_folder"] = m.group(1).strip() if m else ""
    m = re.search(r"^-\s*machine path:\s*(.+?)\s*$", txt, re.M);   meta["machine_path"] = m.group(1).strip() if m else ""
    m = re.search(r"Generated by Ruvi Studio\s+([\d.]+)", txt);    meta["studio_version"] = m.group(1) if m else ""
meta["title"] = re.sub(r"^\d+\.\s*", "", meta["title_folder"]).strip()
meta["title_number"] = (re.match(r"^(\d+)\.", meta["title_folder"]) or [None, ""])[1]

# ---- narration ----
docx = [n for n in names if re.search(r"\.(docx?|rtf)$", n, re.I)]
if not docx: sys.exit("FATAL: no script .docx in the packet")
src = os.path.join(P, docx[0]); text = ""
for cmd in (["extract-text", src], ["pandoc", src, "-t", "plain", "--wrap=none"]):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if r.returncode == 0 and len(r.stdout.strip()) > 50: text = r.stdout; break
    except Exception: pass
if not text:
    try:
        import docx as _d; text = "\n\n".join(p.text for p in _d.Document(src).paragraphs)
    except Exception:
        with zipfile.ZipFile(src) as z: xml = z.read("word/document.xml").decode("utf-8", "ignore")
        paras = re.findall(r"<w:p[ >].*?</w:p>", xml, re.S)
        text = "\n\n".join(re.sub(r"<[^>]+>", "", re.sub(r"</w:p>", "\n", p)).strip() for p in paras)
        import html as _h; text = _h.unescape(text)
# normalise: strip markdown artefacts from extract-text, keep paragraphs, collapse spaces
paras = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n", text.replace("\r", "")) if p.strip()]
paras = [re.sub(r"^#+\s*", "", p) for p in paras]
paras = [p for p in paras if not re.fullmatch(r"[\-=_*]{3,}", p)]
source = "\n\n".join(paras) + "\n"
open(os.path.join(F, f"{SUBJ}_source.txt"), "w", encoding="utf-8").write(source)
cues_present = bool(re.search(r"\[[A-Z][A-Z \-]{2,}\]", source))

# ---- timings ----
srt = [n for n in names if re.search(r"_word_level\.srt$", n, re.I)] or [n for n in names if n.lower().endswith(".srt")]
if not srt: sys.exit("FATAL: no word-level SRT in the packet")
shutil.copyfile(os.path.join(P, srt[0]), os.path.join(F, f"{SUBJ}.srt"))
wj = [n for n in names if re.search(r"_words\.json$", n, re.I)]
if wj: shutil.copyfile(os.path.join(P, wj[0]), os.path.join(F, f"{SUBJ}_words.json"))
raw = open(os.path.join(F, f"{SUBJ}.srt"), encoding="utf-8-sig", errors="ignore").read()
ends = re.findall(r"-->\s*(\d\d):(\d\d):(\d\d)[,.](\d{3})", raw)
dur = ((int(ends[-1][0]) * 60 + int(ends[-1][1])) * 60 + int(ends[-1][2]) + int(ends[-1][3]) / 1000.0) if ends else 0.0
words = len(re.findall(r"[A-Za-z0-9']+", source))

# ---- suffix file + channel ----
suf = [n for n in names if re.search(r"Channel_Prompt_Suffixes", n, re.I)]
rules = {}; suffix = ""
if suf:
    shutil.copyfile(os.path.join(P, suf[0]), os.path.join(F, "Channel_Prompt_Suffixes.txt"))
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    try:
        from suffixes import parse_suffix_file
        chans = parse_suffix_file(os.path.join(F, "Channel_Prompt_Suffixes.txt"))
        key = meta["channel"].strip("[]").upper()
        if key in chans: suffix = chans[key]["suffix"]; rules = chans[key]["rules"]
        else: print(f"[warn] channel {meta['channel']!r} not found in the suffix file; found: {', '.join(sorted(chans))}")
    except Exception as e: print("[warn] suffix file could not be parsed:", e)
else: print("[warn] the packet carries no Channel_Prompt_Suffixes.txt — copy the project's into the folder root")
meta.update({"suffix": suffix, "rules": rules, "duration_s": round(dur, 3), "spoken_words": words, "paragraphs": len(paras),
             "bracket_cues": cues_present, "cta": json.load(open(os.path.join(P, "_cta.json"))) if "_cta.json" in names else None,
             "sfx_catalog": "_sfx_catalog.json" if "_sfx_catalog.json" in names else None, "bootstrapped": datetime.datetime.now().isoformat(timespec="seconds")})
json.dump(meta, open(os.path.join(F, f"{SUBJ}_meta.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)

# ---- changes file (decision log) ----
ch = os.path.join(F, f"{SUBJ}_changes.md")
if not os.path.exists(ch):
    open(ch, "w", encoding="utf-8").write(f"# {SUBJ} — changes / decision log\n\nTITLE: {meta['title_folder'] or '(unknown)'} → SUBJECT: {SUBJ}\n"
                                         f"CHANNEL: {meta['channel']} · packet bootstrapped {meta['bootstrapped']} · Ruvi Studio {meta.get('studio_version','?')}\n\n## Decisions\n")
wpm = words / dur * 60 if dur else 0
print(f"BOOTSTRAP OK  folder={F}")
print(f"  channel={meta['channel'] or '?'}  title={meta['title_folder'] or '?'}  subject={SUBJ}")
print(f"  narration: {words} words, {len(paras)} paragraphs{' (bracket cues present — stripped by the chain)' if cues_present else ''}")
print(f"  audio (from SRT): {dur:.1f} s = {int(dur//60)}:{int(dur%60):02d}  ·  {wpm:.1f} wpm  ·  word JSON: {'yes' if wj else 'no'}")
print(f"  suffix: {'resolved' if suffix else 'MISSING'}  rules: {rules or '(defaults)'}  cta: {('%d clip(s), %.1f s' % (len(meta['cta'].get('clips',[])), meta['cta'].get('totalSeconds',0))) if meta['cta'] else 'none'}")
print(f"  next: python3 propose_sections.py {F}")
~~~~

### FILE: build_breakdown.py

~~~~
#!/usr/bin/env python3
"""
BUILD BREAKDOWN — writes <Subject>_breakdown.txt in the EXACT Video_Structure.md template from
  <Subject>_plan.txt       (sections = sentence ranges + TYPE; THEME / CONTENT TREATMENT lines)
  <Subject>_sentences.tsv  (the narration, verbatim, timed)
  <Subject>_meta.json      (channel, suffix, title, counts)
  <Subject>_fills.txt      (your creative content — see FILLS FORMAT; optional: without it every
                            slot is a [FILL] placeholder and the script exits 1 listing them)
    python3 build_breakdown.py <folder> [--allow-partial]
Re-run it whenever the plan or the fills change (it rewrites the whole file; TIMECODEs come back
as [PENDING] — run_all.py stamps them again).

FILLS FORMAT (<Subject>_fills.txt) — blocks start with "## S<n>" (the section number) or a
closing-block name; keys are one line each unless noted; order inside a block is free:
  ## S3                       (HOOK / MAP: MAP SUBJECT, LINK, SUMMARY, PROMPT · REF: LINK, SUMMARY, PROMPT
  MAP SUBJECT: Nassau @ 25.0600,-77.3450 [source: script]        · AI: PROMPT · CHAR: see below)
  LINK: https://commons.wikimedia.org/wiki/File:Exact_Name.jpg   (one best verified file; slots 2/3 repeat it)
  SUMMARY: <what the sheet/image is; for a MAP: era, shows the place, PINPOINT (label as printed,
            position on the sheet, approx modern coords)> [VERIFIED - …]
  PROMPT: <one line; the channel STYLE SUFFIX is appended automatically if missing>
  ## S9                       (CHAR)
  CHARACTER: Charles Vane
  BORN: c. 1680 - England
  DIED: 29 March 1721 - Port Royal, Jamaica (hanged; about 41)
  ROLE: <3–6 sentences grounded in the script>
  REFERENCE: https://commons.wikimedia.org/wiki/File:Exact_Name.jpg
  SUMMARY: <image summary> [VERIFIED - …]
  PROMPT: <the portrait base, starting "Medium-shot portrait, solid black background, subject centered
           and looking toward the viewer: …">   (". " + suffix is appended automatically)
  ## CHARACTERS               (closing block, free lines: "• Name (CHAR n, Section N)" + indented lines)
  ## ALSO NAMED               ("• Name — one-line identification (Section(s) ..)." lines)
  ## PLACES                   ("• Place — role (Sections ..)." lines)
  ## KEY TERMS                ("• Term — definition (Section(s) ..)." lines)
"""
import os, re, sys, json, glob, argparse

ap = argparse.ArgumentParser(); ap.add_argument("folder"); ap.add_argument("--allow-partial", action="store_true"); a = ap.parse_args()
F = a.folder
meta = json.load(open(glob.glob(os.path.join(F, "*_meta.json"))[0], encoding="utf-8"))
SUBJ = meta["subject"]; SUFFIX = meta.get("suffix", "").strip(); CHANNEL = meta.get("channel", "")
if not SUFFIX: sys.exit("meta has no STYLE SUFFIX — bootstrap could not resolve the channel; fix Channel_Prompt_Suffixes.txt first")
rules = meta.get("rules") or {}
T = float(rules.get("AI_TARGET_S", 20)); TOL = float(rules.get("AI_TOL_S", 2)); MX = float(rules.get("AI_MAX_S", 25)); SMX = float(rules.get("MAX_SECTION_S", 30))

# ---- sentences ----
sent = []
for ln in open(os.path.join(F, f"{SUBJ}_sentences.tsv"), encoding="utf-8").read().split("\n")[1:]:
    if not ln.strip(): continue
    idx, st, en, pa, w, text = ln.split("\t", 5)
    sent.append({"idx": int(idx), "start": float(st), "end": float(en), "pause": float(pa), "words": int(w), "text": text})
# ---- plan ----
plan = open(os.path.join(F, f"{SUBJ}_plan.txt"), encoding="utf-8").read().split("\n")
themes, treat, secs = [], [], []
for ln in plan:
    if ln.startswith("#") or not ln.strip(): continue
    if ln.startswith("THEME:"):
        v = ln[6:].strip()
        if v and not v.startswith("[FILL"): themes.append(v)
        continue
    if ln.startswith("CONTENT TREATMENT:"):
        v = ln[len("CONTENT TREATMENT:"):].strip()
        if v and not v.startswith("[optional") and not v.startswith("[FILL"): treat.append(v)
        continue
    m = re.match(r"^S(\d+)\s*\|\s*(\d+)\s*-\s*(\d+)\s*\|\s*(HOOK|AI|MAP|REF|CHAR)\b", ln.strip(), re.I)
    if not m: sys.exit(f"plan line not understood: {ln[:80]}")
    secs.append({"num": int(m.group(1)), "a": int(m.group(2)), "b": int(m.group(3)), "type": m.group(4).upper()})
E = []
if not secs: E.append("plan has no sections")
if secs and secs[0]["type"] != "HOOK": E.append("S01 must be HOOK")
if any(s["type"] == "HOOK" for s in secs[1:]): E.append("only S01 may be HOOK")
exp = 1
for s in secs:
    if s["a"] != exp: E.append(f"S{s['num']:02d}: sentence range must start at {exp} (ranges tile the narration)")
    if s["b"] < s["a"]: E.append(f"S{s['num']:02d}: bad range")
    exp = s["b"] + 1
if secs and exp != len(sent) + 1: E.append(f"ranges end at sentence {exp - 1} but the narration has {len(sent)}")
for i in range(1, len(secs)):
    if secs[i]["type"] == secs[i - 1]["type"] and secs[i]["type"] in ("MAP", "REF"): E.append(f"S{secs[i]['num']:02d}: two consecutive {secs[i]['type']} sections")
for i, s in enumerate(secs, 1):
    if s["num"] != i: E.append(f"section numbering: line {i} is S{s['num']:02d}")
if E: sys.exit("PLAN ERRORS:\n  " + "\n  ".join(E))
def t_start(i): return sent[i]["start"] - (sent[i - 1]["pause"] / 2 if i > 0 else 0)      # midpoint-of-pause lengths, as stamped
def t_end(k): return sent[k]["end"] + (sent[k]["pause"] / 2 if k + 1 < len(sent) else 0)
for s in secs:
    s["sent"] = sent[s["a"] - 1:s["b"]]; s["start"] = t_start(s["a"] - 1); s["end"] = t_end(s["b"] - 1)
    s["words"] = sum(x["words"] for x in s["sent"]); s["text"] = " ".join(x["text"] for x in s["sent"])
    s["len"] = s["end"] - s["start"]
cnt = {"MAP": 0, "REF": 0, "CHAR": 0, "AI": 0}
for s in secs:
    if s["type"] in cnt: cnt[s["type"]] += 1; s["ord"] = cnt[s["type"]]
    s["label"] = "HOOK" if s["type"] == "HOOK" else f"{s['type']} {s['ord']}"
warn = []
for s in secs:
    lim = MX if s["type"] == "AI" else SMX
    if s["len"] > lim + 0.05: warn.append(f"S{s['num']:02d} {s['label']} is {s['len']:.1f} s (ceiling {lim:g})")
    if s["type"] == "AI" and abs(s["len"] - T) > TOL + 0.05: warn.append(f"S{s['num']:02d} AI is {s['len']:.1f} s (target {T:g}±{TOL:g})")

# ---- fills ----
fills = {}; closing = {"CHARACTERS": [], "ALSO NAMED": [], "PLACES": [], "KEY TERMS": []}
fp = os.path.join(F, f"{SUBJ}_fills.txt")
if os.path.exists(fp):
    cur = None; curkey = None
    for ln in open(fp, encoding="utf-8").read().split("\n"):
        m = re.match(r"^##\s*(S\s*(\d+)|CHARACTERS|ALSO NAMED|PLACES|KEY TERMS)\s*$", ln.strip(), re.I)
        if m:
            if m.group(2): cur = ("S", int(m.group(2))); fills.setdefault(cur[1], {})
            else: cur = ("C", m.group(1).upper())
            curkey = None; continue
        if cur is None or not ln.strip() and cur[0] == "S": continue
        if cur[0] == "C": closing[cur[1]].append(ln.rstrip()); continue
        km = re.match(r"^(MAP SUBJECT|LINK|SUMMARY|PROMPT|CHARACTER|BORN|DIED|ROLE|REFERENCE)\s*:\s*(.*)$", ln)
        if km: curkey = km.group(1).upper(); fills[cur[1]][curkey] = km.group(2).strip()
        elif curkey: fills[cur[1]][curkey] += " " + ln.strip()      # a value continued on the next line
    for k in closing: 
        while closing[k] and not closing[k][-1].strip(): closing[k].pop()
        while closing[k] and not closing[k][0].strip(): closing[k].pop(0)

def one(s): return " ".join(str(s).split())
def with_suffix(p):
    p = one(p)
    if p.lower().endswith(SUFFIX.lower()): return p
    p = p.rstrip(" .") if not re.search(r"[!?]$", p) else p
    return p + ". " + SUFFIX
def tagged(summary):
    s = one(summary)
    return s if re.search(r"\[(VERIFIED|FOUND|UNCONFIRMED|NOT FOUND)[^\]]*\]\s*$", s, re.I) else s + " [UNCONFIRMED - tag pending link_verify]"
missing = []
def need(num, key):
    v = (fills.get(num) or {}).get(key, "").strip()
    if not v: missing.append(f"S{num:02d} {key}"); return "[FILL]"
    return v

def mmss_dur(t): return f"{int(t // 60)} minutes {int(round(t % 60))} seconds ({t:.1f} seconds)"
total_words = sum(s["words"] for s in secs); dur = meta.get("duration_s") or secs[-1]["end"]
wps = total_words / dur if dur else 0; wpm = wps * 60
title = (meta.get("title") or SUBJ).upper()
L = []; A = L.append
A("=" * 40); A(f"HISTORY MAPS CHANNELS — {title}"); A("VIDEO BREAKDOWN — PAUSE-ALIGNED TIMING"); A("=" * 40)
A(f"TOTAL SPOKEN WORDS: {total_words:,} (" + ("bracketed stage cues stripped; spoken words only" if meta.get("bracket_cues") else "clean continuous narration; the script contains NO bracket/stage cues") + ")")
A(f"TOTAL DURATION: {mmss_dur(dur)}"); A(f"CALCULATED WPM: {wpm:.2f}"); A(f"WORDS PER SECOND: {wps:.4f}")
A("SECTION COMPOSITION: derived from the whisper word timings — sections close on the largest pause inside the 18–22 s band (ceiling 25 s), sentence ends only")
A("SECTION TIMECODES: EXACT — each section aligned to the word-level ASR (time_breakdown.py; per-word timestamps; boundaries on sentence ends)")
out = [f"S{s['num']} {s['label']} {s['len']:.1f}s" for s in secs if s["len"] > (MX if s["type"] == "AI" else SMX) + 0.05 or (s["type"] == "AI" and abs(s["len"] - T) > 5)]
A(f"TARGET SECTION LENGTH: AI sections {T:g} s ({T - TOL:g}–{T + TOL:g} s, ceiling {MX:g} s); HOOK / MAP / REF / CHAR sections 18-{SMX:g} s" + (". NOTE outliers: " + "; ".join(out) if out else ""))
A(f"TOTAL SECTIONS: {len(secs)}"); A("HOOK: 1 section")
A(f"AI Generated Artwork: {cnt['AI']} sections ({100.0 * cnt['AI'] / len(secs):.1f}%)")
A(f"Reference Images: {cnt['REF']} sections"); A(f"Reference Maps: {cnt['MAP']} sections"); A(f"Character Introductions: {cnt['CHAR']} sections")
A(f"CHANNEL: {CHANNEL}"); A(f'STYLE SUFFIX: "{SUFFIX}"')
A('NOTE: Every section has ONE prompt (PROMPT 1). Non-AI sections (HOOK/MAP/REF/CHAR) label theirs "-ALTERNATIVE-".')
A("      CHAR prompts are medium-shot black-background portraits: PROMPT 1 |CHANNEL ART STYLE|.")
if treat:
    A("CONTENT TREATMENT: " + treat[0])
    for t in treat[1:]: A("   " + t)
if not themes: themes = ["[FILL — THEME lines in the plan]"]; missing.append("THEME (plan)")
A("THEME: " + themes[0])
for t in themes[1:]: A("   " + t)
A("REMINDER: Spot-check every link before editing — link rot and search limits are real; confidence tags are honest.")
A("=" * 40); A("")

for s in secs:
    n = s["num"]; A("-" * 40); A(f"SECTION {n} | {s['words']} words | {s['label']}"); A("-" * 40); A(""); A("TIMECODE: [PENDING]"); A("")
    A('STARTS AT: "' + " ".join(s["text"].split()[:8]) + '..."'); A("SCRIPT:"); A(s["text"])
    f = fills.get(n) or {}
    if s["type"] in ("HOOK", "MAP"):
        A("MAP SUBJECT: " + need(n, "MAP SUBJECT"))
    A("")
    if s["type"] == "HOOK":
        link = need(n, "LINK"); A(f"   REF/MAP LINK 1: {link}"); A("      " + tagged(need(n, "SUMMARY")))
        A(f"   REF/MAP LINK 2: {link}"); A("      Repeat of REF/MAP LINK 1. [VERIFIED - same file as slot 1]")
        A("-ALTERNATIVE-"); A("PROMPT 1: |CHANNEL ART STYLE|"); A(with_suffix(need(n, "PROMPT"))); A("")
    elif s["type"] in ("MAP", "REF"):
        link = need(n, "LINK"); A(f"   LINK: {link}"); A("      " + tagged(need(n, "SUMMARY")))
        A(f"   ALT LINK 1: {link}"); A("      Repeat of link slot 1. [VERIFIED - same file as slot 1]")
        A(f"   ALT LINK 2: {link}"); A("      Repeat of link slot 1. [VERIFIED - same file as slot 1]")
        A("-ALTERNATIVE-"); A("PROMPT 1: |CHANNEL ART STYLE|"); A(with_suffix(need(n, "PROMPT"))); A("")
    elif s["type"] == "CHAR":
        A("CHARACTER INTRODUCTION: " + need(n, "CHARACTER")); A("BORN: " + need(n, "BORN")); A("DIED: " + need(n, "DIED")); A("ROLE: " + one(need(n, "ROLE")))
        A("REFERENCE: " + need(n, "REFERENCE")); A("   " + tagged(need(n, "SUMMARY")))
        A("-ALTERNATIVE-"); A("PROMPT 1: |CHANNEL ART STYLE|")
        base = one(need(n, "PROMPT"))
        if base != "[FILL]" and not re.match(r"(?i)^medium-shot portrait", base): base = "Medium-shot portrait, solid black background, subject centered and looking toward the viewer: " + base
        A(with_suffix(base)); A("")
    else:
        A("PROMPT 1:"); A(with_suffix(need(n, "PROMPT"))); A("")

A("=" * 40); A("SUMMARY TABLE"); A("=" * 40)
for s in secs: A(f"SECTION {s['num']:>2} | {s['label']:<8} | \"" + " ".join(s["text"].split()[:8]) + '..."')
A(""); A("=" * 40); A("VISUAL TYPE COUNT"); A("=" * 40)
def lst(t): return ", ".join(str(s["num"]) for s in secs if s["type"] == t) or "none"
A("HOOK: 1 — Section 1"); A(f"AI IMAGES: {cnt['AI']} ({100.0 * cnt['AI'] / len(secs):.1f}%) — Sections {lst('AI')}")
A(f"CHARACTER INTROS: {cnt['CHAR']} — Sections {lst('CHAR')}"); A(f"MAPS: {cnt['MAP']} — Sections {lst('MAP')}"); A(f"REFERENCE IMAGES: {cnt['REF']} — Sections {lst('REF')}")
A("No consecutive MAPS. No consecutive REFERENCE IMAGES."); A("")
A("=" * 40); A("CHARACTERS / PEOPLE"); A("=" * 40)
if closing["CHARACTERS"]: L += closing["CHARACTERS"]
else:
    for s in secs:
        if s["type"] == "CHAR":
            f = fills.get(s["num"]) or {}; A(f"• {f.get('CHARACTER', '[FILL]')} ({s['label']}, Section {s['num']})"); A(f"   Born {f.get('BORN', '[FILL]')}; Died {f.get('DIED', '[FILL]')}."); A("   " + one(f.get("ROLE", "[FILL]")))
    if cnt["CHAR"] == 0: A("• (no CHAR sections)")
A(""); A("Also named in the script (not given separate CHAR cards):")
L += closing["ALSO NAMED"] or ["• [FILL]"]; missing += ([] if closing["ALSO NAMED"] else ["ALSO NAMED (closing)"])
A(""); A("=" * 40); A("PLACES"); A("=" * 40); L += closing["PLACES"] or ["• [FILL]"]; missing += ([] if closing["PLACES"] else ["PLACES (closing)"])
A(""); A("=" * 40); A("KEY TERMS"); A("=" * 40); L += closing["KEY TERMS"] or ["• [FILL]"]; missing += ([] if closing["KEY TERMS"] else ["KEY TERMS (closing)"])
A("")
dest = os.path.join(F, f"{SUBJ}_breakdown.txt"); open(dest, "w", encoding="utf-8").write("\n".join(L))
print(f"BREAKDOWN: {dest}  ({len(secs)} sections: HOOK 1 · AI {cnt['AI']} · MAP {cnt['MAP']} · REF {cnt['REF']} · CHAR {cnt['CHAR']} · {total_words} words · {dur:.1f} s)")
for w in warn: print("  [warn] " + w)
if missing:
    print(f"  [FILL] slots still empty ({len(missing)}): " + ", ".join(missing[:40]) + (" …" if len(missing) > 40 else ""))
    if not a.allow_partial: print("  → write them into " + os.path.basename(fp) + " and re-run (or --allow-partial)"); sys.exit(1)
print("  next: python3 link_verify.py " + F + "   then   python3 run_all.py " + F)
~~~~

### FILE: bundle.py

~~~~
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
~~~~

### FILE: commons_search.py

~~~~
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
~~~~

### FILE: description_check.py

~~~~
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
~~~~

### FILE: fetch_assets.py

~~~~
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
~~~~

### FILE: format_lint.py

~~~~
#!/usr/bin/env python3
"""
FORMAT LINT — does the breakdown match the template, field for field?

Structural gate that runs before the timing/audit work so a malformed or hand-broken
breakdown is caught with a clear message instead of producing garbage. For every
section it checks the header is well formed and that the fields REQUIRED for that
section type are present: a TIMECODE line (even [PENDING]); a non-empty SCRIPT; exactly
the right number of PROMPT lines (r15: ONE per section — PROMPT 1 for AI, one -ALTERNATIVE-
for the rest — unless the channel sets AI_PROMPTS / ALT_PROMPTS); and the type's links — HOOK needs REF/MAP LINK 1 + 2 (r9: the HOOK is a
map animation, so its image is an antique sheet and it carries a MAP SUBJECT line like
every MAP; VIDEO LINK is optional and unused), MAP/REF need LINK + ALT LINK 1 + 2, CHAR
needs a REFERENCE, AI needs none. It also
checks the header carries a CHANNEL and a STYLE SUFFIX line. Separately it runs a
content-safety keyword net over the prompts and WARNs (never fails) on words that tend
to mean violence is being shown head-on, so they can be reviewed.

Writes [Subject]_format_lint.md and exits 1 on any structural FAIL (WARNs do not fail).
Optional argv[1] = the working folder.
"""
import re, glob, os, sys

OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs")
# (r13) per-channel AI rules from Channel_Prompt_Suffixes.txt (AI_PROMPTS: 1 on [OLDWORLDPROOF])
def _prompts_for(folder):
    import glob as _g
    here=os.path.dirname(os.path.abspath(__file__)); path=None
    for d in (folder,"/mnt/user-data/uploads",here,os.getcwd()):
        hits=_g.glob(f"{d}/*Channel_Prompt_Suffixes*.txt")+_g.glob(f"{d}/*hannel*uffix*.txt")
        if hits: path=hits[0]; break
    chan=None
    for p in _g.glob(f"{folder}/*.txt"):
        try: t=open(p,encoding="utf-8",errors="ignore").read(4000)
        except Exception: continue
        mm=re.search(r'(?im)^\s*CHANNEL:\s*(.+?)\s*$', t)
        if mm and re.search(r'(?m)^SECTION\s+\d+\s*\|', t): chan=mm.group(1).strip().strip("[]").upper(); break
    if not path or not chan: return {"AI":1,"ALT":1}
    raw=open(path,encoding="utf-8-sig",errors="ignore").read().replace('\r\n','\n')
    lines=raw.split('\n'); i=0
    while i<len(lines):
        if lines[i].startswith("CHANNELS:"):
            tags=[x.strip().upper() for x in re.findall(r'\[([^\]]+)\]', lines[i])]; j=i+1; val={"AI":1,"ALT":1}
            while j<len(lines) and not lines[j].startswith("CHANNELS:") and set(lines[j].strip())!={'-'}:
                mm=re.match(r'\s*(AI_PROMPTS|ALT_PROMPTS)\s*:\s*(\d+)', lines[j])
                if mm: val["AI" if mm.group(1)=="AI_PROMPTS" else "ALT"]=int(mm.group(2))
                j+=1
            if chan in tags: return val
            i=j
        else: i+=1
    return {"AI":1,"ALT":1}
PROMPTS=_prompts_for(OUT)
hdr=re.compile(r'^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$')
prre=re.compile(r'^\s*PROMPT\s+([123])\b')
linkre=re.compile(r'^\s*(VIDEO LINK|REF/MAP LINK \d+|ALT LINK \d+|LINK|REFERENCE)\s*:\s*(\S+)')
base=lambda t: t.split()[0].upper()

VIOLENT=[r'\bcorpses?\b',r'\bgore\b',r'\bgory\b',r'\bbloodshed\b',r'\bbloody\b',
         r'mutilat',r'dismember',r'decapitat',r'behead',r'disembowel',r'\bentrails\b',
         r'\bmassacre',r'\bslaughter',r'\bimpaled?\b',r'impalement',r'\blynch',
         r'severed head',r'pile of bodies',r'dead bodies',r'\bexecution\b',r'\bexecuted\b',
         r'\bhanged\b',r'\bhanging\b',r'\bstabb']

def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p,encoding="utf-8",errors="ignore").read()))
    except Exception: return 0
def is_special(p):
    try: return "SPECIAL" in open(p,encoding="utf-8",errors="ignore").read(1500).upper().replace("SPECIAL:FILEPATH","")
    except Exception: return False

cands=[p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and not is_special(p)
       and "special" not in os.path.basename(p).lower()
       and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
if not cands: sys.exit("No FULL breakdown found in the folder.")
FULL=max(cands,key=is_breakdown); subj=re.sub(r'(_breakdown)?.txt$','',os.path.basename(FULL))
L=open(FULL,encoding="utf-8").read().split('\n')
heads=[i for i,l in enumerate(L) if hdr.match(l)]

fails=[]; warns=[]
HEADER="\n".join(L[:heads[0]] if heads else L)
if not re.search(r'(?im)^\s*CHANNEL:\s*\S', HEADER): fails.append("header: missing CHANNEL line")
if not re.search(r'(?im)^\s*STYLE SUFFIX:\s*"', HEADER): fails.append('header: missing STYLE SUFFIX line')
if not heads: fails.append("no SECTION blocks found")

REQ={"HOOK":["REF/MAP LINK 1","REF/MAP LINK 2"],        # (r9) VIDEO LINK optional: the HOOK renders as a map animation
     "MAP":["LINK","ALT LINK 1","ALT LINK 2"],
     "REF":["LINK","ALT LINK 1","ALT LINK 2"],
     "CHAR":["REFERENCE"],"AI":[]}
for k,hi in enumerate(heads):
    end=heads[k+1] if k+1<len(heads) else len(L); blk=L[hi:end]; m=hdr.match(L[hi])
    num=m.group(1); bt=base(m.group(3).strip()); tag=f"S{num} {m.group(3).strip()}"
    if not any(l.strip().upper().startswith('TIMECODE') for l in blk): fails.append(f"{tag}: no TIMECODE line")
    s_i=next((q for q,l in enumerate(blk) if l.strip()=='SCRIPT:'), None)
    if s_i is None: fails.append(f"{tag}: no SCRIPT: line")
    else:
        body=blk[s_i+1] if s_i+1<len(blk) else ""
        if not body.strip(): fails.append(f"{tag}: SCRIPT is empty")
    nump=len({pm.group(1) for l in blk for pm in [prre.match(l)] if pm})
    want=(PROMPTS["AI"] if bt=="AI" else PROMPTS["ALT"])              # (r15) ONE prompt per section by default; AI_PROMPTS / ALT_PROMPTS per channel
    if nump!=want: fails.append(f"{tag}: found {nump} PROMPT lines (need exactly {want})")
    labels=[lm.group(1) for l in blk for lm in [linkre.match(l)] if lm]
    for need in REQ.get(bt,[]):
        if need not in labels: fails.append(f"{tag}: missing required field '{need}'")
    if bt in ("MAP","HOOK"):                                # (r9) the HOOK is pinned like a MAP
        msl=[l for l in blk if l.strip().startswith("MAP SUBJECT:")]
        if not msl:
            fails.append(f"{tag}: {bt} section missing 'MAP SUBJECT: <name> @ <lat>,<lon> [source: script|narrative|user]'")
        elif not re.match(r'^MAP SUBJECT:\s*.+?\s*@\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\[source:\s*(script|narrative|user)\]\s*$', msl[0].strip()):
            fails.append(f"{tag}: MAP SUBJECT line malformed: {msl[0].strip()[:80]}")
    if bt=="CHAR":
        iv=next((re.match(r'(?i)^\s*CHARACTER INTRODUCTION:\s*(.+?)\s*$', l) for l in blk
                 if re.match(r'(?i)^\s*CHARACTER INTRODUCTION:\s*(.+?)\s*$', l)), None)
        nm=iv.group(1).strip() if iv else ""
        if not nm or nm.startswith("["): fails.append(f"{tag}: CHAR section needs a CHARACTER INTRODUCTION name")
    # content-safety net over prompt text
    ptext=" ".join(l for l in blk).lower()
    # (R5) mask innocuous collocations so "hanging lantern" et al. don't cry wolf;
    # real flags (bodies, gore, executions...) are untouched.
    SAFE=[r'hanging (?:lanterns?|lamps?|laundry|signs?|baskets?|gardens?|bridges?|vines?|moss|banners?|scrolls?|nets?|curtains?|cloth)',
          r'(?:dust|smoke|mist|fog|haze|lanterns?|lamps?|light|laundry|moss|vines?) hanging',
          r'hanging in the (?:air|sky|stillness|gloom|haze|balance)',
          r'cliff[- ]hanging']
    for _sp in SAFE: ptext=re.sub(_sp, ' ', ptext)
    hits=sorted({re.sub(r'\\b|\\','',pat) for pat in VIOLENT if re.search(pat, ptext)})
    if hits: warns.append(f"{tag}: violent-looking term(s) in prompts: {', '.join(hits)} — confirm it's rendered with restraint")

out=[f"# Format lint — {subj}","",f"**{len(fails)} FAIL · {len(warns)} WARN**",""]
out+=(["## Structure"]+[f"- ❌ {f}" for f in fails] if fails else ["## Structure","- ✅ template OK: every section has its required fields"])
out+=[""]
if warns: out+=["## Content-safety net (review these)"]+[f"- ⚠️ {w}" for w in warns]
dest=f"{OUT}/{subj}_format_lint.md"; open(dest,"w",encoding="utf-8").write('\n'.join(out)+'\n')
for f in fails: print(f"[FAIL] {f}")
for w in warns: print(f"[warn] {w}")
print(f"\nFORMAT LINT: {len(fails)} FAIL / {len(warns)} WARN\nReport: {dest}")
sys.exit(1 if fails else 0)
~~~~

### FILE: geo.py

~~~~
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
~~~~

### FILE: link_check.py

~~~~
#!/usr/bin/env python3
"""
LINK CHECK — the anti-hallucination gate for image links (replaces links_review).

Two independent failure modes kill a Wikimedia image link:
  1. MIS-HASHED / EDITED URL — the /x/xy/ path no longer matches md5(filename). Caught
     here, offline and deterministically.
  2. NON-EXISTENT FILE — a perfectly well-formed, correctly-hashed URL for a file that
     simply is not on Commons (the classic "looks real, was invented" case). NO offline
     check can catch this; the only signal is asking Commons. So for every image link
     this prints the exact imageinfo API query you MUST fetch (with your web tools) to
     confirm the file exists and to read back its real URL.

The rule the prompt enforces: never write a Wikimedia file URL you did not get back
from one of these API calls (or a Commons search) this session and then confirm loads.

Per section it lists every link with a checkbox + its confidence tag, gives the
structural verdict and the API query for each image link, lists HOOK VIDEO LINKs to
fetch-verify, and flags duplicates. Writes [Subject]_link_check.md and exits 1 if any
canonical upload URL fails the hash check, any REF/CHAR/MAP link is not a File page or
upload URL, or any Category/Special link appears. Optional argv[1] = the working folder.
"""
import re, glob, os, sys, hashlib
from urllib.parse import urlsplit, unquote, quote

OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs")
hdr=re.compile(r'^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$')
linkre=re.compile(r'^\s*(VIDEO LINK|REF/MAP LINK \d+|ALT LINK \d+|LINK|REFERENCE)\s*:\s*(\S+)')
# (B3) tags in the template read like [VERIFIED - Commons imageinfo API ...; license] —
# hyphens, lowercase and semicolons included. Match the tag KEYWORD then anything to ']'.
tagre=re.compile(r'\[((?:VERIFIED|NOT FOUND|UNCONFIRMED|FOUND)[^\]]*)\]')
def tag_kind(tag):
    t=(tag or "").upper()
    if t.startswith("NOT FOUND"): return "NOT FOUND"
    if t.startswith("VERIFIED"):  return "VERIFIED"
    if t.startswith("UNCONFIRMED"): return "UNCONFIRMED"
    if t.startswith("FOUND"):     return "FOUND"
    return "no tag"
base=lambda t: t.split()[0].upper()
API="https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|mime|size&titles="

def is_upload(u): return u.startswith("https://upload.wikimedia.org/wikipedia/commons/")
def is_file_page(u): return ("wikimedia.org/wiki/File:" in u or "wikipedia.org/wiki/File:" in u)
def is_category(u): return "/wiki/Category:" in u
def is_special(u): return "/wiki/Special:" in u
def hash_ok(u):
    try:
        seg=urlsplit(u).path.split('/'); i=seg.index('commons'); s=seg[i+1:]
        a,ab,name=((s[1],s[2],unquote(s[3])) if s and s[0]=='thumb' else (s[0],s[1],unquote(s[2])))
        if len(a)!=1 or len(ab)!=2: return False,"prefix is not 1/2 hex chars"
        md5=hashlib.md5(name.encode('utf-8')).hexdigest()
        return (a==md5[0] and ab==md5[:2]), f"path says {a}/{ab}; md5(filename) says {md5[0]}/{md5[:2]}"
    except Exception as e:
        return False, f"could not parse upload URL ({e})"
def title_of(u):
    m=re.search(r'/wiki/(File:[^?#]+)', u)
    if m: return unquote(m.group(1))
    seg=urlsplit(u).path.split('/')
    if 'commons' in seg:
        s=seg[seg.index('commons')+1:]; nm=(s[3] if s and s[0]=='thumb' else (s[2] if len(s)>2 else None))
        if nm: return "File:"+unquote(nm)
    return None
def api_url(u):
    t=title_of(u); return (API+quote(t.replace(' ','_'), safe=':')) if t else None
def filepath_probe(u):
    t=title_of(u)
    return ("https://commons.wikimedia.org/wiki/Special:FilePath/"+quote(t[5:].replace(' ','_'), safe='')) if t else None

def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p,encoding="utf-8",errors="ignore").read()))
    except Exception: return 0
def head_special(p):
    try: return "SPECIAL" in open(p,encoding="utf-8",errors="ignore").read(1500).upper().replace("SPECIAL:FILEPATH","")
    except Exception: return False
cands=[p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and not head_special(p)
       and "special" not in os.path.basename(p).lower()
       and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
if not cands: sys.exit("No FULL breakdown found in the folder.")
FULL=max(cands,key=is_breakdown); subj=re.sub(r'(_breakdown)?.txt$','',os.path.basename(FULL))
L=open(FULL,encoding="utf-8").read().split('\n'); heads=[i for i,l in enumerate(L) if hdr.match(l)]

out=[f"# Link check — {subj}","",
 "**A well-formed URL is not a real URL.** Each image link must be confirmed to *exist*",
 "by fetching its API query before you trust it. Do not write any Wikimedia file URL you",
 "did not get back from one of these calls (or a Commons search), then confirm loads —",
 "and replace the stored URL with the `url` the API returns.","",
 "Tags: ✅ structurally OK (still verify existence) · ❌ broken (do not use as-is).",
 "[VERIFIED] you fetched it and it loads · [FOUND] likely · [UNCONFIRMED] needs a look · [NOT FOUND] replace it.",""]
CENSUS_AT=len(out)   # (Q8) tag census inserted here once all links are read
bad=[]; nimg=0; nvid=0; seen={}; counts={}
for k,hi in enumerate(heads):
    end=heads[k+1] if k+1<len(heads) else len(L); m=hdr.match(L[hi]); bt=base(m.group(3).strip())
    rows=[]
    for j in range(hi+1,end):
        lm=linkre.match(L[j])
        if not lm: continue
        label,url=lm.group(1),lm.group(2)
        # (B3) the summary can WRAP over several indented lines; walk them all
        # (stop at the next link label, -ALTERNATIVE-, a PROMPT line, or a blank)
        tag=""; _sum=[]
        for q in range(j+1, end):
            _l=L[q]
            if not _l.strip(): break
            if linkre.match(_l) or _l.strip()=='-ALTERNATIVE-' or re.match(r'^\s*PROMPT\s+\d', _l): break
            _sum.append(_l.strip())
        tm=tagre.search(" ".join(_sum))
        if tm: tag=tm.group(1).strip()
        counts[tag_kind(tag)]=counts.get(tag_kind(tag),0)+1
        seen.setdefault(url,[]).append(f"S{m.group(1)} {label}")
        tg=f" `[{tag}]`" if tag else " `[no tag]`"
        if is_category(url): bad.append(f"S{m.group(1)} {label}: Category link (never allowed) — {url}")
        if is_special(url):  bad.append(f"S{m.group(1)} {label}: Special: link (store the resolved upload URL instead) — {url}")
        if label=="VIDEO LINK":
            nvid+=1
            _row=f"- [ ] 🎞️ **{label}**{tg} — {url}\n    verify by fetching the page; confirm it is a real, working video."
            _am=re.search(r'archive\.org/details/([^/?#]+)', url)   # (F4) one-fetch existence probe
            if _am: _row+=f"\n    archive.org existence + file listing: https://archive.org/metadata/{_am.group(1)}"
            rows.append(_row)
            continue
        nimg+=1
        if is_upload(url):
            ok,why=hash_ok(url)
            if not ok: bad.append(f"S{m.group(1)} {label}: hash/path mismatch — {why}")
            mk="✅" if ok else "❌ HASH MISMATCH"
            extra="" if ok else f"    {why}\n"
            rows.append(f"- [ ] {mk} **{label}**{tg} — {url}\n{extra}    confirm it EXISTS: {api_url(url)}\n    (browser probe ONLY — never paste a Special: link into a breakdown: {filepath_probe(url)} 302s to the file, or 404s if the title is wrong)")
        elif is_file_page(url):
            rows.append(f"- [ ] ✅ **{label}** (File page){tg} — {url}\n    resolve + confirm: {api_url(url)}")
        else:
            if bt in ("MAP","REF","CHAR","HOOK"):
                bad.append(f"S{m.group(1)} {label}: not a Commons File page or upload URL — {url}")
                rows.append(f"- [ ] ❌ **{label}**{tg} — {url}\n    not a Commons file link; find the real file via a Commons search, then use its API url.")
            else:
                rows.append(f"- [ ] **{label}**{tg} — {url}")
    if rows: out.append(f"## Section {m.group(1)} — {m.group(3).strip()}"); out+=rows; out.append("")

_census=" · ".join(f"{k}: {counts[k]}" for k in ("VERIFIED","FOUND","UNCONFIRMED","NOT FOUND","no tag") if counts.get(k))
out.insert(CENSUS_AT, f"**Tag census:** {_census}")
out.insert(CENSUS_AT+1, "")
dupes={u:w for u,w in seen.items() if len(w)>1}
if dupes:
    out+=["## Duplicate URLs (same link used more than once)",""]+[f"- {u}  —  {', '.join(w)}" for u,w in dupes.items()]+[""]
if bad:
    out+=["## ❌ Structural problems (fix before delivery)",""]+[f"- {b}" for b in bad]+[""]
dest=f"{OUT}/{subj}_link_check.md"; open(dest,"w",encoding="utf-8").write('\n'.join(out)+'\n')
print(f"Link check: {dest}")
print(f"  image links: {nimg} | video links: {nvid} | duplicates: {len(dupes)} | structural problems: {len(bad)}")
print(f"  tags: {_census}")
for b in bad: print(f"  [FAIL] {b}")
print("  Reminder: fetch each API query above and keep ONLY links the API confirms exist.")
sys.exit(1 if bad else 0)
~~~~

### FILE: link_verify.py

~~~~
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
~~~~

### FILE: make_ai_prompts.py

~~~~
#!/usr/bin/env python3
"""
MAKE AI PROMPTS — (r16) writes [Subject]_ai_prompts.txt: ONE prompt per line, in
AI IMAGE order (001, 002 …), straight from [Subject]_auto_video_structure.json
(the .json twin that auto_structure_lint.py writes). Bulk image tools (TurboFlow and
the other Google-Flow automators, BulkImagen, AutoFly …) import exactly this shape;
the generated files, taken in name order, become AI Images\\001.jpg, 002.jpg …
Also writes [Subject]_ai_prompts.csv (index,prompt) for tools that want a CSV.

Optional argv[1] = the working folder.
"""
import glob, json, os, sys, csv

args=[a for a in sys.argv[1:] if not a.startswith("--")]
OUT=(args[0] if args else "/mnt/user-data/outputs")
cands=sorted(glob.glob(os.path.join(OUT, "*_auto_video_structure.json")))
if not cands:
    sys.exit("make_ai_prompts: no *_auto_video_structure.json in the folder (run auto_structure_lint.py first)")
src=cands[0]; subj=os.path.basename(src).replace("_auto_video_structure.json","")
data=json.load(open(src, encoding="utf-8"))
items=data.get("items") or data.get("structure") or []
ai=[it for it in items if str(it.get("kind","")).upper()=="AI" or it.get("image") is not None]
ai.sort(key=lambda it: int(it.get("image") or 0))
lines=[]
for it in ai:
    pr=" ".join(str(it.get("prompt","")).split())
    if not pr: sys.exit(f"make_ai_prompts: AI IMAGE {it.get('image')} has no prompt")
    lines.append(pr)
txt=os.path.join(OUT, f"{subj}_ai_prompts.txt"); open(txt,"w",encoding="utf-8").write("\n".join(lines)+"\n")
with open(os.path.join(OUT, f"{subj}_ai_prompts.csv"),"w",encoding="utf-8",newline="") as f:
    w=csv.writer(f); w.writerow(["index","file","prompt"])
    for i,pr in enumerate(lines,1): w.writerow([i, f"{i:03d}.jpg", pr])
print(f"AI PROMPTS: {txt}  ({len(lines)} prompt(s), one per line, AI IMAGE order)")
~~~~

### FILE: make_auto_structure.py

~~~~
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
~~~~

### FILE: make_diff.py

~~~~
#!/usr/bin/env python3
"""
MAKE DIFF — write [Subject]_changes.md: exactly what the review changed.

Compares the pristine [Subject]_breakdown_original.txt (saved at the start of the
review) to the corrected [Subject]_breakdown.txt and lists, per section, every
PROMPT, LINK, and TIMECODE that changed, as old -> new. Sections are matched by their
SCRIPT text (not by number) so the report still makes sense if sections were re-
composed during the timing pass. Anything whose SCRIPT changed (or was added/removed)
is reported under composition changes.

(r8) THE DECISION LOG SURVIVES. Under autorun every decision of the run — starting
with the "TITLE: <full title> → SUBJECT: [Subject]" mapping line — is logged in
[Subject]_changes.md long before this script runs. The diff is therefore written as a
marked block (<!-- make_diff:begin --> … <!-- make_diff:end -->) that is REPLACED on
each run, while everything outside the markers is carried over verbatim. Nothing
needs re-appending after the review chain any more.

Optional argv[1] = the working folder.
"""
import re, glob, os, sys

OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs")
hdr=re.compile(r'^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$')
prre=re.compile(r'^\s*PROMPT\s+([123])\b\s*:?(.*)$')
linkre=re.compile(r'^\s*(VIDEO LINK|REF/MAP LINK \d+|ALT LINK \d+|LINK|REFERENCE)\s*:\s*(\S+)')
tcre=re.compile(r'TIMECODE:\s*(.+?)\s*$')
norm=lambda s: " ".join(re.findall(r"[a-z0-9]+", s.lower()))

def parse(path):
    L=open(path,encoding="utf-8").read().split('\n'); heads=[i for i,l in enumerate(L) if hdr.match(l)]; out=[]
    for k,hi in enumerate(heads):
        end=heads[k+1] if k+1<len(heads) else len(L); blk=L[hi:end]; m=hdr.match(L[hi])
        s_i=next((q for q,l in enumerate(blk) if l.strip()=='SCRIPT:'), None)
        script=""
        if s_i is not None:
            buf=[]; q=s_i+1
            while q<len(blk) and blk[q].strip()!='' and not blk[q].startswith('MAP SUBJECT:'): buf.append(blk[q].strip()); q+=1
            script=' '.join(buf)
        tc=next((tcre.search(l).group(1) for l in blk if tcre.search(l)), None)
        prompts={}
        for q,l in enumerate(blk):
            pm=prre.match(l)
            if pm:
                txt=pm.group(2).strip()
                if txt.startswith("|") and txt.endswith("|"): txt=""  # |LABEL| marker; real prompt is on the next line
                r=q+1
                while r<len(blk) and not txt and blk[r].strip()=='': r+=1
                if not txt and r<len(blk): txt=blk[r].strip()
                prompts[pm.group(1)]=txt
        links=[(lm.group(1),lm.group(2)) for l in blk for lm in [linkre.match(l)] if lm]
        out.append({'num':int(m.group(1)),'type':m.group(3).strip(),'script':script,
                    'tc':tc,'prompts':prompts,'links':links})
    return out

orig_p=glob.glob(f"{OUT}/*_breakdown_original.txt")
cur_p=[p for p in glob.glob(f"{OUT}/*_breakdown.txt") if "_original" not in p and "special" not in os.path.basename(p).lower()]
subj=re.sub(r'(_breakdown.*)?\.txt$','',os.path.basename(cur_p[0])) if cur_p else "package"
dest=f"{OUT}/{subj}_changes.md"
MARK_A="<!-- make_diff:begin -->"; MARK_B="<!-- make_diff:end -->"
def write_changes(block_lines):
    """(r8) Replace only the marked diff block; keep the run's own log verbatim."""
    prev=open(dest,encoding="utf-8",errors="ignore").read() if os.path.exists(dest) else ""
    prev=re.sub(re.escape(MARK_A)+r'.*?'+re.escape(MARK_B)+r'\n?', '', prev, flags=re.S).rstrip()
    block=MARK_A+"\n"+'\n'.join(block_lines).rstrip('\n')+"\n"+MARK_B+"\n"
    open(dest,"w",encoding="utf-8").write((prev+"\n\n"+block) if prev else block)
    return bool(prev)

if not orig_p or not cur_p:
    kept=write_changes([f"# Changes — {subj}","","No original snapshot found, so no diff could be produced."])
    print(f"Changes: {dest} (no original to compare"+("; run log carried over)" if kept else ")")); sys.exit(0)

O=parse(max(orig_p,key=os.path.getmtime)); C=parse(max(cur_p,key=os.path.getmtime))
obys={norm(s['script']):s for s in O}
rows=[]; comp=[]; used=set()
for c in C:
    key=norm(c['script']); o=obys.get(key)
    if o is None:
        comp.append(f"S{c['num']} {c['type']}: new/re-composed section text"); continue
    used.add(key); diffs=[]
    if (o['tc'] or "")!=(c['tc'] or ""):
        diffs.append(("TIMECODE", o['tc'] or "—", c['tc'] or "—"))
    for k in ("1","2","3"):
        if o['prompts'].get(k,"")!=c['prompts'].get(k,""):
            diffs.append((f"PROMPT {k}", o['prompts'].get(k,"—"), c['prompts'].get(k,"—")))
    od=dict(o['links']); cd=dict(c['links'])
    for lab in sorted(set(od)|set(cd)):
        if od.get(lab)!=cd.get(lab):
            diffs.append((lab, od.get(lab,"(none)"), cd.get(lab,"(removed)")))
    if diffs: rows.append((c,diffs))
for o in O:
    if norm(o['script']) not in used: comp.append(f"(original S{o['num']} {o['type']}: text changed or removed)")

out=[f"# Changes — {subj}","",
     f"**{sum(len(d) for _,d in rows)} field change(s) across {len(rows)} section(s)**"+
     (f" · **{len(comp)} composition change(s)**" if comp else ""),""]
if not rows and not comp:
    out.append("No changes — the reviewed breakdown is identical to the original.")
for c,diffs in rows:
    out.append(f"## S{c['num']} — {c['type']}")
    for field,old,new in diffs:
        out.append(f"- **{field}**")
        out.append(f"  - old: {old}")
        out.append(f"  - new: {new}")
    out.append("")
if comp:
    out+=["## Composition changes (timing pass)"]+[f"- {x}" for x in comp]
kept=write_changes(out)
print(f"Changes: {dest}"+("  (run log carried over; diff block replaced)" if kept else ""))
print(f"  {sum(len(d) for _,d in rows)} field change(s) in {len(rows)} section(s); {len(comp)} composition change(s)")
~~~~

### FILE: make_download_links.py

~~~~
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
~~~~

### FILE: make_link_resolver.py

~~~~
#!/usr/bin/env python3
"""
MAKE LINK RESOLVER — RUNG 3 of the WIKIMEDIA ACCESS LADDER.

Reads the FULL breakdown, collects every REF / MAP / CHAR / HOOK image link's
File: title (VIDEO LINKs are skipped; both File-page and upload URLs are
understood), and writes [Subject]_link_resolver.html. The user opens that page
in any browser and clicks once; the page queries the live Commons imageinfo API
(origin=*, chunks of 15 titles) for each file's canonical download URL, marks
each link EXISTS or NOT FOUND, and downloads [Subject]_resolved_links.json.
Upload that JSON back: every url in it came verbatim from the API, and it must
still pass the /x/xy/ = md5(filename) gate before being written anywhere.

Optional argv[1] = the working folder.
"""
import re, glob, os, sys, json
from urllib.parse import unquote

OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs")
hdr=re.compile(r'^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$')
linkre=re.compile(r'^\s*(VIDEO LINK|REF/MAP LINK \d+|ALT LINK \d+|LINK|REFERENCE)\s*:\s*(\S+)')

def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p,encoding="utf-8",errors="ignore").read()))
    except Exception: return 0
def is_special(p):
    try: return "SPECIAL" in open(p,encoding="utf-8",errors="ignore").read(1500).upper().replace("SPECIAL:FILEPATH","")
    except Exception: return False

cands=[p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and not is_special(p)
       and "special" not in os.path.basename(p).lower()
       and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
if not cands: sys.exit("No FULL breakdown found in the folder.")
FULL=max(cands,key=is_breakdown); subj=re.sub(r'(_breakdown)?.txt$','',os.path.basename(FULL))
L=open(FULL,encoding="utf-8").read().split('\n'); heads=[i for i,l in enumerate(L) if hdr.match(l)]

def title_of(u):
    m=re.search(r'/wiki/(File:[^?#]+)', u)
    if m: return unquote(m.group(1))
    m=re.search(r'/wikipedia/commons/(?:thumb/)?[0-9a-f]/[0-9a-f]{2}/([^/?#]+)', u)
    if m: return "File:"+unquote(m.group(1))
    return None

entries=[]
for k,hi in enumerate(heads):
    end=heads[k+1] if k+1<len(heads) else len(L); m=hdr.match(L[hi])
    for j in range(hi+1,end):
        lm=linkre.match(L[j])
        if not lm or lm.group(1)=="VIDEO LINK": continue
        t=title_of(lm.group(2))
        if t: entries.append({"section":int(m.group(1)),"label":lm.group(1),"title":t})
if not entries: sys.exit("No Wikimedia image links found to resolve.")

HTML="""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>__SUBJ__ - Wikimedia link resolver</title>
<style>
 body{font-family:Georgia,serif;max-width:960px;margin:2rem auto;padding:0 1rem;color:#222;background:#faf8f4}
 h1{font-size:1.2rem} p{line-height:1.45}
 button{font-size:1rem;padding:.5rem 1rem;cursor:pointer;background:#2d5a3d;color:#fff;border:0;border-radius:4px}
 button:disabled{background:#999}
 table{border-collapse:collapse;width:100%;margin-top:1rem;font-size:.8rem;font-family:system-ui,sans-serif}
 th,td{border:1px solid #ccc;padding:.3rem .45rem;text-align:left;vertical-align:top;word-break:break-all}
 th{background:#eee} .ok{color:#1a7a1a;font-weight:bold}.miss{color:#b00020;font-weight:bold}
 textarea{width:100%;height:8rem;margin-top:1rem;font-family:monospace;font-size:.72rem}
 #dl{margin-left:.6rem;display:none}
 .note{background:#fff6dc;border:1px solid #e5d28a;padding:.55rem .75rem;border-radius:4px;font-size:.88rem}
</style></head><body>
<h1>__SUBJ__ - resolve Wikimedia download URLs</h1>
<p class="note">This page asks the <b>live Wikimedia Commons API</b> for the canonical
<code>upload.wikimedia.org</code> download URL of every image link in the breakdown
(<code>action=query&nbsp;prop=imageinfo&nbsp;iiprop=url|mime|size</code>). Nothing is guessed
or constructed. When it finishes, download the JSON and upload it back into the chat.</p>
<p><button id="go">Resolve all __N__ links</button>
<a id="dl" download="__SUBJ___resolved_links.json"><button type="button">Download JSON</button></a>
<span id="prog"></span></p>
<table id="tbl"><thead><tr><th>#</th><th>Sec</th><th>Label</th><th>File title</th><th>Status</th><th>Canonical download URL (from API)</th></tr></thead><tbody></tbody></table>
<h3>Result JSON (also downloadable above)</h3>
<textarea id="out" readonly placeholder="Run the resolver first."></textarea>
<script>
const ENTRIES=__ENTRIES__;
const API="https://commons.wikimedia.org/w/api.php";
const tbody=document.querySelector("#tbl tbody"),out=document.getElementById("out"),
      prog=document.getElementById("prog"),dl=document.getElementById("dl");
ENTRIES.forEach((e,i)=>{const tr=document.createElement("tr");
 tr.innerHTML="<td>"+(i+1)+"</td><td>S"+e.section+"</td><td>"+e.label+"</td><td>"+
  e.title.replace(/^File:/,"")+"</td><td id='st"+i+"'>-</td><td id='u"+i+"'></td>";
 tbody.appendChild(tr);});
function chunks(a,n){const o=[];for(let i=0;i<a.length;i+=n)o.push(a.slice(i,i+n));return o;}
document.getElementById("go").onclick=async()=>{
 const btn=document.getElementById("go");btn.disabled=true;prog.textContent=" querying Commons...";
 const results=ENTRIES.map(e=>({...e,url:null,mime:null,missing:true}));
 try{
  for(const grp of chunks([...results.keys()],15)){
   const titles=grp.map(i=>results[i].title).join("|");
   const q=API+"?action=query&format=json&origin=*&prop=imageinfo&iiprop=url%7Cmime%7Csize&titles="
          +encodeURIComponent(titles);
   const data=await (await fetch(q)).json();
   const norm={};(data.query.normalized||[]).forEach(n=>norm[n.to]=n.from);
   const byAsked={};
   Object.values(data.query.pages).forEach(pg=>{const a=(norm[pg.title]||pg.title);
    byAsked[a]=pg;byAsked[a.replace(/ /g,"_")]=pg;});
   for(const i of grp){
    const e=results[i];const pg=byAsked[e.title]||byAsked[e.title.replace(/_/g," ")];
    const st=document.getElementById("st"+i),u=document.getElementById("u"+i);
    if(pg&&!("missing" in pg)&&pg.imageinfo&&pg.imageinfo[0]&&pg.imageinfo[0].url){
     e.url=pg.imageinfo[0].url;e.mime=pg.imageinfo[0].mime||null;e.missing=false;
     st.innerHTML='<span class="ok">EXISTS</span>';u.textContent=e.url;
    }else{st.innerHTML='<span class="miss">NOT FOUND</span>';u.textContent="(no such file on Commons)";}
   }
  }
  const payload={generated_by:"__SUBJ___link_resolver.html",
   api:"commons.wikimedia.org imageinfo url|mime|size",
   generated_at:new Date().toISOString(),links:results};
  const txt=JSON.stringify(payload,null,1);out.value=txt;
  dl.href=URL.createObjectURL(new Blob([txt],{type:"application/json"}));dl.style.display="inline";
  const miss=results.filter(r=>r.missing).length;
  prog.textContent=" done - "+(results.length-miss)+" resolved, "+miss+" not found.";
 }catch(err){prog.textContent=" ERROR: "+err+" - check your connection and try again.";btn.disabled=false;}
};
</script></body></html>
"""
html=(HTML.replace("__ENTRIES__", json.dumps(entries, ensure_ascii=False))
          .replace("__SUBJ__", subj).replace("__N__", str(len(entries))))
dest=f"{OUT}/{subj}_link_resolver.html"
open(dest,"w",encoding="utf-8").write(html)
print(f"Link resolver: {dest}")
print(f"  image links embedded: {len(entries)}")
print("  Hand this file to the user; ask them to open it, click Resolve, and upload")
print(f"  the downloaded {subj}_resolved_links.json back into the chat.")
~~~~

### FILE: make_manifest.py

~~~~
#!/usr/bin/env python3
"""
MAKE MANIFEST — write [Subject]_manifest.json describing the whole package.

A small self-describing handoff file so the Review tool (or a human) can pick the
package up without re-asking: it records the subject, channel and locked STYLE
SUFFIX, the section count, whether timing is EXACT (an ASR .srt was present) or
APPROXIMATE, the audio file with its duration and SHA-256, the resolved per-channel
rules (length caps + any tail rule, so the reviewer can enforce them without the
suffixes file), and every output file with its size and hash. If a *_changes.md is
present it marks the package as reviewed.

Optional argv[1] = the working folder.
"""
import re, glob, os, sys, json, hashlib, subprocess, datetime

OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs")
def sha(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for c in iter(lambda:f.read(65536),b""): h.update(c)
    return h.hexdigest()[:16]
def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p,encoding="utf-8",errors="ignore").read()))
    except Exception: return 0
def is_special(p):
    try: return "SPECIAL" in open(p,encoding="utf-8",errors="ignore").read(1500).upper().replace("SPECIAL:FILEPATH","")
    except Exception: return False

# ---- per-channel rule resolver (suffixes file overrides; FALLEN CIVILIZATION fallback) ----
def find_suffix_list(folder):
    here=os.path.dirname(os.path.abspath(__file__))
    for d in (folder,"/mnt/user-data/uploads",here,os.getcwd()):
        for p in glob.glob(f"{d}/*Channel_Prompt_Suffixes*.txt")+glob.glob(f"{d}/*hannel*uffix*.txt"):
            return p
    return None
def parse_overrides(path):
    raw=open(path,encoding="utf-8-sig",errors="ignore").read().replace('\r\n','\n').replace('\r','\n')
    lines=raw.split('\n'); res={}; i=0
    while i<len(lines):
        if lines[i].startswith("CHANNELS:"):
            tags=re.findall(r'\[([^\]]+)\]', lines[i]); ov={}; j=i+1
            while j<len(lines) and not lines[j].startswith("CHANNELS:") and set(lines[j].strip())!={'-'}:
                mm=re.match(r'\s*(MAX_SECTION_S|TAIL_AFTER_MIN|TAIL_MAX_S|TAIL_TYPE|AI_TARGET_S|AI_TOL_S|AI_MAX_S|AI_PROMPTS|ALT_PROMPTS)\s*:\s*(.+?)\s*$', lines[j])
                if mm: k=mm.group(1); ov[k]=(mm.group(2).strip().upper() if k=="TAIL_TYPE" else int(mm.group(2)))
                j+=1
            if ov:
                for t in tags: res[t.strip().upper()]=ov
            i=j
        else: i+=1
    return res
def channel_rules(channel, folder):
    caps={'MAX_SECTION_S':30,'TAIL_AFTER_MIN':None,'TAIL_MAX_S':None,'TAIL_TYPE':'AI','AI_TARGET_S':None,'AI_TOL_S':2,'AI_MAX_S':None,'AI_PROMPTS':1,'ALT_PROMPTS':1}   # (r13) AI_* = per-channel AI-section rules; (r15) ONE prompt per section everywhere by default
    key=(channel or "").strip().strip("[]").upper()
    if key=="FALLEN CIVILIZATION": caps.update({'TAIL_AFTER_MIN':30,'TAIL_MAX_S':90,'TAIL_TYPE':'AI'})
    sp=find_suffix_list(folder)
    if sp:
        ov=parse_overrides(sp).get(key)
        if ov:
            for k,v in ov.items(): caps[k]=v
    return caps

cands=[p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and not is_special(p)
       and "special" not in os.path.basename(p).lower()
       and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
if not cands: sys.exit("No FULL breakdown found in the folder.")
FULL=max(cands,key=is_breakdown); subj=re.sub(r'(_breakdown)?.txt$','',os.path.basename(FULL))
head=open(FULL,encoding="utf-8").read(4000)
channel=(re.search(r'(?im)^\s*CHANNEL:\s*(.+?)\s*$', head) or [None,None])
channel=channel.group(1).strip() if hasattr(channel,'group') else None
suffix=(re.search(r'(?im)^\s*STYLE SUFFIX:\s*"(.+?)"\s*$', head))
suffix=suffix.group(1).strip() if suffix else None
nsec=is_breakdown(FULL)

mp3s=glob.glob(f"{OUT}/*.mp3"); MP3=max(mp3s,key=os.path.getsize) if mp3s else None
dur=None
if MP3:
    r=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1",MP3],capture_output=True,text=True)
    try: dur=round(float(r.stdout.strip()),2)
    except Exception: dur=None
srts=[s for s in glob.glob(f"{OUT}/*.srt") if not any(k in os.path.basename(s) for k in
      ("_timestamp_guidelines","_word_level","_sections_no_AI","_full_arranged"))]
SRT=max(srts,key=os.path.getsize) if srts else None

# (R1) timing_mode comes from the breakdown HEADER (the run's own declaration),
# not from file presence — a stray/mismatched .srt can no longer relabel a run.
_tm=re.search(r'(?im)^\s*SECTION TIMECODES:\s*(EXACT|APPROXIMATE)', head)
TIMING_MODE=_tm.group(1).upper() if _tm else ("EXACT" if SRT else "APPROXIMATE")
warnings=[]
if not _tm: warnings.append("breakdown header has no SECTION TIMECODES line; timing_mode inferred from file presence")
if not MP3: warnings.append("no .mp3 in the project folder — audio block is empty; the reviewer cannot verify the voiceover against this manifest")

# (R6) record the suffix file's PROMPT-SET REVISION so builder/reviewer runs are comparable
def _suffix_revision(folder):
    p=find_suffix_list(folder)
    if not p: return None
    try:
        mm=re.search(r'PROMPT-SET REVISION\s+(\S+)', open(p,encoding="utf-8-sig",errors="ignore").read())
        return mm.group(1) if mm else None
    except Exception: return None
PROMPT_REV=_suffix_revision(OUT)

files=[]
for p in sorted(glob.glob(f"{OUT}/*")):
    if os.path.isfile(p) and not p.endswith("_manifest.json"):
        files.append({"name":os.path.basename(p),"bytes":os.path.getsize(p),"sha256_16":sha(p)})

man={
 "subject":subj,
 "channel":channel,
 "style_suffix":suffix,
 "sections":nsec,
 "timing_mode":TIMING_MODE,
 "prompt_set_revision":PROMPT_REV,
 "warnings":warnings,
 "audio":{"name":os.path.basename(MP3) if MP3 else None,"duration_s":dur,
          "sha256_16":sha(MP3) if MP3 else None},
 "transcript":os.path.basename(SRT) if SRT else None,
 "channel_rules":channel_rules(channel, OUT),
 "reviewed":bool(glob.glob(f"{OUT}/*_changes.md")),
 "generated_at":datetime.datetime.now().isoformat(timespec="seconds"),
 "files":files,
}
dest=f"{OUT}/{subj}_manifest.json"; open(dest,"w",encoding="utf-8").write(json.dumps(man,indent=2,ensure_ascii=False)+"\n")
for w in warnings: print(f"[warn] {w}")
print(f"Manifest: {dest}")
print(f"  {subj} | channel {channel} | {nsec} sections | {man['timing_mode']} | "
      f"{len(files)} files | reviewed={man['reviewed']}")
print(f"  rules: max {man['channel_rules']['MAX_SECTION_S']}s"+
      (f", tail {man['channel_rules']['TAIL_TYPE']} after {man['channel_rules']['TAIL_AFTER_MIN']}min up to {man['channel_rules']['TAIL_MAX_S']}s"
       if man['channel_rules']['TAIL_AFTER_MIN'] else ", no tail rule"))
~~~~

### FILE: make_special.py

~~~~
#!/usr/bin/env python3
"""
MAKE SPECIAL — derive the SPECIAL (CLEAN) breakdown straight from the FULL one.

Reads the FULL breakdown, copies every HOOK / REF / MAP / CHAR section block
BYTE-IDENTICALLY (keeping its stamped TIMECODE), drops every AI section, and
writes [Subject]_special_breakdown.txt with a regenerated SECTION SUMMARY COUNT
block and a SECTION ORDER block (running order, original section numbers). This
guarantees the SPECIAL is AI-free and matches the FULL sections exactly, with no
hand-copying. Run it AFTER PHASE 7B (so the TIMECODES are filled in).

Optional argv[1] = the single working folder for both inputs and outputs.
"""
import re, glob, os, sys

OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs")

def is_breakdown(p):
    try: t=open(p,encoding="utf-8",errors="ignore").read()
    except Exception: return 0
    return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', t))
def header_is_special(p):
    try: t=open(p,encoding="utf-8",errors="ignore").read(2000).upper()
    except Exception: return False
    return "SPECIAL" in t.replace("SPECIAL:FILEPATH","")

cands=[p for p in glob.glob(f"{OUT}/*.txt")
       if is_breakdown(p) and not header_is_special(p)
       and "special" not in os.path.basename(p).lower()
       and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
if not cands: sys.exit("No FULL breakdown (.txt with SECTION headers) found in the folder.")
FULL=max(cands,key=is_breakdown)
lines=open(FULL,encoding="utf-8").read().split('\n')

def base_type(t): return t.split()[0].upper()
hdr=re.compile(r'^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$')
is_div=lambda s: len(s)>=20 and set(s)=={'-'}
is_ban=lambda s: len(s)>=20 and set(s)=={'='}

# --- carry header facts from the FULL file ---
def hdr_val(label):
    for ln in lines[:40]:
        m=re.match(rf'^\s*{label}:\s*(.*?)\s*$', ln)
        if m: return m.group(1)
    return None
ban_idx=[i for i,l in enumerate(lines) if is_ban(l)]
title=lines[ban_idx[0]+1] if ban_idx and ban_idx[0]+1<len(lines) else "HISTORY MAPS CHANNELS — [VIDEO TITLE]"
suffix=hdr_val("STYLE SUFFIX")            # may be None
if suffix is not None: suffix=suffix.strip().strip('"').strip()   # (B2) hdr_val captures the quotes; strip so we don't double them
channel=hdr_val("CHANNEL")                # may be None
content=hdr_val("CONTENT TREATMENT")      # may be None
tc_note=hdr_val("SECTION TIMECODES")      # may be None

# --- locate section header lines and their byte-identical block ranges ---
heads=[i for i,l in enumerate(lines) if hdr.match(l)]
if not heads: sys.exit("No sections parsed from the FULL breakdown.")
def block_start(hi): return hi-1 if hi-1>=0 and is_div(lines[hi-1].strip()) else hi
starts=[block_start(hi) for hi in heads]
# end of the last section = the trailing summary banner (first '=' divider after it)
tail=len(lines)
for i in range(heads[-1]+1, len(lines)):
    if is_ban(lines[i].strip()): tail=i; break
bounds=[(starts[k], starts[k+1] if k+1<len(starts) else tail) for k in range(len(starts))]

def script_first_words(a,b,k=6):
    for i in range(a,b):
        if lines[i].strip().upper()=='SCRIPT:':
            for j in range(i+1,b):
                if lines[j].strip(): return ' '.join(lines[j].split()[:k])
            break
    return ""

kept=[]   # (num, type_label, block_lines, first_words)
counts={"HOOK":0,"CHAR":0,"MAP":0,"REF":0}
for (a,b),hi in zip(bounds,heads):
    m=hdr.match(lines[hi]); num=int(m.group(1)); typ=m.group(3).strip()
    if base_type(typ)=="AI": continue
    blk=lines[a:b]
    while blk and blk[-1].strip()=='': blk.pop()   # trim trailing blanks; we re-add one
    kept.append((num,typ,blk,script_first_words(a,b)))
    if base_type(typ) in counts: counts[base_type(typ)]+=1
if not kept: sys.exit("No non-AI sections to put in the SPECIAL breakdown.")

K=len(kept); Ntot=len(heads); D="="*40
out=[D, title, "SPECIAL (CLEAN) BREAKDOWN — PAUSE-ALIGNED TIMING", D,
     f"SECTIONS IN THIS SPECIAL BREAKDOWN: {K} (of {Ntot} total).",
     "Included: every HOOK / REF / MAP / CHAR section. AI sections are excluded."]
if channel is not None: out.append(f"CHANNEL: {channel}")
out.append("SECTION TIMECODES: same EXACT/APPROXIMATE values as the full breakdown (carried verbatim).")
if suffix is not None: out.append(f'STYLE SUFFIX: "{suffix}"')
if content: out.append(f"CONTENT TREATMENT: {content}")
out.append("REMINDER: Spot-check every link before editing.")
out.append(D); out.append("")
for _,_,blk,_ in kept:
    out += blk + [""]
# SECTION SUMMARY COUNT
out += [D, "SECTION SUMMARY COUNT", D,
        f"TOTAL SECTIONS IN SPECIAL BREAKDOWN: {K} (of {Ntot} total)",
        f"HOOK: {counts['HOOK']}", f"CHAR: {counts['CHAR']}",
        f"MAP: {counts['MAP']}", f"REF: {counts['REF']}", ""]
# SECTION ORDER (running order, original numbers)
out += [D, "SECTION ORDER", D,
        f"The {K} non-AI sections included in this breakdown, in running order "
        f"(AI sections are not included). Numbers are the original full-breakdown section numbers:"]
for i,(num,typ,_,fw) in enumerate(kept,1):
    out.append(f'  {i}. SECTION {num:>2} | {typ:<8} | "{fw}..."')

base=re.sub(r'(_breakdown)?\.txt$','',os.path.basename(FULL))
dest=f"{OUT}/{base}_special_breakdown.txt"
open(dest,"w",encoding="utf-8").write('\n'.join(out).rstrip()+'\n')

dropped=Ntot-K
print(f"FULL breakdown: {os.path.basename(FULL)}  ({Ntot} sections)")
print(f"SPECIAL kept {K} non-AI sections, dropped {dropped} AI section(s).")
print("Section order: "+" -> ".join(f"{n} {t}" for n,t,_,_ in kept))
print(f"SPECIAL breakdown: {dest}")
~~~~

### FILE: make_zip.py

~~~~
#!/usr/bin/env python3
"""
MAKE ZIP — (Q2) zip the whole project folder into [Subject]_package.zip, the
one-file handoff from the builder to the Review tool (or to an editor).

Included: everything in the folder.
Excluded: the .mp3 (attach it alongside — it's usually too big to re-zip and the
manifest's SHA-256 lets the reviewer verify the copy they receive), any previous
*_package.zip, and the .selftest/ scratch folder.
(r16) The animation bundle *_allanimations.json and *_ai_prompts.txt are INSIDE the
package now: the package is the ONE deliverable; Ruvi Studio unpacks the bundle into
the title's Maps folder itself.
    --with-audio     include the .mp3 too
Re-run it any time (e.g. after manual link fixes) — it overwrites the zip.

Optional argv[1] = the working folder.
"""
import re, glob, os, sys, zipfile

args=[a for a in sys.argv[1:] if not a.startswith("--")]
OUT=(args[0] if args else "/mnt/user-data/outputs")
WITH_AUDIO=("--with-audio" in sys.argv)

def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p,encoding="utf-8",errors="ignore").read()))
    except Exception: return 0
def is_special(p):
    try: return "SPECIAL" in open(p,encoding="utf-8",errors="ignore").read(1500).upper().replace("SPECIAL:FILEPATH","")
    except Exception: return False

cands=[p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and not is_special(p)
       and "special" not in os.path.basename(p).lower()
       and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
subj=(re.sub(r'(_breakdown)?.txt$','',os.path.basename(max(cands,key=is_breakdown))) if cands
      else os.path.basename(os.path.normpath(OUT)) or "package")

dest=os.path.join(OUT, f"{subj}_package.zip")
skipped=[]; left_out=[]; added=0
with zipfile.ZipFile(dest,"w",zipfile.ZIP_DEFLATED) as z:
    for p in sorted(glob.glob(f"{OUT}/*")):
        name=os.path.basename(p)
        if not os.path.isfile(p): continue
        if name.endswith("_package.zip"): continue
        if name=="Channel_Prompt_Suffixes.txt" or re.search(r'_(meta\.json|plan\.txt|sentences\.tsv|fills\.txt)$', name): continue   # (r18) run inputs / scratch, not deliverables
        if name.endswith("_allmaps.json"):   # the legacy bundle name stays out; (r16) *_allanimations.json is zipped like everything else
            left_out.append(name); continue
        if name.lower().endswith(".mp3") and not WITH_AUDIO:
            skipped.append(name); continue
        z.write(p, name); added+=1

print(f"Package: {dest}")
print(f"  files zipped: {added}" + (f" | audio left out (attach alongside): {', '.join(skipped)}" if skipped else " | audio included")
      + (f" | legacy bundle left out: {', '.join(left_out)}" if left_out else ""))
print(f"  size: {os.path.getsize(dest):,} bytes")
~~~~

### FILE: mapcrop.py

~~~~
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
~~~~

### FILE: preflight.py

~~~~
#!/usr/bin/env python3
"""
PREFLIGHT — fast sanity checks on the inputs BEFORE building anything.

Confirms: the .mp3 opens (and reports its duration); the .srt parses (cue count
+ last cue end); the .srt actually lines up with the .mp3 (the #1 silent killer
of timecodes); and the channel resolves to a suffix in Channel_Prompt_Suffixes.

Usage:  python3 preflight.py /mnt/user-data/outputs/[Subject] ["CHANNEL NAME"]
The channel is optional: if omitted, preflight reads a CHANNEL line from the FULL
breakdown header (when present) or just lists the channels it found. Exits 1 on a
hard problem so a runner can stop early.
"""
import re, glob, os, sys, subprocess

FOLDER=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/uploads")
ARG_CHANNEL=sys.argv[2].strip() if len(sys.argv)>2 else None
UP=FOLDER; OUT=FOLDER

issues=[]; warns=[]
def ok(m):   print(f"[ok]   {m}")
def bad(m):  issues.append(m); print(f"[FAIL] {m}")
def warn(m): warns.append(m);  print(f"[warn] {m}")

# ---------- mp3 ----------
mp3s=glob.glob(f"{UP}/*.mp3"); MP3=max(mp3s,key=os.path.getsize) if mp3s else None
DUR=None
if not MP3:
    # (r8) PACKET MODE: the .mp3 stays on the user's machine by design. With an ASR
    # .srt present the chain still times EXACTLY from the transcript (no silence snap,
    # no audio hash in the manifest) — a WARN, not a stop. Without either it is fatal.
    _asr=[s for s in glob.glob(f"{UP}/*.srt")
          if not any(k in os.path.basename(s) for k in ("_timestamp_guidelines","_word_level","_sections_no_AI"))]
    if _asr: warn("No .mp3 in the folder — packet mode: timing comes from the ASR .srt alone (no silence snap; the manifest carries no audio hash).")
    else:    bad("No .mp3 found in the folder (and no ASR .srt to time from).")
else:
    out=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1",MP3],capture_output=True,text=True)
    try:
        DUR=float(out.stdout.strip())
        ok(f".mp3 opens: {os.path.basename(MP3)} — {DUR:.2f}s")
    except Exception:
        bad(f".mp3 will not open with ffprobe: {os.path.basename(MP3)}")

# ---------- srt ----------
srts=[s for s in glob.glob(f"{UP}/*.srt")
      if "_timestamp_guidelines" not in os.path.basename(s)
      and "_word_level" not in os.path.basename(s)
      and "_sections_no_AI" not in os.path.basename(s)]
SRT=max(srts,key=os.path.getsize) if srts else None
def ts(s):
    h,m,rest=s.split(':'); sec,ms=rest.split(','); return ((int(h)*60+int(m))*60+int(sec))*1000+int(ms)
last_end=None; ncues=0
if not SRT:
    warn("No ASR .srt found — timing will be APPROXIMATE (clearly label it).")
else:
    raw=open(SRT,encoding="utf-8-sig",errors="ignore").read().replace('\r\n','\n').replace('\r','\n')
    cues=[]
    for b in re.split(r'\n\s*\n', raw.strip()):
        L=b.split('\n')
        if len(L)<2: continue
        m=re.match(r'(\d\d:\d\d:\d\d,\d{1,3})\s*-->\s*(\d\d:\d\d:\d\d,\d{1,3})', L[1])
        if m: cues.append((ts(m.group(1)),ts(m.group(2))))
    ncues=len(cues)
    if ncues==0:
        bad(f".srt has no parseable cues: {os.path.basename(SRT)}")
    else:
        last_end=cues[-1][1]/1000.0
        ok(f".srt parses: {os.path.basename(SRT)} — {ncues} cues, last ends {last_end:.2f}s")

# ---------- srt <-> mp3 alignment (the important one) ----------
if DUR and last_end is not None:
    if last_end > DUR*1.05 + 2.0:
        bad(f".srt ends at {last_end:.1f}s but the .mp3 is only {DUR:.1f}s — likely a mismatched pair.")
    elif last_end < DUR*0.5:
        warn(f".srt ends at {last_end:.1f}s, far short of the {DUR:.1f}s .mp3 — check they belong together.")
    else:
        ok(f".srt and .mp3 line up (last cue {last_end:.1f}s vs audio {DUR:.1f}s).")

# ---------- do the .srt and the narration belong together? ----------
import difflib
_src=glob.glob(f"{OUT}/*_source.txt")
if SRT and _src:
    _raw=open(SRT,encoding="utf-8-sig",errors="ignore").read().replace('\r\n','\n').replace('\r','\n')
    _body=[]
    for _b in re.split(r'\n\s*\n', _raw.strip()):
        for _x in _b.split('\n'):
            if '-->' not in _x and not re.match(r'^\s*\d+\s*$', _x): _body.append(_x)
    sw=re.findall(r'[a-z]+', " ".join(_body).lower())
    cw=re.findall(r'[a-z]+', open(max(_src,key=os.path.getmtime),encoding="utf-8",errors="ignore").read().lower())
    if sw and cw:
        r=difflib.SequenceMatcher(None,cw,sw).quick_ratio()
        if r<0.30:   bad(f"the .srt does NOT look like a transcript of this narration (word overlap {r:.2f}) — almost certainly the WRONG .srt for this video.")
        elif r<0.55: warn(f"the .srt may not match this narration (word overlap {r:.2f}) — check they belong together before trusting the timing.")
        else:        ok(f"the .srt matches the narration (word overlap {r:.2f}).")

# ---------- manifest cross-checks: audio hash + prompt-set revision (R2/R6) ----------
import hashlib, json as _json
def _sha16(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for c in iter(lambda:f.read(65536),b""): h.update(c)
    return h.hexdigest()[:16]
def _bundle_rev():
    try: return open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"BUNDLE_VERSION.txt"),encoding="utf-8").read().strip()
    except Exception: return None
_mans=glob.glob(f"{OUT}/*_manifest.json")
_man=None
if _mans:
    try: _man=_json.load(open(max(_mans,key=os.path.getmtime),encoding="utf-8"))
    except Exception: warn("a *_manifest.json is present but could not be parsed.")
if _man and MP3:
    _want=((_man.get("audio") or {}).get("sha256_16"))
    if _want:
        _got=_sha16(MP3)
        if _got==_want: ok(f"the .mp3 matches the manifest's recorded audio hash ({_got}).")
        else: bad(f"the .mp3 does NOT match the manifest's audio hash (got {_got}, manifest says {_want}) — wrong or re-rendered voiceover; STOP and sort the package out.")
    else:
        warn("the manifest carries no audio hash — the builder ran without the .mp3 in the folder; the voiceover cannot be verified against it.")
_brev=_bundle_rev()
if _brev: ok(f"scripts bundle revision: {_brev}")

# ---------- channel -> suffix ----------
def find_suffix_list():
    here=os.path.dirname(os.path.abspath(__file__))
    for d in (FOLDER, "/mnt/user-data/uploads", here, os.getcwd()):
        for p in glob.glob(f"{d}/*Channel_Prompt_Suffixes*.txt")+glob.glob(f"{d}/*hannel*uffix*.txt"):
            return p
    return None
def parse_suffix_list(path):
    # (r18) the SUFFIX line may sit anywhere inside the channel block (DESCRIPTION / AMBIENCE come first since r17)
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from suffixes import parse_suffix_file
        return {k:v["suffix"] for k,v in parse_suffix_file(path).items() if v.get("suffix")}
    except Exception: pass
    raw=open(path,encoding="utf-8-sig").read().replace('\r\n','\n').replace('\r','\n')
    m={}; lines=raw.split('\n'); tags=[]
    for ln in lines:
        if ln.startswith("CHANNELS:"): tags=re.findall(r'\[([^\]]+)\]', ln)
        elif ln.startswith("SUFFIX:"):
            for t in tags: m[t.strip().upper()]=ln[len("SUFFIX:"):].strip()
        elif " = " in ln and ln.strip().startswith("["):
            chans,suf=ln.split(" = ",1)
            for t in re.findall(r'\[([^\]]+)\]', chans): m[t.strip().upper()]=suf.strip()
    return m
def parse_overrides(path):
    raw=open(path,encoding="utf-8-sig").read().replace('\r\n','\n').replace('\r','\n')
    lines=raw.split('\n'); res={}; i=0
    while i<len(lines):
        if lines[i].startswith("CHANNELS:"):
            tags=re.findall(r'\[([^\]]+)\]', lines[i]); ov={}; j=i+1
            while j<len(lines) and not lines[j].startswith("CHANNELS:") and set(lines[j].strip())!={'-'}:
                mm=re.match(r'\s*(MAX_SECTION_S|TAIL_AFTER_MIN|TAIL_MAX_S|TAIL_TYPE|AI_TARGET_S|AI_TOL_S|AI_MAX_S|AI_PROMPTS|ALT_PROMPTS)\s*:\s*(.+?)\s*$', lines[j])
                if mm: ov[mm.group(1)]=mm.group(2).strip()
                j+=1
            if ov:
                for x in tags: res[x.strip().upper()]=ov
            i=j
        else: i+=1
    return res
def header_channel():
    for p in glob.glob(f"{OUT}/*.txt"):
        try: t=open(p,encoding="utf-8",errors="ignore").read(2000)
        except Exception: continue
        mm=re.search(r'(?im)^\s*CHANNEL:\s*(.+?)\s*$', t)
        if mm: return mm.group(1)
    return None
def header_suffix():
    # (B2) prefer the FULL breakdown and strip any (possibly doubled) quotes; a
    # SPECIAL file is only consulted when no FULL breakdown carries the line.
    cands=[]
    for p in glob.glob(f"{OUT}/*.txt"):
        try: t=open(p,encoding="utf-8",errors="ignore").read()
        except Exception: continue
        mm=re.search(r'(?im)^\s*STYLE SUFFIX:\s*(.+?)\s*$', t)
        if not mm: continue
        head=t[:2000].upper().replace("SPECIAL:FILEPATH","")
        is_sp=("SPECIAL" in head) or ("special" in os.path.basename(p).lower())
        cands.append((1 if is_sp else 0, p, mm.group(1).strip().strip('"').strip()))
    if not cands: return None
    cands.sort(key=lambda x:(x[0],x[1]))
    return cands[0][2]

LIST=find_suffix_list()
chan = ARG_CHANNEL or header_channel()
if not LIST:
    warn("Channel_Prompt_Suffixes list not found here — can't resolve the channel (it may live in project knowledge).")
else:
    smap=parse_suffix_list(LIST)
    ok(f"channel list: {os.path.basename(LIST)} — {len(smap)} channels")
    _srev=None
    try:
        _mm=re.search(r'PROMPT-SET REVISION\s+(\S+)', open(LIST,encoding="utf-8-sig",errors="ignore").read())
        _srev=_mm.group(1) if _mm else None
    except Exception: pass
    if _srev: ok(f"suffix-file revision: {_srev}")
    if _srev and _brev and _srev!=_brev:
        warn(f"REVISION MISMATCH: scripts bundle is {_brev} but the suffix file is {_srev} — use the matched set.")
    if _man and _man.get("prompt_set_revision") and _srev and _man["prompt_set_revision"]!=_srev:
        warn(f"REVISION MISMATCH: this package was built with suffixes {_man['prompt_set_revision']} but the local file is {_srev}.")
    if not chan:
        print("      channels available: "+", ".join(sorted(smap)))
        warn("No channel given and no CHANNEL header found — tell me the channel name.")
    else:
        key=chan.strip().strip("[]").upper()
        if key not in smap:
            bad(f'channel "{chan}" is not in the list. Available: '+", ".join(sorted(smap)))
        else:
            ok(f'channel "{chan}" resolves to a suffix.')
            ov=parse_overrides(LIST).get(key)
            if ov:
                bits=[f"{k}={v}" for k,v in ov.items()]
                ok("channel has custom rules: "+", ".join(bits))
            hs=header_suffix()
            if hs is not None and hs.strip()!=smap[key].strip():
                bad(f'the breakdown header STYLE SUFFIX does not match the list suffix for "{chan}".')
            elif hs is not None:
                ok("breakdown header STYLE SUFFIX matches the channel's list suffix.")

print(f"\nPREFLIGHT: {len(issues)} FAIL / {len(warns)} WARN")
sys.exit(1 if issues else 0)
~~~~

### FILE: prompt_lint.py

~~~~
#!/usr/bin/env python3
"""
PROMPT LINT — every prompt in the FULL breakdown must be DETAILED and GROUNDED (Video_Structure.md PHASE 6).

    python3 prompt_lint.py <folder> [--min 90] [--alt-min 60] [--char-min 45]

FAIL  · an AI PROMPT 1 under --min words before the suffix (default 90; PROMPT_MIN_WORDS in the channel block
        overrides), an -ALTERNATIVE- prompt under --alt-min (60; ALT_MIN_WORDS), a CHAR portrait base under
        --char-min (45)
      · the channel STYLE SUFFIX missing or not the LAST sentence of the prompt (verbatim)
      · a leftover placeholder ([FILL], [REWRITE…], TODO, …) · two prompts with the same text
      · a prompt that mentions people but names NO period dress term (the user's rule: every person is
        described — what they wear in that time, their features, where they stand)
WARN  · a prompt with people but no PLACEMENT cue (foreground/background/left/right/centre/beside…)
      · no LIGHT / TIME cue (dawn, dusk, noon, night, lamplight, overcast, moonlight…)
      · no SETTING cue (deck, harbour, street, room, forest, shore…) · symbolic / abstract wording
      · a real person's name inside an AI prompt (figures are generic — the name lives in the narration)
Writes .selftest/prompt_lint.md. Exit 1 on any FAIL.
"""
import os, re, sys, glob, argparse

ap = argparse.ArgumentParser(); ap.add_argument("folder"); ap.add_argument("--min", type=int, default=None); ap.add_argument("--alt-min", type=int, default=None); ap.add_argument("--char-min", type=int, default=45); a = ap.parse_args()
F = a.folder
def is_bd(p):
    try: return len(re.findall(r"(?m)^SECTION\s+\d+\s*\|", open(p, encoding="utf-8", errors="ignore").read()))
    except Exception: return 0
cands = [p for p in glob.glob(os.path.join(F, "*.txt")) if is_bd(p) and not re.search(r"special|_original|auto_video", os.path.basename(p), re.I)]
if not cands: sys.exit("no FULL breakdown")
FULL = max(cands, key=is_bd); SUBJ = re.sub(r"(_breakdown)?\.txt$", "", os.path.basename(FULL)); text = open(FULL, encoding="utf-8").read()
msuf = re.search(r'(?m)^STYLE SUFFIX:\s*"(.+)"\s*$', text); SUF = msuf.group(1).strip() if msuf else ""
if not SUF: sys.exit("no STYLE SUFFIX in the header")
rules = {}
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from suffixes import parse_suffix_file, find_suffix_file, rules_for
    sp = find_suffix_file(F, os.path.join(F, ".packet"))
    mch = re.search(r"(?m)^CHANNEL:\s*(.+?)\s*$", text)
    if sp and mch:
        blk = parse_suffix_file(sp).get(mch.group(1).strip().strip("[]").upper())
        if blk: rules = rules_for(blk)
except Exception: pass
MIN = a.min or int(rules.get("PROMPT_MIN_WORDS", 90)); AMIN = a.alt_min or int(rules.get("ALT_MIN_WORDS", 60)); CMIN = a.char_min

HDR = re.compile(r"^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$")
PEOPLE = re.compile(r"\b(man|men|woman|women|sailor|sailors|crew|crewmen|pirate|pirates|captain|soldier|soldiers|officer|officers|figure|figures|people|boy|girl|child|children|merchant|merchants|governor|planter|witness|witnesses|crowd|villagers?|workers?|guards?|priest|monk|nun|king|queen|explorer|explorers|hunter|hunters|trader|traders|rider|riders|farmer|farmers|he|she|they|silhouettes?|person|persons)\b", re.I)
DRESS = re.compile(r"\b(coat|coats|frock|waistcoat|breeches|trousers|shirt|shirts|linen|wool|woollen|leather|tricorn|tricorne|hat|hats|cap|caps|bonnet|boots?|shoes?|buckled|stockings|cloak|cloaks|cape|uniform|uniforms|tunic|doublet|jerkin|sash|kerchief|headscarf|bandana|scarf|apron|gown|dress|skirt|petticoat|corset|bodice|fur|furs|parka|hood|hooded|mittens|gloves|cravat|neckcloth|wig|periwig|robe|robes|habit|armou?r|helmet|cuirass|braid|epaulettes?|buttons|belt|belted|cassock|toga|loincloth|moccasins?|sandals?|vest|jacket|jackets|overcoat|greatcoat|shawl|veil|turban|kaftan|smock|collar|lace|ruff)\b", re.I)
PLACE = re.compile(r"\b(foreground|background|midground|middle ground|left|right|centre|center|beside|behind|in front|ahead|at the (?:bow|stern|rail|helm|edge|far end)|to the (?:left|right)|across|along|facing|turned|silhouetted|framed|leaning|kneeling|standing|seated|sitting|crouch|walking|climbing)\b", re.I)
LIGHT = re.compile(r"\b(dawn|sunrise|morning|noon|midday|afternoon|dusk|sunset|evening|night|midnight|moonlight|moonlit|starlight|lamplight|candlelight|candle|lantern|lanterns|torchlight|firelight|overcast|grey light|gray light|storm light|sunlight|sun|shadow|shadows|haze|fog|mist|rain|golden hour|twilight|backlit|low light|glow)\b", re.I)
SETTING = re.compile(r"\b(deck|quarterdeck|hold|cabin|rigging|harbou?r|wharf|quay|dock|beach|shore|cove|reef|bay|sea|ocean|island|jungle|forest|village|town|street|square|market|tavern|inn|church|fort|fortress|wall|walls|gate|courtyard|hall|room|chamber|cell|courtroom|gallows point|road|trail|mountain|valley|river|lake|camp|tent|cove|plantation|field|fields|cliff|cave|ruins?|palace|castle|cathedral|archive|library|ice|snow|tundra|desert|prairie)\b", re.I)
SYMBOLIC = re.compile(r"\b(vortex|tendrils? of|echoes of|shadow of (?:empire|fate|history)|destiny|swirling|ethereal|otherworldly|surreal|cosmic|mystical energy|glowing runes|floating|impossible)\b", re.I)
PLACEHOLDER = re.compile(r"\[(FILL|REWRITE|TODO|TBD)|\bTODO\b|\bTBD\b|lorem ipsum", re.I)
fails, warns, rows, seen = [], [], [], {}
lines = text.split("\n"); heads = [i for i, l in enumerate(lines) if HDR.match(l)]
char_names = re.findall(r"(?m)^CHARACTER INTRODUCTION:\s*(.+?)\s*$", text)
for k, hi in enumerate(heads):
    end = heads[k + 1] if k + 1 < len(heads) else len(lines); blk = lines[hi:end]; m = HDR.match(lines[hi]); num = int(m.group(1)); ty = m.group(3).split()[0].upper(); tag = f"S{num} {m.group(3).strip()}"
    pi = next((i for i, l in enumerate(blk) if re.match(r"^\s*PROMPT 1:", l)), None)
    if pi is None: fails.append(f"{tag}: no PROMPT 1"); continue
    body = []
    for l in blk[pi + 1:]:
        if not l.strip(): break
        body.append(l.strip())
    p = " ".join(body)
    if PLACEHOLDER.search(p): fails.append(f"{tag}: placeholder left in the prompt")
    if not p.lower().endswith(SUF.lower()): fails.append(f"{tag}: the STYLE SUFFIX is not the verbatim last sentence")
    base = p[:len(p) - len(SUF)].rstrip(" .") if p.lower().endswith(SUF.lower()) else p
    if ty == "CHAR": base = re.sub(r"(?i)^medium-shot portrait, solid black background, subject centered and looking toward the viewer:\s*", "", base)
    n = len(re.findall(r"[A-Za-z0-9'’]+", base)); floor = MIN if ty == "AI" else (CMIN if ty == "CHAR" else AMIN)
    if n < floor: fails.append(f"{tag}: prompt has {n} words before the suffix (floor {floor}) — describe the people, their period dress and features, the surroundings and where each person stands")
    key = re.sub(r"\W+", " ", base.lower()).strip()
    if key in seen: fails.append(f"{tag}: duplicate of {seen[key]}'s prompt")
    seen.setdefault(key, tag)
    has_people = bool(PEOPLE.search(base))
    if has_people and not DRESS.search(base): fails.append(f"{tag}: people appear but no period dress is described (coat, breeches, tricorn, linen shirt, boots, headscarf…)")
    if has_people and not PLACE.search(base): warns.append(f"{tag}: no placement cue for the people (foreground / background / left / right / beside / behind)")
    if ty != "CHAR" and not LIGHT.search(base): warns.append(f"{tag}: no light / time-of-day cue")
    if ty != "CHAR" and not SETTING.search(base): warns.append(f"{tag}: no concrete setting word")
    if SYMBOLIC.search(base): warns.append(f"{tag}: symbolic / abstract wording — show the literal thing being narrated")
    for nm in char_names:
        sn = nm.split()[-1]
        if ty == "AI" and len(sn) > 3 and re.search(r"\b" + re.escape(sn) + r"\b", base): warns.append(f"{tag}: names {nm} inside an AI prompt — figures stay generic (describe the type, not the person)")
    rows.append(f"| {tag} | {n} | {'ok' if n >= floor else 'SHORT'} | {'yes' if has_people else '-'} | {'yes' if DRESS.search(base) else ('-' if not has_people else 'NO')} |")
os.makedirs(os.path.join(F, ".selftest"), exist_ok=True)
rep = [f"# prompt_lint — {SUBJ}", "", f"**{len(fails)} FAIL · {len(warns)} WARN** · floors: AI {MIN} · alternative {AMIN} · CHAR base {CMIN} words", "", "| section | words | floor | people | dress |", "|---|---|---|---|---|"] + rows + [""] + [f"- ❌ {x}" for x in fails] + [f"- ⚠️ {x}" for x in warns]
open(os.path.join(F, ".selftest", "prompt_lint.md"), "w", encoding="utf-8").write("\n".join(rep) + "\n")
for x in fails: print("[FAIL] " + x)
for x in warns: print("[warn] " + x)
print(f"PROMPT LINT: {len(fails)} FAIL / {len(warns)} WARN · {len(rows)} prompt(s) · floors AI {MIN} / alt {AMIN} / CHAR {CMIN} words")
sys.exit(1 if fails else 0)
~~~~

### FILE: propose_sections.py

~~~~
#!/usr/bin/env python3
"""
PROPOSE SECTIONS — the pause-aligned walk (Video_Structure.md PHASE 2), done by the machine.

    python3 propose_sections.py <folder> [--target 20 --tol 2 --max 25 --min-tail 12]

Reads <Subject>_source.txt and the word timings (<Subject>_words.json, else <Subject>.srt), splits the
narration into sentences (abbreviation / initial / decimal guards), aligns every sentence to the spoken
words, measures the PAUSE after each sentence, and walks forward closing each section on the LARGEST
pause inside the 18–22 s band (never past the 25 s ceiling; a final tail < 12 s merges back).
Writes
  <Subject>_sentences.tsv   idx · start · end · pause_after · words · text   (the reference table)
  <Subject>_plan.txt        one line per section: S## | sentences a-b | TYPE | window | words | opening
and prints the plan. You then EDIT the plan — set TYPE per section (HOOK/AI/MAP/REF/CHAR), merge or move
a boundary by changing the sentence ranges (a HOOK/MAP/REF/CHAR may run to 30 s) — and fill the THEME
lines. build_breakdown.py turns the plan into the FULL breakdown.
"""
import os, re, sys, json, glob, difflib, argparse

ap = argparse.ArgumentParser()
ap.add_argument("folder"); ap.add_argument("--target", type=float, default=None); ap.add_argument("--tol", type=float, default=None)
ap.add_argument("--max", type=float, default=None); ap.add_argument("--min-tail", type=float, default=12.0)
a = ap.parse_args(); F = a.folder
meta = {}
for p in glob.glob(os.path.join(F, "*_meta.json")):
    try: meta = json.load(open(p, encoding="utf-8")); break
    except Exception: pass
SUBJ = meta.get("subject") or os.path.basename(os.path.normpath(F))
rules = meta.get("rules") or {}
T = a.target or float(rules.get("AI_TARGET_S", 20)); TOL = a.tol or float(rules.get("AI_TOL_S", 2)); MX = a.max or float(rules.get("AI_MAX_S", 25))

src = open(os.path.join(F, f"{SUBJ}_source.txt"), encoding="utf-8").read()
src = re.sub(r"\[[A-Z][A-Z \-]{2,}\]", " ", src)   # stage cues never count
# ---- sentences ----
ABBR = r"(?:Mr|Mrs|Ms|Dr|St|Col|Capt|Lt|Gen|Sgt|Prof|Sr|Jr|vs|etc|No|Mt|Ft)"
def sentences(text):
    t = re.sub(r"\b" + ABBR + r"\.", lambda m: m.group(0).replace(".", "<D>"), text)
    t = re.sub(r"\b([A-Z])\.(?=\s*[A-Z])", r"\1<D>", t)               # initials J. P.
    t = re.sub(r"(\d)\.(\d)", r"\1<D>\2", t)                           # decimals
    out = []
    for para in re.split(r"\n\s*\n", t.strip()):
        para = re.sub(r"\s+", " ", para).strip()
        for s in re.split(r"(?<=[.!?…])[\"”’)]*\s+(?=[\"“‘(]?[A-Z0-9])", para):
            s = s.replace("<D>", ".").strip()
            if s: out.append(s)
    return out
S = sentences(src)
if not S: sys.exit("no sentences in the source")

# ---- words with times ----
W = []
wj = os.path.join(F, f"{SUBJ}_words.json")
def tok(s): return re.findall(r"[a-z0-9']+", s.lower().replace("’", "'"))
if os.path.exists(wj):
    d = json.load(open(wj, encoding="utf-8")); segs = d.get("segments") if isinstance(d, dict) else None
    items = [w for s in segs for w in (s.get("words") or [])] if segs else (d.get("words") if isinstance(d, dict) else d)
    for w in items or []:
        t_ = w.get("word", w.get("text")); 
        if t_ is None or w.get("start") is None: continue
        for x in tok(str(t_)): W.append((float(w["start"]), float(w["end"]), x))
if not W:
    raw = open(os.path.join(F, f"{SUBJ}.srt"), encoding="utf-8-sig", errors="ignore").read()
    for blk in re.split(r"\n\s*\n", raw.strip()):
        L = blk.strip().split("\n")
        if len(L) < 3: continue
        m = re.match(r"(\d\d):(\d\d):(\d\d)[,.](\d{3})\s*-->\s*(\d\d):(\d\d):(\d\d)[,.](\d{3})", L[1])
        if not m: continue
        g = [int(x) for x in m.groups()]; t0 = g[0]*3600+g[1]*60+g[2]+g[3]/1000; t1 = g[4]*3600+g[5]*60+g[6]+g[7]/1000
        ws = tok(" ".join(L[2:])); n = len(ws) or 1
        for k, x in enumerate(ws): W.append((t0+(t1-t0)*k/n, t0+(t1-t0)*(k+1)/n, x))
if not W: sys.exit("no word timings (need <Subject>_words.json or <Subject>.srt)")
stream = [w[2] for w in W]

# ---- align source words → stream ----
src_words, owner = [], []
for i, s in enumerate(S):
    for x in tok(s): src_words.append(x); owner.append(i)
sm = difflib.SequenceMatcher(None, src_words, stream, autojunk=False)
mapidx = [None] * len(src_words)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal":
        for k in range(i2 - i1): mapidx[i1 + k] = j1 + k
    elif tag == "replace":   # spread unmatched source words over the replaced stream span
        n = i2 - i1; m = j2 - j1
        for k in range(n): mapidx[i1 + k] = j1 + min(m - 1, int(k * m / max(1, n))) if m else None
# forward/backward fill
last = None
for k in range(len(mapidx)):
    if mapidx[k] is None: mapidx[k] = last
    else: last = mapidx[k]
nxt = None
for k in range(len(mapidx) - 1, -1, -1):
    if mapidx[k] is None: mapidx[k] = nxt
    else: nxt = mapidx[k]
first_idx = {}; last_idx = {}
for k, o in enumerate(owner):
    if mapidx[k] is None: continue
    first_idx.setdefault(o, mapidx[k]); last_idx[o] = mapidx[k]
sent = []
for i, s in enumerate(S):
    fi = first_idx.get(i, 0); li = last_idx.get(i, fi)
    st, en = W[fi][0], W[li][1]
    sent.append({"idx": i + 1, "start": st, "end": en, "words": len(tok(s)), "text": s})
for i in range(len(sent)):
    nxt_start = sent[i + 1]["start"] if i + 1 < len(sent) else sent[i]["end"]
    sent[i]["pause"] = max(0.0, nxt_start - sent[i]["end"])
    if i + 1 < len(sent) and sent[i + 1]["start"] < sent[i]["end"]: sent[i + 1]["start"] = sent[i]["end"]   # keep monotonic
matched = sum(1 for m in mapidx if m is not None) / max(1, len(mapidx))

# ---- the walk ----
# lengths are measured the way time_breakdown stamps them: from the MIDPOINT of the pause before the first
# sentence to the MIDPOINT of the pause after the last one (the cut lands in the middle of the silence)
def t_start(i): return sent[i]["start"] - (sent[i - 1]["pause"] / 2 if i > 0 else 0)
def t_end(k): return sent[k]["end"] + (sent[k]["pause"] / 2 if k + 1 < len(sent) else 0)
secs = []; n = len(sent); INF = 1e18
def cost(i, k):
    L = t_end(k) - t_start(i); last = (k == n - 1)
    if L > MX + 1e-6: return 60.0 if i == k else INF           # a lone sentence longer than the ceiling: allowed, flagged
    dev = max(0.0, abs(L - T) - TOL); c = dev * dev
    if abs(L - T) > 5 and not (i == k and L > MX): c += 100.0                      # review_audit FAILs an AI section > 5 s off the target: avoid it whenever any tiling can
    elif L < T - 5: c += 25.0
    if last and L < a.min_tail: c += 25.0
    if not last: c -= 0.8 * min(3.0, sent[k]["pause"])          # cutting on a big pause is worth something
    return c
best = [INF] * (n + 1); prev = [-1] * (n + 1); best[0] = 0.0
for k in range(n):
    for i in range(k, -1, -1):
        if t_end(k) - t_start(i) > MX + 1e-6 and i < k: break
        c = cost(i, k)
        if c >= INF or best[i] >= INF: continue
        if best[i] + c < best[k + 1]: best[k + 1] = best[i] + c; prev[k + 1] = i
k = n
while k > 0: i = prev[k]; secs.append((i, k - 1)); k = i
secs.reverse()
def mmss(t): return f"{int(t // 60)}:{t % 60:05.2f}"
rows = []
for k, (s0, s1) in enumerate(secs, 1):
    st, en = t_start(s0), t_end(s1); words = sum(x["words"] for x in sent[s0:s1 + 1])
    opening = " ".join(" ".join(x["text"] for x in sent[s0:s1 + 1]).split()[:8])
    rows.append(f"S{k:02d} | {s0 + 1}-{s1 + 1} | {'HOOK' if k == 1 else 'AI'} | {mmss(st)} → {mmss(en)} ({en - st:.1f} s) | {words} w | {opening}…")
hdr = ["# PLAN — " + SUBJ + " · one line per section · edit TYPE (HOOK AI MAP REF CHAR) and, if needed, the sentence range a-b; keep the order",
       "# rules: AI 18–22 s (never > 25) · HOOK/MAP/REF/CHAR 18–30 s · HOOK = S01 only · no two MAP in a row · no two REF in a row · a MAP/REF needs a real place/object in ITS OWN text",
       "# the window column is informative (recomputed by build_breakdown); only the ranges and TYPEs count",
       "THEME: [FILL — 2–4 THEME lines summarising the subject and arc]",
       "THEME: [FILL]",
       "CONTENT TREATMENT: [optional — delete this line if PHASE 5 restraint does not apply; else state what is never depicted and what is shown instead]"]
plan = "\n".join(hdr + rows) + "\n"
open(os.path.join(F, f"{SUBJ}_plan.txt"), "w", encoding="utf-8").write(plan)
with open(os.path.join(F, f"{SUBJ}_sentences.tsv"), "w", encoding="utf-8") as f:
    f.write("idx\tstart\tend\tpause_after\twords\ttext\n")
    for x in sent: f.write(f"{x['idx']}\t{x['start']:.3f}\t{x['end']:.3f}\t{x['pause']:.2f}\t{x['words']}\t{x['text']}\n")
over = [r for (s0, s1), r in zip(secs, rows) if t_end(s1) - t_start(s0) > MX + 0.05]
print(f"PROPOSAL: {len(sent)} sentences → {len(secs)} sections · target {T:g}±{TOL:g} s, ceiling {MX:g} s · word alignment {matched:.0%} · audio {mmss(sent[-1]['end'])}")
if over: print("  OUTLIERS (a single sentence longer than the ceiling — keep it alone, note it in the header): " + "; ".join(r.split('|')[0].strip() for r in over))
print(f"  plan: {os.path.join(F, SUBJ + '_plan.txt')}   sentences: {SUBJ}_sentences.tsv")
print(plan)
~~~~

### FILE: rebuild.py

~~~~
#!/usr/bin/env python3
"""
Rebuild an SRT so it contains ONE subtitle per breakdown section (whole
paragraph = one cue), timed to the audio via fuzzy alignment, with all
"AI" sections removed. Auto-detects inputs in /mnt/user-data/uploads and
prefers the SPECIAL breakdown when several .txt breakdowns are present.
"""
import re, glob, os, sys
from difflib import SequenceMatcher

# optional argv[1] = a single working folder (used for BOTH inputs and outputs),
# which keeps separate projects isolated when several run in one chat.
UP=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/uploads")
OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs")
DROP_TYPES={"AI"}                 # section types (first token) to remove
os.makedirs(OUT, exist_ok=True)

# ---------- locate inputs by ROLE, not by exact filename ----------
srt_files=[s for s in glob.glob(f"{UP}/*.srt")
           if "_timestamp_guidelines" not in os.path.basename(s)
           and "_sections_no_AI" not in os.path.basename(s)
           and "_word_level" not in os.path.basename(s)
           and not s.endswith("_full_arranged.srt")]
if not srt_files: sys.exit("No .srt file found in uploads.")
SRT_PATH=max(srt_files, key=os.path.getsize)        # the transcription

def section_count(p):
    try: t=open(p,encoding="utf-8",errors="ignore").read()
    except: return 0
    return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', t))
txts=[(p,section_count(p)) for p in glob.glob(f"{UP}/*.txt")]
txts=[x for x in txts if x[1]>0]
if not txts: sys.exit("No breakdown .txt (with 'SECTION N | NN words | TYPE' headers) found.")
def is_special(p):                                  # prefer the SPECIAL/clean breakdown
    try: t=open(p,encoding="utf-8",errors="ignore").read(2000).upper()
    except: return False
    return "SPECIAL" in t.replace("SPECIAL:FILEPATH","")   # ignore Special:FilePath download URLs
specials=[x for x in txts if is_special(x[0])]
pool=specials if specials else txts
BREAKDOWN_PATH=max(pool, key=lambda x:x[1])[0]
print(f"SRT:       {os.path.basename(SRT_PATH)}")
print(f"Breakdown: {os.path.basename(BREAKDOWN_PATH)}{' (SPECIAL)' if specials else ''}\n")

# ---------- parse SRT ----------
def ts_to_ms(ts):
    h,m,rest=ts.split(':'); s,ms=rest.split(',')
    return ((int(h)*60+int(m))*60+int(s))*1000+int(ms)
raw=open(SRT_PATH,encoding="utf-8-sig").read().replace('\r\n','\n').replace('\r','\n')
srt=[]
for b in re.split(r'\n\s*\n', raw.strip()):
    L=b.split('\n')
    if len(L)<3: continue
    m=re.match(r'(\d\d:\d\d:\d\d,\d+)\s*-->\s*(\d\d:\d\d:\d\d,\d+)', L[1])
    if not m: continue
    srt.append({'start':ts_to_ms(m.group(1)),'end':ts_to_ms(m.group(2)),
                'text':' '.join(L[2:]).strip()})

# ---------- parse breakdown sections (SCRIPT = paragraph until blank line) ----------
lines=open(BREAKDOWN_PATH,encoding="utf-8").read().split('\n')
hdr=re.compile(r'^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$')
sections=[]; i=0
while i<len(lines):
    h=hdr.match(lines[i])
    if h:
        j=i+1
        while j<len(lines) and lines[j].strip()!='SCRIPT:': j+=1
        k=j+1; buf=[]
        while k<len(lines) and lines[k].strip()!='':
            buf.append(lines[k].strip()); k+=1
        sections.append({'num':int(h.group(1)),'type':h.group(3).strip(),
                         'script':re.sub(r'\s+',' ',' '.join(buf)).strip()})
        i=k
    else: i+=1

# ---------- build word stream with per-word timing meta ----------
def words(t): return re.findall(r'[a-z0-9]+', t.lower())
stream=[]; meta=[]
for ei,e in enumerate(srt):
    ws=words(e['text']); cnt=len(ws)
    for kk,w in enumerate(ws): stream.append(w); meta.append((ei,kk,cnt))
N=len(stream)

def best_pos(anc, lo, hi):
    L=len(anc); best=(-1,-1); hi=min(hi,N-L)
    for i in range(max(0,lo),hi+1):
        sc=sum(1 for kk in range(L) if stream[i+kk]==anc[kk])
        if sc>best[1]: best=(i,sc)
        if sc==L: break
    return best

def global_pos(anc, lo):              # forward global scan from `lo`
    L=len(anc); best=(-1,-1)
    for i in range(max(0,lo),N-L+1):
        sc=sum(1 for kk in range(L) if stream[i+kk]==anc[kk])
        if sc>best[1]: best=(i,sc)
        if sc==L: break
    return best

def align(sw, floor):
    n=len(sw)
    anc=sw[:min(10,n)]
    # Anchor by this section's opening words. Search forward from `floor`
    # (the previous section's START) so ordering stays monotonic, but use a
    # global forward scan so a single bad span can't strand later sections.
    rs,sc=global_pos(anc, floor)
    if rs<0:
        rs,sc=best_pos(anc, floor, floor+2000)
    if rs<0: rs=min(floor, N-1)
    lo=max(0,rs-3); hi=min(N, rs+n+40)
    blocks=[b for b in SequenceMatcher(None,sw,stream[lo:hi],autojunk=False).get_matching_blocks() if b.size>0]
    if blocks:
        fb,lb=blocks[0],blocks[-1]
        s=lo+max(0,fb.b-fb.a)
        e=lo+(lb.b+lb.size-1)+max(0,(n-1)-(lb.a+lb.size-1))
    else: s,e=rs,rs+n-1
    e=min(e, s+n+2)                         # clamp: guard spurious far matches
    s=max(0,min(s,N-1)); e=max(s,min(e,N-1))
    return s, e

def w_start(g): ei,k,c=meta[g]; t0,t1=srt[ei]['start'],srt[ei]['end']; return t0+round((t1-t0)*k/c)
def w_end(g):   ei,k,c=meta[g]; t0,t1=srt[ei]['start'],srt[ei]['end']; return t0+round((t1-t0)*(k+1)/c)

# align ALL sections in order; advance cursor by START (not end), then drop AI, de-overlap
cursor=0; allc=[]
for s in sections:
    sw=words(s['script']); a,b=align(sw,cursor)
    allc.append({**s,'start':w_start(a),'end':w_end(b),'n':len(sw)}); cursor=a+1
cues=[c for c in allc if c['type'].split()[0].upper() not in DROP_TYPES]
for i in range(len(cues)-1):
    if cues[i]['end']>=cues[i+1]['start']: cues[i]['end']=cues[i+1]['start']-1
for c in cues:
    if c['end']<=c['start']: c['end']=c['start']+500

# ---------- write SRT (text = the breakdown SCRIPT, correct spelling) ----------
def ms2srt(ms):
    s,ms=divmod(int(ms),1000); m,s=divmod(s,60); h,m=divmod(m,60)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
base=re.sub(r'(_special)?(_breakdown)?\.txt$','',os.path.basename(BREAKDOWN_PATH))
dest=f"{OUT}/{base}_sections_no_AI.srt"
o=[]
for i,c in enumerate(cues,1):
    o+=[str(i), f"{ms2srt(c['start'])} --> {ms2srt(c['end'])}", c['script'], ""]
open(dest,"w",encoding="utf-8").write("\r\n".join(o).rstrip("\r\n")+"\r\n")

# ---------- report ----------
def fmt(ms): s,ms=divmod(int(ms),1000); m,s=divmod(s,60); h,m=divmod(m,60); return f"{h:02d}:{m:02d}:{s:02d}"
print(f"Sections in breakdown: {len(allc)} | removed AI: {len(allc)-len(cues)} | kept: {len(cues)}")
ok=all(cues[i]['end']<=cues[i+1]['start'] for i in range(len(cues)-1))
print(f"No overlaps: {ok} | kept types: {sorted(set(c['type'].split()[0] for c in cues))}")
if cues: print(f"Coverage: {fmt(cues[0]['start'])} -> {fmt(cues[-1]['end'])}")
print(f"Output: {dest}")
~~~~

### FILE: review_audit.py

~~~~
#!/usr/bin/env python3
"""
REVIEW AUDIT — does the (reviewed) breakdown still obey the video-structure rules?

Mechanical half of the review pass. Checks: the type plan (HOOK = section 1 only;
MAP uncapped since 2026-09-10-r8 and REF uncapped since 2026-09-11-r10; no two
consecutive MAP or REF); section
length caps (30s, or up to 90s for the FALLEN CIVILIZATION post-30-min AI tail) and
basic pacing; the tail rule itself (r8: on a tail-rule channel every HOOK / MAP / REF /
CHAR section ends at or before the tail mark, so the tail — and the SPECIAL
breakdown's reach — never runs past ~30:00); exactly 3
prompts per section (r15: ONE per section — PROMPT 1 for AI, one -ALTERNATIVE- for the
rest — unless the channel raises AI_PROMPTS / ALT_PROMPTS); the STYLE SUFFIX still present on every prompt it belongs on
(so a prompt rewrite did NOT touch the suffix); the link policy for this reviewer —
every REF / CHAR / MAP image link must be a Wikimedia DOWNLOAD URL
(upload.wikimedia.org/...), the HOOK's image links likewise (r9: the HOOK is a map
animation — its VIDEO LINK is optional and unused, and it carries a MAP SUBJECT line
like every MAP), and Category / Special links are never allowed; the SPECIAL
breakdown being AI-free and matching the non-AI sections; (r9) when a
[Subject]_allanimations.json (or legacy _allmaps.json) sits in the folder, that it is
COHERENT with the breakdown — one map object per HOOK/MAP section and one still per
REF/CHAR section, matched by the type-ordinal source_file, with comp_start_ms /
comp_duration_ms equal to the stamped TIMECODE and the stills' required fields
present; and (if a *_source.txt is present) that nothing was lost.
Writes [Subject]_review_audit.md and exits 1 on any FAIL.

Optional argv[1] = the working folder.
"""
import re, glob, os, sys, json, hashlib
from urllib.parse import urlsplit, unquote

def _find_suffix_list(folder):
    here=os.path.dirname(os.path.abspath(__file__))
    for d in (folder,"/mnt/user-data/uploads",here,os.getcwd()):
        for q in glob.glob(f"{d}/*Channel_Prompt_Suffixes*.txt")+glob.glob(f"{d}/*hannel*uffix*.txt"):
            return q
    return None
def _parse_overrides(path):
    raw=open(path,encoding="utf-8-sig",errors="ignore").read().replace('\r\n','\n').replace('\r','\n')
    lines=raw.split('\n'); res={}; i=0
    while i<len(lines):
        if lines[i].startswith("CHANNELS:"):
            tags=re.findall(r'\[([^\]]+)\]', lines[i]); ov={}; j=i+1
            while j<len(lines) and not lines[j].startswith("CHANNELS:") and set(lines[j].strip())!={'-'}:
                mm=re.match(r'\s*(MAX_SECTION_S|TAIL_AFTER_MIN|TAIL_MAX_S|TAIL_TYPE|AI_TARGET_S|AI_TOL_S|AI_MAX_S|AI_PROMPTS|ALT_PROMPTS)\s*:\s*(.+?)\s*$', lines[j])
                if mm:
                    k=mm.group(1); ov[k]=(mm.group(2).strip().upper() if k=="TAIL_TYPE" else int(mm.group(2)))
                j+=1
            if ov:
                for x in tags: res[x.strip().upper()]=ov
            i=j
        else: i+=1
    return res
def channel_rules(channel, folder):
    caps={'MAX_SECTION_S':30,'TAIL_AFTER_MIN':None,'TAIL_MAX_S':None,'TAIL_TYPE':'AI','AI_TARGET_S':20,'AI_TOL_S':2,'AI_MAX_S':25,'AI_PROMPTS':1,'ALT_PROMPTS':1}   # (r16) every AI section ≈ 20 s (18–22, 25 ceiling) on EVERY channel by default; (r15) ONE prompt per section
    key=(channel or "").strip().strip("[]").upper()
    if key=="FALLEN CIVILIZATION": caps.update({'TAIL_AFTER_MIN':30,'TAIL_MAX_S':90,'TAIL_TYPE':'AI'})
    man=glob.glob(f"{folder}/*_manifest.json")
    if man:
        try:
            cr=(json.load(open(man[0],encoding="utf-8")).get('channel_rules') or {})
            for k in caps:
                if cr.get(k) is not None: caps[k]=cr[k]
        except Exception: pass
    sp=_find_suffix_list(folder)
    if sp:
        ov=_parse_overrides(sp).get(key)
        if ov:
            for k,v in ov.items(): caps[k]=v
    return caps

OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs"); UP=OUT
hdr=re.compile(r'^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$')
tcre=re.compile(r'TIMECODE:\s*(\d\d):(\d\d):(\d\d)[.,](\d{1,3})\s*(?:\u2192|-->|->|>)\s*'
                r'(\d\d):(\d\d):(\d\d)[.,](\d{1,3})')
prre=re.compile(r'^\s*PROMPT\s+([123])\b\s*:?(.*)$')
linkre=re.compile(r'^\s*(VIDEO LINK|REF/MAP LINK \d+|ALT LINK \d+|LINK|REFERENCE)\s*:\s*(\S+)')
def to_ms(h,m,s,f): return ((int(h)*60+int(m))*60+int(s))*1000+int(f.ljust(3,'0'))
base=lambda t: t.split()[0].upper()
norm=lambda s: re.findall(r"[a-z0-9]+", s.lower())

def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p,encoding="utf-8",errors="ignore").read()))
    except Exception: return 0
def is_special(p):
    try: return "SPECIAL" in open(p,encoding="utf-8",errors="ignore").read(1500).upper().replace("SPECIAL:FILEPATH","")
    except Exception: return False
def parse(path):
    L=open(path,encoding="utf-8").read().split('\n'); idx=[i for i,l in enumerate(L) if hdr.match(l)]; out=[]
    for n,a in enumerate(idx):
        b=idx[n+1] if n+1<len(idx) else len(L); blk=L[a:b]; h=hdr.match(L[a])
        s_i=next((q for q,l in enumerate(blk) if l.strip()=='SCRIPT:'), None)
        script=""
        if s_i is not None:
            buf=[]; q=s_i+1
            while q<len(blk) and blk[q].strip()!='' and not blk[q].startswith('MAP SUBJECT:'):
                buf.append(blk[q].strip()); q+=1
            script=' '.join(buf)
        tc=None
        for l in (blk[:s_i] if s_i is not None else blk):
            m=tcre.search(l)
            if m: tc=m
        prompts={}
        for q,l in enumerate(blk):
            pm=prre.match(l)
            if pm:
                txt=pm.group(2).strip()
                if txt.startswith("|") and txt.endswith("|"): txt=""  # |LABEL| marker; real prompt is on the next line
                r=q+1
                while r<len(blk) and not txt and blk[r].strip()=='' : r+=1
                if not txt and r<len(blk): txt=blk[r].strip()
                prompts[pm.group(1)]=txt
        links=[(m.group(1),m.group(2)) for l in blk for m in [linkre.match(l)] if m]
        intro=None
        for l in blk:
            mi=re.match(r'(?i)^\s*CHARACTER INTRODUCTION:\s*(.+?)\s*$', l)
            if mi: intro=mi.group(1).strip(); break
        msub=None
        for l in blk:
            mm=re.match(r'^MAP SUBJECT:\s*(.+?)\s*@\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\[source:\s*(script|narrative|user)\]\s*$', l)
            if mm:
                msub={'name':mm.group(1),'lat':float(mm.group(2)),'lon':float(mm.group(3)),'source':mm.group(4)}
                break
            if l.startswith('MAP SUBJECT:') and msub is None:
                msub={'raw':l}
        rec={'num':int(h.group(1)),'words':int(h.group(2)),'type':h.group(3).strip(),
             'script':script,'prompts':prompts,'links':links,'intro':intro,'map_subject':msub}
        if tc: g=tc.groups(); rec['t0']=to_ms(*g[:4]); rec['t1']=to_ms(*g[4:])
        out.append(rec)
    return L,out

cands=[p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and not is_special(p)
       and "special" not in os.path.basename(p).lower()
       and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
if not cands: sys.exit("No FULL breakdown found in the folder.")
FULL=max(cands,key=is_breakdown); FL,secs=parse(FULL)
subj=re.sub(r'(_breakdown)?.txt$','',os.path.basename(FULL))

res=[]
def add(level,msg): res.append((level,msg))
def is_dl(u): return "upload.wikimedia.org/" in u
def hash_ok(u):
    # the /x/xy/ path must equal md5(filename)[0]/[0:2]; catches mis-hashed/edited URLs
    try:
        seg=urlsplit(u).path.split('/'); i=seg.index('commons'); s=seg[i+1:]
        a,ab,name=((s[1],s[2],unquote(s[3])) if s and s[0]=='thumb' else (s[0],s[1],unquote(s[2])))
        if len(a)!=1 or len(ab)!=2: return False,"prefix is not 1/2 hex chars"
        md5=hashlib.md5(name.encode('utf-8')).hexdigest()
        return (a==md5[0] and ab==md5[:2]), f"path says {a}/{ab}; md5(filename) says {md5[0]}/{md5[:2]}"
    except Exception as e:
        return False, f"unparseable upload URL ({e})"
def is_cat(u): return "/wiki/Category:" in u
def is_spc(u): return "/wiki/Special:" in u

# ---- type plan ----
hooks=[s['num'] for s in secs if base(s['type'])=="HOOK"]
add("FAIL" if hooks!=[secs[0]['num']] else "PASS",
    "HOOK is section 1 only" if hooks==[secs[0]['num']] else f"HOOK placement wrong: sections {hooks}")
# (r8/r10) MAP and REF counts are UNCAPPED on every channel: the counts are whatever
# the narration's geography (MAP) and its real, anchorable objects (REF) honestly
# support. Only the no-consecutive rules (below) and, on tail-rule channels, the
# tail rule (further below) still shape them.
nmap=sum(1 for s in secs if base(s['type'])=="MAP")
nref=sum(1 for s in secs if base(s['type'])=="REF")
add("PASS", f"MAP count {nmap} (no cap since 2026-09-10-r8)")
add("PASS", f"REF count {nref} (no cap since 2026-09-11-r10)")
seq=[base(s['type']) for s in secs]
con=[f"S{secs[i+1]['num']}" for i in range(len(seq)-1) if seq[i]==seq[i+1] and seq[i] in ("MAP","REF")]
add("FAIL" if con else "PASS", "No consecutive MAP/REF" if not con else "Consecutive MAP/REF at "+", ".join(con))

# ---- length caps + pacing ----
mchan=re.search(r'(?im)^\s*CHANNEL:\s*(.+?)\s*$', "\n".join(FL))
CAPS=channel_rules(mchan.group(1).strip() if mchan else None, OUT)
_TAIL_MARK=(int(CAPS['TAIL_AFTER_MIN'])*60000) if CAPS['TAIL_AFTER_MIN'] is not None else None
def _is_tail(s):
    # (B5) the tail begins at the boundary NEAREST the mark, which may fall slightly
    # BEFORE it — a tail section is one of the tail TYPE whose window CROSSES or
    # follows the mark (t1 > mark), matching the builder's definition.
    return (_TAIL_MARK is not None and base(s['type'])==str(CAPS['TAIL_TYPE']).upper()
            and s.get('t1',0)>_TAIL_MARK)
def _ai_rule(s): return base(s['type'])=="AI" and CAPS.get('AI_TARGET_S') and not _is_tail(s)
def cap(s):
    if _is_tail(s): return int(CAPS['TAIL_MAX_S'] or CAPS['MAX_SECTION_S'])*1000
    if _ai_rule(s): return int(CAPS.get('AI_MAX_S') or max(int(CAPS['AI_TARGET_S'])+int(CAPS.get('AI_TOL_S') or 2), int(CAPS['MAX_SECTION_S'])))*1000   # (r13)
    return int(CAPS['MAX_SECTION_S'])*1000
overs=[f"S{s['num']}={(s['t1']-s['t0'])/1000:.1f}s" for s in secs if 't0' in s and (s['t1']-s['t0'])>cap(s)]
add("FAIL" if overs else "PASS", "Every section within its length cap" if not overs else "Over cap: "+", ".join(overs))

# ---- (r13) AI TARGET LENGTH: on a channel with AI_TARGET_S (e.g. [OLDWORLDPROOF] = 30 s) every
# AI section sits at the target: within ±AI_TOL_S = PASS, within ±5 s = WARN, beyond = FAIL.
# The one honest exception is a BOUNDED short section — the only AI section between two
# non-AI sections (or the last section of the video): the specials around it fix its
# length, so it is a WARN, never a FAIL.
if CAPS.get('AI_TARGET_S'):
    _tgt=int(CAPS['AI_TARGET_S'])*1000; _tol=int(CAPS.get('AI_TOL_S') or 2)*1000
    _w=[]; _f=[]
    for _i,s in enumerate(secs):
        if not _ai_rule(s) or 't0' not in s: continue
        d=s['t1']-s['t0']; off=d-_tgt
        prev_ai = _i>0 and base(secs[_i-1]['type'])=="AI"; next_ai = _i+1<len(secs) and base(secs[_i+1]['type'])=="AI"
        bounded = (not prev_ai) and (not next_ai)
        if abs(off)<=_tol: continue
        if abs(off)<=5000 or (bounded and off<0): _w.append(f"S{s['num']}={d/1000:.1f}s")
        else: _f.append(f"S{s['num']}={d/1000:.1f}s")
    _n=sum(1 for s in secs if _ai_rule(s))
    add("FAIL" if _f else "PASS", f"AI sections at the {CAPS['AI_TARGET_S']}s target (±{CAPS.get('AI_TOL_S') or 2}s) — {_n} AI section(s)" if not _f
        else f"AI sections off the {CAPS['AI_TARGET_S']}s target by more than 5s: "+", ".join(_f))
    if _w: add("WARN", f"AI sections a few seconds off the {CAPS['AI_TARGET_S']}s target (or bounded short): "+", ".join(_w))

# ---- (r8) tail rule: special sections stay before the tail ----
# On a tail-rule channel (e.g. [FALLEN CIVILIZATION]) the tail begins at the LAST
# section boundary at or before the mark (TAIL_AFTER_MIN) and is TAIL_TYPE only, so
# every HOOK / MAP / REF / CHAR section must (a) end at or before the mark (5 s of
# stamping tolerance) and (b) start before the first tail section. MAP is uncapped
# since r8, so this is what keeps the maps — and the whole SPECIAL breakdown — inside
# the first ~30 minutes.
if _TAIL_MARK is not None:
    _ttype=str(CAPS['TAIL_TYPE']).upper()
    _tails=[s for s in secs if _is_tail(s)]
    _tail_start=min(s['t0'] for s in _tails) if _tails else None
    def _hms(ms):
        ms=int(ms); s_,f=divmod(ms,1000); m,s_=divmod(s_,60); h,m=divmod(m,60)
        return f"{h:02d}:{m:02d}:{s_:02d}.{f:03d}"
    late=[]
    for s in secs:
        if 't0' not in s or base(s['type'])==_ttype: continue
        if s['t1']>_TAIL_MARK+5000:
            late.append(f"S{s['num']} {s['type']} ends {_hms(s['t1'])} (past the {CAPS['TAIL_AFTER_MIN']}-min mark)")
        elif _tail_start is not None and s['t0']>=_tail_start:
            late.append(f"S{s['num']} {s['type']} starts {_hms(s['t0'])} (inside the {_ttype} tail that begins {_hms(_tail_start)})")
    add("FAIL" if late else "PASS",
        (f"Tail rule: every non-{_ttype} section ends by the {CAPS['TAIL_AFTER_MIN']}-min mark; the tail is {_ttype}-only"
         if not late else f"Tail rule broken — {len(late)} non-{_ttype} section(s) in or past the tail"))
    for x in late: add("  -", x)
durs=[(s['t1']-s['t0'])/1000 for s in secs if 't0' in s]
if durs:
    shorts=[f"S{s['num']}" for s in secs[:-1] if 't0' in s and (s['t1']-s['t0'])<12000]
    # (F5) the AI bed dominates any raw same-type-run number; report the AI run and
    # the longest NON-AI same-type run separately so the figure means something for
    # the rhythm the rules actually care about.
    run=1; mx_ai=0; mx_o=0
    for i in range(1,len(seq)):
        run=run+1 if seq[i]==seq[i-1] else 1
        if seq[i]=="AI": mx_ai=max(mx_ai,run)
        else: mx_o=max(mx_o,run)
    add("WARN" if shorts else "PASS", f"Pacing: {len(durs)} sections, avg {sum(durs)/len(durs):.1f}s, longest AI run {max(mx_ai,1)}, longest non-AI same-type run {max(mx_o,1)}"+(f"; very short: {', '.join(shorts)}" if shorts else ""))

# ---- prompts + suffix unchanged ----
msuf=re.search(r'(?im)^\s*STYLE SUFFIX:\s*"(.+?)"\s*$', "\n".join(FL))
SUF=msuf.group(1).strip() if msuf else None
# (r15) ONE prompt per section is the rule on every channel: AI sections carry PROMPT 1; HOOK / MAP /
# REF / CHAR carry one -ALTERNATIVE- prompt. (AI_PROMPTS / ALT_PROMPTS in the suffix file can raise it.)
def _want_prompts(s): return int(CAPS.get('AI_PROMPTS') or 1) if base(s['type'])=="AI" else int(CAPS.get('ALT_PROMPTS') or 1)
badp=[f"S{s['num']}" for s in secs if len(s['prompts'])!=_want_prompts(s)]
_ap=int(CAPS.get('AI_PROMPTS') or 1); _al=int(CAPS.get('ALT_PROMPTS') or 1)
add("FAIL" if badp else "PASS", (f"{_ap} prompt per AI section, {_al} -ALTERNATIVE- prompt per HOOK/MAP/REF/CHAR section") if not badp else "Wrong prompt count: "+", ".join(badp))
if SUF:
    miss=[]
    for s in secs:
        p=s['prompts']
        if base(s['type'])=="CHAR":
            if "1" in p and SUF.lower() not in p["1"].lower(): miss.append(f"S{s['num']}P1")
            if "2" in p and "natural skin texture" not in p["2"].lower(): miss.append(f"S{s['num']}P2")
            if "3" in p and "greyscale" not in p["3"].lower(): miss.append(f"S{s['num']}P3")
        else:
            for k in ("1","2","3"):
                if k in p and SUF.lower() not in p[k].lower(): miss.append(f"S{s['num']}P{k}")
    add("FAIL" if miss else "PASS", "STYLE SUFFIX intact on every prompt" if not miss else "Suffix missing/altered: "+", ".join(miss))
else:
    add("WARN","No STYLE SUFFIX line in header — cannot verify suffix is unchanged")

# ---- symbolic / abstract prompt pre-filter (directs STAGE B; never a hard fail) ----
SYMBOLIC=[r'\bvortex\b',r'\bethereal\b',r'\btendrils?\b',r'\bswirl',r'echoes of',r'whispers of',
 r'shadows? of',r'the weight of',r'fabric of',r'tapestry of',r'dance of',r'symphony of',r'essence of',
 r'embodiment',r'manifestation',r'\bsurreal\b',r'dreamlike',r'otherworldly',r'\bmetaphor',r'metaphysical',
 r'\babstract',r'symboliz',r'represents the',r'\bghostly\b',r'\bspectral\b',r'\bphantom\b',r'\bcelestial\b',
 r'\bcosmic\b',r'\beternal\b',r'\bdestiny\b',r'soul of',r'glowing rune']
def base_of(txt):
    b=txt
    if SUF and SUF.lower() in b.lower(): b=b[:b.lower().rfind(SUF.lower())]
    return b.lower()
sym=[]
for s in secs:
    for k,txt in s['prompts'].items():
        b=base_of(txt); hits=sorted({re.search(pp,b).group(0) for pp in SYMBOLIC if re.search(pp,b)})
        if hits: sym.append(f"S{s['num']}P{k}: {', '.join(hits)}")
add("WARN" if sym else "PASS", "No obviously symbolic/abstract prompt language" if not sym else f"{len(sym)} prompt(s) look symbolic/abstract — reground in STAGE B")
for x in sym: add("  -", x)

# ---- CHAR sections must NAME the person (CHARACTER INTRODUCTION), matching the script ----
# The portrait prompts stay GENERIC by design (no real-person likeness); the name lives
# in the CHARACTER INTRODUCTION line, which must hold the actual person from the script.
NAME_STOP={w.lower() for w in """The A An And But Or Nor For Yet So In On At By To Of From Into Onto
Upon Over Under Through Between Among Within Without Against Before After While Since Until Because
Although Though If When Where Why How What Who Whom Whose Which That This These Those Then Than Now
Here There As He She It We They You His Her Its Their Our Your Him Them Us Me Today Tomorrow Yesterday
Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July
August September October November December Polish German French British English American Russian Italian
Spanish Portuguese Dutch Belgian Roman Greek Chinese Japanese Korean Indian Persian Arab Arabic Turkish
Ottoman Soviet Nazi Allied Egyptian Mongol Viking Norse Celtic Saxon Norman Byzantine Prussian Austrian
Hungarian Czech Swedish Norwegian Danish Finnish Swiss Scottish Irish Welsh European African Asian
Western Eastern Northern Southern Portrait Photograph Photo Headshot Closeup Close Wide Medium Shot
Image Scene View Figure Man Woman Soldier Officer General Captain Colonel Major Sergeant Lieutenant
Admiral King Queen Emperor Empress Prince Princess Duke Duchess Lord Lady Sir Saint Knight Warrior
Leader Commander Ruler Statesman President Minister Priest Bishop Pope Monk Nun Young Old Elderly
Bearded Famous Great Grand Royal Imperial Ancient Medieval Modern Historical War World Empire Kingdom
Republic Army Navy Battle Church State City Town Village River Sea Ocean Lake Mountain Island God
Heaven Earth North South East West New""".split()}
def _names(text):
    return {w.lower() for w in re.findall(r"\b[A-ZÀ-Þ][A-Za-zà-ÿ'’\-]{2,}\b", text) if w.lower() not in NAME_STOP}
char_fail=[]; char_warn=[]
for s in secs:
    if base(s['type'])!="CHAR": continue
    intro=(s.get('intro') or "").strip()
    if not intro or intro.startswith("["):
        char_fail.append(f"S{s['num']}: CHAR section has no CHARACTER INTRODUCTION name (it must name who it's about)")
        continue
    sn=_names(s.get('script','')); inames=_names(intro)
    if not inames:
        char_warn.append(f"S{s['num']}: CHARACTER INTRODUCTION \"{intro}\" doesn't look like a name \u2014 confirm the person is named")
    elif sn and not (inames & sn):
        char_warn.append(f"S{s['num']}: CHARACTER INTRODUCTION names {intro} but this section's script names {sorted(sn)} \u2014 confirm it's the person narrated here")
    elif not sn:
        char_warn.append(f"S{s['num']}: CHARACTER INTRODUCTION names {intro} but no matching name is in this section's script \u2014 confirm they're narrated here")
add("FAIL" if char_fail else ("WARN" if char_warn else "PASS"),
    "CHAR sections name the person (CHARACTER INTRODUCTION) from their script" if not char_fail else f"{len(char_fail)} CHAR section(s) don't name the person")
for x in char_fail: add("  -", x)
for x in char_warn: add("  -", x)

# ---- MAP SUBJECT gate (r3): every MAP section declares its subject place ----
# Closes the vacuous-set loophole: a MAP section whose script names no place used to
# pass the coverage idea trivially (empty list => any sheet "covers" it). The declared
# subject is the anchor Phase B must pin; kit `phasea audit` checks it against the
# sheet's cartouche + scale class.
ms_fail=[]
for s in secs:
    if base(s['type']) not in ("MAP","HOOK"): continue     # (r9) the HOOK is pinned like a MAP
    ms=s.get('map_subject')
    if not ms:
        ms_fail.append(f"S{s['num']}: no MAP SUBJECT line ('MAP SUBJECT: <name> @ <lat>,<lon> [source: script|narrative|user]')")
    elif 'raw' in ms:
        ms_fail.append(f"S{s['num']}: MAP SUBJECT line malformed: {ms['raw'][:90]}")
    elif not (-90.0<=ms['lat']<=90.0 and -180.0<=ms['lon']<=180.0):
        ms_fail.append(f"S{s['num']}: MAP SUBJECT lat/lon out of range ({ms['lat']},{ms['lon']})")
add("FAIL" if ms_fail else "PASS",
    "Every MAP (and the HOOK) declares its MAP SUBJECT (name + lat,lon + source)" if not ms_fail
    else f"{len(ms_fail)} MAP/HOOK section(s) missing/invalid MAP SUBJECT")
for x in ms_fail: add("  -", x)

# ---- link policy (downloads for REF/CHAR/MAP; HOOK keeps a video link) ----
link_fail=[]
for s in secs:
    bt=base(s['type']); labels=[lab for lab,_ in s['links']]
    for lab,u in s['links']:
        if is_cat(u): link_fail.append(f"S{s['num']} {lab}: Category link")
        elif is_spc(u): link_fail.append(f"S{s['num']} {lab}: Special: link")
    if bt in ("MAP","REF"):
        imgs=[u for lab,u in s['links'] if lab in ("LINK","ALT LINK 1","ALT LINK 2")]
        if not imgs: link_fail.append(f"S{s['num']} {bt}: no image link")
        for u in imgs:
            if not is_dl(u): link_fail.append(f"S{s['num']} {bt} link not a Wikimedia download URL: {u}")
    elif bt=="CHAR":
        refs=[u for lab,u in s['links'] if lab=="REFERENCE"]
        if not refs: link_fail.append(f"S{s['num']} CHAR: no REFERENCE link")
        for u in refs:
            if not is_dl(u): link_fail.append(f"S{s['num']} CHAR REFERENCE not a Wikimedia download URL: {u}")
    elif bt=="HOOK":                                        # (r9) VIDEO LINK optional — the HOOK is a map animation
        if not any(lab.startswith("REF/MAP LINK") for lab in labels): link_fail.append(f"S{s['num']} HOOK: no REF/MAP LINK (the antique sheet)")
        for lab,u in s['links']:
            if lab.startswith("REF/MAP LINK") and not is_dl(u):
                link_fail.append(f"S{s['num']} HOOK {lab} not a Wikimedia download URL: {u}")
for s in secs:
    for lab,u in s['links']:
        if "upload.wikimedia.org/wikipedia/commons/" in u:
            ok,why=hash_ok(u)
            if not ok: link_fail.append(f"S{s['num']} {lab}: upload URL path/hash mismatch (likely hand-built) — {why}")
add("FAIL" if link_fail else "PASS", "Links obey the download/video policy + path-hash integrity" if not link_fail else f"{len(link_fail)} link issue(s)")
for f in link_fail: add("  -", f)

# ---- SPECIAL breakdown AI-free + matches non-AI ----
sp=[p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and is_special(p)]
if sp:
    _,sp_secs=parse(max(sp,key=os.path.getmtime))
    if any(base(s['type'])=="AI" for s in sp_secs): add("FAIL","SPECIAL breakdown contains AI sections")
    else:
        want=[s['num'] for s in secs if base(s['type'])!="AI"]; got=[s['num'] for s in sp_secs]
        add("PASS" if got==want else "FAIL", "SPECIAL matches the non-AI sections" if got==want else f"SPECIAL mismatch: {got} vs {want}")
else:
    add("WARN","No SPECIAL breakdown found to cross-check")

# ---- (r9) animation bundle coherence: [Subject]_allanimations.json <-> breakdown ----
# The bundle is delivered on its own (make_zip leaves it out), but it sits in the
# working folder root during the run, so the audit can prove it matches the breakdown:
# every HOOK/MAP section has exactly one map object (source_file = its type-ordinal
# name, timing = its TIMECODE) and every REF/CHAR section exactly one still with its
# required fields. A bundle that is missing is a WARN (older sets); a wrong one FAILs.
def _tord(secs_):
    # type-ordinal file names in running order: HOOK 1 / MAP 1..n / REF 1..n / CHAR 1..n
    cnt={"MAP":0,"REF":0,"CHAR":0}; out={}
    for s_ in secs_:
        b=base(s_['type'])
        if b=="HOOK": out[s_['num']]=("HOOK","HOOK 1")
        elif b in cnt: cnt[b]+=1; out[s_['num']]=(b,f"{b} {cnt[b]}")
    return out
def _bname(fn): return re.sub(r'\.[a-z0-9]+$','',(""+fn).lower()).replace("_"," ").strip()
bund=(glob.glob(f"{OUT}/*_allanimations.json")+glob.glob(f"{OUT}/*_allmaps.json"))
if not bund:
    add("WARN","No [Subject]_allanimations.json in the folder — bundle <-> breakdown coherence not checked")
else:
    bp=max(bund,key=os.path.getmtime); bfail=[]
    try:
        B=json.load(open(bp,encoding="utf-8"))
        maps=[m for m in (B.get("maps") or []) if isinstance(m,dict)]
        stills=[t for t in (B.get("stills") or []) if isinstance(t,dict)]
        want=_tord(secs)
        by_name={}
        for m in maps: by_name.setdefault(("map",_bname(m.get("source_file",""))),[]).append(m)
        for t in stills: by_name.setdefault(("still",_bname(t.get("source_file",""))),[]).append(t)
        TOL=60   # ms: stamping / rounding tolerance
        for s_ in secs:
            if s_['num'] not in want: continue
            b,fn=want[s_['num']]; key=("map" if b in ("HOOK","MAP") else "still", fn.lower())
            objs=by_name.pop(key,[])
            if len(objs)!=1:
                bfail.append(f"S{s_['num']} {s_['type']}: {len(objs)} bundle object(s) for '{fn}' (need exactly 1)"); continue
            o=objs[0]
            if 't0' in s_:
                cs_=o.get("comp_start_ms"); cd_=o.get("comp_duration_ms")
                if not isinstance(cs_,(int,float)) or abs(cs_-s_['t0'])>TOL: bfail.append(f"S{s_['num']} {fn}: comp_start_ms {cs_} vs TIMECODE {s_['t0']}")
                if not isinstance(cd_,(int,float)) or abs(cd_-(s_['t1']-s_['t0']))>TOL: bfail.append(f"S{s_['num']} {fn}: comp_duration_ms {cd_} vs TIMECODE {s_['t1']-s_['t0']}")
            if key[0]=="map":
                if not (o.get("locations") and len(o["locations"])): bfail.append(f"S{s_['num']} {fn}: map object has no locations")
                if o.get("time_base")!="comp_local": bfail.append(f"S{s_['num']} {fn}: time_base must be comp_local")
            else:
                st=(""+o.get("still_type","")).upper()
                if st!=b: bfail.append(f"S{s_['num']} {fn}: still_type {st!r} vs section type {b}")
                if o.get("time_base")!="comp_local": bfail.append(f"S{s_['num']} {fn}: time_base must be comp_local")
                if b=="REF":
                    f_=o.get("focus") or {}
                    if not (isinstance(f_.get("xNorm"),(int,float)) and 0<=f_["xNorm"]<=1 and isinstance(f_.get("yNorm"),(int,float)) and 0<=f_["yNorm"]<=1): bfail.append(f"S{s_['num']} {fn}: REF focus missing/out of range")
                    if (""+o.get("move","auto")).lower() not in ("auto","pullout","flyin_push"): bfail.append(f"S{s_['num']} {fn}: move")
                else:
                    if not o.get("name"): bfail.append(f"S{s_['num']} {fn}: CHAR still needs a display name")
                    if o.get("side") not in ("left","right"): bfail.append(f"S{s_['num']} {fn}: CHAR side must be left|right")
                    if o.get("background") not in ("dark","light","busy"): bfail.append(f"S{s_['num']} {fn}: CHAR background must be dark|light|busy (viewed)")
                    if (""+o.get("treatment","auto")).lower() not in ("auto","cutout","blend","framed"): bfail.append(f"S{s_['num']} {fn}: treatment")
        for k_,v_ in by_name.items():
            for o in v_: bfail.append(f"bundle {k_[0]} '{o.get('source_file')}' matches no {('HOOK/MAP' if k_[0]=='map' else 'REF/CHAR')} section")
    except Exception as eB:
        bfail.append(f"bundle unreadable: {eB}")
    add("FAIL" if bfail else "PASS",
        f"Animation bundle coherent with the breakdown ({os.path.basename(bp)}: {len(maps)} map(s), {len(stills)} still(s))" if not bfail
        else f"Animation bundle vs breakdown: {len(bfail)} issue(s) in {os.path.basename(bp)}")
    for x in bfail: add("  -", x)

# ---- nothing lost ----
src=glob.glob(f"{OUT}/*_source.txt")+glob.glob(f"{UP}/*_source.txt")
if src:
    sw=norm(open(max(src,key=os.path.getmtime),encoding="utf-8",errors="ignore").read())
    cw=norm(" ".join(s['script'] for s in sorted(secs,key=lambda s:s['num'])))
    add("PASS" if sw==cw else "FAIL", f"Section SCRIPTs reproduce the source ({len(cw)} words)" if sw==cw else f"Lost/changed text vs source (source {len(sw)} vs sections {len(cw)} words)")

fails=sum(1 for lv,_ in res if lv=="FAIL"); warns=sum(1 for lv,_ in res if lv=="WARN")
out=[f"# Review audit — {subj}","",f"**{fails} FAIL · {warns} WARN · {sum(1 for lv,_ in res if lv=='PASS')} PASS**",""]
for lv,msg in res:
    out.append(f"- {msg}" if lv=="  -" else f"- {'✅' if lv=='PASS' else '⚠️' if lv=='WARN' else '❌'} {msg}")
dest=f"{OUT}/{subj}_review_audit.md"; open(dest,"w",encoding="utf-8").write('\n'.join(out)+'\n')
for lv,msg in res: print(f"{lv if lv!='  -' else '   '} {msg}")
print(f"\nREVIEW AUDIT: {fails} FAIL / {warns} WARN")
print(f"Report: {dest}")
sys.exit(1 if fails else 0)
~~~~

### FILE: review_run.py

~~~~
#!/usr/bin/env python3
"""
REVIEW RUN — after you've fixed the FULL breakdown, regenerate everything from it
and re-check, in one command.

Order:
  1. format_lint        — gate: the corrected breakdown still matches the template
  2. REGENERATE (stop on first failure):
        time_breakdown -> make_special -> subtitles_from_timecodes -> word_level_srt
     so the SPECIAL breakdown and all three SRTs match the corrected FULL breakdown
  3. CHECK (these report, they do not stop the run):
        timing_check, review_audit
  4. FINALIZE (always run):
        make_diff      -> [Subject]_changes.md (old -> new vs the saved original)
        make_manifest  -> refreshed [Subject]_manifest.json (marked reviewed)
Prints a one-screen summary. Run it with the project folder:
    python3 review_run.py /mnt/user-data/outputs/[Subject]
"""
import os, sys, subprocess

if len(sys.argv)<2:
    sys.exit("Usage: python3 review_run.py /mnt/user-data/outputs/[Subject]")
FOLDER=sys.argv[1]; HERE=os.path.dirname(os.path.abspath(__file__))
LINT=["format_lint.py"]
REGEN=["time_breakdown.py","make_special.py","subtitles_from_timecodes.py","word_level_srt.py","make_auto_structure.py"]   # (r18) the auto structure follows the breakdown
CHECK=["timing_check.py","review_audit.py","auto_structure_lint.py","sfx_check.py","prompt_lint.py","description_check.py"]   # (r18) + detailed-prompt lint + YouTube description   # (r11/r12) the Conductor's two BONUS files: checked when present, skipped (WARN) when absent
FINAL=["make_diff.py","make_manifest.py","make_ai_prompts.py","make_zip.py"]   # (Q2) refresh the one-file handoff; (r16) + the AI prompts list

def run(script):
    path=os.path.join(HERE,script)
    if not os.path.exists(path): return None,"(missing)"
    p=subprocess.run([sys.executable,path,FOLDER],capture_output=True,text=True)
    out=(p.stdout or "")+(("\n"+p.stderr) if p.stderr.strip() else "")
    ls=[l for l in out.strip().split("\n") if l.strip()]
    print("\n".join("    "+l for l in ls[-5:]))
    return p.returncode,("ok" if p.returncode==0 else f"exit {p.returncode}")

results=[]; stopped=False
def phase(title, scripts, stop_on_fail):
    global stopped
    print(f"\n### {title} ###")
    for s in scripts:
        print(f"\n=== {s} ===")
        rc,st=run(s); results.append((s,st))
        if stop_on_fail and rc not in (0,None):
            print(f"\n[stopped] {s} failed; fix it and re-run."); stopped=True; return

phase("LINT", LINT, True)
if not stopped: phase("REGENERATE", REGEN, True)
if not stopped: phase("CHECK", CHECK, False)
if not stopped: phase("FINALIZE", FINAL, False)

print("\n================ SUMMARY ================")
for s,st in results:
    print(f"  {'✓' if st=='ok' else '✗'} {s:30} {st}")
hard_failed=[s for s,st in results if s in (LINT+REGEN) and st not in ("ok",)]   # CHECK failures (audit, auto structure, music) are reported below and still exit 1
checks_failed=[s for s,st in results if s in CHECK and st!="ok"]
if hard_failed:
    print("\nStopped before finishing — fix the breakdown, then re-run review_run.py."); sys.exit(1)
if checks_failed:
    print("\nReviewed, but some checks still flag issues — open the reports and fix, then re-run."); sys.exit(1)
print("\nClean. The regenerated package matches the corrected breakdown and passes timing + audit.")
print("Changes report and a refreshed manifest are in the folder.")
sys.exit(0)
~~~~

### FILE: run_all.py

~~~~
#!/usr/bin/env python3
"""
RUN ALL — run the whole mechanical pipeline for one project, in order, stopping
at the first failure, with a one-screen summary at the end.

Assumes the FULL breakdown is already written in the folder (that is your creative
work). Then it runs, in order:
  preflight -> format_lint -> prompt_lint -> time_breakdown -> make_special ->
  subtitles_from_timecodes -> word_level_srt -> make_auto_structure -> auto_structure_lint ->
  link_check -> make_download_links -> make_manifest -> make_ai_prompts -> make_zip
A non-zero exit from any step stops the chain. Run it with the project folder:
    python3 run_all.py /mnt/user-data/outputs/[Subject]
"""
import os, sys, subprocess

if len(sys.argv)<2:
    sys.exit('Usage: python3 run_all.py /mnt/user-data/outputs/[Subject] ["CHANNEL NAME"]')
FOLDER=sys.argv[1]
CHANNEL=sys.argv[2] if len(sys.argv)>2 else None   # (R3) pass the channel through to preflight
HERE=os.path.dirname(os.path.abspath(__file__))

# (script, args, stop_on_fail)
STEPS=[
    ("preflight.py",               ([FOLDER,CHANNEL] if CHANNEL else [FOLDER]), True),
    ("format_lint.py",             [FOLDER], True),
    ("prompt_lint.py",             [FOLDER], True),    # (r18) detailed, grounded prompts: word floors, verbatim suffix, dress/placement cues
    ("time_breakdown.py",          [FOLDER], True),
    ("make_special.py",            [FOLDER], True),
    ("subtitles_from_timecodes.py",[FOLDER], True),
    ("word_level_srt.py",          [FOLDER], True),
    ("make_auto_structure.py",     [FOLDER], True),    # (r18) Phase S2 is mechanical: one 20-s section = one part = PROMPT 1
    ("auto_structure_lint.py",     [FOLDER], True),
    ("link_check.py",              [FOLDER], True),
    ("make_download_links.py",     [FOLDER], True),   # (Q4) click-to-download index of link slot 1
    ("make_manifest.py",           [FOLDER], True),
    ("make_ai_prompts.py",         [FOLDER], False),   # (r16) one prompt per line for bulk image tools; never blocks
    ("make_zip.py",                [FOLDER], False),   # (Q2) one-file handoff; never blocks
]

results=[]
def tail(s,n=6):
    ls=[l for l in s.strip().split('\n') if l.strip()]
    return '\n'.join("    "+l for l in ls[-n:])

for script,args,stop in STEPS:
    path=os.path.join(HERE,script)
    print(f"\n=== {script} ===")
    if not os.path.exists(path):
        print(f"  (missing {script} — skipped)"); results.append((script,"MISSING")); 
        if stop: break
        continue
    p=subprocess.run([sys.executable,path]+args,capture_output=True,text=True)
    out=(p.stdout or "")+(("\n"+p.stderr) if p.stderr.strip() else "")
    print(tail(out))
    rc=p.returncode
    results.append((script,"ok" if rc==0 else f"exit {rc}"))
    if rc!=0 and stop:
        print(f"\n[stopped] {script} failed (exit {rc}); fix it and re-run.")
        break

print("\n================ SUMMARY ================")
for script,status in results:
    mark="✓" if status=="ok" else "✗"
    print(f"  {mark} {script:30} {status}")
failed=[s for s,st in results if st not in ("ok",)]
if not failed:
    print("\nAll steps passed. Deliverables are in the project folder.")
    sys.exit(0)
else:
    print(f"\n{len(failed)} step(s) need attention: "+", ".join(s for s,_ in [(s,0) for s in failed]))
    sys.exit(1)
~~~~

### FILE: selftest.py

~~~~
#!/usr/bin/env python3
"""
SELFTEST — (R7) golden-sample regression for the mechanical pipeline.

The chain time_breakdown -> make_special -> subtitles_from_timecodes ->
word_level_srt is DETERMINISTIC: identical inputs give byte-identical outputs.
This harness turns that into a permanent guard — run it after ANY script change.

  python3 selftest.py <fixture-folder> --freeze
      Regenerates the derived files in <fixture>/.selftest/ from the fixture's
      inputs (FULL breakdown + ASR .srt + .mp3 [+ word JSON] [+ suffixes txt]),
      records their SHA-256s into <fixture>/selftest_expected.json.

  python3 selftest.py <fixture-folder>
      Regenerates into a fresh scratch copy and byte-compares against the frozen
      hashes. Exit 0 = no drift; exit 1 = a script changed the outputs (lists
      which files, so intended changes are re-frozen deliberately, never silently).

The fixture stays a normal project folder (e.g. your Painted_Desert sample);
nothing in it is modified except .selftest/ and selftest_expected.json.
"""
import re, glob, os, sys, json, shutil, hashlib, subprocess

HERE=os.path.dirname(os.path.abspath(__file__))
args=[a for a in sys.argv[1:] if not a.startswith("--")]
if not args: sys.exit("Usage: python3 selftest.py <fixture-folder> [--freeze]")
FIX=os.path.abspath(args[0]); FREEZE=("--freeze" in sys.argv)
SCRATCH=os.path.join(FIX,".selftest")
EXPECT=os.path.join(FIX,"selftest_expected.json")
CHAIN=["time_breakdown.py","make_special.py","subtitles_from_timecodes.py","word_level_srt.py"]
DERIVED_PATTERNS=["*_breakdown.txt","*_special_breakdown.txt",
                  "*_full_timestamp_guidelines.srt","*_special_timestamp_guidelines.srt","*_word_level.srt"]

def sha(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for c in iter(lambda:f.read(65536),b""): h.update(c)
    return h.hexdigest()

def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p,encoding="utf-8",errors="ignore").read()))
    except Exception: return 0
def is_special(p):
    try: return "SPECIAL" in open(p,encoding="utf-8",errors="ignore").read(1500).upper().replace("SPECIAL:FILEPATH","")
    except Exception: return False

# ---- gather the fixture's INPUTS (FULL breakdown, ASR srt, mp3, word json, suffixes) ----
fulls=[p for p in glob.glob(f"{FIX}/*.txt") if is_breakdown(p) and not is_special(p)
       and "special" not in os.path.basename(p).lower()
       and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
if not fulls: sys.exit("Fixture has no FULL breakdown.")
FULL=max(fulls,key=is_breakdown)
srts=[s for s in glob.glob(f"{FIX}/*.srt") if not any(k in os.path.basename(s) for k in
      ("_timestamp_guidelines","_word_level","_sections_no_AI","_full_arranged"))]
mp3s=glob.glob(f"{FIX}/*.mp3")
inputs=[FULL]+srts+mp3s+glob.glob(f"{FIX}/*Channel_Prompt_Suffixes*.txt")
for j in glob.glob(f"{FIX}/*.json"):
    if not j.endswith(("_manifest.json","_resolved_links.json")) and os.path.basename(j)!="selftest_expected.json":
        inputs.append(j)   # a whisper word-level JSON, if the fixture uses one

# ---- rebuild in scratch ----
if os.path.isdir(SCRATCH): shutil.rmtree(SCRATCH)
os.makedirs(SCRATCH)
for p in inputs: shutil.copy(p, SCRATCH)
for s in CHAIN:
    r=subprocess.run([sys.executable, os.path.join(HERE,s), SCRATCH], capture_output=True, text=True)
    if r.returncode!=0:
        print(r.stdout); print(r.stderr, file=sys.stderr)
        sys.exit(f"selftest: {s} exited {r.returncode} — fix the script before freezing/comparing.")

got={}
for pat in DERIVED_PATTERNS:
    for p in sorted(glob.glob(os.path.join(SCRATCH,pat))):
        got[os.path.basename(p)]=sha(p)
if not got: sys.exit("selftest: the chain produced no derived files — check the fixture inputs.")

if FREEZE:
    json.dump({"chain":CHAIN,"files":got}, open(EXPECT,"w",encoding="utf-8"), indent=2)
    print(f"FROZEN {len(got)} derived-file hashes -> {EXPECT}")
    for k,v in got.items(): print(f"  {v[:16]}  {k}")
    sys.exit(0)

if not os.path.exists(EXPECT):
    sys.exit(f"No {os.path.basename(EXPECT)} yet — run once with --freeze to record the golden hashes.")
want=json.load(open(EXPECT,encoding="utf-8")).get("files",{})
drift=[k for k in sorted(set(want)|set(got)) if want.get(k)!=got.get(k)]
if drift:
    print(f"SELFTEST: DRIFT in {len(drift)} file(s):")
    for k in drift:
        print(f"  {k}\n    frozen: {want.get(k,'(absent)')[:16]}\n    now:    {got.get(k,'(absent)')[:16]}")
    print("If the change is INTENDED, re-freeze deliberately:  selftest.py <fixture> --freeze")
    sys.exit(1)
print(f"SELFTEST: OK — {len(got)} derived files byte-identical to the frozen golden set.")
~~~~

### FILE: sfx_check.py

~~~~
#!/usr/bin/env python3
"""
SFX CHECK — (r17) validates [Subject]_sfx.json (the ambience plan) against the stamped breakdown:
cues name real sections, ranges ordered, levels within -12..+3 dB, words present, ≤ 3 cues on any section.
Writes nothing. Exit 1 on FAIL. Optional argv[1] = the working folder.
"""
import glob, json, os, re, sys
args=[a for a in sys.argv[1:] if not a.startswith("--")]
OUT=(args[0] if args else "/mnt/user-data/outputs")
sfx=sorted(glob.glob(os.path.join(OUT,"*_sfx.json")))
bds=[p for p in sorted(glob.glob(os.path.join(OUT,"*_breakdown.txt"))) if "_original" not in p and "_special" not in p]
if not sfx: sys.exit("sfx_check: no *_sfx.json in the folder (Phase X writes it)")
if not bds: sys.exit("sfx_check: no *_breakdown.txt to check against")
R=json.load(open(sfx[0],encoding="utf-8")); text=open(bds[0],encoding="utf-8-sig").read()
secs=sorted(int(m) for m in re.findall(r"^SECTION\s+(\d+)\s*\|", text, re.M))
if not secs: sys.exit("sfx_check: the breakdown has no SECTION headers")
E,W=[],[]; cover={}
cues=R.get("cues") or []
if not cues: E.append("no cues — every video needs an ambience plan")
def num(x):
    if x is None: return None
    m=re.match(r"^S?0*(\d+)$", str(x).strip(), re.I); return int(m.group(1)) if m else None
for i,c in enumerate(cues,1):
    words=[w for w in re.findall(r"[a-z0-9]+", str(c.get("sound","")).lower()) if len(w)>2]
    if not words: E.append(f"cue {i}: no words in \"sound\"")
    elif len(words)==1 and words[0] in ("water","wind","sea","noise","sound","night","day"): W.append(f"cue {i}: \"{c.get('sound')}\" is a single generic word — add the place/texture (e.g. \"ocean waves shore\")")
    a,b=num(c.get("from")),num(c.get("to"))
    if c.get("fromMs") is not None and c.get("toMs") is not None:
        if c["toMs"]<=c["fromMs"]: E.append(f"cue {i}: toMs ≤ fromMs")
        continue
    if a is None or b is None: E.append(f"cue {i}: from/to must be section numbers"); continue
    if a not in secs or b not in secs: E.append(f"cue {i}: section {a if a not in secs else b} is not in the breakdown (sections {secs[0]}–{secs[-1]})"); continue
    if b<a: E.append(f"cue {i}: to ({b}) before from ({a})")
    lv=c.get("level",0)
    try: lv=float(lv)
    except Exception: E.append(f"cue {i}: level not a number"); lv=0
    if lv>3 or lv<-12: E.append(f"cue {i}: level {lv} dB out of range (-12…+3)")
    for s in range(a,b+1): cover[s]=cover.get(s,0)+1
for s,n in cover.items():
    if n>3: E.append(f"section {s}: {n} cues stacked (max 3)")
# long runs must breathe: a single cue covering more than ~6 minutes of sections with nothing else layered over any part of it
import collections
spans={}
for i,c in enumerate(cues,1):
    a,b=num(c.get("from")),num(c.get("to"))
    if a is None or b is None or a not in secs or b not in secs: continue
    spans[i]=(a,b)
tc={}
for m2 in re.finditer(r"^SECTION\s+(\d+)\s*\|[\s\S]*?TIMECODE:\s*(\d\d):(\d\d):(\d\d)\.(\d{3})\s*(?:→|->)\s*(\d\d):(\d\d):(\d\d)\.(\d{3})", text, re.M):
    g=m2.groups(); tc[int(g[0])]=(int(g[1])*3600+int(g[2])*60+int(g[3])+int(g[4])/1000, int(g[5])*3600+int(g[6])*60+int(g[7])+int(g[8])/1000)
for i,(a,b) in spans.items():
    if a in tc and b in tc:
        mins=(tc[b][1]-tc[a][0])/60
        others=[j for j,(x,y) in spans.items() if j!=i and not (y<a or x>b)]
        if mins>6 and len(others)<2: W.append(f"cue {i} (\"{cues[i-1].get('sound')}\") covers {mins:.0f} min with {len(others)} other cue(s) over it — long runs must breathe: add a texture every 2–3 minutes")
silent=[s for s in secs if s not in cover]
if silent: E.append(f"{len(silent)} section(s) have NO ambience ({silent[:8]}{'…' if len(silent)>8 else ''}) — the bed never goes silent: give every section at least a base layer")
# long stretches with nothing new: a texture should start every 3–5 minutes so the bed evolves on an hour-long video
starts=sorted(set(num(c.get("from")) for c in cues if num(c.get("from")) is not None))
tc=dict((int(m.group(1)), (int(m.group(2))*3600+int(m.group(3))*60+float(m.group(4)))) for m in re.finditer(r"^SECTION\s+(\d+)\s*\|[\s\S]*?TIMECODE:\s*(\d\d):(\d\d):(\d\d\.\d{3})", text, re.M))
if len(starts)>=2 and tc:
    for a,b in zip(starts, starts[1:]):
        if a in tc and b in tc and tc[b]-tc[a]>330: W.append(f"no new cue between sections {a} and {b} ({int((tc[b]-tc[a])//60)} min) — start a fresh texture every 3–5 minutes inside long runs")
for w in W: print("WARN  "+w)
for e in E: print("FAIL  "+e)
print(f"sfx_check: {len(cues)} cue(s), {len(secs)} section(s), {len(E)} FAIL, {len(W)} WARN")
sys.exit(1 if E else 0)
~~~~

### FILE: snap.py

~~~~
#!/usr/bin/env python3
"""
Snap each cue boundary in the rebuilt SRT to the MIDDLE of the LARGEST nearby
audio silence (so cuts land on real pauses, not tiny inter-word gaps). Uses ffmpeg's silencedetect on the uploaded .mp3. Keeps cues ordered,
non-overlapping, and clamped to the audio duration. If no .mp3 is present,
exits without changes (the rebuilt SRT remains the deliverable).
"""
import re, glob, os, sys, bisect, subprocess

# optional argv[1] = a single working folder (used for BOTH inputs and outputs),
# which keeps separate projects isolated when several run in one chat.
UP=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/uploads")
OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs")

# silence-detection knobs — adjust if the voiceover's noise floor differs
NOISE_DB="-30dB"      # quieter floor -> use -35dB; noisier room tone -> -25dB
MIN_SIL="0.25"        # minimum gap length (seconds) to count as silence
TOL_MS=2500           # only snap a boundary to a silence midpoint within this many ms

mp3s=glob.glob(f"{UP}/*.mp3")
srts=glob.glob(f"{OUT}/*_sections_no_AI.srt")
if not srts: sys.exit("Run rebuild.py first (no *_sections_no_AI.srt in outputs).")
SRT_IN=max(srts, key=os.path.getmtime)
if not mp3s:
    print("No .mp3 uploaded — skipping silence-snap; rebuilt SRT is the deliverable:")
    print(SRT_IN); sys.exit(0)
MP3=max(mp3s, key=os.path.getsize)

# ---------- audio duration ----------
def duration_ms(path):
    out=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1",path],
        capture_output=True,text=True).stdout.strip()
    return int(float(out)*1000)
DUR_MS=duration_ms(MP3)

# ---------- detect silences ----------
proc=subprocess.run(["ffmpeg","-i",MP3,"-af",
    f"silencedetect=noise={NOISE_DB}:d={MIN_SIL}","-f","null","-"],
    capture_output=True,text=True)
log=proc.stderr
starts=[float(x) for x in re.findall(r'silence_start:\s*([\d.]+)', log)]
ends  =[float(x) for x in re.findall(r'silence_end:\s*([\d.]+)',   log)]
gaps=[(int(s*1000),int(e*1000)) for s,e in zip(starts,ends)]
sil=sorted(((a+b)//2, max(0,b-a)) for a,b in gaps)   # (midpoint, duration)
mids=[m for m,_ in sil]
print(f"audio: {os.path.basename(MP3)}  dur={DUR_MS}ms  silence gaps={len(gaps)}")

# prefer the LARGEST silence within TOL of t (tie-break nearest) so boundaries
# land on real pauses rather than tiny inter-word gaps
def snap(t):
    if not sil: return t,False
    lo, hi = t-TOL_MS, t+TOL_MS
    cand=[(m,d) for (m,d) in sil if lo<=m<=hi]
    if not cand: return t,False
    cand.sort(key=lambda md:(-md[1], abs(md[0]-t)))
    return cand[0][0],True

# ---------- parse rebuilt SRT ----------
def ts(t): h,m,r=t.split(':'); s,x=r.split(','); return ((int(h)*60+int(m))*60+int(s))*1000+int(x)
raw=open(SRT_IN,encoding="utf-8-sig").read().replace('\r\n','\n').replace('\r','\n')
cues=[]
for b in raw.strip().split('\n\n'):
    L=b.split('\n'); m=re.match(r'(\S+)\s*-->\s*(\S+)',L[1])
    cues.append({'start':ts(m.group(1)),'end':ts(m.group(2)),'text':'\n'.join(L[2:])})

# ---------- snap boundaries ----------
ss=se=0
for c in cues:
    c['start'],o1=snap(c['start']); ss+=o1
    c['end'],  o2=snap(c['end']);   se+=o2

# ---------- clamp, order, de-overlap ----------
for c in cues:
    c['start']=max(0,min(c['start'],DUR_MS)); c['end']=max(0,min(c['end'],DUR_MS))
    if c['end']<=c['start']: c['end']=min(c['start']+500,DUR_MS)
for i in range(len(cues)-1):
    if cues[i]['end']>=cues[i+1]['start']:
        cues[i]['end']=cues[i+1]['start']-1
        if cues[i]['end']<=cues[i]['start']: cues[i]['end']=cues[i]['start']+1

# ---------- write ----------
def ms2srt(ms):
    s,ms=divmod(int(ms),1000); m,s=divmod(s,60); h,m=divmod(m,60)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
base=re.sub(r'(_sections_no_AI)?\.srt$','',os.path.basename(SRT_IN))
dest=f"{OUT}/{base}_special_timestamp_guidelines.srt"
out=[]
for i,c in enumerate(cues,1):
    out+=[str(i), f"{ms2srt(c['start'])} --> {ms2srt(c['end'])}", c['text'], ""]
open(dest,"w",encoding="utf-8").write("\r\n".join(out).rstrip("\r\n")+"\r\n")

ok=all(cues[i]['end']<=cues[i+1]['start'] for i in range(len(cues)-1))
print(f"cues: {len(cues)} | starts snapped: {ss}/{len(cues)} | ends snapped: {se}/{len(cues)}")
print(f"no overlaps: {ok}")
print(f"Output: {dest}")
~~~~

### FILE: subtitles_from_timecodes.py

~~~~
#!/usr/bin/env python3
"""
PASS 2 PRIMARY — subtitles straight from the breakdown's TIMECODE lines.

Reads the SPECIAL breakdown, takes each kept section's exact TIMECODE (written
by Pass 1's timing engine), drops AI sections, and writes the final
    <base>_special_timestamp_guidelines.srt
so the subtitle cues are the SAME timeline as the breakdown, to the millisecond.
Cue indices are the ORIGINAL section numbers (sparse), which the Setup panel's
Special mode requires to name/colour clips correctly.

If the breakdown has NO TIMECODE lines (an older breakdown, or Pass 1 timing was
skipped), this prints exactly  NO_TIMECODES  and exits 2, so the orchestrator
falls back to the original rebuild.py + snap.py chain.
"""
import re, glob, os, sys, subprocess

# optional argv[1] = a single working folder (used for BOTH inputs and outputs),
# which keeps separate projects isolated when several run in one chat.
UP=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/uploads")
OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs")
DROP_TYPES={"AI"}                       # section types (first token) to remove
os.makedirs(OUT, exist_ok=True)

# ---------- locate the SPECIAL breakdown (search outputs first, then uploads) ----------
def section_count(p):
    try: t=open(p,encoding="utf-8",errors="ignore").read()
    except: return 0
    return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', t))
cands=[(p,section_count(p)) for p in sorted(set(glob.glob(f"{OUT}/*.txt")+glob.glob(f"{UP}/*.txt")))]
cands=[x for x in cands if x[1]>0]
if not cands: sys.exit("No breakdown .txt (with 'SECTION N | NN words | TYPE' headers) found.")
def is_special(p):
    # NB: direct-download links use ".../wiki/Special:FilePath/...", so strip that
    # URL token before testing, or every breakdown with links looks "special".
    try: t=open(p,encoding="utf-8",errors="ignore").read(2000).upper()
    except: return False
    return "SPECIAL" in t.replace("SPECIAL:FILEPATH","")
specials=[x for x in cands if is_special(x[0])]
pool=specials if specials else cands
BREAKDOWN=max(pool, key=lambda x:x[1])[0]

# ---------- parse sections: number, type, TIMECODE (if any), SCRIPT paragraph ----------
lines=open(BREAKDOWN,encoding="utf-8").read().split('\n')
hdr=re.compile(r'^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$')
tcre=re.compile(r'TIMECODE:\s*(\d\d):(\d\d):(\d\d)[.,](\d{1,3})\s*(?:\u2192|-->|->|>)\s*'
                r'(\d\d):(\d\d):(\d\d)[.,](\d{1,3})')
def to_ms(h,m,s,frac): return ((int(h)*60+int(m))*60+int(s))*1000+int(frac.ljust(3,'0'))

sections=[]; i=0
while i<len(lines):
    h=hdr.match(lines[i])
    if h:
        j=i+1; tc=None
        while j<len(lines) and lines[j].strip()!='SCRIPT:':
            mt=tcre.search(lines[j])
            if mt: tc=mt
            j+=1
        k=j+1; buf=[]
        while k<len(lines) and lines[k].strip()!='' and not lines[k].startswith('MAP SUBJECT:'):
            buf.append(lines[k].strip()); k+=1
        rec={'num':int(h.group(1)),'type':h.group(3).strip(),
             'script':re.sub(r'\s+',' ',' '.join(buf)).strip()}
        if tc:
            g=tc.groups()
            rec['start']=to_ms(*g[:4]); rec['end']=to_ms(*g[4:])
        sections.append(rec); i=k
    else: i+=1

timed=[s for s in sections if 'start' in s]
if not timed:
    print("NO_TIMECODES"); sys.exit(2)

kept=[s for s in timed if s['type'].split()[0].upper() not in DROP_TYPES]
kept.sort(key=lambda s:s['start'])

# ---------- optional clamp to audio duration ----------
mp3s=glob.glob(f"{UP}/*.mp3"); DUR_MS=None
if mp3s:
    MP3=max(mp3s,key=os.path.getsize)
    try:
        out=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
            "-of","default=noprint_wrappers=1:nokey=1",MP3],
            capture_output=True,text=True).stdout.strip()
        DUR_MS=int(float(out)*1000)
    except Exception: DUR_MS=None

for c in kept:
    if DUR_MS:
        c['start']=max(0,min(c['start'],DUR_MS)); c['end']=max(0,min(c['end'],DUR_MS))
    if c['end']<=c['start']: c['end']=c['start']+500
for i in range(len(kept)-1):                       # keep cues touching, never overlapping
    if kept[i]['end']>kept[i+1]['start']:
        kept[i]['end']=kept[i+1]['start']-1
        # (R8) if the next cue starts within 1ms of this cue's start the input is
        # degenerate; the 1ms floor below may still touch/overlap it — the "No
        # overlaps" check at the end surfaces that case instead of hiding it.
        if kept[i]['end']<=kept[i]['start']: kept[i]['end']=kept[i]['start']+1

# ---------- write final SRT (text = breakdown SCRIPT, correct spelling) ----------
# CUE NUMBERING (B1): each cue carries its ORIGINAL full-breakdown section number
# (sparse: 1, 7, 9, ...), NOT a sequential 1..K. The Setup panel joins cues to the
# breakdown BY THIS INDEX in Special mode; players ignore SRT indices, so this is safe.
def ms2srt(x):
    s,x=divmod(int(x),1000); m,s=divmod(s,60); h,m=divmod(m,60)
    return f"{h:02d}:{m:02d}:{s:02d},{x:03d}"
base=re.sub(r'(_special)?(_breakdown)?\.txt$','',os.path.basename(BREAKDOWN))
dest=f"{OUT}/{base}_special_timestamp_guidelines.srt"
o=[]
for c in kept:
    o+=[str(c['num']), f"{ms2srt(c['start'])} --> {ms2srt(c['end'])}", c['script'], ""]
open(dest,"w",encoding="utf-8").write("\r\n".join(o).rstrip("\r\n")+"\r\n")

# ---------- report ----------
print(f"Breakdown: {os.path.basename(BREAKDOWN)}{' (SPECIAL)' if specials else ''}")
print(f"Sections with timecodes: {len(timed)} | kept (non-AI): {len(kept)}")
ok=all(kept[i]['end']<=kept[i+1]['start'] for i in range(len(kept)-1))
print(f"No overlaps: {ok}")
if kept: print(f"Coverage: {ms2srt(kept[0]['start'])} -> {ms2srt(kept[-1]['end'])}")
print(f"Output: {dest}")
~~~~

### FILE: suffixes.py

~~~~
#!/usr/bin/env python3
"""
suffixes.py — the ONE parser for Channel_Prompt_Suffixes.txt (import it; or run it to print a channel).

A channel block starts at "CHANNELS: [NAME] [NAME2]" and ends at a dashed line or the next CHANNELS line.
Inside, in any order: DESCRIPTION: (template lines until PINNED COMMENT: / SUFFIX: / a key line),
PINNED COMMENT: …, SUFFIX: … (one line), rule keys (AI_TARGET_S …), AMBIENCE_LUFS: n (comment),
AMBIENCE (…): palette lines (indented) until the block ends.
    parse_suffix_file(path) -> {"CHANNEL NAME": {"suffix", "rules", "description", "pinned_comment",
                                                 "ambience_lufs", "ambience", "tags"}}
    python3 suffixes.py <file> ["[CHANNEL]"]
"""
import re, sys

KEYS = ("MAX_SECTION_S", "TAIL_AFTER_MIN", "TAIL_MAX_S", "TAIL_TYPE", "AI_TARGET_S", "AI_TOL_S", "AI_MAX_S", "AI_PROMPTS", "ALT_PROMPTS",
        "PROMPT_MIN_WORDS", "ALT_MIN_WORDS")
DEFAULT_RULES = {"MAX_SECTION_S": "30", "AI_TARGET_S": "20", "AI_TOL_S": "2", "AI_MAX_S": "25", "AI_PROMPTS": "1", "ALT_PROMPTS": "1",
                 "PROMPT_MIN_WORDS": "90", "ALT_MIN_WORDS": "60"}

def find_suffix_file(*dirs):
    import glob, os
    for d in dirs:
        if not d: continue
        for p in glob.glob(os.path.join(d, "*Channel_Prompt_Suffixes*.txt")) + glob.glob(os.path.join(d, "**", "Channel_Prompt_Suffixes.txt"), recursive=True):
            return p
    return None

def revision_of(path):
    m = re.search(r"PROMPT-SET REVISION\s+(\S+)", open(path, encoding="utf-8-sig", errors="ignore").read())
    return m.group(1) if m else None

def parse_suffix_file(path):
    raw = open(path, encoding="utf-8-sig", errors="ignore").read().replace("\r\n", "\n").replace("\r", "\n")
    lines = raw.split("\n"); out = {}; i = 0
    while i < len(lines):
        if not lines[i].startswith("CHANNELS:"): i += 1; continue
        tags = [t.strip() for t in re.findall(r"\[([^\]]+)\]", lines[i])]
        blk = {"tags": tags, "suffix": "", "rules": {}, "description": [], "pinned_comment": "", "ambience_lufs": None, "ambience": []}
        j = i + 1; mode = None
        while j < len(lines) and not lines[j].startswith("CHANNELS:") and not (lines[j].strip() and set(lines[j].strip()) <= {"-", "="} and len(lines[j].strip()) >= 10):
            ln = lines[j]
            if ln.startswith("DESCRIPTION:"): mode = "desc"; j += 1; continue
            if ln.startswith("PINNED COMMENT:"): blk["pinned_comment"] = ln[len("PINNED COMMENT:"):].strip(); mode = None; j += 1; continue
            if ln.startswith("SUFFIX:"): blk["suffix"] = ln[len("SUFFIX:"):].strip(); mode = None; j += 1; continue
            mk = re.match(r"\s*(" + "|".join(KEYS) + r")\s*:\s*(\S+)", ln)
            if mk: blk["rules"][mk.group(1)] = mk.group(2).strip(); mode = None; j += 1; continue
            ml = re.match(r"\s*AMBIENCE_LUFS\s*:\s*(-?\d+(?:\.\d+)?)", ln)
            if ml: blk["ambience_lufs"] = float(ml.group(1)); mode = None; j += 1; continue
            if re.match(r"\s*AMBIENCE\b", ln): mode = "amb"; blk["ambience"].append(ln.strip()); j += 1; continue
            if mode == "desc": blk["description"].append(ln.rstrip())
            elif mode == "amb" and ln.strip(): blk["ambience"].append(ln.rstrip())
            j += 1
        while blk["description"] and not blk["description"][-1].strip(): blk["description"].pop()
        for t in tags: out[t.upper()] = blk
        i = j
    return out

def rules_for(block):
    r = dict(DEFAULT_RULES); r.update(block.get("rules") or {}); return r

if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(__doc__)
    ch = parse_suffix_file(sys.argv[1])
    want = sys.argv[2].strip("[]").upper() if len(sys.argv) > 2 else None
    for k, b in ch.items():
        if want and k != want: continue
        print(f"[{k}] suffix={b['suffix'][:70]}…  rules={rules_for(b)}  ambience_lufs={b['ambience_lufs']}  description_lines={len(b['description'])}  pinned={'yes' if b['pinned_comment'] else 'no'}")
~~~~

### FILE: time_breakdown.py

~~~~
#!/usr/bin/env python3
"""
PASS 1 - EXACT TIMING ENGINE.
Reads the draft FULL breakdown (already written to OUT with `TIMECODE: [PENDING]`
lines), aligns every section's SCRIPT paragraph to the ASR transcript (.srt),
snaps each inter-section boundary to the MIDDLE of the LARGEST nearby silence,
and writes each section's exact TIMECODE + DURATION back into the breakdown file.
Also writes the FULL timestamp-guidelines SRT (one cue per section, ALL sections,
including AI) as a deliverable and the timing source. Uses the SUBTITLER alignment+snap technology verbatim.

If no ASR .srt is present, falls back to word-count estimates (flagged
APPROXIMATE). The .mp3 is required for the silence snap; without it, boundaries
are the raw aligned/estimated times (also flagged).
"""
import re, glob, os, sys, bisect, subprocess
from difflib import SequenceMatcher

# optional argv[1] = a single working folder (used for BOTH inputs and outputs),
# which keeps separate projects isolated when several run in one chat.
UP=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/uploads")
OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs")

import json
def _extract_words(data):
    out=[]
    def add(w):
        if not isinstance(w,dict): return
        tok=w.get("word", w.get("text")); st=w.get("start"); en=w.get("end")
        if tok is None or st is None or en is None: return
        try: st=float(st); en=float(en)
        except Exception: return
        out.append((int(round(st*1000)), int(round(en*1000)), str(tok)))
    if isinstance(data,dict) and isinstance(data.get("segments"),list):
        for seg in data["segments"]:
            for w in (seg.get("words") or []): add(w)
        if out: return out
    if isinstance(data,dict) and isinstance(data.get("words"),list):
        for w in data["words"]: add(w)
        if out: return out
    if isinstance(data,list):
        for w in data: add(w)
    return out
def load_word_json():
    seen=set()
    for d in (UP, OUT):
        for p in sorted(glob.glob(f"{d}/*.json")):
            if p in seen: continue
            seen.add(p)
            try: data=json.load(open(p,encoding="utf-8"))
            except Exception: continue
            ws=_extract_words(data)
            if len(ws)>=3: return p, ws
    return None, []

# --- shared silence-snap knobs (MUST match Pass 2 so breakdown == subtitles) ---
NOISE_DB="-30dB"
MIN_SIL="0.25"
TOL_MS=2500
MIN_SEC_MS=1000     # never let the snap create a section shorter than this
MAX_SEC_MS=30000    # normal-section ceiling for the snap (30s cap)

# (B5) channel-aware tail ceiling: for a channel with a tail rule (e.g. [FALLEN
# CIVILIZATION]), boundaries past the tail mark may sit up to TAIL_MAX_S from the
# previous cut, so tail sections still get silence-snapped instead of raw times.
def _find_suffix_list_tb(folder):
    here=os.path.dirname(os.path.abspath(__file__))
    for d in (folder,"/mnt/user-data/uploads",here,os.getcwd()):
        for p in glob.glob(f"{d}/*Channel_Prompt_Suffixes*.txt")+glob.glob(f"{d}/*hannel*uffix*.txt"):
            return p
    return None
def _parse_overrides_tb(path):
    raw=open(path,encoding="utf-8-sig",errors="ignore").read().replace('\r\n','\n').replace('\r','\n')
    ls=raw.split('\n'); res={}; i=0
    while i<len(ls):
        if ls[i].startswith("CHANNELS:"):
            tags=re.findall(r'\[([^\]]+)\]', ls[i]); ov={}; j=i+1
            while j<len(ls) and not ls[j].startswith("CHANNELS:") and set(ls[j].strip())!={'-'}:
                mm=re.match(r'\s*(MAX_SECTION_S|TAIL_AFTER_MIN|TAIL_MAX_S|TAIL_TYPE|AI_TARGET_S|AI_TOL_S|AI_MAX_S|AI_PROMPTS|ALT_PROMPTS)\s*:\s*(.+?)\s*$', ls[j])
                if mm:
                    k=mm.group(1); ov[k]=(mm.group(2).strip().upper() if k=="TAIL_TYPE" else int(mm.group(2)))
                j+=1
            if ov:
                for t in tags: res[t.strip().upper()]=ov
            i=j
        else: i+=1
    return res
def _channel_rules_tb(channel, folder):
    caps={'MAX_SECTION_S':30,'TAIL_AFTER_MIN':None,'TAIL_MAX_S':None,'TAIL_TYPE':'AI','AI_TARGET_S':20,'AI_TOL_S':2,'AI_MAX_S':25,'AI_PROMPTS':1,'ALT_PROMPTS':1}   # (r16) every AI section ≈ 20 s (18–22, 25 ceiling) on EVERY channel by default; (r15) ONE prompt per section
    key=(channel or "").strip().strip("[]").upper()
    if key=="FALLEN CIVILIZATION": caps.update({'TAIL_AFTER_MIN':30,'TAIL_MAX_S':90,'TAIL_TYPE':'AI'})
    sp=_find_suffix_list_tb(folder)
    if sp:
        ov=_parse_overrides_tb(sp).get(key)
        if ov:
            for k,v in ov.items(): caps[k]=v
    return caps

# locate the draft full breakdown that THIS pass just wrote
def is_breakdown(p):
    try: t=open(p,encoding="utf-8",errors="ignore").read()
    except: return 0
    return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', t))
def header_is_special(p):
    # ignore the Special:FilePath download-URL token when checking the header
    try: t=open(p,encoding="utf-8",errors="ignore").read(2000).upper()
    except: return False
    return "SPECIAL" in t.replace("SPECIAL:FILEPATH","")
cands=[(p,is_breakdown(p)) for p in glob.glob(f"{OUT}/*.txt")]
cands=[x for x in cands if x[1]>0
       and 'special' not in os.path.basename(x[0]).lower()
       and '_original' not in os.path.basename(x[0]).lower()   # (r8) the pristine review copy is never the FULL
       and not header_is_special(x[0])]
if not cands: sys.exit("No draft FULL breakdown (.txt with SECTION headers) found in outputs.")
BREAKDOWN=max(cands,key=lambda x:x[1])[0]

srts=[s for s in glob.glob(f"{UP}/*.srt")
      if "_timestamp_guidelines" not in os.path.basename(s)
      and "_sections_no_AI" not in os.path.basename(s)
      and "_word_level" not in os.path.basename(s)
      and not s.endswith("_full_arranged.srt")]
SRT=max(srts,key=os.path.getsize) if srts else None
mp3s=glob.glob(f"{UP}/*.mp3"); MP3=max(mp3s,key=os.path.getsize) if mp3s else None

def duration_ms(path):
    out=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1",path],
        capture_output=True,text=True).stdout.strip()
    return int(float(out)*1000)
DUR_MS=duration_ms(MP3) if MP3 else None

lines=open(BREAKDOWN,encoding="utf-8").read().split('\n')
hdr=re.compile(r'^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$')
secs=[]; i=0
while i<len(lines):
    h=hdr.match(lines[i])
    if h:
        j=i+1
        while j<len(lines) and lines[j].strip()!='SCRIPT:': j+=1
        k=j+1; buf=[]
        while k<len(lines) and lines[k].strip()!='' and not lines[k].startswith('MAP SUBJECT:'):
            buf.append(lines[k].strip()); k+=1
        secs.append({'num':int(h.group(1)),'type':h.group(3).strip(),
                     'hdr_i':i,'script':re.sub(r'\s+',' ',' '.join(buf)).strip()})
        i=k
    else: i+=1
if not secs: sys.exit("No sections parsed from breakdown.")

def words(t): return re.findall(r'[a-z0-9]+', t.lower())

mode="EXACT"
WJSON, wjwords = load_word_json()
if WJSON or SRT:
    def ts_to_ms(ts):
        h,m,rest=ts.split(':'); s,ms=rest.split(',')
        return ((int(h)*60+int(m))*60+int(s))*1000+int(ms)
    if WJSON:
        # BEST: real per-word timestamps -> one cue per word, so alignment lands
        # on exact word times instead of interpolating within ASR chunks.
        srt=[{'start':st,'end':en,'text':tok} for (st,en,tok) in wjwords]
        mode="EXACT (word-level JSON: per-word timestamps)"
    else:
        raw=open(SRT,encoding="utf-8-sig").read().replace('\r\n','\n').replace('\r','\n')
        srt=[]
        for b in re.split(r'\n\s*\n', raw.strip()):
            L=b.split('\n')
            if len(L)<3: continue
            m=re.match(r'(\d\d:\d\d:\d\d,\d+)\s*-->\s*(\d\d:\d\d:\d\d,\d+)', L[1])
            if not m: continue
            srt.append({'start':ts_to_ms(m.group(1)),'end':ts_to_ms(m.group(2)),
                        'text':' '.join(L[2:]).strip()})
    stream=[]; meta=[]
    for ei,e in enumerate(srt):
        ws=words(e['text']); cnt=len(ws)
        for kk,w in enumerate(ws): stream.append(w); meta.append((ei,kk,cnt))
    N=len(stream)
    def best_pos(anc, lo, hi):
        L=len(anc); best=(-1,-1); hi=min(hi,N-L)
        for i in range(max(0,lo),hi+1):
            sc=sum(1 for kk in range(L) if stream[i+kk]==anc[kk])
            if sc>best[1]: best=(i,sc)
            if sc==L: break
        return best
    def global_pos(anc, lo):
        L=len(anc); best=(-1,-1)
        for i in range(max(0,lo),N-L+1):
            sc=sum(1 for kk in range(L) if stream[i+kk]==anc[kk])
            if sc>best[1]: best=(i,sc)
            if sc==L: break
        return best
    def align(sw, floor):
        n=len(sw); anc=sw[:min(10,n)]
        rs,sc=global_pos(anc, floor)
        if rs<0: rs,sc=best_pos(anc, floor, floor+2000)
        if rs<0: rs=min(floor, N-1)
        lo=max(0,rs-3); hi=min(N, rs+n+40)
        blocks=[b for b in SequenceMatcher(None,sw,stream[lo:hi],autojunk=False).get_matching_blocks() if b.size>0]
        if blocks:
            fb,lb=blocks[0],blocks[-1]
            s=lo+max(0,fb.b-fb.a); e=lo+(lb.b+lb.size-1)+max(0,(n-1)-(lb.a+lb.size-1))
        else: s,e=rs,rs+n-1
        e=min(e, s+n+2); s=max(0,min(s,N-1)); e=max(s,min(e,N-1))
        return s,e
    def w_start(g): ei,k,c=meta[g]; t0,t1=srt[ei]['start'],srt[ei]['end']; return t0+round((t1-t0)*k/c)
    def w_end(g):   ei,k,c=meta[g]; t0,t1=srt[ei]['start'],srt[ei]['end']; return t0+round((t1-t0)*(k+1)/c)
    cursor=0
    for s in secs:
        sw=words(s['script']); a,b=align(sw,cursor)
        s['start']=w_start(a); s['end']=w_end(b); cursor=a+1
else:
    mode="APPROXIMATE (no ASR .srt)"
    total_words=sum(len(words(s['script'])) for s in secs)
    if not DUR_MS: sys.exit("Need either an ASR .srt or an .mp3 to time sections.")
    wps=total_words/(DUR_MS/1000.0) if total_words else 1.0
    t=0.0
    for s in secs:
        n=len(words(s['script'])); s['start']=int(t*1000); t+=n/wps; s['end']=int(t*1000)

sil=[]   # (midpoint_ms, duration_ms), sorted by midpoint
if MP3:
    proc=subprocess.run(["ffmpeg","-i",MP3,"-af",
        f"silencedetect=noise={NOISE_DB}:d={MIN_SIL}","-f","null","-"],
        capture_output=True,text=True)
    log=proc.stderr
    st=[float(x) for x in re.findall(r'silence_start:\s*([\d.]+)', log)]
    en=[float(x) for x in re.findall(r'silence_end:\s*([\d.]+)',   log)]
    sil=sorted(((int(a*1000)+int(b*1000))//2, max(0,int((b-a)*1000)))
               for a,b in zip(st,en))
else:
    mode=mode+" (no .mp3: boundaries not silence-snapped)"
mids=[m for m,_ in sil]

_hdr_chan=re.search(r'(?im)^\s*CHANNEL:\s*(.+?)\s*$', '\n'.join(lines[:40]))
_CAPS=_channel_rules_tb(_hdr_chan.group(1) if _hdr_chan else None, OUT)
def _max_ms_at(prev, sec=None):
    # (B5, r8) the tail begins at the LAST section boundary at or before the tail mark,
    # so its first section may start up to one normal section (+5s grace) before the
    # mark; from that boundary on, a tail-rule channel may run to TAIL_MAX_S.
    if _CAPS['TAIL_AFTER_MIN'] is not None and prev >= _CAPS['TAIL_AFTER_MIN']*60000 - MAX_SEC_MS - 5000:
        return int(_CAPS['TAIL_MAX_S'] or _CAPS['MAX_SECTION_S'])*1000
    # (r13) on a channel with an AI target (e.g. [OLDWORLDPROOF]: AI sections ~30 s, 28–32 fine),
    # an AI section may run to AI_MAX_S so the pause nearest the target can be chosen
    if sec is not None and str(sec.get('type','')).split()[0].upper()=="AI" and _CAPS.get('AI_TARGET_S'):
        return int(_CAPS.get('AI_MAX_S') or max(int(_CAPS['AI_TARGET_S'])+int(_CAPS.get('AI_TOL_S') or 2), int(_CAPS['MAX_SECTION_S'])))*1000
    return MAX_SEC_MS

# Snap a boundary to a silence, PREFERRING THE LARGEST nearby gap so cuts fall on
# real pauses (sentence breaks), not tiny inter-word gaps. The chosen pause stays
# after the previous boundary and never stretches the section past its ceiling
# (30s for normal sections; the channel's TAIL_MAX_S inside a tail).
def snap(t, prev, sec=None):
    if not sil: return t
    lo, hi = t-TOL_MS, t+TOL_MS
    cand=[(m,d) for (m,d) in sil
          if lo<=m<=hi and m>prev+MIN_SEC_MS and (m-prev)<_max_ms_at(prev, sec)]
    if not cand: return t
    # (r13) an AI section on an AI-target channel: among the big pauses, prefer the one that
    # lands the section nearest the target length — that is the channel's rule.
    # (r14) never inside a tail: tail sections keep their own ~TAIL_MAX_S rule.
    in_tail = _CAPS['TAIL_AFTER_MIN'] is not None and prev >= _CAPS['TAIL_AFTER_MIN']*60000 - MAX_SEC_MS - 5000
    if sec is not None and not in_tail and str(sec.get('type','')).split()[0].upper()=="AI" and _CAPS.get('AI_TARGET_S'):
        tgt=prev+int(_CAPS['AI_TARGET_S'])*1000; big=[md for md in cand if md[1]>=0.35]
        pool=big if big else cand
        pool.sort(key=lambda md:(abs(md[0]-tgt), -md[1])); return pool[0][0]
    cand.sort(key=lambda md:(-md[1], abs(md[0]-t)))   # largest gap, then nearest
    return cand[0][0]

n=len(secs)
B=[0]*(n+1)
B[0]=0
for k in range(1,n):
    B[k]=snap(secs[k-1]['end'], B[k-1], secs[k-1])
B[n]=DUR_MS if DUR_MS else secs[-1]['end']
for k in range(1,n+1):
    if B[k]<=B[k-1]: B[k]=B[k-1]+1
    if DUR_MS and B[k]>DUR_MS: B[k]=DUR_MS
for k in range(n):
    secs[k]['t0']=B[k]; secs[k]['t1']=B[k+1]

def hms(ms):
    ms=int(ms); s,mss=divmod(ms,1000); m,s=divmod(s,60); h,m=divmod(m,60)
    return f"{h:02d}:{m:02d}:{s:02d}.{mss:03d}"
def srtts(ms):
    ms=int(ms); s,mss=divmod(ms,1000); m,s=divmod(s,60); h,m=divmod(m,60)
    return f"{h:02d}:{m:02d}:{s:02d},{mss:03d}"

for s in secs:
    tc=f"TIMECODE: {hms(s['t0'])} \u2192 {hms(s['t1'])}  |  DURATION: {(s['t1']-s['t0'])/1000:.2f}s"
    j=s['hdr_i']+1; placed=False
    while j<len(lines) and lines[j].strip()!='SCRIPT:':
        if lines[j].strip().upper().startswith('TIMECODE'):
            lines[j]=tc; placed=True; break
        j+=1
    if not placed:
        ins=s['hdr_i']+1
        if ins<len(lines) and set(lines[ins].strip())=={'-'}: ins+=1
        lines.insert(ins, tc)
        for s2 in secs:
            if s2['hdr_i']>=ins: s2['hdr_i']+=1
open(BREAKDOWN,"w",encoding="utf-8").write('\n'.join(lines))

base=re.sub(r'(_breakdown)?\.txt$','',os.path.basename(BREAKDOWN))
arr=f"{OUT}/{base}_full_timestamp_guidelines.srt"
o=[]
for i,s in enumerate(secs,1):
    o+=[str(i), f"{srtts(s['t0'])} --> {srtts(s['t1'])}", s['script'], ""]
open(arr,"w",encoding="utf-8").write("\r\n".join(o).rstrip("\r\n")+"\r\n")

print(f"Breakdown: {os.path.basename(BREAKDOWN)}")
print(f"Timing mode: {mode}")
print(f"ASR srt: {os.path.basename(SRT) if SRT else 'NONE'} | word JSON: {os.path.basename(WJSON) if WJSON else 'NONE'} | mp3: {os.path.basename(MP3) if MP3 else 'NONE'} | silence gaps: {len(mids)}")
print(f"Sections timed: {n} | coverage: {hms(B[0])} -> {hms(B[n])}")
mono=all(B[k]<B[k+1] for k in range(n))
print(f"Monotonic boundaries: {mono}")
print(f"FULL timestamp-guidelines SRT: {arr}")
print("Per-section:")
for s in secs:
    print(f"  S{s['num']:>2} {s['type']:<8} {hms(s['t0'])} -> {hms(s['t1'])}  ({(s['t1']-s['t0'])/1000:.2f}s)")
~~~~

### FILE: timing_check.py

~~~~
#!/usr/bin/env python3
"""
TIMING CHECK — is each section's TIMECODE actually accurate to the script?

Independent of how the timecodes were first produced: for every section it reads
the ASR words spoken DURING that section's [start,end] window and compares them to
the section's SCRIPT. High agreement = the timecode really bounds that section's
narration; low agreement = the section is mis-timed (its words are spoken somewhere
else). It also locates the section's opening words in the transcript and reports how
far that is from the stamped start. Writes [Subject]_timing_check.md and exits 1 if
anything is flagged, so the reviewer knows exactly which sections to re-time.

Optional argv[1] = the working folder for inputs and outputs.
"""
import re, glob, os, sys
from difflib import SequenceMatcher

OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs")
UP=OUT

SIM_FAIL=0.55      # script-vs-audio agreement below this = mis-timed
SIM_WARN=0.75      # below this = worth a look
DRIFT_MS=4000      # opening words found this far from the stamped start = flag

hdr=re.compile(r'^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$')
tcre=re.compile(r'TIMECODE:\s*(\d\d):(\d\d):(\d\d)[.,](\d{1,3})\s*(?:\u2192|-->|->|>)\s*'
                r'(\d\d):(\d\d):(\d\d)[.,](\d{1,3})')
def to_ms(h,m,s,f): return ((int(h)*60+int(m))*60+int(s))*1000+int(f.ljust(3,'0'))
norm=lambda s: re.findall(r"[a-z0-9]+", s.lower())

def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p,encoding="utf-8",errors="ignore").read()))
    except Exception: return 0
def is_special(p):
    try: return "SPECIAL" in open(p,encoding="utf-8",errors="ignore").read(1500).upper().replace("SPECIAL:FILEPATH","")
    except Exception: return False

cands=[p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and not is_special(p)
       and "special" not in os.path.basename(p).lower()
       and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
if not cands: sys.exit("No FULL breakdown found in the folder.")
FULL=max(cands,key=is_breakdown)
L=open(FULL,encoding="utf-8").read().split('\n')

# sections: number, type, SCRIPT, t0, t1
idx=[i for i,l in enumerate(L) if hdr.match(l)]
secs=[]
for n,a in enumerate(idx):
    b=idx[n+1] if n+1<len(idx) else len(L); blk=L[a:b]; h=hdr.match(L[a])
    s_i=next((q for q,l in enumerate(blk) if l.strip()=='SCRIPT:'), None)
    script=""
    if s_i is not None:
        buf=[]; q=s_i+1
        while q<len(blk) and blk[q].strip()!='' and not blk[q].startswith('MAP SUBJECT:'): buf.append(blk[q].strip()); q+=1
        script=' '.join(buf)
    tc=None
    for l in (blk[:s_i] if s_i is not None else blk):
        m=tcre.search(l)
        if m: tc=m
    rec={'num':int(h.group(1)),'type':h.group(3).strip(),'script':script}
    if tc: g=tc.groups(); rec['t0']=to_ms(*g[:4]); rec['t1']=to_ms(*g[4:])
    secs.append(rec)

# ASR srt (exclude generated files)
srts=[s for s in glob.glob(f"{UP}/*.srt")
      if not any(k in os.path.basename(s) for k in ("_timestamp_guidelines","_word_level","_sections_no_AI","_full_arranged"))]
if not srts: sys.exit("No ASR .srt found to check timing against.")
SRT=max(srts,key=os.path.getsize)
raw=open(SRT,encoding="utf-8-sig",errors="ignore").read().replace('\r\n','\n').replace('\r','\n')
cues=[]
for blk in re.split(r'\n\s*\n', raw.strip()):
    ls=blk.split('\n')
    if len(ls)<2: continue
    m=re.match(r'(\d\d):(\d\d):(\d\d)[.,](\d{1,3})\s*-->\s*(\d\d):(\d\d):(\d\d)[.,](\d{1,3})', ls[1])
    if not m: continue
    g=m.groups(); cues.append((to_ms(*g[:4]), to_ms(*g[4:]), ' '.join(ls[2:])))
asr_words=[]   # (t_mid, word)
for t0,t1,txt in cues:
    ws=norm(txt)
    for k,w in enumerate(ws):
        asr_words.append((t0+(t1-t0)*k//max(1,len(ws)), w))

def window_words(t0,t1):
    return [w for (tm,w) in asr_words if t0-500<=tm<=t1+500]
def find_phrase_time(anchor, t0):
    # (B4) the section's opening n-gram can occur MORE THAN ONCE in the narration;
    # return the occurrence NEAREST the stamped start, not the first one globally.
    L=len(anchor); seq=[w for (_,w) in asr_words]; best=None
    for i in range(len(seq)-L+1):
        if seq[i:i+L]==anchor:
            t=asr_words[i][0]
            if best is None or abs(t-t0)<abs(best-t0): best=t
    return best

rows=[]; fails=0; warns=0
for s in secs:
    if 't0' not in s or not s['script'].strip():
        rows.append((s,"-","-","no timecode/script")); continue
    sw=norm(s['script']); ww=window_words(s['t0'],s['t1'])
    sim=SequenceMatcher(None, sw, ww).ratio() if sw and ww else 0.0
    pt=None                                   # (B4) try longer anchors first (less ambiguous), fall back to 4
    for AL in (8,6,4):
        if len(sw)>=AL:
            pt=find_phrase_time(sw[:AL], s['t0'])
            if pt is not None: break
    drift=(pt-s['t0']) if pt is not None else None
    flag=""
    big_drift = (drift is not None and abs(drift)>DRIFT_MS)
    # (B4) a large "drift" alone is not evidence when the window content itself
    # matches strongly (sim >= 0.90): the opening n-gram either repeats elsewhere
    # in the narration or is ASR-garbled at the true start. Only corroborated
    # drift (weak-ish sim) earns a flag; strong-sim drift is shown with a dagger.
    if sim<SIM_FAIL: flag="MIS-TIMED"; fails+=1
    elif sim<SIM_WARN or (big_drift and sim<0.90): flag="check"; warns+=1
    dcell = ("%+.1fs"%(drift/1000)) if drift is not None else "n/a"
    if big_drift and not flag: dcell += "\u2020"
    rows.append((s,f"{sim:.2f}",dcell,flag or "ok"))

def mmss(ms): s=ms//1000; return f"{s//60:02d}:{s%60:02d}"
out=[f"# Timing check — {re.sub(r'(_breakdown)?.txt$','',os.path.basename(FULL))}","",
     f"ASR: `{os.path.basename(SRT)}`  ·  sections: {len(secs)}  ·  "
     f"flagged mis-timed: {fails}  ·  worth a look: {warns}","",
     "| Section | Window | Script↔audio | Start drift | Verdict |",
     "| --- | --- | --- | --- | --- |"]
for s,sim,dr,verdict in rows:
    win=f"{mmss(s['t0'])}–{mmss(s['t1'])}" if 't0' in s else "—"
    mark={"ok":"✅","check":"⚠️","MIS-TIMED":"❌"}.get(verdict,"")
    out.append(f"| S{s['num']} {s['type']} | {win} | {sim} | {dr} | {mark} {verdict} |")
out+=["","Script↔audio is how closely the words spoken inside the timecode match the "
      "section's SCRIPT (1.00 = perfect). Anything ❌ MIS-TIMED means the audio there "
      "is NOT that section's lines — fix the section composition and re-time.",
      "","† the section's opening words also occur elsewhere in the narration (or are "
      "ASR-garbled at the true start); the window content itself matches, so this is not flagged."]
dest=f"{OUT}/{re.sub(r'(_breakdown)?.txt$','',os.path.basename(FULL))}_timing_check.md"
open(dest,"w",encoding="utf-8").write('\n'.join(out)+'\n')
print(f"FULL breakdown: {os.path.basename(FULL)} | ASR: {os.path.basename(SRT)}")
print(f"Sections: {len(secs)} | MIS-TIMED: {fails} | check: {warns}")
print(f"Timing report: {dest}")
sys.exit(1 if fails else 0)
~~~~

### FILE: word_level_srt.py

~~~~
#!/usr/bin/env python3
"""
WORD-LEVEL SRT — one cue per single word, timed from the real timeline.

Re-emits the project's ASR transcript as a strictly word-level SRT: EVERY
whitespace-separated token becomes its own cue (never lines, phrases, or
paragraphs), timed by splitting each ASR cue's [start,end] window proportionally
across its words — the same per-word interpolation the timing engine uses. The
text is the ASR's own words, so each timed cue is exactly the word spoken in that
slice. Output: [Subject]_word_level.srt (CRLF, sequential, non-overlapping).

If no ASR .srt is present, falls back to the FULL timestamp-guidelines SRT
([Subject]_full_timestamp_guidelines.srt) and splits each section cue evenly
across its words (APPROXIMATE — flagged on stdout).

Optional argv[1] = a single working folder used for BOTH inputs and outputs,
which keeps separate projects isolated when several run in one chat.
"""
import os, re, sys, glob

UP =(sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/uploads")
OUT=(sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/outputs")

import json
def _extract_words(data):
    out=[]
    def add(w):
        if not isinstance(w,dict): return
        tok=w.get("word", w.get("text")); st=w.get("start"); en=w.get("end")
        if tok is None or st is None or en is None: return
        try: st=float(st); en=float(en)
        except Exception: return
        out.append((int(round(st*1000)), int(round(en*1000)), str(tok)))
    if isinstance(data,dict) and isinstance(data.get("segments"),list):
        for seg in data["segments"]:
            for w in (seg.get("words") or []): add(w)
        if out: return out
    if isinstance(data,dict) and isinstance(data.get("words"),list):
        for w in data["words"]: add(w)
        if out: return out
    if isinstance(data,list):
        for w in data: add(w)
    return out
def load_word_json():
    seen=set()
    for d in (UP, OUT):
        for p in sorted(glob.glob(f"{d}/*.json")):
            if p in seen: continue
            seen.add(p)
            try: data=json.load(open(p,encoding="utf-8"))
            except Exception: continue
            ws=_extract_words(data)
            if len(ws)>=3: return p, ws
    return None, []

def ts_to_ms(s):
    h, m, rest = s.split(':'); sec, ms = rest.split(',')
    return ((int(h) * 60 + int(m)) * 60 + int(sec)) * 1000 + int(ms)

def srtts(ms):
    ms = max(0, int(round(ms))); s, mss = divmod(ms, 1000); m, s = divmod(s, 60); h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d},{mss:03d}"

# --- locate the FULL breakdown (only to derive the [Subject] name) ---
def is_breakdown(p):
    try: t = open(p, encoding="utf-8", errors="ignore").read()
    except Exception: return 0
    return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', t))
def header_is_special(p):
    head = "\n".join(open(p, encoding="utf-8", errors="ignore").read().splitlines()[:8]).upper()
    return "SPECIAL" in head
bds  = [p for p in glob.glob(f"{OUT}/*.txt") + glob.glob(f"{UP}/*.txt") if is_breakdown(p)
        and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
full = [p for p in bds if not header_is_special(p)]
BREAKDOWN = max(full, key=os.path.getsize) if full else (max(bds, key=os.path.getsize) if bds else None)

# --- the ASR transcript: ignore our own generated SRTs ---
srts = [s for s in glob.glob(f"{UP}/*.srt") + glob.glob(f"{OUT}/*.srt")
        if "_timestamp_guidelines" not in os.path.basename(s)
        and "_word_level" not in os.path.basename(s)
        and "_sections_no_AI" not in os.path.basename(s)
        and not s.endswith("_full_arranged.srt")]
SRT = max(srts, key=os.path.getsize) if srts else None

if BREAKDOWN:
    base = re.sub(r'(_special)?(_breakdown)?\.txt$', '', os.path.basename(BREAKDOWN))
elif SRT:
    base = re.sub(r'\.srt$', '', os.path.basename(SRT))
else:
    sys.exit("Need an ASR .srt (or a breakdown to name the file) to build the word-level SRT.")
dest = f"{OUT}/{base}_word_level.srt"

def parse_srt(path):
    raw = open(path, encoding="utf-8-sig", errors="ignore").read().replace('\r\n', '\n').replace('\r', '\n')
    cues = []
    for blk in re.split(r'\n\s*\n', raw.strip()):
        L = blk.split('\n')
        if len(L) < 2: continue
        m = re.match(r'(\d\d:\d\d:\d\d,\d{1,3})\s*-->\s*(\d\d:\d\d:\d\d,\d{1,3})', L[1])
        if not m: continue
        cues.append((ts_to_ms(m.group(1)), ts_to_ms(m.group(2)), ' '.join(L[2:]).strip()))
    return cues

# --- choose the timing source, best first ---
words = []   # [start_ms, end_ms, token]
WJSON, wjwords = load_word_json()
if wjwords:
    # BEST: real per-word timestamps (e.g. Whisper word_timestamps JSON)
    mode = f"EXACT (per-word timestamps from {os.path.basename(WJSON)})"
    SRC_NAME = os.path.basename(WJSON)
    for st, en, tok in wjwords:
        if tok.strip(): words.append([st, en, tok.strip()])
else:
    # else split each cue of the ASR srt (or, failing that, the section SRT)
    if SRT:
        src = SRT; mode = "EXACT (one cue per ASR word, interpolated within each chunk)"
    else:
        cands = glob.glob(f"{OUT}/*_full_timestamp_guidelines.srt") + glob.glob(f"{UP}/*_full_timestamp_guidelines.srt")
        if not cands:
            sys.exit("No word JSON, no ASR .srt, and no *_full_timestamp_guidelines.srt — run time_breakdown.py first.")
        src = max(cands, key=os.path.getmtime)
        mode = "APPROXIMATE (no ASR .srt; even split of each section cue across its words)"
    SRC_NAME = os.path.basename(src)
    for t0, t1, text in parse_srt(src):
        toks = [w for w in text.split() if w.strip()]
        c = len(toks)
        if c == 0: continue
        span = max(0, t1 - t0)
        for k, w in enumerate(toks):
            words.append([t0 + round(span * k / c), t0 + round(span * (k + 1) / c), w])

if not words:
    sys.exit("No words found in the source to write.")

# --- keep cues ordered, non-overlapping, and at least 1 ms long ---
words.sort(key=lambda x: (x[0], x[1]))
prev_end = -1
for w in words:
    if w[0] < prev_end: w[0] = prev_end
    if w[1] <= w[0]:    w[1] = w[0] + 1
    prev_end = w[1]

o = []
for i, (ws, we, tok) in enumerate(words, 1):
    o += [str(i), f"{srtts(ws)} --> {srtts(we)}", tok, ""]
open(dest, "w", encoding="utf-8").write("\r\n".join(o).rstrip("\r\n") + "\r\n")

print(f"Word-level timing mode: {mode}")
print(f"Source: {SRC_NAME}")
print(f"Words (one cue each): {len(words)} | coverage: {srtts(words[0][0])} -> {srtts(words[-1][1])}")
print(f"WORD-LEVEL SRT: {dest}")
~~~~

### FILE: BUNDLE_VERSION.txt

~~~~
2026-10-06-r18
~~~~

## Extractor (run this in the chat's computer, from an empty work dir)

~~~~
import re, hashlib, pathlib, sys
src = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
blocks = re.findall(r"### FILE: (.+?)\n\n~~~~\n(.*?)\n~~~~", src, re.S)
table = dict(re.findall(r"\| `(.+?)` \| \d+ \| `([0-9a-f]{64})` \|", src))
for name, body in blocks:
    data = (body + "\n").encode("utf-8")
    h = hashlib.sha256(data).hexdigest()
    ok = table.get(name) == h
    pathlib.Path(name).parent.mkdir(parents=True, exist_ok=True)
    pathlib.Path(name).write_bytes(data)
    print(("OK  " if ok else "HASH-MISMATCH ") + name)
~~~~
