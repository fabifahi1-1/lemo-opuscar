"""Music + effects for a span of the film (no voice). usage: python mix.py FROM TO  -> out/mix_FROM-TO.wav (stereo 48k)
Music ducks hard under every voice slot (data/timing.json) so the voiceover recorded later is the loudest thing."""
import sys, json, numpy as np, soundfile as sf
sys.path.insert(0, '/home/user/lemo-opuscar'); sys.path.insert(0, '/home/user/lemo-opuscar/film/audio')
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit
import foley as F
A, B = float(sys.argv[1]), float(sys.argv[2]); D = B - A; N = int(D * SR)
TL = json.load(open('/home/user/lemo-opuscar/film/data/timing.json'))
S.seed(3)

def stereo(): return np.zeros((N, 2), np.float32)
def put(buf, x, t, g=1.0, pan=0.0):
    if t >= B or t + len(x) / SR <= A: return
    add(buf, x.astype(np.float32), t - A, g, pan)

# ---------------- music (G major, 84 bpm) ----------------
BEAT = 60 / 84; BAR = BEAT * 4
def score():
    ev = []
    arp = {'G': ['G3', 'B3', 'D4', 'G4', 'D4', 'B3', 'D4', 'B3'], 'D': ['D3', 'A3', 'D4', 'F#4', 'D4', 'A3', 'D4', 'A3'], 'Em': ['E3', 'B3', 'E4', 'G4', 'E4', 'B3', 'E4', 'B3'], 'C': ['C3', 'G3', 'C4', 'E4', 'C4', 'G3', 'C4', 'G3'], 'Am': ['A2', 'E3', 'A3', 'C4', 'A3', 'E3', 'A3', 'E3']}
    prog = ['G', 'D', 'Em', 'C']
    # title (0-8 s): melody on glockenspiel, felt-piano arpeggio, a string pad
    mel = [(0, 'B4', 1), (1, 'D5', 1), (2, 'G5', 2), (4, 'F#5', 1), (5, 'E5', 1), (6, 'D5', 2), (8, 'E5', 1), (9, 'D5', 1), (10, 'B4', 2), (12, 'C5', 1), (13, 'E5', 1), (14, 'G5', 2)]
    for b, p, d in mel: ev.append(dict(t=.4 + b * BEAT, inst='glockenspiel', pitch=p, dur=d * BEAT, vel=.5, pan=.1, gain=.8))
    for bar in range(4):
        c = prog[bar]
        for i, p in enumerate(arp[c]):
            tt = .2 + bar * BAR + i * BEAT / 2
            vel = .34 if tt < 8 else .16
            ev.append(dict(t=tt, inst='upright', pitch=p, dur=BEAT / 2, vel=vel, pan=-.2 + (i % 4) * .1, gain=.9))
    ev.append(dict(t=.2, inst='violas', pitch='G3', dur=8.2, vel=.34, attack=.9, pan=-.15)); ev.append(dict(t=1.0, inst='violins', pitch='D4', dur=7.4, vel=.26, attack=1.2, pan=.2))
    ev.append(dict(t=5.2, inst='violins', pitch='B4', dur=3.2, vel=.3, attack=1.2, pan=.25))
    # hook (8-13.9): sparse felt piano and a low pad
    for tt, p in [(8.1, 'G3'), (9.5, 'D4'), (10.9, 'B3'), (12.3, 'E4'), (13.2, 'D4')]: ev.append(dict(t=tt, inst='upright', pitch=p, dur=1.4, vel=.2, pan=-.1, gain=.9))
    ev.append(dict(t=8.4, inst='cellos', pitch='G2', dur=5.4, vel=.26, attack=1.0, pan=-.2)); ev.append(dict(t=9.0, inst='violins', pitch='D4', dur=5.0, vel=.2, attack=1.4, pan=.2))
    # L002: a single plucked note, then a soft pad on Am
    ev.append(dict(t=13.9, inst='violas_pizz', pitch='A3', dur=1.5, vel=.55, pan=0))
    ev.append(dict(t=14.4, inst='cellos', pitch='A2', dur=5.4, vel=.24, attack=.8, pan=-.2)); ev.append(dict(t=14.9, inst='violas', pitch='E4', dur=4.8, vel=.2, attack=1.2, pan=.2))
    # mill (19.8-): a flute line over a light arpeggio on C then G
    for i, p in enumerate(arp['C'] * 2 + arp['G'] * 2):
        tt = 19.9 + i * BEAT / 2
        if tt < 40: ev.append(dict(t=tt, inst='upright', pitch=p, dur=BEAT / 2, vel=.16, pan=-.2 + (i % 4) * .1, gain=.9))
    for tt, p, d in [(20.0, 'E5', 1.4), (21.5, 'D5', 1.2), (22.9, 'G5', 2.2), (25.3, 'E5', 1.4)]: ev.append(dict(t=tt, inst='flute', pitch=p, dur=d, vel=.3, attack=.12, pan=.15))
    ev.append(dict(t=19.8, inst='cellos', pitch='C3', dur=6.0, vel=.24, attack=.8, pan=-.2))
    return ev
ev = score(); mus = stereo()
for e in ev:
    if e['t'] >= B or e['t'] + e['dur'] < A: continue
    try: x = S.note(e['inst'], e['pitch'], e['dur'], vel=e.get('vel', .6), attack=e.get('attack', 0))
    except Exception as ex: print('skip', e['inst'], e['pitch'], ex); continue
    put(mus, x, e['t'], e.get('gain', 1.0) * .7, e.get('pan', 0))
# ---------------- duck the music under every voice slot ----------------
tt = A + np.arange(N) / SR; duck = np.ones(N)
for l in TL['lines']:
    a, b = l['start'] - .12, l['end'] + .15
    duck[(tt >= a) & (tt <= b)] = 0.15
duck[(tt >= A) & (tt < TL['first_line_at'] - .3)] = np.maximum(duck[(tt < TL['first_line_at'] - .3)], 1.0)
gaps = (tt >= TL['first_line_at']) & (duck >= 1)
duck[gaps] = 0.42
k = int(.14 * SR); duck = np.convolve(np.pad(duck, (k, k), mode='edge'), np.ones(2 * k + 1) / (2 * k + 1), mode='valid')[:N]
mus *= duck[:, None].astype(np.float32)
# ---------------- effects ----------------
fx = stereo()
put(fx, F.fade(F.candle(8.6), .4, 1.2), 0, 1.0, 0)
put(fx, F.page_flip(.85), 2.78, .9, .15); put(fx, F.rustle(.9, .8), 3.6, .5, -.2)
for tt_, p, v in [(4.1, 'G5', .5), (4.35, 'D6', .45), (4.6, 'B5', .45), (4.85, 'G6', .5)]:
    try: put(fx, S.note('glockenspiel', p, .8, vel=v), tt_, .6, .2)
    except Exception as ex: print('chime skip', ex)
try: put(fx, S.note('hand_chimes', 'G6', 3.0, vel=.5), 5.0, .5, 0)
except Exception as ex: print('chime skip', ex)
put(fx, F.air(2.6, 1.0), 5.3, .7, 0)
put(fx, F.fade(F.river(D + 2), 1.5, 1.0), 6.3, 1.0, 0)
for i in range(14): put(fx, F.creak_wood(.2 + .1 * (i % 3)), 6.6 + i * 1.9, .5, -.35)
for tt_ in np.sort(np.random.default_rng(4).uniform(6.8, 25, 11)): put(fx, F.bird(np.random.default_rng(int(tt_ * 10)).uniform(2600, 4200), 2 + int(tt_) % 2), tt_, .16, np.random.default_rng(int(tt_ * 7)).uniform(-.6, .6))
put(fx, F.room(6.0, 1.0), 8.0, 1.0, 0)
put(fx, F.tick(1.0), 20.7, .5, -.2); put(fx, F.rustle(.5, .5), 20.55, .4, -.2)
put(fx, F.fade(F.stones(4.0), .4, .5), 22.6, .8, .2)
# effects: softer under the voice, too
fduck = np.where(duck < .5, .7, 1.0); fx *= fduck[:, None].astype(np.float32)
mix = mus * 1.0 + fx * 1.0
pk = np.abs(mix).max(); mix = mix * (10 ** (-7 / 20) / pk) if pk > 0 else mix
sf.write(f'/home/user/lemo-opuscar/film/out/mix_{A:g}-{B:g}.wav', mix, SR)
print('mix', mix.shape, 'peak', round(20 * np.log10(np.abs(mix).max()), 1), 'dB', 'rms', round(20 * np.log10(np.sqrt((mix ** 2).mean())), 1))
