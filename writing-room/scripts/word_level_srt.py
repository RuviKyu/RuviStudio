#!/usr/bin/env python3
"""
WORD-LEVEL SRT — one cue per single word, timed from the real timeline.

Re-emits the project's ASR transcript as a strictly word-level SRT: EVERY
whitespace-separated token becomes its own cue (never lines, phrases, or
paragraphs), timed by splitting each ASR cue's [start,end] window proportionally
across its words — the same per-word interpolation the timing engine uses. The
text is the ASR's own words, so each timed cue is exactly the word spoken in that
slice. Output: [Subject]_word_level.srt (CRLF, sequential, non-overlapping).

If no ASR .srt is present, falls back to the FULL timestamp-guidelines SRT
([Subject]_full_timestamp_guidelines.srt) and splits each section cue evenly
across its words (APPROXIMATE — flagged on stdout).

Optional argv[1] = a single working folder used for BOTH inputs and outputs,
which keeps separate projects isolated when several run in one chat.
"""
import os, re, sys, glob

UP =(sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/uploads")
OUT=(sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/outputs")

import json
def _extract_words(data):
    out=[]
    def add(w):
        if not isinstance(w,dict): return
        tok=w.get("word", w.get("text")); st=w.get("start"); en=w.get("end")
        if tok is None or st is None or en is None: return
        try: st=float(st); en=float(en)
        except Exception: return
        out.append((int(round(st*1000)), int(round(en*1000)), str(tok)))
    if isinstance(data,dict) and isinstance(data.get("segments"),list):
        for seg in data["segments"]:
            for w in (seg.get("words") or []): add(w)
        if out: return out
    if isinstance(data,dict) and isinstance(data.get("words"),list):
        for w in data["words"]: add(w)
        if out: return out
    if isinstance(data,list):
        for w in data: add(w)
    return out
def load_word_json():
    seen=set()
    for d in (UP, OUT):
        for p in sorted(glob.glob(f"{d}/*.json")):
            if p in seen: continue
            seen.add(p)
            try: data=json.load(open(p,encoding="utf-8"))
            except Exception: continue
            ws=_extract_words(data)
            if len(ws)>=3: return p, ws
    return None, []

def ts_to_ms(s):
    h, m, rest = s.split(':'); sec, ms = rest.split(',')
    return ((int(h) * 60 + int(m)) * 60 + int(sec)) * 1000 + int(ms)

def srtts(ms):
    ms = max(0, int(round(ms))); s, mss = divmod(ms, 1000); m, s = divmod(s, 60); h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d},{mss:03d}"

# --- locate the FULL breakdown (only to derive the [Subject] name) ---
def is_breakdown(p):
    try: t = open(p, encoding="utf-8", errors="ignore").read()
    except Exception: return 0
    return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', t))
def header_is_special(p):
    head = "\n".join(open(p, encoding="utf-8", errors="ignore").read().splitlines()[:8]).upper()
    return "SPECIAL" in head
bds  = [p for p in glob.glob(f"{OUT}/*.txt") + glob.glob(f"{UP}/*.txt") if is_breakdown(p)
        and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
full = [p for p in bds if not header_is_special(p)]
BREAKDOWN = max(full, key=os.path.getsize) if full else (max(bds, key=os.path.getsize) if bds else None)

# --- the ASR transcript: ignore our own generated SRTs ---
srts = [s for s in glob.glob(f"{UP}/*.srt") + glob.glob(f"{OUT}/*.srt")
        if "_timestamp_guidelines" not in os.path.basename(s)
        and "_word_level" not in os.path.basename(s)
        and "_sections_no_AI" not in os.path.basename(s)
        and not s.endswith("_full_arranged.srt")]
SRT = max(srts, key=os.path.getsize) if srts else None

if BREAKDOWN:
    base = re.sub(r'(_special)?(_breakdown)?\.txt$', '', os.path.basename(BREAKDOWN))
elif SRT:
    base = re.sub(r'\.srt$', '', os.path.basename(SRT))
else:
    sys.exit("Need an ASR .srt (or a breakdown to name the file) to build the word-level SRT.")
dest = f"{OUT}/{base}_word_level.srt"

def parse_srt(path):
    raw = open(path, encoding="utf-8-sig", errors="ignore").read().replace('\r\n', '\n').replace('\r', '\n')
    cues = []
    for blk in re.split(r'\n\s*\n', raw.strip()):
        L = blk.split('\n')
        if len(L) < 2: continue
        m = re.match(r'(\d\d:\d\d:\d\d,\d{1,3})\s*-->\s*(\d\d:\d\d:\d\d,\d{1,3})', L[1])
        if not m: continue
        cues.append((ts_to_ms(m.group(1)), ts_to_ms(m.group(2)), ' '.join(L[2:]).strip()))
    return cues

# --- choose the timing source, best first ---
words = []   # [start_ms, end_ms, token]
WJSON, wjwords = load_word_json()
if wjwords:
    # BEST: real per-word timestamps (e.g. Whisper word_timestamps JSON)
    mode = f"EXACT (per-word timestamps from {os.path.basename(WJSON)})"
    SRC_NAME = os.path.basename(WJSON)
    for st, en, tok in wjwords:
        if tok.strip(): words.append([st, en, tok.strip()])
else:
    # else split each cue of the ASR srt (or, failing that, the section SRT)
    if SRT:
        src = SRT; mode = "EXACT (one cue per ASR word, interpolated within each chunk)"
    else:
        cands = glob.glob(f"{OUT}/*_full_timestamp_guidelines.srt") + glob.glob(f"{UP}/*_full_timestamp_guidelines.srt")
        if not cands:
            sys.exit("No word JSON, no ASR .srt, and no *_full_timestamp_guidelines.srt — run time_breakdown.py first.")
        src = max(cands, key=os.path.getmtime)
        mode = "APPROXIMATE (no ASR .srt; even split of each section cue across its words)"
    SRC_NAME = os.path.basename(src)
    for t0, t1, text in parse_srt(src):
        toks = [w for w in text.split() if w.strip()]
        c = len(toks)
        if c == 0: continue
        span = max(0, t1 - t0)
        for k, w in enumerate(toks):
            words.append([t0 + round(span * k / c), t0 + round(span * (k + 1) / c), w])

if not words:
    sys.exit("No words found in the source to write.")

# --- keep cues ordered, non-overlapping, and at least 1 ms long ---
words.sort(key=lambda x: (x[0], x[1]))
prev_end = -1
for w in words:
    if w[0] < prev_end: w[0] = prev_end
    if w[1] <= w[0]:    w[1] = w[0] + 1
    prev_end = w[1]

o = []
for i, (ws, we, tok) in enumerate(words, 1):
    o += [str(i), f"{srtts(ws)} --> {srtts(we)}", tok, ""]
open(dest, "w", encoding="utf-8").write("\r\n".join(o).rstrip("\r\n") + "\r\n")

print(f"Word-level timing mode: {mode}")
print(f"Source: {SRC_NAME}")
print(f"Words (one cue each): {len(words)} | coverage: {srtts(words[0][0])} -> {srtts(words[-1][1])}")
print(f"WORD-LEVEL SRT: {dest}")
