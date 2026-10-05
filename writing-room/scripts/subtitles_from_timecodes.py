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
