// Paper puppets: every part is its own cut-paper sheet pinned at a joint; poses rotate the parts. Space: origin at the feet/seat, y up is negative.
import { paint, dynSheet, Layer } from './engine.js';
import { PAL, rr, ell, cut } from './art.js';
import { TAU, clamp, lerp, vnoise, ss } from './lib.js';

export class Rig {
  // parts: { name, sheet, parent, jx, jy, rot, sx, sy, z, vis, hook }
  constructor(parts, w, h, ax, ay, res = 2) {
    this.parts = {}; this.list = parts; for (const p of parts) { Object.assign(p, { rot: 0, sx: 1, sy: 1, vis: true, jx: 0, jy: 0, ...p }); this.parts[p.name] = p; }
    this.dyn = dynSheet(w, h, res, ax, ay); this.res = res;
    this.order = [...parts].sort((a, b) => (a.z || 0) - (b.z || 0));
  }
  render() {
    const d = this.dyn, g = d.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, d.c.width, d.c.height);
    const R = this.res; g.setTransform(R, 0, 0, R, d.ax, d.ay);
    const M = new Map();
    const mat = p => {   // cumulative [a,b,c,d,e,f]
      if (M.has(p)) return M.get(p);
      const par = p.parent ? mat(this.parts[p.parent]) : [1, 0, 0, 1, 0, 0];
      const c = Math.cos(p.rot), s = Math.sin(p.rot);
      // local = translate(jx,jy) * rotate * scale
      const la = c * p.sx, lb = s * p.sx, lc = -s * p.sy, ld = c * p.sy;
      const m = [par[0] * la + par[2] * lb, par[1] * la + par[3] * lb, par[0] * lc + par[2] * ld, par[1] * lc + par[3] * ld,
        par[0] * p.jx + par[2] * p.jy + par[4], par[1] * p.jx + par[3] * p.jy + par[5]];
      M.set(p, m); return m;
    };
    for (const p of this.order) {
      if (!p.vis) continue; const m = mat(p);
      g.save(); g.transform(...m);
      if (p.sheet) g.drawImage(p.sheet.c, -p.sheet.ax / p.sheet.res, -p.sheet.ay / p.sheet.res, p.sheet.c.width / p.sheet.res, p.sheet.c.height / p.sheet.res);
      if (p.hook) p.hook(g, p);
      g.restore();
    }
    return d;
  }
}
const P = (n, sheet, parent, jx, jy, z, extra = {}) => ({ name: n, sheet, parent, jx, jy, z, ...extra });
const sh = (w, h, ax, ay, fn, res = 2, fin) => paint(w, h, fn, { ax, ay, res, fin });

// two-bone arm: returns [shoulderRot, elbowRot] so the hand reaches (tx,ty) relative to the shoulder (upper and fore lengths a, b)
export function ik(tx, ty, a, b, bend = 1) {
  let d = Math.hypot(tx, ty); d = clamp(d, Math.abs(a - b) + 1, a + b - .5);
  const base = Math.atan2(ty, tx), cosA = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), ang = Math.acos(cosA);
  const s = base - bend * ang, ex = a * Math.cos(s), ey = a * Math.sin(s), f = Math.atan2(ty - ey, tx - ex);
  return [s - Math.PI / 2, f - s];   // arms are drawn pointing down (+y) at rot 0
}

// ---------- Tom ----------
export function makeTom({ jacket = false } = {}) {
  const tunic = jacket ? '#3f6fc0' : PAL.tunic, tunicD = jacket ? '#2f55a0' : '#b27c52';
  const legs = sh(300, 200, 150, 200, g => {
    g.fillStyle = PAL.pants; rr(g, -92, -150, 64, 140, 26); g.fill(); rr(g, 28, -150, 64, 140, 26); g.fill();
    g.fillStyle = '#5a4a6e'; rr(g, 38, -112, 30, 26, 8); g.fill();                                  // a patch on the knee
    g.fillStyle = PAL.shoe; ell(g, -66, -14, 50, 24); g.fill(); ell(g, 66, -14, 50, 24); g.fill();
    cut(g, () => { g.lineWidth = 2; g.beginPath(); g.moveTo(-100, -4); g.lineTo(-30, -4); g.moveTo(30, -4); g.lineTo(100, -4); g.stroke(); });
  });
  const torso = sh(280, 260, 140, 215, g => {
    g.fillStyle = tunic; g.beginPath(); g.moveTo(-82, -190); g.quadraticCurveTo(0, -214, 82, -190); g.lineTo(100, 8); g.quadraticCurveTo(0, 30, -100, 8); g.closePath(); g.fill();
    g.fillStyle = '#4a3326'; rr(g, -98, -78, 196, 24, 6); g.fill(); g.fillStyle = '#e6c06a'; rr(g, -16, -80, 32, 28, 6); g.fill();
    g.fillStyle = tunicD; g.beginPath(); g.moveTo(-82, -190); g.quadraticCurveTo(0, -176, 82, -190); g.lineTo(60, -150); g.quadraticCurveTo(0, -128, -60, -150); g.closePath(); g.fill();   // collar
    g.fillStyle = PAL.skin; g.beginPath(); g.moveTo(-30, -196); g.quadraticCurveTo(0, -170, 30, -196); g.lineTo(26, -204); g.lineTo(-26, -204); g.closePath(); g.fill();
    cut(g, () => { g.lineWidth = 2.2; g.beginPath(); g.moveTo(-60, -20); g.lineTo(-56, 6); g.moveTo(40, -24); g.lineTo(44, 4); g.stroke(); });
  });
  const head = sh(240, 250, 120, 205, g => {
    g.fillStyle = PAL.skin; ell(g, -66, -62, 15, 18); g.fill(); ell(g, 66, -62, 15, 18); g.fill();
    g.fillStyle = PAL.skin; rr(g, -22, -30, 44, 40, 14); g.fill();                            // neck
    g.fillStyle = PAL.skin; ell(g, 0, -80, 68, 66); g.fill();
    g.fillStyle = PAL.hair; g.beginPath(); g.moveTo(-72, -78); g.bezierCurveTo(-84, -150, -30, -160, 8, -150); g.bezierCurveTo(52, -160, 84, -136, 72, -78);
    g.bezierCurveTo(54, -112, 30, -118, 4, -112); g.bezierCurveTo(-22, -108, -52, -100, -72, -78); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-6, -150); g.bezierCurveTo(-14, -176, 20, -180, 22, -160); g.bezierCurveTo(10, -166, 2, -158, 4, -148); g.closePath(); g.fill();   // tuft
  });
  const sleeve = sh(80, 120, 40, 20, g => { g.fillStyle = tunic; rr(g, -26, -16, 52, 82, 24); g.fill(); g.fillStyle = tunicD; rr(g, -26, 52, 52, 14, 6); g.fill(); });
  const fore = sh(70, 120, 35, 14, g => { g.fillStyle = tunic; rr(g, -22, -10, 44, 50, 20); g.fill(); g.fillStyle = PAL.skin; rr(g, -16, 28, 32, 58, 14); g.fill(); });
  const hand = sh(90, 100, 45, 14, g => {
    g.fillStyle = PAL.skin; g.beginPath(); g.moveTo(-26, 0); g.bezierCurveTo(-34, 30, -30, 52, -12, 60); g.bezierCurveTo(0, 66, 22, 60, 28, 40); g.bezierCurveTo(36, 22, 30, 4, 24, 0); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-26, 26); g.bezierCurveTo(-46, 30, -48, 52, -30, 56); g.bezierCurveTo(-26, 50, -22, 40, -22, 30); g.closePath(); g.fill();   // thumb
    cut(g, () => { g.lineWidth = 1.6; g.beginPath(); g.moveTo(-6, 36); g.lineTo(-4, 56); g.moveTo(8, 34); g.lineTo(10, 56); g.stroke(); });
  }, 3);
  const bread = sh(120, 90, 60, 45, g => {
    g.fillStyle = PAL.bread; g.beginPath(); g.moveTo(-44, 14); g.bezierCurveTo(-52, -26, -20, -38, 8, -32); g.bezierCurveTo(38, -34, 52, -8, 44, 18); g.bezierCurveTo(20, 30, -20, 30, -44, 14); g.closePath(); g.fill();
    g.fillStyle = PAL.breadIn; g.beginPath(); g.moveTo(-34, 12); g.bezierCurveTo(-38, -14, -14, -24, 8, -20); g.bezierCurveTo(30, -22, 38, -4, 34, 12); g.bezierCurveTo(16, 20, -14, 20, -34, 12); g.closePath(); g.fill();
    cut(g, () => { g.lineWidth = 2; g.beginPath(); g.moveTo(-14, -6); g.lineTo(-10, 6); g.moveTo(4, -8); g.lineTo(8, 4); g.moveTo(20, -4); g.lineTo(22, 8); g.stroke(); });
  }, 3);
  const eyes = (g, p) => {   // face, drawn per frame in head space (origin at the neck pivot)
    const s = p.face || {}, blink = s.blink ?? 0, lx = (s.lookX || 0) * 5, ly = (s.lookY || 0) * 4, by = 0;
    g.fillStyle = PAL.ink;
    for (const sx of [-1, 1]) {
      const ex = sx * 24 + lx, ey = -82 + ly;
      if (blink > .85) { g.strokeStyle = PAL.ink; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 9, ey); g.quadraticCurveTo(ex, ey + 4, ex + 9, ey); g.stroke(); }
      else { g.save(); g.translate(ex, ey); g.scale(1, 1 - blink * .9 + (s.wide || 0) * .25); ell(g, 0, 0, 8.5, 11); g.fill(); g.fillStyle = '#fff'; ell(g, -2.6, -3.6, 3, 3.6); g.fill(); g.fillStyle = PAL.ink; g.restore(); }
      // brows: raise (-1..1) and tilt (-1 worried .. 1 cross)
      const br = (s.brow ?? 0) * 7, tilt = (s.browTilt || 0) * 7;
      g.strokeStyle = PAL.hair; g.lineWidth = 4.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx * 24 - 14 * sx * 0 - 12, -106 - br + (sx < 0 ? tilt : -tilt) * -1 * .5 + 0); g.lineTo(sx * 24 + 12, -106 - br + (sx < 0 ? -tilt : tilt) * -1 * .5); g.stroke();
    }
    g.fillStyle = 'rgba(240,120,110,' + (s.blush ?? .22) + ')'; ell(g, -42, -58, 15, 9); g.fill(); ell(g, 42, -58, 15, 9); g.fill();
    // mouth
    const m = s.mouth || 'closed', o = s.open ?? 0; g.strokeStyle = '#7b3b34'; g.lineWidth = 3.4; g.lineCap = 'round';
    if (m === 'closed') { g.beginPath(); g.moveTo(-9, -44); g.quadraticCurveTo(0, -41, 9, -44); g.stroke(); }
    else if (m === 'smile') { g.beginPath(); g.moveTo(-14, -48); g.quadraticCurveTo(0, -32, 14, -48); g.stroke(); }
    else if (m === 'wobbly') { g.beginPath(); g.moveTo(-12, -42); g.bezierCurveTo(-6, -48, -2, -38, 3, -44); g.bezierCurveTo(7, -48, 10, -42, 13, -44); g.stroke(); }
    else { g.fillStyle = '#7b3b34'; ell(g, 0, -42, m === 'o' ? 8 : 12, 4 + o * (m === 'o' ? 9 : 10)); g.fill(); if (o > .3) { g.fillStyle = '#e8847c'; ell(g, 0, -42 + o * 4, 7, 3 + o * 3); g.fill(); } }
  };
  const parts = [
    P('legs', legs, null, 0, 0, 1),
    P('torso', torso, null, 0, -66, 3),
    P('head', head, 'torso', 0, -196, 5, { hook: eyes }),
    P('uArmL', sleeve, 'torso', -92, -172, 6), P('fArmL', fore, 'uArmL', 0, 62, 6.1), P('handL', hand, 'fArmL', 0, 78, 7),
    P('uArmR', sleeve, 'torso', 92, -172, 6), P('fArmR', fore, 'uArmR', 0, 62, 6.1), P('handR', hand, 'fArmR', 0, 78, 7),
    P('bread', bread, 'torso', 0, -52, 6.9, { vis: false }),
  ];
  parts.find(p => p.name === 'handR').sx = -1;
  const rig = new Rig(parts, 560, 640, 280, 470, 2);
  rig.head = rig.parts.head; rig.pose = { }; return rig;
}

// ---------- Puss ----------
export function makePuss({ boots = false } = {}) {
  const O = PAL.orange, OD = PAL.orangeD, W = PAL.white;
  const tail = sh(200, 260, 40, 230, g => {   // curls up beside the body; anchor at its root
    g.fillStyle = O; g.beginPath(); g.moveTo(-18, 0); g.bezierCurveTo(70, -30, 130, -80, 118, -170); g.bezierCurveTo(112, -205, 88, -214, 76, -190); g.bezierCurveTo(86, -130, 50, -70, -18, -40); g.closePath(); g.fill();
    g.fillStyle = OD; for (const [x, y, a] of [[58, -44, .5], [92, -88, .2], [108, -134, -.1]]) { g.save(); g.translate(x, y); g.rotate(a); rr(g, -20, -7, 40, 14, 6); g.fill(); g.restore(); }
    g.fillStyle = W; ell(g, 94, -196, 18, 15); g.fill();
  });
  const body = sh(330, 330, 165, 300, g => {
    g.fillStyle = O; g.beginPath(); g.moveTo(-60, -170); g.bezierCurveTo(-130, -120, -150, -20, -100, 6); g.lineTo(100, 6); g.bezierCurveTo(150, -20, 130, -120, 60, -170); g.bezierCurveTo(30, -186, -30, -186, -60, -170); g.closePath(); g.fill();
    g.fillStyle = W; g.beginPath(); g.moveTo(-34, -172); g.bezierCurveTo(-66, -100, -52, -30, -22, 0); g.lineTo(22, 0); g.bezierCurveTo(52, -30, 66, -100, 34, -172); g.bezierCurveTo(12, -184, -12, -184, -34, -172); g.closePath(); g.fill();   // chest
    g.fillStyle = OD; for (const [x, y, a] of [[-86, -90, .6], [-96, -50, .4], [86, -90, -.6], [96, -50, -.4]]) { g.save(); g.translate(x, y); g.rotate(a); rr(g, -18, -6, 36, 12, 6); g.fill(); g.restore(); }
    g.fillStyle = O; ell(g, -92, -26, 44, 30, -.4); g.fill(); ell(g, 92, -26, 44, 30, .4); g.fill();          // haunches
  });
  const legF = sh(70, 160, 35, 10, g => {   // front leg, anchored at the shoulder, pointing down
    g.fillStyle = O; rr(g, -20, -8, 40, 110, 18); g.fill(); g.fillStyle = W; rr(g, -22, 82, 44, 56, 20); g.fill(); ell(g, 0, 132, 26, 14); g.fill();
    cut(g, () => { g.lineWidth = 1.8; g.beginPath(); g.moveTo(-6, 124); g.lineTo(-6, 138); g.moveTo(8, 124); g.lineTo(8, 138); g.stroke(); });
  });
  const head = sh(300, 280, 150, 220, g => {
    // ears
    g.fillStyle = O; g.beginPath(); g.moveTo(-96, -118); g.lineTo(-92, -196); g.lineTo(-34, -150); g.closePath(); g.fill(); g.beginPath(); g.moveTo(96, -118); g.lineTo(92, -196); g.lineTo(34, -150); g.closePath(); g.fill();
    g.fillStyle = PAL.pink; g.beginPath(); g.moveTo(-84, -128); g.lineTo(-82, -178); g.lineTo(-48, -150); g.closePath(); g.fill(); g.beginPath(); g.moveTo(84, -128); g.lineTo(82, -178); g.lineTo(48, -150); g.closePath(); g.fill();
    // head with cheek fluff
    g.fillStyle = O; g.beginPath(); g.moveTo(-100, -80); g.bezierCurveTo(-110, -150, -50, -168, 0, -166); g.bezierCurveTo(50, -168, 110, -150, 100, -80);
    g.bezierCurveTo(116, -62, 112, -40, 92, -34); g.bezierCurveTo(100, -14, 70, 2, 44, -8); g.bezierCurveTo(20, 6, -20, 6, -44, -8); g.bezierCurveTo(-70, 2, -100, -14, -92, -34); g.bezierCurveTo(-112, -40, -116, -62, -100, -80); g.closePath(); g.fill();
    g.fillStyle = OD; for (const dx of [-26, 0, 26]) { rr(g, dx - 6, -166, 12, 30 - Math.abs(dx) * .3, 6); g.fill(); }   // forehead stripes
    g.fillStyle = W; ell(g, -26, -42, 36, 28, .2); g.fill(); ell(g, 26, -42, 36, 28, -.2); g.fill();      // muzzle
  });
  const earTw = 0;
  const face = (g, p) => {
    const s = p.face || {}, blink = s.blink ?? 0, lx = (s.lookX || 0) * 6, ly = (s.lookY || 0) * 4;
    for (const sx of [-1, 1]) {
      const ex = sx * 42, ey = -92;
      if (blink > .88) { g.strokeStyle = PAL.ink; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 20, ey); g.quadraticCurveTo(ex, ey + 8, ex + 20, ey); g.stroke(); }
      else {
        g.save(); g.translate(ex, ey); const k = 1 - blink * .95; g.scale(1, k * (1 + (s.wide || 0) * .22));
        g.fillStyle = '#fffbe9'; ell(g, 0, 0, 26, 30); g.fill(); g.fillStyle = PAL.green; ell(g, lx * .9, ly * .9, 20, 24); g.fill();
        g.fillStyle = PAL.ink; ell(g, lx, ly, 6.5 * (1 - (s.slit || 0) * .3), 21); g.fill(); g.fillStyle = '#fff'; ell(g, lx - 6, ly - 9, 5, 6); g.fill();
        if (s.half) { g.fillStyle = O; g.fillRect(-30, -34, 60, 34 * s.half); }
        g.restore();
      }
      const br = (s.brow ?? 0) * 9, tilt = (s.browTilt || 0) * 8;
      g.strokeStyle = OD; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 18, -128 - br + (sx < 0 ? tilt : -tilt) * .5); g.lineTo(ex + 18, -128 - br - (sx < 0 ? tilt : -tilt) * .5); g.stroke();
    }
    g.fillStyle = '#e8708c'; g.beginPath(); g.moveTo(-9, -56); g.lineTo(9, -56); g.lineTo(0, -45); g.closePath(); g.fill();   // nose
    const m = s.mouth || 'closed', o = s.open ?? 0; g.strokeStyle = '#6b3a30'; g.lineWidth = 3.2; g.lineCap = 'round';
    if (m === 'open' || m === 'o') { g.fillStyle = '#7b3b34'; ell(g, 0, -30 + o * 4, m === 'o' ? 10 : 14, 6 + o * 13); g.fill(); g.fillStyle = '#e8708c'; ell(g, 0, -24 + o * 8, 8, 4 + o * 4); g.fill(); }
    else if (m === 'smile') { g.beginPath(); g.moveTo(0, -45); g.lineTo(0, -38); g.moveTo(-22, -42); g.quadraticCurveTo(-11, -22, 0, -38); g.quadraticCurveTo(11, -22, 22, -42); g.stroke(); }
    else { g.beginPath(); g.moveTo(0, -45); g.lineTo(0, -37); g.moveTo(-14, -34); g.quadraticCurveTo(-7, -27, 0, -37); g.quadraticCurveTo(7, -27, 14, -34); g.stroke(); }
    g.strokeStyle = 'rgba(255,248,235,.9)'; g.lineWidth = 2.2;                               // whiskers
    for (const sx of [-1, 1]) for (const [dy, a] of [[-48, -.25], [-40, 0], [-32, .22]]) { g.beginPath(); g.moveTo(sx * 40, dy); g.lineTo(sx * 96, dy + a * 60); g.stroke(); }
  };
  const bootA = sh(80, 90, 40, 8, g => { g.fillStyle = '#5a3322'; rr(g, -24, -4, 48, 62, 12); g.fill(); g.fillStyle = '#3a2016'; rr(g, -26, 48, 66, 26, 12); g.fill(); g.fillStyle = '#c99a4a'; rr(g, -24, -4, 48, 12, 4); g.fill(); });
  const parts = [
    P('tail', tail, null, 70, -26, 1),
    P('body', body, null, 0, 0, 2),
    P('legL', legF, 'body', -42, -134, 3), P('legR', legF, 'body', 42, -134, 3),
    P('head', head, 'body', 0, -158, 5, { hook: face }),
  ];
  if (boots) { parts.push(P('bootL', bootA, 'legL', 0, 100, 3.5), P('bootR', bootA, 'legR', 0, 100, 3.5)); }
  const rig = new Rig(parts, 600, 560, 300, 420, 2);
  return rig;
}

// idle breathing / blink helpers (deterministic in t)
export function blinkAt(t, seed = 0, every = 4) {
  const n = Math.floor(t / every), r = (Math.sin((n + seed) * 91.7) * .5 + .5) * every * .7 + .6, local = t - n * every - r, dur = .22;
  if (local < 0 || local > dur) return 0; const u = local / dur; return u < .5 ? u * 2 : 2 - u * 2;
}
export const breathe = (t, seed = 0, period = 3.6) => 1 + .015 * Math.sin((t / period + seed) * TAU);
