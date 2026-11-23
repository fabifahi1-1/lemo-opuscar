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

from cues_words import W
def part3():
    # a village morning: marimba and pizzicato, a little bustle
    t0, t1 = T('L058[1:9]'), T1('L058[10:]')
    arp(t0, t1, ['C', 'F', 'G', 'C'], 100, 'marimba', .24, (0, 2, 3, 2, 4, 2, 3, 2), 2, .15)
    bass(t0, t1, ['C', 'F', 'G', 'C'], 100, 'cellos_pizz', .26, (0, None, 1, None))
    mel(t0 + .4, [(0, 'E5', 1), (1, 'G5', 1), (2, 'C6', 2), (4, 'B5', 1), (5, 'A5', 1), (6, 'G5', 2), (8, 'F5', 1), (9, 'A5', 1), (10, 'G5', 2)], 100, 'flute', .22, .2, t1=t1)
    for w0 in W('L059', ['Ding-ding-ding!']):
        for i in range(3): ev(w0 + i * .2, 'tubular_bells', ['G5', 'E5', 'C5'][i], 1.2, .3, .2)
    pad(T('L060[1:5]'), T1('L060[6:]'), ['C', 'G'], 90, 'violas', .12)
    sting(T('L060[6:]', .3), 'pluck'); sting(T('L061', .5), 'twinkle')
    ev(T('L061', .5), 'violins', 'G4', 2.0, .16, .2, .6); ev(T('L061', .5), 'violins', 'D5', 2.0, .14, .25, .6)
    mel(T('L062', .2), [(0, 'C4', .5), (.5, 'E4', .5), (1, 'G4', .5), (1.5, 'C5', 1.5)], 110, 'horn', .24, -.1)
    # he runs home: fast pizzicato, 160 bpm
    t0, t1 = T('L063[1:5]'), T1('L063[6:]'); bass(t0, t1, ['C', 'G'], 160, 'cellos_pizz', .4, (0, 1, 0, 1))
    arp(t0, t1, ['C', 'G'], 160, 'violins_pizz', .22, (2, 3, 4, 3), 2, .2)
    sting(T1('L063[6:]', -.25), 'pluck')
part3()
def part4():
    t0 = T('L064'); arp(t0, T1('L068'), ['G', 'C', 'D', 'G'], 92, 'harp', .2, (0, 2, 3, 4), 2, .2)
    mel(T('L065-L066', 1.6), [(0, 'D5', .5), (.5, 'E5', 1)], 92, 'clarinet_stac', .25, .1)             # "Why?"
    for w0 in W('L067', ['"Trust']): ev(w0 - .1, 'bassoon_stac', 'G2', .3, .35, -.1)
    mel(T('L068', .2), [(0, 'E4', .5), (.5, 'D#4', .5), (1, 'E4', 1)], 92, 'clarinet', .2, .1)          # cold?
    sting(T('L069', .02), 'surprise')
    sting(T('L070', .1), 'bwomp')
    for i in range(8): ev(T('L071', .2 + i * .22), 'clarinet_stac', ['E4', 'D#4'][i % 2], .15, .22, .1)  # shivering
    mel(T('L072', .2), [(0, 'E3', .5), (1, 'G3', .5), (2, 'A#3', .5), (3, 'A3', .5), (4, 'E3', .5), (5, 'G3', .5), (6, 'B3', 1)], 112, 'bassoon_stac', .36)   # sneaky
    t0, t1 = T('L073[1:6]'), T1('L073[7:]'); bass(t0, t1, ['G', 'D'], 150, 'cellos_pizz', .36, (0, 1, 0, 1)); arp(t0, t1, ['G', 'D'], 150, 'violins_pizz', .2, (2, 3), 1, .2)
    # the royal carriage: a little fanfare
    for i, p in enumerate(['C4', 'E4', 'G4', 'C5']): ev(T('L074', .3 + i * .18), 'horn', p, .5 if i < 3 else 1.4, .26, -.1)
    pad(T('L074'), T1('L074'), ['C', 'G'], 100, 'violins', .1, .2, (2, 3))
    sting(T('L075', .2), 'surprise'); mel(T('L076', .1), [(0, 'E5', .25), (.5, 'D5', .25), (1, 'C5', .25), (1.5, 'B4', .25)], 140, 'xylophone', .28, .2)
    sting(T('L077', .1), 'pluck')
    arp(T('L078'), T1('L079-L080'), ['C', 'G', 'F', 'C'], 104, 'harpsichord', .18, (0, 2, 3, 4, 3, 2, 3, 2), 2, .15)
    t0, t1 = T('L081'), T1('L081'); bass(t0, t1, ['C', 'G'], 140, 'cellos_pizz', .32, (0, 1, 0, 1)); arp(t0, t1, ['C', 'G'], 140, 'violins_pizz', .18, (2, 3), 1, .2)
    for k, w in [('L082', 'jacket,'), ('L082', 'pants,'), ('L082', 'shoes.')]:
        for w0 in W(k, [w]): ev(w0, 'glockenspiel', 'G5', .6, .26, .2); ev(w0 + .06, 'glockenspiel', 'D6', .6, .2, .25)
    sting(T('L083', .2), 'gliss'); pad(T('L083'), T1('L084'), ['F', 'C', 'G'], 70, 'violins', .14, .2, (2, 3), 1.2)
    mel(T('L083', .5), [(0, 'A5', 1), (1, 'G5', 1), (2, 'E5', 2), (4, 'F5', 1), (5, 'E5', 1), (6, 'C5', 2)], 70, 'flute', .2, .2)
    sting(T('L084', .4), 'twinkle')
    pad(T('L085'), T1('L086'), ['C', 'F', 'G', 'C'], 90, 'violas', .14); arp(T('L085'), T1('L086'), ['C', 'F', 'G', 'C'], 90, 'harp', .18, (0, 2, 3, 4), 2, .2)
    mel(T('L087[1:6]', .2), [(0, 'E3', .5), (1, 'G3', .5), (2, 'B3', .5), (3, 'C4', .5), (4, 'E3', .5), (5, 'G3', .5), (6, 'D4', 1)], 104, 'bassoon_stac', .32)
    mel(T('L087[7:]', .2), [(0, 'G4', .5), (1, 'E4', .5), (2, 'C4', 1)], 104, 'clarinet_stac', .24)
part4()

def part5():
    pad(T('L088'), T1('L088'), ['G', 'C'], 80, 'violins', .12, .2, (2, 3)); arp(T('L088'), T1('L088'), ['G', 'C'], 80, 'harp', .18, (0, 2, 3, 4), 2, .2)
    sting(T('L089', .3), 'gliss'); pad(T('L089'), T1('L089'), ['C', 'G'], 80, 'violas', .12)
    mel(T('L090', .2), [(0, 'E3', .5), (1, 'G3', .5), (2, 'B3', .5), (3, 'E4', 1)], 100, 'bassoon_stac', .32); sting(T('L090', 2.6), 'pluck')
    t0, t1 = T('L091'), T1('L092'); bass(t0, t1, ['G', 'D'], 160, 'cellos_pizz', .36, (0, 1, 0, 1)); arp(t0, t1, ['G', 'D'], 160, 'violins_pizz', .2, (2, 3, 4, 3), 2, .2)
    # the farmland: a bright marimba tune
    t0, t1 = T('L093[1:9]'), T1('L093[1:9]'); arp(t0, t1, ['G', 'C', 'D', 'G'], 108, 'marimba', .22, (0, 2, 3, 2, 4, 2, 3, 2), 2, .15)
    mel(t0 + .3, [(0, 'B4', 1), (1, 'D5', 1), (2, 'G5', 2), (4, 'E5', 1), (5, 'D5', 1), (6, 'B4', 2)], 108, 'flute', .22, .2, t1=t1)
    ev(T('L093[10:14]', .1), 'cellos', 'C2', 2.2, .3, -.1, .3); ev(T('L093[10:14]', .1), 'contrabass_pizz', 'C2', .6, .4, -.1); ev(T('L093[10:14]', .1), 'timpani', 'C2', 1.6, .35, 0)
    mel(T('L093[15:]', .3), [(0, 'D4', 1), (1, 'C#4', 1), (2, 'C4', 2)], 80, 'clarinet', .2)
    t0, t1 = T('L094'), T1('L095[5:]'); arp(t0, t1, ['C', 'F', 'G', 'C'], 100, 'marimba', .2, (0, 2, 3, 2), 2, .15); bass(t0, t1, ['C', 'F', 'G', 'C'], 100, 'cellos_pizz', .24, (0, None, 1, None))
    t0, t1 = T('L096[1:9]'), T1('L096[10:]'); arp(t0, t1, ['G', 'C', 'D', 'G'], 108, 'marimba', .2, (0, 2, 3, 2), 2, .15)
    mel(T('L097', .2), [(0, 'E3', .5), (1, 'G3', .5), (2, 'A#3', .5), (3, 'A3', 1), (4, 'E3', .5), (5, 'G3', .5), (6, 'B3', 1)], 96, 'bassoon_stac', .3)
    pad(T('L098[1:8]'), T1('L098[9:]'), ['C', 'G', 'Am', 'G'], 80, 'violas', .14)
    sting(T('L099', .05), 'surprise'); chime(T('L099', .3), ('G5', 'B5', 'D6', 'G6'), .08)
    # the king's questions: one little harpsichord theme under the whole game
    t0, t1 = T('L100'), T1('L115'); arp(t0, t1, ['G', 'C', 'D', 'G', 'Em', 'C', 'D', 'G'], 100, 'harpsichord', .17, (0, 2, 3, 4, 3, 2, 3, 2), 2, .15)
    bass(t0, t1, ['G', 'C', 'D', 'G', 'Em', 'C', 'D', 'G'], 100, 'cellos_pizz', .2, (0, None, None, None))
    for k in ['L102[9:]', 'L105[9:]', 'L114']: sting(T(k, .1), 'twinkle')
    for w0 in W('L109', ['um..."']): mel(w0, [(0, 'E4', .25), (.5, 'D#4', .25), (1, 'E4', .25)], 120, 'clarinet_stac', .25)
    sting(T('L110', 1.0), 'pluck'); sting(T('L113', .2), 'gliss')
    mel(T('L115', .3), [(0, 'D4', .5), (.75, 'C#4', .5), (1.5, 'D4', 1)], 100, 'bassoon_stac', .3)
part5()
def part6():
    ev(T('L116', .1), 'violas', 'G3', 2.8, .14, -.1, .8)
    t0, t1 = T('L117[1:4]'), T1('L117[5:]'); bass(t0, t1, ['G', 'D'], 160, 'cellos_pizz', .34, (0, 1, 0, 1)); arp(t0, t1, ['G', 'D'], 160, 'violins_pizz', .18, (2, 3, 4, 3), 2, .2)
    ev(T('L118', .3), 'cellos', 'E2', 3.0, .14, -.1, 1.0)                                                    # the music drops away
    ev(T('L119', .2), 'violas', 'E3', 3.0, .16, -.1, .8); ev(T('L119', 1.6), 'bassoon', 'E2', .5, .35, 0)    # the gulp
    # the castle: a low drone and a slow horn
    pad(T('L120[1:5]'), T1('L122[1:12]'), ['Em', 'C', 'Em', 'Am'], 64, 'cellos', .18, -.2, (0, 1), 1.2)
    mel(T('L120[1:5]', .3), [(0, 'E3', 2), (2, 'B3', 2), (4, 'C4', 3)], 64, 'horn', .2, -.1)
    ev(T('L122[13:17]', .1), 'timpani', 'E2', 1.8, .4, 0)
    mel(T('L123', .2), [(0, 'E5', .5), (1, 'D5', .5), (2, 'E5', .5), (3, 'B4', 1)], 96, 'flute_stac', .2, .2)
    mel(T('L124', .1), [(0, 'E3', .5), (1, 'G3', .5), (2, 'B3', .5), (3, 'D4', .5), (4, 'E4', 1)], 100, 'bassoon_stac', .3)
    for i, k in enumerate(['L125', 'L126', 'L127', 'L128', 'L129']): ev(T(k, .05), 'contrabass_pizz', ['E2', 'F2', 'F#2', 'G2', 'G#2'][i], .4, .3 + i * .05, -.1)
    # the doorbell's silly tune
    t0 = T('L132[1:6]', .1); mel(t0, [(0, 'C6', .5), (.5, 'E6', .5), (1, 'G6', .5), (1.5, 'E6', .5), (2, 'C6', .5), (2.5, 'E6', .5), (3, 'G6', 1), (4, 'A6', .5), (4.5, 'G6', .5), (5, 'E6', .5), (5.5, 'C6', .5), (6, 'D6', 1), (7, 'C6', 2)], 132, 'glockenspiel', .3, .2)
    for w0 in W('L132', ['Ding-a-ling-a-ling!']): mel(w0, [(0, 'C6', .5), (.5, 'E6', .5), (1, 'G6', .5), (1.5, 'C7', 1)], 150, 'glockenspiel', .32, .25)
    arp(T('L132[7:]'), T1('L133'), ['C', 'G'], 132, 'marimba', .16, (0, 2, 3, 2), 2, .15)
    ev(T('L134', .3), 'bassoon', 'E2', 2.0, .36, -.1, .2); ev(T('L134', .3), 'cellos', 'E2', 2.6, .22, -.2, .4)
    pad(T('L135'), T1('L137'), ['C', 'G'], 90, 'violas', .12); mel(T('L136', .2), [(0, 'G4', .5), (.5, 'A4', .5), (1, 'B4', 1)], 90, 'clarinet', .18)
    for w0 in W('L139', ['ROAR!']): ev(w0, 'timpani', 'C2', 1.4, .45, 0); ev(w0, 'horn', 'C3', 1.0, .3, -.1); ev(w0 + .05, 'horn', 'F#3', 1.0, .26, .1)
    sting(T('L140', .3), 'down')
    for w0 in W('L141', ['"EEEK!"']): [ev(w0 + i * .04, 'xylophone', p, .2, .4, .1) for i, p in enumerate(['C6', 'B5', 'C6', 'B5', 'C6'])]
    for w0 in W('L144', ['Slide,', 'slide,', 'slide!']): [ev(w0 + i * .05, 'xylophone', p, .2, .3, .1) for i, p in enumerate(['G5', 'E5', 'C5'])]
    mel(T('L145', .4), [(0, 'C5', .5), (.5, 'E5', .5), (1, 'G5', 1.5)], 100, 'horn', .18, -.1); sting(T('L145', 2.6), 'twinkle')
    sting(T('L146[1:6]', .7), 'gliss')
part6()
def part7():
    arp(T('L147'), T1('L151'), ['C', 'F', 'G', 'C'], 100, 'harpsichord', .16, (0, 2, 3, 4, 3, 2, 3, 2), 2, .15)
    mel(T('L149-L150', 2.2), [(0, 'C6', .25), (.5, 'E6', .25), (1, 'G6', .5)], 120, 'glockenspiel', .24, .2)       # "tiny"
    ev(T('L152-L153', .1), 'bassoon', 'F2', .6, .4, -.1); ev(T('L152-L153', .8), 'bassoon', 'C2', .8, .4, -.1)
    for w0 in W('L154', ['POOF!']): sting(w0, 'gliss')
    mel(T('L155', .5), [(0, 'C6', .25), (.5, 'D6', .25), (1, 'E6', .5)], 120, 'xylophone', .26, .2)
    for w0 in W('L156', ['"BOO!"']): sting(w0 - .05, 'surprise')
    t0, t1 = T('L158[1:6]'), T1('L158[7:10]'); [ev(t0 + i * .09, 'xylophone', ['C6', 'G5', 'E5', 'C5'][i % 4], .12, .24, .1) for i in range(int((t1 - t0) / .09))]
    ev(T('L158[11:]', .2), 'violins', 'E4', 2.4, .1, .2, 1.0)
    ev(T('L161', .1), 'harp', 'C5', 2.0, .2, .2); ev(T('L161', .5), 'harp', 'G4', 2.0, .16, .2)
    sting(T('L162', .3), 'gliss')
    t0, t1 = T('L163[1:5]'), T1('L163[6:]'); bass(t0, t1, ['C', 'G'], 150, 'cellos_pizz', .3, (0, 1, 0, 1)); arp(t0, t1, ['C', 'G'], 150, 'violins_pizz', .16, (2, 3), 1, .2)
    for i, p in enumerate(['C4', 'E4', 'G4', 'C5']): ev(T('L164[1:9]', .2 + i * .2), 'horn', p, .5 if i < 3 else 1.6, .26, -.1)
    pad(T('L164[1:9]'), T1('L165[1:6]'), ['C', 'F', 'G', 'C'], 90, 'violins', .12, .2, (2, 3))
    pad(T('L165[7:]'), T1('L165[7:]'), ['Em'], 60, 'cellos', .16, -.2, (0, 1), 1.0)
    # the truth: soft piano and strings
    pad(T('L166'), T1('L173'), ['Am', 'F', 'C', 'G'], 70, 'violas', .12)
    arp(T('L169'), T1('L171-L172'), ['Am', 'F', 'C', 'G'], 70, 'upright', .16, (0, 2, 3, 4), 2, -.1)
    for i in range(6): ev(T('L174', .2 + i * .22), 'bassoon_stac', ['G3', 'E3'][i % 2], .15, .32, -.1)           # the king's chuckle
    pad(T('L175[1:7]'), T1('L180'), ['C', 'G', 'Am', 'F'], 76, 'violins', .12, .2, (2, 3)); arp(T('L175[1:7]'), T1('L180'), ['C', 'G', 'Am', 'F'], 76, 'harp', .16, (0, 2, 3, 4), 2, .2)
    sting(T('L180', .3), 'twinkle')
    # "Yes, please!": the warm music swells
    pad(T('L181'), T1('L181', .8), ['C', 'G'], 80, 'violins', .2, .2, (2, 3, 4), .4); pad(T('L181'), T1('L181', .8), ['C', 'G'], 80, 'cellos', .18, -.2, (0, 1), .4)
    mel(T('L181', .5), [(0, 'E5', 1), (1, 'G5', 1), (2, 'C6', 2)], 80, 'flute', .26, .2); chime(T('L181', 1.6), ('C6', 'E6', 'G6', 'C7'), .1)
part7()
def part8():
    t0, t1 = T('L182[1:2]'), T1('L183'); pad(t0, t1, ['G', 'Em', 'C', 'D'], 72, 'violas', .14); arp(t0, t1, ['G', 'Em', 'C', 'D'], 72, 'harp', .18, (0, 2, 3, 4), 2, .2)
    # the bread breaks again: the hook's strings
    t0 = T('L184[1:5]'); ev(t0 + .2, 'violas', 'G3', 5.4, .2, -.1, 1.2); ev(t0 + .6, 'violins', 'D4', 5.0, .18, .2, 1.4); ev(t0 + 1.05, 'harp', 'G4', 1.6, .3, .2)
    arp(T('L184[6:]'), T1('L186-L187'), ['C', 'G', 'Am', 'G'], 84, 'harp', .2, (0, 2, 3, 4), 2, .25)
    mel(T('L184[6:]', .3), [(0, 'B4', 1), (1, 'D5', 1), (2, 'G5', 2), (4, 'A5', 1), (5, 'G5', 1), (6, 'E5', 2), (8, 'D5', 2)], 84, 'flute', .22, .2)
    sting(T('L186-L187', 2.6), 'twinkle')
    pad(T('L188'), T1('L189'), ['C', 'F', 'G', 'C'], 76, 'violins', .14, .2, (2, 3)); arp(T('L188'), T1('L189'), ['C', 'F', 'G', 'C'], 76, 'upright', .16, (0, 2, 3, 4), 2, -.1)
    ev(T('L189', .3), 'glockenspiel', 'D6', .8, .26, .2)
    t0, t1 = T('L190[1:8]'), T1('L190[9:]'); bass(t0, t1, ['G', 'C', 'D', 'G'], 120, 'cellos_pizz', .3, (0, None, 1, None)); mel(t0 + .2, [(0, 'G4', .5), (.5, 'B4', .5), (1, 'D5', 1), (2, 'C5', .5), (2.5, 'B4', .5), (3, 'A4', 1), (4, 'G4', .5), (4.5, 'B4', .5), (5, 'D5', 1), (6, 'G5', 2), (8, 'F#5', .5), (8.5, 'E5', .5), (9, 'D5', 1), (10, 'G4', 2)], 120, 'clarinet_stac', .26, .15, t1=t1)
    # the lullaby
    mel(T('L191', .1), [(0, 'D5', 1), (1, 'B4', 1), (2, 'G4', 2), (4, 'A4', 1), (5, 'B4', 1)], 66, 'glockenspiel', .2, .2)
    # the warm theme to the moral, then the end screen: the opening theme again
    t0, t1 = T('L192[1:8]'), T1('L193[5:]'); pad(t0, t1, ['G', 'Em', 'C', 'D', 'G'], 72, 'violas', .16); pad(t0, t1, ['G', 'Em', 'C', 'D', 'G'], 72, 'violins', .12, .2, (2, 3))
    arp(t0, t1, ['G', 'Em', 'C', 'D', 'G'], 72, 'harp', .18, (0, 2, 3, 4, 3, 2, 3, 2), 2, .2)
    mel(t0 + .2, [(0, 'B4', 1), (1, 'D5', 1), (2, 'G5', 2), (4, 'F#5', 1), (5, 'E5', 1), (6, 'D5', 2), (8, 'E5', 1), (9, 'D5', 1), (10, 'B4', 2), (12, 'C5', 1), (13, 'B4', 1), (14, 'A4', 2), (16, 'G4', 4)], 72, 'flute', .24, .2, t1=t1)
    ev(T('L193[1:4]', .1), 'cellos', 'G2', 7.0, .18, -.2, 1.0)
    e0 = T('end'); B = 60 / 84
    for k in range(3):
        for b, p, d in [(0, 'B4', 1), (1, 'D5', 1), (2, 'G5', 2), (4, 'F#5', 1), (5, 'E5', 1), (6, 'D5', 2)]: ev(e0 + .4 + k * 8 * B + b * B, 'glockenspiel' if k != 1 else 'flute', p, d * B, .34 if k != 1 else .22, .1)
    arp(e0, e0 + 14.6, ['G', 'D', 'Em', 'C'], 84, 'upright', .24, (0, 2, 3, 4, 3, 2, 3, 2), 2, -.15)
    pad(e0, e0 + 14.6, ['G', 'D', 'Em', 'C'], 84, 'violas', .2); ev(e0 + 11.4, 'harp', 'G5', 3.0, .3, .2); ev(e0 + 11.5, 'harp', 'D6', 3.0, .24, .25)
part8()
SECTIONS_DONE = ['opening', 'part1', 'part2', 'part3', 'part4', 'part5', 'part6', 'part7', 'part8']
def score(): return EV
