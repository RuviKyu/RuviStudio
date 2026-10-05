# Writing room — prompt-set changelog

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
