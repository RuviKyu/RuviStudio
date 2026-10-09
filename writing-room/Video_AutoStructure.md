# AUTO VIDEO STRUCTURE — PHASE S2 (mechanical since r18)
PROMPT-SET REVISION 2026-10-06-r20 · Ruvi Studio 3.13.
`[Subject]_auto_video_structure.txt` (+ the `.json` twin) is the engine-readable cut of the video.
`run_all.py` makes it (`make_auto_structure.py`) and lints it (`auto_structure_lint.py`); `review_run.py`
regenerates it after any change. Nothing is written by hand.

- HOOK / MAP / REF / CHAR → one item each, the section's TIMECODE, `RENDER: S###_TYPE#` (S001_HOOK,
  S009_MAP1, S013_CHAR2) — Ruvi Studio renders `Output\parts\<RENDER>.mp4` natively.
- AI → ONE item per section (every AI section is ≤ 25 s), `AI IMAGE n` in running order
  (`AI Images\<nnn>.jpg`), a `PAN` (N NE E SE S SW W NW; never the same twice in a row — the Studio pushes
  and glides the still that way), `NARRATION`, and the section's PROMPT 1 verbatim.
- `[Subject]_ai_prompts.txt` (one prompt per line, AI IMAGE order) and `.csv` come from the JSON twin
  (`make_ai_prompts.py`); the user bulk-generates the images from it; files may carry a suffix after the
  index (001_painted.jpg) and any aspect.
- Lint: items tile the video from 00:00:00.000 to the end; a special's TIMECODE equals its section's and
  its RENDER name is right; PANs valid and alternating; images 1,2,3…; every prompt present, no [REWRITE]
  marker, ending with the STYLE SUFFIX. A section longer than 25 s would split into two parts with a
  [REWRITE] seed — that is a Phase S error (fix the plan), not something to write.

Grammar (fixed):
```
========================================
AUTO VIDEO STRUCTURE — <TITLE>
========================================
SOURCE: <Subject>_breakdown.txt
SECTIONS: <n> FULL → <m> AUTO
AI SUB-SECTION LENGTH: 10-20 s, one prompt each
TRANSITION: fade 0.5s at every cut (fade out to black, fade in)
AI MOVE: ken burns, 8 compass directions, pseudo-random, never twice in a row
AI IMAGES: <k> (AI Images\001.jpg … <kkk>.jpg, numbered in running order)
SPECIAL RENDERS: <j> (Output\parts\S###_TYPE#.mp4 from Ruvi Studio's native renderer)
========================================

----------------------------------------
AUTO 001 | SECTION 1 (HOOK) | RENDER: S001_HOOK
----------------------------------------
TIMECODE: 00:00:00.000 → 00:00:21.470 (21.47s)

----------------------------------------
AUTO 002 | from SECTION 2 (AI) | part 1/1 | AI IMAGE 1
----------------------------------------
TIMECODE: 00:00:21.470 → 00:00:39.830 (18.36s)
PAN: NE
NARRATION: <the section's words>
PROMPT:
<the section's PROMPT 1, ending with the STYLE SUFFIX>
```
