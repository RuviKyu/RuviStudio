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
