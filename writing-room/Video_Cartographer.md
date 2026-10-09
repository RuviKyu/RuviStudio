# VIDEO CARTOGRAPHER — PHASE C (map animation data)
PROMPT-SET REVISION 2026-10-06-r20 · engine: Ruvi Studio 3.13 native map renderer (reads the v6.13 map
object; pins, ink highlights along a traced shape, dashed routes, auto camera) · kit A4-2026-08-03.
The sheets are REAL pixels on disk (fetch_assets.py downloads the Commons original); identity is proven
by sha1 (kit hashmatch); positions are read off gridded native crops and verified on contact sheets.
No browser is needed. Nothing is ever asked of the user.

## The job
One map object per HOOK and per MAP section, in `.selftest/maps/<asset>.json` (HOOK 1.json, MAP 1.json …),
assembled and validated by `bundle.py build` into `[Subject]_allanimations.json` with the stills. Each
object marks EVERY place the section's own text names (Rule 3), with comp-local times from the word SRT,
and the richest honest treatment: route > highlight > pins.

## The rules that matter most
1. IDENTIFY BY THE SHEET'S OWN WORDS. Publisher, title, date come from the title cartouche and the
   imprint line read in a native crop — never from the file name, a thumbnail or memory. Content clues
   bracket a missing date (a county created 1874 → post-1874); say which clue.
2. NEVER FABRICATE A POSITION. A place off the sheet or illegible is not pinned; it is a coverage
   failure → a better sheet (commons_search → fills / link line → link_verify → fetch_assets).
3. MARK EVERYTHING THE SCRIPT NAMES. Enumerate every city, island, fort, region, water body and
   landmark in the section's text (Step 1A) PLUS the MAP SUBJECT; every one on the sheet becomes a
   location; nothing the script names goes unmarked; nothing the script does not name is added.
4. CROSS-REFERENCE EVERY PLACE: `geo.py` gives the real lat/lon (gazetteer, cross-checked). It fixes which
   coast, which side of a river, and the N→S / W→E ORDER the pins must keep (state the order check in one
   line per map). It never gives pixels — antique sheets are distorted.
5. GRATICULE ANCHOR — predict, then look. Read two meridian and two parallel labels, derive px/degree
   (`mapcrop.py anchor`, or the kit's `georef auto/add` + `mapcrop.py predict`), predict each place's
   neighbourhood from its lat/lon, crop THERE. A crop that contradicts the prediction means the
   identification or the scale is wrong — re-derive, never force a reading.
6. EVIDENCE RULE. A label is "present" or "absent" only after it was legible in a crop you viewed; quote
   label text only from viewed crops. Predictions and observations stay separate.
7. PIN THE MAPPED FEATURE, not a word in the cartouche, legend or title. The town symbol beside the
   label, the island's body, the fort's outline, the point on a river's drawn line beside its label.

## The time model
`timeMs` is COMP-LOCAL: word_absolute_ms − section_start_ms, clamped to [0, comp_duration_ms].
bundle.py reads each location's first in-window mention from the word SRT (fuzzy ≥ 0.8; `"spoken":
"tulay"` names an ASR garble); a place never spoken in the window gets a hand timeMs with
`"estimated": true` (from the nearest preceding spoken place). Position is never estimated except the
unprinted-site pattern (below).

## Phase A — validate every sheet (all sheets before any pin)
```
cd $F; python3 $R/fetch_assets.py .
python3 $R/kit.py phasea scan .selftest/maps        # dims, MP, low-res tripwire (< 5 MP)
python3 $R/kit.py phasea hashref .selftest/refs.json; python3 $R/kit.py phasea hashmatch .selftest/maps   # exact → identity by bytes
python3 $R/kit.py phasea georef .selftest/maps [--hemi E|W --lat-range a b --lon-range a b]           # the real auto-calib outcome on record
python3 $R/kit.py canary new → view → python3 $R/kit.py canary check <CODE> --via view                # certifies the viewer once per chat
```
Per sheet: view `.selftest/sheets/maps_<k>.png` (1400 px, 0.1 grid) to locate the cartouche and the
section's region; crop the cartouche at native resolution (`mapcrop.py gridn "<asset>" x0 y0 x1 y1`) and
read it; then
`python3 $R/kit.py phasea set ".selftest/maps/<asset>" --cartouche "<verbatim title + imprint>" --scale
settlement|city-view|county|country|region --subject "<MAP SUBJECT name>" --lat .. --lon .. --source
script|narrative --coord-source gazetteer --verdict PASS|FAIL --evidence hash-match|model-view [--note …]`.
CHECKS: resolution (≥ 2000 px long edge; 3500+ good; the tripwire flags < 5 MP); era (1700s–1900s plate,
from the cartouche / imprint); subject and FULL COVERAGE (every Step-1A place + the MAP SUBJECT legible at
its predicted neighbourhood, in a viewed crop — no partials); scale class (a cartouche naming a settlement
is a settlement sheet and may serve only that settlement — `phasea audit` enforces it); duplicates (the
same plate on several sections is by design when the breakdown says so).
`python3 $R/kit.py phasea audit` must print 0 FAIL / 0 UNVERIFIED. A sheet that fails is replaced now
(the swap is logged; the breakdown's link line is the one truth; re-run link_verify + fetch_assets).

## Phase B — one map at a time (HOOK first)
STEP 3 — COORDINATES (native pixels, top-left origin, +y down; valid for map_width × map_height):
predict (Rule 5) → `python3 $R/mapcrop.py grid ".selftest/maps/<asset>" x0 y0 x1 y1 --step 100` → view, read
x/y off the labelled grid → every final point into a `points.json` → `python3 $R/mapcrop.py contact
".selftest/maps/<asset>" points.json` → view: the named feature sits under every crosshair (at least one
vertex per traced shape) or the point goes back to the grid. Then the geography + order sanity line.
A linear feature (river, road) is pinned ON its drawn line beside its label; lines are not shape-filled.
STEP 4 — TIMING: automatic (bundle.py); check garbles with `bundle.py times $F <section> "Name" …`.
STEP 5 — TREATMENTS, stacked, as the content honestly supports:
- ROUTE (priority 1) for a JOURNEY: `"render": "route"` — the engine draws the dashed line from pin to pin
  in spoken-time order while the camera travels. ROUTE HONESTY: only movement the narration describes;
  the camera's path joins the pins — a trail the sheet does not engrave is never traced as pathway points.
- HIGHLIGHT (priority 2) for the focal place: `"highlight": true` + `"shape": [[x,y],…]` traced along the
  real outline (a fort 10–20 points; an island, lake, state more) — the native renderer draws its INK
  outline along the shape, then a faint wash. No traceable outline (a town dot) → highlight without shape
  (a glow at the pin) and say so in the changes file. `"render": "highlight"` when the section is a single
  focal place.
- PINS (always on): every location gets a teardrop + label; clusters de-blob automatically.
  `"render": "pins"` for discrete markers.
UNPRINTED SITE (a treaty ground, camp, battle spot no period sheet prints): pin via the adjacent printed
feature that marks it, keep the script's display name, `"estimated": true`, log how it was placed.
STEP 6 — WRITE `.selftest/maps/<asset>.json`:
```
{"render": "route", "route": true,
 "locations": [
   {"name": "Nassau", "x": 9311, "y": 2605, "highlight": true,
    "shape": [[9250,2560],[9380,2555],[9400,2650],[9290,2660]], "estimated": false},
   {"name": "Andros", "x": 8870, "y": 3120, "spoken": "andros", "estimated": false}]}
```
`name` = the on-screen DISPLAY name from the script (the printed label may be archaic; the ASR word may be
garbled — note the mapping in the changes file). Optional per location: `"color": [r,g,b]` (0..1),
`"timeMs"` (comp-local, only when hand-set), `"labelOffset": [x,y]` and `"highlightStyle"` (read by the
Adobe engine only; the native renderer places labels and draws the ink style itself).
bundle.py adds: map_name, source_file, map_width/height, coordinate_space, comp_start_ms,
comp_duration_ms, time_base, xNorm/yNorm, shapeNorm, every timeMs from the SRT, and validates
(required keys, 0..1 norms, integer times inside the comp, a route needs 2+ locations, one object per
HOOK/MAP section, HOOK first). It prints VALIDATION: 0 errors or the fixes to make.

## The bundle (schema 6.14 = maps v6.13 + stills 1.0)
`{"n8n_maps_bundle": 1, "project": "<full title>", "stills_schema": "1.0", "maps": [HOOK object, MAP 1 …],
"stills": [...]}`. Map object keys: map_name, source_file ("MAP 3.jpg" — the Studio's saved name, matched
case-insensitively), map_width, map_height, coordinate_space "image_pixels_top_left_origin", comp_start_ms,
comp_duration_ms, time_base "comp_local", render, route (opt), locations[] {name, x, y, xNorm, yNorm,
timeMs, estimated, highlight (opt), shape / shapeNorm (opt), color (opt)}. Nothing else is invented.

## Evidence & certification (A2 / A4, condensed)
Verdicts carry evidence: `hash-match` (exact sha1 vs the Commons record — no perception involved,
canary-exempt), `model-view` (a viewed crop; needs the chat's view-certified canary), `ocr-hit`,
`user-confirmed`. "inferred" does not exist. A concern raised anywhere is closed only by a recorded check
(a viewed crop, an OCR hit), never by re-assertion. A blank or illegible viewer = `canary fail "<why>"`
and visual verdicts stop until a fresh canary passes. Coordinates are read (geo.py, gazetteer) never
recalled; a region without an entity anchors on a named settlement inside it (logged).

## Confidence summary (goes in the changes file, not chat)
One line per map: the order check, any estimated place (timing or position, and how), any shape noted as
an approximation, any ASR-garble mapping, any circle/glow fallback.
