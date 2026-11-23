"""Sound effects and ambience, placed on the action (seconds into the film). Everything is synthesised in foley.py
or played from CC0 samples. FX = (time, sound, gain, pan); BEDS = ambience (t0, t1, sound, gain, fade in, fade out)."""
import numpy as np
import foley as F
from core.audio import sampler as S
from score import T, T1, SH, TL
FX, BEDS = [], []
def fx(t, x, g=1.0, pan=0.0): FX.append((t, x, g, pan))
def bed(t0, t1, kind, g=1.0, fi=.6, fo=.6): BEDS.append((t0, t1, kind, g, fi, fo))
def lazy(f, *a, **k): return lambda: f(*a, **k)

# ---------------- the approved opening (0 to 25 s) ----------------
fx(0, lazy(lambda: F.fade(F.candle(3.9), .4, 1.0)), 1.0, -.2)
fx(1.9, lazy(F.page_flip, .85), .22, .15); fx(2.5, lazy(F.rustle, .8, .7), .15, -.2)
for tt, p in [(3.75, 'G5'), (3.95, 'D6'), (4.15, 'B5'), (4.35, 'G6')]: fx(tt, lazy(S.note, 'glockenspiel', p, .8, vel=.4), .35, .2)
for i in range(16): fx(4.6 + i * .045, lazy(F.tick, .35), .35, -.3 + .04 * i)
fx(5.45, lazy(F.air, 2.6, 1.0), .5, 0)
bed(6.5, T('L004[6:]'), 'river', .55, 1.5, 1.0)
bed(8.0, 20.0, 'room', 1.0, .3, .3)
for k, tt in enumerate(np.sort(np.random.default_rng(4).uniform(8, 25, 9))): fx(float(tt), lazy(F.bird, float(np.random.default_rng(int(tt * 10)).uniform(2600, 4200)), 2), .12, float(np.random.default_rng(int(tt * 7)).uniform(-.6, .6)))
fx(10.2, lazy(F.rustle, .9, .5), .4, -.1); fx(11.95, lazy(F.sigh, 1.3), .7, -.1)
for k in range(3): fx(14.35 + k * .17, lazy(F.sniff), .5, .3)
bed(19.79, 27.8, 'riverUp', 1.0, .6, .6)
for i in range(4): fx(20.2 + i * 1.6, lazy(F.creak_wood, .3 + .1 * (i % 2)), .55, -.3)
fx(19.9, lazy(F.splashes, 6.0), .9, -.2)
fx(20.5, lazy(F.tick, 1.0), .4, -.3); fx(20.45, lazy(F.rustle, .45, .5), .35, -.3)
fx(22.6, lazy(lambda: F.fade(F.stones(3.0), .4, .5)), .7, .2)

# ---------------- word cards: a soft paper slide and a harp touch as the card comes in ----------------
for s in TL['shots']:
    for c in s['cards']: fx(c['t0'], lazy(F.paper, .45), .5, .1)

# ---------------- PART 1 after the sample ----------------
def part1():
    bed(T('L004[6:]'), T1('L005'), 'river', .35, .3, 1.0); fx(T('L004[6:]', .2), lazy(lambda: F.fade(F.stones(3.0), .3, .6)), .6, .2)
    bed(T('L005'), T1('L023'), 'birds', .5, 1.2, .6); bed(T('L008'), T1('L023'), 'river', .25, 1.0, .8); bed(T('L005'), T1('L023'), 'room', 1.0, .5, .5)
    for k in range(4): fx(T('L006', .1 + k * .45), lazy(F.clop, .8, .9), .5, -.1 + k * .08)
    fx(T('L006', .5), lazy(F.jingle), .45, .1)
    for k in range(5): fx(T('L007', .1 + k * .36), lazy(F.clop, .7, .8), .45, .2 - k * .08)
    fx(T('L007', 1.0), lazy(F.sigh, .7), .4, .1)
    fx(T('L009', .55), lazy(F.bloop, .8, .9), .4, -.1)
    fx(T('L011', .15), lazy(F.tummy, 1.7), .55, 0); for_k = [fx(T('L011', 1.0 + k * .22), lazy(F.thud, .3, 140), .35, 0) for k in range(4)]
    fx(T('L013[1:6]', 1.0), lazy(F.crack), .9, 0)
    for k in range(3): fx(T('L013[7:]', 1.35 + k * .17), lazy(F.sniff), .5, .3)
    fx(T('L015', .3), lazy(F.nibble, 12), .6, .2)
    fx(T('L017', .05), lazy(F.swish, .25), .5, -.2); fx(T('L017', .32), lazy(F.thud, .5, 110), .5, -.1)
    fx(T('L018', .55), lazy(F.bloop, .7, 1.2), .35, .2)
part1()

from cues_words import W
def part2():
    bed(T('L024'), T1('L024'), 'birds', .4, .5, .5); bed(T('L024'), T1('L024'), 'room', 1.0, .3, .3)
    bed(T('L025[1:7]'), T1('L026'), 'room', 1.2, .3, .3)
    fx(T('L025[1:7]', .6), lazy(F.thud, .5, 80), .5, -.2); fx(T('L025[1:7]', .7), lazy(F.rustle, 1.0, .6), .5, -.2); fx(T('L025[1:7]', 1.9), lazy(F.rustle, .8, .6), .4, .1)
    fx(T('L025[8:]', 0), lazy(F.bloop, .8, 1.0), .5, .2)
    for dt in [.4, 2.0]: fx(T('L026', dt), lazy(F.rustle, .9, .6), .5, 0); fx(T('L026', dt + 1.0), lazy(F.thud, .35, 160), .4, 0)
    bed(T('L027-L028'), T1('L031'), 'birds', .45, .4, .4); bed(T('L027-L028'), T1('L031'), 'wind', .5, .5, .5)
    for k in range(int((T1('L029') - T('L027-L028')) / .417)): fx(T('L027-L028', k * .417), lazy(F.clop, 1.25 if k % 2 == 0 else 1.08, .8), .55, 0)
    for k in range(5): fx(T('L030', .45 + k * .3), lazy(F.sniff), .35, -.1)
    bed(T('L032'), T1('L034'), 'birds', 1.0, 1.0, .5)
    for k in range(int((T1('L033[1:10]') - T('L032')) / .5)): fx(T('L032', k * .5), lazy(F.clop, 1.25 if k % 2 == 0 else 1.08, .5), .4, 0)
    fx(T('L033[11:]', .3), lazy(F.rustle, 1.2, .8), .6, .2)
    for w0 in W('L034', ['Pick,', 'pick,', 'pick!']): fx(w0, lazy(F.bloop, .9, 1.1), .6, 0); fx(w0 - .1, lazy(F.rustle, .3, .6), .4, .2)
    bed(T('L035'), T1('L035'), 'wind', .8, .5, .5); bed(T('L035'), T1('L035'), 'flags', .5, .8, .5)
    for k in range(6): fx(T('L035', k * .42), lazy(F.clop, 1.3, .35), .35, 0)
    bed(T('L036'), T1('L056-L057'), 'room', 1.4, .4, .6)
    fx(T('L036', .2), lazy(F.creak_door, 1.2, .8), .55, -.4); fx(T('L036', 1.0), lazy(F.thud, .3, 70), .3, -.4)
    for k in range(6): fx(T('L036', 1.0 + k * .42), lazy(F.clop, 1.1, .6), .45, -.3 + k * .06)
    fx(T('L039', 1.2), lazy(F.rustle, .5, .4), .35, 0)
    for w0 in W('L043', ['But']): fx(w0 - .6, lazy(F.crunch, .5), .5, .1)
    fx(T('L045', .6), lazy(F.bloop, .8, 1.2), .45, .1); fx(T('L046[7:]', .25), lazy(F.bloop, .7, .8), .35, .2)
    fx(T('L048[4:]', .3), lazy(F.bloop, .8, 1.0), .5, -.2); fx(T('L048[4:]', 1.1), lazy(F.bloop, .8, 1.2), .5, -.1)
    for k in range(5): fx(T('L050[1:7]', .2 + k * .55), lazy(F.crunch, .35), .4, .1)
    for k in range(4): fx(T('L050[8:]', .1 + k * .45), lazy(F.crunch, .4), .45, .1)
    for k in range(3): fx(T('L053[8:]', .2 + k * .4), lazy(F.drip, .8), .5, .1)
    fx(T('L053[8:]', 1.1), lazy(F.sniff), .3, .1)
part2()
