// Puss standing in his boots: the same head, ears, face and tail as the seated cat (so he looks identical in every shot),
// a standing body, arms that end in white paws, and legs in brown boots. Origin between the boots; y up is negative.
// turn < 0 faces screen left (as the seated cat), turn > 0 faces screen right.
import { paint } from '../engine.js';
import { PAL, rr, ell } from '../art.js';
import { Rig, ik, catSheets, catFace } from '../puppets.js';
import { TAU, clamp, ss } from '../lib.js';

const P = (n, sheet, parent, jx, jy, z, extra = {}) => ({ name: n, sheet, parent, jx, jy, z, ...extra });
export const BOOT = { leather: '#7a4626', cuff: '#a86c38', sole: '#3a2416', buckle: '#e8c25a' };
export function bootShape(g, w = 1) {   // a cavalier boot: a flared folded cuff, the shaft, the foot with a rounded toe pointing +x
  g.fillStyle = BOOT.leather; g.beginPath(); g.moveTo(-15, 4); g.bezierCurveTo(-16, 24, -16, 44, -15, 58); g.bezierCurveTo(-18, 68, -14, 76, -4, 77); g.bezierCurveTo(12, 79, 34, 78, 40, 71); g.bezierCurveTo(44, 64, 34, 58, 16, 57); g.bezierCurveTo(15, 40, 15, 22, 14, 4); g.closePath(); g.fill();
  g.fillStyle = BOOT.sole; g.beginPath(); g.moveTo(-15, 74); g.bezierCurveTo(-8, 80, 30, 81, 41, 72); g.lineTo(41, 76); g.bezierCurveTo(30, 84, -8, 84, -15, 78); g.closePath(); g.fill();
  g.fillStyle = BOOT.cuff; g.beginPath(); g.moveTo(-22, -6); g.bezierCurveTo(-10, -12, 10, -12, 22, -8); g.bezierCurveTo(20, 4, 18, 12, 15, 16); g.bezierCurveTo(4, 12, -6, 12, -16, 16); g.bezierCurveTo(-20, 10, -22, 2, -22, -6); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,230,190,.35)'; g.beginPath(); g.moveTo(-18, -4); g.quadraticCurveTo(0, -9, 18, -6); g.lineTo(17, -2); g.quadraticCurveTo(0, -5, -17, 0); g.fill();
  g.fillStyle = BOOT.buckle; rr(g, -4, 50, 9, 7, 2); g.fill();
  g.fillStyle = 'rgba(255,240,210,.28)'; g.beginPath(); g.ellipse(-6, 32, 3, 14, 0, 0, TAU); g.fill();
}
export function makePussStand({ res = 3, turn = -.5 } = {}) {
  const C = catSheets(res, turn), { O, OD, Wt, tr, f } = C, dir = tr < 0 ? -1 : 1;
  const sh = (w, h, ax, ay, fn, r = res, fin) => paint(w, h, fn, { ax, ay, res: r, fin });
  const body = sh(260, 260, 130, 220, g => {   // hips at (0,0), neck at (0,-150): a soft pear with a white chest
    g.fillStyle = O; g.beginPath(); g.moveTo(-40 + f * .5, -150); g.bezierCurveTo(-74, -132, -84, -70, -78, -20); g.bezierCurveTo(-74, 6, -40, 16, 0, 16); g.bezierCurveTo(40, 16, 74, 6, 78, -20); g.bezierCurveTo(84, -70, 74, -132, 40 + f * .5, -150); g.bezierCurveTo(20, -160, -20, -160, -40 + f * .5, -150); g.closePath(); g.fill();
    g.fillStyle = Wt; g.beginPath(); g.moveTo(-26 + f, -150); g.bezierCurveTo(-48 + f, -100, -44 + f, -30, -14 + f, 4); g.lineTo(14 + f, 4); g.bezierCurveTo(44 + f, -30, 48 + f, -100, 26 + f, -150); g.closePath(); g.fill();
    g.fillStyle = OD; for (const [x, y, a] of [[-66, -70, .4], [64, -96, -.5], [70, -50, -.3]]) { g.save(); g.translate(x, y); g.rotate(a); rr(g, -16, -5, 32, 10, 5); g.fill(); g.restore(); }
  });
  const upper = sh(50, 80, 25, 12, g => { g.fillStyle = O; g.beginPath(); g.moveTo(-14, 0); g.bezierCurveTo(-14, -12, 14, -12, 14, 0); g.bezierCurveTo(14, 18, 12, 34, 11, 44); g.bezierCurveTo(10, 54, -10, 54, -11, 44); g.bezierCurveTo(-12, 34, -14, 18, -14, 0); g.closePath(); g.fill(); g.fillStyle = OD; g.save(); g.rotate(.3); rr(g, -12, 18, 24, 7, 3); g.fill(); g.restore(); });
  const fore = sh(50, 80, 25, 12, g => { g.fillStyle = O; g.beginPath(); g.moveTo(-11, -2); g.bezierCurveTo(-11, -12, 11, -12, 11, -2); g.bezierCurveTo(11, 14, 10, 26, 10, 34); g.lineTo(-10, 34); g.bezierCurveTo(-10, 26, -11, 14, -11, -2); g.closePath(); g.fill(); });
  const paw = kind => sh(70, 70, 35, 12, g => {   // white paws: rest (soft mitten), open (toes spread, a wave), point (one toe out), clap (flat)
    g.fillStyle = Wt; g.beginPath();
    if (kind === 'open') { g.moveTo(-12, 0); g.bezierCurveTo(-16, 10, -18, 22, -12, 28); for (const [x, y] of [[-10, 34], [-3, 37], [4, 37], [11, 34]]) { g.quadraticCurveTo(x - 4, y + 3, x, y); g.quadraticCurveTo(x + 4, y + 3, x + 3, y - 4); } g.bezierCurveTo(18, 22, 16, 10, 12, 0); g.closePath(); g.fill(); g.fillStyle = PAL.pink; ell(g, 0, 22, 6, 5); g.fill(); for (const x of [-8, 0, 8]) { ell(g, x, 31, 2.6, 2.4); g.fill(); } }
    else if (kind === 'point') { g.moveTo(-12, 0); g.bezierCurveTo(-16, 12, -14, 26, -2, 28); g.bezierCurveTo(10, 28, 16, 14, 12, 0); g.closePath(); g.fill(); g.beginPath(); g.moveTo(-6, 22); g.bezierCurveTo(-7, 34, -5, 44, 0, 46); g.bezierCurveTo(5, 44, 6, 34, 5, 22); g.closePath(); g.fill(); }
    else { g.moveTo(-12, 0); g.bezierCurveTo(-16, 12, -16, 28, -4, 31); g.bezierCurveTo(8, 33, 16, 24, 13, 0); g.closePath(); g.fill(); g.strokeStyle = '#d8cbbb'; g.lineWidth = 1.6; for (const x of [-5, 3]) { g.beginPath(); g.moveTo(x, 22); g.lineTo(x, 31); g.stroke(); } }
  }, res + 1, { rim: .4, under: .2, side: .1 });
  const PAWS = { rest: paw('rest'), open: paw('open'), point: paw('point') };
  const thigh = sh(60, 80, 30, 12, g => { g.fillStyle = O; g.beginPath(); g.moveTo(-18, 0); g.bezierCurveTo(-20, -14, 20, -14, 18, 0); g.bezierCurveTo(18, 18, 15, 34, 13, 44); g.bezierCurveTo(10, 52, -10, 52, -13, 44); g.bezierCurveTo(-15, 34, -18, 18, -18, 0); g.closePath(); g.fill(); });
  const boot = sh(100, 110, 30, 12, g => bootShape(g), res + 1, { rim: .5, under: .3, side: .15 });
  const parts = [
    P('root', null, null, 0, 0, 0),
    P('tail', C.tail, 'body', -dir * 52, -14, .8, { sx: dir < 0 ? 1 : -1 }),
    P('thighB', thigh, 'body', dir * 16, -4, 1.1), P('bootB', boot, 'thighB', 0, 44, 1.0, { sx: dir * 1.22, sy: 1.22 }),
    P('uArmB', upper, 'body', -dir * 34, -132, 1.3), P('fArmB', fore, 'uArmB', 0, 44, 1.25), P('pawB', PAWS.rest, 'fArmB', 0, 32, 1.2, { sx: 1.3, sy: 1.3 }),
    P('body', body, 'root', 0, -150, 2),
    P('thighF', thigh, 'body', -dir * 22, -2, 2.6, { drop: 1 }), P('bootF', boot, 'thighF', 0, 44, 2.5, { sx: dir * 1.22, sy: 1.22, drop: 1 }),
    P('head', C.head, 'body', f * .3, -146, 5, { hook: C.faceFn, drop: 1 }),
    P('earL', C.ear(), 'head', -66 + f * .5, -128, 4.5, { rot: -.12 }), P('earR', C.ear(), 'head', 66 + f * .5, -128, 4.4, { sx: -1, rot: .12 }),
    P('uArmF', upper, 'body', dir * 38, -130, 6, { drop: 1 }), P('fArmF', fore, 'uArmF', 0, 44, 6.1, { drop: 1 }), P('pawF', PAWS.rest, 'fArmF', 0, 32, 6.2, { drop: 1, sx: 1.3, sy: 1.3 }),
    P('propF', null, 'pawF', 0, 16, 6.15, { drop: 1 }), P('propB', null, 'pawB', 0, 16, 1.15),
  ];
  const rig = new Rig(parts, 640, 760, 320, 600, res);
  rig.height = 500; rig.dir = dir;
  rig.pose = (t, o = {}) => {
    const T = rig.parts, v = (x, d) => typeof x === 'function' ? x(t) : (x ?? d);
    const ph = o.walk != null ? v(o.walk) : null, run = v(o.run, 0), strut = v(o.strut, 0);
    const bob = ph != null ? Math.abs(Math.sin(ph * Math.PI)) * (6 + strut * 6 + run * 4) : 0;
    const br = .02 * Math.sin(t / 3.1 * TAU + 1), puff = v(o.puff, 0);
    T.body.sy = 1 + br + v(o.chest, 0) * .04; T.body.sx = 1 + puff * .12 + v(o.chest, 0) * .03; T.body.jy = -150 - bob - v(o.lift, 0) + v(o.crouch, 0) * 30; T.body.jx = v(o.shift, 0);
    T.body.rot = dir * (v(o.lean, 0) + run * .22) + Math.sin(t * .6) * .006 + (o.shake ? Math.sin(t * 55) * .03 * v(o.shake, 0) : 0);
    const hl = v(o.headLift, 0); T.head.rot = Math.sin(t * .5 + 2) * .02 - dir * hl * .14 + v(o.headTilt, 0) + (o.nod ? v(o.nod, 0) * .12 : 0); T.head.jy = -146 + v(o.headDown, 0) * 8;
    T.head.sx = T.head.sy = 1 + puff * .06;
    const el = v(o.earLag, 0) + v(o.earsDown, 0) * .7; T.earL.rot = -.12 + el + Math.sin(t * .9) * .02; T.earR.rot = .12 - v(o.earsDown, 0) * .7 + el * .8 + Math.sin(t * .9 + .4) * .02;
    if (o.earPerk) { const k = v(o.earPerk, 0); T.earL.rot -= .2 * k; T.earR.rot += .2 * k; T.earL.sy = T.earR.sy = 1 + .15 * k; }
    // the tail: proud = straight up; sways on a 2.5 s loop
    const up = clamp(v(o.tailUp, .4) + strut * .6, 0, 1); T.tail.rot = dir * (.25 + up * .55) + Math.sin(t * 2.5) * .1 + puff * Math.sin(t * 40) * .05;
    T.tail.sx = (dir < 0 ? 1 : -1) * (1 + puff * .2); T.tail.sy = 1 + puff * .2;
    // legs: a walk / strut / run cycle (one step = 1 phase unit), or standing
    if (ph != null) {
      const amp = .42 + strut * .12 + run * .25, a = Math.sin(ph * Math.PI);
      T.thighF.rot = -dir * amp * a; T.thighB.rot = dir * amp * a;
      T.bootF.rot = dir * .4 * Math.max(0, Math.sin(ph * Math.PI - .8)) * (1 + run * .6); T.bootB.rot = dir * .4 * Math.max(0, -Math.sin(ph * Math.PI - .8)) * (1 + run * .6);
    } else { T.thighF.rot = v(o.legF, -dir * .06); T.thighB.rot = v(o.legB, dir * .06); T.bootF.rot = v(o.bootFRot, 0); T.bootB.rot = v(o.bootBRot, 0); }
    if (v(o.crouch, 0)) { const c = v(o.crouch, 0); T.thighF.rot -= dir * c * .9; T.bootF.rot += dir * c * 1.1; T.thighB.rot -= dir * c * .7; T.bootB.rot += dir * c * 1.0; }
    // arms: o.armF / o.armB: { x, y } paw target in body space or { a, e } angles; o.pawF / o.pawB: rest | open | point
    const arm = (u, fa, pw, side, spec, kind, dflt) => {
      const s = v(spec, null) || dflt;
      if (s.x != null) { const [a1, a2] = ik(s.x - T[u].jx, s.y - T[u].jy, 44, 34, s.bend ?? side); T[u].rot = a1; T[fa].rot = a2; }
      else { T[u].rot = s.a; T[fa].rot = s.e; }
      T[pw].sheet = PAWS[v(kind, 'rest')] || PAWS.rest; T[pw].rot = s.h || 0;
    };
    const sw = ph != null ? Math.sin(ph * Math.PI) * (.4 + run * .4) : 0;
    arm('uArmF', 'fArmF', 'pawF', dir, o.armF, o.pawF, { a: dir * (.15 - sw) + Math.sin(t * .8) * .02, e: dir * -.25 });
    arm('uArmB', 'fArmB', 'pawB', -dir, o.armB, o.pawB, { a: -dir * (.12 - sw), e: -dir * -.2 });
    for (const [k, n] of [['propF', o.propF], ['propB', o.propB]]) { const pr = v(n, null); T[k].sheet = pr ? pr.sheet : null; if (pr) { T[k].jx = pr.x || 0; T[k].jy = 16 + (pr.y || 0); T[k].rot = pr.rot || 0; T[k].sx = T[k].sy = (pr.s || 1) / 1.3; } }
    if (o.bow) { const b = v(o.bow, 0); T.body.rot += dir * b * .9; T.body.jy += b * 18; T.head.rot += dir * b * .25; }
    T.head.face = catFace(rig, t, o, v);
    return rig.render();
  };
  return rig;
}
