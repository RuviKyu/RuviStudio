# VIDEO STRUCTURE — PHASE S (the FULL breakdown)
PROMPT-SET REVISION 2026-10-06-r20 · pairs with Ruvi Studio 3.13 · scripts bundle 2026-10-06-r20.
This document is the LAW for the breakdown's content. The mechanics (sectioning, timing, the template,
the derived files) are done by the scripts; you write the plan, the links, the cards and the prompts.
Every "ask the user" of older revisions is VOID (autorun): decide by the rules below and log the decision
in [Subject]_changes.md.

## 1. Ground rules
- The ONLY source is the packet's narration. Nothing in these documents is ever broken down or timed.
- ONE project per working folder: /mnt/user-data/outputs/[Subject]. **[Subject]** = 1–2 words, ASCII
  letters / digits / underscores, 3–20 chars, the single most distinctive proper noun of the title
  (Pilecki · Modoc_War · Vane). Never the full title (long file names broke the machine's folder paths).
  [Subject] is the base of EVERY file the chat emits; the full title lives in the header line, the
  README, the changes file's `TITLE: … → SUBJECT: …` line and the bundle's "project" key.
- FILES ARE STRICT: the breakdown follows the exact template (40-char dividers, the header fields in
  order, no Markdown, no emojis). build_breakdown.py writes it; edit it in place only after Phase S.
- HONESTY: every link verified live this run (link_verify.py), every confidence tag true, every timing
  outlier named in the header, nothing hidden.
- THREE channels: [BILGE RATS] [SCURVY DOGS] [OLDWORLDPROOF]. Rules per channel come from the packet's
  Channel_Prompt_Suffixes.txt (SUFFIX, AI_TARGET_S 20 / AI_TOL_S 2 / AI_MAX_S 25, MAX_SECTION_S 30,
  AMBIENCE palette, DESCRIPTION template). The SUFFIX is copied verbatim, never edited or paraphrased.

## 2. Sections (what propose_sections.py does, and how you adjust it)
- Sentences only. A section never breaks mid-sentence (the CTA inserts pause the narration at section
  starts). Guards: abbreviations (Mr. Dr. St.), initials (J. P.), decimals (3.5).
- Every AI section ≈ 20 s: 18–22 s is the band, 25 s the ceiling; the cut lands on the LARGEST pause
  inside the band. HOOK / MAP / REF / CHAR sections 18–30 s. A final tail under 12 s merges back unless
  that breaks the ceiling. review_audit: AI within ±2 s PASS, within ±5 s WARN, beyond FAIL (a short AI
  section bounded by two specials, or the last section, only WARNs).
- Lengths are measured the way time_breakdown stamps them: from the middle of the pause before the
  first sentence to the middle of the pause after the last. The plan's windows are those lengths.
- You change a boundary by editing the sentence ranges in [Subject]_plan.txt (ranges must tile
  1…N). Merge two short sections into one HOOK / MAP / REF / CHAR of up to 30 s when the content
  earns it; never let an AI section pass 25 s. Fix FAIL-zone lengths here, not by hand-editing a TIMECODE.

## 3. Type plan (set TYPE per line in the plan)
- HOOK — S01 only, always. Since r9 the HOOK IS A MAP ANIMATION: an antique sheet showing the hook's
  MAP SUBJECT, a MAP SUBJECT line, one pinpointed link (REF/MAP LINK 1; slot 2 repeats it). No VIDEO LINK.
  It does not count toward the no-consecutive-MAP rule with S02.
- CHAR — a notable named figure's introduction: only where the person is first MEANINGFULLY named AND
  the name is in that section's own text, at the bio/description beat (not a passing mention, not the
  hook). Antagonists may get a card; treat them neutrally. Exactly one REFERENCE link (a real portrait /
  photograph).
- MAP — every section whose OWN text names a mappable place that a genuine antique sheet (1700s–1900s
  engraved / atlas plate, any story era) shows legibly. UNCAPPED. Never padded: no named place, no MAP.
  Carries `MAP SUBJECT: <display name> @ <lat>,<lon> [source: script|narrative|user]` — the one anchor
  Phase C must pin; lat/lon read with geo.py (never recalled); "script" when the section's text names
  it, "narrative" when the surrounding sections do. One plate may serve several MAP sections (same link).
- REF — every section whose own text names a real object, document, building, artefact, monument or
  photograph that a genuine Commons image shows. UNCAPPED, never padded: nothing real to show → AI.
- AI — everything else.
- Constraints: no two consecutive MAP, no two consecutive REF (MAP next to REF fine; CHAR next to CHAR
  fine). A would-be consecutive MAP becomes AI (or REF if an object anchors it) and vice versa.

## 4. Links (never fabricate; verify live)
- Find candidates with `commons_search.py` (several queries per call; `--maps --min 2000` for sheets).
  web_search is a supplement, not the route. A URL is only ever copied from a tool result this run.
- Accepted forms in the fills: the Commons File page (`https://commons.wikimedia.org/wiki/File:Exact_Name.jpg`)
  or the direct upload URL. link_verify.py rewrites every slot to the canonical upload URL the API
  returns and writes the honest tag. NEVER a Special:FilePath / Redirect link, never a Category, never a
  non-Wikimedia source, never a thumbnail, never a hand-built /x/xy/ path.
- ONE best link per section. The template's other slots are structural: ALT LINK 1 / 2 (and the HOOK's
  REF/MAP LINK 2) repeat slot 1 — build_breakdown writes them.
- MAP (and HOOK) SUMMARY duties: (a) antique 1700s–1900s plate — date / cartographer / atlas; (b) it
  SHOWS the named place; (c) PINPOINT — the label as printed (archaic spellings quoted: "Warschau"),
  where on the sheet (quadrant / beside which river, coast, neighbour), approximate modern coordinates.
  Choose the sheet like a cartographer: ≥ 2000 px on the long edge (3500+ preferred — link_verify FAILs
  under 2000), legible labels, the right extent, every place the section names on it. It is the sheet
  Phase C pins; a replacement later retro-fits the breakdown (one link, one truth).
- REF SUMMARY: what the image is and why it anchors the sentence. CHAR SUMMARY: who, what kind of
  image, date. Flag low resolution (link_verify warns under 800 px).
- Confidence tags (link_verify writes them): [VERIFIED - …] / [NOT FOUND - …]. If nothing real exists
  for a slot, the section is not a MAP / REF / CHAR — make it AI.

## 5. Content treatment (restraint)
For atrocity, executions, combat, famine, abuse: never depict killings, the act of execution, aiming
or firing at people, bodies, gore, wounds, torture, beatings, selections, victims in distress,
emaciation, suffering children, nudity, deportation trains with people. Render through distance and
exteriors, objects, witnesses at work, absence (empty chairs, rooms, roads), memorials, weather and
light. Executions: a corridor, a closed door, an empty gallows frame — never the act. Destruction:
architecture only. Minors dignified, period-accurate. Perpetrators plain and bureaucratic. All AI figures
are GENERIC people — never a real person's likeness (CHAR portraits are period-accurate types). State
the treatment in the plan's CONTENT TREATMENT line when it applies. format_lint flags violent words.

## 6. PROMPT WRITING — the detailed-prompt law (r18, anchored r19, period-locked r20)

### 6.0 First the STORY BIBLE, then any prompt
Before a single prompt is written, read the WHOLE narration and write `[Subject]_bible.md` (it ships in
the package; prompt_lint FAILs without it). It is the continuity sheet every prompt is written FROM:
- `## ERA` — the timeline of the story, year by year (and the decade of each flashback); what that
  means for dress, ships, weapons, lighting (1718: no naval uniform yet, tricorns, flintlocks, linen and
  wool; 1890: steel hulls, kerosene lamps, bowler hats).
- `## PLACES` — every real place the story visits, one bullet each: `- Nassau, New Providence (1717–18)
  — a pirate camp: palm-thatched huts and canvas tents on sand, a roofless coral-stone fort, sloops in the
  harbour, no streets, no garrison until Rogers lands in July 1718`. The look of the place AT THAT DATE
  (climate, vegetation, building materials, what existed and what did not).
- `## CAST` — every recurring figure as a fixed GENERIC description reused verbatim: `- the captain
  (Vane, 38 in 1718) — lean, sunburnt, dark unkempt shoulder-length hair, short beard, battered black
  tricorn, faded blue wool coat with brass buttons over an open linen shirt, cutlass belt`; the crew, the
  governor, the soldiers, the prisoners. Age them across the timeline.
- `## FORCES & DRESS` — THE WARDROBE BOARD: one bullet per role the script brings on (common sailor,
  officer, soldier, townsman, woman, enslaved worker, native people, priest…), each as a fixed phrase
  reused VERBATIM by every prompt, in this order — head, hair, neck, shirt, outer, legs, feet — using the
  period's own garment names plus their cut, then "Never: …" with the modern defaults the model would
  otherwise draw. Example (1718): `common sailor — head: red woollen Monmouth cap or tarred canvas hat;
  hair tied back in a queue; neck: dark neckerchief; shirt: loose off-white linen; outer: short-waisted
  blue wool sea jacket with cloth-covered buttons; legs: wide tarred canvas slops to below the knee over
  grey wool stockings; feet: square-toed buckled shoes or bare. Never: beanies, pea coats, checked shirts,
  ankle-length trousers, boots.` The real distinctions of that year (Royal Navy officers vs seamen,
  marines, militia, guarda costa, settlers) are separate bullets. prompt_lint FAILs a thin board.
- `## SHIPS & OBJECTS` — each vessel by name and type (a single-masted sloop is not a frigate), the
  documents, flags, weapons and tools the narration names.
- `## DO NOT` — the anachronisms and generic defaults this story must never show (redcoat town watch
  in a pirate camp, cobbled streets in the tropics, 19th-century pea jackets and knitted caps on a 1718
  sailor, Victorian lanterns, modern rigging, named-likeness faces).

### 6.1 Anchor every prompt in the film, never in the sentence alone
A prompt is written from the BIBLE + the section's own moment. The commonest failure is a sentence
illustrated in a vacuum: "a proclamation against pirates is posted" becomes a generic 1720s English
harbour street with a town watch — a scene from no film. Every prompt therefore:
- NAMES THE PLACE AND THE YEAR inside the prompt ("Nassau harbour, New Providence, July 1718"), so the
  image model and the viewer get the same place the narration is in. Place and date come from the
  bible's timeline for that section, not from the sentence's vibe.
- SHOWS THE STORY'S OWN PEOPLE — the cast entries, reused verbatim (generic, consistent, never a
  likeness). A "sailor" in a Vane section is a man of Vane's crew as the bible describes them; soldiers
  exist only where the bible puts them in that year; a crowd is the crowd this place had.
- KEEPS CONTINUITY — the same ship, the same season and weather as the neighbouring sections of the same
  day; a character who left the story does not reappear; wounds, cargo, flags carry over.
- IS THE REAL PLACE, not a type of place: the bible's materials and vegetation, the real harbour's shape,
  the building that actually stood there (or "no buildings — tents and huts" when that is the truth).
prompt_lint WARNs on a prompt that names no place from the bible or the breakdown's PLACES block; treat
it as an error to fix.

### 6.2 Dress that cannot drift modern (r20)
The image model has no sense of period: it draws the garment WORD. "jacket", "cap", "trousers",
"shirt", "boots" are drawn as today's jacket, cap, trousers; "knitted cap" is a beanie, "checked shirt" a
plaid flannel, "pea coat" a 1950s pea coat — even inside a sentence that says 1720s. So every person in
a prompt is dressed from the WARDROBE BOARD with the period's own names AND the cut, and the prompt
carries three locks (prompt_lint FAILs without them):
1. THE ERA TOKEN in the first sentence — a year or decade ("Nassau harbour, July 1718", "a 1720s
   harbour street"); the model dresses the whole frame from it. CHAR bases too ("a 1720s English captain").
2. NO MODERN-RENDERING WORDS, ever: beanie, hoodie, sweater, jumper, jeans, denim, t-shirt, sneakers,
   zipper, wristwatch, sunglasses, baseball cap, bomber, cargo, tracksuit, backpack, rucksack, flannel,
   plaid, checked shirt, knitted cap, woolly hat, puffer, anorak, windbreaker, raincoat, rubber boots,
   polo, leggings, pea coat, cardigan, fleece. Say the period garment instead (Monmouth cap, slops,
   neckerchief, sea jacket, frock coat, cocked hat, gaiters, sabots).
3. A PERIOD LOCK on the people: at least two distinctive period garments in the sentence that dresses
   them (breeches, slops, stockings, buckled shoes, tricorne / cocked hat, waistcoat, justaucorps,
   doublet, Monmouth cap, neckcloth, cloak, petticoat, stays, bodice, puttees, shako, kepi…), or an
   explicit clause "nothing modern in any garment". An era-ambiguous word (jacket, cap, trousers, shirt,
   coat, hat, boots) is only ever written with its period cut right before it: "short-waisted sea
   jacket", "wide canvas slops", "cocked felt hat", "red wool coat with turned-back cuffs".
WORKED EXAMPLE — the failure: "a sailor … in a blue wool seaman's jacket, a checked linen shirt, wide
canvas trousers and a knitted cap" rendered a 1950s dockworker in a beanie and a plaid shirt beside two
correct 1720s soldiers (the soldiers had locks: red coats, tricorns, muskets; the sailor had none).
The fix, from the board: "a common sailor of the 1720s, foreground left, back half-turned: a man in his
thirties, weathered face, short beard, hair tied back in a queue, a red woollen Monmouth cap with a
rolled brim, a loose off-white linen shirt with a dark neckerchief knotted at the throat, a short-waisted
blue wool sea jacket with cloth-covered buttons, wide tarred canvas slops ending below the knee over grey
wool stockings, square-toed buckled shoes, a canvas sea bag at his feet … nothing modern in any garment."

Worked example (SCURVY DOGS, Vane at Nassau, the pardon proclamation):
WRONG — "Medium shot at evening on a harbour street in the 1720s, lantern light from a tavern doorway…
a sailor… in a blue wool seaman's jacket, a checked linen shirt… knitted cap… two soldiers of the town
watch in red coats and tricorns…" (generic English port; invented watch; 1800s seaman's dress; no place).
RIGHT — "Medium shot at dusk in Nassau, New Providence, July 1718: a sandy track between palm-thatched
huts and canvas tents above the harbour, the roofless coral-stone fort on the rise behind; the King's
proclamation of pardon nailed to a post outside a driftwood-plank rum shack; in the foreground left a
pirate of Vane's sloop reads it — barefoot, sunburnt, a loose linen shirt open at the chest, tarred
canvas breeches cut below the knee, a red headscarf, a cutlass on a leather belt; behind him to the right
two crewmates in striped jerseys and tarred hats carry a water cask toward the beach; out in the harbour
the masts of Woodes Rogers' ships at anchor against a deep blue tropical dusk, one lantern glowing in
the shack doorway, smoke from cooking fires drifting across the sand."

Every section has exactly ONE prompt. AI sections: `PROMPT 1:`; HOOK / MAP / REF / CHAR: one
`-ALTERNATIVE-` prompt (`PROMPT 1: |CHANNEL ART STYLE|`) — the fallback picture. Each prompt is ONE
scene, one line, ending with the channel STYLE SUFFIX verbatim (build_breakdown appends it). All
prompts in a file are different. Prompt length is not a concern; detail and grounding are.

A prompt is a SHOT LIST a painter could execute without the narration. It names, in this order:
1. THE SHOT — framing (wide / medium / close), camera height, time of day and light, weather.
2. THE PLACE — the real setting the section names: the geography, the architecture, the materials
   (tarred planks, coral-stone fort, thatched huts, cobbles, pine boards), the period details.
3. THE PEOPLE — every person in frame, each with: role and age, build and features (hair, beard,
   skin weathered or pale, scar, posture), and WHAT THEY WEAR IN THAT TIME AND PLACE, specifically
   (a 1718 sailor: loose linen shirt, tarred canvas breeches, a red headscarf, bare feet; a captain:
   long wool coat with brass buttons, tricorn, bucket-top boots; an 1890s Arctic expedition: sealskin
   parka, fur-trimmed hood, mittens, leather boots; a 1920s clerk: wool three-piece suit, detachable
   collar, flat cap). Period-correct cut, cloth and colour, worn and dirty where the story is.
4. THE PLACEMENT — where each person stands or sits relative to the frame and to each other
   (foreground left, leaning on the rail; middle ground right, facing the first; silhouetted in the
   background doorway), and what they are DOING at this moment of the narration.
5. THE SURROUNDINGS — objects, animals, vessels, tools, weather effects, background depth.
Rules: concrete and literal (no metaphors, no "swirling vortex of fate", no runes, no floating things,
no anachronisms); one moment, not a montage; the section's own content, not the whole story; generic
figures (describe the type, never the historical person by name in an AI prompt); restraint (§5).
Floors enforced by prompt_lint.py: AI ≥ 90 words before the suffix, -ALTERNATIVE- ≥ 60, CHAR base ≥ 45;
people without a dress term FAIL; no story bible (or a thin wardrobe board) FAIL; no era token, a
modern-rendering garment word, people without a period lock FAIL; missing placement / light / setting
cues, an era-ambiguous garment without its cut, no bible place WARN.

HOOK / MAP / REF alternative prompts follow the same law (a scene standing in for the real image).
CHAR prompt base: "Medium-shot portrait, solid black background, subject centered and looking toward the
viewer: " + a period-accurate GENERIC description — age, build, face and hair, expression, exactly what
they wear (cut, cloth, colour, insignia), how the shoulders turn. The script writes the base + ". " +
suffix. The person's name belongs to the CHARACTER INTRODUCTION line, never to the prompt.

## 7. Writing the fills (what you type)
First `[Subject]_bible.md` (§6.0), then `[Subject]_fills.txt` — blocks `## S<n>` with the keys the section's type needs (see
build_breakdown.py's header): HOOK/MAP: MAP SUBJECT, LINK, SUMMARY, PROMPT · REF: LINK, SUMMARY,
PROMPT · AI: PROMPT · CHAR: CHARACTER, BORN, DIED, ROLE (3–6 sentences grounded in the script),
REFERENCE, SUMMARY, PROMPT; plus the closing blocks `## CHARACTERS` (one entry per card: `• Name (CHAR n,
Section N)` / `   Born …; Died ….` / `   role`), `## ALSO NAMED`, `## PLACES`, `## KEY TERMS` (bullets
`• X — one line (Sections …).`). THEME (2–4 lines) and CONTENT TREATMENT go in the plan file.
Write the fills in batches of ~10 sections per tool call (bash `cat >> file <<'EOF'`), never echoing them
in chat. Then `build_breakdown.py` (it lists any empty slot), `link_verify.py`, `run_all.py`.

## 8. The template (as the script writes it — for reading and in-place edits)
Header: `HISTORY MAPS CHANNELS — <TITLE>` / `VIDEO BREAKDOWN — PAUSE-ALIGNED TIMING`, TOTAL SPOKEN
WORDS, TOTAL DURATION, CALCULATED WPM, WORDS PER SECOND, SECTION COMPOSITION, SECTION TIMECODES
(EXACT), TARGET SECTION LENGTH (+ outliers note), TOTAL SECTIONS, HOOK, AI Generated Artwork, Reference
Images, Reference Maps, Character Introductions, CHANNEL, STYLE SUFFIX "…", NOTE (two lines), CONTENT
TREATMENT (optional), THEME (indented continuation lines), REMINDER.
Section block: `SECTION n | NN words | TYPE k` between 40-dash lines; blank; `TIMECODE: …`; blank;
`STARTS AT: "eight words..."`; `SCRIPT:`; the verbatim text on ONE line; (HOOK/MAP) `MAP SUBJECT: …`
directly under it; blank; links (3-space labels, 6-space summaries); `-ALTERNATIVE-`; `PROMPT 1: |CHANNEL
ART STYLE|`; the prompt; blank. AI: `PROMPT 1:` then the prompt. CHAR: CHARACTER INTRODUCTION / BORN /
DIED / ROLE / REFERENCE + summary, then the alternative. Closing blocks: SUMMARY TABLE, VISUAL TYPE
COUNT, CHARACTERS / PEOPLE (+ "Also named…"), PLACES, KEY TERMS.
After time_breakdown the TIMECODE line reads `TIMECODE: HH:MM:SS.mmm → HH:MM:SS.mmm  |  DURATION: SS.ss s`;
the timeline is contiguous from 00:00:00.000 to the audio's end. The SPECIAL breakdown and the three
SRTs are derived by the scripts and never hand-built.

## 9. Wikimedia access ladder (only if the container's network is blocked)
The container reaches the Commons API directly (link_verify / commons_search / fetch_assets). If every
call fails: RUNG 2 — Claude in Chrome, one tab on commons.wikimedia.org, javascript_tool POSTs to
/w/api.php (imageinfo, 50 titles), HEAD-check the URLs in-page; RUNG 3 — `make_link_resolver.py`
writes a page the user runs. On every rung a URL is copied VERBATIM from the API, never built.
