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
