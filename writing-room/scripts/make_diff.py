#!/usr/bin/env python3
"""
MAKE DIFF — write [Subject]_changes.md: exactly what the review changed.

Compares the pristine [Subject]_breakdown_original.txt (saved at the start of the
review) to the corrected [Subject]_breakdown.txt and lists, per section, every
PROMPT, LINK, and TIMECODE that changed, as old -> new. Sections are matched by their
SCRIPT text (not by number) so the report still makes sense if sections were re-
composed during the timing pass. Anything whose SCRIPT changed (or was added/removed)
is reported under composition changes.

(r8) THE DECISION LOG SURVIVES. Under autorun every decision of the run — starting
with the "TITLE: <full title> → SUBJECT: [Subject]" mapping line — is logged in
[Subject]_changes.md long before this script runs. The diff is therefore written as a
marked block (<!-- make_diff:begin --> … <!-- make_diff:end -->) that is REPLACED on
each run, while everything outside the markers is carried over verbatim. Nothing
needs re-appending after the review chain any more.

Optional argv[1] = the working folder.
"""
import re, glob, os, sys

OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs")
hdr=re.compile(r'^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$')
prre=re.compile(r'^\s*PROMPT\s+([123])\b\s*:?(.*)$')
linkre=re.compile(r'^\s*(VIDEO LINK|REF/MAP LINK \d+|ALT LINK \d+|LINK|REFERENCE)\s*:\s*(\S+)')
tcre=re.compile(r'TIMECODE:\s*(.+?)\s*$')
norm=lambda s: " ".join(re.findall(r"[a-z0-9]+", s.lower()))

def parse(path):
    L=open(path,encoding="utf-8").read().split('\n'); heads=[i for i,l in enumerate(L) if hdr.match(l)]; out=[]
    for k,hi in enumerate(heads):
        end=heads[k+1] if k+1<len(heads) else len(L); blk=L[hi:end]; m=hdr.match(L[hi])
        s_i=next((q for q,l in enumerate(blk) if l.strip()=='SCRIPT:'), None)
        script=""
        if s_i is not None:
            buf=[]; q=s_i+1
            while q<len(blk) and blk[q].strip()!='' and not blk[q].startswith('MAP SUBJECT:'): buf.append(blk[q].strip()); q+=1
            script=' '.join(buf)
        tc=next((tcre.search(l).group(1) for l in blk if tcre.search(l)), None)
        prompts={}
        for q,l in enumerate(blk):
            pm=prre.match(l)
            if pm:
                txt=pm.group(2).strip()
                if txt.startswith("|") and txt.endswith("|"): txt=""  # |LABEL| marker; real prompt is on the next line
                r=q+1
                while r<len(blk) and not txt and blk[r].strip()=='': r+=1
                if not txt and r<len(blk): txt=blk[r].strip()
                prompts[pm.group(1)]=txt
        links=[(lm.group(1),lm.group(2)) for l in blk for lm in [linkre.match(l)] if lm]
        out.append({'num':int(m.group(1)),'type':m.group(3).strip(),'script':script,
                    'tc':tc,'prompts':prompts,'links':links})
    return out

orig_p=glob.glob(f"{OUT}/*_breakdown_original.txt")
cur_p=[p for p in glob.glob(f"{OUT}/*_breakdown.txt") if "_original" not in p and "special" not in os.path.basename(p).lower()]
subj=re.sub(r'(_breakdown.*)?\.txt$','',os.path.basename(cur_p[0])) if cur_p else "package"
dest=f"{OUT}/{subj}_changes.md"
MARK_A="<!-- make_diff:begin -->"; MARK_B="<!-- make_diff:end -->"
def write_changes(block_lines):
    """(r8) Replace only the marked diff block; keep the run's own log verbatim."""
    prev=open(dest,encoding="utf-8",errors="ignore").read() if os.path.exists(dest) else ""
    prev=re.sub(re.escape(MARK_A)+r'.*?'+re.escape(MARK_B)+r'\n?', '', prev, flags=re.S).rstrip()
    block=MARK_A+"\n"+'\n'.join(block_lines).rstrip('\n')+"\n"+MARK_B+"\n"
    open(dest,"w",encoding="utf-8").write((prev+"\n\n"+block) if prev else block)
    return bool(prev)

if not orig_p or not cur_p:
    kept=write_changes([f"# Changes — {subj}","","No original snapshot found, so no diff could be produced."])
    print(f"Changes: {dest} (no original to compare"+("; run log carried over)" if kept else ")")); sys.exit(0)

O=parse(max(orig_p,key=os.path.getmtime)); C=parse(max(cur_p,key=os.path.getmtime))
obys={norm(s['script']):s for s in O}
rows=[]; comp=[]; used=set()
for c in C:
    key=norm(c['script']); o=obys.get(key)
    if o is None:
        comp.append(f"S{c['num']} {c['type']}: new/re-composed section text"); continue
    used.add(key); diffs=[]
    if (o['tc'] or "")!=(c['tc'] or ""):
        diffs.append(("TIMECODE", o['tc'] or "—", c['tc'] or "—"))
    for k in ("1","2","3"):
        if o['prompts'].get(k,"")!=c['prompts'].get(k,""):
            diffs.append((f"PROMPT {k}", o['prompts'].get(k,"—"), c['prompts'].get(k,"—")))
    od=dict(o['links']); cd=dict(c['links'])
    for lab in sorted(set(od)|set(cd)):
        if od.get(lab)!=cd.get(lab):
            diffs.append((lab, od.get(lab,"(none)"), cd.get(lab,"(removed)")))
    if diffs: rows.append((c,diffs))
for o in O:
    if norm(o['script']) not in used: comp.append(f"(original S{o['num']} {o['type']}: text changed or removed)")

out=[f"# Changes — {subj}","",
     f"**{sum(len(d) for _,d in rows)} field change(s) across {len(rows)} section(s)**"+
     (f" · **{len(comp)} composition change(s)**" if comp else ""),""]
if not rows and not comp:
    out.append("No changes — the reviewed breakdown is identical to the original.")
for c,diffs in rows:
    out.append(f"## S{c['num']} — {c['type']}")
    for field,old,new in diffs:
        out.append(f"- **{field}**")
        out.append(f"  - old: {old}")
        out.append(f"  - new: {new}")
    out.append("")
if comp:
    out+=["## Composition changes (timing pass)"]+[f"- {x}" for x in comp]
kept=write_changes(out)
print(f"Changes: {dest}"+("  (run log carried over; diff block replaced)" if kept else ""))
print(f"  {sum(len(d) for _,d in rows)} field change(s) in {len(rows)} section(s); {len(comp)} composition change(s)")
