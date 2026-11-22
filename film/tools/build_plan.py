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
        if lines.startswith("dur="): s.update(kind="open", dur=float(lines[4:]), lines=[])
        elif lines.startswith("end="): s.update(kind="end", dur=float(lines[4:]), lines=[])
        else:
            a, _, b = lines.partition("-"); b = b or a
            ia, ib = int(a[1:]), int(b[1:])
            s.update(kind="line", lines=["L%03d" % i for i in range(ia, ib + 1)])
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
    # contiguous line coverage
    seen = [x for s in shots for x in s["lines"]]
    assert seen == order, "every script line must be covered exactly once, in order"
    for s in shots:
        if s["kind"] != "line": continue
        a, b = s["lines"][0], s["lines"][-1]
        ia, ib = order.index(a), order.index(b)
        s["t0"] = HOOK_START if ia == 0 else (lines[ia - 1]["end"] + lines[ia]["start"]) / 2
        s["t1"] = T.build_end if ib == len(order) - 1 else (lines[ib]["end"] + lines[ib + 1]["start"]) / 2
    last = [s for s in shots if s["kind"] == "line"][-1]
    for s in shots:
        if s["kind"] == "end": s["t0"], s["t1"] = last["t1"], last["t1"] + s["dur"]
    # word cards
    need = {}
    for s in shots:
        prev_end = s.get("t0")
        for c in s["cards"]:
            n0, n1 = noun_time(byid[c["line"]], c["word"])
            c0 = max(s["t0"], n1 - 1.8, prev_end)
            c1 = min(max(c0 + 2.5, n1 + 1.0), c0 + 3.0)
            c.update(t0=c0, t1=c1, noun_t0=n0, noun_t1=n1)
            prev_end = c1
            if c1 > s["t1"] + 1e-6:
                lid = s["lines"][-1]
                need[lid] = max(need.get(lid, 0), (c1 - s["t1"]) * 2 + 0.02)
    return need

def main():
    shots = parse_shots()
    for it in range(30):
        lines, end = T.build(); T.build_end = end
        need = layout(shots, lines)
        # hook shot and its callback (L184) must last the same time
        hook = next(s for s in shots if s["lines"][:1] == ["L001"])
        cb = next(s for s in shots if s["lines"][:1] == ["L184"])
        d_hook, d_cb = hook["t1"] - hook["t0"], cb["t1"] - cb["t0"]
        if abs(d_hook - d_cb) > 0.02:
            T.EXTRA["L184"] = max(0, T.EXTRA.get("L184", 0) + (d_hook - d_cb) * 2)
            continue
        if not need: break
        for lid, x in need.items():
            T.EXTRA[lid] = T.EXTRA.get(lid, 0) + x
    else:
        raise SystemExit("timing did not settle")
    # ---- checks
    problems = []
    for i, s in enumerate(shots, 1):
        s["n"] = i
        if len(s["layers"]) < 4: problems.append(f"shot {i}: fewer than 4 layers")
        s["dur"] = s["t1"] - s["t0"]
    durs = [s["dur"] for s in shots]
    # ---- speech beats for mouths
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
    n = len(shots)
    print(f"shots {n} (cards {sum(len(s['cards']) for s in shots)}), film {tc(film_end)} ({film_end:.1f} s), "
          f"avg shot {sum(durs)/n:.2f} s, speech ends {tc(end)}")
    print("short (<1.5 s):", [(s['n'], round(s['dur'], 1)) for s in shots if s['dur'] < 1.5])
    print("long (>6.5 s):", [(s['n'], round(s['dur'], 1)) for s in shots if s['dur'] > 6.5])
    print("hook vs callback:", round(hook['t1'] - hook['t0'], 2), round(cb['t1'] - cb['t0'], 2))
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
          f"{len(shots)} shots, {sum(len(s['cards']) for s in shots)} word cards, film length {tc(film_end)}. Times come from VOICE_TIMING.md, so the two files always agree. Cuts fall in the pauses between lines; the only exceptions are word cards, which interrupt a shot on purpose.", "",
          "Layers: " + LAYERS + ". Every shot moves at least four. Moves: push, pull, pan, tilt, track, snap (a 6-frame comic zoom, used four times at most). Hook and callback (shots with L001 and L184) are the same framing and the same push-in.", "",
          "**Sound-column rule:** during every line slot the music stays very quiet and effects soft; the voice is the loudest sound. Only the opening, the end screen and the gaps between lines may be fuller.", ""]
    cur = None
    for s in shots:
        if s["part"] != cur:
            cur = s["part"]
            md += ["", f"## {cur}", "", "| # | Time | Dur | Lines | Loc | Shot | Layers | Action and reactions | Effects | Sound | Word card |", "|---|---|---|---|---|---|---|---|---|---|---|"]
        if s["lines"]:
            ids = s["lines"][0] if len(s["lines"]) == 1 else f"{s['lines'][0]}–{s['lines'][-1]}"
            txt = " ".join(byid[i]["text"] for i in s["lines"])
            txt = (txt[:46] + "…") if len(txt) > 48 else txt
            ln = f"{ids}<br>{txt}"
        else:
            ln = "(no line: title music)" if s["kind"] == "open" else "(no line: end screen)"
        cards = "<br>".join(f"▣ “{c['text']}” {tc(c['t0'])}–{tc(c['t1'])}, typed by {tc(c['noun_t1'])}" for c in s["cards"]) or "–"
        md.append(f"| {s['n']} | {tc(s['t0'])}–{tc(s['t1'])} | {s['dur']:.1f} | {ln} | {s['loc']} | {s['size']} · {s['angle']} · {s['move']} | {s['layers_txt']} | {s['action']} | {s['fx']} | {s['sfx']} | {cards} |")
    (ROOT / "SHOT_LIST.md").write_text("\n".join(md) + "\n")

if __name__ == "__main__":
    main()
