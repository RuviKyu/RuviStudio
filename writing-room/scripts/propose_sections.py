#!/usr/bin/env python3
"""
PROPOSE SECTIONS — the pause-aligned walk (Video_Structure.md PHASE 2), done by the machine.

    python3 propose_sections.py <folder> [--target 20 --tol 2 --max 25 --min-tail 12]

Reads <Subject>_source.txt and the word timings (<Subject>_words.json, else <Subject>.srt), splits the
narration into sentences (abbreviation / initial / decimal guards), aligns every sentence to the spoken
words, measures the PAUSE after each sentence, and walks forward closing each section on the LARGEST
pause inside the 18–22 s band (never past the 25 s ceiling; a final tail < 12 s merges back).
Writes
  <Subject>_sentences.tsv   idx · start · end · pause_after · words · text   (the reference table)
  <Subject>_plan.txt        one line per section: S## | sentences a-b | TYPE | window | words | opening
and prints the plan. You then EDIT the plan — set TYPE per section (HOOK/AI/MAP/REF/CHAR), merge or move
a boundary by changing the sentence ranges (a HOOK/MAP/REF/CHAR may run to 30 s) — and fill the THEME
lines. build_breakdown.py turns the plan into the FULL breakdown.
"""
import os, re, sys, json, glob, difflib, argparse

ap = argparse.ArgumentParser()
ap.add_argument("folder"); ap.add_argument("--target", type=float, default=None); ap.add_argument("--tol", type=float, default=None)
ap.add_argument("--max", type=float, default=None); ap.add_argument("--min-tail", type=float, default=12.0)
a = ap.parse_args(); F = a.folder
meta = {}
for p in glob.glob(os.path.join(F, "*_meta.json")):
    try: meta = json.load(open(p, encoding="utf-8")); break
    except Exception: pass
SUBJ = meta.get("subject") or os.path.basename(os.path.normpath(F))
rules = meta.get("rules") or {}
T = a.target or float(rules.get("AI_TARGET_S", 20)); TOL = a.tol or float(rules.get("AI_TOL_S", 2)); MX = a.max or float(rules.get("AI_MAX_S", 25))

src = open(os.path.join(F, f"{SUBJ}_source.txt"), encoding="utf-8").read()
src = re.sub(r"\[[A-Z][A-Z \-]{2,}\]", " ", src)   # stage cues never count
# ---- sentences ----
ABBR = r"(?:Mr|Mrs|Ms|Dr|St|Col|Capt|Lt|Gen|Sgt|Prof|Sr|Jr|vs|etc|No|Mt|Ft)"
def sentences(text):
    t = re.sub(r"\b" + ABBR + r"\.", lambda m: m.group(0).replace(".", "<D>"), text)
    t = re.sub(r"\b([A-Z])\.(?=\s*[A-Z])", r"\1<D>", t)               # initials J. P.
    t = re.sub(r"(\d)\.(\d)", r"\1<D>\2", t)                           # decimals
    out = []
    for para in re.split(r"\n\s*\n", t.strip()):
        para = re.sub(r"\s+", " ", para).strip()
        for s in re.split(r"(?<=[.!?…])[\"”’)]*\s+(?=[\"“‘(]?[A-Z0-9])", para):
            s = s.replace("<D>", ".").strip()
            if s: out.append(s)
    return out
S = sentences(src)
if not S: sys.exit("no sentences in the source")

# ---- words with times ----
W = []
wj = os.path.join(F, f"{SUBJ}_words.json")
def tok(s): return re.findall(r"[a-z0-9']+", s.lower().replace("’", "'"))
if os.path.exists(wj):
    d = json.load(open(wj, encoding="utf-8")); segs = d.get("segments") if isinstance(d, dict) else None
    items = [w for s in segs for w in (s.get("words") or [])] if segs else (d.get("words") if isinstance(d, dict) else d)
    for w in items or []:
        t_ = w.get("word", w.get("text")); 
        if t_ is None or w.get("start") is None: continue
        for x in tok(str(t_)): W.append((float(w["start"]), float(w["end"]), x))
if not W:
    raw = open(os.path.join(F, f"{SUBJ}.srt"), encoding="utf-8-sig", errors="ignore").read()
    for blk in re.split(r"\n\s*\n", raw.strip()):
        L = blk.strip().split("\n")
        if len(L) < 3: continue
        m = re.match(r"(\d\d):(\d\d):(\d\d)[,.](\d{3})\s*-->\s*(\d\d):(\d\d):(\d\d)[,.](\d{3})", L[1])
        if not m: continue
        g = [int(x) for x in m.groups()]; t0 = g[0]*3600+g[1]*60+g[2]+g[3]/1000; t1 = g[4]*3600+g[5]*60+g[6]+g[7]/1000
        ws = tok(" ".join(L[2:])); n = len(ws) or 1
        for k, x in enumerate(ws): W.append((t0+(t1-t0)*k/n, t0+(t1-t0)*(k+1)/n, x))
if not W: sys.exit("no word timings (need <Subject>_words.json or <Subject>.srt)")
stream = [w[2] for w in W]

# ---- align source words → stream ----
src_words, owner = [], []
for i, s in enumerate(S):
    for x in tok(s): src_words.append(x); owner.append(i)
sm = difflib.SequenceMatcher(None, src_words, stream, autojunk=False)
mapidx = [None] * len(src_words)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal":
        for k in range(i2 - i1): mapidx[i1 + k] = j1 + k
    elif tag == "replace":   # spread unmatched source words over the replaced stream span
        n = i2 - i1; m = j2 - j1
        for k in range(n): mapidx[i1 + k] = j1 + min(m - 1, int(k * m / max(1, n))) if m else None
# forward/backward fill
last = None
for k in range(len(mapidx)):
    if mapidx[k] is None: mapidx[k] = last
    else: last = mapidx[k]
nxt = None
for k in range(len(mapidx) - 1, -1, -1):
    if mapidx[k] is None: mapidx[k] = nxt
    else: nxt = mapidx[k]
first_idx = {}; last_idx = {}
for k, o in enumerate(owner):
    if mapidx[k] is None: continue
    first_idx.setdefault(o, mapidx[k]); last_idx[o] = mapidx[k]
sent = []
for i, s in enumerate(S):
    fi = first_idx.get(i, 0); li = last_idx.get(i, fi)
    st, en = W[fi][0], W[li][1]
    sent.append({"idx": i + 1, "start": st, "end": en, "words": len(tok(s)), "text": s})
for i in range(len(sent)):
    nxt_start = sent[i + 1]["start"] if i + 1 < len(sent) else sent[i]["end"]
    sent[i]["pause"] = max(0.0, nxt_start - sent[i]["end"])
    if i + 1 < len(sent) and sent[i + 1]["start"] < sent[i]["end"]: sent[i + 1]["start"] = sent[i]["end"]   # keep monotonic
matched = sum(1 for m in mapidx if m is not None) / max(1, len(mapidx))

# ---- the walk ----
# lengths are measured the way time_breakdown stamps them: from the MIDPOINT of the pause before the first
# sentence to the MIDPOINT of the pause after the last one (the cut lands in the middle of the silence)
def t_start(i): return sent[i]["start"] - (sent[i - 1]["pause"] / 2 if i > 0 else 0)
def t_end(k): return sent[k]["end"] + (sent[k]["pause"] / 2 if k + 1 < len(sent) else 0)
secs = []; n = len(sent); INF = 1e18
def cost(i, k):
    L = t_end(k) - t_start(i); last = (k == n - 1)
    if L > MX + 1e-6: return 60.0 if i == k else INF           # a lone sentence longer than the ceiling: allowed, flagged
    dev = max(0.0, abs(L - T) - TOL); c = dev * dev
    if abs(L - T) > 5 and not (i == k and L > MX): c += 100.0                      # review_audit FAILs an AI section > 5 s off the target: avoid it whenever any tiling can
    elif L < T - 5: c += 25.0
    if last and L < a.min_tail: c += 25.0
    if not last: c -= 0.8 * min(3.0, sent[k]["pause"])          # cutting on a big pause is worth something
    return c
best = [INF] * (n + 1); prev = [-1] * (n + 1); best[0] = 0.0
for k in range(n):
    for i in range(k, -1, -1):
        if t_end(k) - t_start(i) > MX + 1e-6 and i < k: break
        c = cost(i, k)
        if c >= INF or best[i] >= INF: continue
        if best[i] + c < best[k + 1]: best[k + 1] = best[i] + c; prev[k + 1] = i
k = n
while k > 0: i = prev[k]; secs.append((i, k - 1)); k = i
secs.reverse()
def mmss(t): return f"{int(t // 60)}:{t % 60:05.2f}"
rows = []
for k, (s0, s1) in enumerate(secs, 1):
    st, en = t_start(s0), t_end(s1); words = sum(x["words"] for x in sent[s0:s1 + 1])
    opening = " ".join(" ".join(x["text"] for x in sent[s0:s1 + 1]).split()[:8])
    rows.append(f"S{k:02d} | {s0 + 1}-{s1 + 1} | {'HOOK' if k == 1 else 'AI'} | {mmss(st)} → {mmss(en)} ({en - st:.1f} s) | {words} w | {opening}…")
hdr = ["# PLAN — " + SUBJ + " · one line per section · edit TYPE (HOOK AI MAP REF CHAR) and, if needed, the sentence range a-b; keep the order",
       "# rules: AI 18–22 s (never > 25) · HOOK/MAP/REF/CHAR 18–30 s · HOOK = S01 only · no two MAP in a row · no two REF in a row · a MAP/REF needs a real place/object in ITS OWN text",
       "# the window column is informative (recomputed by build_breakdown); only the ranges and TYPEs count",
       "THEME: [FILL — 2–4 THEME lines summarising the subject and arc]",
       "THEME: [FILL]",
       "CONTENT TREATMENT: [optional — delete this line if PHASE 5 restraint does not apply; else state what is never depicted and what is shown instead]"]
plan = "\n".join(hdr + rows) + "\n"
open(os.path.join(F, f"{SUBJ}_plan.txt"), "w", encoding="utf-8").write(plan)
with open(os.path.join(F, f"{SUBJ}_sentences.tsv"), "w", encoding="utf-8") as f:
    f.write("idx\tstart\tend\tpause_after\twords\ttext\n")
    for x in sent: f.write(f"{x['idx']}\t{x['start']:.3f}\t{x['end']:.3f}\t{x['pause']:.2f}\t{x['words']}\t{x['text']}\n")
over = [r for (s0, s1), r in zip(secs, rows) if t_end(s1) - t_start(s0) > MX + 0.05]
print(f"PROPOSAL: {len(sent)} sentences → {len(secs)} sections · target {T:g}±{TOL:g} s, ceiling {MX:g} s · word alignment {matched:.0%} · audio {mmss(sent[-1]['end'])}")
if over: print("  OUTLIERS (a single sentence longer than the ceiling — keep it alone, note it in the header): " + "; ".join(r.split('|')[0].strip() for r in over))
print(f"  plan: {os.path.join(F, SUBJ + '_plan.txt')}   sentences: {SUBJ}_sentences.tsv")
print(plan)
