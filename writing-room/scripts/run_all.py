#!/usr/bin/env python3
"""
RUN ALL — run the whole mechanical pipeline for one project, in order, stopping
at the first failure, with a one-screen summary at the end.

Assumes the FULL breakdown is already written in the folder (that is your creative
work). Then it runs, in order:
  preflight -> format_lint -> prompt_lint -> time_breakdown -> make_special ->
  subtitles_from_timecodes -> word_level_srt -> make_auto_structure -> auto_structure_lint ->
  link_check -> make_download_links -> make_manifest -> make_ai_prompts -> make_zip
A non-zero exit from any step stops the chain. Run it with the project folder:
    python3 run_all.py /mnt/user-data/outputs/[Subject]
"""
import os, sys, subprocess

if len(sys.argv)<2:
    sys.exit('Usage: python3 run_all.py /mnt/user-data/outputs/[Subject] ["CHANNEL NAME"]')
FOLDER=sys.argv[1]
CHANNEL=sys.argv[2] if len(sys.argv)>2 else None   # (R3) pass the channel through to preflight
HERE=os.path.dirname(os.path.abspath(__file__))

# (script, args, stop_on_fail)
STEPS=[
    ("preflight.py",               ([FOLDER,CHANNEL] if CHANNEL else [FOLDER]), True),
    ("format_lint.py",             [FOLDER], True),
    ("prompt_lint.py",             [FOLDER], True),    # (r18) detailed, grounded prompts: word floors, verbatim suffix, dress/placement cues
    ("time_breakdown.py",          [FOLDER], True),
    ("make_special.py",            [FOLDER], True),
    ("subtitles_from_timecodes.py",[FOLDER], True),
    ("word_level_srt.py",          [FOLDER], True),
    ("make_auto_structure.py",     [FOLDER], True),    # (r18) Phase S2 is mechanical: one 20-s section = one part = PROMPT 1
    ("auto_structure_lint.py",     [FOLDER], True),
    ("link_check.py",              [FOLDER], True),
    ("make_download_links.py",     [FOLDER], True),   # (Q4) click-to-download index of link slot 1
    ("make_manifest.py",           [FOLDER], True),
    ("make_ai_prompts.py",         [FOLDER], False),   # (r16) one prompt per line for bulk image tools; never blocks
    ("make_zip.py",                [FOLDER], False),   # (Q2) one-file handoff; never blocks
]

results=[]
def tail(s,n=6):
    ls=[l for l in s.strip().split('\n') if l.strip()]
    return '\n'.join("    "+l for l in ls[-n:])

for script,args,stop in STEPS:
    path=os.path.join(HERE,script)
    print(f"\n=== {script} ===")
    if not os.path.exists(path):
        print(f"  (missing {script} — skipped)"); results.append((script,"MISSING")); 
        if stop: break
        continue
    p=subprocess.run([sys.executable,path]+args,capture_output=True,text=True)
    out=(p.stdout or "")+(("\n"+p.stderr) if p.stderr.strip() else "")
    print(tail(out))
    rc=p.returncode
    results.append((script,"ok" if rc==0 else f"exit {rc}"))
    if rc!=0 and stop:
        print(f"\n[stopped] {script} failed (exit {rc}); fix it and re-run.")
        break

print("\n================ SUMMARY ================")
for script,status in results:
    mark="✓" if status=="ok" else "✗"
    print(f"  {mark} {script:30} {status}")
failed=[s for s,st in results if st not in ("ok",)]
if not failed:
    print("\nAll steps passed. Deliverables are in the project folder.")
    sys.exit(0)
else:
    print(f"\n{len(failed)} step(s) need attention: "+", ".join(s for s,_ in [(s,0) for s in failed]))
    sys.exit(1)
