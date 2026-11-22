#!/usr/bin/env python3
"""film/data/shots.txt + the voice timing -> VOICE_TIMING.md, SHOT_LIST.md, data/timing.json (+ checks)."""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import timing as T

ROOT = T.ROOT
HOOK_START = 8.0
END_SCREEN = 15.0

def tc(t):
    return f"{int(t // 60)}:{t % 60:05.2f}"

def expand_layers(s):
    out = set()
    for part in s.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-"); out.update(range(int(a), int(b) + 1))
        elif part:
            out.add(int(part))
    return sorted(out)

TOK = re.compile(r"^L(\d{3})(?:\[(\d*):(\d*)\])?$")
def parse_range(spec):
    """'L001', 'L001-L003', 'L001[1:7]', 'L001[8:]', 'L009[3:]-L010' -> [(line, first_word, last_word or None)]"""
    a, _, b = spec.partition("-"); b = b or a
    ma, mb = TOK.match(a.strip()), TOK.match(b.strip())
    assert ma and mb, spec
    ia, ib = int(ma.group(1)), int(mb.group(1))
    segs = []
    for i in range(ia, ib + 1):
        w0 = int(ma.group(2) or 1) if i == ia else 1
        w1 = (int(mb.group(3)) if mb.group(3) else None) if i == ib else None
        if a == b and ma.group(3): w1 = int(ma.group(3))
        segs.append(("L%03d" % i, w0, w1))
    return segs

def parse_shots():
    shots, part = [], None
    for raw in (ROOT / "data" / "shots.txt").read_text().splitlines():
        raw = raw.rstrip()
        if not raw: continue
        if raw.startswith("#PART"):
            part = raw[1:].strip(); continue
        if raw.startswith("#"): continue
        f = [x.strip() for x in raw.split("|")]
        while len(f) > 10 and f[-1] == "": f.pop()
        while len(f) < 10: f.append("")
        assert len(f) == 10, (len(f), raw[:60])
        lines, loc, size, angle, move, layers, action, fx, sfx, card = f
        s = dict(part=part, loc=loc, size=size, angle=angle, move=move, layers=expand_layers(layers),
                 layers_txt=layers, action=action, fx=fx, sfx=sfx, cards=[])
        if lines.startswith("dur="): s.update(kind="open", dur=float(lines[4:]), segs=[], key=f"open{sum(1 for x in shots if x['kind']=='open') + 1}")
        elif lines.startswith("end="): s.update(kind="end", dur=float(lines[4:]), segs=[], key="end")
        else:
            s.update(kind="line", segs=parse_range(lines), key=lines)
        s["lines"] = list(dict.fromkeys(seg[0] for seg in s["segs"]))
        for c in [x for x in card.split(";") if x.strip()]:
            text, _, ref = c.strip().partition("@"); lid, _, word = ref.partition(":")
            s["cards"].append(dict(text=text, line=lid, word=word))
        shots.append(s)
    return shots

def noun_time(line, word):
    w = word.lower()
    for wt in line["wordtimes"]:
        tok = re.sub(r"[^a-z']", "", wt["w"].lower())
        if tok == w or tok.startswith(w):
            return wt["t0"], wt["t1"]
    raise SystemExit(f"card word {word!r} not found in {line['id']}: {line['text']}")

def layout(shots, lines):
    byid = {l["id"]: l for l in lines}
    order = [l["id"] for l in lines]
    t = 0.0
    for s in shots:
        if s["kind"] == "open":
            s["t0"], s["t1"] = t, t + s["dur"]; t = s["t1"]
    assert abs(t - HOOK_START) < 1e-6, f"opening shots must total {HOOK_START}s, got {t}"
    # contiguous coverage: every word of every line exactly once, in order
    cur = (0, 1)   # (line index, next word)
    for s in shots:
        if s["kind"] != "line": continue
        for (lid, w0, w1) in s["segs"]:
            li = order.index(lid); n = len(byid[lid]["wordtimes"])
            assert (li, w0) == cur, f"gap or overlap at {s['key']}: expected {order[cur[0]]} word {cur[1]}, got {lid} word {w0}"
            w1e = n if w1 is None else w1
            assert 1 <= w0 <= w1e <= n, (s["key"], w0, w1e, n)
            cur = (li + 1, 1) if w1e == n else (li, w1e + 1)
    assert cur == (len(order), 1), "the shot list does not reach the last word"
    def bound_before(li, w):   # cut time before word w of line li
        l = lines[li]
        if w > 1: return l["wordtimes"][w - 1]["t0"]
        return HOOK_START if li == 0 else (lines[li - 1]["end"] + l["start"]) / 2
    for s in shots:
        if s["kind"] != "line": continue
        lid0, w0, _ = s["segs"][0]; lid1, _, w1 = s["segs"][-1]
        li0, li1 = order.index(lid0), order.index(lid1); n1 = len(lines[li1]["wordtimes"])
        s["t0"] = bound_before(li0, w0)
        if w1 is not None and w1 < n1: s["t1"] = lines[li1]["wordtimes"][w1]["t0"]
        else: s["t1"] = T.build_end if li1 == len(order) - 1 else (lines[li1]["end"] + lines[li1 + 1]["start"]) / 2
    last = [s for s in shots if s["kind"] == "line"][-1]
    for s in shots:
        if s["kind"] == "end": s["t0"], s["t1"] = last["t1"], last["t1"] + s["dur"]
    # word cards: the picture appears 1.8 s before the word finishes typing, holds 1 s after; 2.5-3 s; never moves the timing
    over = []
    for s in shots:
        prev_end = s.get("t0")
        for c in s["cards"]:
            n0, n1 = noun_time(byid[c["line"]], c["word"])
            c0 = max(s["t0"], n1 - 1.8, prev_end)
            c1 = min(max(c0 + 2.5, n1 + 1.0), c0 + 3.0)
            c.update(t0=c0, t1=c1, noun_t0=n0, noun_t1=n1); prev_end = c1
            if c1 > s["t1"] + 1e-6: over.append((s["key"], c["text"], round(c1 - s["t1"], 2)))
    return over

def visible_segments(s, shots_by_time):
    """pieces of a shot not covered by any word card (cards can run over into the next shot)"""
    cuts = [(c["t0"], c["t1"]) for x in shots_by_time for c in x["cards"] if c["t1"] > s["t0"] and c["t0"] < s["t1"]]
    segs, t = [], s["t0"]
    for a, b in sorted(cuts):
        if a > t: segs.append(a - t)
        t = max(t, b)
    if s["t1"] > t: segs.append(s["t1"] - t)
    return segs

def main():
    shots = parse_shots()
    lines, end = T.build(); T.build_end = end
    over = layout(shots, lines)
    problems = []
    for i, s in enumerate(shots, 1):
        s["n"] = i; s["dur"] = s["t1"] - s["t0"]
        if len(s["layers"]) < 4: problems.append(f"shot {i}: fewer than 4 layers")
    for s in shots:
        s["visible"] = visible_segments(s, shots)
        if s["kind"] == "line" and max(s["visible"] or [0]) > 5.0 + 1e-6:
            problems.append(f"shot {s['n']} ({s['key']}): {max(s['visible']):.2f} s on screen without a cut (limit 5 s)")
    mouths = {}
    for l in lines:
        for a, b in l["dialog_spans"]:
            mouths.setdefault(l["speaker"], []).append([round(a, 3), round(b, 3), l["id"]])
    film_end = shots[-1]["t1"]
    out = dict(first_line_at=T.FIRST_LINE_AT, speech_ends=end, film_length=film_end, wpm=T.WPM,
               shots=[{k: v for k, v in s.items() if k != "layers_txt"} for s in shots],
               lines=[{k: v for k, v in l.items() if k not in ("dialog",)} for l in lines], mouths=mouths)
    (ROOT / "data" / "timing.json").write_text(json.dumps(out, indent=1))
    write_voice(lines, shots, end, film_end)
    write_shots(lines, shots, film_end)
    durs = [s["dur"] for s in shots]; n = len(shots)
    print(f"shots {n} (cards {sum(len(s['cards']) for s in shots)}), film {tc(film_end)} ({film_end:.1f} s), "
          f"avg shot {sum(durs)/n:.2f} s, speech ends {tc(end)}")
    print("longest on-screen pieces:", sorted(((round(max(s['visible'] or [0]), 2), s['n']) for s in shots if s['kind'] == 'line'), reverse=True)[:6])
    print("short (<1.2 s):", [(s['n'], round(s['dur'], 2)) for s in shots if s['dur'] < 1.2])
    print("cards running into the next shot:", over or "none")
    print("problems:", problems or "none")

def write_voice(lines, shots, end, film_end):
    uk = [l for l in lines if l["uk"]]
    md = ["# VOICE_TIMING: record your voiceover to this sheet", "",
          f"**The first line starts at {T.FIRST_LINE_AT:.2f} s (0:{T.FIRST_LINE_AT:05.2f}).** The opening title plays from 0:00 to 0:08.00 with no voice; the hook shot (Tom's hands and the bread) starts at 0:08.00.", "",
          f"The last line ends at {tc(lines[-1]['end'])}; the end screen runs {tc(shots[-1]['t0'])} to {tc(film_end)} with no voice. Film length {tc(film_end)}.", "",
          "## How the times were made", "",
          f"- A calm storyteller at {int(T.WPM)} words a minute ({T.SEC_PER_WORD:.3f} s a word). Hyphenated sound words count each part (\"Ding-ding-ding!\" is three words).",
          f"- {T.PAUSE:.1f} s after every sentence; {T.SCENE_PAUSE:.1f} s when the next line starts a new scene (marked **scene**); the \"...\" beats of the knock gag are {T.ELLIPSIS_PAUSE:.1f} s each.",
          "- Comic and emotional beats carry extra pause (the *pause after* column already includes it), so the picture has time for the gag.",
          f"- Lines with a US/UK swap word get {T.UK_EXTRA:.1f} s of extra room inside the slot (marked **UK**). The brief mentioned a swap list but did not include it, so I assumed these words: pants (trousers), cookie/cookies (biscuit/biscuits), colorful (colourful), favorite (favourite). Send me the real list and I will mark the right lines.",
          "- Word cards interrupt a shot while the line is still being read; where a card needs more room than the shot has, its line got extra pause. Nothing else moves.",
          "- Mouths move only inside the quoted words of a line; narration keeps every mouth closed.", "",
          "**Allowed** is the reading time (start to end). Record each line inside its slot, then leave the *pause after* as silence.", "",
          "| # | Start | End | Allowed (s) | Pause after (s) | Who | Line | Notes |", "|---|---|---|---|---|---|---|---|"]
    for l in lines:
        who = "Narrator"
        if l["speaker"]:
            nd = sum(1 for w in l["wordtimes"] if w["dialog"]); nn = len(l["wordtimes"]) - nd
            who = l["speaker"] if nn == 0 else f"{l['speaker']} (quoted words only; rest Narrator)"
        notes = []
        if l["scene_start"]: notes.append("**scene**")
        if l["uk"]: notes.append("**UK**")
        if l.get("ellipsis"): notes.append("then a 0.8 s \"...\" beat")
        if l["extra"] > 0.01: notes.append(f"comic/emotional room +{l['extra']:.1f}")
        md.append(f"| {l['id']} | {tc(l['start'])} | {tc(l['end'])} | {l['slot']:.2f} | {l['base_pause'] + l['extra']:.2f} | {who} | {l['text']} | {', '.join(notes)} |")
    md += ["", "## UK lines", ""] + [f"- {l['id']} ({tc(l['start'])}): {l['text']}" for l in uk]
    (ROOT / "VOICE_TIMING.md").write_text("\n".join(md) + "\n")

LAYERS = "L1 sky · L2 far · L3 middle · L4 action · L5 near ground · L6 foreground frame · L7 atmosphere"

def write_shots(lines, shots, film_end):
    byid = {l["id"]: l for l in lines}
    md = ["# SHOT_LIST", "",
          f"{len(shots)} shots, {sum(len(s['cards']) for s in shots)} word cards, film length {tc(film_end)}. Times come from VOICE_TIMING.md, so the two files always agree. No shot stays on screen longer than 5 s (director's note 14), except the opening title shots and the 15 s end screen. Most cuts fall in the pauses between lines; a long line is cut at a word boundary, written `L001[1:7]` (words 1 to 7) and `L001[8:]` (word 8 to the end). Word cards cut in on purpose.", "",
          "Layers: " + LAYERS + ". Every shot moves at least four. Moves: push, pull, pan, tilt, track, snap (a 6-frame comic zoom, used four times at most). The hook (L001[1:7]) and the callback (L184[1:5]) share one framing and one push-in speed.", "",
          "**Sound-column rule:** during every line slot the music stays very quiet and effects soft; the voice is the loudest sound. Only the opening, the end screen and the gaps between lines may be fuller.", ""]
    cur = None
    for s in shots:
        if s["part"] != cur:
            cur = s["part"]
            md += ["", f"## {cur}", "", "| # | Time | Dur | Lines | Loc | Shot | Layers | Action and reactions | Effects | Sound | Word card |", "|---|---|---|---|---|---|---|---|---|---|---|"]
        if s["segs"]:
            ids = s["key"]
            txt = " ".join(" ".join(w["w"] for w in byid[lid]["wordtimes"][w0 - 1:(w1 or len(byid[lid]["wordtimes"]))]) for lid, w0, w1 in s["segs"])
            txt = (txt[:46] + "…") if len(txt) > 48 else txt
            ln = f"{ids}<br>{txt}"
        else:
            ln = "(no line: title music)" if s["kind"] == "open" else "(no line: end screen)"
        cards = "<br>".join(f"▣ “{c['text']}” {tc(c['t0'])}–{tc(c['t1'])}, typed by {tc(c['noun_t1'])}" for c in s["cards"]) or "–"
        md.append(f"| {s['n']} | {tc(s['t0'])}–{tc(s['t1'])} | {s['dur']:.1f} | {ln} | {s['loc']} | {s['size']} · {s['angle']} · {s['move']} | {s['layers_txt']} | {s['action']} | {s['fx']} | {s['sfx']} | {cards} |")
    (ROOT / "SHOT_LIST.md").write_text("\n".join(md) + "\n")

if __name__ == "__main__":
    main()
