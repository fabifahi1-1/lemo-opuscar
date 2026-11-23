"""Music + effects for a span of the film (no voice).  usage: python mix.py FROM TO  -> out/mix_FROM-TO.wav (stereo 48 kHz, 24-bit)
Loudness targets (the director's sound notes), measured with the ITU-R BS.1770 K-weighting:
  about -30 LUFS under every narration line; fuller (about -24 LUFS) in the opening, the end screen and the pauses between lines;
  true peak never above -6 dBTP. The mix is levelled region by region with smooth 150 ms crossfades, then limited (4x oversampled)."""
import sys, json, numpy as np, soundfile as sf
from scipy.signal import lfilter, resample_poly
from scipy.ndimage import minimum_filter1d
sys.path.insert(0, '/home/user/lemo-opuscar'); sys.path.insert(0, '/home/user/lemo-opuscar/film/audio')
from core.audio import sampler as S
from core.audio.sfx import SR, add
import foley as F
A, B = float(sys.argv[1]), float(sys.argv[2]); D = B - A; N = int(round(D * SR))
S.seed(3)
from score import score, TL, SH
import cues
T_LINE, T_OPEN, T_GAP, TP_MAX = -30.0, -24.3, -25.5, -6.0
END_T0 = SH['end']['t0']

def stereo(): return np.zeros((N, 2), np.float32)
def put(buf, x, t, g=1.0, pan=0.0):
    x = np.asarray(x, np.float32)
    if t >= B or t + len(x) / SR <= A: return
    if t < A: x = x[int((A - t) * SR):]; t = A
    add(buf, x, t - A, g, pan)

# ---------------- music ----------------
mus = stereo()
for e in sorted(score(), key=lambda e: e['t']):
    if e['t'] >= B or e['t'] + e['dur'] + 3 < A: continue
    x = S.note(e['inst'], e['pitch'], e['dur'], vel=e['vel'], attack=e['attack']) if e['pitch'] else S.hit(e['inst'], None, vel=e['vel'], dur=e['dur'])
    put(mus, x, e['t'], e['g'], e['pan'])
# ---------------- effects and ambience ----------------
fxb = stereo()
for t, mk, g, pan in sorted(cues.FX, key=lambda z: z[0]):
    if t >= B or t + 12 < A: continue
    put(fxb, mk(), t, g, pan)
rng = np.random.default_rng(17)
def bed_sound(kind, d):
    if kind == 'river': return F.river(d)
    if kind == 'riverUp': return F.river(d)
    if kind == 'room': return F.room(d, 1.0)
    if kind == 'crowd': return F.crowd(d)
    if kind == 'wind': return F.wind(d)
    if kind == 'crickets': return F.crickets(d)
    if kind == 'candle': return F.candle(d)
    if kind == 'wheels': return F.wheels(d)
    if kind == 'hooves': return F.hooves(d)
    if kind == 'flags': return F.flags(d)
    if kind == 'birds':
        out = np.zeros(int(d * SR) + SR)
        for tt in np.sort(rng.uniform(0, d, max(1, int(d / 2.2)))): b = F.bird(rng.uniform(2600, 4200), int(rng.integers(2, 4))) * .12; i = int(tt * SR); out[i:i + len(b)] += b[:len(out) - i]
        return out[:int(d * SR)]
    raise ValueError(kind)
for t0, t1, kind, g, fi, fo in cues.BEDS:
    a, b = max(t0, A - .5), min(t1, B + .5)
    if b <= a: continue
    x = F.fade(bed_sound(kind, b - a), min(fi, (b - a) / 3) if a == t0 else 0, min(fo, (b - a) / 3) if b == t1 else 0)
    put(fxb, x, a, g, 0)
mix = mus + fxb

# ---------------- loudness: K-weighted, region by region ----------------
def kw(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, .73248077421585]
    b2, a2 = [1., -2., 1.], [1, -1.99004745483398, .99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)
def lufs(x):
    if len(x) < SR * .1: return -99.
    y = kw(x.astype(np.float64)); return -.691 + 10 * np.log10(max(1e-12, (y ** 2).mean(axis=0).sum()))
regs = []; first = TL['first_line_at']
if A < first: regs.append((A, min(B, first - .25), T_OPEN))
lines = [l for l in TL['lines'] if l['end'] > A and l['start'] < B]
prev = max(A, first - .25)
for l in lines:
    a, b = max(A, l['start'] - .1), min(B, l['end'] + .1)
    if a - prev > .25: regs.append((prev, a, T_OPEN if prev >= END_T0 - .01 else T_GAP))
    regs.append((a, b, T_LINE)); prev = b
if B - prev > .05:
    if prev < END_T0 < B: regs.append((prev, END_T0, T_GAP)); regs.append((END_T0, B, T_OPEN - .8))
    else: regs.append((prev, B, T_OPEN - .8 if prev >= END_T0 - .01 else T_GAP))
def peaks4(x):   # 4x-oversampled peak per sample, in 20 s chunks (memory)
    out = np.empty(len(x)); C = SR * 20
    for i in range(0, len(x), C):
        j = min(len(x), i + C); lo = max(0, i - 64); y = np.abs(resample_poly(x[lo:j + 64].astype(np.float64), 4, 1, axis=0)).max(axis=1).reshape(-1, 4).max(axis=1)
        out[i:j] = y[i - lo:i - lo + (j - i)]
    return out
def limiter(x, ceil_db=-9.0):   # 3 dB below the -6 dBTP limit: AAC encoding adds up to ~2 dB of overshoot
    """look-ahead peak limiter on the 4x-oversampled peak; 5 ms look-ahead, 120 ms release (computed on 1 ms blocks)"""
    ceil = 10 ** (ceil_db / 20); need = np.minimum(1.0, ceil / np.maximum(peaks4(x), 1e-9))
    g = minimum_filter1d(need, size=2 * int(.005 * SR) + 1); blk = 48; nb = (len(g) + blk - 1) // blk
    gb = np.pad(g, (0, nb * blk - len(g)), constant_values=1).reshape(nb, blk).min(axis=1)
    rel = np.exp(-blk / (.12 * SR)); out = np.empty(nb); cur = 1.0
    for i in range(nb): v = gb[i]; cur = v if v < cur else v + (cur - v) * rel; out[i] = cur
    env = np.minimum(g, np.repeat(out, blk)[:len(g)])
    return (x * env[:, None]).astype(np.float32)
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
# momentary cap: no 400 ms window anywhere above -20.5 LUFS (the brief's limit is -20 momentary)
def mcap(x, lim=-20.5):
    y = kw(x.astype(np.float64)); p = (y ** 2).sum(axis=1); w = int(.4 * SR)
    ms = np.convolve(p, np.ones(w) / w, mode='same'); M = -.691 + 10 * np.log10(ms + 1e-12)
    g = np.minimum(1.0, 10 ** ((lim - M) / 20)); g = minimum_filter1d(g, size=w)
    k = int(.1 * SR); g = np.convolve(np.pad(g, (k, k), mode='edge'), np.ones(2 * k + 1) / (2 * k + 1), mode='valid')[:len(x)]
    return (x * np.minimum(1.0, g)[:, None]).astype(np.float32)
for _ in range(2): mix = mcap(mix)
mix = limiter(mix)
tp = 20 * np.log10(peaks4(mix).max() + 1e-12)
out = f'/home/user/lemo-opuscar/film/out/mix_{A:g}-{B:g}.wav'
sf.write(out, mix, SR, subtype='PCM_24')
rep = [(round(float(a), 2), round(float(b), 2), tgt, round(float(lufs(mix[int((a - A) * SR):int((b - A) * SR)])), 1)) for a, b, tgt in regs]
print('true peak', round(tp, 1), 'dBTP')
for r in rep[:12]: print('region', r)
print('regions', len(rep), 'max dev', max(abs(r[3] - r[2]) for r in rep if r[1] - r[0] > .4))
json.dump({'regions': rep, 'true_peak': float(tp)}, open(out.replace('.wav', '.json'), 'w'))
