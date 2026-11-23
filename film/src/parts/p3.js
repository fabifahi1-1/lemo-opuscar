// PART 3: the village square and the town crier; Puss runs home.
import { S, rigFor, talk, blink, pulse } from '../kit/stage.js';
import { word, bubble, sparkle, puffs, mark, speedLines } from '../kit/fx.js';
import * as PR from '../kit/props.js';
import { SQUARE, SQ, crierStand, stall, ROAD, GY } from '../kit/sets.js';
import { Layer, glow } from '../engine.js';
import { clamp, lerp, ss, eio, seg, back } from '../lib.js';
import { wt, aim, atS } from './util.js';

const puss = (c, o) => c.actor('puss', { who: 'Puss', ...o });
const pussHead = (x, y, k = 1) => [x, y - .37 * 380 * k];
const CRIER = { x: SQ.standX, y: GY - 150 };   // he stands on top of his stand
function square(c) { const sc = c.set(SQUARE); c.layer(new Layer({ sheet: crierStand(1), x: SQ.standX, y: GY + 40, d: 2.08, z: 3.4, name: 'stand' })); c.layer(new Layer({ sheet: stall(1), x: SQ.stallX, y: GY + 40, d: 2.3, z: 3.3, name: 'stall' })); return sc; }
const VILL = [['vill1', -900, 1], ['vill2', 700, -1], ['vill3', -1300, 1], ['vill4', 1200, -1]];
function villagers(c, walk = true, look = 0) {
  VILL.forEach(([k, x0, dir], i) => {
    const x = walk ? x0 + dir * c.T * 60 % 600 : x0 * .7, face = look ? (x < CRIER.x ? 'R' : 'L') : (dir > 0 ? 'R' : 'L');
    c.actor(k + (look ? '' : ''), { x: walk ? x0 + dir * ((c.t * 70) % 900) : x0 * .62, y: GY + 60 + (i % 2) * 30, d: 2.0 - (i % 2) * .04, z: 4 + i * .01, face, who: k, pose: walk ? { walk: c.t * 1.8 + i * .5 } : { lookX: .8, lookY: -.4 } });
  });
}
const crier = (c, pose = {}, o = {}) => c.actor('crier', { x: CRIER.x, y: CRIER.y, d: 2.06, z: 3.6, face: 'L', who: 'Crier', ...o, pose: { lookX: .6, lookY: .1, ...pose } });

export const P3 = {
  // one morning in the village: villagers walk by, bunting overhead; tiny Puss strolls through (a slow cross-dissolve)
  'L058[1:9]': S(c => { square(c); villagers(c, true); const x = -400 + c.t * 120; puss(c, { x, y: GY + 90, d: 1.98, z: 4.5, face: 'R', pose: { walk: c.t * 2.2, strut: .6, lookX: .8 } }); c.cam({ zoom: .72, x: -300, y: -80 }, { zoom: .72, x: -120, y: -80, dz: .03 }); }),
  // the town crier climbs onto his stand and lifts his bell; villagers turn to look
  'L058[10:]': S(c => {
    square(c); villagers(c, false, 1); const up = ss(seg(c.t, .2, 1.2)), lift = ss(seg(c.t, 1.4, 2.2));
    crier(c, { lookX: .8, lookY: -.1, armN: { x: -40, y: -140 - 120 * lift }, handN: 'hold', propN: { sheet: PR.bell(3), x: 0, y: 6, s: 1 } }, { x: CRIER.x + 180 - 180 * up, y: lerp(GY + 40, CRIER.y, up) });
    puss(c, { x: -200, y: GY + 90, d: 1.98, z: 4.5, face: 'R', pose: { lookX: .9, lookY: -.4 } });
    c.cam({ zoom: .95, x: 60, y: -120 }, { zoom: .95, x: 80, y: -130, dz: .04 });
  }),
  // the town crier swings his bell: Ding-ding-ding!
  'L059': S(c => {
    square(c); const sw = Math.sin(c.t * 14) * (c.t < 1.8 ? 1 : 0);
    crier(c, { lookX: .5, lookY: -.2, mouth: 'grin', armN: { x: -60 + 30 * sw, y: -270 }, handN: 'hold', propN: { sheet: PR.bell(3), x: 0, y: 6, s: 1, rot: sw * .5 } });
    aim(c, CRIER.x - 30, CRIER.y - 380, 2.06, 1.9, .5, .45, { dz: .07 });
    const [w0, w1] = wt('L059', 'Ding-ding-ding!'), dd = (w1 - w0) / 3;
    for (let i = 0; i < 3; i++) c.fx(word('DING!', CRIER.x - 260 + i * 150, CRIER.y - 560 + (i % 2) * 40, w0 - c.shot.t0 + i * dd, { size: 70, hold: .5, rot: -.1 + i * .1, col: '#ffe07a', d: 2.06 }));
    c.fx(speedLines(() => CRIER.x - 150, () => CRIER.y - 520, .0, 1.8, { dir: -1, n: 4, h: 80, d: 2.06 }));
  }),
  // the crier reads his scroll; Puss's ear in the foreground
  'L060[1:5]': S(c => {
    square(c); crier(c, { lookX: .4, lookY: .5, armN: { x: -50, y: -160 }, handN: 'hold', propN: { sheet: PR.scroll(3), x: 0, y: 30, s: 1 }, armF: { x: 40, y: -150 }, handF: 'hold' });
    aim(c, CRIER.x - 40, CRIER.y - 330, 2.06, 1.7, .55, .4, { dz: .06 });
    const [fx0, fy0] = atS(c, .1, 1.18, 1.45); puss(c, { x: fx0, y: fy0, d: 1.45, s: .9, z: 7, face: 'R', contact: false, shadow: false, pose: { lookX: .8, lookY: -.6, earPerk: .3 } });
  }),
  // reaction: Puss's ears perk up
  'L060[6:]': S(c => {
    square(c); const pk = ss(seg(c.t, .3, .6)); puss(c, { x: 100, y: GY + 90, d: 2.0, face: 'R', pose: { lookX: .9, lookY: -.5, earPerk: pk, brow: pk * .6, mouth: 'o' } });
    const [hx, hy] = pussHead(100, GY + 90); aim(c, hx, hy, 2.0, 4.0, .44, .44, { dz: .07 });
  }),
  // Puss's green eyes light up: a sparkle pops
  'L061': S(c => {
    square(c); puss(c, { x: 100, y: GY + 90, d: 2.0, face: 'R', pose: { lookX: .6, lookY: -.3, sparkle: ss(seg(c.t, .5, .8)), wide: .2, earPerk: 1 } });
    const [hx, hy] = pussHead(100, GY + 90); aim(c, hx + 8, hy + 10, 2.0, 8.0, .5, .45, { dz: .06 });
    c.fx(sparkle(hx + 20, hy - 10, .5, { n: 4, size: 8, spread: 18 }), (g, cc) => { const [x, y, Z] = cc.p(hx + 10, hy + 6, 2); glow(g, x, y, 120 * Z * .3, [160, 255, 140], .3 * ss(seg(cc.t, .5, .9))); });
  }),
  // Puss clenches both paws, tail high: this is the chance
  'L062': S(c => {
    square(c); const cl = ss(seg(c.t, .3, .7));
    puss(c, { x: 100, y: GY + 90, d: 2.0, face: 'R', pose: { lookX: .8, lookY: -.3, mouth: 'smile', eyes: 'open', chest: cl, tailUp: 1, armF: { x: 20, y: -170 - 30 * cl }, armB: { x: 0, y: -170 - 30 * cl }, lift: Math.abs(Math.sin(c.t * 8)) * 8 * cl * (c.t < 2 ? 1 : 0) } });
    const [hx, hy] = pussHead(100, GY + 90); aim(c, hx, hy + 60, 2.0, 2.6, .45, .45, { dz: .07 });
  }),
  // he runs home: dust puffs, strong parallax
  'L063[1:5]': S(c => {
    c.set(ROAD); const x = -400 + c.t * 520; puss(c, { x, y: GY + 40, face: 'R', pose: { walk: c.t * 4, run: 1, lookX: 1, earLag: .2 } });
    c.cam({ zoom: 1.3, x: -300, y: 20 }, { zoom: 1.3, x: -400 + 2.4 * 520 - 60, y: 20, dz: .02 }, x => x);
    for (let k = 0; k < 9; k++) c.fx(puffs(-400 + k * .25 * 520, GY + 30, k * .25, { n: 3, size: 16, dur: .5, seed: k }));
    c.fx(speedLines(t => -400 + t * 520 - 60, () => GY - 80, 0, 2.4, { dir: 1, n: 5, h: 120 }));
  }),
  // the boots running fast (a step every 6 frames)
  'L063[6:]': S(c => {
    c.set(ROAD); const x = -300 + c.t * 520; puss(c, { x, y: GY + 40, face: 'R', pose: { walk: c.t * 4, run: 1 } });
    aim(c, x + 30, GY - 20, 2, 3.4, .5, .62, { X: x + 60, dz: .02 }, u => u);
    for (let k = 0; k < 10; k++) c.fx(puffs(-300 + k * .25 * 520 + 20, GY + 30, k * .25, { n: 3, size: 12, dur: .45, seed: k + 20 }));
  }),
};
