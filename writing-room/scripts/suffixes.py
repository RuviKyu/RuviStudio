#!/usr/bin/env python3
"""
suffixes.py — the ONE parser for Channel_Prompt_Suffixes.txt (import it; or run it to print a channel).

A channel block starts at "CHANNELS: [NAME] [NAME2]" and ends at a dashed line or the next CHANNELS line.
Inside, in any order: DESCRIPTION: (template lines until PINNED COMMENT: / SUFFIX: / a key line),
PINNED COMMENT: …, SUFFIX: … (one line), rule keys (AI_TARGET_S …), AMBIENCE_LUFS: n (comment),
AMBIENCE (…): palette lines (indented) until the block ends.
    parse_suffix_file(path) -> {"CHANNEL NAME": {"suffix", "rules", "description", "pinned_comment",
                                                 "ambience_lufs", "ambience", "tags"}}
    python3 suffixes.py <file> ["[CHANNEL]"]
"""
import re, sys

KEYS = ("MAX_SECTION_S", "TAIL_AFTER_MIN", "TAIL_MAX_S", "TAIL_TYPE", "AI_TARGET_S", "AI_TOL_S", "AI_MAX_S", "AI_PROMPTS", "ALT_PROMPTS",
        "PROMPT_MIN_WORDS", "ALT_MIN_WORDS")
DEFAULT_RULES = {"MAX_SECTION_S": "30", "AI_TARGET_S": "20", "AI_TOL_S": "2", "AI_MAX_S": "25", "AI_PROMPTS": "1", "ALT_PROMPTS": "1",
                 "PROMPT_MIN_WORDS": "90", "ALT_MIN_WORDS": "60"}

def find_suffix_file(*dirs):
    import glob, os
    for d in dirs:
        if not d: continue
        for p in glob.glob(os.path.join(d, "*Channel_Prompt_Suffixes*.txt")) + glob.glob(os.path.join(d, "**", "Channel_Prompt_Suffixes.txt"), recursive=True):
            return p
    return None

def revision_of(path):
    m = re.search(r"PROMPT-SET REVISION\s+(\S+)", open(path, encoding="utf-8-sig", errors="ignore").read())
    return m.group(1) if m else None

def parse_suffix_file(path):
    raw = open(path, encoding="utf-8-sig", errors="ignore").read().replace("\r\n", "\n").replace("\r", "\n")
    lines = raw.split("\n"); out = {}; i = 0
    while i < len(lines):
        if not lines[i].startswith("CHANNELS:"): i += 1; continue
        tags = [t.strip() for t in re.findall(r"\[([^\]]+)\]", lines[i])]
        blk = {"tags": tags, "suffix": "", "rules": {}, "description": [], "pinned_comment": "", "ambience_lufs": None, "ambience": []}
        j = i + 1; mode = None
        while j < len(lines) and not lines[j].startswith("CHANNELS:") and not (lines[j].strip() and set(lines[j].strip()) <= {"-", "="} and len(lines[j].strip()) >= 10):
            ln = lines[j]
            if ln.startswith("DESCRIPTION:"): mode = "desc"; j += 1; continue
            if ln.startswith("PINNED COMMENT:"): blk["pinned_comment"] = ln[len("PINNED COMMENT:"):].strip(); mode = None; j += 1; continue
            if ln.startswith("SUFFIX:"): blk["suffix"] = ln[len("SUFFIX:"):].strip(); mode = None; j += 1; continue
            mk = re.match(r"\s*(" + "|".join(KEYS) + r")\s*:\s*(\S+)", ln)
            if mk: blk["rules"][mk.group(1)] = mk.group(2).strip(); mode = None; j += 1; continue
            ml = re.match(r"\s*AMBIENCE_LUFS\s*:\s*(-?\d+(?:\.\d+)?)", ln)
            if ml: blk["ambience_lufs"] = float(ml.group(1)); mode = None; j += 1; continue
            if re.match(r"\s*AMBIENCE\b", ln): mode = "amb"; blk["ambience"].append(ln.strip()); j += 1; continue
            if mode == "desc": blk["description"].append(ln.rstrip())
            elif mode == "amb" and ln.strip(): blk["ambience"].append(ln.rstrip())
            j += 1
        while blk["description"] and not blk["description"][-1].strip(): blk["description"].pop()
        for t in tags: out[t.upper()] = blk
        i = j
    return out

def rules_for(block):
    r = dict(DEFAULT_RULES); r.update(block.get("rules") or {}); return r

if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(__doc__)
    ch = parse_suffix_file(sys.argv[1])
    want = sys.argv[2].strip("[]").upper() if len(sys.argv) > 2 else None
    for k, b in ch.items():
        if want and k != want: continue
        print(f"[{k}] suffix={b['suffix'][:70]}…  rules={rules_for(b)}  ambience_lufs={b['ambience_lufs']}  description_lines={len(b['description'])}  pinned={'yes' if b['pinned_comment'] else 'no'}")
