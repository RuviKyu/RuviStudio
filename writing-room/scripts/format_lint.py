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
