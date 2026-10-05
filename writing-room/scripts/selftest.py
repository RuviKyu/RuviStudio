#!/usr/bin/env python3
"""
SELFTEST — (R7) golden-sample regression for the mechanical pipeline.

The chain time_breakdown -> make_special -> subtitles_from_timecodes ->
word_level_srt is DETERMINISTIC: identical inputs give byte-identical outputs.
This harness turns that into a permanent guard — run it after ANY script change.

  python3 selftest.py <fixture-folder> --freeze
      Regenerates the derived files in <fixture>/.selftest/ from the fixture's
      inputs (FULL breakdown + ASR .srt + .mp3 [+ word JSON] [+ suffixes txt]),
      records their SHA-256s into <fixture>/selftest_expected.json.

  python3 selftest.py <fixture-folder>
      Regenerates into a fresh scratch copy and byte-compares against the frozen
      hashes. Exit 0 = no drift; exit 1 = a script changed the outputs (lists
      which files, so intended changes are re-frozen deliberately, never silently).

The fixture stays a normal project folder (e.g. your Painted_Desert sample);
nothing in it is modified except .selftest/ and selftest_expected.json.
"""
import re, glob, os, sys, json, shutil, hashlib, subprocess

HERE=os.path.dirname(os.path.abspath(__file__))
args=[a for a in sys.argv[1:] if not a.startswith("--")]
if not args: sys.exit("Usage: python3 selftest.py <fixture-folder> [--freeze]")
FIX=os.path.abspath(args[0]); FREEZE=("--freeze" in sys.argv)
SCRATCH=os.path.join(FIX,".selftest")
EXPECT=os.path.join(FIX,"selftest_expected.json")
CHAIN=["time_breakdown.py","make_special.py","subtitles_from_timecodes.py","word_level_srt.py"]
DERIVED_PATTERNS=["*_breakdown.txt","*_special_breakdown.txt",
                  "*_full_timestamp_guidelines.srt","*_special_timestamp_guidelines.srt","*_word_level.srt"]

def sha(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for c in iter(lambda:f.read(65536),b""): h.update(c)
    return h.hexdigest()

def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p,encoding="utf-8",errors="ignore").read()))
    except Exception: return 0
def is_special(p):
    try: return "SPECIAL" in open(p,encoding="utf-8",errors="ignore").read(1500).upper().replace("SPECIAL:FILEPATH","")
    except Exception: return False

# ---- gather the fixture's INPUTS (FULL breakdown, ASR srt, mp3, word json, suffixes) ----
fulls=[p for p in glob.glob(f"{FIX}/*.txt") if is_breakdown(p) and not is_special(p)
       and "special" not in os.path.basename(p).lower()
       and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
if not fulls: sys.exit("Fixture has no FULL breakdown.")
FULL=max(fulls,key=is_breakdown)
srts=[s for s in glob.glob(f"{FIX}/*.srt") if not any(k in os.path.basename(s) for k in
      ("_timestamp_guidelines","_word_level","_sections_no_AI","_full_arranged"))]
mp3s=glob.glob(f"{FIX}/*.mp3")
inputs=[FULL]+srts+mp3s+glob.glob(f"{FIX}/*Channel_Prompt_Suffixes*.txt")
for j in glob.glob(f"{FIX}/*.json"):
    if not j.endswith(("_manifest.json","_resolved_links.json")) and os.path.basename(j)!="selftest_expected.json":
        inputs.append(j)   # a whisper word-level JSON, if the fixture uses one

# ---- rebuild in scratch ----
if os.path.isdir(SCRATCH): shutil.rmtree(SCRATCH)
os.makedirs(SCRATCH)
for p in inputs: shutil.copy(p, SCRATCH)
for s in CHAIN:
    r=subprocess.run([sys.executable, os.path.join(HERE,s), SCRATCH], capture_output=True, text=True)
    if r.returncode!=0:
        print(r.stdout); print(r.stderr, file=sys.stderr)
        sys.exit(f"selftest: {s} exited {r.returncode} — fix the script before freezing/comparing.")

got={}
for pat in DERIVED_PATTERNS:
    for p in sorted(glob.glob(os.path.join(SCRATCH,pat))):
        got[os.path.basename(p)]=sha(p)
if not got: sys.exit("selftest: the chain produced no derived files — check the fixture inputs.")

if FREEZE:
    json.dump({"chain":CHAIN,"files":got}, open(EXPECT,"w",encoding="utf-8"), indent=2)
    print(f"FROZEN {len(got)} derived-file hashes -> {EXPECT}")
    for k,v in got.items(): print(f"  {v[:16]}  {k}")
    sys.exit(0)

if not os.path.exists(EXPECT):
    sys.exit(f"No {os.path.basename(EXPECT)} yet — run once with --freeze to record the golden hashes.")
want=json.load(open(EXPECT,encoding="utf-8")).get("files",{})
drift=[k for k in sorted(set(want)|set(got)) if want.get(k)!=got.get(k)]
if drift:
    print(f"SELFTEST: DRIFT in {len(drift)} file(s):")
    for k in drift:
        print(f"  {k}\n    frozen: {want.get(k,'(absent)')[:16]}\n    now:    {got.get(k,'(absent)')[:16]}")
    print("If the change is INTENDED, re-freeze deliberately:  selftest.py <fixture> --freeze")
    sys.exit(1)
print(f"SELFTEST: OK — {len(got)} derived files byte-identical to the frozen golden set.")
