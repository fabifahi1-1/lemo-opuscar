"""Procedural foley for the film (all made here, no third-party sound): paper, candle, water, wood, birds, stone."""
import sys, numpy as np
sys.path.insert(0, '/home/user/lemo-opuscar')
from core.audio import sfx as X
from core.audio.sfx import SR, bp, lp, hp, noise, t_
rng = np.random.default_rng(11)

def smooth_noise(d, hz):   # slowly varying 0..1 control signal
    n = int(d * hz) + 3; v = rng.random(n); x = np.interp(np.arange(int(d * SR)) / SR * hz, np.arange(n), v); return x
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
