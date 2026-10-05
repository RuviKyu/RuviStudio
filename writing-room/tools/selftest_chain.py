#!/usr/bin/env python3
"""
selftest_chain.py — proves the whole writing-room toolchain end to end on the synthetic packet.
    python3 tools/selftest_chain.py [--work /tmp/ruvi_selftest] [--offline]
Steps: make_test_packet → bootstrap → propose_sections → (a scripted "writing room" sets the types and
writes the fills) → build_breakdown → link_verify (live Commons API; --offline skips it) → run_all →
bundle (fake pins on the real sheet dims) → sfx + description → review_run. Exit 1 on any failure.
"""
import os, re, sys, json, shutil, subprocess, argparse
HERE = os.path.dirname(os.path.abspath(__file__)); WR = os.path.dirname(HERE); S = os.path.join(WR, "scripts")
ap = argparse.ArgumentParser(); ap.add_argument("--work", default="/tmp/ruvi_selftest"); ap.add_argument("--offline", action="store_true"); a = ap.parse_args()
W = a.work; shutil.rmtree(W, ignore_errors=True); os.makedirs(W)
def run(*cmd, ok=(0,), cwd=None):
    print("\n$ " + " ".join(cmd)); p = subprocess.run([sys.executable] + list(cmd), capture_output=True, text=True, cwd=cwd)
    out = (p.stdout + p.stderr).strip().split("\n"); print("\n".join("    " + l for l in out[-14:]))
    if p.returncode not in ok: sys.exit(f"FAILED: {cmd[0]} (exit {p.returncode})")
    return p.stdout
run(os.path.join(HERE, "make_test_packet.py"), os.path.join(W, "pk"), "--suffix-file", os.path.join(WR, "Channel_Prompt_Suffixes.txt"))
run(os.path.join(S, "bootstrap.py"), os.path.join(W, "pk", "packet.zip"), "--subject", "Vane", "--out", W)
F = os.path.join(W, "Vane"); run(os.path.join(S, "propose_sections.py"), F)
sent = [l.split("\t", 5) for l in open(os.path.join(F, "Vane_sentences.tsv"), encoding="utf-8").read().split("\n")[1:] if l.strip()]
def sec_of(frag, plan):
    idx = next(int(s[0]) for s in sent if frag in s[5])
    for ln in plan:
        m = re.match(r"^S(\d+) \| (\d+)-(\d+)", ln)
        if m and int(m.group(2)) <= idx <= int(m.group(3)): return int(m.group(1))
plan = open(os.path.join(F, "Vane_plan.txt"), encoding="utf-8").read().split("\n")
CH = sec_of("Charles Vane was an Englishman", plan); MP = sec_of("Windward Passage between Cuba", plan); RF = sec_of("hanged at Gallows Point", plan)
if RF == MP or RF == CH: RF = None
out = []
for ln in plan:
    if ln.startswith("THEME: [FILL — 2"): ln = "THEME: Charles Vane, the pirate who refused the 1718 royal pardon at Nassau and sent a fireship at Woodes Rogers' squadron"
    elif ln.startswith("THEME: [FILL]"): ln = "THEME: Charleston, the mutiny that gave his ship to Calico Jack, the wreck in Honduras, the hanging at Port Royal in 1721"
    elif ln.startswith("CONTENT TREATMENT:"): ln = "CONTENT TREATMENT: no torture, hanging or bodies depicted — Gallows Point and Gun Cay rendered as empty shore and chains at a distance; the fireship as a glow on the water"
    m = re.match(r"^(S(\d+) \| [\d-]+ \| )AI(.*)$", ln)
    if m:
        n = int(m.group(2)); ty = {CH: "CHAR", MP: "MAP", RF: "REF"}.get(n, "AI"); ln = m.group(1) + ty + m.group(3)
    out.append(ln)
open(os.path.join(F, "Vane_plan.txt"), "w", encoding="utf-8").write("\n".join(out))
ranges = {int(l[1:3]): tuple(map(int, l.split("|")[1].strip().split("-"))) for l in out if l.startswith("S")}
def opening(a, b): return " ".join(" ".join(s[5] for s in sent[a - 1:b]).split()[:6])
SHEET1 = "https://commons.wikimedia.org/wiki/File:The_coast_of_West_Florida_and_Louisiana._The_Peninsula_and_Gulf_of_Florida_or_Channel_of_Bahama_with_the_Bahama_Islands._LOC_73694437.jpg"
SHEET2 = "https://commons.wikimedia.org/wiki/File:A_chart_of_the_Windward_passage_including_Jamaica,_Hispaniola_and_part_of_Cuba,_surveyed_by..._Benj._Candler_-_btv1b530095777.jpg"
PORTRAIT = "https://commons.wikimedia.org/wiki/File:Captain_Charles_Vane_LCCN2007675646.jpg"
REFIMG = "https://commons.wikimedia.org/wiki/File:Port_Royal_earthquake_1692_by_Jan_Luyken_and_Pieter_van_der_Aa.jpg"
DRESSED = ("in the foreground on the left a weathered sailor in a loose linen shirt, tarred canvas breeches, a red headscarf and bare feet leans on a cask, beside him a younger crewman "
           "in a striped jersey and knitted cap coils a rope, in the middle ground to the right the captain in a long faded blue wool coat with brass buttons, a black tricorn and bucket-top boots "
           "stands with one hand on his cutlass hilt, and in the hazy background the masts of anchored ships and a low shoreline of palms and thatched huts fade into warm evening light under a heavy overcast sky, "
           "late-afternoon sun breaking through in one diffused shaft")
fills = ["## S1", "MAP SUBJECT: Nassau @ 25.0781,-77.3386 [source: script]", "LINK: " + SHEET1,
         "SUMMARY: Jefferys / Sayer & Bennett 1775 'Coast of West Florida and Louisiana … Channel of Bahama with the Bahama Islands' — engraved sea chart of the Bahama bank; shows New Providence with Nassau. PINPOINT: 'Providence I.' with 'Nassau' on its north shore, right-hand third of the sheet, north of Andros; approx 25.08,-77.34.",
         "PROMPT: A wide establishing view of Nassau harbour at dawn in July 1718, seen from the ridge above the roofless stone fort: " + DRESSED.replace("evening", "dawn")]
if CH: fills += [f"## S{CH}", "CHARACTER: Charles Vane", "BORN: c. 1680 - England", "DIED: 29 March 1721 - Port Royal, Jamaica (hanged at Gallows Point; about 41)",
                 "ROLE: English pirate captain of the Golden Age, trained under Henry Jennings. Refused Woodes Rogers' pardon at Nassau in 1718 and escaped behind a fireship, raided off Charleston, was deposed by his crew for Calico Jack, wrecked in Honduras and hanged at Port Royal in 1721.",
                 "REFERENCE: " + PORTRAIT, "SUMMARY: Early-18th-century engraved portrait 'Captain Charles Vane' from the General History of the Pyrates (LoC copy), three-quarter length with a burning ship behind him.",
                 "PROMPT: a weathered English pirate captain in his late thirties, lean sunburnt face, dark unkempt shoulder-length hair under a battered black tricorn hat, a stained blue wool coat with tarnished brass buttons over a loose linen shirt open at the throat, a wide leather belt with a flintlock pistol and cutlass, hard narrowed eyes, a thin scar on the left cheek, square shoulders turned slightly to the right"]
if MP: fills += [f"## S{MP}", "MAP SUBJECT: Windward Passage @ 20.0000,-74.0000 [source: script]", "LINK: " + SHEET2,
                 "SUMMARY: Benjamin Candler's c.1700 'Chart of the Windward Passage including Jamaica, Hispaniola and part of Cuba' (BnF) — the strait the section names. PINPOINT: the open water between the east cape of Cuba (upper left-centre) and the north-west cape of Hispaniola (centre), Jamaica lower left; approx 20.0,-74.0.",
                 "PROMPT: A pirate sloop running down the Windward Passage at midday under a hard tropical sun, the blue mountains of eastern Cuba on the left horizon and the grey cliffs of Hispaniola on the right: " + DRESSED.replace("evening", "midday")]
if RF: fills += [f"## S{RF}", "LINK: " + REFIMG, "SUMMARY: Jan Luyken / Pieter van der Aa engraving of Port Royal, Jamaica, c.1700 — the harbour town on its spit with ships in the roads; the real place the section names.",
                 "PROMPT: Gallows Point at Port Royal at dusk in March 1721 seen from the water, an empty wooden gallows frame on the sandy spit in the foreground right with no one on it: " + DRESSED.replace("evening", "dusk")]
scenes = ["on the quarterdeck of the sloop at anchor", "in the roofless stone fort above the harbour", "on the crowded beach camp among tents", "aboard a captured merchant brigantine", "in the smoky cabin by lamplight", "on the quay of Charleston harbour", "on the deck of the twelve-gun brigantine", "on the white sand of Green Turtle Cay", "in a small sloop off the Honduras coast", "on the reef island after the storm", "in the courtroom at Spanish Town", "on the Port Royal waterfront", "at the tavern table in Nassau", "beside the ship's wheel in a squall", "at the water barrel on deck", "along the mangrove shore", "in the governor's whitewashed hall", "at the harbour mouth under the fort guns", "on the beach by the burning hull", "under the palms at the camp edge", "at the rail watching the horizon", "in the hold among casks", "on the fort rampart at night", "at the careening beach"]
k = 0
for n, (x, y) in ranges.items():
    if n in (1, CH, MP, RF): continue
    fills += [f"## S{n}", f"PROMPT: A medium-wide view {scenes[k % len(scenes)]} in 1718, the moment the narration describes as '{opening(x, y)}': " + DRESSED]; k += 1
fills += ["## CHARACTERS", "• Charles Vane (CHAR 1, Section %s)" % CH, "   Born c. 1680, England; Died 29 March 1721, Port Royal, Jamaica.", "   English pirate captain; refused the 1718 pardon, deposed by his crew, hanged at Port Royal.",
          "## ALSO NAMED", "• Henry Jennings — privateer who raided the Spanish salvage camps; Vane's first captain.", "• Woodes Rogers — governor of the Bahamas who brought the royal pardon in 1718.", "• John Rackham, Calico Jack — Vane's quartermaster, later captain of the brigantine.",
          "## PLACES", "• Nassau, New Providence — the pirate camp and harbour (Sections 1-3).", "• Windward Passage — Vane's hunting ground (Section %s)." % MP, "• Port Royal, Jamaica — trial and execution (Section %s)." % RF,
          "## KEY TERMS", "• King's pardon — the 1718 royal proclamation of amnesty (Section 1).", "• Fireship — a vessel loaded with combustibles set adrift against a fleet."]
open(os.path.join(F, "Vane_fills.txt"), "w", encoding="utf-8").write("\n".join(fills) + "\n")
run(os.path.join(S, "build_breakdown.py"), F)
if not a.offline: run(os.path.join(S, "link_verify.py"), F)
run(os.path.join(S, "run_all.py"), F)
# the bundle: pins from the sheet dims in refs.json (no network needed) — not geographic truth, a schema test
refs = json.load(open(os.path.join(F, ".selftest", "refs.json"))) if os.path.exists(os.path.join(F, ".selftest", "refs.json")) else {}
os.makedirs(os.path.join(F, ".selftest", "maps"), exist_ok=True)
if not refs: refs = {"HOOK 1.jpg": {"w": 14837, "h": 6231, "source_url": "x.jpg", "type": "HOOK"}, "MAP 1.jpg": {"w": 11542, "h": 8190, "source_url": "x.jpg", "type": "MAP"}, "CHAR 1.jpg": {"w": 1099, "h": 1536, "source_url": "x.jpg", "type": "CHAR"}, "REF 1.jpg": {"w": 5651, "h": 3390, "source_url": "x.jpg", "type": "REF"}}
json.dump(refs, open(os.path.join(F, ".selftest", "refs.json"), "w"), indent=1)
for asset, r in refs.items():
    if r["type"] in ("HOOK", "MAP"):
        w, h = r["w"], r["h"]; name = "Nassau" if r["type"] == "HOOK" else "Hispaniola"
        obj = {"render": "highlight", "locations": [{"name": name, "x": int(w * 0.62), "y": int(h * 0.41), "highlight": True, "shape": [[int(w * .60), int(h * .40)], [int(w * .64), int(h * .40)], [int(w * .64), int(h * .43)], [int(w * .60), int(h * .43)]]}]}
        if r["type"] == "MAP": obj["locations"].append({"name": "Cuba", "x": int(w * 0.3), "y": int(h * 0.3), "spoken": "cuba"}); obj["locations"].append({"name": "Jamaica", "x": int(w * 0.2), "y": int(h * 0.7)})
        json.dump(obj, open(os.path.join(F, ".selftest", "maps", os.path.splitext(asset)[0] + ".json"), "w"), indent=1)
stills = [{"source_file": "CHAR 1.jpg", "still_type": "CHAR", "name": "Charles Vane", "side": "left", "background": "light", "face": {"xNorm": 0.5, "yNorm": 0.28}, "treatment": "auto"},
          {"source_file": "REF 1.jpg", "still_type": "REF", "focus": {"xNorm": 0.55, "yNorm": 0.5}, "move": "auto"}]
json.dump(stills, open(os.path.join(F, ".selftest", "stills.json"), "w"), indent=1)
run(os.path.join(S, "bundle.py"), "build", F)
nsec = len(ranges)
sfx = {"target_lufs": -34, "cues": [{"sound": "ocean waves shore surf", "from": 1, "to": nsec, "level": 0, "note": "the sea under everything"},
                                   {"sound": "wooden ship creaking rigging", "from": 1, "to": max(1, nsec // 2), "level": -3},
                                   {"sound": "seagulls harbour", "from": 1, "to": 3, "level": -4},
                                   {"sound": "tavern inn crowd murmur", "from": max(2, nsec // 2 + 1), "to": nsec, "level": -3}]}
json.dump(sfx, open(os.path.join(F, "Vane_sfx.json"), "w"), indent=1)
desc = ["☠️ Subscribe now for more incredible pirate history, forgotten captains, brutal sea battles, and the untold stories of the Golden Age of Piracy! ⚓ Hit the notification bell 🔔 and join us as we uncover the real stories behind the pirates who became legends.",
        "▶ / @scurvydogsyt", "Few pirate stories end as stubbornly as that of Charles Vane, a Nassau captain whose career took him from the Windward Passage to the gallows at Port Royal. ☠️",
        "In this video, we uncover the story of Charles Vane, an English sailor turned pirate captain in the Bahamas of 1717. His story reveals how the royal pardon broke the pirate republic.",
        "⚓ It begins at Nassau in July 1718, with a Royal Navy squadron closing in and every other captain lined up for the King's pardon.",
        "He took sloops and brigantines in the Windward Passage, sailed with Calico Jack as his quartermaster and raided eight ships off Charleston.",
        "🌊 But life as a pirate was never secure. His crew voted him out near Green Turtle Cay, a hurricane wrecked his sloop in the Bay of Honduras, and an old acquaintance named Holford recognised him.",
        "🔥 Tried at Spanish Town in March 1721, he was hanged at Gallows Point and hung in chains on Gun Cay.",
        "What made him refuse the pardon? How did he escape a whole squadron with one fireship? And why did his own men turn on him?",
        "☠️ From Nassau to Port Royal, Charles Vane's story offers a dark look into the pirate republic of the Bahamas and the price of refusing the King's mercy.",
        "If you enjoy Charles Vane, pirate history, Golden Age of Piracy, pirate captains, Royal Navy history, maritime history, naval warfare, pirate documentaries, and true stories from the Age of Sail, this is a story you won't want to miss.",
        "👍 If you enjoyed the video, leave a comment, hit the like button, and subscribe for more fascinating stories about pirates, forgotten captains, legendary ships, and the brutal reality of life on the high seas! ⚓🌊☠️",
        "#CharlesVane #PirateHistory #Pirates #GoldenAgeOfPiracy #PirateCaptain #PirateDocumentary #MaritimeHistory #NavalHistory #RoyalNavy #AgeOfSail #HistoryDocumentary #PirateStories", "",
        "PINNED COMMENT: Get our brand new ebook ( + audiobook) here! : Ebook + Audiobook : https://theancientstore.gumroad.com/l/vztpi"]
open(os.path.join(F, "Vane_description.txt"), "w", encoding="utf-8").write("\n".join(desc) + "\n")
shutil.copyfile(os.path.join(F, "Vane_breakdown.txt"), os.path.join(F, "Vane_breakdown_original.txt"))
run(os.path.join(S, "review_run.py"), F)
pkg = os.path.join(F, "Vane_package.zip"); import zipfile
names = zipfile.ZipFile(pkg).namelist(); need = ["Vane_breakdown.txt", "Vane_auto_video_structure.txt", "Vane_auto_video_structure.json", "Vane_ai_prompts.txt", "Vane_ai_prompts.csv", "Vane_allanimations.json", "Vane_sfx.json", "Vane_description.txt", "Vane_download_links.txt", "Vane_manifest.json", "Vane_changes.md", "Vane_word_level.srt"]
missing = [n for n in need if n not in names]; stray = [n for n in names if re.search(r"_(plan|sentences|fills|meta)\.|Channel_Prompt", n)]
print("\nPACKAGE:", os.path.basename(pkg), len(names), "files"); print("  missing:", missing or "none"); print("  stray:", stray or "none")
if missing or stray: sys.exit(1)
print("\nSELFTEST CHAIN: PASS")
