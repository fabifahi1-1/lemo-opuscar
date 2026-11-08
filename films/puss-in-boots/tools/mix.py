"""Mix: narration + score (ducked) + procedural foley + ambience beds → out/mix.wav (48 kHz stereo).
Every sound effect here is synthesized in code (numpy/scipy) or played from CC0 samples; nothing is downloaded.
Reads out/timeline.json (events, shots), script/vtime.json (line times), voices/*.wav, out/music.wav.
"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
LIB = os.environ.get('LIB') or os.path.dirname(os.path.dirname(ROOT)); sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, compress, limit

rng = np.random.default_rng(11)
TL = json.load(open(os.path.join(ROOT, 'out/timeline.json'))); VT = json.load(open(os.path.join(ROOT, 'script/vtime.json')))
DUR = TL['dur']; N = int(DUR * SR)
t_ = lambda d: np.arange(int(d * SR)) / SR
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def nz(d): return rng.standard_normal(int(d * SR))
def env(d, a=.005, r=.1, curve=1.0):
    t = t_(d); e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(r, 1e-4)); return e ** curve
def norm(x, p=1.0): m = np.abs(x).max(); return x * p / m if m > 0 else x
def tone(f, d, wave='sine'):
    t = t_(d); ph = 2 * np.pi * np.cumsum(np.broadcast_to(f, t.shape) if np.ndim(f) else np.full(len(t), f)) / SR
    return np.sin(ph) if wave == 'sine' else (np.sin(ph) + .3 * np.sin(2 * ph) + .15 * np.sin(3 * ph))
def put(buf, x, at, g=1.0, pan=0.0):
    if x.ndim == 1: x = np.stack([x * np.sqrt((1 - pan) / 2) * 1.414, x * np.sqrt((1 + pan) / 2) * 1.414], 1)
    s = int(round(at * SR)); s0 = max(0, -s); s = max(0, s); e = min(len(buf), s + len(x) - s0)
    if e > s: buf[s:e] += x[s0:s0 + e - s] * g

# ------------------------------------------------------------------ procedural foley (soft, cartoon-like)
def clop(p=1.0): x = bp(nz(.09), 700 * p, 2400 * p) * env(.09, .001, .025); x += tone(np.linspace(900 * p, 500 * p, int(.09 * SR)), .09) * env(.09, .001, .02) * .6; return norm(x, .8)
def knock(v=1.0, f=140):
    x = lp(nz(.25), 900) * env(.25, .001, .05) + tone(np.linspace(f * 1.3, f, int(.25 * SR)), .25) * env(.25, .002, .06) * 1.2; return norm(x, v)
def pop(p=1.0): return norm(tone(np.geomspace(500 * p, 1300 * p, int(.08 * SR)), .08) * env(.08, .002, .03), .7)
def ding(p=1.0, d=1.6):
    f = 1320 * p; x = sum(a * tone(f * m, d) * env(d, .001, d * k) for m, a, k in [(1, 1, .5), (2.76, .4, .2), (5.4, .2, .08)]); return norm(x, .7)
def splash():
    d = 1.4; x = hp(nz(d), 300) * env(d, .01, .35); x += lp(nz(d), 500) * env(d, .002, .08) * 2
    for k in range(14): put1 = int(rng.uniform(.25, 1.1) * SR); x[put1:put1 + 2000] += tone(rng.uniform(900, 2000), 2000 / SR) * env(2000 / SR, .001, .01) * .4
    return norm(lp(x, 6000), .9)
def swish(d=.35): x = bp(nz(d), 800, 4000) * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 2; return norm(x, .6)
def whoosh(d=.8): x = bp(nz(d), 300, 2500) * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 1.5; return norm(lp(x, 3000), .6)
def paper_turn(): d = .9; x = bp(nz(d), 1200, 6000) * (np.sin(np.linspace(0, np.pi, int(d * SR))) ** 3) * (1 + .5 * np.sin(t_(d) * 60)); return norm(x, .55)
def baa():
    d = .9; t = t_(d); f0 = 380 + 30 * np.sin(2 * np.pi * 7 * t) * np.minimum(1, t * 3) - 40 * t
    x = sum(np.sin(2 * np.pi * np.cumsum(f0 * h) / SR) / h for h in range(1, 12)); x = bp(x, 400, 3200) * (1 + .5 * np.sin(2 * np.pi * 22 * t)) * env(d, .05, .5)
    return norm(x, .7)
def creak():
    d = 1.6; t = t_(d); f = 140 + 90 * np.sin(np.pi * t / d) + 20 * np.sin(2 * np.pi * 3 * t); x = sum(np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h for h in range(1, 8))
    x *= (1 + .8 * np.sign(np.sin(2 * np.pi * 34 * t))) * .5; x = bp(x, 200, 2400) * np.sin(np.pi * t / d) ** .5; return norm(x, .55)
def roar_funny():
    d = 1.6; t = t_(d); f = 180 - 50 * t; x = sum(np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h ** .8 for h in range(1, 14)) * (1 + .6 * np.sin(2 * np.pi * 26 * t))
    x = lp(x, 1500) * env(d, .08, .7) + lp(nz(d), 800) * env(d, .05, .4) * .4
    x += tone(np.geomspace(500, 200, len(t)), d, 'buzz') * env(d, .1, .5) * .25   # a silly trombone-ish fall
    return norm(x, .75)
def eek(): d = .5; t = t_(d); f = 1800 + 900 * np.sin(np.pi * t / d) + 60 * np.sin(2 * np.pi * 30 * t); return norm(tone(f, d, 'buzz') * env(d, .02, .25), .5)
def slide_whistle(): d = 1.6; t = t_(d); f = np.geomspace(1600, 420, len(t)) * (1 + .01 * np.sin(2 * np.pi * 6 * t)); return norm(lp(tone(f, d), 4000) * np.minimum(1, t * 20) * np.minimum(1, (d - t) * 6), .55)
def poof(): d = 1.0; x = lp(nz(d), 1800) * env(d, .005, .2) + tone(np.geomspace(260, 90, int(d * SR)), d) * env(d, .002, .12) * .8; x += hp(nz(d), 4000) * env(d, .05, .3) * .15; return norm(x, .8)
def squeak(): d = .3; t = t_(d); f = 2400 + 900 * np.sin(np.pi * t / d); return norm(tone(f, d) * env(d, .01, .1), .5)
def jump(): d = .45; t = t_(d); return norm(tone(np.geomspace(300, 1100, len(t)), d) * env(d, .005, .2), .45)
def boing(): d = .6; t = t_(d); f = 220 * (1 + .25 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 4)); return norm(tone(f, d, 'buzz') * env(d, .003, .25), .5)
def tear(): d = .5; x = bp(nz(d), 1500, 6000) * (rng.random(int(d * SR)) < .3) * env(d, .01, .2); return norm(x + bp(nz(d), 400, 1500) * env(d, .01, .1) * .3, .5)
def crumbs(): d = .9; x = np.zeros(int(d * SR))
def nibble(): return norm(bp(nz(.12), 2000, 7000) * env(.12, .002, .03), .4)
def brush_sfx(d=1.4): x = bp(nz(d), 2000, 7000) * (np.sin(np.linspace(0, np.pi, int(d * SR))) ** 2) * (1 + .4 * np.sin(t_(d) * 2 * np.pi * 9)); return norm(x, .35)
def pen_tick(): return norm(bp(nz(.03), 3000, 9000) * env(.03, .001, .008), .3)
def rustle(d=1.2): x = bp(nz(d), 1500, 7000) * (np.abs(np.sin(t_(d) * 2 * np.pi * 3.5)) ** 2) * np.sin(np.linspace(0, np.pi, int(d * SR))); return norm(x, .5)
def step_boot(): return norm(lp(nz(.08), 1400) * env(.08, .002, .02) + tone(220, .08) * env(.08, .001, .02) * .5, .5)
def tiptoe(): return norm(bp(nz(.05), 1500, 5000) * env(.05, .001, .012), .3)
def twinkle():
    x = np.zeros(int(1.2 * SR))
    for k, f in enumerate([2093, 2637, 3136, 4186]): s = int(k * .07 * SR); y = tone(f, .8) * env(.8, .001, .25); x[s:s + len(y)] += y[:len(x) - s] * .5
    return norm(x, .4)
def shout_pop(): return norm(tone(np.geomspace(400, 900, int(.12 * SR)), .12) * env(.12, .002, .05), .4)
def rumble_tummy(): d = 1.2; t = t_(d); x = lp(tone(70 + 25 * np.sin(2 * np.pi * 3 * t), d, 'buzz'), 400) * np.sin(np.pi * t / d) * (1 + .6 * np.sin(2 * np.pi * 7 * t)); return norm(x, .6)
def brr(): d = 1.0; t = t_(d); x = tone(160 + 10 * np.sin(2 * np.pi * 30 * t), d, 'buzz') * (.5 + .5 * np.sign(np.sin(2 * np.pi * 24 * t))) * env(d, .02, .5); return norm(lp(x, 2000), .4)
def gulp(): d = .35; t = t_(d); return norm(tone(np.geomspace(500, 160, len(t)), d) * env(d, .01, .1), .45)
def whisper(d=1.4): return norm(bp(nz(d), 2500, 8000) * np.sin(np.linspace(0, np.pi, int(d * SR))) * (1 + .5 * np.sin(t_(d) * 2 * np.pi * 5)), .18)
def breath(): d = 1.3; return norm(bp(nz(d), 400, 3000) * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 2, .3)
def clap(): return norm(bp(nz(.06), 900, 4000) * env(.06, .001, .015), .5)
def purr(d=3.0): t = t_(d); x = lp(nz(d), 300) * (.5 + .5 * np.sin(2 * np.pi * 24 * t)) * np.sin(np.pi * t / d) ** .5; return norm(x, .35)
def whoa(): d = .8; t = t_(d); f = 600 - 200 * t; x = bp(sum(np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h for h in range(1, 8)), 400, 3000) * (1 + .4 * np.sin(2 * np.pi * 9 * t)) * env(d, .03, .3); return norm(x, .35)
def zoom(): d = .9; t = t_(d); return norm(tone(np.geomspace(1500, 600, len(t)), d) * env(d, .01, .35) * (1 + .5 * np.sin(2 * np.pi * 40 * t)), .35)
def crickets(d=2.4):
    x = np.zeros(int(d * SR))
    for k in range(int(d * 2.2)): s = int(k / 2.2 * SR); y = tone(4300, .12) * (np.sin(2 * np.pi * 30 * t_(.12)) > 0) * env(.12, .005, .05); x[s:s + len(y)] += y[:len(x) - s]
    return norm(x, .25)
def giggle(): x = np.zeros(int(1.0 * SR)); [x.__setitem__(slice(int(k * .14 * SR), int(k * .14 * SR) + int(.08 * SR)), bp(nz(.08), 800, 3000) * env(.08, .005, .03)) for k in range(5)]; return norm(x, .25)
def cheer(): d = 1.4; return norm(bp(nz(d), 500, 3500) * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 1.5 * (1 + .3 * np.sin(t_(d) * 2 * np.pi * 7)), .35)
def card_in(): return brush_sfx(.9)
def slip(): d = .6; t = t_(d); return norm(bp(nz(d), 1000, 5000) * env(d, .01, .15) + tone(np.geomspace(900, 1200, len(t)), d) * env(d, .01, .1) * .3, .4)
def storm_low(d=4): return norm(lp(nz(d), 120) * np.sin(np.linspace(0, np.pi, int(d * SR))), .35)

def ins(name, pitch, d, v=.6): return S.note(name, pitch, d, vel=v)
def doorbell():   # "Ding-a-ling-a-ling!": a happy little glockenspiel tune
    x = np.zeros(int(2.4 * SR))
    for k, p in enumerate(['C6', 'E6', 'G6', 'E6', 'C7']):
        y = S.note('glockenspiel', p, .5, vel=.55); s = int(k * .2 * SR); n = min(len(y), len(x) - s); x[s:s + n] += y[:n]
    return norm(x, .6)
def bell_ring(): y = S.note('hand_chimes', 'G5', 1.2, vel=.6) if 'hand_chimes' in S.instruments() else ding(1.0); return norm(y, .6)

FX = {
  'clipclop2': lambda: np.concatenate([clop(1), np.zeros(int(.16 * SR)), clop(.85), np.zeros(int(.3 * SR)), clop(1), np.zeros(int(.16 * SR)), clop(.85)]),
  'steps_boots': lambda: sum_steps(step_boot, 8, .32), 'run': lambda: sum_steps(step_boot, 10, .17), 'tiptoe': lambda: sum_steps(tiptoe, 7, .4),
  'knock': lambda: knock(.7), 'knock_big': lambda: knock(1.0, 110), 'pick': lambda: pop(1.3), 'pop': lambda: pop(1.0), 'ding': lambda: ding(1.0, 1.4),
  'splash': splash, 'swish': lambda: swish(.4), 'baa': baa, 'taptap': lambda: np.concatenate([clop(1.2), np.zeros(int(.22 * SR)), clop(1.2)]),
  'doorbell': doorbell, 'creak': creak, 'roar': roar_funny, 'eek': eek, 'slide': slide_whistle, 'poof': poof, 'squeak': squeak,
  'jump': jump, 'boing': boing, 'tear': tear, 'nibble': nibble, 'brush': lambda: brush_sfx(1.6), 'twinkle': twinkle, 'shout_pop': shout_pop,
  'rumble': rumble_tummy, 'brr': brr, 'gulp': gulp, 'whisper': whisper, 'breath': breath, 'clap': clap, 'purr': lambda: purr(3.0), 'whoa': whoa,
  'zoom': zoom, 'crickets': crickets, 'giggle': giggle, 'cheer': cheer, 'slip': slip, 'rustle': rustle, 'boots_on': lambda: np.concatenate([step_boot(), np.zeros(int(.12 * SR)), step_boot()]),
  'door_big': lambda: creak() * .6 + np.pad(knock(.5, 90), (0, int(1.6 * SR) - len(knock(.5, 90)))), 'door_small': lambda: knock(.35, 200), 'crumbs': lambda: rustle(.6) * .6,
  'tr_page': paper_turn, 'tr_wipe': lambda: brush_sfx(.8), 'tr_mist': lambda: whoosh(1.1), 'card_in': card_in, 'card_out': lambda: paper_turn() * .4,
  'thunder_hum': lambda: storm_low(2.0), 'thunder_soft': lambda: storm_low(3.0), 'storm': lambda: storm_low(4.0), 'pen': lambda: sum_steps(pen_tick, 26, .08),
}
GAIN = {'splash': .5, 'roar': .45, 'knock_big': .5, 'tr_page': .45, 'card_in': .25, 'card_out': .25, 'brush': .3, 'storm': .4, 'thunder_soft': .5, 'thunder_hum': .5}
def sum_steps(f, n, gap):
    x = np.zeros(int((n * gap + .3) * SR))
    for k in range(n): y = f(); s = int(k * gap * SR); x[s:s + len(y)] += y[:len(x) - s] * (.8 + .2 * rng.random())
    return x

# ------------------------------------------------------------------ ambience beds by location
def birds(d):
    x = np.zeros(int(d * SR))
    for k in range(int(d * .9)):
        s = int(rng.uniform(0, d - .5) * SR); n = int(rng.integers(2, 5))
        for j in range(n):
            ln = rng.uniform(.05, .12); f0 = rng.uniform(2600, 4200); y = tone(np.geomspace(f0, f0 * rng.uniform(1.2, 1.6), int(ln * SR)), ln) * env(ln, .005, ln / 2)
            ss_ = s + int(j * .11 * SR); x[ss_:ss_ + len(y)] += y[:max(0, len(x) - ss_)] * rng.uniform(.3, .6)
    return x
def water(d): x = bp(nz(d), 300, 3000) * (.6 + .4 * lp(np.abs(nz(d)), 2)); return lp(x, 2500)
def wind(d): return bp(nz(d), 150, 900) * (.5 + .5 * np.sin(2 * np.pi * .13 * t_(d) + 1))
def fire(d):
    x = lp(nz(d), 400) * .5
    for k in range(int(d * 9)): s = int(rng.uniform(0, d - .02) * SR); y = bp(nz(.02), 1500, 6000) * env(.02, .001, .004); x[s:s + len(y)] += y * rng.uniform(.5, 2)
    return x
def room(d): return lp(nz(d), 220) * .5
def murmur(d): return bp(nz(d), 300, 1200) * (.6 + .4 * np.sin(2 * np.pi * .4 * t_(d))) * .7
def crick(d): return crickets(d) * .4
AMB = {'mill': [(water, .05), (birds, .06)], 'forest': [(birds, .08), (wind, .02)], 'hill': [(birds, .06), (wind, .03)], 'throne': [(room, .03)],
       'village': [(murmur, .03), (birds, .04)], 'river': [(water, .06), (birds, .05)], 'fields': [(wind, .03), (birds, .07)],
       'ogre': [(wind, .05)], 'hall': [(fire, .05), (room, .02)], 'kitchen': [(fire, .06), (crick, .4)], 'desk': [(room, .03), (fire, .015)]}

def main():
    voice = np.zeros((N, 2), np.float32); music = np.zeros((N, 2), np.float32); fx = np.zeros((N, 2), np.float32); amb = np.zeros((N, 2), np.float32)
    # narration: compressed, levelled per line, asides a little softer
    for L in VT['lines']:
        a, sr = sf.read(os.path.join(ROOT, 'voices', L['id'] + '.wav')); a = a if a.ndim == 1 else a.mean(1)
        a = soxr.resample(a, sr, SR).astype(np.float32)
        a = compress(a / (np.abs(a).max() + 1e-9) * .9, thr=.3, ratio=3.0)
        rms = np.sqrt(np.mean(a[np.abs(a) > .02] ** 2)) if (np.abs(a) > .02).any() else .1
        g = .11 / rms * (.72 if L['tone'] == 'aside' else 1.0)
        g = min(g, .97 / (np.abs(a).max() + 1e-9))
        put(voice, a, L['t0'], g, 0)
    # score
    m, sr = sf.read(os.path.join(ROOT, 'out/music.wav')); music[:min(N, len(m))] = m[:N]
    # duck the music under the voice (smoothed envelope): about 13 dB down while anyone speaks
    v = np.abs(voice[:, 0]); k = int(.05 * SR); env_v = np.convolve(v, np.ones(k) / k, 'same')
    speaking = (env_v > .01).astype(np.float32); hold = int(.35 * SR); sp = np.convolve(speaking, np.ones(hold), 'same') > 0
    duck = sosfilt(butter(1, 2.5, 'low', fs=SR, output='sos'), np.where(sp, .22, 1.0).astype(np.float64)).astype(np.float32)
    music *= duck[:, None] * .65
    # SPLASH cuts the comic rise dead
    for e in TL['ev']:
        if e['type'] == 'splash': s = int(e['t'] * SR); music[s:s + int(1.5 * SR)] *= np.linspace(0, 1, int(1.5 * SR))[:, None] ** 3 if len(music[s:s + int(1.5 * SR)]) == int(1.5 * SR) else 0
    # foley
    used = set()
    for e in TL['ev']:
        f = FX.get(e['type'])
        if not f: continue
        x = f().astype(np.float32); used.add(e['type'])
        put(fx, x, e['t'], .5 * GAIN.get(e['type'], 1.0) * e.get('g', 1), e.get('pan', 0) or float(rng.uniform(-.25, .25)))
        if e['type'] == 'type':
            pass
    for c in TL['cards']:   # pen ticks as the word types
        for k in range(len(c['text'])): put(fx, pen_tick(), c['t0'] + .28 + k * .5 / len(c['text']), .25, .2)
    # ambience beds, crossfaded per shot location
    for s in TL['shots']:
        loc = s.get('loc') if s.get('kind') != 'moral' else None
        d = s['t1'] - s['t0']
        if not loc or d <= 0: continue
        for fn, g in AMB.get(loc, []):
            x = fn(d + .6).astype(np.float32)
            x = x / (np.abs(x).max() + 1e-9) * g * 1.2 if fn in (birds, crick, fire) else x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * g * .3
            fade = np.minimum(1, np.minimum(t_(d + .6) / .3, (d + .6 - t_(d + .6)) / .3)).astype(np.float32)
            put(amb, x * fade, s['t0'] - .3, 1.0, float(rng.uniform(-.3, .3)))
    # the ogre's castle: storm wind fades as the sky clears, birds come back
    mix = voice + music + fx * .9 + amb
    mix = limit(mix, .95) if mix.ndim == 1 else np.stack([limit(mix[:, 0], .95), limit(mix[:, 1], .95)], 1)
    sf.write(os.path.join(ROOT, 'out/mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
    for nm, b in [('voice', voice), ('music', music), ('fx', fx), ('amb', amb)]:
        r = np.sqrt(np.mean(b ** 2)); print(f'{nm:6s} rms {20 * np.log10(r + 1e-12):6.1f} dBFS  peak {20 * np.log10(np.abs(b).max() + 1e-12):6.1f}')
    json.dump(sorted(used), open(os.path.join(ROOT, 'out/fx_used.json'), 'w'))
    print('mix → out/mix.wav', round(DUR, 2), 's')

if __name__ == '__main__':
    main()
