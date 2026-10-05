# VIDEO PIPELINE — THE ONE STREAM (run-book)
PROMPT-SET REVISION 2026-10-06-r18 · Ruvi Studio 3.12 · scripts 2026-10-06-r18 · kit A4-2026-08-03.
One chat = one title = one deliverable. The stage docs are the LAW for content (Video_Structure.md,
Video_Cartographer.md, Video_Stills.md, Video_Sfx.md, Video_Review.md); this file is the ORDER and the
COMMANDS. Autorun: the packet drop is the instruction; nothing is asked; a message that hits its length
ends "CONTINUING —" and the next one resumes; the chat ends with ONE download.

## 0. Toolchain (first tool call of every chat)
```
mkdir -p /home/claude/rr && S=$(find /mnt/project -name run_all.py 2>/dev/null | head -1) && cp "$(dirname "$S")"/* /home/claude/rr/ && cp "$(find /mnt/project -name kit.py | head -1)" /home/claude/rr/ && ls /home/claude/rr | wc -l
```
(If /mnt/project has no plain scripts: extract `ruvi_scripts_bundle.md` and `cartographer_kit.md` with
their embedded extractors; every hash must print OK.) Never retype a script. `R=/home/claude/rr` below.

## Phase S — STRUCTURE (Video_Structure.md)
1. `unzip -o <packet.zip> -d /tmp/pk` is NOT needed — bootstrap does it: read the README's title, derive
   [Subject] (Video_Structure.md §1), then
   `python3 $R/bootstrap.py /mnt/user-data/uploads/packet.zip --subject <Subject>` → `F=/mnt/user-data/outputs/<Subject>`.
   It prints channel, title, words, duration, rules, CTA seconds. (No .docx / SRT = the one permitted question.)
2. `python3 $R/propose_sections.py $F` → the plan (every section with its sentence range, window, opening
   words) and `<Subject>_sentences.tsv`. Read `<Subject>_source.txt` once, whole.
3. EDIT THE PLAN (`str_replace` on `<Subject>_plan.txt`): set TYPE per section (HOOK S01 · AI · MAP ·
   REF · CHAR per §3 of the Structure doc), move a boundary only by changing sentence ranges, write the
   THEME lines (2–4) and CONTENT TREATMENT when restraint applies. Log the type decisions in one line of
   the changes file ("S05 CHAR (Vane first described) · S06 MAP (Windward Passage) · S20 REF …").
4. RESEARCH: `python3 $R/geo.py "Place, Country" …` for every MAP SUBJECT (and the HOOK's);
   `python3 $R/commons_search.py "…" "…" --maps --min 2000` for sheets, plain for REF / CHAR images —
   several queries per call. Pick ONE file per section by the Structure doc's §4 duties.
5. WRITE THE FILLS: `<Subject>_fills.txt` in batches via bash heredoc appends — prompts per §6 (detailed,
   every person dressed for the period and placed in the frame), links, summaries with the PINPOINT, the
   CHAR cards, the closing blocks. No chat echo of content.
6. `python3 $R/build_breakdown.py $F` (0 empty slots) → `python3 $R/link_verify.py $F` (0 FAIL; a
   missing or low-res file → swap the link in the fills and rebuild) → `python3 $R/run_all.py $F`
   (preflight · format_lint · prompt_lint · time_breakdown · make_special · subtitles · word_level ·
   make_auto_structure · auto_structure_lint · link_check · download_links · manifest · ai_prompts · zip).
   Fix anything red at its source (plan / fills), rebuild, re-run. Phase S2 is inside run_all: every
   AI section ≤ 25 s is ONE part with PROMPT 1 verbatim (Video_AutoStructure.md) — nothing to write.

## Phase C — CARTOGRAPHER (Video_Cartographer.md)
7. `python3 $R/fetch_assets.py $F` — every HOOK / MAP sheet at NATIVE resolution into `$F/.selftest/maps/`,
   REF / CHAR stills as 1600-px thumbs into `.selftest/stills/`, and the contact sheets in `.selftest/sheets/`.
   Then, from `$F`: `python3 $R/kit.py phasea scan .selftest/maps` · `phasea hashref .selftest/refs.json` ·
   `phasea hashmatch .selftest/maps` (exact = identity proven by bytes; canary-exempt) · `phasea georef .selftest/maps`.
8. ONE canary for the chat's viewer: `kit.py canary new` → view the PNG → `kit.py canary check <CODE> --via view`.
9. Per sheet (one map at a time, HOOK first): view `maps_<k>.png`; read the cartouche + imprint in a native
   crop (`mapcrop.py grid …`); class the scale; `phasea set … --evidence hash-match --coord-source gazetteer`;
   `phasea audit` 0 FAIL / 0 UNVERIFIED (a failing sheet is REPLACED now: commons_search → edit the fills
   or the breakdown link line → link_verify → fetch_assets again).
10. Pins: predict (`mapcrop.py predict` after a georef, or `anchor` with two graticule intersections) →
    `mapcrop.py grid` at the predicted neighbourhood → read x/y off the grid → `mapcrop.py contact` with
    every point (and ≥ 1 vertex per traced shape) → view: every feature under its crosshair, or back to
    the grid. Write `.selftest/maps/<asset>.json` (render, locations with x/y, highlight, shape, spoken).
    Times come from the SRT automatically (`bundle.py times $F <section> "Name"` to check a garble).

## Phase C2 — STILLS (Video_Stills.md)
11. View `.selftest/sheets/stills_<k>.png` (four stills per sheet with a 0.1 grid). Write
    `.selftest/stills.json`: REF focus + move; CHAR display name, side (the sitter faces the name),
    background, face, crop when the picture carries a frame / caption / second person.
12. `python3 $R/bundle.py build $F` → `<Subject>_allanimations.json` (fills timing, dims, norms; 0 errors).

## Phase X — AMBIENCE (Video_Sfx.md)
13. Write `<Subject>_sfx.json`: scene runs → a base layer + 1–2 textures per run with the channel palette's
    words; one-shots at the moment named; nothing modern, no music. `python3 $R/sfx_check.py $F` 0 FAIL.

## Phase D — DESCRIPTION
14. Write `<Subject>_description.txt` from the channel's DESCRIPTION template in Channel_Prompt_Suffixes.txt
    (fixed lines verbatim, {…} fields per title, the title's key names in the first two sentences, the
    hashtag line last with the title-specific tags first, a blank line then the PINNED COMMENT line where the
    channel has one). `python3 $R/description_check.py $F` 0 FAIL.

## Phase R — REVIEW (Video_Review.md)
15. `cp $F/<Subject>_breakdown.txt $F/<Subject>_breakdown_original.txt` once, then
    `python3 $R/review_run.py $F` — lint · regenerate · timing_check · review_audit · auto_structure_lint ·
    sfx_check · prompt_lint · description_check · make_diff · manifest · ai_prompts · zip. Read the
    reports, fix IN PLACE (the breakdown, the map JSON, stills.json, sfx.json — then bundle.py build /
    review_run again) until timing_check 0 MIS-TIMED and every check 0 FAIL. Naming audit: one [Subject].
16. `present_files` the ONE file `$F/<Subject>_package.zip` with a three-line summary. Done.

## Decision rules (replace every question of the older docs)
- Ambiguous [Subject]: the most distinctive proper noun; tie → the person over the place.
- A MAP SUBJECT the section's text does not name: resolve from the surrounding narrative (source:
  narrative) and log it; a region without a gazetteer entity anchors on a named settlement inside it.
- A sheet that fails Phase A: replace it, log "swapped S<n> sheet: <why>".
- An unprinted site (treaty ground, camp): pin via the adjacent printed feature, `"estimated": true`, log it.
- A place never spoken in its window: timeMs from the nearest preceding spoken place, `"estimated": true`.
- Partial coverage (a named place off the sheet): that is NOT READY — find a sheet that shows all of them;
  if none exists on Commons, make the section REF or AI and log it.
- Nothing is ever delivered partially; nothing is ever delivered loose.

## Output contract — ONE file
`<Subject>_package.zip` → the user saves it into `<base>\<CHANNEL>\Titles\<n>. <Title>\Script\` and presses RUN.
Inside: `<Subject>_breakdown.txt` (timed) · `_special_breakdown.txt` · `_full_timestamp_guidelines.srt` ·
`_special_timestamp_guidelines.srt` · `_word_level.srt` · `_auto_video_structure.txt/.json` ·
`_ai_prompts.txt/.csv` · `_allanimations.json` · `_sfx.json` · `_description.txt` · `_download_links.txt`
(SAVE AS | URL, slot 1, Commons URLs ending ?download) · `_manifest.json` · `_changes.md` · `_source.txt` ·
the reports (format_lint, link_check, timing_check, review_audit). Not inside: the plan, sentences, fills,
meta, the suffix file, `.selftest/`, `.packet/`. Ruvi Studio reads: breakdown, auto structure, bundle,
sfx, ai_prompts, description, download_links; the rest serves the Adobe extension and the audit trail.

## CTA inserts (Ruvi Studio's, for information)
`_cta.json` lists the channel's clips and seconds. CTA 1 goes in at the section start nearest 20 % of the
narration, CTA 2 at 50 % (per-channel positions in the Studio's settings). The narration pauses, the clip
plays with its own sound, the ambience bed pauses, the final length = narration + clips. Plan cues on
narration sections only; this is why every section boundary is a sentence end.

## Message budget
Phase banners are one line. Content goes to files, never to chat. Batch: ~10 fills per tool call, one map
per JSON, all four stills per sheet view. A long Phase C is split across messages with "CONTINUING —"
after a finished map; never a checkpoint question. The closing message is the file and three lines.
