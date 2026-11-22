// Paper puppets: every part is its own cut-paper sheet pinned at a joint; poses rotate the parts. Space: origin at the seat/feet, y up is negative.
// Faces are drawn per frame (eyes, brows, mouth, nose, ears) so heads can turn and eyes can lead the head.
import { paint, dynSheet } from './engine.js';
import { PAL, rr, ell, cut } from './art.js';
import { TAU, clamp, lerp, ss, eio, mulberry } from './lib.js';

export class Rig {
  constructor(parts, w, h, ax, ay, res = 2) {
    this.parts = {}; this.list = parts; for (const p of parts) { Object.assign(p, { rot: 0, sx: 1, sy: 1, vis: true, jx: 0, jy: 0, ...p }); this.parts[p.name] = p; }
    this.dyn = dynSheet(w, h, res, ax, ay); this.res = res;
    this.order = [...parts].sort((a, b) => (a.z || 0) - (b.z || 0));
  }
  render() {
    const d = this.dyn, g = d.g, R = this.res; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, d.c.width, d.c.height);
    g.setTransform(R, 0, 0, R, d.ax, d.ay);
    const M = new Map();
    const mat = p => {
      if (M.has(p)) return M.get(p);
      const par = p.parent ? mat(this.parts[p.parent]) : [1, 0, 0, 1, 0, 0];
      const c = Math.cos(p.rot), s = Math.sin(p.rot), la = c * p.sx, lb = s * p.sx, lc = -s * p.sy, ld = c * p.sy;
      const m = [par[0] * la + par[2] * lb, par[1] * la + par[3] * lb, par[0] * lc + par[2] * ld, par[1] * lc + par[3] * ld, par[0] * p.jx + par[2] * p.jy + par[4], par[1] * p.jx + par[3] * p.jy + par[5]];
      M.set(p, m); return m;
    };
    for (const p of this.order) {
      if (!p.vis) continue; const m = mat(p);
      g.save(); g.transform(...m);
      if (p.sheet) {
        if (p.drop) { g.shadowColor = `rgba(40,18,6,${p.drop === 2 ? .5 : .38})`; g.shadowBlur = 3.4 * R; g.shadowOffsetX = 1.4 * R; g.shadowOffsetY = 2.2 * R; }   // away from the upper-left light
        g.drawImage(p.sheet.c, -p.sheet.ax / p.sheet.res, -p.sheet.ay / p.sheet.res, p.sheet.c.width / p.sheet.res, p.sheet.c.height / p.sheet.res);
        g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = g.shadowOffsetY = 0;
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

export function ik(tx, ty, a, b, bend = 1) {
  let d = Math.hypot(tx, ty); d = clamp(d, Math.abs(a - b) + 1, a + b - .5);
  const base = Math.atan2(ty, tx), cosA = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), ang = Math.acos(cosA);
  const s = base - bend * ang, ex = a * Math.cos(s), ey = a * Math.sin(s), f = Math.atan2(ty - ey, tx - ex);
  return [s - Math.PI / 2, f - s];
}

// ---------- timing helpers: blinks (every 3-5 s, some double), damped follow-through, anticipation ----------
export function blinkTrack(seed, { forced = [], slow = [] } = {}) {
  const R = mulberry(seed * 7919 + 13), times = []; let t = .6 + R() * 1.6;
  while (t < 900) { times.push([t, .2]); if (R() < .28) times.push([t + .3, .18]); t += 3 + R() * 2; }
  for (const f of forced) times.push([f, .2]);
  for (const f of slow) times.push([f, .7]);
  return tt => { let v = 0; for (const [a, d] of times) { const u = (tt - a) / d; if (u > 0 && u < 1) v = Math.max(v, u < .4 ? u / .4 : 1 - (u - .4) / .6); } return v; };
}
export function spring(x, t, t0, k = 90, c = 9) {   // damped spring following x(t), simulated from t0 (deterministic)
  let y = x(t0), v = 0; const dt = 1 / 120;
  for (let s = t0; s < t; s += dt) { const a = k * (x(s) - y) - c * v; v += a * dt; y += v * dt; }
  return y;
}
export const antic = (u, a = .12) => { u = clamp(u); return u < .22 ? -a * Math.sin(u / .22 * Math.PI) : eio((u - .22) / .78); };

// ================= Tom, seated =================
export function makeTom({ res = 2, bodyTurn = .45, jacket = false } = {}) {
  CUR_RES = Math.max(2, res);
  const tb = bodyTurn, tunic = jacket ? '#3f6fc0' : PAL.tunic, tunicD = jacket ? '#2f55a0' : '#7a4f30', cuff = jacket ? '#2a4f96' : '#6d4429', sleeveC = jacket ? '#3866b4' : '#8d5c38';
  const SK = PAL.skin, SKD = PAL.skinD, HR = Math.max(3, CUR_RES + 1);
  const leg = (patch) => sh(130, 200, 65, 60, g => {
    g.fillStyle = PAL.pants;
    g.beginPath(); g.moveTo(-14, 92); g.bezierCurveTo(-17, 62, -24, 34, -27, 10); g.bezierCurveTo(-30, -8, -18, -24, 0, -24); g.bezierCurveTo(18, -24, 30, -10, 27, 8); g.bezierCurveTo(24, 32, 17, 62, 14, 92); g.closePath(); g.fill();   // the knee, a soft dome (the thigh goes back from it, out of sight), and the tapering shin
    g.fillStyle = 'rgba(30,20,50,.18)'; g.beginPath(); g.moveTo(-24, 14); g.quadraticCurveTo(0, 22, 24, 12); g.quadraticCurveTo(0, 30, -24, 14); g.fill();   // a soft fold below the knee
    g.fillStyle = PAL.shoe; g.beginPath(); g.moveTo(-17, 88); g.bezierCurveTo(-30, 96, -34, 112, -22, 118); g.bezierCurveTo(-6, 124, 22, 124, 30, 116); g.bezierCurveTo(36, 108, 26, 92, 16, 88); g.closePath(); g.fill();   // shoe
    if (patch) {   // a soft, slightly crooked patch; the stitches follow its outline (no circles)
      const blob = k => { g.beginPath(); g.moveTo(-11 * k, -9 * k); g.bezierCurveTo(-4 * k, -14 * k, 8 * k, -13 * k, 11 * k, -8 * k); g.bezierCurveTo(14 * k, -2 * k, 12 * k, 7 * k, 9 * k, 10 * k); g.bezierCurveTo(2 * k, 13 * k, -8 * k, 12 * k, -11 * k, 7 * k); g.bezierCurveTo(-14 * k, 1 * k, -13 * k, -5 * k, -11 * k, -9 * k); g.closePath(); };
      g.save(); g.translate(1, -2); g.rotate(-.22); g.fillStyle = '#5c4b72'; blob(1); g.fill(); g.strokeStyle = '#3a2f4c'; g.lineWidth = 1.2; g.setLineDash([2.6, 2.6]); blob(.74); g.stroke(); g.setLineDash([]); g.restore(); }
  });
  const legL = leg(true), legR = leg(false);


  const torso = sh(240, 200, 120, 150, g => {
    g.fillStyle = tunic; g.beginPath(); g.moveTo(-26, -140); g.bezierCurveTo(-50, -141, -74, -134, -80, -114); g.bezierCurveTo(-86, -94, -78, -60, -74, -36); g.bezierCurveTo(-79, -18, -88, -2, -82, 6);
    g.bezierCurveTo(-40, 17, 40, 17, 82, 6); g.bezierCurveTo(88, -2, 79, -18, 74, -36); g.bezierCurveTo(78, -60, 86, -94, 80, -114); g.bezierCurveTo(74, -134, 50, -141, 26, -140); g.closePath(); g.fill();
    g.fillStyle = tunicD; g.beginPath(); g.moveTo(-70, -126); g.quadraticCurveTo(0, -116, 70, -126); g.lineTo(44, -100); g.quadraticCurveTo(0, -88, -44, -100); g.closePath(); g.fill();
    g.fillStyle = SK; g.beginPath(); g.moveTo(-24, -132); g.quadraticCurveTo(0, -112, 24, -132); g.lineTo(20, -140); g.lineTo(-20, -140); g.closePath(); g.fill();
    const ao = g.createRadialGradient(4, -128, 0, 4, -128, 46); ao.addColorStop(0, 'rgba(40,16,4,.45)'); ao.addColorStop(1, 'rgba(40,16,4,0)');   // under the chin
    g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = ao; g.fillRect(-60, -150, 120, 70); g.restore();
    g.fillStyle = '#4a3326'; g.beginPath(); g.moveTo(-77, -30); g.quadraticCurveTo(0, -24, 77, -30); g.quadraticCurveTo(80, -21, 78, -12); g.quadraticCurveTo(0, -6, -78, -12); g.quadraticCurveTo(-80, -21, -77, -30); g.closePath(); g.fill();   // belt, following the body's curve
  });
  const headBase = sh(200, 200, 100, 160, g => {
    const ng = g.createLinearGradient(0, -34, 0, 8); ng.addColorStop(0, '#a8704c'); ng.addColorStop(1, SK); g.fillStyle = ng; rr(g, -22, -34, 44, 44, 14); g.fill();   // neck, dark under the chin
    g.fillStyle = SK; ell(g, 0, -80, 68, 66); g.fill();
  });
  const hair = sh(200, 140, 100, 100, g => {
    g.fillStyle = PAL.hair; g.beginPath(); g.moveTo(-72, 2); g.bezierCurveTo(-84, -70, -30, -80, 8, -70); g.bezierCurveTo(52, -80, 84, -56, 72, 2);
    g.bezierCurveTo(54, -32, 30, -38, 4, -32); g.bezierCurveTo(-22, -28, -52, -20, -72, 2); g.closePath(); g.fill();
  });
  const tuft = sh(60, 60, 16, 50, g => { g.fillStyle = PAL.hair; g.beginPath(); g.moveTo(-8, 4); g.bezierCurveTo(-16, -22, 18, -28, 20, -8); g.bezierCurveTo(8, -14, 0, -6, 2, 6); g.closePath(); g.fill(); });
  const cyl = (g, x0, x1, base) => { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(255,236,205,.28)'); gr.addColorStop(.45, 'rgba(255,236,205,0)'); gr.addColorStop(1, 'rgba(40,16,4,.32)'); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = gr; g.fillRect(x0, -40, x1 - x0, 200); g.restore(); };
  // arms (director's note 3): no tubes. The upper arm tapers from a soft shoulder to the elbow (rounded end over the forearm,
  // so the bend reads as a soft elbow); the forearm tapers on to a soft cuff closed round the wrist. Bones: 62 + 46.
  const upper = sh(60, 100, 30, 16, g => { g.fillStyle = sleeveC; g.beginPath(); g.moveTo(-17, 0); g.bezierCurveTo(-17, -15, 17, -15, 17, 0); g.bezierCurveTo(17, 22, 15, 44, 13, 58); g.bezierCurveTo(12, 70, -12, 70, -13, 58); g.bezierCurveTo(-15, 44, -17, 22, -17, 0); g.closePath(); g.fill(); cyl(g, -18, 18);
    g.strokeStyle = 'rgba(70,40,18,.35)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-8, 52); g.quadraticCurveTo(-2, 56, 6, 53); g.stroke(); });   // a soft crease at the elbow
  const fore = sh(50, 80, 25, 14, g => {   // elbow (anchor) to wrist: the sleeve tapers and ends in a soft cuff; a little wrist below it
    g.fillStyle = SK; g.beginPath(); g.moveTo(-7, 38); g.bezierCurveTo(-7, 44, -6.5, 49, -5, 52); g.quadraticCurveTo(0, 55, 5, 52); g.bezierCurveTo(6.5, 49, 7, 44, 7, 38); g.closePath(); g.fill();
    g.fillStyle = sleeveC; g.beginPath(); g.moveTo(-12.5, -4); g.bezierCurveTo(-12, -13, 12, -13, 12.5, -4); g.bezierCurveTo(13, 10, 11, 24, 10, 36); g.lineTo(-10, 36); g.bezierCurveTo(-11, 24, -13, 10, -12.5, -4); g.closePath(); g.fill(); cyl(g, -13, 13);
    g.fillStyle = cuff; g.beginPath(); g.moveTo(-11, 34); g.bezierCurveTo(-11.5, 30, 11.5, 30, 11, 34); g.bezierCurveTo(12, 39, 10.5, 43, 8.5, 44.5); g.bezierCurveTo(3, 46.5, -3, 46.5, -8.5, 44.5); g.bezierCurveTo(-10.5, 43, -12, 39, -11, 34); g.closePath(); g.fill();   // soft cuff, closed
  });
  const bread = makeBread(HR);
  // left hand (mirrored for the right): back of the hand and heel behind the bread; slim fingertips round the side edge; the thumb on the top front
  // each hand grips the loaf from its side: the palm sits against the side (behind the loaf's edge), ALL FOUR fingers curve
  // over the front crust, and the thumb lies on top. Origin = the bread's centre; the right hand is the mirror image.
  const handBehind = sh(150, 130, 85, 65, g => {   // the palm and the heel of the hand, against the loaf's side
    g.fillStyle = SK;
    g.beginPath(); g.moveTo(-47, 38); g.bezierCurveTo(-54, 34, -57, 22, -56, 8); g.bezierCurveTo(-55, -6, -50, -22, -42, -27); g.bezierCurveTo(-38, -26, -36, -22, -36, -18); g.lineTo(-38, 12); g.bezierCurveTo(-40, 24, -41, 32, -47, 38); g.closePath(); g.fill();
  }, HR);
  const FING = [[-53, 13, 16, -.1, 6.6], [-53.5, 4.6, 20, -.03, 7.4], [-50.5, -4, 22, .05, 7.9], [-46, -12.6, 20, .13, 7.6]];   // pinky, ring, middle, index: base x, y, length, angle, width
  const fingers = sh(150, 130, 85, 65, g => {
    for (const [bx, by, L, a, w] of FING) {
      g.save(); g.translate(bx, by); g.rotate(a);
      const finger = () => { g.beginPath(); g.moveTo(-2, -w / 2); g.bezierCurveTo(L * .4, -w / 2 - .3, L * .75, -w * .47, L - 3, -w * .42); g.bezierCurveTo(L + 1.4, -w * .3, L + 1.4, w * .3, L - 3, w * .42); g.bezierCurveTo(L * .75, w * .47, L * .4, w / 2 + .3, -2, w / 2); g.closePath(); };
      const sg = g.createLinearGradient(0, -w / 2, 0, w / 2); sg.addColorStop(0, '#f7c9a6'); sg.addColorStop(.55, SK); sg.addColorStop(1, '#d99872');
      g.fillStyle = sg; finger(); g.fill();
      g.strokeStyle = 'rgba(150,80,50,.55)'; g.lineWidth = .9; g.beginPath(); g.moveTo(1, w / 2 - .2); g.bezierCurveTo(L * .4, w / 2 + .1, L * .75, w * .45, L - 3, w * .4); g.stroke();   // the line between this finger and the next
      g.strokeStyle = 'rgba(150,80,50,.45)'; g.lineWidth = .8; g.beginPath(); g.moveTo(L * .42, -w * .32); g.quadraticCurveTo(L * .45, 0, L * .42, w * .32); g.stroke();   // the middle knuckle crease
      g.fillStyle = '#f6d8c0'; g.beginPath(); g.moveTo(L - 6.2, -w * .24); g.bezierCurveTo(L - 3, -w * .3, L - .6, -w * .2, L - .6, 0); g.bezierCurveTo(L - .6, w * .2, L - 3, w * .3, L - 6.2, w * .24); g.bezierCurveTo(L - 7, w * .1, L - 7, -w * .1, L - 6.2, -w * .24); g.closePath(); g.fill();   // the nail
      g.restore();
    }
  }, HR);
  const FTIPS = FING.map(([bx, by, L, a]) => [bx + Math.cos(a) * L, by + Math.sin(a) * L]);
  const thumb = sh(60, 30, 4, 15, g => { g.fillStyle = SK; g.beginPath(); g.moveTo(-3, 4); g.bezierCurveTo(2, -4, 14, -6, 25, -4.5); g.bezierCurveTo(30, -3.5, 31, 2.5, 25, 3.8); g.bezierCurveTo(16, 5, 7, 6.5, -1, 9); g.closePath(); g.fill(); g.fillStyle = '#f3cdb0'; g.beginPath(); g.ellipse(25.5, -.5, 3.2, 2.4, 0, 0, TAU); g.fill(); g.strokeStyle = SKD; g.lineWidth = 1; g.beginPath(); g.moveTo(13, -5); g.quadraticCurveTo(14.5, 0, 13, 4.8); g.stroke(); }, HR);
  const face = (g, p) => {   // head space (origin at the neck pivot). s.turn: -1..1, + = facing screen right
    const s = p.face || {}, th = clamp(s.turn ?? tb, -1, 1), sh2 = th * 18, blink = s.blink ?? 0, lx = (s.lookX || 0) * 7, ly = (s.lookY || 0) * 8;
    const dn = clamp((s.lookY || 0) - .4, 0, .6) * 16; g.save(); g.translate(0, dn);
    g.fillStyle = SK; const nearX = th >= 0 ? -64 + th * 16 : 64 + th * 16, farX = th >= 0 ? 64 + th * 40 : -64 + th * 40;
    if (Math.abs(th) < .35) { ell(g, farX, -62, 14, 18); g.fill(); }
    ell(g, nearX, -62, 15, 18); g.fill(); g.strokeStyle = SKD; g.lineWidth = 1.6; g.beginPath(); g.arc(nearX + (th >= 0 ? 2 : -2), -62, 7, -1.2, 1.2); g.stroke();
    g.fillStyle = 'rgba(240,120,110,' + (s.blush ?? .2) + ')'; ell(g, -40 + sh2 * 1.1, -58, 14 * (1 - .3 * Math.max(0, th)), 8); g.fill(); ell(g, 40 + sh2 * .7, -58, 14 * (1 - .3 * Math.max(0, -th)), 8); g.fill();
    for (const sx of [-1, 1]) {
      const far = sx * th > 0, ew = far ? 1 - .28 * Math.abs(th) : 1, ex = sx * 24 * (far ? 1 - .2 * Math.abs(th) : 1) + sh2 + lx, ey = -82 + ly;
      g.fillStyle = PAL.ink;
      if (blink > .85) { g.strokeStyle = PAL.ink; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 9 * ew, ey); g.quadraticCurveTo(ex, ey + 4, ex + 9 * ew, ey); g.stroke(); }
      else { g.save(); g.translate(ex, ey); g.scale(ew, 1 - blink * .9 + (s.wide || 0) * .25); ell(g, 0, 0, 8.5, 11); g.fill(); g.fillStyle = '#fff'; ell(g, -2.6 + lx * .25, -3.6 + ly * .25, 3, 3.6); g.fill();
        const lid = clamp((s.lookY || 0) - .5, 0, .5) * .25; if (lid > 0) { g.fillStyle = SK; g.beginPath(); g.moveTo(-11, -13); g.lineTo(11, -13); g.lineTo(11, -13 + 26 * lid); g.quadraticCurveTo(0, -10 + 26 * lid, -11, -13 + 26 * lid); g.closePath(); g.fill(); g.strokeStyle = PAL.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(-10, -13 + 26 * lid); g.quadraticCurveTo(0, -10 + 26 * lid, 10, -13 + 26 * lid); g.stroke(); }   // a light upper lid: still open, looking down
        g.restore(); }
      const br = (s.brow ?? 0) * 7, tilt = (s.browTilt || 0) * 8, bx = sx * 24 * (far ? 1 - .2 * Math.abs(th) : 1) + sh2;
      g.strokeStyle = PAL.hair; g.lineWidth = 4.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx - sx * 11 * ew, -106 - br + tilt * .5); g.lineTo(bx + sx * 12 * ew, -106 - br - tilt * .5); g.stroke();
    }
    g.strokeStyle = SKD; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); const nx = sh2 * 1.3; g.moveTo(nx - 3 + th * 4, -68); g.quadraticCurveTo(nx + 3 + th * 6, -60, nx - 2, -58); g.stroke();   // nose
    const m = s.mouth || 'closed', o = s.open ?? 0, mx = sh2 * 1.05; g.strokeStyle = '#7b3b34'; g.lineWidth = 3.4;
    if (m === 'closed') { g.beginPath(); g.moveTo(mx - 9, -44); g.quadraticCurveTo(mx, -41, mx + 9, -44); g.stroke(); }
    else if (m === 'smile') { const k = s.smile ?? 1; g.beginPath(); g.moveTo(mx - 9 - 4 * k, -44 - 3 * k); g.quadraticCurveTo(mx, -41 + 7 * k, mx + 9 + 4 * k, -44 - 3 * k); g.stroke(); }
    else if (m === 'wobbly') { const w = (s.wob ?? 0); g.beginPath(); g.moveTo(mx - 12, -42); g.bezierCurveTo(mx - 6, -47 - w, mx - 2, -38 + w, mx + 3, -44); g.bezierCurveTo(mx + 7, -48 + w, mx + 10, -42, mx + 13, -43); g.stroke(); }
    else { g.fillStyle = '#7b3b34'; ell(g, mx, -42, m === 'o' ? 8 : 12, 4 + o * (m === 'o' ? 9 : 10)); g.fill(); }
    g.restore();
  };
  const k1 = tb * 14, spn = 1 - .14 * Math.abs(tb);
  const parts = [
    P('torso', torso, null, 0, 0, 2, { sx: 1 - .08 * Math.abs(tb) }),
    P('head', headBase, 'torso', tb * 6, -128, 3, { hook: face, drop: 1 }),
    P('hair', hair, 'head', 0, -80, 3.5), P('tuft', tuft, 'hair', 2, -70, 3.6),
    P('legL', legL, null, -58 * spn + k1, -16, tb >= 0 ? 3.3 : 3.2, { drop: 1 }), P('legR', legR, null, 58 * spn + k1, -16, tb >= 0 ? 3.2 : 3.3, { drop: 1, sx: -1 }),
    P('uArmL', upper, 'torso', -66 + tb * 6, -112, 4.2, { drop: 1 }), P('fArmL', fore, 'uArmL', 0, 62, 4, { drop: 1 }),
    P('uArmR', upper, 'torso', 66 - tb * 8, -112, 4.1, { drop: 1 }), P('fArmR', fore, 'uArmR', 0, 62, 3.9, { drop: 1 }),
    P('handL', handBehind, 'bread', 0, 0, 5.6, { drop: 1 }), P('handR', handBehind, 'bread', 0, 0, 5.6, { sx: -1, drop: 1 }),
    P('fingL', fingers, 'bread', 0, 0, 6.9, { drop: 1 }), P('fingR', fingers, 'bread', 0, 0, 6.9, { sx: -1, drop: 1 }),
    P('bread', bread, 'torso', tb * 8, -76, 6, { drop: 2 }),
    P('thumbL', thumb, 'bread', -40, -25, 7, { drop: 1, rot: .1 }), P('thumbR', thumb, 'bread', 40, -25, 7, { sx: -1, drop: 1, rot: -.1 }),
  ];
  const rig = new Rig(parts, 440, 540, 220, 340, CUR_RES); CUR_RES = 2;
  rig.height = 300;   // seat to the top of the hair, puppet units
  rig.pose = (t, o = {}) => {
    const T = rig.parts, val = (v, d) => typeof v === 'function' ? v(t) : (v ?? d);
    let br = .018 * Math.sin(t / 3.6 * TAU);   // breathing: chest and shoulders rise gently
    if (o.sigh != null) { const u = (t - o.sigh) / 1.3; if (u > 0 && u < 1) br += u < .45 ? .05 * ss(u / .45) : .05 - .07 * ss((u - .45) / .55) + .02 * ss((u - .8) / .2); }
    T.torso.sy = 1 + br; T.torso.rot = Math.sin(t * .6) * .006;
    const ht = val(o.headTurn, tb);
    T.head.face = { turn: ht, blink: val(o.blink, 0), lookX: val(o.lookX, 0), lookY: val(o.lookY, .6), mouth: val(o.mouth, 'closed'), smile: val(o.smile, 1), wob: val(o.wob, 0), brow: val(o.brow, 0), browTilt: val(o.browTilt, -.4), blush: .2 };
    T.head.rot = Math.sin(t * .45 + 1) * .02 + val(o.headTilt, 0); T.head.jy = -128 + val(o.headDip, 0); T.head.jx = tb * 6 + ht * 3;
    T.hair.jx = -ht * 10; T.tuft.rot = val(o.tuftRot, 0) + Math.sin(t * 1.3) * .03;
    const grip = val(o.worry, 0);   // how hard the fingers grip (0..1)
    T.handL.sx = T.fingL.sx = 1 - .025 * grip; T.handR.sx = T.fingR.sx = -(1 - .025 * grip); T.thumbL.rot = .1 + .05 * grip; T.thumbR.rot = -.1 - .05 * grip;
    if (o.rubAt != null) { const u = clamp((t - o.rubAt) / .9); if (u > 0 && u < 1) T.thumbL.rot += Math.sin(u * TAU) * .14; }
    T.bread.jy = -76 + Math.sin(t / 3.6 * TAU) * 1.4;
    for (const [u, f, side] of [['uArmL', 'fArmL', -1], ['uArmR', 'fArmR', 1]]) {
      const sx = side * 66 + (side < 0 ? tb * 6 : -tb * 8), sy = -112 * T.torso.sy, wx = side * 48 + tb * 8, wy = T.bread.jy + 34;
      const [a1, a2] = ik(wx - sx, wy - sy, 62, 46, side < 0 ? -1 : 1); T[u].rot = a1; T[f].rot = a2;
    }
    return rig.render();
  };
  rig.FTIPS = FTIPS;
  return rig;
}

// the bread: a domed golden-brown crust with a shiny top, one torn side showing a soft crumb with holes (about two palms wide)
export function makeBread(res = 3, w = 96, h = 64) {
  return paint(w + 30, h + 30, g => {
    const crust = g.createLinearGradient(0, -h / 2, 0, h / 2); crust.addColorStop(0, '#d0923e'); crust.addColorStop(.55, '#a8662a'); crust.addColorStop(1, '#7e4a1e');
    g.fillStyle = crust; g.beginPath(); g.moveTo(-w / 2, h * .32); g.bezierCurveTo(-w / 2 - 4, -h * .25, -w * .2, -h / 2 - 2, w * .08, -h / 2); g.bezierCurveTo(w * .3, -h / 2, w * .44, -h * .3, w * .46, -h * .05);
    const R = mulberry(5); for (let i = 0; i <= 8; i++) { const yy = -h * .05 + i * (h * .4 / 8); g.lineTo(w * .46 - (i % 2 ? 4 + R() * 3 : R() * 2), yy); }
    g.bezierCurveTo(w * .3, h * .42, -w * .2, h * .44, -w / 2, h * .32); g.closePath(); g.fill();
    g.fillStyle = '#f2d9a4'; g.beginPath(); g.moveTo(w * .12, -h * .12); g.quadraticCurveTo(w * .3, -h * .2, w * .43, -h * .04);
    for (let i = 0; i <= 8; i++) { const yy = -h * .04 + i * (h * .38 / 8); g.lineTo(w * .43 - (i % 2 ? 4 + R() * 3 : R() * 2), yy); }
    g.quadraticCurveTo(w * .26, h * .38, w * .1, h * .3); g.quadraticCurveTo(w * .02, h * .1, w * .12, -h * .12); g.closePath(); g.fill();
    { const Q = mulberry(913); g.save(); g.beginPath(); g.moveTo(w * .12, -h * .12); g.quadraticCurveTo(w * .3, -h * .2, w * .42, -h * .04); g.lineTo(w * .4, h * .32); g.quadraticCurveTo(w * .26, h * .38, w * .1, h * .3); g.quadraticCurveTo(w * .02, h * .1, w * .12, -h * .12); g.clip();
      for (let i = 0; i < 34; i++) { const x = w * (.1 + Q() * .32), y = h * (-.12 + Q() * .46), r = (.5 + Q() * Q() * 2.2) * (w / 96); g.fillStyle = `rgba(${150 + Q() * 40 | 0},${105 + Q() * 30 | 0},${55 + Q() * 25 | 0},${.35 + Q() * .35})`; g.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, rr2 = r * (.6 + Q() * .7); g.lineTo(x + Math.cos(a) * rr2 * 1.3, y + Math.sin(a) * rr2); } g.closePath(); g.fill(); }
      g.restore(); }
    const hl = g.createRadialGradient(-w * .12, -h * .3, 0, -w * .12, -h * .3, w * .26); hl.addColorStop(0, 'rgba(255,246,220,.75)'); hl.addColorStop(1, 'rgba(255,246,220,0)');
    g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = hl; g.fillRect(-w, -h, w * 2, h * 2); g.restore();
    g.strokeStyle = 'rgba(255,240,210,.85)'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-w * .28, -h * .3); g.quadraticCurveTo(-w * .12, -h * .44, w * .06, -h * .4); g.stroke();
  }, { res, fin: { rim: .5, side: .2 } });
}

// ================= Tom from behind (over-the-shoulder foreground): back of the head and shoulder =================
export function tomRear(res = 2) {
  return paint(700, 800, g => {
    g.fillStyle = PAL.tunic; g.beginPath(); g.moveTo(-340, 400); g.bezierCurveTo(-330, 120, -200, 30, -30, 20); g.bezierCurveTo(120, 14, 230, 90, 280, 210); g.lineTo(300, 400); g.closePath(); g.fill();
    g.fillStyle = '#7a4f30'; g.beginPath(); g.moveTo(-90, 26); g.quadraticCurveTo(10, 4, 110, 30); g.quadraticCurveTo(10, 50, -90, 26); g.fill();
    g.fillStyle = PAL.skin; rr(g, -40, -60, 90, 100, 30); g.fill();                               // the nape of the neck
    g.fillStyle = PAL.skin; ell(g, 136, -138, 24, 32); g.fill(); g.strokeStyle = PAL.skinD; g.lineWidth = 3; g.beginPath(); g.arc(132, -138, 12, -1.3, 1.3); g.stroke();   // ear toward the cat
    g.fillStyle = PAL.hair; ell(g, 6, -160, 132, 128); g.fill();                                   // the back of the head: all hair
    g.beginPath(); g.moveTo(-110, -90); g.quadraticCurveTo(-60, -20, 10, -30); g.quadraticCurveTo(80, -24, 112, -86); g.lineTo(110, -120); g.lineTo(-114, -120); g.closePath(); g.fill();   // hair down to the nape
    g.strokeStyle = '#4a2e1e'; g.lineWidth = 4; for (const a of [-.9, -.4, .1, .6]) { g.beginPath(); g.moveTo(0, -250); g.quadraticCurveTo(Math.sin(a) * 90, -180, Math.sin(a) * 120, -70); g.stroke(); }   // strands
    g.fillStyle = PAL.hair; g.beginPath(); g.moveTo(-20, -270); g.bezierCurveTo(-40, -330, 40, -340, 48, -290); g.bezierCurveTo(20, -300, 4, -290, 6, -262); g.closePath(); g.fill();   // the tuft
  }, { res, ax: 350, ay: 400, fin: { rim: .5, side: .25 } });
}
// his hands holding the bread, seen past his shoulder (near foreground)
export function breadRear(res = 3) {
  const b = makeBread(res, 150, 96);
  return paint(420, 300, g => {
    g.fillStyle = '#8d5c38'; g.beginPath(); g.moveTo(-210, 150); g.lineTo(-150, 30); g.lineTo(-96, 60); g.lineTo(-120, 150); g.closePath(); g.fill(); g.beginPath(); g.moveTo(210, 150); g.lineTo(160, 34); g.lineTo(104, 62); g.lineTo(130, 150); g.closePath(); g.fill();
    g.fillStyle = '#6d4429'; rr(g, -158, 30, 64, 20, 6); g.fill(); rr(g, 98, 32, 64, 20, 6); g.fill();
    g.drawImage(b.c, -b.ax / b.res, -b.ay / b.res - 30, b.c.width / b.res, b.c.height / b.res);
    g.fillStyle = PAL.skin;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 70, 40); g.bezierCurveTo(s * 66, 0, s * 76, -40, s * 88, -50); g.bezierCurveTo(s * 112, -44, s * 132, -10, s * 128, 40); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(s * 80, -46); g.bezierCurveTo(s * 64, -70, s * 36, -76, s * 22, -68); g.bezierCurveTo(s * 18, -60, s * 30, -56, s * 46, -54); g.closePath(); g.fill(); }
    g.strokeStyle = PAL.skinD; g.lineWidth = 2; for (const s of [-1, 1]) for (const y of [-26, -8, 10]) { g.beginPath(); g.moveTo(s * 76, y); g.lineTo(s * 122, y + 4); g.stroke(); }
  }, { res, fin: { rim: .5, side: .2 } });
}

// ================= Puss, seated (three-quarter turn baked in: turn < 0 faces screen left) =================
export function catSheets(res = 3, turn = -.5) {
  const prev = CUR_RES; CUR_RES = res;
  const O = PAL.orange, OD = PAL.orangeD, Wt = PAL.white, tr = turn, f = tr * 18;
  const tail = sh(200, 260, 40, 230, g => { g.fillStyle = O; g.beginPath(); g.moveTo(-18, 0); g.bezierCurveTo(70, -30, 130, -80, 118, -170); g.bezierCurveTo(112, -205, 88, -214, 76, -190); g.bezierCurveTo(86, -130, 50, -70, -18, -40); g.closePath(); g.fill(); g.fillStyle = OD; for (const [x, y, a] of [[58, -44, .5], [92, -88, .2], [108, -134, -.1]]) { g.save(); g.translate(x, y); g.rotate(a); rr(g, -20, -7, 40, 14, 6); g.fill(); g.restore(); } g.fillStyle = Wt; ell(g, 94, -196, 18, 15); g.fill(); });
  const body = sh(330, 330, 165, 300, g => {
    g.fillStyle = O; g.beginPath(); g.moveTo(-60 + f, -170); g.bezierCurveTo(-130, -120, -150, -20, -100, 6); g.lineTo(100, 6); g.bezierCurveTo(150, -20, 130, -120, 60 + f, -170); g.bezierCurveTo(30 + f, -186, -30 + f, -186, -60 + f, -170); g.closePath(); g.fill();
    g.fillStyle = Wt; g.beginPath(); g.moveTo(-34 + f * 1.4, -172); g.bezierCurveTo(-66 + f, -100, -52 + f, -30, -22 + f, 0); g.lineTo(22 + f, 0); g.bezierCurveTo(52 + f, -30, 66 + f, -100, 34 + f * 1.4, -172); g.closePath(); g.fill();
    g.fillStyle = OD; for (const [x, y, a] of [[-96, -50, .4], [86, -90, -.6], [96, -50, -.4]]) { g.save(); g.translate(x, y); g.rotate(a); rr(g, -18, -6, 36, 12, 6); g.fill(); g.restore(); }
    g.fillStyle = O; ell(g, -92, -26, 44, 30, -.4); g.fill(); ell(g, 92, -26, 44, 30, .4); g.fill();
  });
  const legF = sh(70, 160, 35, 10, g => { g.fillStyle = O; rr(g, -20, -8, 40, 110, 18); g.fill(); g.fillStyle = Wt; rr(g, -22, 82, 44, 56, 20); g.fill(); ell(g, 0, 132, 26, 14); g.fill(); g.strokeStyle = '#d8cbbb'; g.lineWidth = 2; g.beginPath(); g.moveTo(-6, 124); g.lineTo(-6, 140); g.moveTo(8, 124); g.lineTo(8, 140); g.stroke(); });
  const head = sh(300, 260, 150, 200, g => {
    g.fillStyle = O; g.beginPath(); g.moveTo(-100, -80); g.bezierCurveTo(-110, -150, -50, -168, 0, -166); g.bezierCurveTo(50, -168, 110, -150, 100, -80);
    g.bezierCurveTo(116, -62, 112, -40, 92, -34); g.bezierCurveTo(100, -14, 70, 2, 44, -8); g.bezierCurveTo(20, 6, -20, 6, -44, -8); g.bezierCurveTo(-70, 2, -100, -14, -92, -34); g.bezierCurveTo(-112, -40, -116, -62, -100, -80); g.closePath(); g.fill();
    g.fillStyle = OD; for (const dx of [-26, 0, 26]) { rr(g, dx - 6 + f * .6, -166, 12, 30 - Math.abs(dx) * .3, 6); g.fill(); }
    g.fillStyle = Wt; ell(g, -26 + f * 1.25, -42, 36 * (tr < 0 ? 1 : .8), 28, .2); g.fill(); ell(g, 26 + f * 1.25, -42, 36 * (tr < 0 ? .8 : 1), 28, -.2); g.fill();
  });
  const ear = () => sh(90, 110, 45, 90, g => { g.fillStyle = O; g.beginPath(); g.moveTo(-28, 4); g.lineTo(-8, -78); g.lineTo(32, -16); g.closePath(); g.fill(); g.fillStyle = PAL.pink; g.beginPath(); g.moveTo(-16, -6); g.lineTo(-6, -58); g.lineTo(18, -18); g.closePath(); g.fill(); }, res);
  const faceFn = (g, p) => {
    const s = p.face || {}, blink = s.blink ?? 0, lx = (s.lookX ?? -.6) * 13, ly = (s.lookY ?? .4) * 11, eyes = s.eyes || 'open';
    for (const sx of [-1, 1]) {
      const far = sx * tr > 0, ew = far ? 1 - .3 * Math.abs(tr) : 1, ex = sx * 42 * (far ? 1 - .22 * Math.abs(tr) : 1) + f, ey = -92;
      const wink = (eyes === 'winkL' && sx < 0) || (eyes === 'winkR' && sx > 0);
      if (eyes === 'happy' || wink) { g.strokeStyle = '#3a2a24'; g.lineWidth = 4.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 20 * ew, ey + 6); g.quadraticCurveTo(ex, ey - 14, ex + 20 * ew, ey + 6); g.stroke(); }
      else if (blink > .88) { g.strokeStyle = '#3a2a24'; g.lineWidth = 4.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 20 * ew, ey); g.quadraticCurveTo(ex, ey + 8, ex + 20 * ew, ey); g.stroke(); }
      else {
        const wide = eyes === 'wide' ? 1 : (s.wide || 0);
        g.save(); g.translate(ex, ey); g.scale(ew * (1 + wide * .12), (1 - blink * .95) * (1 + wide * .15));
        g.fillStyle = '#fffbe9'; ell(g, 0, 0, 26, 30); g.fill(); g.fillStyle = PAL.green; ell(g, lx * .9, ly * .9, 20 - wide * 6, 24 - wide * 8); g.fill();
        g.fillStyle = PAL.ink; if (wide > .3) { ell(g, lx, ly, 5, 6); g.fill(); } else { ell(g, lx, ly, 6, 20); g.fill(); } g.fillStyle = '#fff'; ell(g, lx - 6, ly - 9, 5, 6); g.fill();
        if (s.sparkle) { g.fillStyle = '#fff'; g.save(); g.translate(lx + 6, ly - 12); g.rotate(.3); const k = s.sparkle * 7; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? k * .35 : k; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.restore(); }
        const lid = (eyes === 'half' ? .5 : 0) + (s.lid || 0);
        if (blink > 0 || lid > 0) { g.fillStyle = O; g.fillRect(-30, -34, 60, 34 * Math.min(1, Math.max(blink * 1.1, lid * 1.15))); if (lid > 0) { g.strokeStyle = '#3a2a24'; g.lineWidth = 3; g.beginPath(); g.moveTo(-24, -34 + 34 * lid * 1.15); g.quadraticCurveTo(0, -30 + 34 * lid * 1.15, 24, -34 + 34 * lid * 1.15); g.stroke(); } }
        g.restore();
      }
      const bU = (s.brow ?? 0) + (sx < 0 ? (s.browL || 0) : (s.browR || 0)), bt = (s.browTilt || 0) * 7 * (sx * (tr < 0 ? 1 : 1));
      g.strokeStyle = OD; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 16 * ew, -128 - bU * 8 + bt * sx); g.lineTo(ex + 16 * ew, -128 - bU * 8 - bt * sx); g.stroke();
    }
    const tw = s.sniff || 0, nx = f * 1.45, m = s.mouth || 'closed', o = Math.max(0, Math.min(1, s.talk || 0));
    g.fillStyle = '#e8708c'; g.beginPath(); g.moveTo(nx - 9 * (1 + tw * .15), -56 - tw * 2); g.lineTo(nx + 9 * (1 + tw * .15), -56 - tw * 2); g.lineTo(nx, -45 - tw * 1.2); g.closePath(); g.fill();
    if (o > .06 || m === 'o' || m === 'grin') {   // an open mouth under the nose: dark, with a pink tongue
      const h = m === 'o' ? 16 : m === 'grin' ? 12 : 4 + o * 14, w = m === 'o' ? 9 : m === 'grin' ? 17 : 10 + o * 4;
      g.fillStyle = '#5a2430'; g.beginPath(); g.moveTo(nx - w, -36); g.quadraticCurveTo(nx, -40, nx + w, -36); g.quadraticCurveTo(nx + w * .8, -36 + h, nx, -36 + h); g.quadraticCurveTo(nx - w * .8, -36 + h, nx - w, -36); g.fill();
      if (h > 9) { g.fillStyle = '#e8708c'; ell(g, nx, -36 + h * .72, w * .55, h * .24); g.fill(); }
      g.strokeStyle = '#6b3a30'; g.lineWidth = 3.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(nx, -45); g.lineTo(nx, -39); g.stroke();
    } else {
      g.strokeStyle = '#6b3a30'; g.lineWidth = 3.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(nx, -45); g.lineTo(nx, -37);
      if (m === 'smile') { g.moveTo(nx - 18, -38); g.quadraticCurveTo(nx - 9, -24, nx, -37); g.quadraticCurveTo(nx + 9, -24, nx + 18, -38); }
      else if (m === 'smirk') { g.moveTo(nx - 13, -33); g.quadraticCurveTo(nx - 7, -27, nx, -37); g.quadraticCurveTo(nx + 9, -26, nx + 19, -40); }
      else if (m === 'wobbly') { g.moveTo(nx - 15, -30); g.bezierCurveTo(nx - 10, -36, nx - 5, -26, nx, -33); g.bezierCurveTo(nx + 5, -26, nx + 10, -36, nx + 15, -30); }
      else { g.moveTo(nx - 14, -34); g.quadraticCurveTo(nx - 7, -27, nx, -37); g.quadraticCurveTo(nx + 7, -27, nx + 14, -34); }
      g.stroke();
    }
    g.strokeStyle = 'rgba(255,248,235,.95)'; g.lineWidth = 3.6; g.lineCap = 'round'; const wt = s.whisk || 0;
    for (const sx of [-1, 1]) for (const [dy, a] of [[-48, -.25], [-40, 0], [-32, .22]]) { g.beginPath(); g.moveTo(nx + sx * 36, dy - tw); g.lineTo(nx + sx * (sx * tr > 0 ? 74 : 96), dy + a * 60 - tw * 2 - (sx > 0 ? wt * 10 : 0)); g.stroke(); }
    if (s.blush) { g.fillStyle = `rgba(240,110,110,${s.blush})`; ell(g, -52 + f, -58, 16, 9); g.fill(); ell(g, 52 + f, -58, 16, 9); g.fill(); }
  };
  CUR_RES = prev;
  return { O, OD, Wt, tr, f, tail, body, legF, head, ear, faceFn };
}
export function catFace(rig, t, o, val) {   // the face options shared by both cat rigs
  return { blink: val(o.blink, 0), lookX: val(o.lookX, -.6), lookY: val(o.lookY, .4), sniff: val(o.sniff, 0), brow: val(o.brow, 0), browL: val(o.browL, 0), browR: val(o.browR, 0), browTilt: val(o.browTilt, 0),
    eyes: val(o.eyes, 'open'), mouth: val(o.mouth, 'closed'), talk: val(o.talk, 0), wide: val(o.wide, 0), lid: val(o.lid, 0), sparkle: val(o.sparkle, 0), whisk: val(o.whisk, 0), blush: val(o.blush, 0) };
}
// ================= Puss, seated (three-quarter turn baked in: turn < 0 faces screen left) =================
export function makePuss({ res = 3, turn = -.5 } = {}) {
  const C = catSheets(res, turn), { tr, f } = C;
  const parts = [
    P('tail', C.tail, null, tr < 0 ? 70 : -70, -26, 1, { sx: tr < 0 ? 1 : -1 }),
    P('body', C.body, null, 0, 0, 2),
    P('legL', C.legF, 'body', -42 + f, -134, 3, { drop: 1 }), P('legR', C.legF, 'body', 42 + f, -134, 3, { drop: 1 }),
    P('earL', C.ear(), 'head', -66 + f * .5, -128, 4.5, { rot: -.12 }), P('earR', C.ear(), 'head', 66 + f * .5, -128, 4.4, { sx: -1, rot: .12 }),
    P('head', C.head, 'body', f * .4, -158, 5, { hook: C.faceFn, drop: 1 }),
  ];
  const rig = new Rig(parts, 600, 560, 300, 420, res); CUR_RES = 2;
  rig.height = 354;   // paws to ear tips, puppet units
  rig.pose = (t, o = {}) => {
    const T = rig.parts, val = (v, d) => typeof v === 'function' ? v(t) : (v ?? d);
    T.body.sy = 1 + .02 * Math.sin(t / 3.1 * TAU + 1);                      // belly breathes
    const hl = val(o.headLift, 0); T.head.rot = Math.sin(t * .5 + 2) * .02 + hl * .1 + val(o.headTilt, 0); T.head.jy = -158 - hl * 6 + val(o.headDown, 0) * 8;
    const el = val(o.earLag, 0); T.earL.rot = -.12 + el + Math.sin(t * .9) * .02; T.earR.rot = .12 + el * .8 + Math.sin(t * .9 + .4) * .02;
    if (o.earTwitch != null) { const u = (t - o.earTwitch) / .35; if (u > 0 && u < 1) T.earR.rot += Math.sin(u * Math.PI) * .25; }
    T.tail.rot = Math.sin(t * 2.1) * .1 + val(o.tailLag, 0) + val(o.tailUp, 0);
    // a front paw lifts (to wipe a whisker, to gesture): 0..1, plus a little wave
    const pl = val(o.pawLift, 0), pw = val(o.pawWave, 0); T.legR.rot = (tr < 0 ? 1 : -1) * (pl * 2.3 + pw * .25); T.legR.jy = -134 - pl * 10; T.legR.sy = 1 - pl * .25;
    const pl2 = val(o.pawLift2, 0); T.legL.rot = (tr < 0 ? 1 : -1) * pl2 * 2.1; T.legL.jy = -134 - pl2 * 10; T.legL.sy = 1 - pl2 * .25;
    T.head.face = catFace(rig, t, o, val);
    return rig.render();
  };
  return rig;
}
export const breathe = (t, seed = 0, period = 3.6) => 1 + .015 * Math.sin((t / period + seed) * TAU);
export function blinkAt(t, seed = 0, every = 4) { const n = Math.floor(t / every), r = (Math.sin((n + seed) * 91.7) * .5 + .5) * every * .7 + .6, local = t - n * every - r, dur = .22; if (local < 0 || local > dur) return 0; const u = local / dur; return u < .5 ? u * 2 : 2 - u * 2; }
