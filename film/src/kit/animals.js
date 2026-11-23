// Paper animals on one four-legged rig: body, head (face drawn per frame), ears, tail, two near and two far legs.
// Units match the people (Tom stands 456 units tall); all use scale 1.25 like the people. Facing screen right; flip to face left.
import { paint } from '../engine.js';
import { PAL, rr, ell } from '../art.js';
import { Rig } from '../puppets.js';
import { TAU, clamp, ss } from '../lib.js';

const P = (n, sheet, parent, jx, jy, z, extra = {}) => ({ name: n, sheet, parent, jx, jy, z, ...extra });
const darker = (hex, k = .78) => { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return `rgb(${r * k | 0},${g * k | 0},${b * k | 0})`; };
function eyesHook(o) {   // simple bright eyes that blink and look; an optional mouth
  return (g, p) => {
    const s = p.face || {}, bl = s.blink || 0, lx = (s.lookX ?? .5) * (o.look ?? 4), ly = (s.lookY ?? 0) * (o.look ?? 4);
    for (const [ex, ey, r] of o.eyes) {
      if (bl > .85 || s.eyes === 'happy') { g.strokeStyle = PAL.ink; g.lineWidth = r * .45; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - r, ey); g.quadraticCurveTo(ex, ey + (s.eyes === 'happy' ? -r * .8 : r * .5), ex + r, ey); g.stroke(); continue; }
      const wide = s.eyes === 'wide' ? 1 : 0;
      if (o.white) { g.fillStyle = '#fffbee'; ell(g, ex, ey, r * 1.25 * (1 + wide * .2), r * 1.4 * (1 - bl * .9) * (1 + wide * .2)); g.fill(); }
      g.fillStyle = PAL.ink; ell(g, ex + lx * .5, ey + ly * .5, r * (wide ? .5 : .8), r * (1 - bl * .9) * (wide ? .5 : 1)); g.fill();
      g.fillStyle = '#fff'; ell(g, ex + lx * .5 - r * .3, ey + ly * .5 - r * .35, r * .28, r * .3); g.fill();
    }
    if (o.mouth) o.mouth(g, s);
  };
}
function quad(spec, { res = 2 } = {}) {
  const R = Math.max(2, res), C = spec.col, CD = spec.colD || darker(spec.col), sh = (w, h, ax, ay, fn) => paint(w, h, fn, { ax, ay, res: R, fin: spec.fin || { rim: .5, under: .3, side: .15 } });
  const L = spec.legL, LW = spec.legW;
  const leg = (col) => sh(LW * 3, L + 40, LW * 1.5, 10, g => { g.fillStyle = col; g.beginPath(); g.moveTo(-LW / 2, -4); g.bezierCurveTo(-LW / 2 - 1, L * .4, -LW * .42, L * .8, -LW * .42, L - 2); g.lineTo(LW * .42, L - 2); g.bezierCurveTo(LW * .42, L * .8, LW / 2 + 1, L * .4, LW / 2, -4); g.closePath(); g.fill(); if (spec.hoof) { g.fillStyle = spec.hoof; rr(g, -LW * .5, L - 6, LW, 12, 4); g.fill(); } if (spec.sock) { g.fillStyle = spec.sock; rr(g, -LW * .5, L - 16, LW, 18, 6); g.fill(); } });
  const body = sh(spec.bw * 1.6, spec.bh * 2.2, spec.bw * .8, spec.bh * 1.2, g => spec.body(g, C, CD));
  const head = sh(spec.hw * 2.4, spec.hh * 2.6, spec.hw * 1.2, spec.hh * 1.5, g => spec.head(g, C, CD));
  const tail = spec.tail ? sh(160, 160, 80, 80, g => spec.tail(g, C, CD)) : null;
  const ear = spec.ear ? sh(120, 160, 60, 130, g => spec.ear(g, C, CD)) : null;
  const hip = -L - spec.legRaise;
  const parts = [P('root', null, null, 0, 0, 0), P('body', body, 'root', 0, hip, 2)];
  const fx = spec.legX || [spec.bw * .32, -spec.bw * .3];
  parts.push(P('legFB', leg(CD), 'body', fx[0] + 10, spec.legY ?? 0, 1.1), P('legBB', leg(CD), 'body', fx[1] + 10, spec.legY ?? 0, 1.1));
  parts.push(P('legFN', leg(C), 'body', fx[0], spec.legY ?? 0, 2.5, { drop: 1 }), P('legBN', leg(C), 'body', fx[1], spec.legY ?? 0, 2.5, { drop: 1 }));
  if (tail) parts.push(P('tail', tail, 'body', spec.tailAt[0], spec.tailAt[1], 1.0));
  if (ear) parts.push(P('earB', ear, 'head', spec.earAt[0] + 14, spec.earAt[1], 2.8, { bright: .8 }));
  parts.push(P('head', head, 'body', spec.headAt[0], spec.headAt[1], 3, { hook: eyesHook(spec.face), drop: 1 }));
  if (ear) parts.push(P('earN', ear, 'head', spec.earAt[0], spec.earAt[1], 3.3, {}));
  if (spec.mane) parts.push(P('mane', sh(spec.mane.w, spec.mane.h, spec.mane.w / 2, spec.mane.h / 2, g => spec.mane.draw(g, C, CD)), 'head', spec.mane.at[0], spec.mane.at[1], 2.9));
  const W = spec.W || 700, H = spec.H || 600, rig = new Rig(parts, W, H, W / 2, H - 40, R);
  rig.height = spec.height;
  rig.pose = (t, o = {}) => {
    const T = rig.parts, v = (x, d) => typeof x === 'function' ? x(t) : (x ?? d), ph = o.walk != null ? v(o.walk) : null;
    const amp = spec.amp ?? .4, br = .015 * Math.sin(t / (spec.breathe || 3.3) * TAU + spec.bw);
    T.body.sy = 1 + br; T.body.jy = hip - (ph != null ? Math.abs(Math.sin(ph * Math.PI)) * (spec.bob ?? 5) : 0) - v(o.lift, 0); T.body.rot = v(o.lean, 0) + (o.shake ? Math.sin(t * 60) * .02 * v(o.shake, 0) : 0);
    if (ph != null) { const a = Math.sin(ph * Math.PI); T.legFN.rot = -amp * a; T.legBB.rot = -amp * a; T.legFB.rot = amp * a; T.legBN.rot = amp * a; }
    else { T.legFN.rot = T.legFB.rot = T.legBN.rot = T.legBB.rot = 0; }
    T.head.rot = Math.sin(t * .5 + 1) * .03 + v(o.headTilt, 0) + (o.nod ? v(o.nod, 0) * .15 : 0) + (ph != null ? Math.sin(ph * Math.PI * 2) * .03 : 0);
    if (T.tail) T.tail.rot = Math.sin(t * TAU / (spec.tailT || 2.5)) * (spec.tailAmp ?? .18) + v(o.tailUp, 0);
    if (T.earN) { const flop = v(o.earFlop, 0); T.earN.rot = Math.sin(t * .9) * .04 + flop * Math.sin(t * 7) * .25 + (ph != null ? Math.sin(ph * Math.PI) * .12 * (spec.earBounce ?? 1) : 0); T.earB.rot = T.earN.rot * .8 - .1; }
    if (T.mane) { T.mane.sx = T.mane.sy = 1 + v(o.puff, 0) * .12; T.mane.rot = Math.sin(t * .7) * .02; }
    T.head.face = { blink: v(o.blink, 0), lookX: v(o.lookX, .6), lookY: v(o.lookY, 0), eyes: v(o.eyes, 'open'), talk: v(o.talk, 0), mouth: v(o.mouth, 'closed') };
    if (spec.post) spec.post(T, t, o, v);
    return rig.render();
  };
  return rig;
}

// ---------- the donkey: grey, long floppy ears, a white muzzle, a tufted tail ----------
export function donkey(o) {
  return quad({ col: '#9a98a6', colD: '#7a7886', hoof: '#3a3238', legL: 120, legW: 24, legRaise: 16, bw: 300, bh: 150, hw: 110, hh: 120, height: 400,
    body: (g, C) => { g.fillStyle = C; g.beginPath(); g.moveTo(-150, -40); g.bezierCurveTo(-160, -130, 100, -150, 150, -90); g.bezierCurveTo(170, -50, 150, 20, 110, 24); g.bezierCurveTo(40, 34, -100, 34, -140, 20); g.bezierCurveTo(-160, 10, -158, -10, -150, -40); g.closePath(); g.fill(); g.fillStyle = '#d8d4dc'; g.beginPath(); g.moveTo(-90, 20); g.quadraticCurveTo(0, 40, 90, 18); g.quadraticCurveTo(0, 26, -90, 20); g.fill(); g.strokeStyle = '#5a5866'; g.lineWidth = 5; g.beginPath(); g.moveTo(80, -120); g.quadraticCurveTo(0, -132, -80, -118); g.stroke(); },
    head: (g, C) => { g.fillStyle = C; g.beginPath(); g.moveTo(-40, -60); g.bezierCurveTo(-30, -110, 50, -110, 60, -60); g.bezierCurveTo(70, -10, 90, 30, 80, 60); g.bezierCurveTo(60, 96, 0, 96, -10, 60); g.bezierCurveTo(-20, 20, -50, -20, -40, -60); g.closePath(); g.fill(); g.fillStyle = '#e8e2e6'; ell(g, 40, 64, 42, 32); g.fill(); g.fillStyle = '#5a4a56'; ell(g, 30, 70, 5, 4); g.fill(); ell(g, 56, 66, 5, 4); g.fill(); g.strokeStyle = '#5a4a56'; g.lineWidth = 3; g.beginPath(); g.moveTo(24, 84); g.quadraticCurveTo(44, 92, 64, 82); g.stroke(); g.fillStyle = '#4a4050'; g.beginPath(); g.moveTo(-30, -84); g.quadraticCurveTo(-10, -110, 10, -96); g.quadraticCurveTo(-6, -80, -30, -84); g.fill(); },
    ear: (g, C, CD) => { g.fillStyle = C; g.beginPath(); g.moveTo(-14, 0); g.bezierCurveTo(-24, -60, -12, -110, 0, -120); g.bezierCurveTo(12, -110, 24, -60, 14, 0); g.closePath(); g.fill(); g.fillStyle = '#e8b8c0'; g.beginPath(); g.moveTo(-6, -10); g.bezierCurveTo(-12, -50, -6, -90, 0, -100); g.bezierCurveTo(6, -90, 12, -50, 6, -10); g.fill(); g.fillStyle = '#3a3238'; g.beginPath(); g.moveTo(-6, -104); g.quadraticCurveTo(0, -126, 6, -104); g.fill(); },
    tail: (g, C) => { g.strokeStyle = C; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-20, 30, -14, 70); g.stroke(); g.fillStyle = '#4a4050'; g.beginPath(); g.ellipse(-14, 82, 10, 18, .2, 0, TAU); g.fill(); },
    headAt: [140, -100], earAt: [0, -86], tailAt: [-150, -60], face: { eyes: [[28, -38, 8]], white: false },
    W: 760, H: 640 }, o);
}
// ---------- a sheep: a fluffy cloud with a dark face and legs ----------
export function sheep(o) {
  return quad({ col: '#f6f2ea', colD: '#d8d2c6', legL: 52, legW: 14, legRaise: 6, bw: 170, bh: 100, hw: 60, hh: 60, height: 190, amp: .35,
    body: (g, C) => { g.fillStyle = C; g.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.moveTo(Math.cos(a) * 66 + 26, Math.sin(a) * 40 - 46); g.arc(Math.cos(a) * 66, Math.sin(a) * 40 - 46, 30, 0, TAU); } g.fill(); g.beginPath(); g.ellipse(0, -46, 74, 46, 0, 0, TAU); g.fill(); },
    head: (g) => { g.fillStyle = '#3a3438'; g.beginPath(); g.moveTo(-26, -30); g.bezierCurveTo(-30, -60, 30, -64, 32, -26); g.bezierCurveTo(36, 10, 26, 34, 6, 36); g.bezierCurveTo(-14, 34, -24, 10, -26, -30); g.closePath(); g.fill(); g.fillStyle = '#f6f2ea'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(-18 + i * 9, -50 - (i % 2) * 6, 12, 0, TAU); g.fill(); } },
    ear: (g) => { g.fillStyle = '#3a3438'; g.beginPath(); g.ellipse(0, -20, 10, 24, .9, 0, TAU); g.fill(); },
    legX: [52, -48], headAt: [78, -70], earAt: [-18, -16], face: { eyes: [[10, -12, 6]], white: true, look: 3, mouth: (g, s) => { const o = s.talk || 0; g.fillStyle = '#e8a0b0'; if (o > .05) { g.beginPath(); g.ellipse(14, 22, 7, 3 + o * 8, 0, 0, TAU); g.fill(); } } },
    W: 360, H: 300, fin: { rim: .4, under: .2, side: .1 } }, o);
}
// ---------- a horse for the royal carriage: white with a golden mane ----------
export function horse(o) {
  return quad({ col: '#f2ece2', colD: '#d0c8bc', hoof: '#5a4a3a', legL: 150, legW: 26, legRaise: 20, bw: 320, bh: 150, hw: 110, hh: 130, height: 460, amp: .5, bob: 7,
    body: (g, C) => { g.fillStyle = C; g.beginPath(); g.moveTo(-160, -40); g.bezierCurveTo(-170, -130, 110, -150, 160, -90); g.bezierCurveTo(180, -50, 160, 20, 120, 24); g.bezierCurveTo(40, 34, -100, 34, -150, 20); g.bezierCurveTo(-170, 10, -168, -10, -160, -40); g.closePath(); g.fill(); g.fillStyle = '#a83a4a'; g.fillRect(-60, -140, 90, 150); g.fillStyle = '#e8b84a'; g.fillRect(-60, -140, 90, 10); g.fillRect(-60, 0, 90, 10); },
    head: (g, C) => { g.fillStyle = C; g.beginPath(); g.moveTo(-50, -40); g.bezierCurveTo(-40, -110, 40, -120, 56, -70); g.bezierCurveTo(80, -20, 110, 40, 96, 70); g.bezierCurveTo(80, 100, 30, 96, 16, 70); g.bezierCurveTo(0, 30, -60, 20, -50, -40); g.closePath(); g.fill(); g.fillStyle = '#5a4a46'; ell(g, 82, 66, 5, 4); g.fill(); g.strokeStyle = '#e8b84a'; g.lineWidth = 5; g.beginPath(); g.moveTo(-10, 10); g.lineTo(90, 30); g.stroke(); g.fillStyle = '#e86a8a'; ell(g, 10, -100, 12, 16); g.fill(); },
    ear: (g, C) => { g.fillStyle = C; g.beginPath(); g.moveTo(-12, 0); g.quadraticCurveTo(-8, -50, 0, -56); g.quadraticCurveTo(8, -50, 12, 0); g.closePath(); g.fill(); },
    tail: (g) => { g.fillStyle = '#e8c25a'; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-40, 20, -50, 80, -30, 110); g.bezierCurveTo(-20, 70, -6, 40, 10, 14); g.closePath(); g.fill(); },
    mane: { w: 160, h: 220, at: [-30, -10], draw: (g) => { g.fillStyle = '#e8c25a'; g.beginPath(); g.moveTo(40, -90); g.bezierCurveTo(-30, -80, -60, 20, -40, 90); g.bezierCurveTo(-20, 40, 0, -30, 50, -60); g.closePath(); g.fill(); } },
    headAt: [150, -120], earAt: [10, -90], tailAt: [-160, -70], face: { eyes: [[34, -48, 8]] },
    W: 800, H: 700 }, o);
}
// ---------- the lion (the ogre's trick): tawny, a huge round mane, a big comic roar ----------
export function lion(o) {
  return quad({ col: '#e8b05a', colD: '#c8903e', legL: 120, legW: 34, legRaise: 10, bw: 300, bh: 150, hw: 130, hh: 130, height: 420, amp: .35,
    body: (g, C) => { g.fillStyle = C; g.beginPath(); g.moveTo(-150, -50); g.bezierCurveTo(-160, -140, 120, -150, 150, -80); g.bezierCurveTo(166, -30, 140, 24, 100, 26); g.bezierCurveTo(30, 34, -100, 34, -140, 20); g.bezierCurveTo(-162, 6, -160, -20, -150, -50); g.closePath(); g.fill(); g.fillStyle = '#f4d4a0'; g.beginPath(); g.moveTo(-100, 20); g.quadraticCurveTo(0, 40, 100, 18); g.quadraticCurveTo(0, 26, -100, 20); g.fill(); },
    head: (g, C) => { g.fillStyle = C; g.beginPath(); g.ellipse(10, 0, 74, 70, 0, 0, TAU); g.fill(); g.fillStyle = '#f6dcae'; g.beginPath(); g.ellipse(26, 30, 46, 34, 0, 0, TAU); g.fill(); g.fillStyle = '#6a3a2a'; g.beginPath(); g.moveTo(14, 6); g.lineTo(42, 6); g.lineTo(28, 22); g.closePath(); g.fill(); },
    mane: { w: 320, h: 320, at: [6, 0], draw: (g) => { g.fillStyle = '#b8642a'; g.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.lineTo(Math.cos(a) * 140, Math.sin(a) * 136); g.lineTo(Math.cos(a + TAU / 32) * 108, Math.sin(a + TAU / 32) * 104); } g.closePath(); g.fill(); g.fillStyle = '#d07a34'; g.beginPath(); g.arc(0, 0, 108, 0, TAU); g.fill(); } },
    ear: (g, C) => { g.fillStyle = C; ell(g, 0, -20, 20, 20); g.fill(); g.fillStyle = '#f4b0a0'; ell(g, 0, -20, 10, 10); g.fill(); },
    tail: (g, C) => { g.strokeStyle = C; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-40, 0, -60, -50, -40, -80); g.stroke(); g.fillStyle = '#b8642a'; g.beginPath(); g.ellipse(-40, -88, 14, 20, 0, 0, TAU); g.fill(); },
    headAt: [150, -130], earAt: [-30, -60], tailAt: [-150, -60], face: { eyes: [[-6, -24, 10], [40, -26, 9]], white: true, look: 4, mouth: (g, s) => { const o = Math.max(s.talk || 0, s.mouth === 'roar' ? 1 : 0); if (o > .05) { g.fillStyle = '#6a1e24'; g.beginPath(); g.ellipse(28, 50, 30 * (.6 + o * .4), 10 + o * 34, 0, 0, TAU); g.fill(); g.fillStyle = '#fff'; for (const dx of [-14, 14, 42, 70]) { if (dx > 60) continue; g.beginPath(); g.moveTo(28 + dx * .7 - 14, 50 - 10 - o * 26); g.lineTo(28 + dx * .7 - 8, 50 - o * 14); g.lineTo(28 + dx * .7 - 2, 50 - 10 - o * 26); g.fill(); } g.fillStyle = '#e8708c'; g.beginPath(); g.ellipse(28, 50 + o * 24, 16, 8, 0, 0, TAU); g.fill(); } else { g.strokeStyle = '#6a3a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(28, 22); g.lineTo(28, 32); g.moveTo(12, 38); g.quadraticCurveTo(20, 44, 28, 32); g.quadraticCurveTo(36, 44, 44, 38); g.stroke(); } } },
    W: 820, H: 700 }, o);
}
// ---------- the mouse (the ogre's last trick), and three tiny forest animals ----------
export function mouse(o) {
  return quad({ col: '#a8a2ae', colD: '#8a8494', legL: 16, legW: 8, legRaise: 2, bw: 80, bh: 50, hw: 36, hh: 34, height: 70, amp: .7, bob: 2,
    body: (g, C) => { g.fillStyle = C; g.beginPath(); g.ellipse(0, -22, 40, 26, 0, 0, TAU); g.fill(); g.fillStyle = '#d8d0dc'; g.beginPath(); g.ellipse(6, -10, 26, 12, 0, 0, TAU); g.fill(); },
    head: (g, C) => { g.fillStyle = C; g.beginPath(); g.moveTo(-20, -10); g.bezierCurveTo(-22, -34, 10, -36, 34, -6); g.bezierCurveTo(16, 8, -16, 12, -20, -10); g.fill(); g.fillStyle = '#e8708c'; ell(g, 34, -6, 5, 4); g.fill(); g.strokeStyle = '#5a5060'; g.lineWidth = 1.2; for (const a of [-.2, .1]) { g.beginPath(); g.moveTo(30, -4); g.lineTo(52, -4 + a * 40); g.stroke(); } },
    ear: (g, C) => { g.fillStyle = C; ell(g, 0, -14, 14, 14); g.fill(); g.fillStyle = '#f0b0bc'; ell(g, 0, -14, 8, 8); g.fill(); },
    tail: (g) => { g.strokeStyle = '#e8a0b0'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-30, -6, -40, -30, -60, -24); g.stroke(); },
    legX: [20, -18], headAt: [40, -30], earAt: [-4, -22], tailAt: [-38, -20], face: { eyes: [[10, -16, 3.6]], white: false, look: 1.5, mouth: (g, s) => { const o = s.talk || 0; if (o > .05) { g.fillStyle = '#5a2430'; g.beginPath(); g.ellipse(26, 4, 4, 2 + o * 4, 0, 0, TAU); g.fill(); } } },
    W: 200, H: 160, fin: { rim: .4, under: .2, side: .1 } }, o);
}
export function rabbit(o) {
  return quad({ col: '#c8b8a4', colD: '#a8988a', legL: 18, legW: 12, legRaise: 2, bw: 80, bh: 60, hw: 40, hh: 40, height: 110, amp: .4,
    body: (g, C) => { g.fillStyle = C; g.beginPath(); g.ellipse(0, -30, 36, 32, 0, 0, TAU); g.fill(); },
    head: (g, C) => { g.fillStyle = C; g.beginPath(); g.ellipse(4, -6, 26, 24, 0, 0, TAU); g.fill(); g.fillStyle = '#e8909c'; ell(g, 24, -2, 4, 3); g.fill(); },
    ear: (g, C) => { g.fillStyle = C; g.beginPath(); g.ellipse(0, -30, 8, 28, 0, 0, TAU); g.fill(); g.fillStyle = '#f0c0c8'; g.beginPath(); g.ellipse(0, -30, 4, 20, 0, 0, TAU); g.fill(); },
    tail: (g) => { g.fillStyle = '#fbf6ee'; ell(g, 0, 0, 12, 12); g.fill(); }, legX: [16, -14], headAt: [30, -50], earAt: [-6, -20], tailAt: [-36, -36], face: { eyes: [[10, -10, 4]], look: 2 }, W: 220, H: 220 }, o);
}
export function squirrel(o) {
  return quad({ col: '#c06a3a', colD: '#a0562c', legL: 14, legW: 10, legRaise: 2, bw: 70, bh: 56, hw: 36, hh: 36, height: 100, amp: .4, tailAmp: .1,
    body: (g, C) => { g.fillStyle = C; g.beginPath(); g.ellipse(0, -28, 26, 34, -.2, 0, TAU); g.fill(); g.fillStyle = '#f0d8b8'; g.beginPath(); g.ellipse(8, -24, 12, 22, -.2, 0, TAU); g.fill(); },
    head: (g, C) => { g.fillStyle = C; g.beginPath(); g.ellipse(6, -6, 22, 20, 0, 0, TAU); g.fill(); g.fillStyle = '#4a2a1e'; ell(g, 26, -4, 3.5, 3); g.fill(); },
    ear: (g, C) => { g.fillStyle = C; g.beginPath(); g.moveTo(-6, 0); g.lineTo(0, -18); g.lineTo(6, 0); g.closePath(); g.fill(); },
    tail: (g, C) => { g.fillStyle = C; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-40, -10, -50, -70, -20, -80); g.bezierCurveTo(0, -84, 6, -60, -10, -50); g.bezierCurveTo(-20, -30, -10, -14, 6, -8); g.closePath(); g.fill(); },
    legX: [12, -10], headAt: [16, -64], earAt: [-2, -16], tailAt: [-20, -10], face: { eyes: [[12, -8, 3.6]], look: 2 }, W: 220, H: 220 }, o);
}
export function hedgehog(o) {
  return quad({ col: '#8a6a4e', colD: '#6e543e', legL: 8, legW: 8, legRaise: 2, bw: 80, bh: 50, hw: 30, hh: 30, height: 70, amp: .4,
    body: (g, C) => { g.fillStyle = '#5a4434'; g.beginPath(); for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI; g.lineTo(Math.cos(a) * (i % 2 ? 36 : 48), -12 + Math.sin(a) * (i % 2 ? 30 : 42)); } g.closePath(); g.fill(); },
    head: (g, C) => { g.fillStyle = '#d8b89a'; g.beginPath(); g.moveTo(-14, -16); g.bezierCurveTo(10, -20, 30, -4, 36, 2); g.bezierCurveTo(20, 12, -6, 14, -14, -16); g.fill(); g.fillStyle = '#2a1e1a'; ell(g, 36, 2, 4, 4); g.fill(); },
    legX: [18, -16], headAt: [34, -18], face: { eyes: [[10, -6, 3]], look: 1.5 }, W: 200, H: 160 }, o);
}
for (const [f, s] of [[donkey, 1.25], [sheep, 1.25], [horse, 1.25], [lion, 1.25], [mouse, 1.25], [rabbit, 1.25], [squirrel, 1.25], [hedgehog, 1.25]]) f.scale = s;
