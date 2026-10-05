CARTOGRAPHER VISION-RELIABILITY KIT · A3-2026-08-03
Companion to Video_Cartographer.md v7.3 ADDENDUM A2 (matched set 2026-08-03-r3).
CANONICAL: attach cartographer_kit.zip to the chat; never retype kit.py.

Setup (per chat):   unzip -o /mnt/user-data/uploads/cartographer_kit.zip -d /home/claude/kit
Run from the PROJECT folder (artifacts land in ./.kit/):

  python3 /home/claude/kit/kit.py selftest
  python3 /home/claude/kit/kit.py canary new             # -> view image -> ...
  python3 /home/claude/kit/kit.py canary check <CODE> --via view|ocr|user
        # --via is REQUIRED. Only --via view certifies VISUAL verdicts (A2.4).
        # Viewer blank/illegible? That IS vision-down: canary fail "<why>".
  python3 /home/claude/kit/kit.py canary fail "<why>"    # log an outage explicitly
  python3 /home/claude/kit/kit.py ocr probe <img> "<phrase>" [--region x0 y0 x1 y1]
  python3 /home/claude/kit/kit.py ocr grid <img>         # border graticule numerals
  python3 /home/claude/kit/kit.py georef auto <img> [--hemi E|W] [--lat-range a b] [--lon-range a b]
  python3 /home/claude/kit/kit.py georef add <img> <px> <py> <lat> <lon>
  python3 /home/claude/kit/kit.py georef place <img> <lat> <lon> "<Name>"
  python3 /home/claude/kit/kit.py phasea scan <maps_dir>     # dims/MP/sha + low-res tripwire
  python3 /home/claude/kit/kit.py phasea georef <maps_dir>   # REAL auto-calib per sheet -> state
  python3 /home/claude/kit/kit.py phasea set <img> --cartouche "..." --scale settlement|city-view|county|country|region \
        --subject "<name>" --lat .. --lon .. --source script|narrative|user \
        --coord-source google-maps|gazetteer|user \
        --verdict PASS|FAIL|UNVERIFIED --evidence ocr-hit|model-view|user-confirmed
  python3 /home/claude/kit/kit.py phasea audit    # MECHANICAL GATE: 0 FAIL / 0 UNVERIFIED or Phase B is blocked
  python3 /home/claude/kit/kit.py state init|set|get|note|view
  python3 /home/claude/kit/kit.py bundle          # -> resume_bundle.zip

A2 laws in one breath: declare the MAP SUBJECT (empty place-lists pass nothing);
designate sheets by their OWN cartouche + scale class (a settlement title is never a
county map); every verdict carries evidence (ocr-hit / model-view / user-confirmed —
"inferred" is refused); only a view-answered canary certifies visual verdicts; run
the georef dry-run for real in Phase A. A raised concern is closed by a recorded
check, never by re-assertion.

Resume in a fresh chat: attach package + MAP files + this kit + resume_bundle.zip,
say "RESUME CARTOGRAPHER".
Measured limits: OCR strong on graticule digits/large titles; weak on fine italic
labels over terrain — a MISS never proves absence (escalate to view/user eyes).
A2.8 GOOGLE CROSS-REFERENCE: every lat/lon is read LIVE from Google Maps (Claude in
Chrome preferred; take the marker !3d/!4d, not the viewport centre) - memory-recalled
coordinates are hypotheses, never final values. Regions with no Maps entity anchor on
a named representative INSIDE them, recorded in the note.
Antique prime meridians (Ferro etc.) often defeat auto-calib — record the outcome
and fall back to manual control points; that is the system working, not failing.

## A4-2026-08-03 (channel-matched certification & cryptographic identity)
- A4.1 `bundle` now mints the NEXT session's canary before zipping; attach that PNG
  alongside the map images so certification rides the same channel as the work.
- A4.2 `phasea hashref/<hashmatch>` prove plate identity by sha1 against the recorded
  Commons original; `--evidence hash-match` (exact only) is exempt from the canary
  faculty rule. refs.json is produced OUTSIDE the kit (kit stays offline-pure).
- A4.3 canary alphabet drops 9 and U (production misreads); bigger letterspaced glyphs;
  `canary read [--check]` = whitelist + multi-psm voting OCR reader.
- A4.4 canary truth is SEALED (salted sha256, no plaintext); failed checks leak nothing
  and the canary stays retryable; truth files are safe to ship in resume bundles.
