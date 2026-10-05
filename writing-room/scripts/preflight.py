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
