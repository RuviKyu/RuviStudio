#!/usr/bin/env python3
"""
make_test_packet.py — build a SYNTHETIC packet.zip exactly as Ruvi Studio 3.12 writes one
(00_README_FOR_CLAUDE.md, the script .docx, *_word_level.srt, *_words.json,
Channel_Prompt_Suffixes.txt, _sfx_catalog.json, _cta.json), so the writing-room chain can be
tested end to end without a real title.

    python3 make_test_packet.py <out_dir> [--suffix-file path] [--channel "[SCURVY DOGS]"]
"""
import os, sys, re, json, zipfile, random, argparse

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--suffix-file", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Channel_Prompt_Suffixes.txt"))
ap.add_argument("--channel", default="[SCURVY DOGS]")
ap.add_argument("--title", default="7. Charles Vane - The Pirate Who Refused Every Pardon")
ap.add_argument("--wps", type=float, default=3.1)
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)

NARRATION = """In the summer of 1718, a single pirate sloop sat at anchor in the harbour of Nassau while a Royal Navy squadron closed in from the sea. Every other captain in the Bahamas had already lined up to accept the King's pardon. One man refused. His name was Charles Vane, and before the week was out he would set a captured French ship ablaze and sail it straight at the governor's flagship. This is the story of the pirate who would not surrender.
Nassau in 1717 was not a town so much as a camp. The fort had no roof, the church had no priest, and the harbour was crowded with the sloops of men who answered to no crown. Charles Vane had arrived there like most of them, as a sailor without a berth after the War of the Spanish Succession ended. Within a year he had a crew, a sloop, and a reputation for cruelty that unsettled even other pirates.
Charles Vane was an Englishman of unknown birth, probably born around 1680. He served first under Henry Jennings, the privateer who had looted the Spanish salvage camps on the Florida coast. From Jennings he learned the trade: how to pick a prize, how to board, and how to divide the spoils. By 1717 he was sailing on his own account, and the merchants of the Caribbean learned to fear the sight of his black flag.
His favourite hunting ground lay along the Windward Passage between Cuba and Hispaniola, where ships bound for Jamaica had to thread a narrow channel. There Vane took sloops, brigantines and at least one ship out of Bermuda, stripping each of her cargo and often torturing the crew for the fun of it. Witnesses later told the Admiralty that he hung one sailor from the bowsprit and beat him with the flat of a cutlass.
In July 1718 the new governor, Woodes Rogers, arrived at Nassau with two warships and a royal proclamation of pardon. Vane sent him a letter. He would accept the pardon, he wrote, if he could keep every penny of his plunder. When the answer did not come, he loaded a captured French prize with powder and pitch, set her alight, and let the wind carry her into the anchored squadron. In the confusion his sloop slipped out through the eastern channel with the flag still flying.
The man who stood beside Vane that night was John Rackham, better known as Calico Jack. Rackham was Vane's quartermaster, a smooth talker in striped cotton who would later sail with Anne Bonny and Mary Read. For now he was content to follow a captain who seemed to have the devil's own luck.
Free of Nassau, Vane sailed north along the coast of the Carolinas. Off Charleston he took eight ships in a matter of weeks, including a large brigantine with a cargo of slaves and a sloop loaded with rum and sugar. The merchants of Charleston petitioned the governor for help, and two armed sloops under Colonel William Rhett were sent out to find him. They found Stede Bonnet instead, and Vane escaped again.
Vane's ship by now was a brigantine of twelve guns, taken off Charleston and renamed. With her he turned south again, toward the islands of the Bahamas, where he knew every cay and sandbar. Along the way he captured the sloop of a Jamaican planter named Blackbeard's old associate, Robert Deal, and gave him command of the prize.
In November 1718, near Green Turtle Cay in the Abacos, Vane sighted a French man-of-war and ordered an attack. The Frenchman turned out to be too strong, and Vane broke off the fight. To his crew that was cowardice. The next morning they voted him out of the captaincy and gave the brigantine to Calico Jack, who put Vane and his few loyal men into a small sloop and sailed away.
Vane did not quit. With the sloop and a crew of fifteen he worked the coast of Honduras and the Bay of Campeche, taking small traders and fishing boats for food and water. In February 1719 a hurricane drove his sloop onto the reef of a small island in the Bay of Honduras. Most of the crew drowned. Vane crawled ashore with nothing.
For weeks he lived on turtles and the fish he could catch, until a ship from Jamaica put in for water. Her captain was an old acquaintance named Holford, who recognised him at once and refused to take him aboard. A second ship, whose master did not know him, carried him off the island, but at Port Royal Holford saw him again and had him arrested.
Charles Vane was tried at Spanish Town in Jamaica in March 1721. The witnesses were his former prisoners, and the verdict took less than a day. On the twenty-ninth of March he was hanged at Gallows Point in Port Royal, and his body was hung in chains on Gun Cay as a warning to every sailor entering the harbour.
Why did he refuse the pardon that every other captain accepted? Vane never explained himself, and no letter of his survives. What survives is the record of his trial and the fear his name produced in the merchants of three colonies. He was never the richest pirate, nor the most successful. He was simply the one who would not bend, and the chains on Gun Cay were the crown's answer.
"""

PARAS = [p.strip() for p in NARRATION.strip().split("\n") if p.strip()]
# sentences (guard abbreviations the same way the chain does)
def sentences(text):
    text = re.sub(r"\b(Mr|Mrs|Dr|St|Col|Capt)\.", lambda m: m.group(1) + "<DOT>", text)
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [p.replace("<DOT>", ".") for p in parts if p.strip()]

random.seed(7)
t = 0.0
cues = []   # (start, end, word)
for para in PARAS:
    for s in sentences(para):
        ws = s.split()
        for i, w in enumerate(ws):
            dur = 1.0 / a.wps * random.uniform(0.7, 1.3)
            cues.append((t, t + dur, w)); t += dur + random.uniform(0.02, 0.12)
        t += random.uniform(0.45, 1.1)          # sentence pause
    t += random.uniform(0.3, 0.8)               # paragraph pause
total = t

def ts(x):
    ms = int(round(x * 1000)); h = ms // 3600000; m = ms // 60000 % 60; s = ms // 1000 % 60; f = ms % 1000
    return f"{h:02d}:{m:02d}:{s:02d},{f:03d}"

stem = re.sub(r"^\d+\.\s*", "", a.title); stem = re.sub(r"[^\w]+", "_", stem).strip("_")
srt_lines = []
for i, (s0, s1, w) in enumerate(cues, 1):
    srt_lines += [str(i), f"{ts(s0)} --> {ts(s1)}", w, ""]
open(os.path.join(a.out, f"{stem}_word_level.srt"), "w", encoding="utf-8").write("\r\n".join(srt_lines))
json.dump({"segments": [{"words": [{"word": w, "start": round(s0, 3), "end": round(s1, 3)} for s0, s1, w in cues]}]},
          open(os.path.join(a.out, f"{stem}_words.json"), "w", encoding="utf-8"))

# the docx (python-docx if present, else a minimal hand-built one)
docx_path = os.path.join(a.out, f"{stem}.docx")
try:
    import docx
    d = docx.Document()
    for p in PARAS: d.add_paragraph(p)
    d.save(docx_path)
except Exception:
    from xml.sax.saxutils import escape
    body = "".join(f"<w:p><w:r><w:t xml:space=\"preserve\">{escape(p)}</w:t></w:r></w:p>" for p in PARAS)
    doc = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>{body}</w:body></w:document>'
    with zipfile.ZipFile(docx_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
        z.writestr("_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
        z.writestr("word/document.xml", doc)

suffix = open(a.suffix_file, encoding="utf-8").read()
open(os.path.join(a.out, "Channel_Prompt_Suffixes.txt"), "w", encoding="utf-8").write(suffix)
catalog = {"files": {"ocean_waves_shore_surf_cc0.mp3": {"tags": ["ocean", "waves", "shore", "surf"], "duration": 612.4, "lufs": -24.1, "license": "CC0", "source": "freesound"},
                     "wooden_ship_creaking_rigging.ogg": {"tags": ["wooden", "ship", "creaking", "rigging"], "duration": 388.0, "lufs": -27.3, "license": "CC0"},
                     "seagulls_harbour.ogg": {"tags": ["seagulls", "harbour", "gulls"], "duration": 240.0, "lufs": -26.0, "license": "CC0"}},
           "commons_set": ["campfire crackling night", "tropical rain canvas", "thunder distant storm"]}
json.dump(catalog, open(os.path.join(a.out, "_sfx_catalog.json"), "w"), indent=1)
cta = {"channel": a.channel, "folder": "C:\\RUVISTUDIO\\SCURVYDOGS\\CTA", "positions": [0.2, 0.5],
       "clips": [{"file": "CTA 1 ebook.mp4", "durationSec": 14.2}, {"file": "CTA 2 subscribe.mp4", "durationSec": 9.8}], "totalSeconds": 24.0}
json.dump(cta, open(os.path.join(a.out, "_cta.json"), "w"), indent=1)
chan_folder = a.channel.strip("[]").replace(" ", "")
title_folder = f"C:\\RUVISTUDIO\\{chan_folder}\\Titles\\{a.title}"
readme = "\n".join([
    f"# RUVI packet · {a.channel} · {a.title}", "",
    "Generated by Ruvi Studio 3.12.0. You are the writing room of the RUVI pipeline (prompt-set r16:",
    "Video Structure → Auto Video Structure → Cartographer → Stills → Music → Review, per this Project's instructions).",
    "This packet arrived as ONE zip; everything you need is inside it. Treat these paths as ground truth; do not re-ask.", "",
    "## This title",
    f"- channel: {a.channel}   (apply this channel's STYLE SUFFIX from Channel_Prompt_Suffixes.txt)",
    f"- title folder: {a.title}",
    f"- machine path: {title_folder}",
    "- tree: Script\\ (this packet, the VO .mp3) · Hook\\ Maps\\ Reference images\\ Characters\\ (section stills, downloaded by Ruvi Studio from your links)",
    "        AI Images\\ (001.jpg … one per 20-second AI section, generated from your prompts) · Output\\ (the finished video)", "",
    "## In this packet",
    f"- {stem}.docx   ← the narration",
    f"- {stem}_word_level.srt   ← whisper word timings of the VO (the section timecodes come from here)",
    "- Channel_Prompt_Suffixes.txt   ← the channel's style suffix + section rules (every AI section ≈ 20 s, one prompt each)",
    "- _cta.json   ← the channel's CTA inserts (positions, clips, seconds): Ruvi Studio inserts them at section starts; the remix must cover narration + their seconds",
    "- *_words.json (whisper's raw output) and Cover.* (the card's cover image) ride along; chats rarely need them",
    "- _sfx_catalog.json   ← the channel's ambience sounds already cached in SFX\\ (file, seconds, tags) + the bundled Commons set — plan the ambience cues with plain words (Video_Sfx.md)", "",
    f"## What to produce — ONE zip, saved into {title_folder}\\Script\\",
    f"**{stem}_package.zip** containing: the timed breakdown (working file), {stem}_auto_video_structure.txt/.json (one prompt per 20-s AI section,",
    f"specials as RENDER lines), {stem}_ai_prompts.txt (the same prompts, one per line, in order — for bulk image tools), {stem}_allanimations.json",
    f"(the animation bundle: every MAP incl. the HOOK, every REF / CHAR still), {stem}_sfx.json (the ambience plan: cues by section run), {stem}_description.txt, {stem}_download_links.txt, the SRTs.",
    "Ruvi Studio unpacks it, fetches the stills, waits for AI Images\\001…, renders every section natively and assembles the whole video with fades, letterbox, the CTAs, the VO and the faint ambience bed.", "",
    "## Rules the chat must follow",
    "  - AUTORUN: the packet drop is the instruction; never pause for confirmation; finish with the download.",
    "  - ONE best VERIFIED link per section — no alternates. The downloader uses link #1 only.",
    "  - View each MAP sheet AT ITS LINK yourself (browse / zoom / screenshot; web_fetch fallback). Never ask the user to upload map images.",
    "  - Every AI section ≈ 20 s (18–22, 25 ceiling), ONE prompt ending with the channel's STYLE SUFFIX verbatim.",
    "  - Ambience (no music): per scene run a faint base layer and one or two textures, as cues by section range with plain words; long recordings, short sounds once; -34 LUFS target.",
    "  - Review runs LAST as the audit of everything (timings, links, pins, schema, counts).", ""])
open(os.path.join(a.out, "00_README_FOR_CLAUDE.md"), "w", encoding="utf-8").write(readme)
zp = os.path.join(a.out, "packet.zip")
with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
    for n in ["00_README_FOR_CLAUDE.md", f"{stem}.docx", f"{stem}_word_level.srt", f"{stem}_words.json", "Channel_Prompt_Suffixes.txt", "_sfx_catalog.json", "_cta.json"]:
        z.write(os.path.join(a.out, n), n)
print(f"packet: {zp}  ({len(cues)} words, {total:.1f} s, {len(PARAS)} paragraphs)")
