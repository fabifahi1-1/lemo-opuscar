#!/usr/bin/env python3
"""Split film/SCRIPT.md into sentence lines (film/data/lines.json).
Verbatim: joining all line texts with a space (and paragraphs with a newline) must give back SCRIPT.md."""
import re, json, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / "SCRIPT.md").read_text().strip()
paras = [p.strip().replace("\n", " ") for p in src.split("\n\n") if p.strip()]

def ends_sentence(t):
    core = t.rstrip("\"')”’")
    if core.endswith("..."):
        return False
    return core[-1:] in ".!?"

def nwords(t):
    core = re.sub(r"[^A-Za-z0-9'-]", " ", t)
    n = 0
    for chunk in core.split():
        parts = [x for x in chunk.split("-") if x]
        n += max(1, len(parts))
    return n

lines = []
for pi, p in enumerate(paras):
    toks = p.split()
    cur, inq = [], False
    def flush(kind="speech"):
        global cur
        if cur:
            lines.append({"para": pi, "text": " ".join(cur), "kind": kind})
            cur = []
    for i, t in enumerate(toks):
        if t == "...":
            flush(); lines.append({"para": pi, "text": "...", "kind": "pause"}); continue
        cur.append(t)
        nxt = toks[i + 1] if i + 1 < len(toks) else None
        if ends_sentence(t):
            if nxt is None:
                flush()
            else:
                first = nxt.lstrip("\"'(“‘")
                if nxt == "..." or not first[:1].islower():
                    flush()
    flush()

# per-word dialogue flags
inq = False
out = []
for ln in lines:
    if ln["kind"] == "pause":
        out.append({**ln, "words": 0, "dialog": []}); continue
    dl = []
    for t in ln["text"].split():
        starts = t.startswith('"')
        if starts: inq = True
        dl.append((t, nwords(t), inq))
        if t.endswith('"') and (not starts or len(t) > 1 and t[1:].endswith('"') and t != '"'):
            if not (starts and t.count('"') == 1):
                inq = False
    out.append({**ln, "words": sum(x[1] for x in dl), "dialog": [[a, b, c] for a, b, c in dl]})
n = 0
for ln in out:
    if ln["kind"] == "pause":
        ln["id"] = None
    else:
        n += 1; ln["id"] = f"L{n:03d}"
(ROOT / "data").mkdir(exist_ok=True)
(ROOT / "data" / "lines.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))
# verbatim check
rebuilt = []
cp = -1
for ln in out:
    if ln["para"] != cp:
        rebuilt.append("\n\n" if rebuilt else ""); cp = ln["para"]
    else:
        rebuilt.append(" ")
    rebuilt.append(ln["text"])
assert "".join(rebuilt).strip() == "\n\n".join(paras), "VERBATIM CHECK FAILED"
print("verbatim ok;", n, "lines;", sum(l["words"] for l in out), "words", file=sys.stderr)
for ln in out:
    if ln["kind"] == "pause":
        print("      ...        (pause)")
    else:
        q = "".join("D" if d[2] else "n" for d in ln["dialog"])
        print(f'{ln["id"]} p{ln["para"]:02d} w{ln["words"]:02d} {ln["text"]}')
