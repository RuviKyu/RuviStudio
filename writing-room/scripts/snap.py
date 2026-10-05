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
