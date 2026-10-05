#!/usr/bin/env python3
"""make_bundle_md.py — regenerate the SHA-256 self-verifying bundles (the fallback form of the toolchain for a
Project that cannot mount plain files): writing-room/ruvi_scripts_bundle.md and cartographer_kit.md.
    python3 tools/make_bundle_md.py            (run from the repo root or writing-room/)"""
import os, hashlib, glob
HERE = os.path.dirname(os.path.abspath(__file__)); WR = os.path.dirname(HERE)
EXTRACTOR = '''## Extractor (run this in the chat's computer, from an empty work dir)

~~~~
import re, hashlib, pathlib, sys
src = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
blocks = re.findall(r"### FILE: (.+?)\\n\\n~~~~\\n(.*?)\\n~~~~", src, re.S)
table = dict(re.findall(r"\\| `(.+?)` \\| \\d+ \\| `([0-9a-f]{64})` \\|", src))
for name, body in blocks:
    data = (body + "\\n").encode("utf-8")
    h = hashlib.sha256(data).hexdigest()
    ok = table.get(name) == h
    pathlib.Path(name).parent.mkdir(parents=True, exist_ok=True)
    pathlib.Path(name).write_bytes(data)
    print(("OK  " if ok else "HASH-MISMATCH ") + name)
~~~~
'''
def bundle(title, intro, files, out):
    rows, blocks = [], []
    for p in files:
        data = open(p, "rb").read()
        if not data.endswith(b"\n"): data += b"\n"
        name = os.path.basename(p); h = hashlib.sha256(data).hexdigest()
        rows.append(f"| `{name}` | {len(data)} | `{h}` |")
        body = data.decode("utf-8")[:-1]
        assert "\n~~~~" not in body, name
        blocks.append(f"### FILE: {name}\n\n~~~~\n{body}\n~~~~\n")
    md = f"# {title}\n\n{intro}\n\n**Do not retype code from this document.** Extract byte-perfect copies with the extractor at the bottom, then verify the SHA-256 table. If any hash mismatches, stop and tell the user.\n\n## File table\n\n| file | bytes | sha256 |\n|---|---|---|\n" + "\n".join(rows) + "\n\n## Files\n\n" + "\n".join(blocks) + "\n" + EXTRACTOR
    open(out, "w", encoding="utf-8").write(md); print(out, len(files), "files")
rev = open(os.path.join(WR, "scripts", "BUNDLE_VERSION.txt")).read().strip()
scripts = sorted(glob.glob(os.path.join(WR, "scripts", "*.py"))) + [os.path.join(WR, "scripts", "BUNDLE_VERSION.txt")]
bundle("RUVI scripts bundle (canonical toolchain)", f"Project-knowledge form of writing-room/scripts/ (bundle revision {rev}). Prefer the plain files when /mnt/project carries them.", scripts, os.path.join(WR, "ruvi_scripts_bundle.md"))
kit = [os.path.join(WR, "kit", n) for n in ("KIT_REVISION.txt", "README.md", "kit.py")]
bundle("Cartographer kit (canonical)", "Project-knowledge form of writing-room/kit/ (A4-2026-08-03). Used by Phase C per Video_Cartographer.md.", kit, os.path.join(WR, "cartographer_kit.md"))
