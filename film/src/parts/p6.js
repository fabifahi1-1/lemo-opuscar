// PART 6: the promise, the ogre's castle, the knock gag, the doorbell, the ogre, the lion, the roof.
// The knock gag (L125-L129) keeps one framing on the door; the words and the door's jolt grow each time.
import { S, blink } from '../kit/stage.js';
import { word, bubble, sparkle, puffs, poof, sweat, speedLines, notes, shiver, mark, rumble } from '../kit/fx.js';
import * as PR from '../kit/props.js';
import { ROAD, HILL, GY, carriage } from '../kit/sets.js';
import { OGRE, OG } from '../kit/sets2.js';
import { bootShape } from '../kit/cat.js';
import { Layer } from '../engine.js';
import { clamp, lerp, ss, eio, seg, back, TAU, mulberry } from '../lib.js';
import { wt, aim, atS } from './util.js';

const puss = (c, o) => c.actor('puss', { who: 'Puss', ...o });
const pussHead = (x, y, s = .37) => [x, y - s * 380];
const F = OG.floor, D = 2.0;
const ogreS = 3.2, ogreHead = (x, y) => [x + 20, y - 364 * ogreS];
const ogre = (c, x, pose = {}, o = {}) => c.actor('ogre', { x, y: F + 20, d: 2.05, z: 3.4, s: ogreS, who: 'Ogre', face: 'L', ...o, pose: { lookX: .8, lookY: .4, ...pose } });
const door = c => { const sc = c.set(OGRE); return sc; };
const roofY = x => OG.roofY0 + 40 + (x - OG.roofX0) * (OG.roofY1 - OG.roofY0) / (OG.roofX1 - OG.roofX0) - 6;   // the roof surface (world)
// the knock gag: the same framing on the door; k = 0..4 grows the word and the jolt
function knock(c, k, words) {
  const sc = door(c), times = words.map(([lid, w, n]) => wt(lid, w, n || 1)[0] - c.shot.t0);
  let hit = 0; for (const t0 of times) hit = Math.max(hit, clamp(1 - (c.t - t0) / .25) * (c.t >= t0 - .02 ? 1 : 0));
  sc.door.x = -OG.doorW / 2 + Math.sin(c.t * 80) * hit * (2 + k * 2.5);
  const raise = times.reduce((a, t0) => Math.max(a, Math.sin(clamp((c.t - t0 + .18) / .36) * Math.PI)), 0);
  puss(c, { x: -40, y: F, d: D, z: 4, face: 'R', pose: { lookX: .6, lookY: -.6, brow: .2 * k, armF: { x: 70, y: -210 - 30 * raise }, pawF: 'rest', lean: .05 * raise, mouth: k > 2 ? 'grin' : 'closed' } });
  aim(c, 40, F - 330, D, 1.15, .5, .48, { dz: .05 });
  times.forEach((t0, i) => c.fx(word(k < 2 ? 'Knock' : 'KNOCK!', 60 + i * 180 + k * 10, F - 420 - k * 30 - i * 30, t0, { size: [30, 40, 60, 80, 104][k], hold: .5, rot: -.08 + i * .1, col: k < 2 ? '#fbf6ee' : '#ffd24a', d: D })));
  if (k === 4) c.shake(times[0], .35, 3);
}

export const P6 = {
  // the carriage rolls on slowly (a slow pull-back)
  'L116': S(c => {
    c.set(ROAD); const x = -500 + c.t * 90; carriage(c, x, GY + 60, { d: 2.1, s: .95, phase: c.t * 1.4, roll: c.t * 1.2, pass: [{ kind: 'king:seat', dx: 100, who: 'King', face: 'R', pose: { lookX: .8, lift: 30 } }, { kind: 'princess:seat', dx: -80, dy: -48, who: 'Princess', face: 'R', pose: { lookX: .8, mouth: 'smile' } }] });
    c.cam({ zoom: 1.05, x: -260, y: -60 }, { zoom: .85, x: -200, y: -60, dz: 0 });
  }),
  // Puss runs ahead again, dust puffs
  'L117[1:4]': S(c => {
    c.set(ROAD); const x = -400 + c.t * 520; puss(c, { x, y: GY + 40, face: 'R', pose: { walk: c.t * 4, run: 1, lookX: 1, earLag: .3 } });
    c.cam({ zoom: 1.3, x: -380, y: 20 }, { zoom: 1.3, x: -400 + 2 * 520 - 60, y: 20, dz: .02 }, u => u);
    for (let k = 0; k < 8; k++) c.fx(puffs(-400 + k * .25 * 520, GY + 30, k * .25, { n: 3, size: 14, dur: .5, seed: k }));
  }),
  // high and wide: tiny Puss reaches the end of the road
  'L117[5:]': S(c => {
    c.set(HILL); c.hide('near'); const u = ss(seg(c.t, 0, 3.2)), x = lerp(-700, -140, u), y = lerp(640, 560, u);
    puss(c, { x, y, d: 3.4, face: 'R', s: .2, pose: { walk: u < 1 ? c.t * 4 : null, run: 1 - u, lookX: .9, lookY: -.4 } });
    for (let k = 0; k < 10; k++) c.fx(puffs(-700 + k * 56, 640 - k * 8, k * .32, { n: 2, size: 8, dur: .5, seed: k, d: 3.4 }));
    c.cam({ zoom: .75, x: -200, y: 260 }, { zoom: .82, x: -150, y: 200, dz: .03 });
  }),
  // Puss alone at the end of the road; the castle ahead; music drops away
  'L118': S(c => {
    c.set(HILL); c.hide('near'); puss(c, { x: -140, y: 560, d: 3.4, face: 'R', s: .3, pose: { lookX: .6, lookY: -.8, earsDown: .3 } });
    c.cam({ zoom: 1.15, x: -170, y: 150 }, { zoom: 1.15, x: -170, y: 140, dz: .07 });
  }),
  // a slow push-in: Puss worried: brows in, a wobbly mouth, a gulp
  'L119': S(c => {
    c.set(HILL); c.hide('near'); puss(c, { x: -140, y: 560, d: 3.4, face: 'R', s: .3, pose: { lookX: .4, lookY: -.6, brow: .7, browTilt: -.6, mouth: 'wobbly', earsDown: .6, puff: Math.max(0, Math.sin(clamp((c.t - 1.6) / .3) * Math.PI)) * .3 } });
    const [hx, hy] = pussHead(-140, 560, .3); aim(c, hx, hy, 3.4, 3.4, .45, .44, { dz: .16 });
    c.fx(sweat(-140 + 40, 560 - .3 * 380 - 60, 1.0, { d: 3.4 }));
  }),
  // the huge castle; a slow tilt up from the courtyard to the towers
  'L120[1:5]': S(c => { door(c); puss(c, { x: -60, y: F + 80, d: D, z: 4, face: 'R', pose: { lookX: .4, lookY: -1 } }); c.cam({ zoom: .42, x: 0, y: -400 }, { zoom: .42, x: 0, y: -900, dz: .02 }); }),
  // tall stone towers and colourful flags flapping (a pan along the towers)
  'L120[6:]': S(c => { door(c); c.cam({ zoom: .95, x: -1250, y: F - 2050 }, { zoom: .95, x: 1150, y: F - 2050, dz: .03 }); }),
  // the doormat: BEWARE OF OGRE
  'L121': S(c => { door(c); aim(c, 0, F + 70, OG.castleD - .08, 2.2, .5, .5, { dz: .05 }); }),
  // tilt up the huge door; tiny Puss at its foot
  'L122[1:12]': S(c => {
    door(c); puss(c, { x: -110, y: F, d: D, z: 4, face: 'R', pose: { lookX: .3, lookY: -1, mouth: 'o' } });
    c.cam({ zoom: 1.0, x: 0, y: F - 120 }, { zoom: 1.0, x: 0, y: F - 560, dz: .03 });
  }),
  // a giant shadow passes the high window; thunder; the shutters shake; startled birds fly off
  'L122[13:17]': S(c => {
    const sc = door(c); sc.shadowAt = c.shot.t0 + .1; const sh = clamp(1 - Math.abs(c.t - .9) / .7);
    sc.shL.rot = Math.sin(c.t * 40) * .08 * sh - .1 * sh; sc.shR.rot = -Math.sin(c.t * 37) * .08 * sh + .1 * sh;
    aim(c, OG.winX, OG.winY + 40, OG.castleD, 1.6, .5, .5, { dz: .06 });
    c.fx((g, cc) => { const R = mulberry(3); for (let i = 0; i < 6; i++) { const u = clamp((cc.t - .5 - i * .06) / 1.3); if (u <= 0 || u >= 1) continue; const [px, py, Z] = cc.p(OG.winX + 160 + R() * 120 + u * (300 + R() * 300), OG.winY - 60 - u * (300 + R() * 200), OG.castleD); const fl = Math.sin(cc.t * 30 + i) * 10 * Z; g.strokeStyle = '#2a2430'; g.lineWidth = 5 * Z; g.lineCap = 'round'; g.beginPath(); g.moveTo(px - 18 * Z, py - fl); g.quadraticCurveTo(px - 8 * Z, py - 6 * Z, px, py); g.quadraticCurveTo(px + 8 * Z, py - 6 * Z, px + 18 * Z, py - fl); g.stroke(); } });
    c.fx(rumble(OG.winX, OG.winY + 220, .2, 1.8, { d: OG.castleD }));
  }),
  // a pair of huge fluffy pink slippers airing on the step
  'L122[18:]': S(c => { door(c); aim(c, -380, F - 10, OG.castleD - .05, 3.2, .5, .52, { dz: .06 }); }),
  // three tiny forest animals hide behind a bush and whisper about the pink slippers
  'L123': S(c => {
    const sc = door(c); const X = OG.bushX;
    const peek = (k, dx, t0) => Math.max(0, Math.sin(clamp((c.t - t0) / 1.4) * Math.PI)) * 50;
    c.actor('rabbit', { x: X - 120, y: F - 20 - peek(0, 0, .2) * 2.2, d: 2.01, z: 3.85, face: 'R', who: 'rabbit', contact: false, pose: { lookX: .9, lookY: -.2, earFlop: .2 } });
    c.actor('squirrel', { x: X, y: F - 20 - peek(1, 0, 1.2) * 2.2, d: 2.01, z: 3.86, face: 'R', who: 'squirrel', contact: false, pose: { lookX: .9, lookY: -.1 } });
    c.actor('hedgehog', { x: X + 130, y: F - 10 - peek(2, 0, 2.4) * 2, d: 2.01, z: 3.87, face: 'R', who: 'hedgehog', contact: false, pose: { lookX: .9 } });
    aim(c, X, F - 40, 2.0, 2.4, .45, .5, { dz: .06 });
    c.fx(bubble('pink!', X - 120 + 80, F - 160, .5, 1.5, { kind: 'whisper', size: 30, tail: [-.6, 1] }), bubble('pink!', X + 80, F - 170, 1.5, 2.6, { kind: 'whisper', size: 30, tail: [-.6, 1] }), bubble('shh!', X + 130 + 80, F - 130, 2.7, 4.2, { kind: 'whisper', size: 30, tail: [-.6, 1] }));
  }),
  // high and wide: tiny Puss walks up to the huge door
  'L124': S(c => {
    door(c); const x = lerp(-700, -60, ss(seg(c.t, 0, 2.9))); puss(c, { x, y: F + 20, d: D, z: 4, face: 'R', pose: { walk: c.t < 2.9 ? c.t * 2.4 : null, lookX: .6, lookY: -.6 } });
    c.cam({ zoom: .7, x: -300, y: F - 520 }, { zoom: .7, x: -150, y: F - 560, dz: .03 });
  }),
  'L125': S(c => knock(c, 0, [['L125', 'Knock.']])),
  'L126': S(c => knock(c, 1, [['L126', 'Knock,'], ['L126', 'knock.', 2]])),
  'L127': S(c => knock(c, 2, [['L127', 'KNOCK!']])),
  'L128': S(c => knock(c, 3, [['L128', 'KNOCK!']])),
  'L129': S(c => knock(c, 4, [['L129', 'KNOCK!']])),
  // nobody answers: Puss shrugs, ears drooping
  'L130': S(c => {
    door(c); const sh = Math.sin(clamp((c.t - .3) / .8) * Math.PI);
    puss(c, { x: -40, y: F, d: D, z: 4, face: 'R', pose: { lookX: -.6, lookY: .2, earsDown: .8, brow: .4, browTilt: .3, mouth: 'flat', armF: { x: 60, y: -170 - 30 * sh }, armB: { x: -40, y: -170 - 30 * sh }, pawF: 'open', pawB: 'open', lift: 6 * sh } });
    const [hx, hy] = pussHead(-40, F); aim(c, hx + 60, hy, D, 2.6, .5, .45, { dz: .06 });
  }),
  // a paw presses the doorbell
  'L131': S(c => {
    const sc = door(c); const pr = ss(seg(c.t, 1.0, 1.4)) * (1 - ss(seg(c.t, 1.8, 2.2))), up = ss(seg(c.t, .2, 1.0));
    sc.bellL.sx = sc.bellL.sy = .6 * (1 - .05 * pr);
    puss(c, { x: OG.bellX - 30, y: F, d: D, z: 4, face: 'R', pose: { lookX: .5, lookY: -.9, mouth: 'smile', lift: 30 * up, armF: { x: 60 + 100 * up + 10 * pr, y: -100 - 40 * up }, pawF: 'point', bootFRot: -.2 * up, bootBRot: -.2 * up } });
    aim(c, OG.bellX - 30, OG.bellY + 30, D, 3.0, .5, .5, { dz: .06 });
  }),
  // the doorbell: music notes float out
  'L132[1:6]': S(c => { door(c); aim(c, OG.bellX, OG.bellY, OG.castleD - .015, 3.6, .45, .55, { dz: .07 }); c.fx(notes(OG.bellX + 40, OG.bellY - 40, .2, c.dur, { d: OG.castleD - .015 })); }),
  // Ding-a-ling-a-ling! Puss taps his foot to the tune
  'L132[7:]': S(c => {
    door(c); const tap = Math.max(0, Math.sin(c.t * TAU * 2));
    puss(c, { x: 160, y: F, d: D, z: 4, face: 'L', pose: { lookX: .5, lookY: -.6, mouth: 'smile', eyes: 'half', bootFRot: -.35 * tap, legF: .1 * tap, headTilt: Math.sin(c.t * TAU) * .06 } });
    aim(c, 200, F - 220, D, 1.9, .5, .5, { dz: .05 });
    c.fx(notes(OG.bellX + 40, OG.bellY - 40, 0, c.dur, { d: OG.castleD - .015, seed: 9 }));
    const [d0] = wt('L132', 'Ding-a-ling-a-ling!'); c.fx(word('Ding-a-ling!', OG.bellX + 170, OG.bellY - 170, d0 - c.shot.t0, { size: 44, hold: 1.2, col: '#ffe07a', d: D }));
  }),
  // Puss raises one eyebrow, amused by the silly tune
  'L133': S(c => {
    door(c); const r = ss(seg(c.t, .4, .9));
    puss(c, { x: 160, y: F, d: D, z: 4, face: 'L', pose: { lookX: .6, lookY: -.4, browL: .9 * r, browR: -.2 * r, mouth: 'smirk', eyes: 'open' } });
    const [hx, hy] = pussHead(160, F); aim(c, hx, hy, D, 4.2, .48, .45, { dz: .07 });
    c.fx(notes(OG.bellX + 40, OG.bellY - 40, 0, 1.6, { d: OG.castleD - .015, seed: 2 }));
  }),
  // the door creaks open; a slow pull-out reveals the ogre's legs and pink slippers filling the doorway
  'L134': S(c => {
    const sc = door(c); sc.doorOpen = ss(seg(c.t, .1, 1.4));
    const hole = gg => { const [x0, y0] = c.p(-OG.doorW / 2, F - OG.doorH, OG.castleD), [x1, y1] = c.p(OG.doorW / 2, F, OG.castleD); gg.rect(x0, y0, x1 - x0, y1 - y0); };
    if (c.t > .6) ogre(c, 0, { lookX: .5, lookY: .6 }, { d: OG.castleD + .002, z: 2.44, clip: hole, contact: false, shadow: false });
    puss(c, { x: -230, y: F + 20, d: D, z: 4, face: 'R', pose: { lookX: .6, lookY: -1, wide: .5, mouth: 'o', earPerk: .5 } });
    c.cam({ zoom: 1.6, x: -40, y: F - 300 }, { zoom: .85, x: -40, y: F - 420, dz: 0 });
    c.fx(puffs(0, F - 10, .5, { n: 6, size: 22, dur: 1.0, d: OG.castleD }));
  }),
  // high angle: tiny Puss looks up and bows a little: "Sir Ogre"
  'L135': S(c => {
    door(c); const b = Math.sin(clamp((c.t - .8) / 1.2) * Math.PI);
    ogre(c, 260, { lookX: .5, lookY: .9, mouth: 'closed', brow: -.3 });
    puss(c, { x: -120, y: F + 40, d: D, z: 4, face: 'R', pose: { lookX: .6, lookY: -1, bow: b * .5, armF: { x: 40, y: -120 }, mouth: 'smile' } });
    aim(c, 0, F - 260, D, 1.3, .5, .55, { dz: .06 });
  }),
  // Puss, innocent: "I hear you can turn into any animal", paw gestures
  'L136': S(c => {
    door(c); const w = Math.sin(c.t * 3);
    ogre(c, 260, { lookX: .5, lookY: .9, brow: .3, browTilt: .3, armN: { x: 40, y: -160 } });
    puss(c, { x: -120, y: F + 40, d: D, z: 4, face: 'R', pose: { lookX: .6, lookY: -1, eyes: 'open', mouth: 'smile', armF: { x: 60 + 20 * w, y: -170 - 20 * w }, pawF: 'open', headTilt: .05 } });
    const [hx, hy] = pussHead(-120, F + 40); aim(c, hx + 120, hy - 80, D, 1.8, .45, .55, { dz: .06 });
  }),
  // Puss tilts his head: "Is it true?"
  'L137': S(c => {
    door(c); puss(c, { x: -120, y: F + 40, d: D, z: 4, face: 'R', pose: { lookX: .6, lookY: -1, eyes: 'open', wide: .3, mouth: 'smile', headTilt: .15 * ss(seg(c.t, .2, .6)) } });
    const [hx, hy] = pussHead(-120, F + 40); aim(c, hx, hy, D, 4.4, .45, .45, { dz: .07 });
  }),
  // low angle: the ogre "Of course!"; POOF, he becomes a lion; ROAR!
  'L138-L139': S(c => {
    door(c); const [r0] = wt('L139', 'ROAR!'), tr = r0 - c.shot.t0, tp = tr - .55, isLion = c.t > tp + .25;
    if (!isLion) ogre(c, 160, { lookX: .3, lookY: .9, mouth: 'grin', brow: .4, armN: { x: 130, y: -40 }, handN: 'open', armF: { x: 50, y: -100 } });
    else c.actor('lion', { x: 160, y: F + 20, d: 2.05, z: 3.4, s: 2.0, face: 'L', who: 'Lion', pose: { lookX: .6, lookY: .6, mouth: c.t > tr - .05 ? 'roar' : 'closed', lift: c.t > tr ? 6 : 0 } });
    c.cam({ zoom: .7, x: 100, y: F - 640 }, { zoom: .78, x: 100, y: F - 600, dz: 0 });
    c.fx(poof(160, F - 500, tp, { size: 620 }));
    c.fx(word('ROAR!', 60, F - 900, tr, { size: 110, hold: .9, col: '#ffb860' })); c.shake(tr, .35, 3);
  }),
  // the lion fills the frame; tiny Puss beside him
  'L140': S(c => {
    door(c); c.actor('lion', { x: 160, y: F + 20, d: 2.05, z: 3.4, s: 2.0, face: 'L', who: 'Lion', pose: { lookX: .6, lookY: .8, mouth: 'closed', tailUp: .6 } });
    puss(c, { x: -260, y: F + 40, d: D, z: 4, face: 'R', pose: { lookX: .6, lookY: -1, wide: .6, mouth: 'o', earsDown: .5 } });
    c.cam({ zoom: .9, x: 0, y: F - 380 }, { zoom: .9, x: 0, y: F - 380, dz: .07 });
  }),
  // EEEK! comic fear: fur puffs, eyes wide, body shrinks back (snap-zoom)
  'L141': S(c => {
    door(c); const pf = ss(seg(c.t, .05, .25));
    puss(c, { x: -260, y: F + 40, d: D, z: 4, face: 'R', pose: { lookX: .8, lookY: -.6, eyes: 'wide', mouth: 'o', puff: pf, lean: -.15 * pf, earsDown: .8, tailUp: 1, armF: { x: -30, y: -200 }, armB: { x: -30, y: -200 }, pawF: 'open', pawB: 'open' } });
    const [hx, hy] = pussHead(-260, F + 40); aim(c, hx, hy, D, 2.4, .5, .45, { dz: .02 }); c.snap(.05, 6, .5);
    const [e0] = wt('L141', '"EEEK!"'); c.fx(word('EEEK!', hx + 120, hy - 110, e0 - c.shot.t0, { size: 80, hold: 1.0, col: '#fbf6ee' }), shiver(hx, hy + 60, .1, c.dur, { w: 120, h: 140 }));
  }),
  // Puss leaps onto the roof (a motion arc)
  'L142': S(c => {
    door(c); c.actor('lion', { x: 160, y: F + 20, d: 2.05, z: 3.4, s: 2.0, face: 'L', who: 'Lion', pose: { lookX: .9, lookY: -.2, mouth: 'closed' } });
    const u = ss(seg(c.t, .2, 1.2)), x0 = -260, x1 = 560, x = lerp(x0, x1, u), y = lerp(F + 40, roofY(x1), u) - Math.sin(u * Math.PI) * 380, dd = lerp(D, OG.castleD - .02, u);
    puss(c, { x, y, d: dd, z: u > .9 ? 2.6 : 4.2, face: 'R', pose: { lookX: .9, lookY: -.2, eyes: 'wide', crouch: u > .98 ? .4 : 0, legF: -.6 * Math.sin(u * Math.PI), legB: .6 * Math.sin(u * Math.PI), tailUp: 1 } });
    c.cam({ zoom: .62, x: 150, y: F - 520 }, { zoom: .62, x: 250, y: F - 540, dz: .03 });
    c.fx((g, cc) => { if (u <= 0 || u >= 1) return; g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 6; g.setLineDash([18, 14]); g.beginPath(); for (let k = 0; k <= 20; k++) { const uu = u * k / 20, xx = lerp(x0, x1, uu), yy = lerp(F + 40, roofY(x1), uu) - Math.sin(uu * Math.PI) * 380 - 60; const [px, py] = cc.p(xx, yy, lerp(D, OG.castleD, uu)); k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); g.setLineDash([]); });
  }),
  // XCU: his boots slip on the roof tiles
  'L143': S(c => {
    door(c); const x = 560 + c.t * 30, sl = Math.sin(c.t * 22) * .3;
    puss(c, { x, y: roofY(x), d: OG.castleD - .02, z: 2.6, face: 'R', pose: { lookX: .5, lookY: .6, eyes: 'wide', lean: .1 + .1 * sl, legF: -.5 + sl, legB: .4 - sl, armF: { x: -40, y: -200 }, armB: { x: 40, y: -210 }, pawF: 'open', pawB: 'open' } });
    aim(c, x + 20, roofY(x) - 20, OG.castleD - .02, 4.2, .5, .55, { dz: .06 });
  }),
  // Slide, slide, slide! down the roof
  'L144': S(c => {
    door(c); const u = clamp(c.t / 2.2), x = lerp(560, OG.roofX1 - 20, u);
    puss(c, { x, y: roofY(x), d: OG.castleD - .02, z: 2.6, face: 'R', pose: { lookX: .9, lookY: .3, eyes: 'wide', mouth: 'o', lean: -.2, legF: -.5, legB: -.2, armF: { x: -50, y: -220 }, armB: { x: -40, y: -220 }, pawF: 'open', pawB: 'open', tailUp: 1 } });
    c.cam({ zoom: 1.0, x: 600, y: F - 330 }, { zoom: 1.0, x: 800, y: F - 280, dz: .03 });
    [['Slide,', 1], ['slide,', 2], ['slide!', 3]].forEach(([w, n], i) => { const t0 = wt('L144', w, n)[0] - c.shot.t0, xx = lerp(560, OG.roofX1 - 20, clamp(t0 / 2.2)); c.fx(word('SLIDE!', xx - 60, roofY(xx) - 180 - i * 10, t0, { size: 66, hold: .35, rot: .3, col: '#bfe6ff', d: OG.castleD })); });
    c.fx(speedLines(t => lerp(560, OG.roofX1 - 20, clamp(t / 2.2)) - 80, t => roofY(lerp(560, OG.roofX1 - 20, clamp(t / 2.2))) - 80, .1, 2.2, { dir: 1, n: 4, h: 90, d: OG.castleD }));
  }),
  // at the bottom edge of the roof Puss straightens his whiskers, pretending he meant to do that
  'L145': S(c => {
    door(c); const x = OG.roofX1 - 30, sm = ss(seg(c.t, .6, 1.4));
    puss(c, { x, y: roofY(x), d: OG.castleD - .02, z: 2.6, face: 'L', pose: { lookX: -.5, lookY: -.2, eyes: 'half', mouth: 'smirk', headLift: .4 * sm, chest: sm, armF: { x: -24, y: -268 + Math.sin(c.t * 6) * 6 * (1 - sm) }, pawF: 'open', earPerk: .4 } });
    const [hx, hy] = pussHead(x, roofY(x)); aim(c, hx, hy, OG.castleD - .02, 4.0, .5, .45, { dz: .07 });
  }),
  // the lion turns back into the ogre (a small POOF)
  'L146[1:6]': S(c => {
    door(c); const tp = .7;
    if (c.t < tp + .25) c.actor('lion', { x: 160, y: F + 20, d: 2.05, z: 3.4, s: 2.0, face: 'L', who: 'Lion', pose: { lookX: .9, lookY: -.4 } });
    else ogre(c, 160, { lookX: .9, lookY: -.5, mouth: 'grin', armN: { x: 60, y: -100 } });
    puss(c, { x: OG.roofX1 - 30, y: roofY(OG.roofX1 - 30), d: OG.castleD - .02, z: 2.6, face: 'L', pose: { lookX: -.6, lookY: .4, eyes: 'open' } });
    c.cam({ zoom: .62, x: 300, y: F - 560 }, { zoom: .62, x: 400, y: F - 560, dz: .03 });
    c.fx(poof(160, F - 450, tp, { size: 420 }));
  }),
  // Puss climbs down the drainpipe
  'L146[7:]': S(c => {
    door(c); const u = ss(seg(c.t, .1, 1.9)), x = OG.roofX1 + 18, y = lerp(roofY(OG.roofX1) + 120, F, u), cl = Math.sin(c.t * 9);
    puss(c, { x: x - 22, y, d: OG.castleD - .02, z: 2.6, face: 'R', pose: { lookX: .3, lookY: .6, armF: { x: 30, y: -220 + 30 * cl }, armB: { x: 30, y: -200 - 30 * cl }, pawF: 'open', pawB: 'open', legF: -.3 * cl, legB: .3 * cl, mouth: 'flat' } });
    aim(c, x, lerp(roofY(OG.roofX1) + 60, F - 120, u), OG.castleD - .02, 1.9, .5, .5, { dz: .05 });
  }),
};
