# Writing room — prompt-set changelog

## 2026-10-06-r20 (Ruvi Studio 3.13)
- DRESS THAT CANNOT DRIFT MODERN (Video_Structure.md §6.2): the bible's FORCES & DRESS is a WARDROBE BOARD (role → head, hair, neck, shirt, outer, legs, feet + "Never: …"), reused verbatim; every prompt carries an ERA token in its first sentence, no modern-rendering garment words (beanie, pea coat, checked shirt, knitted cap …) and a PERIOD LOCK (two distinctive period garments or "nothing modern in any garment"); era-ambiguous words only with their period cut. Worked example from a real failure (a 1720s sailor rendered as a 1950s dockworker).
- prompt_lint: FAIL on a missing era token, a modern-rendering garment, people without a period lock, a bible without a real CAST / FORCES & DRESS / DO NOT; WARN on an era-ambiguous garment word without its cut. Self-test fixture updated.

## 2026-10-06-r19 (Ruvi Studio 3.13)
- STORY BIBLE before any prompt (`[Subject]_bible.md`: ERA, PLACES at their date, CAST as fixed generic descriptions, FORCES & DRESS, SHIPS & OBJECTS, DO NOT) — Video_Structure.md §6.0; ships in the package.
- Anchoring law §6.1: every prompt is written from the bible + the section's moment, names the real place and the year, shows the story's own people, keeps continuity. Worked example (the generic "1720s harbour street with a town watch" vs Nassau, July 1718).
- prompt_lint: FAIL without a bible; WARN on a prompt with no year/decade or no place from the bible / PLACES block.
- Pipeline step 5 (bible) added; Review doc names the failure pattern.

## 2026-10-06-r18 (Ruvi Studio 3.12)
- Docs rewritten against Ruvi Studio 3.12 (native renderer; ambience bed; CTA inserts; one package). 717 KB → 45 KB; every voided "ask the user" removed; one run-book (Video_Pipeline.md) carries the order and the commands.
- Toolchain as plain files (`scripts/`, `kit/`), synced from GitHub; SHA bundles kept as the fallback (`tools/make_bundle_md.py`).
- NEW scripts: bootstrap, propose_sections (DP pause-aligned ~20 s sections), build_breakdown (the template written by the machine from plan + sentences + fills), link_verify (live imageinfo batch, canonical download URLs, refs.json), commons_search, geo (gazetteer coordinates with provenance), fetch_assets (native sheets, stills, contact sheets), mapcrop (gridded crops, contact sheets, prediction), bundle (assemble + validate the animation bundle, pin times from the SRT), prompt_lint (detailed-prompt floors and cues), description_check, suffixes (shared parser).
- FIX: preflight could not resolve a channel from the r17 suffix layout (DESCRIPTION before SUFFIX).
- Phase S2 is mechanical: an AI section up to the 25 s ceiling is one part with PROMPT 1 verbatim (make_auto_structure / auto_structure_lint / run_all).
- review_run adds prompt_lint + description_check; make_zip keeps plan / sentences / fills / meta / suffix out of the package.
- The channel suffix file is unchanged (byte-identical to assets/Channel_Prompt_Suffixes.txt).

## 2026-10-03-r17
- Music replaced by the ambience bed (Video_Sfx.md, sfx_check.py); _sfx_catalog.json + _cta.json in the packet.

## 2026-10-02-r16
- Three channels; 20-s AI sections everywhere; one prompt per section; one package with the bundle inside.
