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
