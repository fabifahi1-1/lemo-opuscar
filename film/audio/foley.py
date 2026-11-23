"""Procedural foley for the film (all made here, no third-party sound): paper, candle, water, wood, birds, stone."""
import sys, numpy as np
sys.path.insert(0, '/home/user/lemo-opuscar')
from core.audio import sfx as X
from core.audio.sfx import SR, bp, lp, hp, noise, t_
rng = np.random.default_rng(11)

def smooth_noise(d, hz):   # slowly varying 0..1 control signal
    n = int(d * hz) + 3; v = rng.random(n); x = np.interp(np.arange(int(round(d * SR))) / SR * hz, np.arange(n), v); return x
def fade(x, a=.05, b=.05):
    n = len(x); e = np.ones(n); i, o = int(a * SR), int(b * SR)
    if i: e[:i] = np.linspace(0, 1, i)
    if o: e[-o:] = np.linspace(1, 0, o)
    return x * e

def page_flip(d=.8):
    n = noise(d); t = t_(d); env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6
    x = bp(n, 1200, 7000) * env * .5 + lp(noise(d), 500) * env * .08
    end = int(d * SR * .86); tap = hp(noise(.05), 900) * np.exp(-t_(.05) / .012); x[end:end + len(tap)] += tap[:len(x) - end] * .5
    return x
def rustle(d=1.0, v=1.0):
    t = t_(d); mod = (smooth_noise(d, 14) ** 3); return bp(noise(d), 2000, 8000) * mod * v * .35
def candle(d):
    x = lp(noise(d), 900) * .02 * (.6 + .4 * smooth_noise(d, 3))
    for _ in range(int(d * 5)):
        c = hp(noise(.01), 2500) * np.exp(-t_(.01) / .0022) * rng.uniform(.04, .16); i = rng.integers(0, len(x) - len(c)); x[i:i + len(c)] += c
    return x
def river(d):
    a = bp(noise(d), 280, 3200) * (.5 + .5 * smooth_noise(d, 1.3)); b = lp(noise(d), 180) * .8
    return (a * .22 + b * .12) * (.8 + .2 * smooth_noise(d, 5))
def bird(f0=3200, n=3):
    out = []; 
    for _ in range(n):
        d = rng.uniform(.07, .13); t = t_(d); f = f0 * (1 + rng.uniform(.2, .5) * np.sin(np.pi * t / d)) ; ph = 2 * np.pi * np.cumsum(f) / SR
        out.append(np.sin(ph) * np.sin(np.pi * t / d) ** 2 * .5); out.append(np.zeros(int(rng.uniform(.04, .09) * SR)))
    return np.concatenate(out)
def stones(d):
    t = t_(d); pulse = .5 + .5 * np.sin(2 * np.pi * 1.25 * t); return (lp(noise(d), 260) * .5 + bp(noise(d), 120, 700) * .15) * (.4 + .6 * pulse) * smooth_noise(d, 2) ** .5
def creak_wood(v=1.0):
    d = .55; t = t_(d); f = 180 + 90 * np.sin(2 * np.pi * 7 * t) * np.exp(-t / .25) + 40 * t; ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sign(np.sin(ph)) * .3 + np.sin(ph) * .3; x = bp(x + noise(d) * .06, 250, 1800) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.2; return x * v
def tick(v=1.0): return hp(noise(.02), 1800) * np.exp(-t_(.02) / .004) * v
def air(d=2.4, v=1.0):
    t = t_(d); env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2; return bp(noise(d), 400, 2600) * env * v * .12
def room(d, v=1.0): return lp(noise(d), 700) * .012 * v
def sigh(d=1.3):   # a soft breath out: shaped, filtered noise
    t = t_(d); env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * np.exp(-t / (d * .8))
    return bp(noise(d), 300, 2200) * env * .35 + lp(noise(d), 500) * env * .1
def sniff():       # one short sniff
    d = .09; t = t_(d); return hp(noise(d), 1500) * np.sin(np.pi * t / d) ** 2 * .3
def splashes(d):   # water from the flume hitting the wheel and the river: a steady pour plus little splats
    x = bp(noise(d), 600, 5000) * .18 * (.75 + .25 * smooth_noise(d, 6))
    for _ in range(int(d * 9)):
        s = bp(noise(.06), 1200, 7000) * np.exp(-t_(.06) / .015) * rng.uniform(.1, .35); i = rng.integers(0, len(x) - len(s)); x[i:i + len(s)] += s
    return x

# ---------------- the rest of the film's cartoon foley (all synthesised here) ----------------
def _sin(f, d, ph=0): return np.sin(2 * np.pi * np.cumsum(np.broadcast_to(f, (int(d * SR),))) / SR + ph)
def _env(d, a=.005, tau=.05): t = t_(d); return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / tau)
def _place(dst, x, t):
    i = int(t * SR); n = min(len(x), len(dst) - i)
    if n > 0 and i >= 0: dst[i:i + n] += x[:n]
def clop(pitch=1.0, v=1.0):        # one hoof / boot heel: a hollow wooden tock
    d = .12; t = t_(d); f = 700 * pitch
    x = (np.sin(2 * np.pi * f * t) * .7 + np.sin(2 * np.pi * f * 1.52 * t) * .35) * np.exp(-t / .03) + hp(noise(d), 1500) * np.exp(-t / .006) * .5
    return x * v * .6
def hooves(d, rate=3.2, v=1.0):    # a trotting horse: clip-clop pairs
    out = np.zeros(int((d + .3) * SR)); k = 0; tt = 0.0
    while tt < d: _place(out, clop(1.0 if k % 2 == 0 else .82, v * (.8 + .2 * rng.random())), tt); tt += (1 / rate) * (.42 if k % 2 == 0 else .58); k += 1
    return out
def boots(n, every=.42, v=1.0, pitch=1.25):   # Puss's boots: clip-clop with a little leather squeak
    out = np.zeros(int((n * every + .4) * SR))
    for k in range(n): _place(out, clop(pitch * (1.0 if k % 2 == 0 else .86), v), k * every); _place(out, bp(noise(.05), 2500, 6000) * np.exp(-t_(.05) / .015) * .06 * v, k * every + .02)
    return out
def thud(v=1.0, f=90):             # a soft wooden thud (door, bump)
    d = .35; t = t_(d); return (np.sin(2 * np.pi * f * t * (1 - .2 * t)) * np.exp(-t / .07) + lp(noise(d), 600) * np.exp(-t / .03) * .5) * v
def knock(v=1.0, size=1.0):        # a knuckle knock on a big wooden door; bigger = lower and longer
    d = .28 * size; t = t_(d); f = 160 / (.7 + .3 * size)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t / (.035 * size)) + bp(noise(d), 300, 2500) * np.exp(-t / .012) * .8 + np.sin(2 * np.pi * f * 2.3 * t) * np.exp(-t / .02) * .3) * v
def jingle(v=1.0):                 # keys
    d = .5; out = np.zeros(int(d * SR))
    for k in range(6): f = rng.uniform(3500, 6500); s = t_(.12); _place(out, np.sin(2 * np.pi * f * s) * np.exp(-s / .03) * .3, k * .05 + rng.uniform(0, .02))
    return out * v
def tummy(d=1.6, v=1.0):           # a comic tummy rumble: low gurgling glide
    t = t_(d); f = 90 + 30 * np.sin(2 * np.pi * 2.3 * t) + 40 * np.sin(2 * np.pi * .7 * t); ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + .4 * np.sign(np.sin(ph * 1.01))) * (np.abs(np.sin(2 * np.pi * 3.1 * t)) ** 2) * np.sin(np.pi * t / d)
    return lp(x, 400) * .9 * v
def crack(v=1.0):                  # crusty bread breaking: a few crunchy snaps and a soft tear
    d = .5; out = np.zeros(int(d * SR))
    for k in range(7): s = bp(noise(.03), 1200, 7000) * np.exp(-t_(.03) / .006) * rng.uniform(.3, 1); _place(out, s, k * .035 + rng.uniform(0, .01))
    _place(out, bp(noise(.3), 600, 3000) * np.sin(np.pi * t_(.3) / .3) * .25, .1)
    return out * v
def nibble(n=6, v=1.0):
    out = np.zeros(int((n * .16 + .2) * SR))
    for k in range(n): _place(out, bp(noise(.04), 2000, 8000) * np.exp(-t_(.04) / .008) * .5, k * .16 + rng.uniform(0, .03))
    return out * v
def bloop(v=1.0, p=1.0):           # a pop-in: a little rising bubble
    d = .12; t = t_(d); f = (300 + 900 * (t / d) ** .7) * p; return _sin(f, d) * np.sin(np.pi * t / d) * .5 * v
def swish(d=.3, v=1.0):
    t = t_(d); env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2; n = noise(d)
    return (bp(n, 1500, 7000) * .6 + bp(n, 500, 1500) * .3) * env * v * .5
def splash(v=1.0, big=1.0):        # a cartoon splash: a burst, a hiss of spray, falling drops
    d = 1.4 * big; t = t_(d); out = bp(noise(d), 200, 6000) * np.exp(-t / (.18 * big)) * .9 + lp(noise(d), 300) * np.exp(-t / .1) * .6
    for k in range(14): _place(out, drip(rng.uniform(.4, 1)), .25 + rng.uniform(0, .9) * big)
    return out * v
def drip(v=1.0):
    d = .09; t = t_(d); f = 1800 * np.exp(-t / .03) + 600; return _sin(f, d) * np.exp(-t / .025) * .35 * v
def chatter(d=1.5, v=1.0):         # teeth chattering
    out = np.zeros(int((d + .1) * SR)); k = 0
    while k * .055 < d: _place(out, hp(noise(.015), 2500) * np.exp(-t_(.015) / .003) * rng.uniform(.4, 1), k * .055); k += 1
    return out * v * .6
def wheels(d, v=1.0):              # carriage wheels on a dirt road: a low roll and soft wooden creaks
    t = t_(d); x = lp(noise(d), 220) * .5 * (.8 + .2 * np.sin(2 * np.pi * 1.7 * t))
    for k in range(int(d / .9)): _place(x, bp(creak_wood(.4), 200, 1200) * .3, k * .9 + rng.uniform(0, .3))
    return x * v
def crunch(v=1.0):                 # a cookie crunch
    d = .35; out = np.zeros(int(d * SR))
    for k in range(9): _place(out, bp(noise(.03), 800, 6000) * np.exp(-t_(.03) / .007) * rng.uniform(.3, 1), k * .028 + rng.uniform(0, .01))
    return out * v
def baa(v=1.0):                    # a sheep's "baaa": a buzzy vowel with a wobbly pitch
    d = .9; t = t_(d); f = 230 * (1 + .06 * np.sin(2 * np.pi * 7 * t)) * (1 - .1 * t); ph = 2 * np.pi * np.cumsum(f) / SR
    src = 2 * ((ph / (2 * np.pi)) % 1) - 1; x = bp(src, 600, 900) * 1.2 + bp(src, 1100, 1500) * .6 + bp(src, 2400, 3000) * .2
    return x * np.minimum(1, t / .05) * np.exp(-np.maximum(0, t - .55) / .1) * .5 * v
def tap(v=1.0): return clop(1.5, v * .7)
def creak_door(d=1.8, v=1.0):      # a long, slow, comic door creak
    t = t_(d); f = 120 + 70 * np.sin(2 * np.pi * .8 * t) + 50 * t; ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sign(np.sin(ph)) * .35 + np.sin(ph * 2) * .2; x = bp(x + noise(d) * .05, 200, 2200) * (np.abs(np.sin(2 * np.pi * 9 * t)) ** 1.5 * .7 + .3) * np.sin(np.pi * t / d)
    return x * v
def roar(d=1.4, v=1.0):            # a funny roar: a big wobbly growl that ends in a squeaky crack
    t = t_(d); f = 110 - 25 * t / d + 8 * np.sin(2 * np.pi * 6 * t); ph = 2 * np.pi * np.cumsum(f) / SR
    src = 2 * ((ph / (2 * np.pi)) % 1) - 1; x = bp(src, 150, 1400) * (1 + .5 * np.sin(2 * np.pi * 31 * t)) + bp(noise(d), 300, 2000) * .25
    x = x * np.minimum(1, t / .08) * np.exp(-np.maximum(0, t - d * .7) / .12)
    squeak = _sin(900 + 500 * t_(.18) / .18, .18) * np.sin(np.pi * t_(.18) / .18) * .25; _place(x, squeak, d * .82)
    return x * .7 * v
def eeek(v=1.0):
    d = .6; t = t_(d); f = 1700 + 700 * np.sin(np.pi * t / d) + 60 * np.sin(2 * np.pi * 14 * t); return _sin(f, d) * np.minimum(1, t / .02) * np.exp(-np.maximum(0, t - .45) / .05) * .35 * v
def tile_slide(n=3, v=1.0):        # boots sliding down roof tiles: three scrapes with a tile clack each
    out = np.zeros(int((n * .55 + .4) * SR))
    for k in range(n): s = t_(.42); _place(out, bp(noise(.42), 700, 4000) * np.sin(np.pi * s / .42) * .4, k * .55); _place(out, clop(.9, .5), k * .55 + .4)
    return out * v
def poof(v=1.0, big=1.0):          # a magic smoke puff: a soft whoomph
    d = .7 * big; t = t_(d); return (lp(noise(d), 500) * .9 + bp(noise(d), 800, 4000) * .3) * np.minimum(1, t / .02) * np.exp(-t / (.16 * big)) * v
def squeak(v=1.0):
    d = .22; t = t_(d); f = 3200 + 1200 * np.sin(np.pi * t / d); return _sin(f, d) * np.sin(np.pi * t / d) * .3 * v
def scurry(d=1.2, v=1.0):          # tiny mouse feet running
    out = np.zeros(int((d + .1) * SR)); k = 0
    while k * .045 < d: _place(out, hp(noise(.01), 3000) * np.exp(-t_(.01) / .002) * rng.uniform(.3, 1), k * .045); k += 1
    return out * v * .5
def crickets(d, v=1.0):
    t = t_(d); x = np.zeros(len(t))
    for f0, rate, off in [(4400, 2.1, 0), (4800, 1.7, .3), (4100, 2.6, .7)]:
        gate = (np.sin(2 * np.pi * rate * t + off * 6) > .6) * (np.sin(2 * np.pi * 38 * t) > 0); x += np.sin(2 * np.pi * f0 * t) * gate * .05
    return lp(x, 7000) * v
def snore(d=2.4, v=1.0):           # a tiny cat snore: in (soft rasp), out (whistle)
    t = t_(d); inh = bp(noise(d), 150, 900) * np.sin(np.pi * np.clip(t / (d * .45), 0, 1)) ** 2 * (t < d * .45)
    exh = _sin(700 + 200 * np.sin(np.pi * np.clip((t - d * .55) / (d * .4), 0, 1)), d) * np.sin(np.pi * np.clip((t - d * .55) / (d * .4), 0, 1)) ** 2 * (t > d * .55) * .08
    return (inh * .5 + exh) * v
def crowd(d, v=1.0):               # a quiet market crowd: babble-like filtered noise with moving formants
    t = t_(d); out = np.zeros(len(t))
    for k in range(6): m = smooth_noise(d, 4 + k); out += bp(noise(d), 300 + 120 * k, 900 + 150 * k) * m ** 2
    return out * .12 * v
def wind(d, v=1.0): t = t_(d); return bp(noise(d), 300, 1500) * (.4 + .6 * smooth_noise(d, .6)) * .25 * v
def flags(d, v=1.0): t = t_(d); return bp(noise(d), 600, 3000) * (np.abs(np.sin(2 * np.pi * 9 * t)) ** 2) * (.5 + .5 * smooth_noise(d, 1)) * .25 * v
def thunder(d=2.5, v=1.0): t = t_(d); return lp(noise(d), 150) * np.minimum(1, t / .3) * np.exp(-t / .9) * .9 * v
def flutter(d=.8, v=1.0): t = t_(d); return bp(noise(d), 400, 2500) * (np.abs(np.sin(2 * np.pi * 14 * t)) ** 3) * np.sin(np.pi * t / d) * .5 * v
def whisper(d=.8, v=1.0): t = t_(d); return bp(noise(d), 2500, 8000) * (smooth_noise(d, 8) ** 2) * np.sin(np.pi * t / d) * .4 * v
def gulp(v=1.0): d = .25; t = t_(d); return _sin(320 - 200 * t / d, d) * np.sin(np.pi * t / d) ** 2 * .5 * v
def clap(v=1.0): d = .08; t = t_(d); return bp(noise(d), 800, 5000) * np.exp(-t / .012) * .6 * v
def paper(d=.45, v=1.0):           # a sheet of paper sliding in (word cards)
    t = t_(d); return bp(noise(d), 1500, 7000) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * .25 * v
