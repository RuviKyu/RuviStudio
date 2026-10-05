#!/usr/bin/env python3
"""
REVIEW AUDIT — does the (reviewed) breakdown still obey the video-structure rules?

Mechanical half of the review pass. Checks: the type plan (HOOK = section 1 only;
MAP uncapped since 2026-09-10-r8 and REF uncapped since 2026-09-11-r10; no two
consecutive MAP or REF); section
length caps (30s, or up to 90s for the FALLEN CIVILIZATION post-30-min AI tail) and
basic pacing; the tail rule itself (r8: on a tail-rule channel every HOOK / MAP / REF /
CHAR section ends at or before the tail mark, so the tail — and the SPECIAL
breakdown's reach — never runs past ~30:00); exactly 3
prompts per section (r15: ONE per section — PROMPT 1 for AI, one -ALTERNATIVE- for the
rest — unless the channel raises AI_PROMPTS / ALT_PROMPTS); the STYLE SUFFIX still present on every prompt it belongs on
(so a prompt rewrite did NOT touch the suffix); the link policy for this reviewer —
every REF / CHAR / MAP image link must be a Wikimedia DOWNLOAD URL
(upload.wikimedia.org/...), the HOOK's image links likewise (r9: the HOOK is a map
animation — its VIDEO LINK is optional and unused, and it carries a MAP SUBJECT line
like every MAP), and Category / Special links are never allowed; the SPECIAL
breakdown being AI-free and matching the non-AI sections; (r9) when a
[Subject]_allanimations.json (or legacy _allmaps.json) sits in the folder, that it is
COHERENT with the breakdown — one map object per HOOK/MAP section and one still per
REF/CHAR section, matched by the type-ordinal source_file, with comp_start_ms /
comp_duration_ms equal to the stamped TIMECODE and the stills' required fields
present; and (if a *_source.txt is present) that nothing was lost.
Writes [Subject]_review_audit.md and exits 1 on any FAIL.

Optional argv[1] = the working folder.
"""
import re, glob, os, sys, json, hashlib
from urllib.parse import urlsplit, unquote

def _find_suffix_list(folder):
    here=os.path.dirname(os.path.abspath(__file__))
    for d in (folder,"/mnt/user-data/uploads",here,os.getcwd()):
        for q in glob.glob(f"{d}/*Channel_Prompt_Suffixes*.txt")+glob.glob(f"{d}/*hannel*uffix*.txt"):
            return q
    return None
def _parse_overrides(path):
    raw=open(path,encoding="utf-8-sig",errors="ignore").read().replace('\r\n','\n').replace('\r','\n')
    lines=raw.split('\n'); res={}; i=0
    while i<len(lines):
        if lines[i].startswith("CHANNELS:"):
            tags=re.findall(r'\[([^\]]+)\]', lines[i]); ov={}; j=i+1
            while j<len(lines) and not lines[j].startswith("CHANNELS:") and set(lines[j].strip())!={'-'}:
                mm=re.match(r'\s*(MAX_SECTION_S|TAIL_AFTER_MIN|TAIL_MAX_S|TAIL_TYPE|AI_TARGET_S|AI_TOL_S|AI_MAX_S|AI_PROMPTS|ALT_PROMPTS)\s*:\s*(.+?)\s*$', lines[j])
                if mm:
                    k=mm.group(1); ov[k]=(mm.group(2).strip().upper() if k=="TAIL_TYPE" else int(mm.group(2)))
                j+=1
            if ov:
                for x in tags: res[x.strip().upper()]=ov
            i=j
        else: i+=1
    return res
def channel_rules(channel, folder):
    caps={'MAX_SECTION_S':30,'TAIL_AFTER_MIN':None,'TAIL_MAX_S':None,'TAIL_TYPE':'AI','AI_TARGET_S':20,'AI_TOL_S':2,'AI_MAX_S':25,'AI_PROMPTS':1,'ALT_PROMPTS':1}   # (r16) every AI section ≈ 20 s (18–22, 25 ceiling) on EVERY channel by default; (r15) ONE prompt per section
    key=(channel or "").strip().strip("[]").upper()
    if key=="FALLEN CIVILIZATION": caps.update({'TAIL_AFTER_MIN':30,'TAIL_MAX_S':90,'TAIL_TYPE':'AI'})
    man=glob.glob(f"{folder}/*_manifest.json")
    if man:
        try:
            cr=(json.load(open(man[0],encoding="utf-8")).get('channel_rules') or {})
            for k in caps:
                if cr.get(k) is not None: caps[k]=cr[k]
        except Exception: pass
    sp=_find_suffix_list(folder)
    if sp:
        ov=_parse_overrides(sp).get(key)
        if ov:
            for k,v in ov.items(): caps[k]=v
    return caps

OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs"); UP=OUT
hdr=re.compile(r'^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$')
tcre=re.compile(r'TIMECODE:\s*(\d\d):(\d\d):(\d\d)[.,](\d{1,3})\s*(?:\u2192|-->|->|>)\s*'
                r'(\d\d):(\d\d):(\d\d)[.,](\d{1,3})')
prre=re.compile(r'^\s*PROMPT\s+([123])\b\s*:?(.*)$')
linkre=re.compile(r'^\s*(VIDEO LINK|REF/MAP LINK \d+|ALT LINK \d+|LINK|REFERENCE)\s*:\s*(\S+)')
def to_ms(h,m,s,f): return ((int(h)*60+int(m))*60+int(s))*1000+int(f.ljust(3,'0'))
base=lambda t: t.split()[0].upper()
norm=lambda s: re.findall(r"[a-z0-9]+", s.lower())

def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p,encoding="utf-8",errors="ignore").read()))
    except Exception: return 0
def is_special(p):
    try: return "SPECIAL" in open(p,encoding="utf-8",errors="ignore").read(1500).upper().replace("SPECIAL:FILEPATH","")
    except Exception: return False
def parse(path):
    L=open(path,encoding="utf-8").read().split('\n'); idx=[i for i,l in enumerate(L) if hdr.match(l)]; out=[]
    for n,a in enumerate(idx):
        b=idx[n+1] if n+1<len(idx) else len(L); blk=L[a:b]; h=hdr.match(L[a])
        s_i=next((q for q,l in enumerate(blk) if l.strip()=='SCRIPT:'), None)
        script=""
        if s_i is not None:
            buf=[]; q=s_i+1
            while q<len(blk) and blk[q].strip()!='' and not blk[q].startswith('MAP SUBJECT:'):
                buf.append(blk[q].strip()); q+=1
            script=' '.join(buf)
        tc=None
        for l in (blk[:s_i] if s_i is not None else blk):
            m=tcre.search(l)
            if m: tc=m
        prompts={}
        for q,l in enumerate(blk):
            pm=prre.match(l)
            if pm:
                txt=pm.group(2).strip()
                if txt.startswith("|") and txt.endswith("|"): txt=""  # |LABEL| marker; real prompt is on the next line
                r=q+1
                while r<len(blk) and not txt and blk[r].strip()=='' : r+=1
                if not txt and r<len(blk): txt=blk[r].strip()
                prompts[pm.group(1)]=txt
        links=[(m.group(1),m.group(2)) for l in blk for m in [linkre.match(l)] if m]
        intro=None
        for l in blk:
            mi=re.match(r'(?i)^\s*CHARACTER INTRODUCTION:\s*(.+?)\s*$', l)
            if mi: intro=mi.group(1).strip(); break
        msub=None
        for l in blk:
            mm=re.match(r'^MAP SUBJECT:\s*(.+?)\s*@\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\[source:\s*(script|narrative|user)\]\s*$', l)
            if mm:
                msub={'name':mm.group(1),'lat':float(mm.group(2)),'lon':float(mm.group(3)),'source':mm.group(4)}
                break
            if l.startswith('MAP SUBJECT:') and msub is None:
                msub={'raw':l}
        rec={'num':int(h.group(1)),'words':int(h.group(2)),'type':h.group(3).strip(),
             'script':script,'prompts':prompts,'links':links,'intro':intro,'map_subject':msub}
        if tc: g=tc.groups(); rec['t0']=to_ms(*g[:4]); rec['t1']=to_ms(*g[4:])
        out.append(rec)
    return L,out

cands=[p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and not is_special(p)
       and "special" not in os.path.basename(p).lower()
       and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
if not cands: sys.exit("No FULL breakdown found in the folder.")
FULL=max(cands,key=is_breakdown); FL,secs=parse(FULL)
subj=re.sub(r'(_breakdown)?.txt$','',os.path.basename(FULL))

res=[]
def add(level,msg): res.append((level,msg))
def is_dl(u): return "upload.wikimedia.org/" in u
def hash_ok(u):
    # the /x/xy/ path must equal md5(filename)[0]/[0:2]; catches mis-hashed/edited URLs
    try:
        seg=urlsplit(u).path.split('/'); i=seg.index('commons'); s=seg[i+1:]
        a,ab,name=((s[1],s[2],unquote(s[3])) if s and s[0]=='thumb' else (s[0],s[1],unquote(s[2])))
        if len(a)!=1 or len(ab)!=2: return False,"prefix is not 1/2 hex chars"
        md5=hashlib.md5(name.encode('utf-8')).hexdigest()
        return (a==md5[0] and ab==md5[:2]), f"path says {a}/{ab}; md5(filename) says {md5[0]}/{md5[:2]}"
    except Exception as e:
        return False, f"unparseable upload URL ({e})"
def is_cat(u): return "/wiki/Category:" in u
def is_spc(u): return "/wiki/Special:" in u

# ---- type plan ----
hooks=[s['num'] for s in secs if base(s['type'])=="HOOK"]
add("FAIL" if hooks!=[secs[0]['num']] else "PASS",
    "HOOK is section 1 only" if hooks==[secs[0]['num']] else f"HOOK placement wrong: sections {hooks}")
# (r8/r10) MAP and REF counts are UNCAPPED on every channel: the counts are whatever
# the narration's geography (MAP) and its real, anchorable objects (REF) honestly
# support. Only the no-consecutive rules (below) and, on tail-rule channels, the
# tail rule (further below) still shape them.
nmap=sum(1 for s in secs if base(s['type'])=="MAP")
nref=sum(1 for s in secs if base(s['type'])=="REF")
add("PASS", f"MAP count {nmap} (no cap since 2026-09-10-r8)")
add("PASS", f"REF count {nref} (no cap since 2026-09-11-r10)")
seq=[base(s['type']) for s in secs]
con=[f"S{secs[i+1]['num']}" for i in range(len(seq)-1) if seq[i]==seq[i+1] and seq[i] in ("MAP","REF")]
add("FAIL" if con else "PASS", "No consecutive MAP/REF" if not con else "Consecutive MAP/REF at "+", ".join(con))

# ---- length caps + pacing ----
mchan=re.search(r'(?im)^\s*CHANNEL:\s*(.+?)\s*$', "\n".join(FL))
CAPS=channel_rules(mchan.group(1).strip() if mchan else None, OUT)
_TAIL_MARK=(int(CAPS['TAIL_AFTER_MIN'])*60000) if CAPS['TAIL_AFTER_MIN'] is not None else None
def _is_tail(s):
    # (B5) the tail begins at the boundary NEAREST the mark, which may fall slightly
    # BEFORE it — a tail section is one of the tail TYPE whose window CROSSES or
    # follows the mark (t1 > mark), matching the builder's definition.
    return (_TAIL_MARK is not None and base(s['type'])==str(CAPS['TAIL_TYPE']).upper()
            and s.get('t1',0)>_TAIL_MARK)
def _ai_rule(s): return base(s['type'])=="AI" and CAPS.get('AI_TARGET_S') and not _is_tail(s)
def cap(s):
    if _is_tail(s): return int(CAPS['TAIL_MAX_S'] or CAPS['MAX_SECTION_S'])*1000
    if _ai_rule(s): return int(CAPS.get('AI_MAX_S') or max(int(CAPS['AI_TARGET_S'])+int(CAPS.get('AI_TOL_S') or 2), int(CAPS['MAX_SECTION_S'])))*1000   # (r13)
    return int(CAPS['MAX_SECTION_S'])*1000
overs=[f"S{s['num']}={(s['t1']-s['t0'])/1000:.1f}s" for s in secs if 't0' in s and (s['t1']-s['t0'])>cap(s)]
add("FAIL" if overs else "PASS", "Every section within its length cap" if not overs else "Over cap: "+", ".join(overs))

# ---- (r13) AI TARGET LENGTH: on a channel with AI_TARGET_S (e.g. [OLDWORLDPROOF] = 30 s) every
# AI section sits at the target: within ±AI_TOL_S = PASS, within ±5 s = WARN, beyond = FAIL.
# The one honest exception is a BOUNDED short section — the only AI section between two
# non-AI sections (or the last section of the video): the specials around it fix its
# length, so it is a WARN, never a FAIL.
if CAPS.get('AI_TARGET_S'):
    _tgt=int(CAPS['AI_TARGET_S'])*1000; _tol=int(CAPS.get('AI_TOL_S') or 2)*1000
    _w=[]; _f=[]
    for _i,s in enumerate(secs):
        if not _ai_rule(s) or 't0' not in s: continue
        d=s['t1']-s['t0']; off=d-_tgt
        prev_ai = _i>0 and base(secs[_i-1]['type'])=="AI"; next_ai = _i+1<len(secs) and base(secs[_i+1]['type'])=="AI"
        bounded = (not prev_ai) and (not next_ai)
        if abs(off)<=_tol: continue
        if abs(off)<=5000 or (bounded and off<0): _w.append(f"S{s['num']}={d/1000:.1f}s")
        else: _f.append(f"S{s['num']}={d/1000:.1f}s")
    _n=sum(1 for s in secs if _ai_rule(s))
    add("FAIL" if _f else "PASS", f"AI sections at the {CAPS['AI_TARGET_S']}s target (±{CAPS.get('AI_TOL_S') or 2}s) — {_n} AI section(s)" if not _f
        else f"AI sections off the {CAPS['AI_TARGET_S']}s target by more than 5s: "+", ".join(_f))
    if _w: add("WARN", f"AI sections a few seconds off the {CAPS['AI_TARGET_S']}s target (or bounded short): "+", ".join(_w))

# ---- (r8) tail rule: special sections stay before the tail ----
# On a tail-rule channel (e.g. [FALLEN CIVILIZATION]) the tail begins at the LAST
# section boundary at or before the mark (TAIL_AFTER_MIN) and is TAIL_TYPE only, so
# every HOOK / MAP / REF / CHAR section must (a) end at or before the mark (5 s of
# stamping tolerance) and (b) start before the first tail section. MAP is uncapped
# since r8, so this is what keeps the maps — and the whole SPECIAL breakdown — inside
# the first ~30 minutes.
if _TAIL_MARK is not None:
    _ttype=str(CAPS['TAIL_TYPE']).upper()
    _tails=[s for s in secs if _is_tail(s)]
    _tail_start=min(s['t0'] for s in _tails) if _tails else None
    def _hms(ms):
        ms=int(ms); s_,f=divmod(ms,1000); m,s_=divmod(s_,60); h,m=divmod(m,60)
        return f"{h:02d}:{m:02d}:{s_:02d}.{f:03d}"
    late=[]
    for s in secs:
        if 't0' not in s or base(s['type'])==_ttype: continue
        if s['t1']>_TAIL_MARK+5000:
            late.append(f"S{s['num']} {s['type']} ends {_hms(s['t1'])} (past the {CAPS['TAIL_AFTER_MIN']}-min mark)")
        elif _tail_start is not None and s['t0']>=_tail_start:
            late.append(f"S{s['num']} {s['type']} starts {_hms(s['t0'])} (inside the {_ttype} tail that begins {_hms(_tail_start)})")
    add("FAIL" if late else "PASS",
        (f"Tail rule: every non-{_ttype} section ends by the {CAPS['TAIL_AFTER_MIN']}-min mark; the tail is {_ttype}-only"
         if not late else f"Tail rule broken — {len(late)} non-{_ttype} section(s) in or past the tail"))
    for x in late: add("  -", x)
durs=[(s['t1']-s['t0'])/1000 for s in secs if 't0' in s]
if durs:
    shorts=[f"S{s['num']}" for s in secs[:-1] if 't0' in s and (s['t1']-s['t0'])<12000]
    # (F5) the AI bed dominates any raw same-type-run number; report the AI run and
    # the longest NON-AI same-type run separately so the figure means something for
    # the rhythm the rules actually care about.
    run=1; mx_ai=0; mx_o=0
    for i in range(1,len(seq)):
        run=run+1 if seq[i]==seq[i-1] else 1
        if seq[i]=="AI": mx_ai=max(mx_ai,run)
        else: mx_o=max(mx_o,run)
    add("WARN" if shorts else "PASS", f"Pacing: {len(durs)} sections, avg {sum(durs)/len(durs):.1f}s, longest AI run {max(mx_ai,1)}, longest non-AI same-type run {max(mx_o,1)}"+(f"; very short: {', '.join(shorts)}" if shorts else ""))

# ---- prompts + suffix unchanged ----
msuf=re.search(r'(?im)^\s*STYLE SUFFIX:\s*"(.+?)"\s*$', "\n".join(FL))
SUF=msuf.group(1).strip() if msuf else None
# (r15) ONE prompt per section is the rule on every channel: AI sections carry PROMPT 1; HOOK / MAP /
# REF / CHAR carry one -ALTERNATIVE- prompt. (AI_PROMPTS / ALT_PROMPTS in the suffix file can raise it.)
def _want_prompts(s): return int(CAPS.get('AI_PROMPTS') or 1) if base(s['type'])=="AI" else int(CAPS.get('ALT_PROMPTS') or 1)
badp=[f"S{s['num']}" for s in secs if len(s['prompts'])!=_want_prompts(s)]
_ap=int(CAPS.get('AI_PROMPTS') or 1); _al=int(CAPS.get('ALT_PROMPTS') or 1)
add("FAIL" if badp else "PASS", (f"{_ap} prompt per AI section, {_al} -ALTERNATIVE- prompt per HOOK/MAP/REF/CHAR section") if not badp else "Wrong prompt count: "+", ".join(badp))
if SUF:
    miss=[]
    for s in secs:
        p=s['prompts']
        if base(s['type'])=="CHAR":
            if "1" in p and SUF.lower() not in p["1"].lower(): miss.append(f"S{s['num']}P1")
            if "2" in p and "natural skin texture" not in p["2"].lower(): miss.append(f"S{s['num']}P2")
            if "3" in p and "greyscale" not in p["3"].lower(): miss.append(f"S{s['num']}P3")
        else:
            for k in ("1","2","3"):
                if k in p and SUF.lower() not in p[k].lower(): miss.append(f"S{s['num']}P{k}")
    add("FAIL" if miss else "PASS", "STYLE SUFFIX intact on every prompt" if not miss else "Suffix missing/altered: "+", ".join(miss))
else:
    add("WARN","No STYLE SUFFIX line in header — cannot verify suffix is unchanged")

# ---- symbolic / abstract prompt pre-filter (directs STAGE B; never a hard fail) ----
SYMBOLIC=[r'\bvortex\b',r'\bethereal\b',r'\btendrils?\b',r'\bswirl',r'echoes of',r'whispers of',
 r'shadows? of',r'the weight of',r'fabric of',r'tapestry of',r'dance of',r'symphony of',r'essence of',
 r'embodiment',r'manifestation',r'\bsurreal\b',r'dreamlike',r'otherworldly',r'\bmetaphor',r'metaphysical',
 r'\babstract',r'symboliz',r'represents the',r'\bghostly\b',r'\bspectral\b',r'\bphantom\b',r'\bcelestial\b',
 r'\bcosmic\b',r'\beternal\b',r'\bdestiny\b',r'soul of',r'glowing rune']
def base_of(txt):
    b=txt
    if SUF and SUF.lower() in b.lower(): b=b[:b.lower().rfind(SUF.lower())]
    return b.lower()
sym=[]
for s in secs:
    for k,txt in s['prompts'].items():
        b=base_of(txt); hits=sorted({re.search(pp,b).group(0) for pp in SYMBOLIC if re.search(pp,b)})
        if hits: sym.append(f"S{s['num']}P{k}: {', '.join(hits)}")
add("WARN" if sym else "PASS", "No obviously symbolic/abstract prompt language" if not sym else f"{len(sym)} prompt(s) look symbolic/abstract — reground in STAGE B")
for x in sym: add("  -", x)

# ---- CHAR sections must NAME the person (CHARACTER INTRODUCTION), matching the script ----
# The portrait prompts stay GENERIC by design (no real-person likeness); the name lives
# in the CHARACTER INTRODUCTION line, which must hold the actual person from the script.
NAME_STOP={w.lower() for w in """The A An And But Or Nor For Yet So In On At By To Of From Into Onto
Upon Over Under Through Between Among Within Without Against Before After While Since Until Because
Although Though If When Where Why How What Who Whom Whose Which That This These Those Then Than Now
Here There As He She It We They You His Her Its Their Our Your Him Them Us Me Today Tomorrow Yesterday
Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July
August September October November December Polish German French British English American Russian Italian
Spanish Portuguese Dutch Belgian Roman Greek Chinese Japanese Korean Indian Persian Arab Arabic Turkish
Ottoman Soviet Nazi Allied Egyptian Mongol Viking Norse Celtic Saxon Norman Byzantine Prussian Austrian
Hungarian Czech Swedish Norwegian Danish Finnish Swiss Scottish Irish Welsh European African Asian
Western Eastern Northern Southern Portrait Photograph Photo Headshot Closeup Close Wide Medium Shot
Image Scene View Figure Man Woman Soldier Officer General Captain Colonel Major Sergeant Lieutenant
Admiral King Queen Emperor Empress Prince Princess Duke Duchess Lord Lady Sir Saint Knight Warrior
Leader Commander Ruler Statesman President Minister Priest Bishop Pope Monk Nun Young Old Elderly
Bearded Famous Great Grand Royal Imperial Ancient Medieval Modern Historical War World Empire Kingdom
Republic Army Navy Battle Church State City Town Village River Sea Ocean Lake Mountain Island God
Heaven Earth North South East West New""".split()}
def _names(text):
    return {w.lower() for w in re.findall(r"\b[A-ZÀ-Þ][A-Za-zà-ÿ'’\-]{2,}\b", text) if w.lower() not in NAME_STOP}
char_fail=[]; char_warn=[]
for s in secs:
    if base(s['type'])!="CHAR": continue
    intro=(s.get('intro') or "").strip()
    if not intro or intro.startswith("["):
        char_fail.append(f"S{s['num']}: CHAR section has no CHARACTER INTRODUCTION name (it must name who it's about)")
        continue
    sn=_names(s.get('script','')); inames=_names(intro)
    if not inames:
        char_warn.append(f"S{s['num']}: CHARACTER INTRODUCTION \"{intro}\" doesn't look like a name \u2014 confirm the person is named")
    elif sn and not (inames & sn):
        char_warn.append(f"S{s['num']}: CHARACTER INTRODUCTION names {intro} but this section's script names {sorted(sn)} \u2014 confirm it's the person narrated here")
    elif not sn:
        char_warn.append(f"S{s['num']}: CHARACTER INTRODUCTION names {intro} but no matching name is in this section's script \u2014 confirm they're narrated here")
add("FAIL" if char_fail else ("WARN" if char_warn else "PASS"),
    "CHAR sections name the person (CHARACTER INTRODUCTION) from their script" if not char_fail else f"{len(char_fail)} CHAR section(s) don't name the person")
for x in char_fail: add("  -", x)
for x in char_warn: add("  -", x)

# ---- MAP SUBJECT gate (r3): every MAP section declares its subject place ----
# Closes the vacuous-set loophole: a MAP section whose script names no place used to
# pass the coverage idea trivially (empty list => any sheet "covers" it). The declared
# subject is the anchor Phase B must pin; kit `phasea audit` checks it against the
# sheet's cartouche + scale class.
ms_fail=[]
for s in secs:
    if base(s['type']) not in ("MAP","HOOK"): continue     # (r9) the HOOK is pinned like a MAP
    ms=s.get('map_subject')
    if not ms:
        ms_fail.append(f"S{s['num']}: no MAP SUBJECT line ('MAP SUBJECT: <name> @ <lat>,<lon> [source: script|narrative|user]')")
    elif 'raw' in ms:
        ms_fail.append(f"S{s['num']}: MAP SUBJECT line malformed: {ms['raw'][:90]}")
    elif not (-90.0<=ms['lat']<=90.0 and -180.0<=ms['lon']<=180.0):
        ms_fail.append(f"S{s['num']}: MAP SUBJECT lat/lon out of range ({ms['lat']},{ms['lon']})")
add("FAIL" if ms_fail else "PASS",
    "Every MAP (and the HOOK) declares its MAP SUBJECT (name + lat,lon + source)" if not ms_fail
    else f"{len(ms_fail)} MAP/HOOK section(s) missing/invalid MAP SUBJECT")
for x in ms_fail: add("  -", x)

# ---- link policy (downloads for REF/CHAR/MAP; HOOK keeps a video link) ----
link_fail=[]
for s in secs:
    bt=base(s['type']); labels=[lab for lab,_ in s['links']]
    for lab,u in s['links']:
        if is_cat(u): link_fail.append(f"S{s['num']} {lab}: Category link")
        elif is_spc(u): link_fail.append(f"S{s['num']} {lab}: Special: link")
    if bt in ("MAP","REF"):
        imgs=[u for lab,u in s['links'] if lab in ("LINK","ALT LINK 1","ALT LINK 2")]
        if not imgs: link_fail.append(f"S{s['num']} {bt}: no image link")
        for u in imgs:
            if not is_dl(u): link_fail.append(f"S{s['num']} {bt} link not a Wikimedia download URL: {u}")
    elif bt=="CHAR":
        refs=[u for lab,u in s['links'] if lab=="REFERENCE"]
        if not refs: link_fail.append(f"S{s['num']} CHAR: no REFERENCE link")
        for u in refs:
            if not is_dl(u): link_fail.append(f"S{s['num']} CHAR REFERENCE not a Wikimedia download URL: {u}")
    elif bt=="HOOK":                                        # (r9) VIDEO LINK optional — the HOOK is a map animation
        if not any(lab.startswith("REF/MAP LINK") for lab in labels): link_fail.append(f"S{s['num']} HOOK: no REF/MAP LINK (the antique sheet)")
        for lab,u in s['links']:
            if lab.startswith("REF/MAP LINK") and not is_dl(u):
                link_fail.append(f"S{s['num']} HOOK {lab} not a Wikimedia download URL: {u}")
for s in secs:
    for lab,u in s['links']:
        if "upload.wikimedia.org/wikipedia/commons/" in u:
            ok,why=hash_ok(u)
            if not ok: link_fail.append(f"S{s['num']} {lab}: upload URL path/hash mismatch (likely hand-built) — {why}")
add("FAIL" if link_fail else "PASS", "Links obey the download/video policy + path-hash integrity" if not link_fail else f"{len(link_fail)} link issue(s)")
for f in link_fail: add("  -", f)

# ---- SPECIAL breakdown AI-free + matches non-AI ----
sp=[p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and is_special(p)]
if sp:
    _,sp_secs=parse(max(sp,key=os.path.getmtime))
    if any(base(s['type'])=="AI" for s in sp_secs): add("FAIL","SPECIAL breakdown contains AI sections")
    else:
        want=[s['num'] for s in secs if base(s['type'])!="AI"]; got=[s['num'] for s in sp_secs]
        add("PASS" if got==want else "FAIL", "SPECIAL matches the non-AI sections" if got==want else f"SPECIAL mismatch: {got} vs {want}")
else:
    add("WARN","No SPECIAL breakdown found to cross-check")

# ---- (r9) animation bundle coherence: [Subject]_allanimations.json <-> breakdown ----
# The bundle is delivered on its own (make_zip leaves it out), but it sits in the
# working folder root during the run, so the audit can prove it matches the breakdown:
# every HOOK/MAP section has exactly one map object (source_file = its type-ordinal
# name, timing = its TIMECODE) and every REF/CHAR section exactly one still with its
# required fields. A bundle that is missing is a WARN (older sets); a wrong one FAILs.
def _tord(secs_):
    # type-ordinal file names in running order: HOOK 1 / MAP 1..n / REF 1..n / CHAR 1..n
    cnt={"MAP":0,"REF":0,"CHAR":0}; out={}
    for s_ in secs_:
        b=base(s_['type'])
        if b=="HOOK": out[s_['num']]=("HOOK","HOOK 1")
        elif b in cnt: cnt[b]+=1; out[s_['num']]=(b,f"{b} {cnt[b]}")
    return out
def _bname(fn): return re.sub(r'\.[a-z0-9]+$','',(""+fn).lower()).replace("_"," ").strip()
bund=(glob.glob(f"{OUT}/*_allanimations.json")+glob.glob(f"{OUT}/*_allmaps.json"))
if not bund:
    add("WARN","No [Subject]_allanimations.json in the folder — bundle <-> breakdown coherence not checked")
else:
    bp=max(bund,key=os.path.getmtime); bfail=[]
    try:
        B=json.load(open(bp,encoding="utf-8"))
        maps=[m for m in (B.get("maps") or []) if isinstance(m,dict)]
        stills=[t for t in (B.get("stills") or []) if isinstance(t,dict)]
        want=_tord(secs)
        by_name={}
        for m in maps: by_name.setdefault(("map",_bname(m.get("source_file",""))),[]).append(m)
        for t in stills: by_name.setdefault(("still",_bname(t.get("source_file",""))),[]).append(t)
        TOL=60   # ms: stamping / rounding tolerance
        for s_ in secs:
            if s_['num'] not in want: continue
            b,fn=want[s_['num']]; key=("map" if b in ("HOOK","MAP") else "still", fn.lower())
            objs=by_name.pop(key,[])
            if len(objs)!=1:
                bfail.append(f"S{s_['num']} {s_['type']}: {len(objs)} bundle object(s) for '{fn}' (need exactly 1)"); continue
            o=objs[0]
            if 't0' in s_:
                cs_=o.get("comp_start_ms"); cd_=o.get("comp_duration_ms")
                if not isinstance(cs_,(int,float)) or abs(cs_-s_['t0'])>TOL: bfail.append(f"S{s_['num']} {fn}: comp_start_ms {cs_} vs TIMECODE {s_['t0']}")
                if not isinstance(cd_,(int,float)) or abs(cd_-(s_['t1']-s_['t0']))>TOL: bfail.append(f"S{s_['num']} {fn}: comp_duration_ms {cd_} vs TIMECODE {s_['t1']-s_['t0']}")
            if key[0]=="map":
                if not (o.get("locations") and len(o["locations"])): bfail.append(f"S{s_['num']} {fn}: map object has no locations")
                if o.get("time_base")!="comp_local": bfail.append(f"S{s_['num']} {fn}: time_base must be comp_local")
            else:
                st=(""+o.get("still_type","")).upper()
                if st!=b: bfail.append(f"S{s_['num']} {fn}: still_type {st!r} vs section type {b}")
                if o.get("time_base")!="comp_local": bfail.append(f"S{s_['num']} {fn}: time_base must be comp_local")
                if b=="REF":
                    f_=o.get("focus") or {}
                    if not (isinstance(f_.get("xNorm"),(int,float)) and 0<=f_["xNorm"]<=1 and isinstance(f_.get("yNorm"),(int,float)) and 0<=f_["yNorm"]<=1): bfail.append(f"S{s_['num']} {fn}: REF focus missing/out of range")
                    if (""+o.get("move","auto")).lower() not in ("auto","pullout","flyin_push"): bfail.append(f"S{s_['num']} {fn}: move")
                else:
                    if not o.get("name"): bfail.append(f"S{s_['num']} {fn}: CHAR still needs a display name")
                    if o.get("side") not in ("left","right"): bfail.append(f"S{s_['num']} {fn}: CHAR side must be left|right")
                    if o.get("background") not in ("dark","light","busy"): bfail.append(f"S{s_['num']} {fn}: CHAR background must be dark|light|busy (viewed)")
                    if (""+o.get("treatment","auto")).lower() not in ("auto","cutout","blend","framed"): bfail.append(f"S{s_['num']} {fn}: treatment")
        for k_,v_ in by_name.items():
            for o in v_: bfail.append(f"bundle {k_[0]} '{o.get('source_file')}' matches no {('HOOK/MAP' if k_[0]=='map' else 'REF/CHAR')} section")
    except Exception as eB:
        bfail.append(f"bundle unreadable: {eB}")
    add("FAIL" if bfail else "PASS",
        f"Animation bundle coherent with the breakdown ({os.path.basename(bp)}: {len(maps)} map(s), {len(stills)} still(s))" if not bfail
        else f"Animation bundle vs breakdown: {len(bfail)} issue(s) in {os.path.basename(bp)}")
    for x in bfail: add("  -", x)

# ---- nothing lost ----
src=glob.glob(f"{OUT}/*_source.txt")+glob.glob(f"{UP}/*_source.txt")
if src:
    sw=norm(open(max(src,key=os.path.getmtime),encoding="utf-8",errors="ignore").read())
    cw=norm(" ".join(s['script'] for s in sorted(secs,key=lambda s:s['num'])))
    add("PASS" if sw==cw else "FAIL", f"Section SCRIPTs reproduce the source ({len(cw)} words)" if sw==cw else f"Lost/changed text vs source (source {len(sw)} vs sections {len(cw)} words)")

fails=sum(1 for lv,_ in res if lv=="FAIL"); warns=sum(1 for lv,_ in res if lv=="WARN")
out=[f"# Review audit — {subj}","",f"**{fails} FAIL · {warns} WARN · {sum(1 for lv,_ in res if lv=='PASS')} PASS**",""]
for lv,msg in res:
    out.append(f"- {msg}" if lv=="  -" else f"- {'✅' if lv=='PASS' else '⚠️' if lv=='WARN' else '❌'} {msg}")
dest=f"{OUT}/{subj}_review_audit.md"; open(dest,"w",encoding="utf-8").write('\n'.join(out)+'\n')
for lv,msg in res: print(f"{lv if lv!='  -' else '   '} {msg}")
print(f"\nREVIEW AUDIT: {fails} FAIL / {warns} WARN")
print(f"Report: {dest}")
sys.exit(1 if fails else 0)
