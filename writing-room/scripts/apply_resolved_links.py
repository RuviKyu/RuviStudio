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
