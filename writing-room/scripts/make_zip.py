#!/usr/bin/env python3
"""
MAKE ZIP — (Q2) zip the whole project folder into [Subject]_package.zip, the
one-file handoff from the builder to the Review tool (or to an editor).

Included: everything in the folder.
Excluded: the .mp3 (attach it alongside — it's usually too big to re-zip and the
manifest's SHA-256 lets the reviewer verify the copy they receive), any previous
*_package.zip, and the .selftest/ scratch folder.
(r16) The animation bundle *_allanimations.json and *_ai_prompts.txt are INSIDE the
package now: the package is the ONE deliverable; Ruvi Studio unpacks the bundle into
the title's Maps folder itself.
    --with-audio     include the .mp3 too
Re-run it any time (e.g. after manual link fixes) — it overwrites the zip.

Optional argv[1] = the working folder.
"""
import re, glob, os, sys, zipfile

args=[a for a in sys.argv[1:] if not a.startswith("--")]
OUT=(args[0] if args else "/mnt/user-data/outputs")
WITH_AUDIO=("--with-audio" in sys.argv)

def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p,encoding="utf-8",errors="ignore").read()))
    except Exception: return 0
def is_special(p):
    try: return "SPECIAL" in open(p,encoding="utf-8",errors="ignore").read(1500).upper().replace("SPECIAL:FILEPATH","")
    except Exception: return False

cands=[p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and not is_special(p)
       and "special" not in os.path.basename(p).lower()
       and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
subj=(re.sub(r'(_breakdown)?.txt$','',os.path.basename(max(cands,key=is_breakdown))) if cands
      else os.path.basename(os.path.normpath(OUT)) or "package")

dest=os.path.join(OUT, f"{subj}_package.zip")
skipped=[]; left_out=[]; added=0
with zipfile.ZipFile(dest,"w",zipfile.ZIP_DEFLATED) as z:
    for p in sorted(glob.glob(f"{OUT}/*")):
        name=os.path.basename(p)
        if not os.path.isfile(p): continue
        if name.endswith("_package.zip"): continue
        if name=="Channel_Prompt_Suffixes.txt" or re.search(r'_(meta\.json|plan\.txt|sentences\.tsv|fills\.txt)$', name): continue   # (r18) run inputs / scratch, not deliverables
        if name.endswith("_allmaps.json"):   # the legacy bundle name stays out; (r16) *_allanimations.json is zipped like everything else
            left_out.append(name); continue
        if name.lower().endswith(".mp3") and not WITH_AUDIO:
            skipped.append(name); continue
        z.write(p, name); added+=1

print(f"Package: {dest}")
print(f"  files zipped: {added}" + (f" | audio left out (attach alongside): {', '.join(skipped)}" if skipped else " | audio included")
      + (f" | legacy bundle left out: {', '.join(left_out)}" if left_out else ""))
print(f"  size: {os.path.getsize(dest):,} bytes")
