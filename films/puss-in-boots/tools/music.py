"""Original score for Puss in Boots (Lantern and Page). Reads out/timeline.json (music cue events) → out/music.wav (48 kHz stereo).
Every cue is written here as notes; instruments are CC0 samples (VSCO 2 CE, VCSL) and the modelled music box (pluck.py).
The signature tune (STYLE_BIBLE.md §1): F major, 3/4, quarter = 92:  A4 C5 F5 | E5- D5 | D5 F5 Bb5 | A5- G5 | F5--
"""
import json, os, sys
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
LIB = os.environ.get('LIB') or os.path.dirname(os.path.dirname(ROOT)); sys.path.insert(0, LIB)
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add

S.seed(7)
TL = json.load(open(os.path.join(ROOT, 'out/timeline.json')))
DUR = TL['dur']
mus = np.zeros((int((DUR + 4) * SR), 2), np.float32)
used = set()
def add2(buf, x, at, g=1.0):
    s = int(round(at * SR)); e = min(len(buf), s + len(x))
    if e > s: buf[s:e] += x[:e - s] * g

def score(events, t0, gain=1.0, rev=.22, size=.45):
    """events: (t, inst, pitch, dur, vel, pan) relative to t0 → placed into the music bus"""
    if not events: return
    end = max(e[0] + e[3] for e in events) + 3
    for e in events: used.add(e[1])
    x = S.render(events, dur=end)
    x = S.room(x, size=size, mix=rev)
    add2(mus, x, t0, gain)

def mb(events, t0, gain=1.0):   # music-box notes (modelled)
    buf = np.zeros((int((max(e[0] for e in events) + 4) * SR), 2), np.float32)
    for t, p, v, pan in events: add(buf, P.pluck('music_box', p, None, vel=v), t, 1.0, pan)
    add2(mus, S.room(buf, size=.4, mix=.25), t0, gain)

B = 60 / 92   # beat of the signature tune
MEL = [(0, 'A4', 1), (1, 'C5', 1), (2, 'F5', 1), (3, 'E5', 2), (5, 'D5', 1), (6, 'D5', 1), (7, 'F5', 1), (8, 'A#5', 1), (9, 'A5', 2), (11, 'G5', 1), (12, 'F5', 3)]
HARM = [('F3', ['F3', 'A3', 'C4', 'F4']), ('D3', ['D3', 'A3', 'D4', 'F4']), ('A#2', ['A#2', 'F3', 'A#3', 'D4']), ('C3', ['C3', 'G3', 'C4', 'E4']), ('F2', ['F2', 'C3', 'F3', 'A3', 'C4', 'F4'])]

def signature(t0, gain=1.0, end_hold=3.0, bright=True):
    ev = []
    for b, p, d in MEL:
        ev.append((b * B, 'glockenspiel', S.name(S.midi(p) + 12) if S.midi(p) < 79 else p, d * B + .4, .5, .15))
        ev.append((b * B, 'clarinet', S.name(S.midi(p) - 12), d * B * .95, .42, -.2))
    for i, (bass, arp) in enumerate(HARM):
        bt = i * 3 * B
        ev.append((bt, 'upright', bass, 3 * B + (end_hold if i == 4 else 0), .45, 0))
        step = (3 * B) / len(arp) if i < 4 else .09
        for k, p in enumerate(arp): ev.append((bt + k * step, 'harp', p, 2.5, .5, .35))
        ev.append((bt, 'violins', S.name(S.midi(arp[-1]) + 0), 3 * B + (end_hold if i == 4 else .2), .25, -.3))
        ev.append((bt, 'cellos', S.name(S.midi(bass) + 12), 3 * B + (end_hold if i == 4 else .2), .22, .3))
    ev.append((12 * B, 'triangle', 'open', 2, .25, .3))
    score(ev, t0, gain)

def theme_slow(t0, gain, inst='upright', tempo=1.35, bars=4):
    ev = []
    for b, p, d in MEL:
        if b >= bars * 3: break
        ev.append((b * B * tempo, inst, p, d * B * tempo + .3, .4, 0))
    for i, (bass, arp) in enumerate(HARM[:bars]):
        bt = i * 3 * B * tempo
        for k, p in enumerate(arp): ev.append((bt + k * .22, 'harp', p, 2.5, .32, .3))
        ev.append((bt, 'upright', bass, 3 * B * tempo, .3, -.1))
    score(ev, t0, gain)

CUE = {}
def cue(name): return lambda f: CUE.__setitem__(name, f)

@cue('tune_open')
def _(t): signature(t, 1.0)
@cue('tune_end')
def _(t): signature(t + .3, 1.0, end_hold=4)
@cue('mus_mill')
def _(t): theme_slow(t, .8, 'upright', 1.45, 4)
@cue('mus_bread')
def _(t): score([(0, 'harp', 'F3', 3, .3, .2), (.15, 'harp', 'C4', 3, .3, .2), (.3, 'harp', 'A4', 3, .3, .2), (.4, 'clarinet', 'C5', 1.2, .35, -.2), (1.6, 'clarinet', 'A4', 1.0, .33, -.2), (2.6, 'clarinet', 'F4', 2.4, .3, -.2)], t, .8)
@cue('mus_march')
def _(t):
    bt = 60 / 112; ev = []
    bass = ['C3', 'G2', 'C3', 'G2', 'F2', 'C3', 'G2', 'C3']
    mel = ['E5', 'G5', 'E5', 'C5', 'D5', 'F5', 'D5', 'B4', 'C5', 'E5', 'G5', 'E5', 'F5', 'D5', 'B4', 'C5']
    for k in range(16):
        ev.append((k * bt, 'cellos_pizz' if k % 2 == 0 else 'violas_pizz', bass[k // 2] if k % 2 == 0 else S.name(S.midi(bass[k // 2]) + 7), .3, .55, -.2))
        ev.append((k * bt, 'violins_pizz', mel[k], .25, .45, .25))
        if k % 2 == 1: ev.append((k * bt, 'bassoon_stac', S.name(S.midi(bass[k // 2]) + 12), .2, .4, 0))
    score(ev, t, .9)
@cue('mus_forest')
def _(t): score([(k * .32, 'flute_stac', p, .3, .4, .2) for k, p in enumerate(['C6', 'A5', 'F5', 'A5', 'C6', 'D6', 'C6', 'A5'])] + [(k * .64, 'harp', p, 2, .3, -.3) for k, p in enumerate(['F3', 'C4', 'A4', 'F4', 'A#3', 'D4'])], t, .75)
@cue('fanfare')
def _(t): score([(0, 'horn', 'C4', .4, .4, -.2), (.4, 'horn', 'F4', .4, .45, -.2), (.8, 'horn', 'A4', 1.6, .45, -.2), (.8, 'glockenspiel', 'A6', 1.5, .4, .3), (.8, 'timpani', 'C3', 1.5, .3, 0), (0, 'harp', 'F3', 2, .3, .3), (.2, 'harp', 'C4', 2, .3, .3), (.4, 'harp', 'F4', 2, .3, .3)], t, .7)
@cue('fanfare_small')
def _(t): score([(0, 'horn', 'F4', .3, .4, -.2), (.3, 'horn', 'A4', .3, .4, -.2), (.6, 'horn', 'C5', 1.4, .45, -.2), (.6, 'glockenspiel', 'C7', 1.5, .4, .3)], t, .7)
@cue('mus_gifts')
def _(t): score([(k * .3, 'violins_pizz', p, .3, .45, .2) for k, p in enumerate(['F4', 'A4', 'C5', 'A4', 'G4', 'A#4', 'D5', 'A#4', 'A4', 'C5', 'F5', 'C5'])] + [(k * 1.2, 'cellos_pizz', p, .4, .5, -.2) for k, p in enumerate(['F2', 'C3', 'F2'])] + [(3.6, 'glockenspiel', 'F6', 1.5, .35, .3)], t, .65)
@cue('mus_village')
def _(t): score([(k * .28, 'flute_stac', p, .25, .4, .2) for k, p in enumerate(['G5', 'C6', 'E6', 'C6', 'D6', 'B5', 'G5', 'C6'])] + [(k * .56, 'violins_pizz', p, .3, .4, -.2) for k, p in enumerate(['C4', 'G4', 'E4', 'G4'])], t, .6)
@cue('mus_comic')
def _(t): score([(k * .13, 'violins_pizz', S.name(60 + k), .2, .35 + k * .02, .2) for k in range(12)] + [(1.56, 'timpani', 'F2', .4, .3, 0)], t, .6)
@cue('mus_carriage')
def _(t):
    ev = [(0, 'violins', 'F4', 3.0, .3, -.2), (0, 'violas', 'A3', 3.0, .3, .1), (0, 'cellos', 'F2', 3.0, .3, .2), (3.0, 'violins', 'G4', 3.0, .3, -.2), (3.0, 'violas', 'C4', 3.0, .3, .1), (3.0, 'cellos', 'C3', 3.0, .3, .2)]
    ev += [(.4, 'horn', 'C4', 1.2, .35, -.3), (1.6, 'horn', 'F4', 1.4, .35, -.3), (3.4, 'horn', 'E4', 2.2, .33, -.3)]
    ev += [(k * .5, 'harp', p, 2, .28, .35) for k, p in enumerate(['F3', 'C4', 'F4', 'A4', 'C4', 'E4', 'G4', 'C5', 'E4', 'G4', 'C5', 'E5'])]
    score(ev, t, .6)
@cue('mus_carriage2')
def _(t): score([(k * .45, 'harp', p, 2, .3, .3) for k, p in enumerate(['C4', 'E4', 'G4', 'C5', 'A3', 'C4', 'F4', 'A4'])] + [(0, 'clarinet', 'E5', 1.3, .3, -.2), (1.35, 'clarinet', 'G5', 1.3, .3, -.2), (2.7, 'clarinet', 'F5', 1.8, .3, -.2)], t, .6)
@cue('mus_princess')
def _(t): score([(k * .06, 'harp', S.name(60 + [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 24][k]), 2, .35, .3) for k in range(14)] + [(.9, 'glockenspiel', 'C7', 1.5, .35, -.2), (1.2, 'glockenspiel', 'A6', 1.5, .3, -.2)], t, .6)
@cue('mus_cookies')
def _(t):
    bt = 60 / 120; ev = []; mel = ['C5', 'E5', 'G5', 'E5', 'F5', 'A5', 'G5', 'E5', 'D5', 'F5', 'E5', 'C5', 'D5', 'B4', 'C5', 'G4']
    for k in range(16):
        ev.append((k * bt, 'clarinet_stac', mel[k], .25, .4, -.2))
        ev.append((k * bt, 'violins_pizz' if k % 2 else 'cellos_pizz', ['C3', 'G3', 'F3', 'G3'][k // 4 % 4] if k % 2 == 0 else ['E4', 'D4', 'C4', 'B3'][k // 4 % 4], .3, .45, .2))
    ev.append((7.5, 'glockenspiel', 'C7', 1.5, .35, .3))
    score(ev, t, .6)
@cue('mus_sneaky')
def _(t):
    bt = 60 / 96; ev = []
    for k, p in enumerate(['D3', 'F3', 'A3', 'G#3', 'A3', 'F3', 'D3', 'E3', 'F3', 'D3']): ev.append((k * bt, 'bassoon_stac', p, .3, .45, -.1))
    for k, p in enumerate(['D2', 'A2', 'D2', 'A2', 'D2']): ev.append((k * bt * 2, 'cellos_pizz', p, .4, .45, .2))
    ev.append((k * bt * 2 + bt, 'timpani', 'F2', 1, .25, 0))
    score(ev, t, .6)
@cue('mus_clear')
def _(t):
    ev = [(0, 'violins', 'A4', 4, .25, -.2), (0, 'violas', 'F4', 4, .25, .1), (0, 'cellos', 'F3', 4, .25, .2), (4, 'violins', 'C5', 4, .3, -.2), (4, 'violas', 'G4', 4, .28, .1), (4, 'cellos', 'C3', 4, .28, .2)]
    ev += [(k * .1, 'harp', S.name(53 + [0, 4, 7, 12, 16, 19, 24, 28][k % 8]), 2.5, .35, .3) for k in range(8)]
    for b, p, d in MEL[:5]: ev.append((1.5 + b * B * 1.1, 'glockenspiel', S.name(S.midi(p) + 12), d * B + .5, .4, .2))
    score(ev, t, .65)
@cue('tune_laugh')
def _(t):
    ev = [(b * B * .9, 'violins_pizz', p, .4, .5, .2) for b, p, d in MEL[:8]] + [(b * B * .9, 'glockenspiel', S.name(S.midi(p) + 12), .8, .35, -.2) for b, p, d in MEL[:8]]
    ev += [(0, 'cellos_pizz', 'F2', .5, .5, 0), (3 * B * .9, 'cellos_pizz', 'D2', .5, .5, 0), (6 * B * .9, 'cellos_pizz', 'A#1', .5, .5, 0)]
    score(ev, t, .6)
@cue('mus_yes')
def _(t): score([(k * .07, 'glockenspiel', S.name(77 + [0, 4, 7, 12, 16, 19][k]), 1.5, .4, .2) for k in range(6)] + [(k * .05, 'harp', S.name(53 + [0, 4, 7, 12, 16, 19, 24][k]), 2.5, .4, -.3) for k in range(7)] + [(.4, 'violins', 'F5', 2.5, .3, 0), (.4, 'cellos', 'F3', 2.5, .3, 0)], t, .7)
@cue('tune_tender')
def _(t):
    mb([(b * B * 1.5, p, .55, .1) for b, p, d in MEL], t, .9)
    score([(i * 3 * B * 1.5 + k * .3, 'harp', p, 3, .28, -.3) for i, (bass, arp) in enumerate(HARM) for k, p in enumerate(arp[:4])], t, .7)
@cue('tune_moral')
def _(t):
    ev = []
    for b, p, d in MEL: ev.append((b * B * 1.4, 'clarinet', p, d * B * 1.4, .38, -.15)); ev.append((b * B * 1.4, 'upright', S.name(S.midi(p) - 12), d * B * 1.4, .3, .1))
    for i, (bass, arp) in enumerate(HARM):
        bt = i * 3 * B * 1.4
        ev.append((bt, 'cellos', S.name(S.midi(bass) + 12), 3 * B * 1.4 + (3 if i == 4 else .2), .25, .2)); ev.append((bt, 'violins', arp[-1], 3 * B * 1.4 + (3 if i == 4 else .2), .22, -.2))
        for k, p in enumerate(arp): ev.append((bt + k * .25, 'harp', p, 2.5, .3, .35))
    score(ev, t, .85)

for e in TL['ev']:
    f = CUE.get(e['type'])
    if f: f(e['t']); print('cue', e['type'], round(e['t'], 2))
out = os.path.join(ROOT, 'out/music.wav'); sf.write(out, mus[:int(DUR * SR)], SR, subtype='FLOAT')
json.dump(sorted(used), open(os.path.join(ROOT, 'out/instruments_used.json'), 'w'))
print('music →', out, 'instruments:', sorted(used))
