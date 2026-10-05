# VIDEO STILLS — PHASE C2 (REF + CHAR animation data)
PROMPT-SET REVISION 2026-10-06-r18 · Ruvi Studio 3.12 native stills engine (stills schema 1.0).
One `stills` object per REF and per CHAR section, written into `.selftest/stills.json` and merged into
`[Subject]_allanimations.json` by `bundle.py build` (which fills section, image_width/height,
comp_start_ms, comp_duration_ms, time_base and validates). You decide only the DESIGN of each shot — from
the picture you actually viewed.

## The house look (the engine's constants; never in the JSON)
PULL-OUT: the layer opens 2.2–3.8× frame-filling, tilted in 3D, centred on the FOCAL POINT, and settles flat
and frame-filling over the whole section. FLY-IN-AND-PUSH (tall images, w/h < 1): small and off-frame
on the entry side, lands centred at ~0.6× "contain" by ~3 s, then pushes to fill the frame width onto the
focal point. CHAR CARD: Background.png canvas 2752×1534, the sitter's display name in Pirata One
(white, very large) centred in the free half, the portrait on the other side — CUTOUT (alpha), BLEND
(dark ground, lighten blend) or FRAMED (the whole picture with its margin on a cream mat, tilted ~3°).

## How to fill it (one view per sheet)
`python3 $R/fetch_assets.py $F` already made `.selftest/sheets/stills_<k>.png`: four stills per sheet, each
with its asset name, native size, section number and a 0.1-step xNorm/yNorm grid. View every sheet; read
the fractions off the grid; never write a focus, face, side or background you did not see.
- REF: `focus` = the thing the narration names (the object, the seal, the building, the face in a group),
  as 0..1 fractions of the FULL image — the pull-out opens there (or the push ends there on a tall image).
  `move`: auto (flyin_push when tall, else pullout); override only when the automatic choice is wrong
  (a wide panorama whose subject is a small detail → pullout; a tall column of text → flyin_push).
- CHAR: `name` = the shortest display form the narration uses ("Catherine II", ≤ 22 chars fits one line);
  `side` = where the PORTRAIT sits — the sitter FACES THE NAME (a face turned to the viewer's left goes on
  the right); `background` = dark | light | busy (dark: a painted/photographic dark ground that vanishes
  on black; light: paper, sky, wall, studio grey; busy: detail behind the sitter); `face` = the face point
  in the FULL image; `crop` = {xNorm, yNorm, wNorm, hNorm} whenever the picture carries a frame, a caption
  strip, a page of text, a museum wall or a second person — head and shoulders with some air above the
  head; `treatment` auto (cutout if alpha, blend if dark, else framed) unless there is a reason (logged);
  `energy` 0.5 calm … 1.5 lively (default 1.0); `entry` left | right (fly-in only).

## The objects
```
[{"source_file": "REF 1.jpg", "still_type": "REF", "focus": {"xNorm": 0.55, "yNorm": 0.50}, "move": "auto"},
 {"source_file": "CHAR 1.jpg", "still_type": "CHAR", "name": "Charles Vane", "side": "left", "background": "light",
  "face": {"xNorm": 0.30, "yNorm": 0.24}, "crop": {"xNorm": 0.08, "yNorm": 0.16, "wNorm": 0.62, "hNorm": 0.56}, "treatment": "auto"}]
```
`source_file` = the Studio's type-ordinal name (REF n / CHAR n in running order; bundle.py sets the
extension from the verified link). Log one line per still in the changes file: what was seen, why that
side / treatment / focus / crop.

## Validation (bundle.py build; Phase R re-checks)
still_type REF|CHAR; source_file starts with the type; comp_start/duration = the section's TIMECODE;
time_base comp_local; REF focus in 0..1; CHAR name, side, background, treatment in their vocabularies;
exactly one still per REF/CHAR section. review_audit's "Animation bundle" line must PASS.
