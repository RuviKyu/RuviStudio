#!/usr/bin/env python3
"""
MAKE MANIFEST — write [Subject]_manifest.json describing the whole package.

A small self-describing handoff file so the Review tool (or a human) can pick the
package up without re-asking: it records the subject, channel and locked STYLE
SUFFIX, the section count, whether timing is EXACT (an ASR .srt was present) or
APPROXIMATE, the audio file with its duration and SHA-256, the resolved per-channel
rules (length caps + any tail rule, so the reviewer can enforce them without the
suffixes file), and every output file with its size and hash. If a *_changes.md is
present it marks the package as reviewed.

Optional argv[1] = the working folder.
"""
import re, glob, os, sys, json, hashlib, subprocess, datetime

OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs")
def sha(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for c in iter(lambda:f.read(65536),b""): h.update(c)
    return h.hexdigest()[:16]
def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p,encoding="utf-8",errors="ignore").read()))
    except Exception: return 0
def is_special(p):
    try: return "SPECIAL" in open(p,encoding="utf-8",errors="ignore").read(1500).upper().replace("SPECIAL:FILEPATH","")
    except Exception: return False

# ---- per-channel rule resolver (suffixes file overrides; FALLEN CIVILIZATION fallback) ----
def find_suffix_list(folder):
    here=os.path.dirname(os.path.abspath(__file__))
    for d in (folder,"/mnt/user-data/uploads",here,os.getcwd()):
        for p in glob.glob(f"{d}/*Channel_Prompt_Suffixes*.txt")+glob.glob(f"{d}/*hannel*uffix*.txt"):
            return p
    return None
def parse_overrides(path):
    raw=open(path,encoding="utf-8-sig",errors="ignore").read().replace('\r\n','\n').replace('\r','\n')
    lines=raw.split('\n'); res={}; i=0
    while i<len(lines):
        if lines[i].startswith("CHANNELS:"):
            tags=re.findall(r'\[([^\]]+)\]', lines[i]); ov={}; j=i+1
            while j<len(lines) and not lines[j].startswith("CHANNELS:") and set(lines[j].strip())!={'-'}:
                mm=re.match(r'\s*(MAX_SECTION_S|TAIL_AFTER_MIN|TAIL_MAX_S|TAIL_TYPE|AI_TARGET_S|AI_TOL_S|AI_MAX_S|AI_PROMPTS|ALT_PROMPTS)\s*:\s*(.+?)\s*$', lines[j])
                if mm: k=mm.group(1); ov[k]=(mm.group(2).strip().upper() if k=="TAIL_TYPE" else int(mm.group(2)))
                j+=1
            if ov:
                for t in tags: res[t.strip().upper()]=ov
            i=j
        else: i+=1
    return res
def channel_rules(channel, folder):
    caps={'MAX_SECTION_S':30,'TAIL_AFTER_MIN':None,'TAIL_MAX_S':None,'TAIL_TYPE':'AI','AI_TARGET_S':None,'AI_TOL_S':2,'AI_MAX_S':None,'AI_PROMPTS':1,'ALT_PROMPTS':1}   # (r13) AI_* = per-channel AI-section rules; (r15) ONE prompt per section everywhere by default
    key=(channel or "").strip().strip("[]").upper()
    if key=="FALLEN CIVILIZATION": caps.update({'TAIL_AFTER_MIN':30,'TAIL_MAX_S':90,'TAIL_TYPE':'AI'})
    sp=find_suffix_list(folder)
    if sp:
        ov=parse_overrides(sp).get(key)
        if ov:
            for k,v in ov.items(): caps[k]=v
    return caps

cands=[p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and not is_special(p)
       and "special" not in os.path.basename(p).lower()
       and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
if not cands: sys.exit("No FULL breakdown found in the folder.")
FULL=max(cands,key=is_breakdown); subj=re.sub(r'(_breakdown)?.txt$','',os.path.basename(FULL))
head=open(FULL,encoding="utf-8").read(4000)
channel=(re.search(r'(?im)^\s*CHANNEL:\s*(.+?)\s*$', head) or [None,None])
channel=channel.group(1).strip() if hasattr(channel,'group') else None
suffix=(re.search(r'(?im)^\s*STYLE SUFFIX:\s*"(.+?)"\s*$', head))
suffix=suffix.group(1).strip() if suffix else None
nsec=is_breakdown(FULL)

mp3s=glob.glob(f"{OUT}/*.mp3"); MP3=max(mp3s,key=os.path.getsize) if mp3s else None
dur=None
if MP3:
    r=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1",MP3],capture_output=True,text=True)
    try: dur=round(float(r.stdout.strip()),2)
    except Exception: dur=None
srts=[s for s in glob.glob(f"{OUT}/*.srt") if not any(k in os.path.basename(s) for k in
      ("_timestamp_guidelines","_word_level","_sections_no_AI","_full_arranged"))]
SRT=max(srts,key=os.path.getsize) if srts else None

# (R1) timing_mode comes from the breakdown HEADER (the run's own declaration),
# not from file presence — a stray/mismatched .srt can no longer relabel a run.
_tm=re.search(r'(?im)^\s*SECTION TIMECODES:\s*(EXACT|APPROXIMATE)', head)
TIMING_MODE=_tm.group(1).upper() if _tm else ("EXACT" if SRT else "APPROXIMATE")
warnings=[]
if not _tm: warnings.append("breakdown header has no SECTION TIMECODES line; timing_mode inferred from file presence")
if not MP3: warnings.append("no .mp3 in the project folder — audio block is empty; the reviewer cannot verify the voiceover against this manifest")

# (R6) record the suffix file's PROMPT-SET REVISION so builder/reviewer runs are comparable
def _suffix_revision(folder):
    p=find_suffix_list(folder)
    if not p: return None
    try:
        mm=re.search(r'PROMPT-SET REVISION\s+(\S+)', open(p,encoding="utf-8-sig",errors="ignore").read())
        return mm.group(1) if mm else None
    except Exception: return None
PROMPT_REV=_suffix_revision(OUT)

files=[]
for p in sorted(glob.glob(f"{OUT}/*")):
    if os.path.isfile(p) and not p.endswith("_manifest.json"):
        files.append({"name":os.path.basename(p),"bytes":os.path.getsize(p),"sha256_16":sha(p)})

man={
 "subject":subj,
 "channel":channel,
 "style_suffix":suffix,
 "sections":nsec,
 "timing_mode":TIMING_MODE,
 "prompt_set_revision":PROMPT_REV,
 "warnings":warnings,
 "audio":{"name":os.path.basename(MP3) if MP3 else None,"duration_s":dur,
          "sha256_16":sha(MP3) if MP3 else None},
 "transcript":os.path.basename(SRT) if SRT else None,
 "channel_rules":channel_rules(channel, OUT),
 "reviewed":bool(glob.glob(f"{OUT}/*_changes.md")),
 "generated_at":datetime.datetime.now().isoformat(timespec="seconds"),
 "files":files,
}
dest=f"{OUT}/{subj}_manifest.json"; open(dest,"w",encoding="utf-8").write(json.dumps(man,indent=2,ensure_ascii=False)+"\n")
for w in warnings: print(f"[warn] {w}")
print(f"Manifest: {dest}")
print(f"  {subj} | channel {channel} | {nsec} sections | {man['timing_mode']} | "
      f"{len(files)} files | reviewed={man['reviewed']}")
print(f"  rules: max {man['channel_rules']['MAX_SECTION_S']}s"+
      (f", tail {man['channel_rules']['TAIL_TYPE']} after {man['channel_rules']['TAIL_AFTER_MIN']}min up to {man['channel_rules']['TAIL_MAX_S']}s"
       if man['channel_rules']['TAIL_AFTER_MIN'] else ", no tail rule"))
