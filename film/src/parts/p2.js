// PART 2: the boots, the berries, the king. The three gifts share one throne-room framing (GIFT) and one close-up of the king (KCU).
import { S, rigFor, talk, blink, pulse, antic3 } from '../kit/stage.js';
import { word, bubble, thought, sparkle, puffs, mark, bits, speedLines } from '../kit/fx.js';
import * as PR from '../kit/props.js';
import { SHED, SHED_GEO, ROAD, FOREST, HILL, THRONE, THRONE_GEO, GY } from '../kit/sets.js';
import { buildSteps, STEP } from '../scenes.js';
import { Layer, glow } from '../engine.js';
import { clamp, lerp, ss, eio, seg, back, TAU } from '../lib.js';
import { wt, aim, atS, HEAD } from './util.js';
import { bootShape } from '../kit/cat.js';
import { PAL, ell, rr } from '../art.js';

const STEPS = () => buildSteps({ ots: false }), TG = THRONE_GEO;
const prop = (c, sheet, x, y, d, s = 1, extra = {}) => c.layer(new Layer({ sheet, x, y, d, sx: s, sy: s, z: extra.z ?? 3.2, shadow: { dx: 14, dy: 12, blur: 12, a: .3 }, ...extra }));
// standing Puss: scale .37 like the seated cat, so his head is the same size in every shot
const puss = (c, o) => c.actor('puss', { who: 'Puss', ...o });
// head positions (world) for framing
const pussHead = (x, y) => [x, y - .37 * 380];
const KING = { x: TG.throneX, y: TG.floor - 270, d: 2.24 }, kingHead = [KING.x - 20, KING.y - 300];
function throne(c, week = 0) { const sc = c.set(THRONE); sc.week = week; return sc; }
const king = (c, pose = {}, o = {}) => c.actor('king:seat', { x: KING.x, y: KING.y, d: KING.d, z: 2.6, face: 'L', who: 'King', contact: false, ...o, pose: { lookX: .7, lookY: .15, ...pose } });
// the gift framing (wide, eye level): Puss on the left offers, the king on his throne on the right
function GIFT(c, gift, extra = {}) {
  const sc = throne(c, extra.week || 0); c.L('giftTable').vis = false;
  const reach = ss(seg(c.t, .3, 1.0));
  puss(c, { x: -120, y: TG.floor, d: 2.2, face: 'R', pose: { lookX: .8, lookY: -.3, armF: { x: 40 + 20 * reach, y: -150 - 30 * reach }, armB: { x: 30 + 20 * reach, y: -150 - 30 * reach }, pawF: 'open', pawB: 'open', propF: { sheet: gift, x: 0, y: 10, s: gift === PR.honey(3) ? .55 : .5 }, headLift: .2, ...(extra.puss || {}) } });
  king(c, { lookX: .8, lookY: .1, ...(extra.king || {}) });
  c.cam({ zoom: 1.08, x: 120, y: -60 }, { zoom: 1.08, x: 120, y: -62, dz: .06 });
}
// the king's close-up (same each time)
const KCU = (c, pose = {}, z = 3.4, to = {}) => { throne(c, c.__week || 0); king(c, pose); aim(c, kingHead[0], kingHead[1], KING.d, z, .48, .4, { dz: .07, ...to }); };

export const P2 = {
  // Tom did not know what to think: eyes up, a hand on his chin, a thought bubble grows from three dots
  'L024': S(c => {
    const sc = c.set(STEPS); sc.tomRig = rigFor('tom:seat', 4); sc.tomL.vis = sc.pussL.vis = true; sc.focus = 2.0;
    sc.tomPose = { blink: blink('Tom'), lookX: .4, lookY: -.8, browTilt: -.3, brow: .3, mouth: 'flat', armN: { x: 0, y: -150 }, handN: 'point', handNRot: -.3, armF: { x: 30, y: -40 }, handF: 'hold', propF: { sheet: PR.breadHalf(1, 4), x: 0, y: 12, s: .95 } };
    sc.catPose = { blink: blink('Puss'), lookX: -1, lookY: -.3 };
    aim(c, -190, -140, 2.0, 2.8, .42, .5, { dz: .07 });
    const [bx, by] = atS(c, .55, .3); c.fx(thought(bx, by, .4, 3.5, (g, w, h, t) => { g.fillStyle = '#2a1a2e'; g.font = `${h * .55}px "Lilita One"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', -w * .18, 0); const b = PR.boots(3); const k = h * .5 / 140; g.drawImage(b.c, w * .02, -h * .3, b.c.width / b.res * k, b.c.height / b.res * k); }, { size: 1, w: 300, h: 190 }));
  }),
  // the shed corner: Tom searches, moving a crate and a basket
  'L025[1:7]': S(c => {
    const sc = c.set(SHED), F = SHED_GEO.floor, mv = ss(seg(c.t, .6, 1.8));
    c.L('crate').x = -260 - 160 * mv; c.L('basket').x = -40 + 60 * ss(seg(c.t, 1.9, 2.9));
    c.actor('tom', { x: -560 + 120 * ss(seg(c.t, 0, .6)), y: F + 40, d: 2.2, who: 'Tom', pose: { lean: .25 * ss(seg(c.t, .4, .8)), lookY: .6, lookX: .9, browTilt: -.3, armN: { x: 60, y: 10 - 30 * mv, bend: 1 }, armF: { x: 80, y: 20 }, handN: 'open' } });
    c.cam({ zoom: 1.35, x: -260, y: 20 }, { zoom: 1.35, x: -140, y: 20, dz: .04 });
  }),
  // a shelf: the old bag and the tiny boots pop in (the word cards follow at once)
  'L025[8:]': S(c => {
    const sc = c.set(SHED); const k = back(clamp(c.t / .25), 2); c.L('bag').sx = c.L('bag').sy = 1.05 * k; c.L('boots').sx = c.L('boots').sy = 1.3 * k;
    c.cam({ zoom: 2.0, x: 480, y: -250 }, { zoom: 2.0, x: 480, y: -250, dz: .05 });
  }),
  // paws pull on the boots, one then the other: the real standing rig, close on the legs (bare white feet, then a boot slides up each)
  'L026': S(c => {
    const sc = c.set(SHED), F = SHED_GEO.floor; c.hide('crate', 'basket', 'bag', 'boots');
    const X = 120, Y = F + 30, D = 2.2, K = 1.5, t = c.t, dir = 1;
    // [raise, slide start, slide end, down] for the front boot (stamp 1.4 s) and the back boot (stamp 3.0 s), matching the thuds
    const ph = (a, b, e, f) => ({ up: ss(seg(t, a, b)) * (1 - ss(seg(t, e, f))), u: t < b - .05 ? -1 : ss(seg(t, b, e)) });
    const fr = ph(.2, .45, 1.2, 1.4), bk = ph(1.75, 2.0, 2.8, 3.0);
    const wig = u => u > 0 && u < 1 ? Math.sin(t * 26) * .05 : 0;
    const rF = -dir * (.06 + .9 * fr.up) + wig(fr.u), rB = -dir * (-.06 + .95 * bk.up) + wig(bk.u);
    const uF = t < .45 - .05 ? -1 : fr.u, uB = bk.u;
    const lift = 10 * (fr.up + bk.up);
    puss(c, { x: X, y: Y, d: D, s: K, face: 'R', z: 5, pose: { legF: rF, legB: rB, bootOn: [uF, uB], lift, armF: { x: dir * 50, y: -175 }, armB: { x: dir * 40, y: -175 }, shift: -dir * 8 * fr.up + dir * 4 * bk.up } });
    // the two gripping paws on the cuff of the boot being pulled, forearms reaching down from the cat above the frame
    c.layer(new Layer({ x: X, y: Y, d: D, z: 5.2, draw: (g, info) => {
      const { px, py, Z } = info, k = Z * K;
      for (const [j0, r, u, up] of [[[-dir * 22, -152 - lift], rF, uF, fr.up], [[dir * 16, -154 - lift], rB, uB, bk.up]]) {
        if (!(up > .02) || u < 0 || u >= 1) continue;
        const L = 44 + (1 - u) * 74 - 6, cx = j0[0] - Math.sin(r) * L, cy = j0[1] + Math.cos(r) * L, nx = Math.cos(r), ny = Math.sin(r);
        const a = Math.min(up, clamp(u * 8 + .4)), tug = Math.sin(t * 13) * 3;
        g.save(); g.globalAlpha = a;
        for (const sd of [-1, 1]) {
          const hx = px + (cx + sd * nx * 27) * k, hy = py + (cy + sd * ny * 27 + tug) * k, ex = hx + sd * 70 * k - dir * 10 * k, ey = py + (-260 - lift) * k;
          g.save(); g.shadowColor = 'rgba(30,12,4,.3)'; g.shadowBlur = 10 * k; g.shadowOffsetY = 5 * k;
          g.fillStyle = PAL.orange; g.beginPath(); g.moveTo(hx - 12 * k, hy - 4 * k); g.bezierCurveTo(hx - 14 * k, hy - 60 * k, ex - 16 * k, ey + 60 * k, ex - 18 * k, ey); g.lineTo(ex + 18 * k, ey); g.bezierCurveTo(ex + 16 * k, ey + 60 * k, hx + 14 * k, hy - 60 * k, hx + 12 * k, hy - 4 * k); g.closePath(); g.fill();
          g.fillStyle = PAL.white; g.beginPath(); g.ellipse(hx, hy + 6 * k, 17 * k, 20 * k, sd * .25, 0, TAU); g.fill(); g.restore();
          g.strokeStyle = '#d8cbbb'; g.lineWidth = 1.6 * k; for (const q of [-5, 3]) { g.beginPath(); g.moveTo(hx + q * k, hy + 14 * k); g.lineTo(hx + q * k, hy + 24 * k); g.stroke(); }
        }
        g.restore();
      }
    } }));
    aim(c, X + 70 * K, Y - 66 * K, D, 4.0, .5, .56, { dz: .06 });
  }),
  // the boots strut along the road, seen low: CLIP-CLOP! CLIP-CLOP!
  'L027-L028': S(c => {
    c.set(ROAD); const x = -300 + c.t * 220; puss(c, { x, y: GY + 40, face: 'R', pose: { walk: c.t * 2.4, strut: 1, chest: 1, headLift: .4, eyes: 'half' } });
    aim(c, x + 40, GY - 10, 2, 3.6, .5, .62, { X: x + 60, dz: .03 }, x => x);
    const [a0] = wt('L027', 'Clip-clop!'), [b0] = wt('L028', 'Clip-clop!'), [px, py] = [x + 60, GY - 120];
    // the words pop beside the boots (behind the cat, then ahead of him), never over his face
    c.fx(word('CLIP-CLOP!', -300 + (a0 - c.shot.t0) * 220 - 40, GY - 10, a0 - c.shot.t0, { size: 52, hold: .9, rot: -.08 }), word('CLIP-CLOP!', -300 + (b0 - c.shot.t0) * 220 + 170, GY + 0, b0 - c.shot.t0, { size: 52, hold: .9, rot: .06, col: '#ffb860' }));
  }),
  // Puss struts down the road like he owns it (chest out, tail straight up, a step every 10 frames)
  'L029': S(c => {
    c.set(ROAD); const x = -500 + c.t * 230; puss(c, { x, y: GY + 40, face: 'R', pose: { walk: c.t * 2.4, strut: 1, chest: 1, headLift: .5, eyes: 'half', mouth: 'smile' } });
    c.cam({ zoom: 1.6, x: -460 + 40, y: 40 }, { zoom: 1.6, x: -500 + 4.56 * 230 + 60, y: 40, dz: .02 }, x => x);
  }),
  // Tom tries hard not to laugh: a hand over his mouth, shoulders shaking
  'L030': S(c => {
    c.set(ROAD); const sh = ss(seg(c.t, .4, .8));
    c.actor('tom', { x: -200, y: GY + 40, who: 'Tom', pose: { lookX: .9, lookY: .2, eyes: sh > .5 ? 'happy' : 'open', brow: .4, blush: .35, shake: sh, armN: { x: 20, y: -150 }, handN: 'rest', handNRot: -.4, armF: { x: 40, y: -60 } } });
    aim(c, -195, GY + 40 - 1.25 * 360, 2, 2.6, .42, .4, { dz: .07 });
  }),
  // "From now on, call me Puss": PROUD (chin up, chest out, eyes half closed), a sparkle
  'L031': S(c => {
    c.set(ROAD); const pr = ss(seg(c.t, .1, .6));
    puss(c, { x: 200, y: GY + 40, face: 'L', pose: { lookX: -.6, lookY: -.4, headLift: pr, chest: pr, eyes: 'half', mouth: 'smile', armF: { x: -10, y: -120 }, pawF: 'rest' } });
    const [hx, hy] = pussHead(200, GY + 40); aim(c, hx, hy, 2, 4.4, .56, .4, { dz: .08 });
    c.fx(sparkle(hx - 40, hy - 40, 2.3, { n: 5, size: 14, spread: 40 }));
  }),
  // the next morning: the forest edge in birdsong; Puss walks in with his bag
  'L032': S(c => {
    c.set(FOREST); const x = -900 + c.t * 120; puss(c, { x, y: GY + 40, face: 'R', pose: { walk: c.t * 2, propF: { sheet: PR.bag(3), x: 0, y: 20, s: .55 }, lookX: .8, lookY: -.2 } });
    c.cam({ zoom: .75, x: -300, y: -40 }, { zoom: .75, x: -150, y: -40, dz: .03 });
  }),
  'L033[1:10]': S(c => {
    c.set(FOREST); const x = -300 + c.t * 130; puss(c, { x, y: GY + 40, face: 'R', pose: { walk: c.t * 2, propF: { sheet: PR.bag(3), x: 0, y: 20, s: .55 }, lookX: .8, lookY: -.1 } });
    c.layer(new Layer({ sheet: PR.bush(2, '#3f7a3e', true), x: 620, y: GY + 50, d: 2.1, z: 2.9, sx: .9, sy: .9, name: 'bush' }));
    c.cam({ zoom: 1.2, x: -40 + c.t * 0, y: 0 }, { zoom: 1.2, x: 200, y: 0, dz: .03 });
  }),
  // Puss reaches into the berry bush and holds his bag open; the red berries glow
  'L033[11:]': S(c => {
    c.set(FOREST); const r = ss(seg(c.t, .3, 1.0));
    c.layer(new Layer({ sheet: PR.bush(2, '#3f7a3e', true), x: 330, y: GY + 50, d: 2.1, z: 2.9, sx: .9, sy: .9, name: 'bush' }));
    puss(c, { x: 150, y: GY + 40, face: 'R', pose: { lookX: .9, lookY: .1, armF: { x: 40 + 40 * r, y: -150 - 20 * r }, pawF: 'open', armB: { x: 10, y: -120 }, propB: { sheet: PR.bag(3), x: 0, y: 20, s: .6 } } });
    c.cam({ zoom: 2.0, x: 210, y: 150 }, { zoom: 2.0, x: 230, y: 150, dz: .06 });
    c.fx((g, cc) => { const [x, y, Z] = cc.p(330, GY - 130, 2.1); glow(g, x, y, 200 * Z, [255, 90, 90], .18 + .06 * Math.sin(cc.t * 3)); });
  }),
  // berries pop into the bag one by one: Pick, pick, pick!
  'L034': S(c => {
    c.set(FOREST); c.layer(new Layer({ sheet: PR.bush(2, '#3f7a3e', true), x: 300, y: GY + 50, d: 2.1, z: 2.9, sx: .9, sy: .9 }));
    const bagL = prop(c, PR.bag(4), 0, GY + 40, 2.0, 1.1, { z: 4 });
    const T3 = [1, 2, 3].map(n => wt('L034', 'pick', n)[0] - c.shot.t0);
    T3.forEach((t0, i) => {
      const u = clamp((c.t - t0 + .3) / .35); if (u > 0 && u < 1) prop(c, PR.berry(4), lerp(200, 10, u), lerp(GY - 260, GY - 190, u) - Math.sin(u * Math.PI) * 120, 2.0, 1.4, { z: 4.5 });
      c.fx(word(['PICK,', 'PICK,', 'PICK!'][i], -150 + i * 150, GY - 330 - i * 30, t0, { size: 58, hold: .6, rot: -.1 + i * .08, col: '#ff8a8a' }));
    });
    c.cam({ zoom: 2.6, x: 40, y: 150 }, { zoom: 2.6, x: 40, y: 150, dz: .08 });
  }),
  // tiny Puss marches up the hill; a slow tilt up to the castle towers and flags (then the card "the castle")
  'L035': S(c => {
    const sc = c.set(HILL); sc.focus = 3.4; c.hide('near'); const u = clamp(c.t / 2.7), x = lerp(-120, -40, u), y = lerp(560, 420, u);
    puss(c, { x, y, d: 3.4, face: 'R', s: .18, pose: { walk: c.t * 2.6, strut: .8, propF: { sheet: PR.bag(3, 1), x: 0, y: 20, s: .55 } } });
    c.cam({ zoom: 1.0, x: 0, y: 260 }, { zoom: 1.0, x: 0, y: -330, dz: .03 });
  }),
  // the throne room: the guard opens the door and Puss walks in
  'L036': S(c => {
    const sc = throne(c); const op = ss(seg(c.t, .2, 1.0)); c.L('door').sx = 1 - .85 * op; c.L('door').x = TG.doorX - 180 * .85 * op;
    c.actor('guard', { x: TG.doorX + 290, y: TG.floor, d: 2.4, who: 'Guard', face: 'L', pose: { lookX: .5, armN: { x: -40, y: -100 }, handN: 'hold', propN: { sheet: spear(), x: 0, y: -60, rot: 0, s: 1 } } });
    const wx = lerp(TG.doorX - 60, TG.doorX + 200, ss(seg(c.t, 1.0, 3.3)));
    if (c.t > .9) puss(c, { x: wx, y: TG.floor, d: 2.5, face: 'R', pose: { walk: c.t * 2.2, strut: .6, propF: { sheet: PR.bag(3, 1), x: 0, y: 20, s: .55 }, lookX: .8, lookY: -.4 } });
    king(c, { lookX: .9, lookY: .2 });
    c.cam({ zoom: .78, x: -180, y: -80 }, { zoom: .78, x: -120, y: -80, dz: .04 });
  }),
  // the king on his throne, seen from low (after the card "the king")
  'L037': S(c => { throne(c); king(c, { lookX: .5, lookY: .2 }); c.cam({ zoom: 1.6, x: 360, y: -120, dz: 0 }, { zoom: 1.6, x: 360, y: -140, dz: .07 }); }),
  // tilt up the king's long white beard
  'L038[1:6]': S(c => { throne(c); king(c, { lookX: .5, lookY: .2 }); aim(c, kingHead[0] + 10, kingHead[1] + 70, KING.d, 3.4, .5, .5, { Y: kingHead[1] + 30, fy: .45, dz: .03 }); }),
  // the tiny gold crown on the big head; hold so kids notice how tiny it is (the card "the crown" follows)
  'L038[7:]': S(c => { throne(c); king(c, { lookX: .5, lookY: -.3, brow: .3 }); aim(c, kingHead[0], kingHead[1] - 70, KING.d, 4.6, .5, .45, { dz: .05 }); c.fx(sparkle(kingHead[0] - 10, kingHead[1] - 120, .15, { n: 4, size: 14, spread: 30, d: KING.d })); }),
  // over Puss's shoulder: he bows very low, "Your Majesty"
  'L039': S(c => {
    throne(c); const b = ss(seg(c.t, 1.2, 1.8)) * (1 - ss(seg(c.t, 3.2, 3.8)));
    king(c, { lookX: .9, lookY: .5, brow: .3 });
    puss(c, { x: -380, y: TG.floor + 250, d: 1.5, s: .6, face: 'R', blur: 6, pose: { bow: b, lookX: .9, lookY: -.3, armF: { x: 50, y: -120 }, pawF: 'open', propB: { sheet: PR.bag(3, 1), x: 0, y: 20, s: .55 } } });
    c.cam({ zoom: 1.3, x: 110, y: -90 }, { zoom: 1.3, x: 120, y: -90, dz: .06 });
  }),
  'L040': S(c => GIFT(c, PR.bag(3, 1), { puss: { headLift: .3 } })),
  // "The Marquis of Carabas?" (puzzled: one brow up, one angled)
  'L041': S(c => KCU(c, { lookX: .9, lookY: .2, browL: .9, browR: -.3, browTilt: .2, headTilt: .05 })),
  // "Never heard of him. But these berries are delicious!": he bites a berry, eyes close, a happy face
  'L042-L043': S(c => {
    const [d0] = wt('L043', 'But'), hap = ss(seg(c.T, d0 - .3, d0));
    KCU(c, { lookX: .8, lookY: .3, browTilt: hap > .5 ? 0 : .3, eyes: hap > .5 ? 'happy' : 'open', mouth: hap > .5 ? 'smile' : 'closed', armN: { x: -30 + 40 * hap, y: -170 - 30 * hap }, handN: 'hold', propN: { sheet: PR.berry(4), x: 0, y: 6, s: 1.2 } });
    c.fx(sparkle(kingHead[0] - 70, kingHead[1] - 40, d0 - c.shot.t0 + .1, { n: 4, size: 12, spread: 40, d: KING.d }));
  }),
  // there was no Marquis: Puss, innocent, eyes slide aside
  'L044': S(c => {
    throne(c); king(c, { lookX: .8 });
    puss(c, { x: -120, y: TG.floor, d: 2.2, face: 'R', pose: { lookX: lerp(.8, -.6, ss(seg(c.t, .4, .8))), lookY: -.2, eyes: 'open', mouth: 'closed', armF: { x: 20, y: -100 }, armB: { x: 10, y: -100 } } });
    const [hx, hy] = pussHead(-120, TG.floor); aim(c, hx, hy, 2.2, 2.6, .45, .4, { dz: .06 });
  }),
  // Puss made up the name: a paw to his mouth; "Marquis" pops up in letters over his head
  'L045': S(c => {
    throne(c); puss(c, { x: -120, y: TG.floor, d: 2.2, face: 'R', pose: { lookX: .3, lookY: -.6, eyes: 'half', mouth: 'smirk', armF: { x: 30, y: -270 }, pawF: 'rest' } });
    const [hx, hy] = pussHead(-120, TG.floor); aim(c, hx, hy, 2.2, 3.4, .5, .45, { dz: .07 });
    c.fx(word('Marquis', hx + 10, hy - 120, .6, { size: 54, col: '#ffe08a', hold: 1.4, d: 2.2, rot: -.05 }));
  }),
  // inside Puss's thought bubble: a grand, fancy lord with a tall hat bows
  'L046[1:6]': S(c => {
    throne(c); puss(c, { x: -120, y: TG.floor, d: 2.2, face: 'R', pose: { lookX: .4, lookY: -.8, eyes: 'half', mouth: 'smile' } });
    const [hx, hy] = pussHead(-120, TG.floor); aim(c, hx, hy, 2.2, 3.0, .32, .62, { dz: .06 });
    const lord = rigFor('lord', 2); const [bx, by] = atS(c, .44, .48, 2.2);
    c.fx(thought(bx, by, .1, 3.0, (g, w, h, t) => { const b = Math.sin(clamp((t - .9) / 1.2) * Math.PI) * .45; lord.pose(c.T, { lookX: .5, mouth: 'smile', eyes: 'half', lean: b, armN: { x: -60, y: -40 + 40 * b }, handN: 'open', armF: { x: 70, y: -120 }, handF: 'open', blink: blink('lord') }); const sh = lord.dyn, k = h * .9 / 760 * 1.1; g.drawImage(sh.c, -sh.ax / sh.res * k, -sh.ay / sh.res * k + h * .42, sh.c.width / sh.res * k, sh.c.height / sh.res * k); }, { size: .72, w: 420, h: 300, dir: [1, -1], d: 2.2 }));
  }),
  // Puss winks; the bubble pops
  'L046[7:]': S(c => {
    throne(c); const wink = pulse(c.t, .5, 1.4) > .2;
    puss(c, { x: -120, y: TG.floor, d: 2.2, face: 'R', pose: { lookX: .9, lookY: -.2, eyes: wink ? 'winkR' : 'half', mouth: 'smirk' } });
    const [hx, hy] = pussHead(-120, TG.floor); aim(c, hx, hy, 2.2, 3.6, .45, .42, { dz: .07 });
    c.fx(sparkle(hx + 30, hy - 30, .55, { n: 3, size: 12, spread: 20, d: 2.2 }), puffs(hx + 160, hy - 160, .15, { n: 6, size: 18, col: '255,250,240', d: 2.2 }));
  }),
  // the king, dreamy, remembers the name: a star over his head
  'L047': S(c => { throne(c); king(c, { lookX: .3, lookY: -.6, eyes: 'half', mouth: 'smile', smile: .6, headTilt: -.06 }); c.cam({ zoom: 1.8, x: 330, y: -150 }, { zoom: 1.8, x: 330, y: -160, dz: .08 }); c.fx(sparkle(kingHead[0] + 40, kingHead[1] - 150, .6, { n: 1, size: 34, spread: 2, dur: 2.6, d: KING.d })); }),
  // the next week: the window light has changed (a slow cross-dissolve)
  'L048[1:3]': S(c => { throne(c, 1); c.hide('curtainF'); king(c, { lookX: .6 }); c.cam({ zoom: .85, x: 60, y: -150 }, { zoom: .85, x: 80, y: -150, dz: .04 }); }),
  // Puss at the door with sweet peaches and warm bread popping into his arms
  'L048[4:]': S(c => {
    throne(c, 1); c.hide('curtainF'); const p1 = back(clamp((c.t - .3) / .25), 2), p2 = back(clamp((c.t - 1.1) / .25), 2);
    puss(c, { x: TG.doorX + 160, y: TG.floor, d: 2.4, face: 'R', pose: { lookX: .8, lookY: -.3, mouth: 'smile', armF: { x: 46, y: -105 }, armB: { x: 40, y: -120 }, pawF: 'open', pawB: 'open', propF: p1 > 0 ? { sheet: PR.basket(3, 'peach'), x: 0, y: 10, s: 1.0 * p1 } : null, propB: p2 > 0 ? { sheet: PR.bread(3), x: 10, y: -10, s: 1.1 * p2, rot: -.3 } : null } });
    const [hx, hy] = pussHead(TG.doorX + 160, TG.floor); aim(c, hx + 20, hy + 40, 2.4, 3.0, .5, .42, { dz: .06 });
  }),
  'L049': S(c => GIFT(c, PR.basket(3, 'peach'), { week: 1, puss: { mouth: 'smile' } })),
  // "Never heard of him," with his mouth full (cheeks puffed)
  'L050[1:7]': S(c => { c.__week = 1; KCU(c, { lookX: .8, lookY: .3, browTilt: .3, mouth: 'closed', armN: { x: -10, y: -140 }, handN: 'hold', propN: { sheet: PR.peach(4), x: 0, y: 8, s: .8 } }); c.fx(puffCheeks(kingHead, KING.d)); }),
  // insert: the king's puffed cheeks, munching
  'L050[8:]': S(c => { c.__week = 1; throne(c, 1); king(c, { lookX: .6, lookY: .3, eyes: 'happy', mouth: 'closed' }); aim(c, kingHead[0], kingHead[1] + 50, KING.d, 6.0, .5, .5, { dz: .06 }); c.fx(puffCheeks(kingHead, KING.d, 1.4)); }),
  // reaction: Puss's smug little smile while the king praises the bread
  'L051': S(c => { throne(c, 1); puss(c, { x: -120, y: TG.floor, d: 2.2, face: 'R', pose: { lookX: .9, lookY: -.3, eyes: 'half', mouth: 'smirk', headLift: .3 } }); const [hx, hy] = pussHead(-120, TG.floor); aim(c, hx, hy, 2.2, 4.0, .45, .42, { dz: .07 }); }),
  // the week after that: the window light turns golden
  'L052[1:4]': S(c => { throne(c, 2); c.hide('curtainF'); king(c, { lookX: .6 }); c.cam({ zoom: .85, x: 60, y: -150 }, { zoom: .85, x: 40, y: -150, dz: .04 }); }),
  'L052[5:]': S(c => GIFT(c, PR.honey(3), { week: 2, puss: { mouth: 'smile' } })),
  // "Never heard of him," licking his sticky fingers
  'L053[1:7]': S(c => { c.__week = 2; KCU(c, { lookX: .8, lookY: .3, browTilt: .3, armN: { x: -40, y: -190 }, handN: 'point', handNRot: Math.sin(c.t * 4) * .1 }); }),
  // insert: honey drips onto sticky fingers; the king licks them
  'L053[8:]': S(c => {
    c.__week = 2; throne(c, 2); king(c, { lookX: .8, lookY: .5, mouth: c.t > 1.0 ? 'o' : 'smile', armN: { x: -60, y: -150 + 20 * ss(seg(c.t, .9, 1.4)) }, handN: 'point' });
    aim(c, kingHead[0] - 60, kingHead[1] + 60, KING.d, 4.6, .5, .5, { Y: kingHead[1] + 20, dz: .04 });
    c.fx(honeyDrip(kingHead[0] - 95, kingHead[1] - 30, KING.d));
  }),
  // "But this is delicious!": a happy bounce
  'L054': S(c => { c.__week = 2; throne(c, 2); king(c, { lookX: .7, lookY: .1, eyes: 'happy', mouth: 'grin', lift: Math.abs(Math.sin(c.t * 7)) * 10 * (1 - ss(seg(c.t, 1.4, 2.0))), armN: { x: -70, y: -120 }, handN: 'open', armF: { x: 60, y: -110 }, handF: 'open' }); c.cam({ zoom: 1.8, x: 340, y: -150 }, { zoom: 1.8, x: 340, y: -150, dz: .07 }); }),
  // "I really must meet this Marquis.": a stronger push-in on his face
  'L055': S(c => { c.__week = 2; KCU(c, { lookX: .5, lookY: -.3, eyes: 'open', brow: .5, armN: { x: -20, y: -180 }, handN: 'point' }, 3.0, { zoom: 3.6, dz: .12 }); }),
  // Puss's sly smile, then a wink on "the plan all along"
  'L056-L057': S(c => {
    throne(c, 2); const [p0] = wt('L057', 'plan'), wink = c.T > p0 - .1 && c.T < p0 + .8;
    puss(c, { x: -120, y: TG.floor, d: 2.2, face: 'R', pose: { lookX: .6, lookY: -.2, eyes: wink ? 'winkR' : 'half', mouth: 'smirk', headLift: .2 } });
    const [hx, hy] = pussHead(-120, TG.floor); aim(c, hx, hy, 2.2, 4.2, .45, .42, { dz: .09 });
    c.fx(sparkle(hx + 40, hy - 30, p0 - c.shot.t0, { n: 3, size: 12, spread: 20, d: 2.2 }));
  }),
};
const spear = () => PR.spear(2);
function puffCheeks([x, y], d, k = 1) { return (g, c) => { const [px, py, Z] = c.p(x, y + 40, d), s = Z * k * (1 + .08 * Math.sin(c.t * 9)); for (const sx of [-1, 1]) { const cx = px + sx * 46 * s - 14 * s, cy = py - 8 * s, gr = g.createRadialGradient(cx, cy, 0, cx, cy, 30 * s); gr.addColorStop(0, 'rgba(244,150,130,.95)'); gr.addColorStop(.55, 'rgba(246,184,150,.95)'); gr.addColorStop(1, 'rgba(246,196,160,.0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, 30 * s, 24 * s, 0, 0, TAU); g.fill(); } }; }
function honeyDrip(x, y, d) { return (g, c) => { const [px, py, Z] = c.p(x, y, d); for (let i = 0; i < 3; i++) { const u = ((c.t * .8 + i / 3) % 1); g.fillStyle = 'rgba(255,180,40,.92)'; g.beginPath(); g.ellipse(px, py + u * 120 * Z, 6 * Z, (8 + u * 6) * Z, 0, 0, TAU); g.fill(); } g.fillStyle = 'rgba(255,190,60,.9)'; g.beginPath(); g.moveTo(px - 8 * Z, py - 30 * Z); g.quadraticCurveTo(px, py + 10 * Z, px + 8 * Z, py - 30 * Z); g.fill(); }; }
