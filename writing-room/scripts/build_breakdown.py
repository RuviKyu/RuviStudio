#!/usr/bin/env python3
"""
BUILD BREAKDOWN — writes <Subject>_breakdown.txt in the EXACT Video_Structure.md template from
  <Subject>_plan.txt       (sections = sentence ranges + TYPE; THEME / CONTENT TREATMENT lines)
  <Subject>_sentences.tsv  (the narration, verbatim, timed)
  <Subject>_meta.json      (channel, suffix, title, counts)
  <Subject>_fills.txt      (your creative content — see FILLS FORMAT; optional: without it every
                            slot is a [FILL] placeholder and the script exits 1 listing them)
    python3 build_breakdown.py <folder> [--allow-partial]
Re-run it whenever the plan or the fills change (it rewrites the whole file; TIMECODEs come back
as [PENDING] — run_all.py stamps them again).

FILLS FORMAT (<Subject>_fills.txt) — blocks start with "## S<n>" (the section number) or a
closing-block name; keys are one line each unless noted; order inside a block is free:
  ## S3                       (HOOK / MAP: MAP SUBJECT, LINK, SUMMARY, PROMPT · REF: LINK, SUMMARY, PROMPT
  MAP SUBJECT: Nassau @ 25.0600,-77.3450 [source: script]        · AI: PROMPT · CHAR: see below)
  LINK: https://commons.wikimedia.org/wiki/File:Exact_Name.jpg   (one best verified file; slots 2/3 repeat it)
  SUMMARY: <what the sheet/image is; for a MAP: era, shows the place, PINPOINT (label as printed,
            position on the sheet, approx modern coords)> [VERIFIED - …]
  PROMPT: <one line; the channel STYLE SUFFIX is appended automatically if missing>
  ## S9                       (CHAR)
  CHARACTER: Charles Vane
  BORN: c. 1680 - England
  DIED: 29 March 1721 - Port Royal, Jamaica (hanged; about 41)
  ROLE: <3–6 sentences grounded in the script>
  REFERENCE: https://commons.wikimedia.org/wiki/File:Exact_Name.jpg
  SUMMARY: <image summary> [VERIFIED - …]
  PROMPT: <the portrait base, starting "Medium-shot portrait, solid black background, subject centered
           and looking toward the viewer: …">   (". " + suffix is appended automatically)
  ## CHARACTERS               (closing block, free lines: "• Name (CHAR n, Section N)" + indented lines)
  ## ALSO NAMED               ("• Name — one-line identification (Section(s) ..)." lines)
  ## PLACES                   ("• Place — role (Sections ..)." lines)
  ## KEY TERMS                ("• Term — definition (Section(s) ..)." lines)
"""
import os, re, sys, json, glob, argparse

ap = argparse.ArgumentParser(); ap.add_argument("folder"); ap.add_argument("--allow-partial", action="store_true"); a = ap.parse_args()
F = a.folder
meta = json.load(open(glob.glob(os.path.join(F, "*_meta.json"))[0], encoding="utf-8"))
SUBJ = meta["subject"]; SUFFIX = meta.get("suffix", "").strip(); CHANNEL = meta.get("channel", "")
if not SUFFIX: sys.exit("meta has no STYLE SUFFIX — bootstrap could not resolve the channel; fix Channel_Prompt_Suffixes.txt first")
rules = meta.get("rules") or {}
T = float(rules.get("AI_TARGET_S", 20)); TOL = float(rules.get("AI_TOL_S", 2)); MX = float(rules.get("AI_MAX_S", 25)); SMX = float(rules.get("MAX_SECTION_S", 30))

# ---- sentences ----
sent = []
for ln in open(os.path.join(F, f"{SUBJ}_sentences.tsv"), encoding="utf-8").read().split("\n")[1:]:
    if not ln.strip(): continue
    idx, st, en, pa, w, text = ln.split("\t", 5)
    sent.append({"idx": int(idx), "start": float(st), "end": float(en), "pause": float(pa), "words": int(w), "text": text})
# ---- plan ----
plan = open(os.path.join(F, f"{SUBJ}_plan.txt"), encoding="utf-8").read().split("\n")
themes, treat, secs = [], [], []
for ln in plan:
    if ln.startswith("#") or not ln.strip(): continue
    if ln.startswith("THEME:"):
        v = ln[6:].strip()
        if v and not v.startswith("[FILL"): themes.append(v)
        continue
    if ln.startswith("CONTENT TREATMENT:"):
        v = ln[len("CONTENT TREATMENT:"):].strip()
        if v and not v.startswith("[optional") and not v.startswith("[FILL"): treat.append(v)
        continue
    m = re.match(r"^S(\d+)\s*\|\s*(\d+)\s*-\s*(\d+)\s*\|\s*(HOOK|AI|MAP|REF|CHAR)\b", ln.strip(), re.I)
    if not m: sys.exit(f"plan line not understood: {ln[:80]}")
    secs.append({"num": int(m.group(1)), "a": int(m.group(2)), "b": int(m.group(3)), "type": m.group(4).upper()})
E = []
if not secs: E.append("plan has no sections")
if secs and secs[0]["type"] != "HOOK": E.append("S01 must be HOOK")
if any(s["type"] == "HOOK" for s in secs[1:]): E.append("only S01 may be HOOK")
exp = 1
for s in secs:
    if s["a"] != exp: E.append(f"S{s['num']:02d}: sentence range must start at {exp} (ranges tile the narration)")
    if s["b"] < s["a"]: E.append(f"S{s['num']:02d}: bad range")
    exp = s["b"] + 1
if secs and exp != len(sent) + 1: E.append(f"ranges end at sentence {exp - 1} but the narration has {len(sent)}")
for i in range(1, len(secs)):
    if secs[i]["type"] == secs[i - 1]["type"] and secs[i]["type"] in ("MAP", "REF"): E.append(f"S{secs[i]['num']:02d}: two consecutive {secs[i]['type']} sections")
for i, s in enumerate(secs, 1):
    if s["num"] != i: E.append(f"section numbering: line {i} is S{s['num']:02d}")
if E: sys.exit("PLAN ERRORS:\n  " + "\n  ".join(E))
def t_start(i): return sent[i]["start"] - (sent[i - 1]["pause"] / 2 if i > 0 else 0)      # midpoint-of-pause lengths, as stamped
def t_end(k): return sent[k]["end"] + (sent[k]["pause"] / 2 if k + 1 < len(sent) else 0)
for s in secs:
    s["sent"] = sent[s["a"] - 1:s["b"]]; s["start"] = t_start(s["a"] - 1); s["end"] = t_end(s["b"] - 1)
    s["words"] = sum(x["words"] for x in s["sent"]); s["text"] = " ".join(x["text"] for x in s["sent"])
    s["len"] = s["end"] - s["start"]
cnt = {"MAP": 0, "REF": 0, "CHAR": 0, "AI": 0}
for s in secs:
    if s["type"] in cnt: cnt[s["type"]] += 1; s["ord"] = cnt[s["type"]]
    s["label"] = "HOOK" if s["type"] == "HOOK" else f"{s['type']} {s['ord']}"
warn = []
for s in secs:
    lim = MX if s["type"] == "AI" else SMX
    if s["len"] > lim + 0.05: warn.append(f"S{s['num']:02d} {s['label']} is {s['len']:.1f} s (ceiling {lim:g})")
    if s["type"] == "AI" and abs(s["len"] - T) > TOL + 0.05: warn.append(f"S{s['num']:02d} AI is {s['len']:.1f} s (target {T:g}±{TOL:g})")

# ---- fills ----
fills = {}; closing = {"CHARACTERS": [], "ALSO NAMED": [], "PLACES": [], "KEY TERMS": []}
fp = os.path.join(F, f"{SUBJ}_fills.txt")
if os.path.exists(fp):
    cur = None; curkey = None
    for ln in open(fp, encoding="utf-8").read().split("\n"):
        m = re.match(r"^##\s*(S\s*(\d+)|CHARACTERS|ALSO NAMED|PLACES|KEY TERMS)\s*$", ln.strip(), re.I)
        if m:
            if m.group(2): cur = ("S", int(m.group(2))); fills.setdefault(cur[1], {})
            else: cur = ("C", m.group(1).upper())
            curkey = None; continue
        if cur is None or not ln.strip() and cur[0] == "S": continue
        if cur[0] == "C": closing[cur[1]].append(ln.rstrip()); continue
        km = re.match(r"^(MAP SUBJECT|LINK|SUMMARY|PROMPT|CHARACTER|BORN|DIED|ROLE|REFERENCE)\s*:\s*(.*)$", ln)
        if km: curkey = km.group(1).upper(); fills[cur[1]][curkey] = km.group(2).strip()
        elif curkey: fills[cur[1]][curkey] += " " + ln.strip()      # a value continued on the next line
    for k in closing: 
        while closing[k] and not closing[k][-1].strip(): closing[k].pop()
        while closing[k] and not closing[k][0].strip(): closing[k].pop(0)

def one(s): return " ".join(str(s).split())
def with_suffix(p):
    p = one(p)
    if p.lower().endswith(SUFFIX.lower()): return p
    p = p.rstrip(" .") if not re.search(r"[!?]$", p) else p
    return p + ". " + SUFFIX
def tagged(summary):
    s = one(summary)
    return s if re.search(r"\[(VERIFIED|FOUND|UNCONFIRMED|NOT FOUND)[^\]]*\]\s*$", s, re.I) else s + " [UNCONFIRMED - tag pending link_verify]"
missing = []
def need(num, key):
    v = (fills.get(num) or {}).get(key, "").strip()
    if not v: missing.append(f"S{num:02d} {key}"); return "[FILL]"
    return v

def mmss_dur(t): return f"{int(t // 60)} minutes {int(round(t % 60))} seconds ({t:.1f} seconds)"
total_words = sum(s["words"] for s in secs); dur = meta.get("duration_s") or secs[-1]["end"]
wps = total_words / dur if dur else 0; wpm = wps * 60
title = (meta.get("title") or SUBJ).upper()
L = []; A = L.append
A("=" * 40); A(f"HISTORY MAPS CHANNELS — {title}"); A("VIDEO BREAKDOWN — PAUSE-ALIGNED TIMING"); A("=" * 40)
A(f"TOTAL SPOKEN WORDS: {total_words:,} (" + ("bracketed stage cues stripped; spoken words only" if meta.get("bracket_cues") else "clean continuous narration; the script contains NO bracket/stage cues") + ")")
A(f"TOTAL DURATION: {mmss_dur(dur)}"); A(f"CALCULATED WPM: {wpm:.2f}"); A(f"WORDS PER SECOND: {wps:.4f}")
A("SECTION COMPOSITION: derived from the whisper word timings — sections close on the largest pause inside the 18–22 s band (ceiling 25 s), sentence ends only")
A("SECTION TIMECODES: EXACT — each section aligned to the word-level ASR (time_breakdown.py; per-word timestamps; boundaries on sentence ends)")
out = [f"S{s['num']} {s['label']} {s['len']:.1f}s" for s in secs if s["len"] > (MX if s["type"] == "AI" else SMX) + 0.05 or (s["type"] == "AI" and abs(s["len"] - T) > 5)]
A(f"TARGET SECTION LENGTH: AI sections {T:g} s ({T - TOL:g}–{T + TOL:g} s, ceiling {MX:g} s); HOOK / MAP / REF / CHAR sections 18-{SMX:g} s" + (". NOTE outliers: " + "; ".join(out) if out else ""))
A(f"TOTAL SECTIONS: {len(secs)}"); A("HOOK: 1 section")
A(f"AI Generated Artwork: {cnt['AI']} sections ({100.0 * cnt['AI'] / len(secs):.1f}%)")
A(f"Reference Images: {cnt['REF']} sections"); A(f"Reference Maps: {cnt['MAP']} sections"); A(f"Character Introductions: {cnt['CHAR']} sections")
A(f"CHANNEL: {CHANNEL}"); A(f'STYLE SUFFIX: "{SUFFIX}"')
A('NOTE: Every section has ONE prompt (PROMPT 1). Non-AI sections (HOOK/MAP/REF/CHAR) label theirs "-ALTERNATIVE-".')
A("      CHAR prompts are medium-shot black-background portraits: PROMPT 1 |CHANNEL ART STYLE|.")
if treat:
    A("CONTENT TREATMENT: " + treat[0])
    for t in treat[1:]: A("   " + t)
if not themes: themes = ["[FILL — THEME lines in the plan]"]; missing.append("THEME (plan)")
A("THEME: " + themes[0])
for t in themes[1:]: A("   " + t)
A("REMINDER: Spot-check every link before editing — link rot and search limits are real; confidence tags are honest.")
A("=" * 40); A("")

for s in secs:
    n = s["num"]; A("-" * 40); A(f"SECTION {n} | {s['words']} words | {s['label']}"); A("-" * 40); A(""); A("TIMECODE: [PENDING]"); A("")
    A('STARTS AT: "' + " ".join(s["text"].split()[:8]) + '..."'); A("SCRIPT:"); A(s["text"])
    f = fills.get(n) or {}
    if s["type"] in ("HOOK", "MAP"):
        A("MAP SUBJECT: " + need(n, "MAP SUBJECT"))
    A("")
    if s["type"] == "HOOK":
        link = need(n, "LINK"); A(f"   REF/MAP LINK 1: {link}"); A("      " + tagged(need(n, "SUMMARY")))
        A(f"   REF/MAP LINK 2: {link}"); A("      Repeat of REF/MAP LINK 1. [VERIFIED - same file as slot 1]")
        A("-ALTERNATIVE-"); A("PROMPT 1: |CHANNEL ART STYLE|"); A(with_suffix(need(n, "PROMPT"))); A("")
    elif s["type"] in ("MAP", "REF"):
        link = need(n, "LINK"); A(f"   LINK: {link}"); A("      " + tagged(need(n, "SUMMARY")))
        A(f"   ALT LINK 1: {link}"); A("      Repeat of link slot 1. [VERIFIED - same file as slot 1]")
        A(f"   ALT LINK 2: {link}"); A("      Repeat of link slot 1. [VERIFIED - same file as slot 1]")
        A("-ALTERNATIVE-"); A("PROMPT 1: |CHANNEL ART STYLE|"); A(with_suffix(need(n, "PROMPT"))); A("")
    elif s["type"] == "CHAR":
        A("CHARACTER INTRODUCTION: " + need(n, "CHARACTER")); A("BORN: " + need(n, "BORN")); A("DIED: " + need(n, "DIED")); A("ROLE: " + one(need(n, "ROLE")))
        A("REFERENCE: " + need(n, "REFERENCE")); A("   " + tagged(need(n, "SUMMARY")))
        A("-ALTERNATIVE-"); A("PROMPT 1: |CHANNEL ART STYLE|")
        base = one(need(n, "PROMPT"))
        if base != "[FILL]" and not re.match(r"(?i)^medium-shot portrait", base): base = "Medium-shot portrait, solid black background, subject centered and looking toward the viewer: " + base
        A(with_suffix(base)); A("")
    else:
        A("PROMPT 1:"); A(with_suffix(need(n, "PROMPT"))); A("")

A("=" * 40); A("SUMMARY TABLE"); A("=" * 40)
for s in secs: A(f"SECTION {s['num']:>2} | {s['label']:<8} | \"" + " ".join(s["text"].split()[:8]) + '..."')
A(""); A("=" * 40); A("VISUAL TYPE COUNT"); A("=" * 40)
def lst(t): return ", ".join(str(s["num"]) for s in secs if s["type"] == t) or "none"
A("HOOK: 1 — Section 1"); A(f"AI IMAGES: {cnt['AI']} ({100.0 * cnt['AI'] / len(secs):.1f}%) — Sections {lst('AI')}")
A(f"CHARACTER INTROS: {cnt['CHAR']} — Sections {lst('CHAR')}"); A(f"MAPS: {cnt['MAP']} — Sections {lst('MAP')}"); A(f"REFERENCE IMAGES: {cnt['REF']} — Sections {lst('REF')}")
A("No consecutive MAPS. No consecutive REFERENCE IMAGES."); A("")
A("=" * 40); A("CHARACTERS / PEOPLE"); A("=" * 40)
if closing["CHARACTERS"]: L += closing["CHARACTERS"]
else:
    for s in secs:
        if s["type"] == "CHAR":
            f = fills.get(s["num"]) or {}; A(f"• {f.get('CHARACTER', '[FILL]')} ({s['label']}, Section {s['num']})"); A(f"   Born {f.get('BORN', '[FILL]')}; Died {f.get('DIED', '[FILL]')}."); A("   " + one(f.get("ROLE", "[FILL]")))
    if cnt["CHAR"] == 0: A("• (no CHAR sections)")
A(""); A("Also named in the script (not given separate CHAR cards):")
L += closing["ALSO NAMED"] or ["• [FILL]"]; missing += ([] if closing["ALSO NAMED"] else ["ALSO NAMED (closing)"])
A(""); A("=" * 40); A("PLACES"); A("=" * 40); L += closing["PLACES"] or ["• [FILL]"]; missing += ([] if closing["PLACES"] else ["PLACES (closing)"])
A(""); A("=" * 40); A("KEY TERMS"); A("=" * 40); L += closing["KEY TERMS"] or ["• [FILL]"]; missing += ([] if closing["KEY TERMS"] else ["KEY TERMS (closing)"])
A("")
dest = os.path.join(F, f"{SUBJ}_breakdown.txt"); open(dest, "w", encoding="utf-8").write("\n".join(L))
print(f"BREAKDOWN: {dest}  ({len(secs)} sections: HOOK 1 · AI {cnt['AI']} · MAP {cnt['MAP']} · REF {cnt['REF']} · CHAR {cnt['CHAR']} · {total_words} words · {dur:.1f} s)")
for w in warn: print("  [warn] " + w)
if missing:
    print(f"  [FILL] slots still empty ({len(missing)}): " + ", ".join(missing[:40]) + (" …" if len(missing) > 40 else ""))
    if not a.allow_partial: print("  → write them into " + os.path.basename(fp) + " and re-run (or --allow-partial)"); sys.exit(1)
print("  next: python3 link_verify.py " + F + "   then   python3 run_all.py " + F)
