# VIDEO SFX — PHASE X (the ambience plan)
PROMPT-SET REVISION 2026-10-06-r18 · Ruvi Studio 3.12 (lib/sfx.js: target -31 LUFS, ceiling -26, fade in
2 s / out 2.5 s, slices of long files, short sounds once, the bed pauses during the CTAs, a slow ±1.5 dB
breath so nothing sits flat). No music anywhere.

## What you write — `[Subject]_sfx.json`
```
{"target_lufs": -34,
 "cues": [
  {"sound": "ocean waves shore surf", "from": 1, "to": 9, "level": 0, "note": "the open sea under the hook and the Caribbean run"},
  {"sound": "wooden ship creaking rigging", "from": 3, "to": 9, "level": -3},
  {"sound": "seagulls harbour", "from": 10, "to": 12, "level": -4},
  {"sound": "cannon broadside ship", "fromMs": 412300, "toMs": 416300, "level": -2, "note": "one-shot at 'the broadside'"}]}
```
- `sound`: plain words (3–5: place, texture, time of day) from the channel's AMBIENCE palette in
  Channel_Prompt_Suffixes.txt first — the engine matches them to the shared `_SFX\` library (and the
  channel's own overrides), then Freesound CC0 (≥ 45 s), then the bundled Commons set. Same words →
  same cached file across the channel. The packet's `_sfx_catalog.json` lists what is already cached.
- `from` / `to`: section numbers (inclusive; "S03" accepted) — one continuous bed across the range;
  `fromMs` / `toMs` for a cue that must start mid-section (one-shots).
- `level`: dB relative to the bed (0 base, −2…−6 textures, never above +3). `target_lufs` is informative:
  the Studio places the bed a fixed distance under the measured voice, capped by the channel's
  AMBIENCE_LUFS (-34 pirate channels, -31 OLDWORLDPROOF).
- Optional `url` / `license` / `credit` for a specific long free recording you found (direct file URL,
  CC0 / CC BY / PD); CC BY credits are appended to the description automatically.

## How to plan
1. Read the breakdown as SCENE RUNS — consecutive sections in one place (the voyage, the harbour, the
   tavern, the jungle march). One cue per layer per run; a run change = the old base ends on its last
   section, the new base starts on the next (the fades overlap).
2. One to three layers per run: a BASE (level 0) and one or two TEXTURES (−2…−6). Every section sits on a
   base; CHAR / REF / MAP sections inherit the run they are in.
3. Long recordings only for beds; a short sound (one gull, a bell, footsteps) is a one-shot: `fromMs/toMs`,
   a few seconds, placed where the narration names it, never twice within 20 s, never as a bed.
4. A run longer than ~4 minutes must BREATHE: add or rotate a texture every 2–3 minutes (gulls come and go,
   a gust, a distant bell, voices pass). sfx_check warns after 5½ minutes without a new cue.
5. BATTLES: a battle bed ("naval battle distant cannon shouting", level 0) over the fight's run + one-shots
   at the exact moments (sword clash, pistol shot, musket volley, broadside, splintering wood, blade drawn),
   −3…0, each once. Keep the whole fight under the narration.
6. Nothing modern, ever (engines, sirens, electric hum, modern crowds). Keep the period and the place.
7. Plan on NARRATION sections only; the bed pauses while a CTA plays. Log run → place → layers in the
   changes file (one line per run).

## Check
`sfx_check.py` (in review_run): cues name real sections, ordered ranges, levels −12…+3, words present,
≤ 3 overlapping cues per section, NO section without ambience (FAIL), warnings for long silences and
single generic words ("water"). 0 FAIL required.
