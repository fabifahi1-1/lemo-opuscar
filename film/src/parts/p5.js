// PART 5: the fields, the sheep, the apples. Puss runs ahead, trades peaches for cookies, makes a deal with the farmers,
// the shepherd and the apple picker. The king's questions always use ONE framing (KW: his face in the carriage window);
// every answer is a POV through the carriage window (a dark red frame in front).
import { S, rigFor, blink } from '../kit/stage.js';
import { word, bubble, thought, sparkle, puffs, sweat, bits, speedLines, mark } from '../kit/fx.js';
import * as PR from '../kit/props.js';
import { ROAD, FOREST, SQUARE, SQ, stall, GY, carriage, CARRIAGE_IN } from '../kit/sets.js';
import { FIELDS, appleTree, bitten } from '../kit/sets2.js';
import { bootShape } from '../kit/cat.js';
import { Layer, glow } from '../engine.js';
import { clamp, lerp, ss, eio, seg, back, TAU } from '../lib.js';
import { wt, aim, atS } from './util.js';
import { rr } from '../art.js';

const puss = (c, o) => c.actor('puss', { who: 'Puss', ...o });
const pussHead = (x, y) => [x, y - .37 * 380];
const HEADY = 455;                                    // a standing person's head centre above the feet (scale 1.25)
const person = (c, look, x, y, o = {}) => c.actor(look, { x, y, d: o.d ?? 2, who: o.who, face: o.face || 'R', z: o.z ?? 4, ...o, pose: { blink: blink(o.name || look), ...(o.pose || {}) } });
// the three places along the road
const F1 = [-1500, GY + 40], F2 = [-1290, GY + 52], SHEP = [-60, GY + 40], PICK = [1400, GY + 40], TREE = 1980;
const farmers = (c, pose = {}, p2 = {}) => { person(c, 'farmer1', F1[0], F1[1], { name: 'farmer1', who: 'Farmers', face: 'R', pose }); person(c, 'farmer2', F2[0], F2[1], { name: 'farmer2', who: 'Farmers', face: 'L', z: 4.1, pose: { ...pose, ...p2 } }); };
const sheepFlock = (c, x0 = SHEP[0] + 260, n = 3, o = {}) => { for (let i = 0; i < n; i++) c.actor('sheep', { x: x0 + i * 170 - (i % 2) * 40, y: GY + 60 + (i % 2) * 34, d: 2.0 - (i % 2) * .03, z: 3.6 + i * .01, face: i % 2 ? 'L' : 'R', who: 'sheep' + i, pose: { walk: o.walk ? c.t * 1.2 + i : null, lookX: .6, nod: Math.sin(c.T * 1.3 + i) * .4, ...(o.pose || {}) } }); };
const shepherd = (c, pose = {}) => person(c, 'shepherd', SHEP[0], SHEP[1], { name: 'shepherd', who: 'Shepherd', face: 'R', pose });
const picker = (c, pose = {}) => person(c, 'picker', PICK[0], PICK[1], { name: 'picker', who: 'Picker', face: 'R', pose });
const tree = c => c.layer(new Layer({ sheet: appleTree(1.2), x: TREE, y: GY + 40, d: 2.03, z: 4.6, sx: .75, sy: .75, name: 'appleTree' }));
// the carriage, stopped beside each place; KW = the king's face in the right-hand window
const CAR = { y: GY + 60, d: 2.1, s: .95 };
const kingIn = (pose = {}) => ({ kind: 'king:seat', dx: 100, who: 'King', face: 'R', pose: { lookX: .8, ...pose } });
const princessIn = (pose = {}) => ({ kind: 'princess:seat', dx: -80, dy: -48, who: 'Princess', face: 'R', pose: { lookX: .8, mouth: 'smile', smile: .6, ...pose } });
function KW(c, X, pose = {}, k = 0) {
  c.set(FIELDS); carriage(c, X, CAR.y, { d: CAR.d, s: CAR.s, still: true, roll: 0, horses: false, pass: [kingIn({ lookX: 1, lookY: .1, lift: 30, ...pose }), princessIn({ lookX: .9 })] });
  const wx = X + 100 * CAR.s, wy = CAR.y - 315 * CAR.s; aim(c, wx + 10, wy - 10, CAR.d, 3.2 + k, .44, .45, { dz: .07 });
}
// the window frame in front of a POV shot (screen space): dark red with a gold rim and rounded corners
const povFrame = (g, c) => { g.save(); g.fillStyle = '#5a1e2e'; g.beginPath(); g.rect(0, 0, 1920, 1080); g.roundRect(150, 90, 1620, 900, 120); g.fill('evenodd'); g.strokeStyle = '#e8b84a'; g.lineWidth = 16; g.beginPath(); g.roundRect(150, 90, 1620, 900, 120); g.stroke(); g.restore(); };
const crumbsOn = (c, x, y, k = 1) => c.fx((g, cc) => { const [px, py, Z] = cc.p(x, y, 2); g.fillStyle = '#c88a4a'; for (const [dx, dy, r] of [[-10, 6, 3], [6, 9, 2.6], [14, 2, 2.2], [-2, 12, 2]]) { g.beginPath(); g.arc(px + dx * Z * k, py + dy * Z * k, r * Z * k, 0, TAU); g.fill(); } });

export const P5 = {
  // inside the carriage: Tom in his blue jacket, very grand and very awkward; the king beside him; the land slides past
  'L088': S(c => {
    c.set(CARRIAGE_IN);
    c.actor('tomJ:seat', { x: -150, y: 40, d: 2.2, z: 3, who: 'Tom', pose: { lookX: .3, lookY: .2, brow: .3, browTilt: -.2, mouth: 'smile', smile: .3, lift: 6, armN: { x: 30, y: -40 }, armF: { x: 40, y: -30 }, shift: Math.sin(c.t * 2) * 2 } });
    c.actor('king:seat', { x: 230, y: 40, d: 2.25, z: 2.9, face: 'L', who: 'King', pose: { lookX: .8, mouth: 'smile', smile: .7, eyes: 'happy' } });
    aim(c, -120, -250, 2.2, 1.8, .44, .42, { dz: .06 });
  }),
  // Puss peeks from the trees; a thought bubble: green land and a castle
  'L089': S(c => {
    c.set(FOREST); c.layer(new Layer({ sheet: PR.bush(2, '#3f7a3e'), x: 300, y: GY + 120, d: 1.95, z: 5, sx: .75, sy: .75 }));
    puss(c, { x: 150, y: GY + 40, d: 2.0, z: 4.5, face: 'R', pose: { lookX: .5, lookY: -.6, eyes: 'half', mouth: 'smirk', headTilt: .08 } });
    const [hx, hy] = pussHead(150, GY + 40); aim(c, hx, hy, 2.0, 3.0, .36, .6, { dz: .06 });
    const [bx, by] = atS(c, .46, .46);
    c.fx(thought(bx, by, .2, 3.6, (g, w, h) => { g.fillStyle = '#8cc070'; g.beginPath(); g.moveTo(-w / 2, h * .1); g.quadraticCurveTo(0, -h * .2, w / 2, h * .05); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.fill(); const s = PR.castle(.7), k = h * .5 / 1300 * 1.4; g.drawImage(s.c, -s.ax / s.res * k + w * .05, -s.ay / s.res * k + h * .02, s.c.width / s.res * k, s.c.height / s.res * k); }, { size: .7, w: 420, h: 300 }));
  }),
  // his sly smile; he looks down the road
  'L090': S(c => {
    c.set(FOREST); const lk = ss(seg(c.t, 1.2, 1.6));
    puss(c, { x: 150, y: GY + 40, d: 2.0, z: 4.5, face: 'R', pose: { lookX: lerp(-.3, 1, lk), lookY: .1, eyes: 'half', mouth: 'smirk', browL: .4, headTilt: -.05 * lk } });
    const [hx, hy] = pussHead(150, GY + 40); aim(c, hx, hy, 2.0, 4.6, .45, .44, { dz: .07 });
  }),
  // Swish, swish, swish! Puss runs ahead
  'L091': S(c => {
    c.set(ROAD); const x = -500 + c.t * 560; puss(c, { x, y: GY + 40, face: 'R', pose: { walk: c.t * 4, run: 1, lookX: 1, earLag: .3 } });
    c.cam({ zoom: 1.3, x: -480, y: 20 }, { zoom: 1.3, x: -500 + 2.2 * 560 - 40, y: 20, dz: .02 }, u => u);
    c.fx(speedLines(t => -500 + t * 560 - 80, () => GY - 80, 0, 2.2, { dir: 1, n: 6, h: 140 }));
    const W3 = wt('L091', 'Swish,', 1)[0], W4 = wt('L091', 'swish,', 2)[0], W5 = wt('L091', 'swish!', 3)[0];
    [W3, W4, W5].forEach((w0, i) => { const tt = w0 - c.shot.t0; c.fx(word('SWISH!', -500 + tt * 560 - 140, GY - 220 - i * 30, tt, { size: 46, hold: .4, rot: -.1 + i * .08, col: '#bfe6ff' })); });
  }),
  // Puss overtakes the carriage; it shrinks behind into the distance
  'L092': S(c => {
    c.set(ROAD); const cx = -200 + c.t * 120; carriage(c, cx, GY + 20, { d: 2.6, s: .8, z: 3.2 });
    const x = -900 + c.t * 520; puss(c, { x, y: GY + 60, d: 1.9, z: 5, face: 'R', pose: { walk: c.t * 4, run: 1, lookX: .9, mouth: 'smile' } });
    for (let k = 0; k < 8; k++) c.fx(puffs(-900 + k * .4 * 520, GY + 50, k * .4, { n: 3, size: 14, dur: .5, seed: k, d: 1.9 }));
    c.cam({ zoom: .95, x: -200, y: -20 }, { zoom: .95, x: 300, y: -20, dz: .02 });
  }),
  // the farmland along the road: wheat, a sheep meadow, the orchard (a slow pan)
  'L093[1:9]': S(c => {
    c.set(FIELDS); farmers(c, { lookX: .5 }); shepherd(c, { lookX: .6 }); sheepFlock(c, undefined, 3, { walk: true }); picker(c, { lookX: .6, armF: { x: 40, y: -230 }, handF: 'open' }); tree(c);
    c.cam({ zoom: .55, x: -1300, y: -120 }, { zoom: .55, x: 1200, y: -120, dz: .02 });
  }),
  // a huge ogre-shaped shadow slides across the fields; the farmers look up
  'L093[10:14]': S(c => {
    c.set(FIELDS); const up = ss(seg(c.t, .4, .9)); farmers(c, { lookX: .3, lookY: -1 * up, brow: .6 * up, wide: .4 * up, mouth: up > .5 ? 'o' : 'closed' });
    c.cam({ zoom: 1.0, x: -1400, y: -120 }, { zoom: 1.0, x: -1400, y: -130, dz: .06 });
    c.fx((g, cc) => { const u = c.t / c.dur, x = lerp(-300, 2300, u); g.save(); g.globalAlpha = .38; g.fillStyle = '#1a2030'; g.beginPath(); g.ellipse(x, 600, 420, 300, 0, 0, TAU); g.ellipse(x + 40, 260, 170, 160, 0, 0, TAU); g.ellipse(x - 300, 520, 90, 220, .4, 0, TAU); g.ellipse(x + 380, 520, 90, 220, -.4, 0, TAU); g.fill(); g.restore(); });
  }),
  // the farmers sigh and roll their eyes
  'L093[15:]': S(c => {
    c.set(FIELDS); const s0 = .3; farmers(c, { lookX: .4, lookY: -.9, eyes: 'half', sigh: c.shot.t0 + s0, mouth: 'flat', lean: -.04 }, { sigh: c.shot.t0 + s0 + .25 });
    aim(c, -1400, F1[1] - HEADY + 60, 2, 2.1, .5, .4, { dz: .07 });
  }),
  // at the bakery stall Puss holds up his basket of peaches
  'L094': S(c => {
    c.set(SQUARE); c.layer(new Layer({ sheet: stall(1), x: SQ.stallX, y: GY + 40, d: 2.3, z: 3.3, name: 'stall' }));
    person(c, 'baker', SQ.stallX + 60, GY + 10, { d: 2.32, z: 3.25, name: 'baker', face: 'R', pose: { lookX: .7, lookY: .4, mouth: 'smile' } });
    const up = ss(seg(c.t, .3, .8)); puss(c, { x: SQ.stallX + 380, y: GY + 90, d: 2.0, z: 4.5, face: 'L', pose: { lookX: -.8, lookY: -.4, mouth: 'smile', armF: { x: -40, y: -140 - 60 * up }, armB: { x: -30, y: -140 - 60 * up }, pawF: 'open', pawB: 'open', propF: { sheet: PR.basket(3, 'peach'), x: 0, y: 10, s: 1.0 } } });
    aim(c, SQ.stallX + 240, GY - 230, 2.0, 1.3, .5, .45, { dz: .06 });
    for (let k = 0; k < 3; k++) c.fx(sparkle(SQ.stallX + 380 - 20 + k * 20, GY - 160, .8 + k * .25, { n: 2, size: 10, spread: 14 }));
  }),
  // he hands the basket over the counter
  'L095[1:4]': S(c => {
    c.set(SQUARE); c.layer(new Layer({ sheet: stall(1), x: SQ.stallX, y: GY + 40, d: 2.3, z: 3.3, name: 'stall' }));
    const u = ss(seg(c.t, .2, 1.1));
    person(c, 'baker', SQ.stallX + 60, GY + 10, { d: 2.32, z: 3.25, name: 'baker', face: 'R', pose: { lookX: .7, lookY: .3, mouth: 'smile', armN: { x: 60 + 40 * u, y: -150 }, handN: u > .8 ? 'hold' : 'open', propN: u > .8 ? { sheet: PR.basket(3, 'peach'), x: 0, y: 10, s: .7 } : null } });
    puss(c, { x: SQ.stallX + 360, y: GY + 90, d: 2.0, z: 4.5, face: 'L', pose: { lookX: -.8, lookY: -.3, mouth: 'smile', armF: { x: -40 - 40 * u, y: -200 }, armB: { x: -30 - 30 * u, y: -190 }, pawF: 'open', pawB: 'open', propF: u <= .8 ? { sheet: PR.basket(3, 'peach'), x: 0, y: 10, s: 1.0 } : null } });
    aim(c, SQ.stallX + 220, GY - 240, 2.0, 1.5, .5, .45, { dz: .06 });
  }),
  // a plate of warm cookies comes back; they pop in one by one
  'L095[5:]': S(c => {
    c.set(SQUARE); c.layer(new Layer({ sheet: stall(1), x: SQ.stallX, y: GY + 40, d: 2.3, z: 3.3, name: 'stall' }));
    const n = 1 + Math.min(4, Math.floor(c.t / .45));
    person(c, 'baker', SQ.stallX + 60, GY + 10, { d: 2.32, z: 3.25, name: 'baker', face: 'R', pose: { lookX: .7, lookY: .3, mouth: 'smile', eyes: 'happy', armN: { x: 110, y: -95 }, handN: 'hold', propN: { sheet: PR.plate(3, n), x: 0, y: -4, s: .9 } } });
    puss(c, { x: SQ.stallX + 360, y: GY + 90, d: 2.0, z: 4.5, face: 'L', pose: { lookX: -.8, lookY: -.4, mouth: 'grin', eyes: c.t > 1.6 ? 'happy' : 'open', sparkle: ss(seg(c.t, 1.4, 1.8)) } });
    aim(c, SQ.stallX + 210, GY - 250, 2.0, 1.6, .5, .45, { dz: .06 });
    for (let k = 1; k < 5; k++) c.fx(sparkle(SQ.stallX + 160 - 30 + k * 14, GY - 230, k * .45, { n: 2, size: 9, spread: 12 }));
    c.fx(steamUp(SQ.stallX + 170, GY - 250));
  }),
  // a cookie for each farmer: they smile and nod
  'L096[1:9]': S(c => {
    c.set(FIELDS); const g1 = c.t > 1.0, g2 = c.t > 2.4, x = lerp(-900, -1130, ss(seg(c.t, 0, .9)));
    farmers(c, { lookX: .8, lookY: .5, mouth: g1 ? 'smile' : 'closed', eyes: g1 ? 'happy' : 'open', nod: g1 ? Math.sin(c.t * 6) * .5 : 0, armN: g1 ? { x: 40, y: -150 } : undefined, handN: 'hold', propN: g1 ? { sheet: PR.cookie(3), x: 0, y: 0, s: .9 } : null },
      { lookX: .8, mouth: g2 ? 'smile' : 'closed', eyes: g2 ? 'happy' : 'open', nod: g2 ? Math.sin(c.t * 6) * .5 : 0, armN: g2 ? { x: 40, y: -150 } : undefined, propN: g2 ? { sheet: PR.cookie(3), x: 0, y: 0, s: .9 } : null });
    const reach = Math.max(ss(seg(c.t, .6, 1.0)) * (1 - ss(seg(c.t, 1.1, 1.4))), ss(seg(c.t, 2.0, 2.4)) * (1 - ss(seg(c.t, 2.5, 2.8))));
    puss(c, { x, y: GY + 70, d: 1.98, z: 4.5, face: 'L', pose: { walk: c.t < .9 ? c.t * 2.4 : null, lookX: -.8, lookY: -.6, mouth: 'smile', armF: { x: -40 - 50 * reach, y: -170 - 40 * reach }, pawF: 'open', propF: reach > .2 ? { sheet: PR.cookie(3), x: 0, y: 8, s: 1.1 } : null, propB: { sheet: PR.plate(3, 3), x: 0, y: 0, s: .8 }, armB: { x: 30, y: -120 } } });
    aim(c, -1250, GY - 230, 2.0, 1.7, .5, .45, { dz: .06 });
    c.fx(sparkle(F1[0] + 60, F1[1] - 300, 1.05, { n: 3, size: 10, spread: 16 }), sparkle(F2[0] + 40, F2[1] - 300, 2.45, { n: 3, size: 10, spread: 16 }));
  }),
  // the shepherd, then the apple picker: a cookie each (a track along the road)
  'L096[10:]': S(c => {
    c.set(FIELDS); sheepFlock(c); tree(c);
    const g1 = c.t > .6, g2 = c.t > 2.1;
    shepherd(c, { lookX: .8, lookY: .4, mouth: g1 ? 'smile' : 'closed', eyes: g1 ? 'happy' : 'open', armN: g1 ? { x: 40, y: -150 } : undefined, handN: 'hold', propN: g1 ? { sheet: PR.cookie(3), x: 0, y: 0, s: .9 } : null });
    picker(c, { lookX: -.6, mouth: g2 ? 'smile' : 'closed', eyes: g2 ? 'happy' : 'open', armN: g2 ? { x: 40, y: -150 } : undefined, handN: 'hold', propN: g2 ? { sheet: PR.cookie(3), x: 0, y: 0, s: .9 } : null });
    const x = lerp(SHEP[0] + 220, PICK[0] - 230, ss(seg(c.t, .8, 2.0)));
    puss(c, { x, y: GY + 80, d: 1.96, z: 4.6, face: c.t > .8 && c.t < 2.0 ? 'R' : c.t < .8 ? 'L' : 'R', pose: { walk: c.t > .8 && c.t < 2.0 ? c.t * 3 : null, lookX: .8, mouth: 'smile', propB: { sheet: PR.plate(3, 2), x: 0, y: 0, s: .8 }, armB: { x: 30, y: -120 } } });
    c.cam({ zoom: 1.05, x: SHEP[0] + 150, y: -130 }, { zoom: 1.05, x: PICK[0] - 120, y: -130, dz: .02 });
  }),
  // Puss whispers, a paw beside his mouth
  'L097': S(c => {
    c.set(FIELDS); const [hx, hy] = pussHead(-1100, GY + 70);
    puss(c, { x: -1100, y: GY + 70, d: 1.98, z: 4.5, face: 'L', pose: { lookX: -.6, lookY: -.3, eyes: 'half', mouth: 'smirk', armF: { x: -36, y: -250 }, pawF: 'open', headTilt: .06 } });
    aim(c, hx, hy, 1.98, 4.0, .58, .45, { dz: .07 });
  }),
  // earnest, a paw on his chest
  'L098[1:8]': S(c => {
    c.set(FIELDS); const [hx, hy] = pussHead(-1100, GY + 70);
    puss(c, { x: -1100, y: GY + 70, d: 1.98, z: 4.5, face: 'L', pose: { lookX: -.6, lookY: -.4, brow: .5, browTilt: .3, mouth: 'closed', armF: { x: 10, y: -170 }, pawF: 'rest', chest: .5 } });
    aim(c, hx, hy + 30, 1.98, 3.3, .5, .42, { dz: .07 });
  }),
  // over Puss's shoulder: the three listeners nod; on "ogre" they scowl
  'L098[9:]': S(c => {
    c.set(FIELDS); const [o0] = wt('L098', 'ogre'), sc0 = clamp((c.T - o0 + .1) / .3);
    const P = { lookX: -.7, lookY: .5, nod: (1 - sc0) * Math.sin(c.t * 5) * .6, brow: -.6 * sc0, browTilt: .8 * sc0, mouth: sc0 > .5 ? 'flat' : 'smile' };
    person(c, 'farmer1', -1450, GY + 30, { name: 'farmer1', face: 'L', z: 3.6, pose: P }); person(c, 'shepherd', -1650, GY + 40, { name: 'shepherd', face: 'L', z: 3.5, pose: P }); person(c, 'picker', -1250, GY + 50, { name: 'picker', face: 'L', z: 3.7, pose: P });
    puss(c, { x: -950, y: GY + 200, d: 1.6, z: 7, s: .55, face: 'L', contact: false, pose: { lookX: -.8, lookY: -.5, armF: { x: -30, y: -160 }, pawF: 'open' } });
    c.cam({ zoom: 1.5, x: -1400, y: -180 }, { zoom: 1.5, x: -1330, y: -180, dz: .05 });
  }),
  // three heads in a row cheer: "Deal!"
  'L099': S(c => {
    c.set(FIELDS); const ch = ss(seg(c.t, .05, .3));
    const P = k => ({ lookX: .1 * k, lookY: -.2, eyes: 'happy', mouth: 'grin', lift: 14 * Math.abs(Math.sin(c.t * 8 + k)) * ch, armN: { x: -40 - 130 * ch, y: -120 - 150 * ch }, handN: 'open' });
    person(c, 'shepherd', -1720, GY + 40, { name: 'shepherd', who: 'Villagers', face: 'R', z: 3.5, pose: P(0) }); person(c, 'farmer1', -1440, GY + 30, { name: 'farmer1', who: 'Villagers', face: 'R', z: 3.6, pose: P(1) }); person(c, 'picker', -1170, GY + 50, { name: 'picker', who: 'Villagers', face: 'L', z: 3.7, pose: P(2) });
    aim(c, -1440, GY - 410, 2, 2.0, .5, .42, { dz: .06 });
    c.fx(sparkle(-1640, GY - 600, .2, { n: 4, size: 14, spread: 50 }), sparkle(-1240, GY - 600, .3, { n: 4, size: 14, spread: 50 }));
  }),
  // soon the carriage rolls by along the field road
  'L100': S(c => {
    c.set(FIELDS); farmers(c, { lookX: .7 }); const x = lerp(-2600, -900, c.t / c.dur);
    carriage(c, x, GY + 140, { d: 1.95, s: .8, z: 5, pass: [kingIn(), princessIn()] });
    c.cam({ zoom: .6, x: -1700, y: -140 }, { zoom: .6, x: -1200, y: -140, dz: .02 });
  }),
  'L101': S(c => KW(c, -1550, { brow: .3, browTilt: .3, mouth: 'closed', armN: { x: 80, y: -200 }, handN: 'point' })),
  // POV through the window: the farmers answer, crumbs on their chins
  'L102[1:8]': S(c => {
    c.set(FIELDS); farmers(c, { lookX: -.2, lookY: -.1, mouth: 'smile', eyes: 'open', brow: .3, armN: { x: 120, y: -100 }, handN: 'point' }); crumbsOn(c, F1[0] + 14, F1[1] - HEADY + 60); crumbsOn(c, F2[0] - 6, F2[1] - HEADY + 70);
    aim(c, -1400, GY - 330, 2.0, 1.7, .5, .45, { dz: .06 }); c.fx(povFrame);
  }),
  'L102[9:]': S(c => KW(c, -1550, { brow: .8, wide: .5, mouth: 'o', lift: 20 * ss(seg(c.t, .1, .4)) })),
  // cookie crumbs fly everywhere
  'L103': S(c => {
    c.set(FIELDS); farmers(c, { lookX: .3, lookY: .1, eyes: 'happy', mouth: 'grin', shake: .8, armN: { x: 40, y: -170 }, handN: 'hold', propN: { sheet: bitten(3), x: 0, y: 0, s: .9 } });
    aim(c, -1400, GY - 360, 2.0, 2.3, .5, .45, { dz: .08 });
    for (let k = 0; k < 5; k++) { c.fx(bits(F1[0] + 20, F1[1] - HEADY + 70, .1 + k * .4, { n: 10, col: '#c88a4a', seed: k })); c.fx(bits(F2[0] - 10, F2[1] - HEADY + 80, .3 + k * .4, { n: 10, col: '#d8a058', seed: k + 9 })); }
  }),
  'L104': S(c => KW(c, -150, { brow: .3, browTilt: .3, lookX: 1, mouth: 'closed', armN: { x: 80, y: -200 }, handN: 'point' })),
  // POV: the shepherd answers, his sheep around him
  'L105[1:8]': S(c => {
    c.set(FIELDS); sheepFlock(c, SHEP[0] + 220); shepherd(c, { lookX: -.2, lookY: -.1, mouth: 'smile', brow: .3, armN: { x: 120, y: -100 }, handN: 'point' }); crumbsOn(c, SHEP[0] + 12, SHEP[1] - HEADY + 60);
    aim(c, SHEP[0] + 160, GY - 300, 2.0, 1.6, .5, .45, { dz: .06 }); c.fx(povFrame);
  }),
  'L105[9:]': S(c => KW(c, -150, { brow: .7, wide: .4, mouth: 'smile', nod: Math.sin(c.t * 4) * .4 })),
  // a sheep: "Baaa!"
  'L106': S(c => {
    c.set(FIELDS); const X = SHEP[0] + 260; c.actor('sheep', { x: X, y: GY + 60, d: 2.0, z: 3.6, face: 'L', who: 'Sheep', pose: { lookX: -.4, lookY: -.3, nod: Math.sin(c.t * 3) * .3 } });
    aim(c, X - 90, GY - 130, 2.0, 3.6, .5, .5, { dz: .07 });
    const [b0, b1] = wt('L106', '"Baaa!"'); const [bx, by] = atS(c, .3, .25); c.fx(bubble('Baaa!', bx, by, b0 - c.shot.t0, c.dur, { size: 70, tail: [.8, 1] }));
  }),
  'L107': S(c => KW(c, -150, { eyes: 'happy', mouth: 'grin', nod: Math.sin(c.t * 5) * .6 })),
  'L108': S(c => KW(c, 1280, { brow: .3, browTilt: .3, lookX: 1, mouth: 'closed', armN: { x: 80, y: -200 }, handN: 'point' })),
  // POV: the apple picker freezes, eyes darting, a drop of sweat
  'L109': S(c => {
    c.set(FIELDS); tree(c); const [u0] = wt('L109', 'um..."'), fr = c.T > u0 - .1;
    picker(c, { lookX: fr ? Math.sign(Math.sin(c.t * 7)) * .9 : -.2, lookY: -.1, mouth: fr ? 'wobbly' : 'smile', brow: fr ? .7 : .3, browTilt: fr ? -.5 : 0, armN: { x: 120, y: -100 }, handN: 'point' });
    aim(c, PICK[0] + 60, GY - 330, 2.0, 2.0, .45, .45, { dz: .06 });
    c.fx(sweat(PICK[0] + 60, PICK[1] - HEADY - 40, u0 - c.shot.t0 + .2)); c.fx(povFrame);
  }),
  // a boot pokes out from behind a tree
  'L110': S(c => {
    c.set(FIELDS); tree(c); picker(c, { lookX: .9, lookY: .1, mouth: 'wobbly', brow: .6, browTilt: -.4 });
    const u = ss(seg(c.t, 1.0, 1.6));
    c.layer(new Layer({ x: TREE - 30, y: GY + 36, d: 2.035, z: 4.55, draw: (g, info) => { const { px, py, Z } = info, s = Z * .37 * 1.22; g.save(); g.translate(px - 70 * u * Z, py); g.scale(-s, s); g.translate(0, -84); bootShape(g); g.restore(); } }));
    c.cam({ zoom: 1.4, x: PICK[0] + 60, y: -40 }, { zoom: 1.4, x: PICK[0] + 160, y: -40, dz: .05 });
  }),
  // XCU: the boot taps: tap, tap
  'L111': S(c => {
    c.set(FIELDS); tree(c); const taps = [wt('L111', 'Tap,')[0], wt('L111', 'tap.', 2)[0]].map(x => x - c.shot.t0);
    const lift = taps.reduce((a, t0) => a + Math.max(0, Math.sin(clamp((c.t - t0 + .15) / .3) * Math.PI)), 0);
    c.layer(new Layer({ x: TREE - 30, y: GY + 36, d: 2.035, z: 4.55, draw: (g, info) => { const { px, py, Z } = info, s = Z * .37 * 1.22; g.save(); g.translate(px - 70 * Z, py); g.scale(-s, s); g.translate(30, 0); g.rotate(-.35 * lift); g.translate(-30, -84); bootShape(g); g.restore(); } }));
    aim(c, TREE - 90, GY + 10, 2.03, 5.0, .5, .55, { dz: .07 });
    taps.forEach((t0, i) => c.fx(word('TAP', TREE - 170 + i * 60, GY - 30 - i * 20, t0, { size: 30, hold: .4, col: '#fbf6ee', d: 2.03 })));
  }),
  // the picker's ear tilts toward a tiny whisper bubble: "Marquis"
  'L112': S(c => {
    c.set(FIELDS); tree(c); const tl = ss(seg(c.t, .2, .6));
    picker(c, { lookX: .9, lookY: .2, headTilt: .18 * tl, brow: .4, mouth: 'o' });
    aim(c, PICK[0] + 80, PICK[1] - HEADY, 2.0, 3.0, .42, .45, { dz: .07 });
    const [m0, m1] = wt('L112', '"Marquis,"'); c.fx(bubble('Marquis', PICK[0] + 230, PICK[1] - HEADY - 40, m0 - c.shot.t0, m1 - c.shot.t0 + .6, { kind: 'whisper', size: 30, tail: [.9, 1] }));
  }),
  // relieved, the picker finishes the sentence
  'L113': S(c => {
    c.set(FIELDS); tree(c); picker(c, { lookX: -.2, lookY: -.1, mouth: 'smile', eyes: 'open', brow: .4, armN: { x: 120, y: -100 }, handN: 'point', sigh: c.shot.t0 + .05 });
    aim(c, PICK[0] + 40, PICK[1] - HEADY, 2.0, 2.6, .45, .45, { dz: .07 }); c.fx(povFrame);
  }),
  // the king, delighted: "Marquis, you are so rich!"
  'L114': S(c => { KW(c, 1280, { eyes: c.t > 2.4 ? 'happy' : 'open', mouth: 'grin', brow: .5, armN: { x: 70, y: -200 }, handN: 'open' }); c.fx(sparkle(1280 + 100 * CAR.s + 20, CAR.y - 315 * CAR.s - 90, .3, { n: 5, size: 14, spread: 50, d: CAR.d })); }),
  // two-shot in the carriage: Tom awkward, eyes sliding sideways: "Um... thank you?"
  'L115': S(c => {
    c.set(CARRIAGE_IN);
    c.actor('tomJ:seat', { x: -150, y: 40, d: 2.2, z: 3, who: 'Tom', pose: { lookX: lerp(.2, .9, ss(seg(c.t, .2, .8))), lookY: .1, brow: .5, browTilt: -.4, mouth: 'smile', smile: .3, blush: .5, armN: { x: 20, y: -40 } } });
    c.actor('king:seat', { x: 230, y: 40, d: 2.25, z: 2.9, face: 'L', who: 'King', pose: { lookX: .8, eyes: 'happy', mouth: 'grin', armN: { x: 70, y: -150 }, handN: 'open' } });
    aim(c, 40, -250, 2.2, 1.55, .5, .42, { dz: .06 });
    c.fx(sweat(-130, -360, 1.0, { d: 2.2 }));
  }),
};
// a little warm steam rising from the cookies
function steamUp(x, y) { return (g, c) => { const [px, py, Z] = c.p(x, y, 2.32); g.save(); g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 5 * Z; g.lineCap = 'round'; for (let k = 0; k < 3; k++) { const u = (c.t * .6 + k / 3) % 1; g.globalAlpha = Math.sin(u * Math.PI) * .7; g.beginPath(); g.moveTo(px + (k - 1) * 30 * Z, py - u * 120 * Z); g.bezierCurveTo(px + (k - 1) * 30 * Z + 14 * Z, py - u * 120 * Z - 20 * Z, px + (k - 1) * 30 * Z - 14 * Z, py - u * 120 * Z - 40 * Z, px + (k - 1) * 30 * Z, py - u * 120 * Z - 60 * Z); g.stroke(); } g.restore(); }; }
