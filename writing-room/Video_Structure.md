# VIDEO STRUCTURE — PHASE S (the FULL breakdown)
PROMPT-SET REVISION 2026-10-06-r18 · pairs with Ruvi Studio 3.12 · scripts bundle 2026-10-06-r18.
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

## 6. PROMPT WRITING — the detailed-prompt law (r18)
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
people without a dress term FAIL; missing placement / light / setting cues WARN.

HOOK / MAP / REF alternative prompts follow the same law (a scene standing in for the real image).
CHAR prompt base: "Medium-shot portrait, solid black background, subject centered and looking toward the
viewer: " + a period-accurate GENERIC description — age, build, face and hair, expression, exactly what
they wear (cut, cloth, colour, insignia), how the shoulders turn. The script writes the base + ". " +
suffix. The person's name belongs to the CHARACTER INTRODUCTION line, never to the prompt.

## 7. Writing the fills (what you type)
`[Subject]_fills.txt` — blocks `## S<n>` with the keys the section's type needs (see
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
