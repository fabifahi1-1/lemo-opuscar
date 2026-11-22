"""Music + effects for a span of the film (no voice).  usage: python mix.py FROM TO  -> out/mix_FROM-TO.wav (stereo 48 kHz, 24-bit)
Loudness targets (director's note 5), measured with the ITU-R BS.1770 K-weighting:
  about -30 LUFS under every narration line; up to -21 LUFS in the opening (before the first line) and in pauses;
  true peak never above -6 dBTP.  The mix is levelled region by region with smooth 150 ms crossfades, then checked."""
import sys, json, numpy as np, soundfile as sf
from scipy.signal import lfilter, resample_poly
sys.path.insert(0, '/home/user/lemo-opuscar'); sys.path.insert(0, '/home/user/lemo-opuscar/film/audio')
from core.audio import sampler as S
from core.audio.sfx import SR, add
import foley as F
A, B = float(sys.argv[1]), float(sys.argv[2]); D = B - A; N = int(round(D * SR))
TL = json.load(open('/home/user/lemo-opuscar/film/data/timing.json'))
S.seed(3)
T_LINE, T_OPEN, T_GAP, TP_MAX = -30.0, -23.6, -25.5, -6.0

def stereo(): return np.zeros((N, 2), np.float32)
def put(buf, x, t, g=1.0, pan=0.0):
    if t >= B or t + len(x) / SR <= A: return
    if t < A: x = x[int((A - t) * SR):]; t = A
    add(buf, np.asarray(x, np.float32), t - A, g, pan)

# ---------------- music: G major, 84 bpm, felt piano, glockenspiel, strings, harp, flute ----------------
BEAT = 60 / 84; BAR = BEAT * 4
arp = {'G': ['G3', 'B3', 'D4', 'G4', 'D4', 'B3', 'D4', 'B3'], 'D': ['D3', 'A3', 'D4', 'F#4', 'D4', 'A3', 'D4', 'A3'], 'Em': ['E3', 'B3', 'E4', 'G4', 'E4', 'B3', 'E4', 'B3'], 'C': ['C3', 'G3', 'C4', 'E4', 'C4', 'G3', 'C4', 'G3']}
ev = []
mel = [(0, 'B4', 1), (1, 'D5', 1), (2, 'G5', 2), (4, 'F#5', 1), (5, 'E5', 1), (6, 'D5', 2), (8, 'E5', 1), (9, 'D5', 1), (10, 'B4', 2)]
for b, p, d in mel: ev.append(dict(t=.35 + b * BEAT, inst='glockenspiel', pitch=p, dur=d * BEAT, vel=.5, pan=.1))
for bar, c in enumerate(['G', 'D', 'Em']):
    for i, p in enumerate(arp[c]): ev.append(dict(t=.2 + bar * BAR + i * BEAT / 2, inst='upright', pitch=p, dur=BEAT / 2, vel=.32, pan=-.2 + (i % 4) * .1))
ev += [dict(t=.2, inst='violas', pitch='G3', dur=8.0, vel=.32, attack=.9, pan=-.15), dict(t=1.0, inst='violins', pitch='D4', dur=7.2, vel=.26, attack=1.2, pan=.2), dict(t=6.0, inst='violins', pitch='B4', dur=2.2, vel=.3, attack=.6, pan=.25)]
# hook and the worried look: low strings, a few soft piano notes
ev += [dict(t=8.1, inst='cellos', pitch='G2', dur=3.6, vel=.26, attack=1.0, pan=-.2), dict(t=8.6, inst='violins', pitch='D4', dur=3.2, vel=.2, attack=1.4, pan=.2)]
for tt, p in [(8.1, 'G3'), (9.5, 'D4'), (10.9, 'B3')]: ev.append(dict(t=tt, inst='upright', pitch=p, dur=1.4, vel=.2, pan=-.1))
ev += [dict(t=11.5, inst='cellos', pitch='E2', dur=2.5, vel=.26, attack=.6, pan=-.2), dict(t=11.55, inst='upright', pitch='E4', dur=1.6, vel=.22), dict(t=12.7, inst='upright', pitch='G3', dur=1.3, vel=.18)]
# the focus pull: a harp note as the cat comes sharp; then the turn and the smile: a plucked note and warm strings
ev += [dict(t=13.95, inst='violas', pitch='E3', dur=3.6, vel=.2, attack=1.0, pan=-.1), dict(t=16.0, inst='harp', pitch='E5', dur=2.0, vel=.45, pan=.3), dict(t=16.45, inst='harp', pitch='B5', dur=1.6, vel=.35, pan=.35)]
ev += [dict(t=18.47, inst='violas_pizz', pitch='G3', dur=1.5, vel=.55, pan=.2), dict(t=18.5, inst='violins', pitch='G4', dur=1.3, vel=.22, attack=.5, pan=.2), dict(t=18.5, inst='cellos', pitch='C3', dur=1.3, vel=.22, attack=.5, pan=-.2)]
# the mill: a flute line over a light arpeggio
for i, p in enumerate(arp['C'] * 2 + arp['G'] * 2): ev.append(dict(t=19.9 + i * BEAT / 2, inst='upright', pitch=p, dur=BEAT / 2, vel=.16, pan=-.2 + (i % 4) * .1))
ev += [dict(t=tt, inst='flute', pitch=p, dur=d, vel=.3, attack=.12, pan=.15) for tt, p, d in [(20.0, 'E5', 1.4), (21.5, 'D5', 1.2), (22.9, 'G5', 2.2), (25.3, 'E5', 1.4)]]
ev.append(dict(t=19.8, inst='cellos', pitch='C3', dur=6.0, vel=.24, attack=.8, pan=-.2))
mus = stereo()
for e in ev:
    if e['t'] >= B or e['t'] + e['dur'] < A: continue
    x = S.note(e['inst'], e['pitch'], e['dur'], vel=e.get('vel', .6), attack=e.get('attack', 0))
    put(mus, x, e['t'], .7, e.get('pan', 0))

# ---------------- effects (all made here) ----------------
fx = stereo()
put(fx, F.fade(F.candle(6.4), .4, 1.0), 0, 1.0, -.2)
put(fx, F.page_flip(.85), 2.35, .22, .15); put(fx, F.rustle(.8, .7), 3.0, .15, -.2)
for k, (tt, p) in enumerate([(3.45, 'G5'), (3.7, 'D6'), (3.95, 'B5'), (4.2, 'G6')]): put(fx, S.note('glockenspiel', p, .8, vel=.4), tt, .35, .2)
for i in range(26): put(fx, F.tick(.35), 4.4 + i * .046, .35, -.3 + .024 * i)      # the credit line's letters
put(fx, F.air(2.2, 1.0), 5.9, .8, 0)
put(fx, F.fade(F.river(D + 2), 1.5, 1.0), 7.0, .55, 0)                              # the river beside the mill, low on the steps
put(fx, F.room(12.0, 1.0), 8.0, 1.0, 0)
for tt in np.sort(np.random.default_rng(4).uniform(8, 25, 9)): put(fx, F.bird(np.random.default_rng(int(tt * 10)).uniform(2600, 4200), 2), tt, .12, np.random.default_rng(int(tt * 7)).uniform(-.6, .6))
put(fx, F.rustle(.9, .5), 9.9, .4, -.1)                                            # the thumb rubs the crust
put(fx, F.sigh(1.3), 11.95, .7, -.1)                                               # Tom's small sigh
for k in range(3): put(fx, F.sniff(), 14.35 + k * .17, .5, .3)                      # the cat sniffs
put(fx, F.fade(F.river(8), .6, .6), 19.79, 1.0, 0)                                  # the mill wide: the river comes up
for i in range(4): put(fx, F.creak_wood(.3 + .1 * (i % 2)), 20.2 + i * 1.6, .55, -.3)
put(fx, F.splashes(6.0), 19.9, .9, -.2)
put(fx, F.tick(1.0), 20.5, .4, -.3); put(fx, F.rustle(.45, .5), 20.45, .35, -.3)   # the label
put(fx, F.fade(F.stones(3.0), .4, .5), 22.6, .7, .2)
mix = mus + fx

# ---------------- loudness: K-weighted, region by region ----------------
def kw(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, .73248077421585]
    b2, a2 = [1., -2., 1.], [1, -1.99004745483398, .99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)
def lufs(x):
    if len(x) < SR * .1: return -99.
    y = kw(x.astype(np.float64)); return -.691 + 10 * np.log10(max(1e-12, (y ** 2).mean(axis=0).sum()))
# regions: (t0, t1, target)
regs = []
first = TL['first_line_at']
if A < first: regs.append((A, min(B, first - .25), T_OPEN))
lines = [l for l in TL['lines'] if l['end'] > A and l['start'] < B]
prev = first - .25
for l in lines:
    a, b = max(A, l['start'] - .1), min(B, l['end'] + .1)
    if a - prev > .25: regs.append((prev, a, T_GAP))
    regs.append((a, b, T_LINE)); prev = b
if B - prev > .05: regs.append((prev, B, T_GAP))
def limiter(x, ceil_db=-9.0):   # 3 dB below the -6 dBTP limit: AAC encoding adds up to ~2 dB of overshoot
    """look-ahead peak limiter on the 4x-oversampled peak; 5 ms attack, 120 ms release"""
    ceil = 10 ** (ceil_db / 20); pk = np.abs(resample_poly(x, 4, 1, axis=0)).max(axis=1).reshape(-1, 4).max(axis=1)[:len(x)]
    need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9)); la = int(.005 * SR)
    from scipy.ndimage import minimum_filter1d
    g = minimum_filter1d(need, size=2 * la + 1)                     # look ahead and behind
    rel = np.exp(-1 / (.12 * SR)); out = np.empty_like(g); cur = 1.0
    for i in range(len(g)):
        cur = g[i] if g[i] < cur else g[i] + (cur - g[i]) * rel
        out[i] = cur
    return (x * out[:, None]).astype(np.float32)
env = np.ones(N)
for it in range(4):
    cur = limiter(mix * env[:, None])
    step = np.ones(N)
    for a, b, tgt in regs:
        i0, i1 = int((a - A) * SR), int((b - A) * SR); L = lufs(cur[i0:i1])
        if L > -90: step[i0:i1] *= 10 ** ((tgt - L) / 20)
    k = int(.15 * SR); sm = np.convolve(np.pad(step, (k, k), mode='edge'), np.ones(2 * k + 1) / (2 * k + 1), mode='valid')[:N]
    env = env * sm
mix = limiter(mix * env[:, None])
tp = 20 * np.log10(np.abs(resample_poly(mix, 4, 1, axis=0)).max() + 1e-12)
out = f'/home/user/lemo-opuscar/film/out/mix_{A:g}-{B:g}.wav'
sf.write(out, mix, SR, subtype='PCM_24')
rep = [(round(float(a), 2), round(float(b), 2), tgt, round(float(lufs(mix[int((a - A) * SR):int((b - A) * SR)])), 1)) for a, b, tgt in regs]
print('true peak', round(tp, 1), 'dBTP')
for r in rep: print('region', r)
json.dump({'regions': rep, 'true_peak': float(tp)}, open(out.replace('.wav', '.json'), 'w'))
