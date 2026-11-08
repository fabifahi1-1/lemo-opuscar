// Characters: painted cut-out rigs. Parts are painted once into sprites (watercolour fills from paint.js);
// faces (eyes, brows, mouth, cheeks, whiskers) and tails are painted live every frame so they can blink, emote and speak.
// Local units: feet at (0,0), y up is negative. Facing right; mirrored for facing left.

const CH = {};            // built characters by id
const SKIN = { light: '#f2c9a5', rosy: '#f0c8a8', tan: '#d9a27a', brown: '#a8714f', deep: '#7a4e36' };
const INKC = '#2f2420', INKL = '#6b4a36';

// ---------- expressions ----------
// eo: eye openness, pu: pupil scale, by: brow lift, ba: brow angle (+ = inner end up = worried/sad, - = angry/proud),
// sm: smile (-1 frown .. 1 big smile), mo: base mouth open, bl: blush, arc: eyes as happy arcs, look: [x,y] gaze
const EXPR = {
  neutral:   { eo: 1, pu: 1, by: 0, ba: 0, sm: .25, mo: 0, bl: .25 },
  smile:     { eo: .95, pu: 1, by: .1, ba: 0, sm: .8, mo: 0, bl: .45 },
  happy:     { eo: .9, pu: 1.05, by: .25, ba: .05, sm: 1, mo: .35, bl: .55 },
  laugh:     { eo: .2, pu: 1, by: .4, ba: .1, sm: 1, mo: .8, bl: .7, arc: 1 },
  proud:     { eo: .62, pu: 1, by: .15, ba: -.35, sm: .65, mo: 0, bl: .3, smirk: 1 },
  cheeky:    { eo: .8, pu: 1, by: .2, ba: -.2, sm: .7, mo: 0, bl: .35, smirk: 1, oneBrow: 1 },
  surprised: { eo: 1.25, pu: .8, by: .75, ba: .2, sm: 0, mo: .75, bl: .3, oh: 1 },
  scared:    { eo: 1.3, pu: .55, by: .8, ba: .7, sm: -.4, mo: .55, bl: .1, oh: 1 },
  sad:       { eo: .8, pu: 1.1, by: .2, ba: .75, sm: -.6, mo: 0, bl: .15, look: [0, .3] },
  worried:   { eo: .95, pu: .95, by: .35, ba: .6, sm: -.25, mo: 0, bl: .2 },
  shy:       { eo: .55, pu: 1, by: .2, ba: .3, sm: .6, mo: 0, bl: 1, look: [0, .45] },
  think:     { eo: .85, pu: 1, by: .35, ba: -.1, sm: .1, mo: 0, bl: .2, look: [.4, -.5], oneBrow: 1 },
  angry:     { eo: .8, pu: .9, by: -.1, ba: -.7, sm: -.5, mo: 0, bl: .2 },
  shiver:    { eo: .9, pu: .9, by: .5, ba: .7, sm: -.5, mo: .2, bl: .1 },
  sleep:     { eo: 0, pu: 1, by: 0, ba: .1, sm: .45, mo: 0, bl: .45, arc: -1 },
  eat:       { eo: .3, pu: 1, by: .3, ba: .1, sm: .7, mo: .3, bl: .5, arc: 1 },
  determined:{ eo: .85, pu: 1, by: 0, ba: -.45, sm: .45, mo: 0, bl: .3 },
};
const EKEYS = ['eo', 'pu', 'by', 'ba', 'sm', 'mo', 'bl', 'arc', 'smirk', 'oneBrow', 'oh'];
function exprMix(a, b, k) { const A = EXPR[a] || EXPR.neutral, B = EXPR[b] || EXPR.neutral, o = {};
  for (const key of EKEYS) o[key] = lerp(A[key] || 0, B[key] || 0, k);
  const la = A.look || [0, 0], lb = B.look || [0, 0]; o.look = [lerp(la[0], lb[0], k), lerp(la[1], lb[1], k)]; return o; }

// ---------- arm poses: [back shoulder, back elbow, front shoulder, front elbow] (radians, 0 = straight down, + = forward/up toward facing)
const POSE = {
  down:   [.1, .08, .1, .14],
  relax:  [.18, .2, .2, .3],
  hips:   [-.55, 1.9, .5, -1.9],
  point:  [.15, -.2, 1.55, -.05],
  pointUp:[.15, -.2, 2.55, -.1],
  wave:   [.15, -.2, 2.7, .55],
  cheer:  [2.7, .3, 2.7, -.3],
  offer:  [1.2, .45, 1.25, .35],
  hold:   [.9, .9, .95, .85],
  holdUp: [2.2, .5, 2.3, .4],
  cover:  [2.15, 2.25, 2.25, 2.2],
  chin:   [.15, -.2, .55, 2.35],
  shrug:  [-.6, 1.7, .6, -1.7],
  eat:    [.4, 1.6, .9, 2.0],
  bow:    [.5, .3, 1.2, .9],
  run:    [-.9, 1.3, .9, 1.4],
  climb:  [2.3, -.4, 2.0, .5],
  push:   [1.4, .1, 1.45, .05],
  hug:    [1.1, 1.3, 1.15, 1.25],
  scared: [1.6, 1.9, 1.7, 1.8],
  tray:   [1.15, 1.25, 1.2, 1.2],
  ring:   [.1, -.2, 2.3, 1.1],
  scroll: [1.0, 1.0, 1.05, .95],
  paws:   [.9, 1.4, 1.0, 1.35],
  reach:  [.3, -.1, 1.9, .1],
};

// ---------- painting helpers for parts ----------
function capsulePts(x0, y0, x1, y1, r0, r1, n = 10) {   // a limb from (x0,y0) radius r0 to (x1,y1) radius r1
  const a = Math.atan2(y1 - y0, x1 - x0), pts = [];
  for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + i / n * Math.PI; pts.push([x1 + Math.cos(a + t) * r1, y1 + Math.sin(a + t) * r1]); }
  for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + i / n * Math.PI; pts.push([x0 + Math.cos(a + t) * r0, y0 + Math.sin(a + t) * r0]); }
  return pts;
}
const P = (pts, col, o) => (c) => paint(c, pts, col, Object.assign({ under: true, wob: 1.2, line: 1.6, edge: .5, bloom: .45, gran: .5 }, o || {}));

// Paint a part sprite: list of [pts, col, opts] or functions(c). Bounds computed from all polygons.
function partSprite(R, items, pad = 8) {
  let b = [1e9, 1e9, -1e9, -1e9];
  for (const it of items) if (Array.isArray(it)) { const q = boundsOf(it[0]); b = [Math.min(b[0], q[0]), Math.min(b[1], q[1]), Math.max(b[2], q[2]), Math.max(b[3], q[3])]; }
  else if (it.b) b = [Math.min(b[0], it.b[0]), Math.min(b[1], it.b[1]), Math.max(b[2], it.b[2]), Math.max(b[3], it.b[3])];
  return canvasSprite(b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad, R, c => {
    for (const it of items) { if (Array.isArray(it)) paint(c, it[0], it[1], Object.assign({ under: true, wob: 1.2, line: 1.6, edge: .5, bloom: .45, gran: .5 }, it[2] || {})); else it.f(c); }
  });
}
const F = (f, b) => ({ f, b });   // a free painting function with bounds

// ---------- the humanoid builder ----------
// spec: { id, H, R, skin, hair:{style,col}, top:{kind,col,col2,trim}, legs:{col}, shoes:{col,shine}, head:{r,rx,ry}, ... }
function buildHuman(sp) {
  const R = sp.R || 2.2, g = sp.geo;
  const parts = {};
  withSeed(sp.seed || hashStr(sp.id), () => {
    const skin = sp.skin, skinD = shade(skin, .18);
    // legs (pivot at hip joint 0,0; leg points down to y = g.leg)
    const legW = g.legW, legL = g.leg, shoeL = g.shoeL || legW * 1.9, shoeH = g.shoeH || legW * .8;
    const legItems = (front) => {
      const it = [];
      if (sp.legs.bare) it.push([capsulePts(0, 0, 0, legL - shoeH * .6, legW * .5, legW * .42), skin, { line: 1.2 }]);
      else it.push([capsulePts(0, -4, 0, legL - shoeH * .55, legW * .62, legW * .55), sp.legs.col, { line: 1.6 }]);
      if (sp.legs.patch && front) it.push([ellipsePts(legW * .05, legL * .55, legW * .36, legW * .3, .3, 16), sp.legs.patch, { line: 1.1, bloom: .2 }]);
      if (sp.legs.stripe) it.push(F(c => { for (let k = 1; k < 4; k++) brush(c, qcurve(-legW * .55, legL * k / 4.5, legW * .55, legL * k / 4.5 + 2, 1, 5), 3, sp.legs.stripe, { prof: 'even', nb: 0, a: .5 }); }, [-legW, 0, legW, legL]));
      if (!sp.shoes.none) {
        const sx = -legW * .45, sy = legL - shoeH;
        const shoe = catmull([[sx, sy + shoeH * .25], [sx + legW * .55, sy - shoeH * .12], [sx + shoeL * .75, sy + shoeH * .3], [sx + shoeL, sy + shoeH * .78], [sx + shoeL * .95, sy + shoeH], [sx, sy + shoeH], [sx - legW * .1, sy + shoeH * .6]], true, 5);
        it.push([shoe, sp.shoes.col, { line: 1.6, bloom: sp.shoes.shine ? .9 : .4 }]);
        if (sp.shoes.shine) it.push(F(c => brush(c, qcurve(sx + shoeL * .45, sy + shoeH * .35, sx + shoeL * .8, sy + shoeH * .55, -2, 6), 3.2, '#fff8ec', { prof: 'leaf', nb: 0, a: .85 }), [sx, sy, sx + shoeL, sy + shoeH]));
        if (sp.shoes.fluffy) it.push(F(c => { for (let k = 0; k < 14; k++) { const u = k / 13; softBlob(c, sx + shoeL * (.08 + u * .62), sy + shoeH * (.22 - Math.sin(u * Math.PI) * .12), shoeH * .2, shoeH * .17, pick(['#fbd6e6', '#f8c0d8', '#ffe4ee']), .85, .6); }
          for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; softBlob(c, sx + shoeL * .72 + Math.cos(a) * shoeH * .16, sy + shoeH * .05 + Math.sin(a) * shoeH * .14, shoeH * .14, shoeH * .14, pick(['#fbd6e6', '#ffffff', '#f8c0d8']), .9, .6); } }, [sx - 10, sy - 30, sx + shoeL + 10, sy + shoeH + 10]));
      } else {   // bare foot
        it.push([ellipsePts(legW * .35, legL - legW * .25, legW * .8, legW * .38, 0, 20), skin, { line: 1.2 }]);
      }
      return it;
    };
    parts.legF = partSprite(R, sp.legItems ? sp.legItems(true, g) : legItems(true));
    parts.legB = partSprite(R, sp.legItems ? sp.legItems(false, g) : legItems(false));
    // torso (pivot at hip centre 0,0; shoulders at y = -g.torso)
    parts.torso = partSprite(R, sp.torso(g));
    // arms: upper (pivot shoulder, pointing down), fore (pivot elbow, with hand)
    const armW = g.armW, sleeve = sp.top.sleeve || sp.top.col;
    parts.upper = partSprite(R, [[capsulePts(0, 0, 0, g.upper, armW * .62, armW * .52), sleeve, { line: 1.4 }]].concat(sp.top.cuffUpper ? [] : []));
    const foreItems = [];
    if (sp.top.bareFore) foreItems.push([capsulePts(0, 0, 0, g.fore, armW * .45, armW * .4), skin, { line: 1.2 }]);
    else foreItems.push([capsulePts(0, 0, 0, g.fore, armW * .54, armW * .5), sp.top.foreCol || sleeve, { line: 1.4 }]);
    if (sp.top.cuff) foreItems.push([capsulePts(0, g.fore - armW * .25, 0, g.fore + armW * .1, armW * .6, armW * .6, 6), sp.top.cuff, { line: 1.2 }]);
    const hr = g.hand || armW * .62;
    foreItems.push([ellipsePts(0, g.fore + hr * .7, hr * .78, hr * .92, 0, 22), sp.gloves || skin, { line: 1.2, bloom: .3 }]);
    foreItems.push([ellipsePts(hr * .5, g.fore + hr * .45, hr * .3, hr * .42, -.5, 12), sp.gloves || skin, { line: 1, bloom: 0 }]);   // thumb
    parts.fore = partSprite(R, foreItems);
    // head (pivot neck at 0,0; head centre at y = -g.neck - ry)
    const hd = g.head, hx = 0, hy = -g.neck - hd.ry;
    parts.headY = hy;
    parts.neck = partSprite(R, [[capsulePts(0, 6, 0, -g.neck - 4, hd.rx * .28, hd.rx * .3, 6), skinD, { line: 0, bloom: 0 }]]);
    if (sp.hairBack) parts.hairBack = partSprite(R, sp.hairBack(hx, hy, hd));
    const headItems = [];
    if (sp.ears !== false) for (const s of [-1, 1]) headItems.push([ellipsePts(hx + s * hd.rx * .95, hy + hd.ry * .08, hd.rx * .2, hd.ry * .26, 0, 16), skin, { line: 1.3 }]);
    headItems.push([catmull([[hx, hy - hd.ry], [hx + hd.rx * .9, hy - hd.ry * .62], [hx + hd.rx, hy + hd.ry * .1], [hx + hd.rx * .7, hy + hd.ry * .75], [hx, hy + hd.ry * (hd.chin || 1)], [hx - hd.rx * .7, hy + hd.ry * .75], [hx - hd.rx, hy + hd.ry * .1], [hx - hd.rx * .9, hy - hd.ry * .62]], true, 6), skin, { line: 1.7, bloom: .6, shadowSide: .3 }]);
    if (sp.freckles) headItems.push(F(c => { for (const s of [-1, 1]) for (let k = 0; k < 5; k++) softBlob(c, hx + s * hd.rx * rnd(.3, .62), hy + hd.ry * rnd(.18, .38), 1.8, 1.8, '#a8603a', .55, .6); }, [hx - hd.rx, hy - hd.ry, hx + hd.rx, hy + hd.ry]));
    if (sp.headExtra) headItems.push(...sp.headExtra(hx, hy, hd));
    parts.head = partSprite(R, headItems);
    if (sp.hairFront) parts.hairFront = partSprite(R, sp.hairFront(hx, hy, hd));
    if (sp.hat) parts.hat = partSprite(R, sp.hat(hx, hy, hd));
    if (sp.beard) parts.beard = partSprite(R, sp.beard(hx, hy, hd));
    if (sp.extra) for (const [k, fn] of Object.entries(sp.extra)) parts[k] = partSprite(R, fn(g));
  });
  return { id: sp.id, kind: 'human', sp, g, parts };
}
function hashStr(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }

// ---------- live face ----------
// fc: { eyeR, eyeX, eyeY, mouthY, mouthW, style:'dot'|'iris', iris, brow, browW, nose:'dot'|'cat'|'big'|'none', blushCol }
function drawFace(c, ch, hx, hy, hd, E, st, t) {
  const fc = ch.sp.face, turn = st.turn || 0, tx = turn * hd.rx * .2;
  const ex = fc.eyeX * hd.rx, ey = hy + fc.eyeY * hd.ry, er = fc.eyeR * hd.rx;
  const blink = st.blink || 0, look = [E.look[0] + (st.look ? st.look[0] : 0), E.look[1] + (st.look ? st.look[1] : 0)];
  // cheeks
  if (E.bl > .02) for (const s of [-1, 1]) softBlob(c, hx + tx + s * hd.rx * .55, hy + hd.ry * .32, hd.rx * .2, hd.rx * .13, fc.blushCol || '#e8828a', .5 * E.bl, .3);
  // eyes
  for (const s of [-1, 1]) {
    const x = hx + tx * (s * turn > 0 ? 1.15 : .85) + s * ex * (1 - Math.abs(turn) * .12 * (s * turn < 0 ? 1 : -.3)), y = ey;
    const open = clamp(E.eo * (1 - blink));
    c.save();
    if (E.arc && Math.abs(E.arc) > .5 || open < .14) {   // closed / happy arc
      const up = E.arc < 0 ? -1 : 1;
      c.strokeStyle = INKC; c.lineWidth = er * .32; c.lineCap = 'round'; c.beginPath();
      c.moveTo(x - er * .9, y + er * .1 * up); c.quadraticCurveTo(x, y - er * .75 * up, x + er * .9, y + er * .1 * up); c.stroke();
    } else if (fc.style === 'iris') {
      const ry = er * 1.08 * open, rx = er * .92;
      c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fillStyle = '#fffaf0'; c.fill();
      c.save(); c.clip();
      const ix = x + look[0] * rx * .35 + turn * rx * .2, iy = y + look[1] * ry * .3;
      c.beginPath(); c.ellipse(ix, iy, rx * .78, er * .95, 0, 0, TAU); c.fillStyle = fc.iris; c.fill();
      c.beginPath(); c.ellipse(ix, iy, rx * .78, er * .95, 0, 0, TAU); c.fillStyle = rgba(shade(fc.iris, .35), .6); c.save(); c.clip(); c.fillRect(ix - rx, iy - er * .2, rx * 2, er * 2); c.restore();
      c.beginPath(); c.ellipse(ix, iy + er * .05, rx * .42 * E.pu * (fc.slit ? .55 : 1), er * .68 * E.pu, 0, 0, TAU); c.fillStyle = '#1e1a1c'; c.fill();
      c.beginPath(); c.arc(ix - rx * .28, iy - er * .35, er * .24, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
      c.beginPath(); c.arc(ix + rx * .25, iy + er * .25, er * .1, 0, TAU); c.fill();
      // upper lid shadow
      c.fillStyle = rgba(shade(fc.lidCol || '#e8873a', .2), .55); c.fillRect(x - rx, y - ry, rx * 2, ry * .32);
      c.restore();
      c.beginPath(); c.ellipse(x, y, rx, ry, 0, Math.PI * 1.02, Math.PI * 1.98); c.strokeStyle = INKC; c.lineWidth = er * .22; c.lineCap = 'round'; c.stroke();
    } else {   // 'dot' eyes: dark oval + highlights
      const rx = er * .78, ry = er * 1.05 * open;
      const ix = x + look[0] * er * .25 + turn * er * .15, iy = y + look[1] * er * .25;
      c.beginPath(); c.ellipse(ix, iy, rx * (E.pu < .8 ? .85 : 1), ry, 0, 0, TAU); c.fillStyle = '#2a201e'; c.fill();
      if (E.pu < .8 && fc.white !== false) { c.beginPath(); c.ellipse(ix, iy, rx * 1.35, ry * 1.25, 0, 0, TAU); c.fillStyle = '#fffaf0'; c.fill(); c.beginPath(); c.ellipse(ix, iy, rx * .55, ry * .6, 0, 0, TAU); c.fillStyle = '#2a201e'; c.fill(); }
      c.beginPath(); c.arc(ix - rx * .3, iy - ry * .38, er * .3, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
      c.beginPath(); c.arc(ix + rx * .3, iy + ry * .3, er * .12, 0, TAU); c.fill();
    }
    c.restore();
    // brows
    if (fc.brow !== false) {
      const by = y - er * (1.45 + E.by * .8) - (fc.browUp || 0) * er, bw = (fc.browW || 1) * er * 1.1;
      let ang = -E.ba * .5 * s;   // inner end up when ba>0
      let lift = 0; if (E.oneBrow && s * (st.face || 1) > 0) lift = er * .55;
      c.save(); c.translate(x, by - lift); c.rotate(-ang);
      c.strokeStyle = fc.browCol || INKC; c.lineWidth = er * (fc.browT || .34); c.lineCap = 'round';
      c.beginPath(); c.moveTo(-bw * s * -1 * -1 - bw, 0); c.moveTo(-bw, er * .1); c.quadraticCurveTo(0, -er * .22, bw, er * .1); c.stroke(); c.restore();
    }
  }
  // nose
  const nx = hx + tx * 1.25, ny = hy + (fc.noseY ?? .2) * hd.ry;
  if (fc.nose === 'cat') {
    c.beginPath(); c.moveTo(nx - hd.rx * .1, ny - hd.rx * .04); c.lineTo(nx + hd.rx * .1, ny - hd.rx * .04); c.lineTo(nx, ny + hd.rx * .07); c.closePath(); c.fillStyle = '#e9868f'; c.fill();
    c.strokeStyle = rgba('#a04a50', .8); c.lineWidth = 1.2; c.stroke();
  } else if (fc.nose === 'big') {
    softBlob(c, nx, ny, hd.rx * .2, hd.rx * .16, shade(ch.sp.skin, .25), .7, .7);
    c.beginPath(); c.ellipse(nx, ny, hd.rx * .17, hd.rx * .13, 0, 0, TAU); c.fillStyle = rgba(shade(ch.sp.skin, .12), .9); c.fill();
    c.beginPath(); c.arc(nx - hd.rx * .05, ny - hd.rx * .04, hd.rx * .04, 0, TAU); c.fillStyle = 'rgba(255,250,240,.7)'; c.fill();
  } else if (fc.nose !== 'none') {
    c.strokeStyle = rgba(shade(ch.sp.skin, .4), .8); c.lineWidth = hd.rx * .045; c.lineCap = 'round';
    c.beginPath(); c.moveTo(nx - hd.rx * .02, ny - hd.rx * .07); c.quadraticCurveTo(nx + hd.rx * .07 * (st.face || 1) * 0 + hd.rx * .06, ny + hd.rx * .02, nx - hd.rx * .03, ny + hd.rx * .05); c.stroke();
    if (fc.rosyNose) softBlob(c, nx, ny, hd.rx * .12, hd.rx * .1, '#e0707a', .55, .4);
  }
  // mouth
  const mx = hx + tx * 1.3, my = hy + fc.mouthY * hd.ry, mw = fc.mouthW * hd.rx;
  const open = clamp(Math.max(E.mo, st.talk || 0));
  drawMouth(c, mx, my, mw, E, open, fc, st);
  if (fc.whiskers) {
    c.save(); c.strokeStyle = rgba('#5a3a2a', .6); c.lineWidth = 1.1; c.lineCap = 'round';
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const yy = ny + hd.rx * (.06 + k * .07); c.beginPath(); c.moveTo(nx + s * hd.rx * .22, yy); c.quadraticCurveTo(nx + s * hd.rx * .6, yy - hd.rx * .05 + k * 2, nx + s * hd.rx * .95, yy - hd.rx * .02 + k * hd.rx * .08 + Math.sin(t * 2 + k) * 1.2); c.stroke(); }
    c.restore();
  }
}
function drawMouth(c, x, y, w, E, open, fc, st) {
  const sm = E.sm, smirk = E.smirk ? (st.face || 1) * .35 : 0;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  if (fc.cat) {   // cat: a little "w" under the nose, opening into a round mouth
    if (open > .08) {
      const h = w * (.25 + open * .75);
      c.beginPath(); c.ellipse(x, y + h * .35, w * (.32 + .1 * sm), h * .6, 0, 0, TAU); c.fillStyle = '#5a2228'; c.fill();
      c.beginPath(); c.ellipse(x, y + h * .65, w * .22, h * .25, 0, 0, TAU); c.fillStyle = '#e07a84'; c.fill();
    }
    c.strokeStyle = '#5a3a2a'; c.lineWidth = w * .09;
    c.beginPath(); c.moveTo(x, y - w * .15); c.lineTo(x, y);
    c.moveTo(x - w * .45, y - w * .05 * sm + smirk * w * .1); c.quadraticCurveTo(x - w * .22, y + w * (.18 + .1 * sm), x, y);
    c.quadraticCurveTo(x + w * .22, y + w * (.18 + .1 * sm), x + w * .45, y - w * .05 * sm - smirk * w * .2); c.stroke();
    c.restore(); return;
  }
  if (open > .08) {
    const h = w * (.12 + open * .55), up = sm * w * .12;
    if (E.oh && sm < .4) {   // round "oh"
      c.beginPath(); c.ellipse(x, y + h * .2, w * (.22 + open * .12), h * .55 + w * .06, 0, 0, TAU);
    } else {
      c.beginPath(); c.moveTo(x - w * .5, y - up + smirk * w * .15);
      c.quadraticCurveTo(x, y + up * .3 - w * .02, x + w * .5, y - up - smirk * w * .2);
      c.quadraticCurveTo(x + w * .2, y + h + up * .5, x, y + h + up * .6);
      c.quadraticCurveTo(x - w * .2, y + h + up * .5, x - w * .5, y - up + smirk * w * .15); c.closePath();
    }
    c.fillStyle = fc.mouthCol || '#6a2a2c'; c.fill();
    c.save(); c.clip(); c.beginPath(); c.ellipse(x, y + h * 1.0 + w * .1, w * .32, w * .22, 0, 0, TAU); c.fillStyle = '#e07a84'; c.fill();
    if (fc.teeth !== false) { c.fillStyle = '#fffaf0'; c.fillRect(x - w * .35, y - up - w * .08, w * .7, w * .1); }
    c.restore();
    if (fc.tusks) { c.fillStyle = '#f6eedc'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * w * .32, y + h * .6); c.lineTo(x + s * w * .42, y - w * .2); c.lineTo(x + s * w * .2, y + h * .5); c.closePath(); c.fill(); c.strokeStyle = rgba(INKC, .5); c.lineWidth = 1; c.stroke(); } }
    c.strokeStyle = rgba(INKC, .75); c.lineWidth = w * .045; c.stroke();
  } else {
    const up = sm * w * .22;
    c.strokeStyle = fc.lipCol || '#7a3a32'; c.lineWidth = w * .075;
    c.beginPath(); c.moveTo(x - w * .45, y - up * .6 + smirk * w * .2);
    c.quadraticCurveTo(x, y + up, x + w * .45, y - up * .6 - smirk * w * .25); c.stroke();
    if (fc.tusks) { c.fillStyle = '#f6eedc'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * w * .3, y + w * .02); c.lineTo(x + s * w * .38, y - w * .2); c.lineTo(x + s * w * .2, y + w * .03); c.closePath(); c.fill(); c.strokeStyle = rgba(INKC, .5); c.lineWidth = 1; c.stroke(); } }
  }
  c.restore();
}

// ---------- drawing a humanoid ----------
// st: { x, y, s, face(±1), turn, expr, expr2, ek, talk, blink, arms:[4], legA, legB, bob, lean, tilt, breath, alpha, hide:{...}, prop }
function drawHuman(c, ch, st, t) {
  const g = ch.g, pr = ch.parts, face = st.face || 1;
  c.save(); c.translate(st.x, st.y); c.scale((st.s || 1) * face * (st.sx || 1), (st.s || 1) * (st.sy || 1));
  if (st.alpha !== undefined && st.alpha < 1) c.globalAlpha = st.alpha;
  if (!st.noShadow) groundShadow(c, 0, 2, g.legW * 2.4 + (g.belly || 0) * .4, g.legW * .55, .2);
  const hipY = -g.leg + (st.bob || 0), A = st.arms || POSE.down;
  const lean = st.lean || 0, breath = st.breath || 0;
  const hip = [0, hipY];
  const legSpread = g.legSpread ?? g.legW * .45;
  if (ch.sp.tail) ch.sp.tail(c, g, hipY, t, st);
  // back leg, back arm
  drawPart(c, pr.legB, -legSpread * .3 + (g.legOff || 0), hipY, st.legB || 0, .9);
  c.save(); c.translate(0, hipY); c.rotate(lean);
  const sh = -g.torso * (1 + breath * .5);
  const shX = g.shoulder;
  drawArm(c, pr, g, -shX * .45, sh + g.armW * .4, A[0], A[1], .88, st.propB);
  c.restore();
  drawPart(c, pr.legF, legSpread * .5 + (g.legOff || 0), hipY, st.legF || 0, 1);
  if (pr.under) { drawSprite(c, pr.under, 0, hipY); }
  // torso (with lean, breathing)
  c.save(); c.translate(0, hipY); c.rotate(lean); c.scale(1, 1 + breath);
  drawSprite(c, pr.torso, 0, 0);
  if (pr.bag && !st.noBag) drawSprite(c, pr.bag, -g.hipW * .42, -2);
  c.restore();
  // head
  c.save(); c.translate(0, hipY); c.rotate(lean); c.translate(g.neckX || 0, sh * (1 + breath * .2));
  c.rotate((st.tilt || 0));
  drawSprite(c, pr.neck);
  const hd = g.head, hx = 0, hy = pr.headY;
  if (pr.hairBack) drawSprite(c, pr.hairBack);
  drawSprite(c, pr.head);
  if (pr.beard && !ch.sp.beardOver) drawSprite(c, pr.beard);
  const E = st.E || exprMix('neutral', 'neutral', 0);
  drawFace(c, ch, hx, hy, hd, E, st, t);
  if (pr.beard && ch.sp.beardOver) { drawSprite(c, pr.beard); const fc = ch.sp.face, open = clamp(Math.max(E.mo, st.talk || 0)); drawMouth(c, hx + (st.turn || 0) * hd.rx * .26, hy + fc.mouthY * hd.ry, fc.mouthW * hd.rx, E, open, fc, st); }
  if (pr.hairFront) drawSprite(c, pr.hairFront, (st.turn || 0) * hd.rx * .08, 0);
  if (pr.hat && !st.noHat) drawSprite(c, pr.hat, (st.turn || 0) * hd.rx * .06, 0);
  c.restore();
  // front arm on top
  c.save(); c.translate(0, hipY); c.rotate(lean);
  drawArm(c, pr, g, shX * .55, sh + g.armW * .4, A[2], A[3], 1, st.prop);
  c.restore();
  c.restore();
}
function drawPart(c, spr, x, y, rot, shadeK) {
  c.save(); c.translate(x, y); c.rotate(rot); drawSprite(c, spr); if (shadeK < 1) { /* back limbs slightly darker */ }
  c.restore();
}
function drawArm(c, pr, g, x, y, a1, a2, k, prop) {
  c.save(); c.translate(x, y); c.rotate(-a1);
  drawSprite(c, pr.upper);
  c.translate(0, g.upper); c.rotate(-a2);
  if (prop && prop.behind) drawProp(c, prop, g);
  drawSprite(c, pr.fore);
  if (prop && !prop.behind) drawProp(c, prop, g);
  c.restore();
}
// a prop held in the hand: drawn in hand coordinates (hand centre at 0, g.fore + hand*.7), rotated back upright by prop.rot
function drawProp(c, prop, g) {
  const spr = PROPS[prop.id]; if (!spr) return;
  c.save(); c.translate(prop.dx || 0, g.fore + (g.hand || g.armW * .62) * .7 + (prop.dy || 0)); c.rotate(prop.rot || 0); const s = prop.s || 1;
  drawSprite(c, spr, 0, 0, s); c.restore();
}

// ---------- quadrupeds ----------
// geo: bodyL, bodyH, legL, legW, neck:[x,y], head:{rx,ry}, tail
function buildBeast(sp) {
  const R = sp.R || 2, g = sp.geo, parts = {};
  withSeed(sp.seed || hashStr(sp.id), () => {
    const legItems = (back) => {
      const it = [[capsulePts(0, 0, 0, g.legL, g.legW * .55, g.legW * .45), back ? shade(sp.col, .12) : sp.col, { line: 1.4 }]];
      if (sp.hoof) it.push([ellipsePts(0, g.legL, g.legW * .55, g.legW * .35, 0, 14), sp.hoof, { line: 1.2 }]);
      if (sp.slippers) { const sx = -g.legW * .5, sy = g.legL - g.legW * .3; it.push(F(c => { for (let k = 0; k < 24; k++) softBlob(c, sx + rnd(0, g.legW * 2), sy + rnd(-g.legW * .2, g.legW * .6), g.legW * .4, g.legW * .35, pick(['#f4a6c6', '#f8c0d8', '#e88ab0']), .55, .5); }, [sx - 20, sy - 20, sx + g.legW * 2.4, sy + g.legW]));
        it.push([ellipsePts(g.legW * .5, g.legL + g.legW * .05, g.legW * 1.0, g.legW * .42, 0, 20), '#f4a6c6', { line: 1.2, bloom: .9, a: .6 }]); }
      return it;
    };
    parts.legF = partSprite(R, legItems(false)); parts.legB = partSprite(R, legItems(true));
    parts.body = partSprite(R, sp.body(g));
    parts.head = partSprite(R, sp.head(g));
    if (sp.mane) parts.mane = partSprite(R, sp.mane(g));
  });
  return { id: sp.id, kind: 'beast', sp, g, parts };
}
function drawBeast(c, ch, st, t) {
  const g = ch.g, pr = ch.parts, face = st.face || 1;
  c.save(); c.translate(st.x, st.y); c.scale((st.s || 1) * face, st.s || 1);
  if (st.alpha !== undefined && st.alpha < 1) c.globalAlpha = st.alpha;
  if (!st.noShadow) groundShadow(c, 0, 2, g.bodyL * .6, g.legW * .9, .22);
  const ph = st.walk || 0, sw = st.moving ? .45 : 0, bob = st.moving ? Math.abs(Math.sin(ph)) * g.legL * .08 : 0;
  const by = -g.legL - bob + (st.dy || 0);
  const lx = g.bodyL * .36;
  // far legs
  drawPart(c, pr.legB, -lx + g.legW * .4, by + g.legW * .2, Math.sin(ph + Math.PI) * sw, 1);
  drawPart(c, pr.legB, lx + g.legW * .4, by + g.legW * .2, Math.sin(ph) * sw, 1);
  // tail
  if (ch.sp.tail) withSeed(77, () => ch.sp.tail(c, g, by, t, st));
  drawSprite(c, pr.body, 0, by);
  if (pr.mane && ch.sp.maneBehind) drawSprite(c, pr.mane, g.neck[0], by + g.neck[1]);
  // head
  c.save(); c.translate(g.neck[0], by + g.neck[1]); c.rotate((st.tilt || 0) + (st.moving ? Math.sin(ph * 2) * .03 : 0));
  if (pr.mane && !ch.sp.maneBehind) drawSprite(c, pr.mane);
  drawSprite(c, pr.head);
  if (ch.sp.face) {
    const E = st.E || exprMix('neutral', 'neutral', 0);
    drawFace(c, ch, ch.sp.face.hx, ch.sp.face.hy, ch.sp.face.hd, E, st, t);
  }
  if (ch.sp.headTop) ch.sp.headTop(c, g, t, st);
  c.restore();
  // near legs
  drawPart(c, pr.legF, -lx, by + g.legW * .3, Math.sin(ph) * sw, 1);
  drawPart(c, pr.legF, lx, by + g.legW * .3, Math.sin(ph + Math.PI) * sw, 1);
  c.restore();
}

function drawChar(c, id, st, t) {
  const ch = CH[id]; if (!ch) return;
  if (st.clip) { c.save(); c.beginPath(); c.rect(st.clip[0], st.clip[1], st.clip[2] - st.clip[0], st.clip[3] - st.clip[1]); c.clip(); }
  if (st.clip) { drawChar(c, id, Object.assign({}, st, { clip: null }), t); c.restore(); return; }
  if (ch.kind === 'human') drawHuman(c, ch, st, t);
  else if (ch.kind === 'beast') drawBeast(c, ch, st, t);
  else if (ch.draw) ch.draw(c, ch, st, t);
}

// world position of a body part (for labels and effects): exact, from the same rig geometry used to draw
function partPos(id, st, part) {
  const ch = CH[id]; if (!ch) return [st.x, st.y];
  const s = st.s || 1, f = st.face || 1, W2 = (lx, ly) => [st.x + lx * s * f, st.y + ly * s];
  if (ch.kind === 'beast') { const g = ch.g, hx = g.neck[0], hy = -g.legL + g.neck[1];
    if (part === 'head' || part === 'face') return W2(hx + (ch.sp.face ? ch.sp.face.hx : 0), hy);
    if (part === 'eye') return W2(hx + ch.sp.face.hx + ch.sp.face.eyeX * ch.sp.face.hd.rx, hy + ch.sp.face.hy + ch.sp.face.eyeY * ch.sp.face.hd.ry);
    if (part === 'foot' || part === 'slipper') return W2(g.bodyL * .36 + g.legW * .5, -2);
    if (part === 'mane') return W2(hx - 40, hy - 40);
    return W2(0, -g.legL - g.bodyH * .5); }
  const g = ch.g, hipY = -g.leg + (st.bob || 0), sh = -g.torso, A = st.arms || POSE.down;
  const headC = [g.neckX || 0, hipY + sh - g.neck - g.head.ry];
  const fc = ch.sp.face;
  switch (part) {
    case 'head': case 'face': return W2(headC[0], headC[1]);
    case 'eye': return W2(headC[0] + fc.eyeX * g.head.rx, headC[1] + fc.eyeY * g.head.ry);
    case 'mouth': return W2(headC[0], headC[1] + fc.mouthY * g.head.ry);
    case 'beard': return W2(headC[0], headC[1] + g.head.ry * 1.9);
    case 'crown': case 'hat': return W2(headC[0], headC[1] - g.head.ry * 1.15);
    case 'cheek': return W2(headC[0] + g.head.rx * .55, headC[1] + g.head.ry * .32);
    case 'torso': case 'jacket': return W2(0, hipY + sh * .55);
    case 'leg': case 'pants': return W2((g.legSpread ?? g.legW * .45) * .5, hipY * .5);
    case 'foot': case 'shoe': case 'boot': return W2((g.legSpread ?? g.legW * .45) * .5 + g.legW * .55, -g.legW * .35);
    case 'bag': return W2(-(g.hipW || 30) * .42, hipY + 4);
    case 'tail': return W2(-62, hipY - 52);
    case 'hand': case 'paw': default: {
      const sx = g.shoulder * .55, sy = hipY + sh + g.armW * .4, L2 = g.fore + (g.hand || g.armW * .62) * .7;
      const ex = sx + g.upper * Math.sin(A[2]), ey = sy + g.upper * Math.cos(A[2]);
      return W2(ex + L2 * Math.sin(A[2] + A[3]), ey + L2 * Math.cos(A[2] + A[3]));
    }
  }
}
// the royal carriage: horse, coach, rolling wheels, passengers in the window
function buildCarriage() {
  if (CH.carriage) return;
  buildCast(['horse']);
  withSeed(808, () => {
    const body = canvasSprite(-200, -300, 260, 10, 2, c => carriageBody(c, 0, 0, 1.3));
    CH.carriage = { id: 'carriage', kind: 'carriage', body, wheelB: wheelSprite(62), wheelS: wheelSprite(46), g: { leg: 0, head: { ry: 0 } }, draw: drawCarriage };
  });
}
const WIN = { x: 0, y: -30 - 247 * .64, rx: 90, ry: 52 };
function drawCarriage(c, ch, st, t) {
  const f = st.face || 1, s = st.s || 1;
  c.save(); c.translate(st.x, st.y); c.scale(s * f, s);
  groundShadow(c, 120, 4, 330, 20, .22);
  // horse in front
  const d = Math.abs(st.x - (st.x0 ?? st.x)) + (st.dist || 0);
  drawBeast(c, CH.horse, { x: 330, y: 0, s: .95, face: 1, walk: d / 110 * Math.PI, moving: !!st.walking, E: exprMix('happy', 'happy', 0), blink: st.blink, tilt: 0 }, t);
  brush ? 0 : 0;
  c.strokeStyle = '#6a4a30'; c.lineWidth = 6; c.beginPath(); c.moveTo(150, -110); c.lineTo(290, -96); c.stroke();
  // back wheel
  c.save(); c.translate(-110, -46); c.rotate(d / 62); drawSprite(c, ch.wheelB); c.restore();
  drawSprite(c, ch.body, 0, -30);
  // passengers in the window
  const pass = st.pass || [];
  if (pass.length) {
    c.save(); c.beginPath(); c.ellipse(WIN.x, WIN.y, WIN.rx * 1.3, WIN.ry * 1.3, 0, 0, TAU); c.clip();
    c.fillStyle = '#3a2848'; c.fillRect(-150, -300, 300, 200);
    pass.forEach((p, i) => { const pc = CH[p.id]; if (!pc) return; const ps = p.s || .62, hy = (pc.g.leg + pc.g.torso + pc.g.neck + pc.g.head.ry) * ps;
      const pst = Object.assign({ x: (p.dx || 0), y: WIN.y + hy + (p.dy || 8), s: ps, face: p.face || 1, noShadow: true, arms: POSE[p.pose || 'down'], E: exprMix(p.expr || 'smile', p.expr || 'smile', 0), blink: p.blink ?? st.blink, tilt: .03 * Math.sin(t * .8 + i * 2) }, p);
      pst.talk = talkAt(p.id, undefined, t); pst.E = exprMix(p.expr || 'smile', p.expr || 'smile', 0);
      drawChar(c, p.id, pst, t); });
    c.restore();
    c.beginPath(); c.ellipse(WIN.x, WIN.y, WIN.rx * 1.3, WIN.ry * 1.3, 0, 0, TAU); c.strokeStyle = '#a8843a'; c.lineWidth = 8; c.stroke();
  }
  c.save(); c.translate(130, -40); c.rotate(d / 46); drawSprite(c, ch.wheelS); c.restore();
  c.save(); c.translate(-110, -46); c.globalAlpha = .0; c.restore();
  c.restore();
}
