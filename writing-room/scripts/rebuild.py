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
