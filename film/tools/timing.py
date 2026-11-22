#!/usr/bin/env python3
"""Compute the voice timing for film/SCRIPT.md -> film/data/timing.json.
Rules (from the director's brief): 140 wpm, 0.5 s after every sentence, 1.0 s at a scene change,
extra room on comic beats, +0.3 s on lines that carry a US/UK swap word."""
import json, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
WPM = 140.0
SEC_PER_WORD = 60.0 / WPM
FIRST_LINE_AT = 8.5          # opening title runs 0-8.0 s, hook shot starts at 8.0 s
PAUSE = 0.5
SCENE_PAUSE = 1.0
ELLIPSIS_PAUSE = 0.8         # the "..." beats of the knock gag
UK_EXTRA = 0.3
UK_SWAP = re.compile(r"\b(pants|cookies?|colorful|favorite)\b", re.I)

# scene changes: the line that OPENS a new scene (the pause before it is 1.0 s instead of 0.5 s)
SCENE_START = {"L003","L024","L027","L032","L035","L036","L048","L052","L058","L064","L074","L088","L091",
               "L100","L116","L120","L160","L182","L188","L192","L193"}

# extra trailing time on comic / emotional beats (seconds added to the pause after the line)
EXTRA = {
 "L005":0.8, "L006":0.4, "L007":0.4, "L008":0.8,
 "L011":0.8, "L017":0.5, "L018":0.7, "L027":0.4, "L028":0.4, "L030":0.5, "L034":0.3,
 "L059":0.5, "L066":0.3, "L069":0.8, "L070":0.9, "L075":0.3, "L091":0.3, "L106":0.6, "L111":0.6,
 "L113":0.3, "L125":0.4, "L126":0.4, "L127":0.2, "L128":0.2, "L129":0.6, "L130":0.3, "L132":1.0,
 "L134":1.6, "L139":1.0, "L141":0.4, "L144":1.2, "L145":0.5, "L154":0.8, "L156":1.0, "L157":1.0,
 "L173":0.5, "L189":0.4, "L174":1.8, "L180":0.9, "L181":0.7, "L191":0.8, "L184":0.4,
}
# who speaks the quoted words of a line
SPEAKER = {}
def spk(name, ids):
    for i in ids.split():
        SPEAKER["L%03d" % int(i)] = name
spk("Tom",    "9 10 18 21 66 68 115 169 170 171 172 181 186 187")
spk("Puss",   "16 19 20 22 23 31 39 40 49 64 67 69 75 76 97 98 112 135 136 137 141 147 148 149 150 151 156 164 185")
spk("King",   "41 42 43 50 51 53 54 55 77 78 79 80 85 101 104 107 108 114 175 176 177 178")
spk("Crier",  "60")
spk("Villagers","99")
spk("Farmers","102")
spk("Shepherd","105")
spk("Sheep",  "106")
spk("Picker", "109 113")
spk("Ogre",   "138 152 153")
spk("Mouse",  "157")

def build():
    raw = json.loads((ROOT/"data"/"lines.json").read_text())
    lines, t, pend_pause = [], FIRST_LINE_AT, 0.0
    # collapse the "..." pseudo lines into an extra pause on the previous line
    seq = []
    for r in raw:
        if r["kind"] == "pause":
            seq[-1]["ellipsis"] = True
        else:
            seq.append({**r})
    for i, r in enumerate(seq):
        nxt = seq[i+1]["id"] if i+1 < len(seq) else None
        slot = r["words"] * SEC_PER_WORD
        uk = bool(UK_SWAP.search(r["text"]))
        if uk: slot += UK_EXTRA
        base = SCENE_PAUSE if (nxt in SCENE_START) else PAUSE
        if nxt is None: base = 1.0
        extra = EXTRA.get(r["id"], 0.0) + (ELLIPSIS_PAUSE if r.get("ellipsis") else 0.0)
        r.update(start=t, end=t+slot, slot=slot, base_pause=base, extra=extra, uk=uk,
                 speaker=SPEAKER.get(r["id"]), scene_start=r["id"] in SCENE_START)
        # per-word times (equal spacing inside the reading time, the UK room sits at the end)
        wt, cur = [], t
        for (tok, n, d) in r["dialog"]:
            wt.append({"w": tok, "n": n, "t0": cur, "t1": cur + n*SEC_PER_WORD, "dialog": d})
            cur += n*SEC_PER_WORD
        r["wordtimes"] = wt
        r["dialog_spans"] = merge_spans(wt)
        t = r["end"] + base + extra
        r["next_start"] = t
        lines.append(r)
    return lines, t

def merge_spans(wt):
    spans = []
    for w in wt:
        if w["dialog"]:
            if spans and abs(spans[-1][1]-w["t0"]) < 1e-6: spans[-1][1] = w["t1"]
            else: spans.append([w["t0"], w["t1"]])
    return spans

if __name__ == "__main__":
    lines, end = build()
    (ROOT/"data"/"timing_lines.json").write_text(json.dumps({"lines": lines, "speech_end": end}, indent=1))
    print("lines:", len(lines), "last line ends", round(lines[-1]["end"],1), "s;  + closing pause ->", round(end,1))
    for l in lines[:12]:
        print(l["id"], round(l["start"],2), round(l["end"],2), l["speaker"], l["text"][:50])
    # sanity: mixed lines
    for i in ("L016","L169","L175","L113","L109"):
        l = next(x for x in lines if x["id"]==i)
        print(i, "".join(("D" if d["dialog"] else "n")+" " for d in l["wordtimes"]), "|", l["text"])
