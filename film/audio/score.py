"""The film's original score, as note events for the CC0 sampler (VSCO 2 CE + VCSL).
Gentle storybook music: upright piano, plucked strings, light woodwind, harp and glockenspiel; no drum kit.
Sections follow the story (see SECTIONS); a few moments are left with no music at all."""
import json
TL = json.load(open('/home/user/lemo-opuscar/film/data/timing.json'))
SH = {s['key']: s for s in TL['shots']}
def T(key, dt=0.0): return SH[key]['t0'] + dt
def T1(key, dt=0.0): return SH[key]['t1'] + dt

NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def m(p):   # 'F#4' -> midi
    n = NOTE[p[0]] + (1 if '#' in p else -1 if p[1:2] == 'b' else 0); return n + 12 * (int(p[-1]) + 1)
def nm(mi): return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][mi % 12] + str(mi // 12 - 1)
CH = {  # chord tones (root position, low octave)
    'G': ['G2', 'D3', 'G3', 'B3', 'D4'], 'C': ['C3', 'G3', 'C4', 'E4', 'G4'], 'D': ['D3', 'A3', 'D4', 'F#4', 'A4'], 'Em': ['E2', 'B2', 'E3', 'G3', 'B3'],
    'Am': ['A2', 'E3', 'A3', 'C4', 'E4'], 'F': ['F2', 'C3', 'F3', 'A3', 'C4'], 'Bm': ['B2', 'F#3', 'B3', 'D4', 'F#4'], 'Dm': ['D3', 'A3', 'D4', 'F4', 'A4'],
    'E': ['E2', 'B2', 'E3', 'G#3', 'B3'], 'A': ['A2', 'E3', 'A3', 'C#4', 'E4'], 'Cm': ['C3', 'G3', 'C4', 'D#4', 'G4'], 'Gm': ['G2', 'D3', 'G3', 'A#3', 'D4'],
}
EV = []
def ev(t, inst, pitch, dur, vel=.5, pan=0.0, attack=0.0, g=.7): EV.append(dict(t=t, inst=inst, pitch=pitch, dur=dur, vel=vel, pan=pan, attack=attack, g=g))

# ---------------- building blocks ----------------
def arp(t0, t1, chords, bpm, inst='upright', vel=.3, pat=(0, 2, 3, 4, 3, 2, 3, 2), div=2, pan=-.15, oct=0):
    beat = 60 / bpm; bar = beat * 4; k = 0; t = t0
    while t < t1 - .05:
        c = CH[chords[k % len(chords)]]
        for i, p in enumerate(pat):
            tt = t + i * beat / div
            if tt >= t1: break
            ev(tt, inst, nm(m(c[p]) + 12 * oct), beat / div * 1.4, vel * (1.08 if i == 0 else .92), pan + (i % 4) * .06)
        t += bar; k += 1
def pad(t0, t1, chords, bpm, inst='violas', vel=.22, pan=-.1, voices=(1, 2), attack=.8):
    beat = 60 / bpm; bar = beat * 4; k = 0; t = t0
    while t < t1 - .2:
        c = CH[chords[k % len(chords)]]; d = min(bar, t1 - t) + .3
        for j, v in enumerate(voices): ev(t, inst, c[v], d, vel, pan + j * .2, attack)
        t += bar; k += 1
def bass(t0, t1, chords, bpm, inst='cellos_pizz', vel=.4, pat=(0, None, 1, None), pan=-.25):
    beat = 60 / bpm; bar = beat * 4; k = 0; t = t0
    while t < t1 - .05:
        c = CH[chords[k % len(chords)]]
        for i, p in enumerate(pat):
            tt = t + i * beat
            if p is not None and tt < t1: ev(tt, inst, c[p], beat * .9, vel, pan)
        t += bar; k += 1
def mel(t0, notes, bpm, inst='flute', vel=.32, pan=.15, attack=.06, t1=None):
    beat = 60 / bpm
    for b, p, d in notes:
        if p and (t1 is None or t0 + b * beat < t1): ev(t0 + b * beat, inst, p, d * beat, vel, pan, attack)
def chime(t, notes=('G5', 'D6', 'B5', 'G6'), step=.12, inst='glockenspiel', vel=.35, pan=.2):
    for i, p in enumerate(notes): ev(t + i * step, inst, p, .9, vel, pan)
def sting(t, kind='pluck'):
    if kind == 'pluck': ev(t, 'violins_pizz', 'G4', .5, .55, .2); ev(t, 'cellos_pizz', 'G2', .5, .5, -.2); ev(t + .01, 'woodblock', None, .2, .4, .1)
    elif kind == 'surprise': [ev(t + i * .045, 'xylophone', p, .3, .45, -.2 + i * .1) for i, p in enumerate(['G4', 'B4', 'D5', 'G5'])]; ev(t + .2, 'violins_pizz', 'G5', .4, .5, .2); ev(t + .2, 'cellos_pizz', 'G2', .4, .5, -.2)
    elif kind == 'down': [ev(t + i * .07, 'xylophone', p, .3, .4, .1) for i, p in enumerate(['G5', 'E5', 'C5', 'G4'])]
    elif kind == 'gliss': [ev(t + i * .035, 'harp', p, 1.2, .35, -.3 + i * .05) for i, p in enumerate(['G3', 'B3', 'D4', 'G4', 'B4', 'D5', 'G5', 'B5', 'D6', 'G6'])]
    elif kind == 'twinkle': [ev(t + i * .09, 'glockenspiel', p, .8, .32, .25) for i, p in enumerate(['D6', 'G6', 'B6'])]
    elif kind == 'bwomp': ev(t, 'bassoon', 'G2', .45, .5, -.1); ev(t + .32, 'bassoon', 'D2', .5, .45, -.1)
    elif kind == 'card': ev(t, 'harp', 'G4', 1.4, .26, .1); ev(t + .06, 'harp', 'D5', 1.4, .22, .2)

# ---------------- 0 to 25 s: the approved opening, note for note ----------------
BEAT = 60 / 84; BAR = BEAT * 4
arpO = {'G': ['G3', 'B3', 'D4', 'G4', 'D4', 'B3', 'D4', 'B3'], 'D': ['D3', 'A3', 'D4', 'F#4', 'D4', 'A3', 'D4', 'A3'], 'Em': ['E3', 'B3', 'E4', 'G4', 'E4', 'B3', 'E4', 'B3'], 'C': ['C3', 'G3', 'C4', 'E4', 'C4', 'G3', 'C4', 'G3']}
for b, p, d in [(0, 'B4', 1), (1, 'D5', 1), (2, 'G5', 2), (4, 'F#5', 1), (5, 'E5', 1), (6, 'D5', 2), (8, 'E5', 1), (9, 'D5', 1), (10, 'B4', 2)]: ev(.35 + b * BEAT, 'glockenspiel', p, d * BEAT, .5, .1, g=.7)
for bar, c in enumerate(['G', 'D', 'Em']):
    for i, p in enumerate(arpO[c]): ev(.2 + bar * BAR + i * BEAT / 2, 'upright', p, BEAT / 2, .32, -.2 + (i % 4) * .1, g=.7)
for e in [dict(t=.2, inst='violas', pitch='G3', dur=8.0, vel=.32, attack=.9, pan=-.15), dict(t=1.0, inst='violins', pitch='D4', dur=7.2, vel=.26, attack=1.2, pan=.2), dict(t=6.0, inst='violins', pitch='B4', dur=2.2, vel=.3, attack=.6, pan=.25),
          dict(t=8.1, inst='cellos', pitch='G2', dur=3.6, vel=.26, attack=1.0, pan=-.2), dict(t=8.6, inst='violins', pitch='D4', dur=3.2, vel=.2, attack=1.4, pan=.2)]: ev(e['t'], e['inst'], e['pitch'], e['dur'], e['vel'], e['pan'], e['attack'], g=.7)
for tt, p in [(8.1, 'G3'), (9.5, 'D4'), (10.9, 'B3')]: ev(tt, 'upright', p, 1.4, .2, -.1, g=.7)
for e in [(11.5, 'cellos', 'E2', 2.5, .26, .6, -.2), (11.55, 'upright', 'E4', 1.6, .22, 0, 0), (12.7, 'upright', 'G3', 1.3, .18, 0, 0), (13.95, 'violas', 'E3', 3.6, .2, 1.0, -.1), (15.9, 'harp', 'E5', 2.0, .45, 0, .3), (16.35, 'harp', 'B5', 1.6, .35, 0, .35),
          (18.4, 'violas_pizz', 'G3', 1.5, .55, 0, .2), (18.5, 'violins', 'G4', 1.3, .22, .5, .2), (18.5, 'cellos', 'C3', 1.3, .22, .5, -.2)]: ev(e[0], e[1], e[2], e[3], e[4], e[6], e[5], g=.7)
for i, p in enumerate(arpO['C'] * 2 + arpO['G'] * 2):
    if 19.9 + i * BEAT / 2 < 28.0: ev(19.9 + i * BEAT / 2, 'upright', p, BEAT / 2, .16, -.2 + (i % 4) * .1, g=.7)
for tt, p, d in [(20.0, 'E5', 1.4), (21.5, 'D5', 1.2), (22.9, 'G5', 2.2), (25.3, 'E5', 1.4)]: ev(tt, 'flute', p, d, .3, .15, .12, g=.7)
ev(19.8, 'cellos', 'C3', 6.0, .24, -.2, .8, g=.7)

# ---------------- PART 1 after the sample ----------------
def part1():
    ev(T('L005', .1), 'cellos', 'G2', 3.2, .2, -.1, 1.2); ev(T('L005', .6), 'violas', 'D3', 2.6, .14, .1, 1.4)          # the father: one held note
    bass(T('L006'), T('L006', 1.43), ['G', 'D'], 112, 'cellos_pizz', .42); mel(T('L006', .05), [(0, 'D4', .5), (1, 'G4', .5), (2, 'B4', .5), (3, 'D5', 1)], 112, 'bassoon_stac', .45, -.1)   # the proud strut
    bass(T('L007'), T('L007', 1.8), ['C', 'G'], 96, 'contrabass_pizz', .4); mel(T('L007', .1), [(0, 'E4', .5), (1, 'C4', .5), (2, 'G3', 1)], 96, 'clarinet_stac', .38)
    ev(T('L008', .2), 'flute', 'D5', 2.6, .28, .2, .4); ev(T('L008', .1), 'violas', 'G3', 3.6, .14, -.1, 1.2)         # Tom alone: a lone flute note
    sting(T('L009', .55), 'pluck')
    arp(T('L010'), T1('L011', -.3), ['G', 'C', 'D', 'G'], 104, 'violins_pizz', .3, (0, 2, 3, 2), 2, .15)          # playful pizzicato
    sting(T('L011', .3), 'bwomp')
    for i, (dt, p) in enumerate([(.1, 'B3'), (1.3, 'G3'), (2.4, 'E3')]): ev(T('L012', dt), 'upright', p, 1.6, .2, -.1)   # the music thins
    ev(T('L013[1:6]', .2), 'violas', 'G3', 6.4, .18, -.1, 1.4); ev(T('L013[1:6]', .6), 'violins', 'D4', 6.0, .16, .2, 1.6); ev(T('L013[1:6]', 1.05), 'harp', 'G4', 1.6, .3, .2)
    arp(T('L013[7:]'), T1('L013[7:]'), ['C', 'G'], 84, 'harp', .22, (0, 2, 3, 4), 2, .25)
    pad(T('L014[1:6]'), T1('L015'), ['G', 'Em', 'C', 'D', 'G'], 80, 'violas', .14)
    mel(T('L014[1:6]', .2), [(0, 'B4', 1), (1, 'D5', 1), (2, 'G5', 2), (4, 'A5', 1), (5, 'G5', 1), (6, 'E5', 2), (8, 'D5', 1.5), (10, 'B4', 1), (11, 'A4', 1), (12, 'G4', 3)], 80, 'flute', .26, .2)
    mel(T('L014[1:6]', .2), [(2, 'D4', 2), (6, 'C4', 2), (10, 'D4', 3)], 80, 'clarinet', .18, -.2)
    sting(T('L014[7:]', .35), 'twinkle')
    pad(T('L016'), T1('L016'), ['C', 'G'], 80, 'violins', .12, .2, (2, 3))
    sting(T('L016', 2.0), 'twinkle'); sting(T('L017', .05), 'surprise')
    arp(T('L018', .5), T1('L023'), ['G', 'C', 'G', 'D'], 96, 'violins_pizz', .2, (0, 3, 2, 3), 2, .2)
    bass(T('L018', .5), T1('L023'), ['G', 'C', 'G', 'D'], 96, 'cellos_pizz', .26, (0, None, None, None))
    mel(T('L020[1:9]', .1), [(0, 'D5', .5), (.5, 'E5', .5), (1, 'G5', 1), (4, 'E5', .5), (4.5, 'D5', .5), (5, 'B4', 1)], 96, 'clarinet_stac', .22, .2)
    chime(T('L022', 2.2), ('G5', 'B5', 'D6'), .1, 'glockenspiel', .28); sting(T('L023', 1.6), 'twinkle')
part1()
def part2():
    mel(T('L024', .3), [(0, 'G5', 1), (1, 'E5', 1), (2, 'C5', 1), (3, 'D5', 2), (6, 'G5', 1), (7, 'A5', 1), (8, 'G5', 2)], 92, 'glockenspiel', .26, .2)   # music box: thinking
    pad(T('L024'), T1('L024'), ['C', 'G'], 92, 'violas', .12)
    arp(T('L025[1:7]'), T1('L025[1:7]'), ['C', 'F', 'G', 'C'], 108, 'violins_pizz', .22, (0, 2, 3, 2), 2, .15)
    sting(T('L026', .35), 'twinkle'); sting(T('L026', 1.95), 'twinkle')
    for i, p in enumerate(['C4', 'E4', 'G4', 'C5']): ev(T('L026', 2.9 + i * .08), 'xylophone', p, .3, .4, .1)
    # the strut: 144 bpm (a boot step every 10 frames), pizzicato bass and a cheeky clarinet tune
    t0, t1 = T('L027-L028'), T1('L029'); bass(t0, t1, ['C', 'G', 'C', 'G'], 144, 'cellos_pizz', .42, (0, None, 1, None))
    arp(t0, t1, ['C', 'G', 'C', 'G'], 144, 'violins_pizz', .2, (2, 3), 1, .2)
    mel(t0 + .1, [(0, 'G4', .5), (.5, 'C5', .5), (1, 'E5', 1), (2, 'D5', .5), (2.5, 'C5', .5), (3, 'D5', 1), (4, 'E5', .5), (4.5, 'G5', .5), (5, 'E5', 1), (6, 'D5', 2),
        (8, 'G4', .5), (8.5, 'C5', .5), (9, 'E5', 1), (10, 'F5', .5), (10.5, 'E5', .5), (11, 'D5', 1), (12, 'C5', 2), (16, 'G5', .5), (16.5, 'E5', .5), (17, 'C5', 1), (18, 'D5', 1), (19, 'C5', 2)], 144, 'clarinet_stac', .34, .15, t1=t1)
    for i in range(6): ev(T('L030', .5 + i * .18), 'flute_stac', ['E5', 'G5'][i % 2], .12, .2, .2)                       # the held laugh
    mel(T('L031', .3), [(0, 'C5', .5), (.5, 'E5', .5), (1, 'G5', 1.5)], 100, 'horn', .22, -.1); sting(T('L031', 2.3), 'twinkle')
    # the next morning in the forest: harp and flute
    arp(T('L032'), T1('L033[11:]'), ['G', 'Em', 'C', 'D'], 84, 'harp', .24, (0, 2, 3, 4, 3, 2, 3, 2), 2, .2)
    mel(T('L032', .6), [(0, 'D5', 1), (1, 'G5', 1), (2, 'B5', 2), (4, 'A5', 1), (5, 'G5', 1), (6, 'E5', 2), (8, 'D5', 1), (9, 'E5', 1), (10, 'G5', 3), (14, 'A5', 1), (15, 'B5', 1), (16, 'G5', 3)], 84, 'flute', .26, .2)
    from cues_words import W
    for w0 in W('L034', ['Pick,', 'pick,', 'pick!']): ev(w0, 'xylophone', 'G5', .3, .45, .2); ev(w0 + .05, 'xylophone', 'D6', .3, .35, .2)
    # the march up the hill
    t0, t1 = T('L035'), T('L035', 2.7); bass(t0, t1, ['G', 'D'], 120, 'cellos_pizz', .45); mel(t0, [(0, 'D4', .5), (.5, 'G4', .5), (1, 'B4', .5), (1.5, 'D5', .5), (2, 'G5', 1), (3, 'F#5', .5), (3.5, 'E5', .5), (4, 'D5', 1)], 120, 'bassoon_stac', .4, -.1)
    ev(T('L036', .1), 'violas', 'D3', 3.0, .14, -.1, .8)
    # the king's court: harpsichord and pizzicato
    chime(T('L037', 2.5), ('C5', 'E5', 'G5', 'C6'), .1, 'harp', .3)
    ev(T('L037', 2.5), 'horn', 'C4', 1.4, .2, -.2, .2); ev(T('L037', 2.5), 'horn', 'G4', 1.4, .18, .2, .2)
    sting(T('L038[7:]', .15), 'twinkle')
    arp(T('L039'), T1('L042-L043'), ['C', 'G', 'Am', 'F', 'C', 'G', 'C', 'G'], 96, 'harpsichord', .2, (0, 2, 3, 4, 3, 2, 3, 2), 2, .15)
    bass(T('L039'), T1('L042-L043'), ['C', 'G', 'Am', 'F', 'C', 'G', 'C', 'G'], 96, 'cellos_pizz', .25, (0, None, None, None))
    for w0 in W('L043', ['delicious!"']): sting(w0, 'twinkle')
    mel(T('L044', .1), [(0, 'E3', .5), (1, 'G3', .5), (2, 'A#3', .5), (3, 'A3', 1)], 100, 'bassoon_stac', .38)                          # sneaky
    mel(T('L045', .1), [(0, 'E3', .5), (1, 'G3', .5), (2, 'B3', .5), (3, 'E4', .5)], 100, 'bassoon_stac', .36)
    sting(T('L045', .6), 'pluck'); sting(T('L046[1:6]', .4), 'gliss'); pad(T('L046[1:6]'), T1('L046[1:6]'), ['C', 'F'], 80, 'violins', .12, .2, (2, 3))
    sting(T('L046[7:]', .55), 'twinkle'); sting(T('L047', .5), 'gliss'); pad(T('L047'), T1('L047'), ['F', 'C'], 70, 'violas', .14)
    for k in ['L048[1:3]', 'L052[1:4]']: sting(T(k, .05), 'gliss')
    arp(T('L048[4:]'), T1('L051'), ['C', 'G', 'F', 'C'], 104, 'harpsichord', .2, (0, 2, 3, 4, 3, 2, 3, 2), 2, .15)
    for w0 in W('L051', ['delicious!"']): sting(w0, 'twinkle')
    arp(T('L052[5:]'), T1('L054'), ['G', 'D', 'C', 'G'], 104, 'harpsichord', .2, (0, 2, 3, 4, 3, 2, 3, 2), 2, .15)
    sting(T('L054', .2), 'surprise')
    pad(T('L055'), T1('L055'), ['C'], 60, 'violins', .16, .2, (2, 3, 4), 1.4); pad(T('L055'), T1('L055'), ['C'], 60, 'cellos', .16, -.2, (0,), 1.2)
    mel(T('L056-L057', .2), [(0, 'E3', .5), (1, 'G3', .5), (2, 'B3', .5), (3, 'E4', 1)], 96, 'bassoon_stac', .36)
    for w0 in W('L057', ['plan']): sting(w0, 'twinkle')
part2()
SECTIONS_DONE = ['opening', 'part1', 'part2']
def score(): return EV
