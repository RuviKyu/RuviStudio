#!/usr/bin/env python3
"""
REVIEW RUN — after you've fixed the FULL breakdown, regenerate everything from it
and re-check, in one command.

Order:
  1. format_lint        — gate: the corrected breakdown still matches the template
  2. REGENERATE (stop on first failure):
        time_breakdown -> make_special -> subtitles_from_timecodes -> word_level_srt
     so the SPECIAL breakdown and all three SRTs match the corrected FULL breakdown
  3. CHECK (these report, they do not stop the run):
        timing_check, review_audit
  4. FINALIZE (always run):
        make_diff      -> [Subject]_changes.md (old -> new vs the saved original)
        make_manifest  -> refreshed [Subject]_manifest.json (marked reviewed)
Prints a one-screen summary. Run it with the project folder:
    python3 review_run.py /mnt/user-data/outputs/[Subject]
"""
import os, sys, subprocess

if len(sys.argv)<2:
    sys.exit("Usage: python3 review_run.py /mnt/user-data/outputs/[Subject]")
FOLDER=sys.argv[1]; HERE=os.path.dirname(os.path.abspath(__file__))
LINT=["format_lint.py"]
REGEN=["time_breakdown.py","make_special.py","subtitles_from_timecodes.py","word_level_srt.py","make_auto_structure.py"]   # (r18) the auto structure follows the breakdown
CHECK=["timing_check.py","review_audit.py","auto_structure_lint.py","sfx_check.py","prompt_lint.py","description_check.py"]   # (r18) + detailed-prompt lint + YouTube description   # (r11/r12) the Conductor's two BONUS files: checked when present, skipped (WARN) when absent
FINAL=["make_diff.py","make_manifest.py","make_ai_prompts.py","make_zip.py"]   # (Q2) refresh the one-file handoff; (r16) + the AI prompts list

def run(script):
    path=os.path.join(HERE,script)
    if not os.path.exists(path): return None,"(missing)"
    p=subprocess.run([sys.executable,path,FOLDER],capture_output=True,text=True)
    out=(p.stdout or "")+(("\n"+p.stderr) if p.stderr.strip() else "")
    ls=[l for l in out.strip().split("\n") if l.strip()]
    print("\n".join("    "+l for l in ls[-5:]))
    return p.returncode,("ok" if p.returncode==0 else f"exit {p.returncode}")

results=[]; stopped=False
def phase(title, scripts, stop_on_fail):
    global stopped
    print(f"\n### {title} ###")
    for s in scripts:
        print(f"\n=== {s} ===")
        rc,st=run(s); results.append((s,st))
        if stop_on_fail and rc not in (0,None):
            print(f"\n[stopped] {s} failed; fix it and re-run."); stopped=True; return

phase("LINT", LINT, True)
if not stopped: phase("REGENERATE", REGEN, True)
if not stopped: phase("CHECK", CHECK, False)
if not stopped: phase("FINALIZE", FINAL, False)

print("\n================ SUMMARY ================")
for s,st in results:
    print(f"  {'✓' if st=='ok' else '✗'} {s:30} {st}")
hard_failed=[s for s,st in results if s in (LINT+REGEN) and st not in ("ok",)]   # CHECK failures (audit, auto structure, music) are reported below and still exit 1
checks_failed=[s for s,st in results if s in CHECK and st!="ok"]
if hard_failed:
    print("\nStopped before finishing — fix the breakdown, then re-run review_run.py."); sys.exit(1)
if checks_failed:
    print("\nReviewed, but some checks still flag issues — open the reports and fix, then re-run."); sys.exit(1)
print("\nClean. The regenerated package matches the corrected breakdown and passes timing + audit.")
print("Changes report and a refreshed manifest are in the folder.")
sys.exit(0)
