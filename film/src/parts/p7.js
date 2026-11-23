// PART 7: the mouse trick, the empty castle, the carriage arrives, the truth. The truth scene is close-ups in the courtyard:
// Tom on the left, the king and the princess on the right (they have stepped down from the carriage), Puss by Tom's feet.
import { S, rigFor, blink } from '../kit/stage.js';
import { word, bubble, thought, sparkle, puffs, poof, sweat, speedLines, shiver, steam, mark } from '../kit/fx.js';
import * as PR from '../kit/props.js';
import { HILL, GY, carriage } from '../kit/sets.js';
import { OGRE, OG, HALL, HL } from '../kit/sets2.js';
import { Layer } from '../engine.js';
import { clamp, lerp, ss, eio, seg, back, TAU } from '../lib.js';
import { wt, aim, atS } from './util.js';

const puss = (c, o) => c.actor('puss', { who: 'Puss', ...o });
const pussHead = (x, y, s = .37) => [x, y - s * 380];
const F = OG.floor, D = 2.0, HEADY = 455;
const ogreS = 3.2, ogreHead = x => [x + 20, F + 20 - 364 * ogreS];
const ogre = (c, x, pose = {}, o = {}) => c.actor('ogre', { x, y: F + 20, d: 2.05, z: 3.4, s: ogreS, who: 'Ogre', face: 'L', ...o, pose: { lookX: .8, lookY: .4, ...pose } });
const yard = c => c.set(OGRE);
// the courtyard cast for the truth scene
const TOM = [-160, F + 30], KING = [260, F + 30], PRIN = [470, F + 40], PUSS = [-420, F + 50];
const tom = (c, pose = {}, o = {}) => c.actor('tomJ', { x: TOM[0], y: TOM[1], d: D, z: 4, who: 'Tom', face: 'R', ...o, pose: { lookX: .8, ...pose } });
const king = (c, pose = {}, o = {}) => c.actor('king', { x: KING[0], y: KING[1], d: D, z: 3.9, who: 'King', face: 'L', ...o, pose: { lookX: .8, ...pose } });
const princess = (c, pose = {}, o = {}) => c.actor('princess', { x: PRIN[0], y: PRIN[1], d: D, z: 3.8, who: 'Princess', face: 'L', ...o, pose: { lookX: .8, ...pose } });
const pussY = (c, pose = {}, o = {}) => puss(c, { x: PUSS[0], y: PUSS[1], d: D, z: 4.2, face: 'R', ...o, pose: { lookX: .6, lookY: -.6, ...pose } });
const carParked = c => carriage(c, -1050, F + 60, { d: 2.15, s: .95, still: true, roll: 0, z: 3.0 });
const CU = (c, x, y, z = 3.0, fx = .5, to = {}) => aim(c, x, y - HEADY, D, z, fx, .42, { dz: .07, ...to });
// the king in the carriage window (as in Part 5), now at the castle gate
const kingIn = (pose = {}) => ({ kind: 'king:seat', dx: 100, who: 'King', face: 'R', pose: { lookX: .9, lookY: .1, lift: 30, ...pose } });
const princessIn = (pose = {}) => ({ kind: 'princess:seat', dx: -80, dy: -48, who: 'Princess', face: 'R', pose: { lookX: .8, mouth: 'smile', smile: .6, ...pose } });
function KW(c, pose = {}) { yard(c); const X = -700, Y = F + 60; carriage(c, X, Y, { d: 2.1, s: .95, still: true, roll: 0, horses: false, pass: [kingIn(pose), princessIn()] }); aim(c, X + 105, Y - 300, 2.1, 3.2, .44, .45, { dz: .07 }); }

export const P7 = {
  // Puss flatters the ogre, clapping: "Very impressive!"
  'L147': S(c => {
    yard(c); ogre(c, 200, { lookX: .5, lookY: .9, mouth: 'grin', brow: .3, armN: { x: 80, y: -60 } });
    const cl = Math.abs(Math.sin(c.t * 9));
    puss(c, { x: -150, y: F + 40, d: D, z: 4, face: 'R', pose: { lookX: .6, lookY: -1, mouth: 'grin', eyes: 'happy', armF: { x: 30 + 20 * cl, y: -170 }, armB: { x: 30 - 10 * cl, y: -170 }, pawF: 'open', pawB: 'open' } });
    aim(c, 0, F - 300, D, 1.2, .5, .55, { dz: .06 });
  }),
  // Puss, sly: "But anyone can be big."
  'L148': S(c => { yard(c); puss(c, { x: -150, y: F + 40, d: D, z: 4, face: 'R', pose: { lookX: .6, lookY: -1, eyes: 'half', mouth: 'smirk', browL: .5, armF: { x: 60, y: -200 }, pawF: 'point' } }); const [hx, hy] = pussHead(-150, F + 40); aim(c, hx, hy, D, 4.2, .45, .45, { dz: .07 }); }),
  // a paw gesture for "tiny": "Can you be tiny? Like a mouse?"
  'L149-L150': S(c => {
    yard(c); ogre(c, 200, { lookX: .5, lookY: .9, brow: .4, browTilt: .4, mouth: 'closed' });
    const sq = ss(seg(c.t, .3, .8)); puss(c, { x: -150, y: F + 40, d: D, z: 4, face: 'R', pose: { lookX: .6, lookY: -1, eyes: 'open', mouth: 'smile', armF: { x: 70 - 20 * sq, y: -190 }, armB: { x: 70 + 10 * sq, y: -190 }, pawF: 'point', pawB: 'point', headTilt: .08 } });
    aim(c, -40, F - 160, D, 2.0, .5, .5, { dz: .06 });
    const [m0] = wt('L150', 'mouse?"'); c.fx(thought(-120, F - 200, m0 - c.shot.t0 - .3, c.dur, (g, w, h) => { const r = rigFor('mouse', 3); r.pose(c.T, { lookX: .6 }); const sh = r.dyn, k = h * .6 / 160; g.drawImage(sh.c, -sh.ax / sh.res * k, -sh.ay / sh.res * k + h * .25, sh.c.width / sh.res * k, sh.c.height / sh.res * k); }, { size: .5, w: 300, h: 210 }));
  }),
  // Puss shrugs: "That is probably too hard."
  'L151': S(c => { yard(c); const sh = Math.sin(clamp((c.t - .2) / 1.2) * Math.PI); puss(c, { x: -150, y: F + 40, d: D, z: 4, face: 'R', pose: { lookX: .2, lookY: -.4, eyes: 'half', mouth: 'smirk', armF: { x: 70, y: -160 - 30 * sh }, armB: { x: -40, y: -160 - 30 * sh }, pawF: 'open', pawB: 'open', lift: 5 * sh, headTilt: -.08 } }); const [hx, hy] = pussHead(-150, F + 40); aim(c, hx + 20, hy + 20, D, 3.4, .45, .45, { dz: .07 }); }),
  // low angle: the ogre puffs up, offended: "Too hard? Watch this!"
  'L152-L153': S(c => {
    yard(c); const pf = ss(seg(c.t, .1, .5)); ogre(c, 200, { lookX: .2, lookY: .5, brow: -.6, browTilt: .8, mouth: 'grin', blush: .7 * pf, lift: 10 * pf, armN: { x: 120, y: -40 } }, { s: ogreS * (1 + .04 * pf) });
    const [hx, hy] = ogreHead(200); aim(c, hx, hy + 80, 2.05, 1.5, .5, .4, { dz: .06 });
    c.fx(steam(hx - 140, hy - 140, .3, c.dur, { d: 2.05 }), steam(hx + 160, hy - 140, .4, c.dur, { d: 2.05 }));
  }),
  // POOF! smoke fills the frame (a small shake)
  'L154': S(c => {
    yard(c); const [p0] = wt('L154', 'POOF!'), tp = p0 - c.shot.t0 - .1;
    if (c.t < tp + .25) ogre(c, 200, { lookX: .2, lookY: .5, eyes: 'happy', mouth: 'grin' });
    else c.actor('mouse', { x: 200, y: F + 20, d: 2.05, z: 3.4, s: 1.25, face: 'L', who: 'Mouse', pose: { lookX: .5, lookY: -.5 } });
    c.cam({ zoom: .7, x: 100, y: F - 520 }, { zoom: .74, x: 100, y: F - 520, dz: 0 });
    c.fx(poof(200, F - 450, tp, { size: 900, dur: 1.2 })); c.fx(word('POOF!', 120, F - 900, tp, { size: 110, hold: .6, col: '#f0e8ff' })); c.shake(tp, .3, 3);
  }),
  // high angle: where the ogre stood is a tiny mouse
  'L155': S(c => {
    yard(c); c.actor('mouse', { x: 200, y: F + 20, d: 2.05, z: 3.4, s: 1.25, face: 'L', who: 'Mouse', pose: { lookX: .5, lookY: -.6, earFlop: .2 } });
    puss(c, { x: -150, y: F + 40, d: D, z: 4, face: 'R', pose: { lookX: .8, lookY: .5, eyes: 'half', mouth: 'smirk' } });
    aim(c, 40, F - 60, D, 2.0, .5, .55, { dz: .06 });
  }),
  // COMIC SNAP-ZOOM on Puss: "BOO!"
  'L156': S(c => {
    yard(c); const [b0, b1] = wt('L156', '"BOO!"'), tb = b0 - c.shot.t0, up = ss(seg(c.t, tb - .15, tb + .1));
    puss(c, { x: -150, y: F + 40, d: D, z: 4, face: 'R', pose: { lookX: .8, lookY: .3, eyes: up > .5 ? 'wide' : 'half', mouth: up > .5 ? 'grin' : 'smirk', armF: { x: 60, y: -170 - 60 * up }, armB: { x: 50, y: -170 - 60 * up }, pawF: 'open', pawB: 'open', puff: .3 * up, lean: .1 * up } });
    const [hx, hy] = pussHead(-150, F + 40); aim(c, hx, hy, D, 2.8, .45, .45, { dz: .02 }); c.snap(tb - .05, 6, .5); c.shake(tb, .3, 3);
    const [bx, by] = atS(c, .7, .3); c.fx(bubble('BOO!', bx, by, tb, b1 - c.shot.t0 + .8, { kind: 'shout', size: 90, tail: [-.9, 1] }));
  }),
  // the mouse: "SQUEAK!"
  'L157': S(c => {
    yard(c); c.actor('mouse', { x: 200, y: F + 20, d: 2.05, z: 3.4, s: 1.25, face: 'L', who: 'Mouse', pose: { lookX: -.5, lookY: -.3, eyes: 'open', lift: 6 * Math.abs(Math.sin(c.t * 30)) } });
    aim(c, 170, F - 30, 2.05, 6.0, .5, .55, { dz: .06 });
    const [s0, s1] = wt('L157', '"SQUEAK!"'); const [bx, by] = atS(c, .72, .3, 2.05); c.fx(bubble('SQUEAK!', bx, by, s0 - c.shot.t0, c.dur, { kind: 'shout', size: 64, tail: [-.9, 1], d: 2.05 }), shiver(200, F - 40, 0, c.dur, { w: 60, h: 50, d: 2.05 }));
  }),
  // the mouse zooms out of the courtyard, tiny running feet, motion lines
  'L158[1:6]': S(c => {
    yard(c); const x = 200 - c.t * 700; c.actor('mouse', { x, y: F + 40, d: D, z: 4, s: 1.25, face: 'L', who: 'Mouse', pose: { walk: c.t * 9, lookX: -1, earFlop: .4 } });
    puss(c, { x: -150, y: F + 40, d: D, z: 3.9, face: 'L', pose: { lookX: -.8, lookY: .3, mouth: 'grin', eyes: 'happy' } });
    c.cam({ zoom: 1.1, x: 0, y: F - 200 }, { zoom: 1.1, x: -900, y: F - 200, dz: .02 }, u => u);
    c.fx(speedLines(t => 200 - t * 700 + 40, () => F - 20, 0, c.dur, { dir: -1, n: 4, h: 50 }));
    for (let k = 0; k < 12; k++) c.fx(puffs(200 - k * .25 * 700, F + 30, k * .25, { n: 2, size: 9, dur: .4, seed: k }));
  }),
  // high and wide: the tiny mouse races down the hill
  'L158[7:10]': S(c => {
    c.set(HILL); c.hide('near'); const u = c.t / c.dur, x = lerp(-20, -240, u), y = lerp(300, 620, u);
    c.actor('mouse', { x, y, d: 3.4, z: 3, s: .6, face: 'L', who: 'Mouse', pose: { walk: c.t * 9, lookX: -1 } });
    c.cam({ zoom: .9, x: -100, y: 200 }, { zoom: .9, x: -160, y: 320, dz: .02 });
    c.fx(speedLines(t => lerp(-20, -240, t / c.dur) + 30, t => lerp(300, 620, t / c.dur) - 20, 0, c.dur, { dir: -1, n: 3, h: 30, d: 3.4 }));
  }),
  // in the doorway one fluffy pink slipper stays behind
  'L158[11:]': S(c => { c.set(HALL); c.layer(new Layer({ sheet: PR.slipper(3), x: HL.doorX + 40, y: HL.floor + 30, d: 2.25, z: 2.5, sx: 1.1, sy: 1.1, rot: -.05 })); aim(c, HL.doorX + 40, HL.floor - 150, 2.25, 1.8, .5, .5, { dz: .06 }); }),
  // the slipper alone on the floor; hold, quiet
  'L159': S(c => { c.set(HALL); c.layer(new Layer({ sheet: PR.slipper(3), x: HL.doorX + 40, y: HL.floor + 30, d: 2.25, z: 2.5, sx: 1.1, sy: 1.1, rot: -.05 })); aim(c, HL.doorX + 40, HL.floor - 30, 2.25, 4.2, .5, .5, { dz: .05 }); }),
  // Puss peeks around the doorway
  'L160': S(c => {
    c.set(HALL); const pk = ss(seg(c.t, .2, .8));
    puss(c, { x: HL.doorX - 60 + 90 * pk, y: HL.floor + 30, d: 2.3, z: 1.5, face: 'R', pose: { lookX: .9, lookY: -.3, lean: .25 * pk, earPerk: .6, eyes: 'open', wide: .3 } });
    c.layer(new Layer({ sheet: PR.slipper(3), x: HL.doorX + 40, y: HL.floor + 30, d: 2.25, z: 2.5, sx: 1.1, sy: 1.1, rot: -.05 }));
    aim(c, HL.doorX + 40, HL.floor - 160, 2.3, 2.4, .45, .5, { dz: .06 });
  }),
  // pull out to the huge empty hall
  'L161': S(c => { c.set(HALL); puss(c, { x: HL.doorX + 220, y: HL.floor + 40, d: 2.2, z: 2.4, face: 'R', pose: { lookX: .9, lookY: -.6 } }); c.cam({ zoom: 1.3, x: -650, y: 0 }, { zoom: .55, x: -100, y: -120, dz: 0 }); }),
  // tiny Puss alone in the hall; a thought bubble: a new owner (Tom with a little crown)
  'L162': S(c => {
    c.set(HALL); puss(c, { x: -200, y: HL.floor + 40, d: 2.2, z: 2.4, face: 'R', pose: { lookX: .5, lookY: -.7, eyes: 'half', mouth: 'smile' } });
    c.cam({ zoom: 1.1, x: -60, y: -40 }, { zoom: 1.1, x: -60, y: -60, dz: .06 });
    const [bx, by] = atS(c, .52, .55, 2.2);
    c.fx(thought(bx, by, .3, 3.0, (g, w, h) => { const r = rigFor('tomJ', 2); r.pose(c.T, { lookX: .3, mouth: 'smile', eyes: 'happy', blink: blink('Tom') }); const sh = r.dyn, k = h * .95 / 760; g.drawImage(sh.c, -sh.ax / sh.res * k, -sh.ay / sh.res * k + h * .48, sh.c.width / sh.res * k, sh.c.height / sh.res * k); g.fillStyle = '#e8b84a'; const cx = 6, cy = -h * .36; g.beginPath(); g.moveTo(cx - 22, cy); g.lineTo(cx - 22, cy - 18); g.lineTo(cx - 10, cy - 8); g.lineTo(cx, cy - 22); g.lineTo(cx + 10, cy - 8); g.lineTo(cx + 22, cy - 18); g.lineTo(cx + 22, cy); g.closePath(); g.fill(); }, { size: .7, w: 300, h: 260, d: 2.2 }));
  }),
  // Puss hurries to the gate
  'L163[1:5]': S(c => {
    yard(c); const x = 300 - c.t * 420; puss(c, { x, y: F + 40, d: D, z: 4, face: 'L', pose: { walk: c.t * 4, run: .8, lookX: -1 } });
    c.cam({ zoom: 1.2, x: 220, y: F - 230 }, { zoom: 1.2, x: 300 - 2.4 * 420 + 60, y: F - 230, dz: .02 }, u => u);
    for (let k = 0; k < 9; k++) c.fx(puffs(300 - k * .27 * 420, F + 30, k * .27, { n: 2, size: 12, dur: .45, seed: k }));
  }),
  // the royal carriage rolls up to the gate
  'L163[6:]': S(c => {
    yard(c); const x = lerp(-2300, -1050, eio(clamp(c.t / 2.9))); carriage(c, x, F + 60, { d: 2.15, s: .95, z: 3, roll: x / 120, phase: c.t * 2.4, pass: [kingIn(), princessIn()] });
    puss(c, { x: -420, y: F + 50, d: D, z: 4.2, face: 'L', pose: { lookX: -.9, lookY: -.3, mouth: 'smile' } });
    c.cam({ zoom: .55, x: -900, y: F - 560 }, { zoom: .55, x: -600, y: F - 560, dz: .02 });
    c.fx(puffs(x + 300, F + 50, 0, { n: 6, size: 20, dur: 2.9 }));
  }),
  // Puss bows with his arms wide before the castle: "Welcome to the castle of the Marquis of Carabas!"
  'L164[1:9]': S(c => {
    yard(c); const op = ss(seg(c.t, .1, .6)), b = Math.sin(clamp((c.t - 2.6) / 1.4) * Math.PI) * .6;
    puss(c, { x: -420, y: F + 50, d: D, z: 4.2, face: 'L', pose: { lookX: -.8, lookY: -.4, mouth: 'grin', eyes: 'open', chest: .6, armF: { x: -80 * op, y: -170 - 60 * op }, armB: { x: 80 * op, y: -170 - 60 * op }, pawF: 'open', pawB: 'open', bow: b } });
    aim(c, -380, F - 300, D, 1.5, .55, .5, { dz: .07 });
    c.fx(sparkle(-420, F - 200, .5, { n: 6, size: 16, spread: 90 }), sparkle(-420, F - 260, 2.2, { n: 5, size: 14, spread: 80 }));
  }),
  'L164[10:]': S(c => KW(c, { brow: .8, wide: .4, mouth: 'o' })),
  // Tom steps down from the carriage
  'L165[1:6]': S(c => {
    yard(c); carParked(c); const u = ss(seg(c.t, .2, 2.0));
    tom(c, { walk: u < 1 ? c.t * 2.4 : null, lookX: .6, lookY: -.3, mouth: 'smile', smile: .3 }, { x: lerp(-850, -300, u), y: lerp(F - 20, F + 30, ss(seg(c.t, .2, .7))) });
    pussY(c, { lookX: -.6 });
    c.cam({ zoom: .9, x: -760, y: F - 360 }, { zoom: .9, x: -420, y: F - 360, dz: .03 });
  }),
  // Tom's view: the huge castle towers over him; tilt up
  'L165[7:]': S(c => { yard(c); tom(c, { lookX: .5, lookY: -1, mouth: 'o', wide: .4 }, { x: -300, z: 6, d: 1.7 }); c.cam({ zoom: .5, x: 100, y: F - 700 }, { zoom: .5, x: 100, y: F - 1250, dz: .02 }); }),
  // Tom worried
  'L166': S(c => { yard(c); tom(c, { lookX: .3, lookY: .4, brow: .5, browTilt: -.6, mouth: 'wobbly', wob: t => Math.sin(t * 7) }); CU(c, TOM[0], TOM[1], 3.0, .42); }),
  // cutaway: the king smiles trustingly in the carriage window
  'L167': S(c => KW(c, { eyes: 'happy', mouth: 'smile', smile: 1, nod: Math.sin(c.t * 2) * .2 })),
  // Tom takes a deep breath; his chest rises
  'L168': S(c => { yard(c); tom(c, { lookX: .4, lookY: .2, eyes: c.t > .5 && c.t < 1.6 ? 'happy' : 'open', brow: .4, browTilt: -.4, sigh: c.shot.t0 + .3, lift: 8 * Math.sin(clamp((c.t - .3) / 1.6) * Math.PI) }); CU(c, TOM[0], TOM[1], 2.6, .42); }),
  // Tom's confession: a slow push-in
  'L169': S(c => { yard(c); king(c, { lookX: .9, mouth: 'closed' }); tom(c, { lookX: .9, lookY: .1, brow: .5, browTilt: -.5, mouth: 'closed' }); CU(c, TOM[0], TOM[1], 2.4, .4, { dz: .16 }); }),
  // the king listens, steady and kind
  'L170': S(c => { yard(c); king(c, { lookX: .9, lookY: .1, mouth: 'closed', brow: .2, nod: Math.sin(c.t * 1.5) * .15 }); CU(c, KING[0], KING[1] - 40, 2.8, .55); }),
  'L171-L172': S(c => { yard(c); tom(c, { lookX: .9, lookY: .1, brow: .5, browTilt: -.4, armN: { x: 110, y: -110 }, handN: 'open' }); pussY(c, { lookX: .6, lookY: -1, earsDown: .5 }); CU(c, TOM[0], TOM[1], 2.4, .42, { dz: .1 }); }),
  // Puss covers his eyes with both paws and peeks through
  'L173': S(c => {
    yard(c); const pk = ss(seg(c.t, 2.0, 2.5)) * (1 - ss(seg(c.t, 3.0, 3.4)));
    pussY(c, { lookX: .5, lookY: -.3, earsDown: .8, mouth: 'wobbly', armF: { x: 30, y: -250 + 30 * pk }, armB: { x: 34, y: -250 }, pawF: 'open', pawB: 'open' });
    const [hx, hy] = pussHead(PUSS[0], PUSS[1]); aim(c, hx, hy, D, 4.2, .5, .45, { dz: .07 });
  }),
  // the king laughs, belly shaking, eyes squinting
  'L174': S(c => { yard(c); king(c, { lookX: .7, lookY: -.2, eyes: 'happy', mouth: 'grin', shake: 1, lift: Math.abs(Math.sin(c.t * 9)) * 6, armN: { x: 40, y: -60 }, handN: 'open' }); princess(c, { eyes: 'happy', mouth: 'smile' }); aim(c, 360, F - 320, D, 1.5, .45, .45, { dz: .06 }); c.fx(shiver(KING[0], KING[1] - 280, 0, c.dur, { w: 180, h: 160 })); }),
  'L175[1:7]': S(c => { yard(c); king(c, { lookX: .9, lookY: .1, eyes: 'open', mouth: 'smile', brow: .4, browTilt: .3, armN: { x: 120, y: -110 }, handN: 'point' }); CU(c, KING[0], KING[1] - 40, 2.8, .55); c.fx(sparkle(KING[0] - 50, KING[1] - HEADY - 60, 1.2, { n: 1, size: 20, spread: 2 })); }),
  // the princess hides a giggle
  'L175[8:]': S(c => { yard(c); princess(c, { lookX: .6, eyes: 'happy', mouth: 'smile', armN: { x: 40, y: -212 }, handN: 'open', shake: .6 }); CU(c, PRIN[0], PRIN[1] - 20, 3.0, .55); }),
  'L176[1:5]': S(c => { yard(c); tom(c, { lookX: .9, lookY: .1, eyes: 'open', wide: .5 * ss(seg(c.t, .4, .8)), brow: .6, mouth: 'o' }); CU(c, TOM[0], TOM[1], 3.0, .42); }),
  'L176[6:]': S(c => {
    yard(c); const pk = ss(seg(c.t, .3, .8));
    pussY(c, { lookX: .7, lookY: -.5, earsDown: .5 * (1 - pk), mouth: 'smile', armF: { x: 30 + 30 * pk, y: -250 + 20 * pk }, armB: { x: 34 - 20 * pk, y: -250 + 30 * pk }, pawF: 'open', pawB: 'open' });
    const [hx, hy] = pussHead(PUSS[0], PUSS[1]); aim(c, hx, hy, D, 4.2, .5, .45, { dz: .07 });
  }),
  'L177': S(c => { yard(c); king(c, { lookX: .9, lookY: .1, eyes: 'open', mouth: 'smile', smile: 1, brow: .3, armN: { x: 50, y: -120 }, handN: 'open' }); CU(c, KING[0], KING[1] - 40, 2.6, .55); }),
  // the king gestures to the princess: "Would you like to marry my daughter?"
  'L178': S(c => { yard(c); const g0 = ss(seg(c.t, .3, .8)); king(c, { lookX: .9, lookY: .1, mouth: 'smile', armF: { x: 40 - 120 * g0, y: -150 }, handF: 'open' }); princess(c, { lookX: .5, lookY: .2, mouth: 'smile', blush: .5 }); aim(c, 370, F - 330, D, 1.6, .5, .45, { dz: .06 }); }),
  // Tom looks to the side; pan to the princess
  'L179': S(c => { yard(c); tom(c, { lookX: .9, lookY: .1, mouth: 'closed', blush: .4 }); princess(c, { lookX: .9, lookY: .1, mouth: 'smile' }); king(c, { lookX: .3, mouth: 'smile' }); c.cam({ zoom: 1.5, x: TOM[0] + 60, y: F - 330 }, { zoom: 1.5, x: PRIN[0], y: F - 330, dz: .03 }); }),
  // the princess nods, a shy smile
  'L180': S(c => { yard(c); princess(c, { lookX: .9, lookY: .3, eyes: 'happy', mouth: 'smile', blush: .8, nod: Math.sin(clamp(c.t / 1.2) * Math.PI * 2) * .6 }); CU(c, PRIN[0], PRIN[1] - 20, 3.0, .55); }),
  // Tom happy, a small bounce: "Yes, please!"
  'L181': S(c => {
    yard(c); const bo = Math.abs(Math.sin(c.t * 7)) * (c.t > .4 && c.t < 1.6 ? 12 : 0);
    tom(c, { lookX: .9, eyes: c.t > 1.4 ? 'happy' : 'open', mouth: 'grin', blush: .5, lift: bo, armN: { x: 120, y: -100 }, handN: 'open' }); pussY(c, { lookX: .6, lookY: -1, eyes: 'happy', mouth: 'grin' });
    aim(c, TOM[0] - 60, TOM[1] - 300, D, 1.8, .45, .45, { dz: .06 }); c.fx(sparkle(TOM[0], TOM[1] - HEADY - 60, .4, { n: 6, size: 16, spread: 90 }));
  }),
};
