"""Voice timeline: place every narration line on the film clock, align the script's words to Whisper's word times,
find the quoted (spoken-by-a-character) spans for lip-sync and extract mouth envelopes.
  in:  script/lines.json, script/cards.json, voices/dur.json, voices/words.json, voices/<id>.wav
  out: script/vtime.json
"""
import json, os, re, difflib
import numpy as np, soundfile as sf
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding='utf-8'))
lines, cards, dur, asr = J('script/lines.json'), J('script/cards.json'), J('voices/dur.json'), J('voices/words.json')
FPS = 24
T_TITLE = 7.25        # "Puss in Boots" is said as the title paints on the clouds
OPEN_END = 14.6       # the first story line starts as the camera settles on the mill
CARD_EXTRA = .55      # a little more air after a line that shows a word card
card_lines = {c['line'] for c in cards}
BEAT_AFTER = {'L031', 'L048', 'L126', 'L141'}   # card lines followed by Pick! / Ding! / EEEK! / BOO!
norm = lambda w: re.sub(r"[^a-z0-9']", '', w.lower().replace('’', "'"))

def align(text, words):
    """script words → (word, t0, t1) using Whisper's timings; unmatched words are interpolated."""
    tw = [w for w in re.split(r'\s+', text.replace('...', ' ').replace('—', ' ').replace('-', ' - ')) if w and w != '-']
    tn, an = [norm(w) for w in tw], [norm(w[0]) for w in words]
    out = [None] * len(tw)
    sm = difflib.SequenceMatcher(a=tn, b=an, autojunk=False)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n): out[a + k] = [max(0, words[b + k][1]), words[b + k][2]]
    # interpolate unmatched by character position
    total = sum(len(w) + 1 for w in tw)
    end = words[-1][2] if words else 1
    pos, acc = [], 0
    for w in tw: pos.append(acc / total); acc += len(w) + 1
    for i in range(len(tw)):
        if out[i] is None:
            prev = next((j for j in range(i - 1, -1, -1) if out[j]), None); nxt = next((j for j in range(i + 1, len(tw)) if out[j]), None)
            t0 = out[prev][1] if prev is not None else 0
            t1 = out[nxt][0] if nxt is not None else end
            p0 = pos[prev + 1] if prev is not None else 0; p1 = pos[nxt] if nxt is not None else 1
            f = (pos[i] - p0) / max(1e-6, p1 - p0); f2 = (pos[i] + (len(tw[i]) + 1) / total - p0) / max(1e-6, p1 - p0)
            out[i] = [t0 + (t1 - t0) * f, t0 + (t1 - t0) * min(1, f2)]
    return tw, out

def quoted(tw):
    """which script words are inside quotes"""
    q, inside = [], False
    for w in tw:
        starts = w.startswith('"') or w.startswith('"\'') ; ends = w.rstrip('.,!?\'').endswith('"') or w.endswith('"')
        if starts: inside = True
        q.append(inside)
        if ends and inside: inside = False
    return q

def envelope(wav, t0, t1):
    a, sr = sf.read(os.path.join(ROOT, 'voices', wav)); a = a if a.ndim == 1 else a.mean(1)
    hop = sr // FPS; n = len(a) // hop + 1
    rms = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    ref = np.percentile(rms[rms > rms.max() * .05], 90) if (rms > rms.max() * .05).any() else rms.max()
    e = np.clip(rms / ref, 0, 1.2) ** .8
    return [round(float(x), 2) for x in e]

t, out, prev_card = 0.0, [], False
for i, L in enumerate(lines):
    lid = L['id']; d = dur[lid]
    if i == 0: t0 = T_TITLE
    elif i == 1: t0 = OPEN_END
    else: t0 = t + L['gap'] + (CARD_EXTRA if prev_card else 0)
    words = asr.get(lid) or []
    tw, tt = align(L['text'], words)
    wl = [[w, round(t0 + a, 3), round(t0 + b, 3)] for w, (a, b) in zip(tw, tt)]
    rec = dict(id=lid, t0=round(t0, 3), t1=round(t0 + d, 3), dur=d, who=L['who'], tone=L['tone'], text=L['text'], words=wl)
    if L['who']:
        q = quoted(tw)
        spans = []
        for (w, a, b), inq in zip(wl, q):
            if not inq: continue
            if spans and a - spans[-1][1] < .35: spans[-1][1] = b
            else: spans.append([a, b])
        rec['quote'] = [[round(a - .04, 3), round(b + .06, 3)] for a, b in spans]
        rec['env'] = envelope(lid + '.wav', 0, d)
    out.append(rec)
    t = t0 + d; prev_card = lid in card_lines
    if lid in BEAT_AFTER:   # the next line is an action beat with its own sound word: start it after the card is gone
        c = next(c for c in cards if c['line'] == lid); tw = next(w[1] for w in wl if norm(w[0]).startswith(c['word']))
        t = max(t, tw + 3.05 - L['gap'] * 0 - (lines[i + 1]['gap'] + CARD_EXTRA))
END = t
json.dump(dict(fps=FPS, open_end=OPEN_END, t_title=T_TITLE, last_line_end=round(END, 3), lines=out, cards=cards),
          open(os.path.join(ROOT, 'script/vtime.json'), 'w'), ensure_ascii=False)
print(f'{len(out)} lines, last line ends at {END:.2f} s ({END / 60:.1f} min)')
