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
      if (p.sheet) {
        if (p.drop) { g.shadowColor = 'rgba(46,24,12,.42)'; g.shadowBlur = 3.2 * R; g.shadowOffsetX = .8 * R; g.shadowOffsetY = 2.2 * R; }
        g.drawImage(p.sheet.c, -p.sheet.ax / p.sheet.res, -p.sheet.ay / p.sheet.res, p.sheet.c.width / p.sheet.res, p.sheet.c.height / p.sheet.res);
        if (p.drop) { g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = g.shadowOffsetY = 0; }
      }
      if (p.hook) p.hook(g, p);
      g.restore();
    }
    return d;
  }
}
const P = (n, sheet, parent, jx, jy, z, extra = {}) => ({ name: n, sheet, parent, jx, jy, z, ...extra });
let CUR_RES = 2;
const sh = (w, h, ax, ay, fn, res = CUR_RES, fin) => paint(w, h, fn, { ax, ay, res, fin });

// two-bone arm: returns [shoulderRot, elbowRot] so the hand reaches (tx,ty) relative to the shoulder (upper and fore lengths a, b)
export function ik(tx, ty, a, b, bend = 1) {
  let d = Math.hypot(tx, ty); d = clamp(d, Math.abs(a - b) + 1, a + b - .5);
  const base = Math.atan2(ty, tx), cosA = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), ang = Math.acos(cosA);
  const s = base - bend * ang, ex = a * Math.cos(s), ey = a * Math.sin(s), f = Math.atan2(ty - ey, tx - ex);
  return [s - Math.PI / 2, f - s];   // arms are drawn pointing down (+y) at rot 0
}

// ---------- Tom (seated on a step: elbows near his knees, the bread held up at his chest) ----------
// Puppet space: origin = where he sits on the step edge; y up is negative. Arms are shoulder > upper arm (sleeve) > forearm (cuff, skin) > wrist;
// the hands grip the bread: palm behind it, four fingers curled round the front of its lower edge, the thumb on top.
export function makeTom({ jacket = false, res = 2 } = {}) {
  const tunic = jacket ? '#3f6fc0' : PAL.tunic, tunicD = jacket ? '#2f55a0' : '#7a4f30', cuff = jacket ? '#2a4f96' : '#6d4429', sleeveC = jacket ? '#3866b4' : '#8d5c38';
  const R = Math.max(2, res), SK = PAL.skin, SKD = PAL.skinD;
  const shins = sh(260, 200, 130, 20, g => {          // lower legs hanging from the knees to the feet on the step below
    g.fillStyle = PAL.pants; for (const x of [-58, 58]) { g.beginPath(); g.moveTo(x - 24, -14); g.lineTo(x + 24, -14); g.lineTo(x + 20, 96); g.lineTo(x - 20, 96); g.closePath(); g.fill(); }
    g.fillStyle = PAL.shoe; for (const x of [-60, 60]) { ell(g, x, 106, 36, 18); g.fill(); rr(g, x - 22, 88, 44, 22, 8); g.fill(); }
    cut(g, () => { g.lineWidth = 2; for (const x of [-60, 60]) { g.beginPath(); g.moveTo(x - 30, 116); g.lineTo(x + 30, 116); g.stroke(); } });
  }, R);
  const knees = sh(260, 120, 130, 60, g => {
    g.fillStyle = PAL.pants; for (const x of [-60, 60]) { ell(g, x, -16, 40, 36); g.fill(); }
    g.fillStyle = '#5c4b72'; rr(g, 46, -30, 28, 24, 8); g.fill();                       // a patch on one knee
    cut(g, () => { g.lineWidth = 1.6; g.setLineDash([4, 4]); rr(g, 49, -27, 22, 18, 6); g.stroke(); g.setLineDash([]); });
  }, R);
  const torso = sh(240, 200, 120, 150, g => {
    g.fillStyle = tunic; g.beginPath(); g.moveTo(-72, -126); g.quadraticCurveTo(0, -142, 72, -126); g.lineTo(86, 4); g.quadraticCurveTo(0, 18, -86, 4); g.closePath(); g.fill();
    g.fillStyle = tunicD; g.beginPath(); g.moveTo(-70, -126); g.quadraticCurveTo(0, -116, 70, -126); g.lineTo(44, -100); g.quadraticCurveTo(0, -88, -44, -100); g.closePath(); g.fill();   // collar
    g.fillStyle = SK; g.beginPath(); g.moveTo(-24, -132); g.quadraticCurveTo(0, -112, 24, -132); g.lineTo(20, -140); g.lineTo(-20, -140); g.closePath(); g.fill();
    g.fillStyle = '#4a3326'; rr(g, -84, -30, 168, 18, 5); g.fill();                         // belt
  }, R);
  const head = sh(240, 250, 120, 205, g => {
    g.fillStyle = SK; ell(g, -66, -62, 15, 18); g.fill(); ell(g, 66, -62, 15, 18); g.fill();
    rr(g, -22, -30, 44, 40, 14); g.fill(); ell(g, 0, -80, 68, 66); g.fill();
    g.fillStyle = PAL.hair; g.beginPath(); g.moveTo(-72, -78); g.bezierCurveTo(-84, -150, -30, -160, 8, -150); g.bezierCurveTo(52, -160, 84, -136, 72, -78);
    g.bezierCurveTo(54, -112, 30, -118, 4, -112); g.bezierCurveTo(-22, -108, -52, -100, -72, -78); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-6, -150); g.bezierCurveTo(-14, -176, 20, -180, 22, -160); g.bezierCurveTo(10, -166, 2, -158, 4, -148); g.closePath(); g.fill();
  }, R);
  const upper = sh(70, 110, 35, 12, g => { g.fillStyle = sleeveC; g.beginPath(); g.moveTo(-21, -6); g.quadraticCurveTo(0, -16, 21, -6); g.lineTo(18, 84); g.quadraticCurveTo(0, 92, -18, 84); g.closePath(); g.fill(); }, R);   // sleeve, shoulder > elbow (80)
  const fore = sh(60, 90, 30, 10, g => {                                                    // forearm, elbow > wrist (60): sleeve, cuff, skin
    g.fillStyle = sleeveC; g.beginPath(); g.arc(0, 0, 18, Math.PI, 0); g.lineTo(16, 22); g.lineTo(-16, 22); g.closePath(); g.fill();
    g.fillStyle = cuff; rr(g, -17, 18, 34, 11, 4); g.fill();
    g.fillStyle = SK; g.beginPath(); g.moveTo(-12, 28); g.lineTo(12, 28); g.lineTo(10, 62); g.lineTo(-10, 62); g.closePath(); g.fill();
  }, R);
  // the bread, held up in front of the chest
  const bread = sh(120, 90, 60, 45, g => {
    g.fillStyle = '#b4702e'; g.beginPath(); g.moveTo(-42, 16); g.bezierCurveTo(-50, -22, -20, -34, 6, -30); g.bezierCurveTo(36, -32, 50, -8, 42, 18); g.bezierCurveTo(18, 28, -18, 28, -42, 16); g.closePath(); g.fill();
    g.fillStyle = '#f0cd88'; g.beginPath(); g.moveTo(-30, 12); g.bezierCurveTo(-34, -12, -12, -20, 6, -18); g.bezierCurveTo(26, -20, 32, -4, 30, 12); g.bezierCurveTo(14, 18, -12, 18, -30, 12); g.closePath(); g.fill();
    cut(g, () => { g.lineWidth = 2; g.beginPath(); g.moveTo(-12, -6); g.lineTo(-8, 6); g.moveTo(4, -8); g.lineTo(8, 4); g.moveTo(18, -4); g.lineTo(20, 8); g.stroke(); });
  }, Math.max(3, R));
  // a hand gripping the left side of the bread (mirrored for the right): palm behind the bread, fingers in front, thumb on top
  const HR = Math.max(3, R + 1);
  const palm = sh(90, 90, 45, 45, g => {          // heel of the hand and the wrist, behind the bread's left side
    g.fillStyle = SK; g.beginPath(); g.moveTo(-6, 34); g.bezierCurveTo(-26, 26, -30, 2, -22, -14); g.bezierCurveTo(-14, -28, 4, -30, 14, -20); g.bezierCurveTo(22, -8, 20, 14, 10, 28); g.closePath(); g.fill();
    g.strokeStyle = SKD; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-16, 12); g.quadraticCurveTo(-8, 18, 2, 14); g.stroke();
  }, HR);
  const fingers = sh(80, 70, 14, 34, g => {       // anchor near the knuckles; four fingers curl round the bread's lower-left edge, tips pointing in and up
    const F = [[-20, .62, 27], [-9, .42, 29], [2, .24, 28], [12, .08, 24]];
    for (const [y, a, len] of F) {
      g.save(); g.translate(0, y); g.rotate(-a); g.fillStyle = SK; rr(g, -6, -6, len + 6, 12, 6); g.fill();
      g.fillStyle = '#f2c9a6'; rr(g, len - 7, -3.6, 6, 6.4, 3); g.fill();                         // fingernail
      g.strokeStyle = SKD; g.lineWidth = 1.5; g.beginPath(); g.moveTo(len * .45, -5.4); g.quadraticCurveTo(len * .5, 0, len * .45, 5.4); g.stroke();   // knuckle crease
      g.restore();
    }
    g.strokeStyle = SKD; g.lineWidth = 1.8; for (const y of [-14.5, -3.5, 7]) { g.beginPath(); g.moveTo(-4, y); g.lineTo(14, y - 3); g.stroke(); }   // gaps between the fingers
  }, HR);
  const thumb = sh(60, 40, 6, 22, g => {           // the thumb lies along the top of the crust
    g.fillStyle = SK; g.beginPath(); g.moveTo(-4, 10); g.bezierCurveTo(2, -4, 18, -10, 30, -7); g.bezierCurveTo(37, -5, 37, 4, 29, 6); g.bezierCurveTo(18, 7, 8, 11, 0, 16); g.closePath(); g.fill();
    g.fillStyle = '#f2c9a6'; rr(g, 24, -5.6, 8, 7, 3.5); g.fill();
  }, HR);
  const eyes = (g, p) => {   // face, drawn per frame in head space (origin at the neck pivot)
    const s = p.face || {}, blink = s.blink ?? 0, lx = (s.lookX || 0) * 5, ly = (s.lookY || 0) * 4;
    g.fillStyle = PAL.ink;
    for (const sx of [-1, 1]) {
      const ex = sx * 24 + lx, ey = -82 + ly;
      if (blink > .85) { g.strokeStyle = PAL.ink; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 9, ey); g.quadraticCurveTo(ex, ey + 4, ex + 9, ey); g.stroke(); }
      else { g.save(); g.translate(ex, ey); g.scale(1, 1 - blink * .9 + (s.wide || 0) * .25); ell(g, 0, 0, 8.5, 11); g.fill(); g.fillStyle = '#fff'; ell(g, -2.6, -3.6, 3, 3.6); g.fill(); g.fillStyle = PAL.ink; g.restore(); }
      const br = (s.brow ?? 0) * 7, tilt = (s.browTilt || 0) * 7;   // tilt < 0 = worried (inner ends up)
      g.strokeStyle = PAL.hair; g.lineWidth = 4.6; g.lineCap = 'round'; g.beginPath();
      g.moveTo(sx * 24 - sx * 12, -106 - br + tilt * .5); g.lineTo(sx * 24 + sx * 12, -106 - br - tilt * .5); g.stroke();
    }
    g.fillStyle = 'rgba(240,120,110,' + (s.blush ?? .22) + ')'; ell(g, -42, -58, 15, 9); g.fill(); ell(g, 42, -58, 15, 9); g.fill();
    const m = s.mouth || 'closed', o = s.open ?? 0; g.strokeStyle = '#7b3b34'; g.lineWidth = 3.4; g.lineCap = 'round';
    if (m === 'closed') { g.beginPath(); g.moveTo(-9, -44); g.quadraticCurveTo(0, -41, 9, -44); g.stroke(); }
    else if (m === 'smile') { g.beginPath(); g.moveTo(-14, -48); g.quadraticCurveTo(0, -32, 14, -48); g.stroke(); }
    else if (m === 'wobbly') { g.beginPath(); g.moveTo(-12, -42); g.bezierCurveTo(-6, -48, -2, -38, 3, -44); g.bezierCurveTo(7, -48, 10, -42, 13, -44); g.stroke(); }
    else { g.fillStyle = '#7b3b34'; ell(g, 0, -42, m === 'o' ? 8 : 12, 4 + o * (m === 'o' ? 9 : 10)); g.fill(); if (o > .3) { g.fillStyle = '#e8847c'; ell(g, 0, -42 + o * 4, 7, 3 + o * 3); g.fill(); } }
  };
  const parts = [
    P('shins', shins, null, 0, 0, 1),
    P('torso', torso, null, 0, 0, 2),
    P('head', head, 'torso', 0, -128, 3, { hook: eyes, drop: 1 }),
    P('knees', knees, null, 0, 0, 3.2, { drop: 1 }),
    P('uArmL', upper, 'torso', -70, -112, 4, { drop: 1 }), P('fArmL', fore, 'uArmL', 0, 80, 4.2, { drop: 1 }),
    P('uArmR', upper, 'torso', 70, -112, 4, { drop: 1 }), P('fArmR', fore, 'uArmR', 0, 80, 4.2, { drop: 1 }),
    P('bread', bread, 'torso', 0, -86, 6, { drop: 1 }),
    P('palmL', palm, 'bread', -40, 16, 5.5, { drop: 1, sx: .66, sy: .7 }), P('fingL', fingers, 'bread', -44, 14, 7, { drop: 1 }), P('thumbL', thumb, 'bread', -42, -20, 7.1, { drop: 1 }),
    P('palmR', palm, 'bread', 40, 16, 5.5, { sx: -.66, sy: .7, drop: 1 }), P('fingR', fingers, 'bread', 44, 14, 7, { sx: -1, drop: 1 }), P('thumbR', thumb, 'bread', 42, -20, 7.1, { sx: -1, drop: 1 }),
  ];
  const rig = new Rig(parts, 420, 520, 210, 330, R);
  rig.head = rig.parts.head;
  // pose: t seconds, o = { look, lookY, mouth, brow, browTilt, rubAt (time of the one thumb rub), tilt }
  rig.pose = (t, o = {}) => {
    const T = rig.parts, b = 1 + .015 * Math.sin(t / 3.7 * TAU);
    T.torso.sy = b; T.torso.rot = Math.sin(t * .6) * .01;
    T.head.rot = Math.sin(t * .45 + 1) * .03 + (o.tilt || 0);
    T.head.face = { blink: blinkAt(t, 1, 4.1), lookX: o.look ?? 0, lookY: o.lookY ?? .6, mouth: o.mouth || 'closed', brow: o.brow ?? 0, browTilt: o.browTilt ?? -.5, blush: .2 };
    // the bread breathes with him; the arms reach the wrists that grip it
    T.bread.jy = -86 + Math.sin(t * 1.1) * 1.2; T.bread.rot = Math.sin(t * .7) * .02;
    const grip = .5 + .5 * Math.sin(t * 1.7);                       // fingers tighten a little, and ease
    for (const [f, k] of [['fingL', 1], ['fingR', -1]]) { T[f].sx = k * (1 - .06 * grip); T[f].rot = -k * .04 * grip; }
    const ru = o.rubAt == null ? -1 : clamp((t - o.rubAt) / .9);    // the thumb rubs the crust once
    const rub = ru > 0 && ru < 1 ? Math.sin(ru * Math.PI * 2) * .32 : 0;
    T.thumbL.rot = -rub; T.thumbR.rot = 0;
    for (const [u, f, side] of [['uArmL', 'fArmL', -1], ['uArmR', 'fArmR', 1]]) {
      const sx = side * 70, sy = -112, wx = side * 50, wy = T.bread.jy + 26;   // wrist: outer-lower corner of the bread
      const [a1, a2] = ik(wx - sx, wy - sy, 80, 60, side < 0 ? -1 : 1);
      T[u].rot = a1; T[f].rot = a2;
    }
    return rig.render();
  };
  return rig;
}

// ---------- Puss ----------
export function makePuss({ boots = false, res = 2 } = {}) {
  CUR_RES = res;
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
  const rig = new Rig(parts, 600, 560, 300, 420, res); CUR_RES = 2;
  return rig;
}

// idle breathing / blink helpers (deterministic in t)
export function blinkAt(t, seed = 0, every = 4) {
  const n = Math.floor(t / every), r = (Math.sin((n + seed) * 91.7) * .5 + .5) * every * .7 + .6, local = t - n * every - r, dur = .22;
  if (local < 0 || local > dur) return 0; const u = local / dur; return u < .5 ? u * 2 : 2 - u * 2;
}
export const breathe = (t, seed = 0, period = 3.6) => 1 + .015 * Math.sin((t / period + seed) * TAU);
