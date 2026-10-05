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
