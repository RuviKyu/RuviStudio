# writing-room/ — the Claude Project behind Ruvi Studio

| what | file(s) |
|---|---|
| paste into the Project's **instructions** | `PROJECT_INSTRUCTIONS.md` |
| the Project's **knowledge** (sync this folder from GitHub) | `Video_Pipeline.md` (run-book) · `Video_Structure.md` · `Video_Cartographer.md` · `Video_Stills.md` · `Video_Sfx.md` · `Video_AutoStructure.md` · `Video_Review.md` · `Channel_Prompt_Suffixes.txt` · `scripts/` · `kit/` |
| fallback knowledge (when plain files cannot be mounted) | `ruvi_scripts_bundle.md` · `cartographer_kit.md` (regenerate with `python3 tools/make_bundle_md.py` after any script change) |
| tests | `python3 tools/selftest_chain.py` (needs network + ffmpeg + Pillow); CI runs it on every push |

Keep `Channel_Prompt_Suffixes.txt` identical to `../assets/Channel_Prompt_Suffixes.txt` (the app ships it to every packet). Bump `PROMPT-SET REVISION` in the docs, `scripts/BUNDLE_VERSION.txt` and `CHANGELOG.md` together.
