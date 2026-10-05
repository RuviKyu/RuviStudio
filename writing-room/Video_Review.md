# VIDEO REVIEW — PHASE R (the final audit) + PHASE D (the description)
PROMPT-SET REVISION 2026-10-06-r18 · Ruvi Studio 3.12 · scripts 2026-10-06-r18.
Review FIXES; it never rebuilds. Everything the chat produced is audited against everything else, then
the derived files are regenerated and the ONE package is zipped. Every "post a table / offer a new
review" of older revisions is void.

## Phase D — the YouTube description (before Phase R)
`[Subject]_description.txt` from the channel's DESCRIPTION template (Channel_Prompt_Suffixes.txt): the fixed
lines verbatim (opener, handle, 🔔 / 🎧 / 💬 / 👍 lines, the ebook line where the channel has one), the {…}
fields written for this title, the title's key names in the first two sentences, the hashtag line LAST
(YouTube shows the first three above the title — the title-specific ones first), then a blank line and
`PINNED COMMENT: …` where the channel keeps its ebook link in the first comment. Plain text, no Markdown.
Ruvi Studio copies it beside the finished video. `description_check.py` 0 FAIL.

## The chain — `review_run.py $F`
1. `cp <Subject>_breakdown.txt <Subject>_breakdown_original.txt` once before the first review run.
2. LINT format_lint → REGENERATE time_breakdown · make_special · subtitles_from_timecodes · word_level_srt ·
   make_auto_structure → CHECK timing_check · review_audit · auto_structure_lint · sfx_check · prompt_lint ·
   description_check → FINALIZE make_diff (the changes file keeps its decision log; the diff is a marked
   block) · make_manifest · make_ai_prompts · make_zip.
3. Read `<Subject>_timing_check.md`, `<Subject>_review_audit.md`, `.selftest/prompt_lint.md`. Fix at the
   source and re-run until: timing_check 0 MIS-TIMED, review_audit 0 FAIL, every lint 0 FAIL.

## What review_audit proves (and how to fix each)
- TIMING: the audio inside every TIMECODE is that section's lines (word overlap), the opening words sit at
  the stamped start. A MIS-TIMED section is almost always a sentence in the wrong section → move it in the
  SCRIPT line of the breakdown (and the plan, for the record), never hand-edit a TIMECODE; re-run.
- TYPE PLAN: HOOK = S1 only; no consecutive MAP / REF; CHAR carries its CHARACTER INTRODUCTION name; every
  MAP and the HOOK carry a parseable MAP SUBJECT line.
- LENGTHS: AI sections at the 20-s target (±2 PASS, ±5 WARN, beyond FAIL unless bounded by specials or
  last); HOOK / MAP / REF / CHAR ≤ 30 s; pacing summary (longest runs, very short sections).
- PROMPTS: exactly one per section; the STYLE SUFFIX intact on every one; symbolic wording pre-flagged
  (prompt_lint enforces the detailed-prompt floors and the dress / placement cues).
- LINKS: REF / CHAR / MAP / HOOK slots are upload.wikimedia.org download URLs with the md5 path gate;
  no Category / Special links. Liveness was proven by link_verify.py (re-run it if any link changed).
- SPECIAL breakdown AI-free and byte-matching the non-AI blocks; nothing of the narration lost (vs
  `_source.txt`).
- ANIMATION BUNDLE COHERENCE: exactly one map object per HOOK/MAP and one still per REF/CHAR, source_file
  = the type-ordinal name, comp_start/duration = the TIMECODE (60 ms tolerance), stills' fields valid.
  Fix in `.selftest/maps/*.json` / `.selftest/stills.json`, then `bundle.py build`, then review_run again.
- BONUS FILES: auto structure (tiling, PANs, prompts), sfx plan (every section on a bed), description.
- NAMING: one short [Subject] (≤ 20 chars, letters / digits / underscores) as the base of every packaged
  file and the package; the changes file still carries `TITLE: … → SUBJECT: …` and every logged decision.

## Delivery
When the chain is clean: `present_files` the single `<Subject>_package.zip`. Three lines: sections and
type counts, maps + stills in the bundle, AI images to generate. Nothing else; no questions.
