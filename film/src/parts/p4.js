// PART 4: the river and the carriage. The trust-me exchange is fast alternating close-ups; "TRUST ME!" snaps in.
import { S, rigFor, talk, blink, pulse, antic3 } from '../kit/stage.js';
import { word, bubble, sparkle, puffs, mark, bits, shiver, speedLines } from '../kit/fx.js';
import * as PR from '../kit/props.js';
import { RIVER, RIV, ROAD, GY, carriage, CARRIAGE_IN } from '../kit/sets.js';
import { Layer, glow } from '../engine.js';
import { clamp, lerp, ss, eio, seg, back, TAU } from '../lib.js';
import { wt, aim, atS } from './util.js';

const puss = (c, o) => c.actor('puss', { who: 'Puss', ...o });
const pussHead = (x, y) => [x, y - .37 * 380];
const BANK = RIV.waterY + 160;             // where people stand or sit on the near bank
const TOMS = { x: -60, y: BANK - 6, d: 1.92 }, tomHead = [TOMS.x + 10, TOMS.y - 260];
// Tom sits on the bank by the river, looking toward the water (screen right)
const tomSit = (c, pose = {}, o = {}) => c.actor('tom:seat', { x: TOMS.x, y: TOMS.y, d: TOMS.d, z: 6, who: 'Tom', ...o, pose: { lookX: .8, lookY: .1, ...pose } });
// the water in front of someone in the river: covers him below the waterline, with a moving line of ripples
const waterFront = (x, y, d, w = 520) => new Layer({ x, y, d, z: 4.7, noDepth: true, draw(g, info) { const { px, py, Z } = info, t = performance.now ? 0 : 0; g.fillStyle = 'rgba(92,150,186,.94)'; g.beginPath(); g.moveTo(px - w * Z, py); for (let k = 0; k <= 24; k++) { const xx = px - w * Z + k * w * 2 * Z / 24; g.lineTo(xx, py + Math.sin(k * .9 + (info.sc.t || 0) * 4) * 4 * Z); } g.lineTo(px + w * Z, py + 400 * Z); g.lineTo(px - w * Z, py + 400 * Z); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3 * Z; g.beginPath(); for (let k = 0; k <= 24; k++) { const xx = px - w * Z + k * w * 2 * Z / 24; g.lineTo(xx, py + Math.sin(k * .9 + (info.sc.t || 0) * 4) * 4 * Z); } g.stroke(); } });
const INRIVER = { x: 260, y: RIV.waterY + 120, d: 2.15 };
function tomInRiver(c, pose = {}, k = 1) {
  c.actor('tom', { x: INRIVER.x, y: INRIVER.y + 130 * k, d: INRIVER.d, z: 4.5, who: 'Tom', contact: false, pose: { lookX: .3, lookY: -.1, ...pose } });
  c.layer(waterFront(INRIVER.x, INRIVER.y - 120, INRIVER.d));
}
// the royal carriage stopped on the road; Puss on the right
const CAR = { x: -380, y: GY + 60, d: 2.1, s: .95 };
const winPos = () => [CAR.x + 100 * CAR.s, CAR.y - 30 * CAR.s - 285 * CAR.s];
const kingIn = (pose = {}) => ({ kind: 'king:seat', dx: 100, who: 'King', face: 'R', pose: { lookX: .8, ...pose } });
const princessIn = (pose = {}) => ({ kind: 'princess:seat', dx: -80, dy: -48, who: 'Princess', face: 'R', pose: { lookX: .8, mouth: 'smile', smile: .6, ...pose } });

export const P4 = {
  // Tom sits by the river; Puss bursts in from the left and points: "Master, jump in the river!"
  'L064': S(c => {
    c.set(RIVER); const run = ss(seg(c.t, 0, .6)), x = lerp(-900, -380, run);
    tomSit(c, { lookX: -.8, lookY: -.1, brow: .4 }, { face: 'R' });
    puss(c, { x, y: BANK, d: 1.9, z: 6.2, face: 'R', pose: run < 1 ? { walk: c.t * 4, run: 1 } : { armF: { x: 70, y: -190 }, pawF: 'point', lookX: .9, lookY: -.2, mouth: 'smile', lean: .1 } });
    c.cam({ zoom: 1.15, x: -60, y: 140 }, { zoom: 1.15, x: -20, y: 140, dz: .05 });
    if (c.t < .7) c.fx(puffs(x - 40, BANK - 10, .3, { n: 4, size: 18, d: 1.9 }));
  }),
  // Tom looks up: "Why?"
  'L065-L066': S(c => { c.set(RIVER); tomSit(c, { lookX: -.9, lookY: lerp(.3, -.3, ss(seg(c.t, .4, .9))), brow: .5, headTilt: .05 }, { face: 'L' }); aim(c, TOMS.x - 10, TOMS.y - 260, TOMS.d, 3.0, .56, .4, { dz: .07 }); }),
  // Puss, calm and sure: "Trust me"
  'L067': S(c => { c.set(RIVER); puss(c, { x: -380, y: BANK, d: 1.9, z: 6.2, face: 'R', pose: { lookX: .9, lookY: .2, eyes: 'half', mouth: 'smile', armF: { x: 20, y: -170 }, pawF: 'rest' } }); const [hx, hy] = pussHead(-380, BANK); aim(c, hx, hy, 1.9, 4.2, .44, .42, { dz: .07 }); }),
  // Tom, worried: "Is the water cold?"
  'L068': S(c => { c.set(RIVER); tomSit(c, { lookX: -.9, lookY: -.1, browTilt: -.8, brow: .3, mouth: 'wobbly', wob: t => Math.sin(t * 7) }, { face: 'L' }); aim(c, TOMS.x - 10, TOMS.y - 260, TOMS.d, 3.0, .56, .4, { dz: .07 }); }),
  // COMIC SNAP-ZOOM: "TRUST ME!" in a big speech bubble
  'L069': S(c => { c.set(RIVER); puss(c, { x: -380, y: BANK, d: 1.9, z: 6.2, face: 'R', pose: { lookX: .9, lookY: .1, mouth: 'grin', brow: .5, armF: { x: 60, y: -230 }, pawF: 'point', chest: 1 } }); const [hx, hy] = pussHead(-380, BANK); aim(c, hx, hy, 1.9, 3.2, .44, .45, { dz: .02 }); c.snap(.05, 6, .5); const [bx, by] = atS(c, .73, .25, 1.9); c.fx(bubble('TRUST ME!', bx, by, .15, 1.65, { kind: 'shout', size: 72, tail: [-.9, 1], d: 1.9 })); }),
  // SPLASH! Tom in the river; drops fly; a small shake
  'L070': S(c => {
    c.set(RIVER); const [s0] = wt('L070', 'SPLASH!'), ts = s0 - c.shot.t0 - .3, jump = ss(seg(c.t, 0, ts + .1));
    if (c.t < ts + .05) c.actor('tom', { x: lerp(-60, INRIVER.x, jump), y: lerp(BANK, INRIVER.y, jump) - Math.sin(jump * Math.PI) * 220, d: lerp(1.92, INRIVER.d, jump), z: 4.6, who: 'Tom', contact: false, pose: { lookX: .9, lookY: .3, eyes: 'happy', armN: { x: -70, y: -270 }, armF: { x: 70, y: -270 }, handN: 'open', handF: 'open', legF: -.6, legB: .5 } });
    else { tomInRiver(c, { eyes: 'wide', brow: 1, mouth: 'o', armN: { x: -90, y: -200 }, armF: { x: 90, y: -200 }, handN: 'open', handF: 'open' }); c.fx(bits(INRIVER.x, INRIVER.y - 80, ts, { n: 26, col: '#bfe4f6', r: 7, spread: 2.6, d: INRIVER.d, dur: 1.1 })); }
    c.fx(word('SPLASH!', INRIVER.x - 40, INRIVER.y - 520, ts, { size: 110, col: '#8fd0f0', d: INRIVER.d }));
    c.cam({ zoom: 1.25, x: 80, y: 100 }, { zoom: 1.12, x: 80, y: 100, dz: 0 }); c.shake(ts, .3, 4);
  }),
  // high angle: Tom shivers in the cold river, teeth chattering (then the card "the river")
  'L071': S(c => { c.set(RIVER); tomInRiver(c, { lookX: .1, lookY: .6, browTilt: -.8, brow: .4, mouth: 'flat', shake: 1, blush: .05, armN: { x: -10, y: -140 }, armF: { x: 30, y: -140 }, handN: 'fist', handF: 'fist' }); aim(c, INRIVER.x, INRIVER.y - 240, INRIVER.d, 2.2, .5, .52, { dz: .07 }); c.fx(shiver(INRIVER.x, INRIVER.y - 270, 0, 4.3, { w: 150, h: 160, d: INRIVER.d })); }),
  // Puss hides Tom's old clothes under a rock; the rock wobbles
  'L072': S(c => {
    const sc = c.set(RIVER), push = ss(seg(c.t, .6, 1.8)), rk = c.L('rock');
    rk.rot = Math.sin(c.t * 22) * .05 * pulse(c.t, 1.7, 2.6); rk.y = RIV.waterY + 150 - 14 * pulse(c.t, 1.7, 2.4);
    if (push < 1) c.layer(new Layer({ sheet: PR.clothes(3), x: lerp(-760, -440, push), y: RIV.waterY + 175, d: 1.87, z: 5.3, sx: .9, sy: .9 }));
    puss(c, { x: lerp(-900, -560, push), y: BANK + 10, d: 1.86, z: 6.2, face: 'R', pose: { lean: .25 * push * (1 - ss(seg(c.t, 2.6, 3.2))), lookX: .9, lookY: .3, armF: { x: 60, y: -110 }, armB: { x: 50, y: -100 }, pawF: 'open', pawB: 'open', mouth: c.t > 2.8 ? 'smirk' : 'closed' } });
    c.cam({ zoom: 1.8, x: -560, y: 260 }, { zoom: 1.8, x: -480, y: 260, dz: .05 });
  }),
  // then he runs up the bank to the road
  'L073[1:6]': S(c => { c.set(ROAD); const x = -700 + c.t * 420; puss(c, { x, y: GY + 40, face: 'R', pose: { walk: c.t * 4, run: 1 } }); c.cam({ zoom: 1.1, x: -500, y: 0 }, { zoom: 1.1, x: -100, y: 0, dz: .03 }); for (let k = 0; k < 7; k++) c.fx(puffs(-700 + k * .4 * 420, GY + 30, k * .4, { n: 3, size: 16, dur: .5, seed: k })); }),
  // he waves both paws at the road
  'L073[7:]': S(c => { c.set(ROAD); const w = Math.sin(c.t * 9); puss(c, { x: 300, y: GY + 40, face: 'L', pose: { lookX: .9, lookY: -.3, mouth: 'grin', armF: { x: -60 + 20 * w, y: -300 }, armB: { x: 50 - 20 * w, y: -300 }, pawF: 'open', pawB: 'open', lift: Math.abs(w) * 6 } }); const [hx, hy] = pussHead(300, GY + 40); aim(c, hx, hy + 40, 2, 2.6, .55, .45, { dz: .06 }); }),
  // the royal carriage rolls in (after the card "the carriage")
  'L074': S(c => { c.set(ROAD); const x = lerp(-1500, -600, eio(clamp(c.t / 2.9))); carriage(c, x, CAR.y, { d: CAR.d, s: CAR.s, pass: [kingIn(), princessIn()] }); c.cam({ zoom: .7, x: -300, y: -60 }, { zoom: .7, x: -200, y: -60, dz: .03 }); }),
  // "HELP!" cried Puss
  'L075': S(c => { c.set(ROAD); carriage(c, CAR.x, CAR.y, { d: CAR.d, s: CAR.s, still: true, roll: 0, horses: false, pass: [kingIn({ lookX: .9 }), princessIn()] }); const w = Math.sin(c.t * 10); puss(c, { x: 360, y: GY + 40, d: 1.95, face: 'L', pose: { lookX: .9, lookY: -.2, mouth: 'grin', brow: .6, armF: { x: -60 + 25 * w, y: -300 }, armB: { x: 50 - 25 * w, y: -300 }, pawF: 'open', pawB: 'open' } }); const [hx, hy] = pussHead(360, GY + 40); aim(c, hx, hy + 30, 1.95, 2.6, .58, .45, { dz: .06 }); const [bx, by] = atS(c, .3, .24, 1.95); c.fx(bubble('HELP!', bx, by, .25, 1.8, { kind: 'shout', size: 76, tail: [.9, 1], d: 1.95 })); }),
  // "Robbers took the Marquis's clothes!" (flailing paws)
  'L076': S(c => { c.set(ROAD); carriage(c, CAR.x, CAR.y, { d: CAR.d, s: CAR.s, still: true, roll: 0, pass: [kingIn({ lookX: .9 }), princessIn()] }); const w = Math.sin(c.t * 8), w2 = Math.sin(c.t * 6.3 + 1); puss(c, { x: 360, y: GY + 40, d: 1.95, face: 'L', pose: { lookX: .9, lookY: -.3, brow: .8, browTilt: -.4, armF: { x: -80 + 60 * w, y: -250 + 50 * w2 }, armB: { x: 60 - 50 * w2, y: -240 + 40 * w }, pawF: 'open', pawB: 'open', lift: Math.abs(w) * 5 } }); const [hx, hy] = pussHead(360, GY + 40); aim(c, hx - 120, hy + 30, 1.95, 1.9, .62, .45, { dz: .06 }); }),
  // the king leans out of the carriage: SURPRISE, "The Marquis of Carabas?"
  'L077': S(c => { c.set(ROAD); const up = antic3(c.t, .1, .5); carriage(c, CAR.x, CAR.y, { d: CAR.d, s: CAR.s, still: true, roll: 0, horses: false, pass: [kingIn({ lookX: 1, lookY: .1, brow: Math.max(0, up), wide: Math.max(0, up) * .8, mouth: 'o', lift: 30 * Math.max(0, up) }), princessIn()] }); const [wx, wy] = winPos(); aim(c, wx + 10, wy - 20, CAR.d, 3.2, .44, .45, { dz: .07 }); }),
  // puzzled, then pleased: "The one who sends me gifts?"
  'L078': S(c => { c.set(ROAD); const pl = ss(seg(c.t, 1.0, 1.6)); carriage(c, CAR.x, CAR.y, { d: CAR.d, s: CAR.s, still: true, roll: 0, horses: false, pass: [kingIn({ lookX: 1, lookY: .1, browL: 1 - pl, browR: -.2 * (1 - pl), browTilt: .2 * (1 - pl), mouth: pl > .5 ? 'smile' : 'closed', lift: 30 }), princessIn()] }); const [wx, wy] = winPos(); aim(c, wx + 10, wy - 20, CAR.d, 3.2, .44, .45, { dz: .07 }); }),
  // he points commandingly: "Stop the carriage! Bring him my best clothes!"
  'L079-L080': S(c => { c.set(ROAD); const pt = ss(seg(c.t, .1, .4)); carriage(c, CAR.x, CAR.y, { d: CAR.d, s: CAR.s, still: true, roll: 0, pass: [kingIn({ lookX: 1, lookY: 0, brow: .3, browTilt: .5, lift: 30, armN: { x: 60 + 80 * pt, y: -200 }, handN: 'point' }), princessIn({ lookX: -.5 })] }); const [wx, wy] = winPos(); aim(c, wx + 60, wy + 40, CAR.d, 1.9, .42, .45, { dz: .06 }); }),
  // a servant runs to the river with the clothes
  'L081': S(c => { c.set(RIVER); const x = -900 + c.t * 300; c.actor('servant', { x, y: BANK, d: 1.92, z: 6.2, who: 'servant', pose: { walk: c.t * 3.4, lean: .12, armN: { x: 70, y: -95 }, armF: { x: 70, y: -90 }, handN: 'hold', handF: 'hold', propN: { sheet: PR.clothes(3, true), x: 0, y: 10, s: .85 }, lookX: .9 } }); tomInRiver(c, { lookX: -.8, lookY: -.1, browTilt: -.4, shake: .6 }); c.cam({ zoom: .95, x: -300, y: 60 }, { zoom: .95, x: -60, y: 60, dz: .03 }); for (let k = 0; k < 8; k++) c.fx(puffs(-900 + k * .5 * 300, BANK - 10, k * .5, { n: 2, size: 14, dur: .5, seed: k, d: 1.92 })); }),
  // Tom scrambles out of the river and behind a bush
  'L082[1:5]': S(c => { const sc = c.set(RIVER), u = ss(seg(c.t, .1, 1.8)); c.actor('tom', { x: lerp(INRIVER.x, 520, u), y: lerp(INRIVER.y + 130, BANK + 40, u), d: lerp(INRIVER.d, 1.9, u), z: u > .5 ? 5.45 : 4.5, who: 'Tom', contact: u > .5, pose: { walk: c.t * 3, lookX: .9, browTilt: -.4, shake: .5 } }); if (u < .4) c.layer(waterFront(INRIVER.x, INRIVER.y - 120, INRIVER.d)); c.cam({ zoom: 1.5, x: 260, y: 140 }, { zoom: 1.5, x: 420, y: 140, dz: .05 }); }),
  // the bush wiggles; a blue jacket pops up over it
  'L082[6:11]': S(c => { const sc = c.set(RIVER), b = sc.bush; b.rot = Math.sin(c.t * 18) * .04; b.sx = b.sy = 1 + Math.sin(c.t * 11) * .02; const [j0] = wt('L082', 'jacket,'), u = clamp((c.T - j0 + .1) / .4); if (u > 0) c.layer(new Layer({ sheet: PR.jacket(3), x: 520, y: RIV.waterY - 60 - Math.sin(u * Math.PI) * 160, d: 1.87, z: 5.6, rot: u * 2.2, sx: 1.1, sy: 1.1 })); c.cam({ zoom: 1.9, x: 520, y: 220 }, { zoom: 1.9, x: 520, y: 220, dz: .06 }); c.fx(puffs(520, RIV.waterY + 20, .3, { n: 5, size: 16, col: '120,170,100', d: 1.88 })); }),
  // new trousers and shiny shoes pop up over the bush, one on each word
  'L082[12:]': S(c => { const sc = c.set(RIVER), b = sc.bush; b.rot = Math.sin(c.t * 18) * .04; const [p0] = wt('L082', 'pants,'), [s0] = wt('L082', 'shoes.'); for (const [t0, sh, dx] of [[p0, PR.trousers(3), -60], [s0, PR.shoes(3), 70]]) { const u = clamp((c.T - t0 + .1) / .45); if (u > 0) c.layer(new Layer({ sheet: sh, x: 520 + dx, y: RIV.waterY - 40 - Math.sin(u * Math.PI) * 170, d: 1.87, z: 5.6, rot: u * 2.6 * (dx > 0 ? 1 : -1), sx: 1, sy: 1 })); } c.cam({ zoom: 2.3, x: 520, y: 160 }, { zoom: 2.3, x: 520, y: 150, dz: .06 }); }),
  // Tom steps out in his blue jacket (a sparkle); pan to the carriage, where the princess smiles (card "the princess" follows)
  'L083': S(c => { c.set(RIVER); c.actor('tomJ', { x: 380, y: BANK + 20, d: 1.9, z: 6.2, who: 'Tom', face: 'L', pose: { lookX: .6, lookY: .2, mouth: 'smile', smile: .5, blush: .3 } }); c.cam({ zoom: 1.6, x: 380, y: 0 }, { zoom: 1.6, x: 300, y: 0, dz: .05 }); c.fx(sparkle(380, BANK - 300, .2, { n: 6, size: 18, spread: 80, d: 1.9 })); }),
  // Tom shy: the blush fades in, eyes down, a small smile
  'L084': S(c => { c.set(ROAD); c.actor('tomJ', { x: 200, y: GY + 40, who: 'Tom', face: 'L', pose: { lookX: .3, lookY: .8, blush: lerp(.15, .7, ss(seg(c.t, .3, 1.4))), mouth: 'smile', smile: .35, headTilt: .05 } }); aim(c, 205, GY + 40 - 1.25 * 350, 2, 3.0, .58, .4, { dz: .07 }); }),
  // the king from the carriage window: "Please, ride with us"
  'L085': S(c => { c.set(ROAD); carriage(c, CAR.x, CAR.y, { d: CAR.d, s: CAR.s, still: true, roll: 0, horses: false, pass: [kingIn({ lookX: 1, lookY: .1, mouth: 'smile', lift: 30, armN: { x: 90, y: -170 }, handN: 'open' }), princessIn({ lookX: .9 })] }); const [wx, wy] = winPos(); aim(c, wx - 40, wy + 20, CAR.d, 2.2, .45, .45, { dz: .07 }); }),
  // Tom climbs into the carriage
  'L086': S(c => { c.set(ROAD); const u = ss(seg(c.t, .3, 2.0)); carriage(c, CAR.x, CAR.y, { d: CAR.d, s: CAR.s, still: true, roll: 0, pass: [kingIn(), princessIn()] }); if (u < .82) c.actor('tomJ', { x: lerp(200, CAR.x + 20, u), y: GY + 40 - 60 * Math.sin(u * Math.PI), d: lerp(2.0, 2.08, u), z: u > .7 ? 3.45 : 4.2, who: 'Tom', face: 'L',  pose: { walk: c.t * 2, lookX: .8, mouth: 'smile', smile: .4, blush: .4 } }); c.cam({ zoom: 1.1, x: -60, y: -40 }, { zoom: 1.1, x: -120, y: -40, dz: .04 }); }),
  // Puss glances left and right, sly
  'L087[1:6]': S(c => { c.set(ROAD); const lk = Math.sin(c.t * 3.2); puss(c, { x: 360, y: GY + 40, d: 1.95, face: 'L', pose: { lookX: lk, lookY: -.1, eyes: 'half', mouth: 'smirk', crouch: .25 } }); const [hx, hy] = pussHead(360, GY + 40); aim(c, hx, hy, 1.95, 3.8, .55, .42, { dz: .07 }); }),
  // the carriage rolls off one way; Puss tiptoes into the trees the other way
  'L087[7:]': S(c => { c.set(ROAD); carriage(c, lerp(CAR.x, CAR.x - 900, ss(seg(c.t, .2, 3.0))), CAR.y, { d: CAR.d, s: CAR.s, face: 'L', pass: [kingIn({ lookX: .5 }), princessIn()] }); puss(c, { x: lerp(360, 900, ss(seg(c.t, .4, 3.0))), y: GY + 40, d: 1.95, face: 'R', pose: { walk: c.t * 2.6, crouch: .35, lookX: -.5, eyes: 'half', mouth: 'smirk' } }); c.cam({ zoom: .8, x: 0, y: -40 }, { zoom: .8, x: 80, y: -40, dz: .03 }); }),
};
