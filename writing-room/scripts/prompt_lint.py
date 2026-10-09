#!/usr/bin/env python3
"""
PROMPT LINT — every prompt in the FULL breakdown must be DETAILED and GROUNDED (Video_Structure.md PHASE 6).

    python3 prompt_lint.py <folder> [--min 90] [--alt-min 60] [--char-min 45]

FAIL  · an AI PROMPT 1 under --min words before the suffix (default 90; PROMPT_MIN_WORDS in the channel block
        overrides), an -ALTERNATIVE- prompt under --alt-min (60; ALT_MIN_WORDS), a CHAR portrait base under
        --char-min (45)
      · the channel STYLE SUFFIX missing or not the LAST sentence of the prompt (verbatim)
      · a leftover placeholder ([FILL], [REWRITE…], TODO, …) · two prompts with the same text
      · a prompt that mentions people but names NO period dress term (the user's rule: every person is
        described — what they wear in that time, their features, where they stand)
      · no ERA token (a year, a decade "1720s", "18th-century") · a garment the image model renders as modern
        (beanie, hoodie, jeans, plaid, sneakers, pea coat …) · people without a PERIOD LOCK (two distinctive
        period garments or a "nothing modern" clause) · the plan without ERA / WARDROBE lines
      · no story bible ([Subject]_bible.md, Video_Structure.md §6.0) — prompts written from the whole film
WARN  · no PLACE from the bible / the breakdown's PLACES block (a scene
        from no film: a generic port, a generic street — rewrite it from the bible)
      · a prompt with people but no PLACEMENT cue (foreground/background/left/right/centre/beside…)
      · no LIGHT / TIME cue (dawn, dusk, noon, night, lamplight, overcast, moonlight…)
      · no SETTING cue (deck, harbour, street, room, forest, shore…) · symbolic / abstract wording
      · a real person's name inside an AI prompt (figures are generic — the name lives in the narration)
Writes .selftest/prompt_lint.md. Exit 1 on any FAIL.
"""
import os, re, sys, glob, argparse

ap = argparse.ArgumentParser(); ap.add_argument("folder"); ap.add_argument("--min", type=int, default=None); ap.add_argument("--alt-min", type=int, default=None); ap.add_argument("--char-min", type=int, default=45); ap.add_argument("--no-bible", action="store_true"); a = ap.parse_args()
F = a.folder
def is_bd(p):
    try: return len(re.findall(r"(?m)^SECTION\s+\d+\s*\|", open(p, encoding="utf-8", errors="ignore").read()))
    except Exception: return 0
cands = [p for p in glob.glob(os.path.join(F, "*.txt")) if is_bd(p) and not re.search(r"special|_original|auto_video", os.path.basename(p), re.I)]
if not cands: sys.exit("no FULL breakdown")
FULL = max(cands, key=is_bd); SUBJ = re.sub(r"(_breakdown)?\.txt$", "", os.path.basename(FULL)); text = open(FULL, encoding="utf-8").read()
msuf = re.search(r'(?m)^STYLE SUFFIX:\s*"(.+)"\s*$', text); SUF = msuf.group(1).strip() if msuf else ""
if not SUF: sys.exit("no STYLE SUFFIX in the header")
rules = {}
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from suffixes import parse_suffix_file, find_suffix_file, rules_for
    sp = find_suffix_file(F, os.path.join(F, ".packet"))
    mch = re.search(r"(?m)^CHANNEL:\s*(.+?)\s*$", text)
    if sp and mch:
        blk = parse_suffix_file(sp).get(mch.group(1).strip().strip("[]").upper())
        if blk: rules = rules_for(blk)
except Exception: pass
MIN = a.min or int(rules.get("PROMPT_MIN_WORDS", 90)); AMIN = a.alt_min or int(rules.get("ALT_MIN_WORDS", 60)); CMIN = a.char_min

HDR = re.compile(r"^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$")
PEOPLE = re.compile(r"\b(man|men|woman|women|sailor|sailors|crew|crewmen|pirate|pirates|captain|soldier|soldiers|officer|officers|figure|figures|people|boy|girl|child|children|merchant|merchants|governor|planter|witness|witnesses|crowd|villagers?|workers?|guards?|priest|monk|nun|king|queen|explorer|explorers|hunter|hunters|trader|traders|rider|riders|farmer|farmers|he|she|they|silhouettes?|person|persons)\b", re.I)
DRESS = re.compile(r"\b(coat|coats|frock|waistcoat|breeches|trousers|shirt|shirts|linen|wool|woollen|leather|tricorn|tricorne|hat|hats|cap|caps|bonnet|boots?|shoes?|buckled|stockings|cloak|cloaks|cape|uniform|uniforms|tunic|doublet|jerkin|sash|kerchief|headscarf|bandana|scarf|apron|gown|dress|skirt|petticoat|corset|bodice|fur|furs|parka|hood|hooded|mittens|gloves|cravat|neckcloth|wig|periwig|robe|robes|habit|armou?r|helmet|cuirass|braid|epaulettes?|buttons|belt|belted|cassock|toga|loincloth|moccasins?|sandals?|vest|jacket|jackets|overcoat|greatcoat|shawl|veil|turban|kaftan|smock|collar|lace|ruff)\b", re.I)
PLACE = re.compile(r"\b(foreground|background|midground|middle ground|left|right|centre|center|beside|behind|in front|ahead|at the (?:bow|stern|rail|helm|edge|far end)|to the (?:left|right)|across|along|facing|turned|silhouetted|framed|leaning|kneeling|standing|seated|sitting|crouch|walking|climbing)\b", re.I)
LIGHT = re.compile(r"\b(dawn|sunrise|morning|noon|midday|afternoon|dusk|sunset|evening|night|midnight|moonlight|moonlit|starlight|lamplight|candlelight|candle|lantern|lanterns|torchlight|firelight|overcast|grey light|gray light|storm light|sunlight|sun|shadow|shadows|haze|fog|mist|rain|golden hour|twilight|backlit|low light|glow)\b", re.I)
SETTING = re.compile(r"\b(deck|quarterdeck|hold|cabin|rigging|harbou?r|wharf|quay|dock|beach|shore|cove|reef|bay|sea|ocean|island|jungle|forest|village|town|street|square|market|tavern|inn|church|fort|fortress|wall|walls|gate|courtyard|hall|room|chamber|cell|courtroom|gallows point|road|trail|mountain|valley|river|lake|camp|tent|cove|plantation|field|fields|cliff|cave|ruins?|palace|castle|cathedral|archive|library|ice|snow|tundra|desert|prairie)\b", re.I)
ERA_TOKEN = re.compile(r"\b(1[3-9]\d\d|20[0-4]\d)s?\b|\b(1[0-9]|20)th[- ]century\b|\b(early|mid|late)[- ](1[3-9]\d\ds|[0-9]{1,2}th century)\b|\bmedieval\b|\bantiquity\b|\bbronze age\b|\biron age\b", re.I)
MODERN = re.compile(r"\b(beanie|hoodie|hoody|sweatshirt|sweater|jumper|jeans|denim|t-shirt|tee shirt|sneakers|trainers|zipper|zip-up|wristwatch|sunglasses|baseball cap|bomber jacket|cargo pants|tracksuit|backpack|rucksack|flannel|plaid|checked shirt|chequered shirt|gingham|knitted cap|knit cap|woolly hat|wool hat|puffer|anorak|windbreaker|raincoat|rubber boots|wellies|hi-vis|polo shirt|leggings|pea coat|peacoat|cardigan|fleece|nylon|velcro)s?\b", re.I)
AMBIGUOUS = re.compile(r"\b(jacket|cap|trousers|pants|vest|boots|shirt|coat|hat)\b", re.I)
PERIOD_QUAL = re.compile(r"\b(1[3-9]\d\ds?|period|century|wool|woollen|linen|canvas|tarred|leather|buckled|knee[- ]length|slops|breeches|frock|justaucorps|waistcoat|doublet|tricorne?|monmouth|thrum|homespun|broadcloth|fustian|hide|fur|sealskin|deerskin|buckskin|short-waisted|sea|cloth-covered|horn|pewter|brass|bucket-top|jackboots|hobnailed|riding|cocked|felt|straw|felted|oilskin)\b", re.I)
PERIOD_STRONG = re.compile(r"\b(breeches|slops|stockings|buckled|tricorne?|waistcoat|frock coat|justaucorps|doublet|hose|gaiters|cravat|neckcloth|neckerchief|monmouth cap|thrum cap|petticoat|stays|bodice|kerchief|cloak|tunic|toga|chiton|kimono|kaftan|parka|deerskin|buckskin|moccasins|top hat|bowler|crinoline|bustle|corset|breastplate|cuirass|helmet|mail|greaves|puttees|kepi|shako|bicorne|epaulettes?|redingote|pelisse|dolman|sash|queue|periwig|wig|cocked hat|jackboots|bucket-top boots|sabots|clogs|smock|habit|cassock|surcoat|hauberk|gambeson|jerkin|ruff|farthingale|pantaloons|tailcoat|cutaway|frock|bonnet|apron|headscarf|turban|loincloth|sandals)s?\b", re.I)
LOCK = re.compile(r"\b(no modern|nothing modern|period[- ](correct|accurate)|of the period|historically accurate)\b", re.I)
SYMBOLIC = re.compile(r"\b(vortex|tendrils? of|echoes of|shadow of (?:empire|fate|history)|destiny|swirling|ethereal|otherworldly|surreal|cosmic|mystical energy|glowing runes|floating|impossible)\b", re.I)
PLACEHOLDER = re.compile(r"\[(FILL|REWRITE|TODO|TBD)|\bTODO\b|\bTBD\b|lorem ipsum", re.I)
fails, warns, rows, seen = [], [], [], {}
# the story bible (§6.0) and the places it names; the breakdown's PLACES block is the second source
bible = glob.glob(os.path.join(F, "*_bible.md")); places = set()
if bible:
    bt = open(bible[0], encoding="utf-8", errors="ignore").read()
    if len(bt) < 600: fails.append("story bible is too thin (< 600 chars) — ERA, PLACES, CAST, FORCES & DRESS, SHIPS & OBJECTS, DO NOT")
    for sec_name, floor_chars in (("CAST", 200), ("FORCES & DRESS", 300), ("DO NOT", 80)):
        ms = re.search(r"(?ims)^##\s*" + re.escape(sec_name) + r"\s*$(.*?)(?=^##\s|\Z)", bt)
        if not ms or len(ms.group(1).strip()) < floor_chars: fails.append(f"story bible: '## {sec_name}' missing or too thin — the WARDROBE BOARD lives there (role → head, hair, neck, shirt, outer, legs, feet; and what is never worn)")
    if MODERN.search(bt) and not re.search(r"(?ims)^##\s*DO NOT", bt[:bt.find(MODERN.search(bt).group(0))] if MODERN.search(bt) else ""):
        warns.append("story bible: a modern-rendering garment word (" + MODERN.search(bt).group(0) + ") appears outside DO NOT — the model will draw it modern; name the period garment instead (Monmouth cap, slops, sea jacket)")
    sec = re.search(r"(?ims)^##\s*PLACES\s*$(.*?)(?=^##\s|\Z)", bt)
    for ln in (sec.group(1) if sec else "").split("\n"):
        m = re.match(r"^\s*[-•*]\s*([^—:(\n]{3,60})", ln)
        if m: places.add(m.group(1).strip().rstrip(",").lower())
elif not a.no_bible: fails.append("no [Subject]_bible.md — write the story bible before the prompts (Video_Structure.md §6.0)")
pb = re.search(r"(?s)^=+\nPLACES\n=+\n(.*?)(?=\n=+\n|\Z)", text, re.M)
for ln in (pb.group(1) if pb else "").split("\n"):
    m = re.match(r"^\s*•\s*([^—:(\n]{3,60})", ln)
    if m: places.add(m.group(1).strip().rstrip(",").lower())
place_words = set()
for pl in places:
    for part in re.split(r"[,/]| and ", pl):
        part = part.strip()
        if len(part) >= 4: place_words.add(part)
YEAR = re.compile(r"\b(1[0-9]\d\d|20[0-2]\d)s?\b|\b(1st|2nd|3rd|[4-9]th|1\dth|20th|21st)[- ]century\b|\b(BC|AD)\b")
lines = text.split("\n"); heads = [i for i, l in enumerate(lines) if HDR.match(l)]
char_names = re.findall(r"(?m)^CHARACTER INTRODUCTION:\s*(.+?)\s*$", text)
for k, hi in enumerate(heads):
    end = heads[k + 1] if k + 1 < len(heads) else len(lines); blk = lines[hi:end]; m = HDR.match(lines[hi]); num = int(m.group(1)); ty = m.group(3).split()[0].upper(); tag = f"S{num} {m.group(3).strip()}"
    pi = next((i for i, l in enumerate(blk) if re.match(r"^\s*PROMPT 1:", l)), None)
    if pi is None: fails.append(f"{tag}: no PROMPT 1"); continue
    body = []
    for l in blk[pi + 1:]:
        if not l.strip(): break
        body.append(l.strip())
    p = " ".join(body)
    if PLACEHOLDER.search(p): fails.append(f"{tag}: placeholder left in the prompt")
    if not p.lower().endswith(SUF.lower()): fails.append(f"{tag}: the STYLE SUFFIX is not the verbatim last sentence")
    base = p[:len(p) - len(SUF)].rstrip(" .") if p.lower().endswith(SUF.lower()) else p
    if ty == "CHAR": base = re.sub(r"(?i)^medium-shot portrait, solid black background, subject centered and looking toward the viewer:\s*", "", base)
    n = len(re.findall(r"[A-Za-z0-9'’]+", base)); floor = MIN if ty == "AI" else (CMIN if ty == "CHAR" else AMIN)
    if n < floor: fails.append(f"{tag}: prompt has {n} words before the suffix (floor {floor}) — describe the people, their period dress and features, the surroundings and where each person stands")
    key = re.sub(r"\W+", " ", base.lower()).strip()
    if key in seen: fails.append(f"{tag}: duplicate of {seen[key]}'s prompt")
    seen.setdefault(key, tag)
    has_people = bool(PEOPLE.search(base))
    if has_people and not DRESS.search(base): fails.append(f"{tag}: people appear but no period dress is described (coat, breeches, tricorn, linen shirt, boots, headscarf…)")
    if not ERA_TOKEN.search(base): fails.append(f"{tag}: no ERA token — name the decade or year in the first sentence ('in Nassau in July 1718', 'a 1720s harbour street'); the image model dresses the scene from it")
    mm = MODERN.search(base)
    if mm: fails.append(f"{tag}: '{mm.group(0)}' — a garment the image model renders as modern; use the period garment from the WARDROBE board instead")
    if has_people and len(set(m.group(0).lower() for m in PERIOD_STRONG.finditer(base))) < 2 and not LOCK.search(base):
        fails.append(f"{tag}: people without a PERIOD LOCK — give at least two distinctive period garments (breeches, slops, stockings, buckled shoes, tricorne, waistcoat, Monmouth cap, neckerchief, cloak, doublet…) or an explicit 'nothing modern' clause")
    for am in AMBIGUOUS.finditer(base):
        before = base[max(0, am.start() - 60):am.start()]
        if not PERIOD_QUAL.search(before) and not re.search(r"\b(red|blue|white|scarlet)\s+$", before): warns.append(f"{tag}: '{am.group(0)}' is era-ambiguous — add the period cut right before it (short-waisted sea jacket, wide canvas slops, cocked felt hat, red wool coat with turned-back cuffs)")
    if has_people and not PLACE.search(base): warns.append(f"{tag}: no placement cue for the people (foreground / background / left / right / beside / behind)")
    if ty != "CHAR" and not LIGHT.search(base): warns.append(f"{tag}: no light / time-of-day cue")
    if ty != "CHAR" and not SETTING.search(base): warns.append(f"{tag}: no concrete setting word")
    if SYMBOLIC.search(base): warns.append(f"{tag}: symbolic / abstract wording — show the literal thing being narrated")
    if ty != "CHAR" and place_words and not any(pw in base.lower() for pw in place_words): warns.append(f"{tag}: names no place from the story (bible / PLACES) — a generic setting is a prompt written from the sentence, not the film")
    for nm in char_names:
        sn = nm.split()[-1]
        if ty == "AI" and len(sn) > 3 and re.search(r"\b" + re.escape(sn) + r"\b", base): warns.append(f"{tag}: names {nm} inside an AI prompt — figures stay generic (describe the type, not the person)")
    rows.append(f"| {tag} | {n} | {'ok' if n >= floor else 'SHORT'} | {'yes' if has_people else '-'} | {'yes' if DRESS.search(base) else ('-' if not has_people else 'NO')} |")
os.makedirs(os.path.join(F, ".selftest"), exist_ok=True)
rep = [f"# prompt_lint — {SUBJ}", "", f"**{len(fails)} FAIL · {len(warns)} WARN** · floors: AI {MIN} · alternative {AMIN} · CHAR base {CMIN} words", "", "| section | words | floor | people | dress |", "|---|---|---|---|---|"] + rows + [""] + [f"- ❌ {x}" for x in fails] + [f"- ⚠️ {x}" for x in warns]
open(os.path.join(F, ".selftest", "prompt_lint.md"), "w", encoding="utf-8").write("\n".join(rep) + "\n")
for x in fails: print("[FAIL] " + x)
for x in warns: print("[warn] " + x)
print(f"PROMPT LINT: {len(fails)} FAIL / {len(warns)} WARN · {len(rows)} prompt(s) · floors AI {MIN} / alt {AMIN} / CHAR {CMIN} words")
sys.exit(1 if fails else 0)
