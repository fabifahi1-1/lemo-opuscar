// Prop painters. Each paints into context c with its base (ground contact) at (x, y), scale s; y grows downward.
// All consume the RNG: call inside withSeed (build time).
const PROPS = {};   // sprites for held props / word-card objects, by id (built in buildProps)

// ---------- nature ----------
function treeRound(c, x, y, s = 1, o = {}) {
  const h = (o.h || 260) * s, greens = o.greens || ['#6f9a3a', '#86a85a', '#4e7a44', '#9cc25a'], trunk = o.trunk || '#7a5a3a';
  const tr = mk(qcurve(x, y + 4, x + rnd(-8, 8) * s, y - h * .55, rnd(-10, 10) * s, 10), 26 * s, trunk, { prof: 'trunk', nb: 5 });
  drawS(c, tr); drawS(c, edgeOf(tr, 1, 3 * s, shade(trunk, .4), .7));
  for (let k = 0; k < 3; k++) drawS(c, mk(polar(x, y - h * (.35 + k * .08), -Math.PI / 2 + (k - 1) * .7, h * .25, rnd(-8, 8), 8), 8 * s, trunk, { prof: 'tip', nb: 3 }));
  const cx = x, cy = y - h * .68, R = h * .42 * (o.wide || 1);
  // canopy: dark underside wash, mid clumps, light top
  paint(c, ellipsePts(cx, cy + R * .1, R * 1.05, R * .82, 0, 40), greens[2], { wob: R * .12, freq: .25, a: .55, edge: .4, bloom: .5, gran: .5, line: 0, under: false });
  clump(c._S = [], cx, cy, R * .85, Math.round(60 * s * (o.dense || 1)), greens, { sx: 1.2, sy: .85, l0: 14 * s, l1: 30 * s, w0: 10 * s, w1: 20 * s, a0: .55, a1: .85 });
  drawList(c, c._S);
  clump(c._S = [], cx - R * .2, cy - R * .35, R * .45, Math.round(22 * s), [greens[3] || greens[1], '#b8d47a'], { l0: 10 * s, l1: 22 * s, w0: 8 * s, w1: 14 * s, a0: .45, a1: .7 });
  drawList(c, c._S);
  if (o.fruit) for (let k = 0; k < (o.nf || 16); k++) { const a = rnd(0, TAU), r = Math.sqrt(rnd()) * R * .85, fx = cx + Math.cos(a) * r * 1.15, fy = cy + Math.sin(a) * r * .8;
    paint(c, ellipsePts(fx, fy, 6.5 * s, 6 * s, 0, 12), o.fruit, { under: true, wob: .5, line: 1, bloom: .9, gran: .3, edge: .4 }); }
  if (o.blossom) for (let k = 0; k < 30; k++) { const a = rnd(0, TAU), r = Math.sqrt(rnd()) * R; softBlob(c, cx + Math.cos(a) * r * 1.1, cy + Math.sin(a) * r * .8, 4 * s, 4 * s, pick(o.blossom), .8, .6); }
}
function treePine(c, x, y, s = 1, o = {}) {
  const h = (o.h || 300) * s, cols = o.cols || ['#2f5a3a', '#3e6a44', '#4e7a50'];
  drawS(c, mk(qcurve(x, y + 2, x, y - h * .9, 0, 6), 12 * s, '#5a4030', { prof: 'trunk', nb: 3 }));
  for (let k = 0; k < 7; k++) {
    const yy = y - h * (.18 + k * .11), w = h * .32 * (1 - k * .12);
    paint(c, [[x - w, yy], [x, yy - h * .2], [x + w, yy]], pick(cols), { wob: 4 * s, freq: .5, a: .78, line: 0, edge: .5, bloom: .3, gran: .5 });
  }
}
function treeWillow(c, x, y, s = 1) {
  const h = 280 * s;
  drawS(c, mk(qcurve(x, y + 2, x + 10 * s, y - h * .6, -12 * s, 8), 24 * s, '#6a5040', { prof: 'trunk', nb: 4 }));
  for (let k = 0; k < 46; k++) { const a = rnd(-Math.PI * .95, -Math.PI * .05), r = rnd(.2, 1) * h * .38, sx = x + 10 * s + Math.cos(a) * r * 1.2, sy = y - h * .66 + Math.sin(a) * r * .55;
    drawS(c, mk(qcurve(sx, sy, sx + rnd(-10, 10) * s, sy + rnd(.25, .5) * h, rnd(-12, 12) * s, 8), rnd(5, 9) * s, pick(['#7a9a4a', '#8eae5a', '#5f8a42', '#a8c070']), { prof: 'tip', nb: 2, a: rnd(.5, .8) })); }
}
function bush(c, x, y, s = 1, o = {}) {
  const greens = o.greens || ['#4e7a44', '#6f9a3a', '#86a85a', '#3e6a3a'], R = (o.r || 70) * s;
  paint(c, ellipsePts(x, y - R * .55, R * 1.15, R * .7, 0, 36), greens[0], { wob: R * .15, freq: .3, a: .6, line: 0, edge: .5, bloom: .4, gran: .5, under: o.under });
  clump(c._S = [], x, y - R * .6, R * .8, Math.round(36 * s * (o.dense || 1)), greens, { sx: 1.3, sy: .7, l0: 10 * s, l1: 22 * s, w0: 8 * s, w1: 15 * s, a0: .55, a1: .9 });
  drawList(c, c._S);
  if (o.berries) for (let k = 0; k < (o.nb || 26); k++) { const a = rnd(0, TAU), r = Math.sqrt(rnd()) * R * .8, bx = x + Math.cos(a) * r * 1.25, by = y - R * .6 + Math.sin(a) * r * .65;
    for (let j = 0; j < 3; j++) { const ox = rnd(-5, 5) * s, oy = rnd(-4, 4) * s; c.beginPath(); c.arc(bx + ox, by + oy, 4.6 * s, 0, TAU); c.fillStyle = o.berries; c.globalAlpha = .92; c.fill();
      c.beginPath(); c.arc(bx + ox - 1.4 * s, by + oy - 1.4 * s, 1.4 * s, 0, TAU); c.fillStyle = '#ffe8e0'; c.fill(); c.globalAlpha = 1; } }
  if (o.flowers) for (let k = 0; k < 14; k++) { const a = rnd(0, TAU), r = Math.sqrt(rnd()) * R * .8; softBlob(c, x + Math.cos(a) * r * 1.25, y - R * .6 + Math.sin(a) * r * .6, 5 * s, 5 * s, pick(o.flowers), .9, .6); }
}
function tuft(c, x, y, s = 1, cols) {
  cols = cols || ['#7a9a3a', '#8eae4a', '#5f8a32', '#a8b45a'];
  const n = Math.round(rnd(5, 9));
  for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + rnd(-.7, .7), L = rnd(20, 46) * s; drawS(c, mk(polar(x + rnd(-8, 8) * s, y, a, L, rnd(-8, 8) * s, 6), rnd(3, 6) * s, pick(cols), { prof: 'tip', nb: 2, a: rnd(.6, .9) })); }
}
function flowers(c, x, y, s = 1, cols, n = 5) {
  cols = cols || ['#d8323a', '#f2c94a', '#f4f0f8', '#9b84c4', '#e8828a'];
  for (let k = 0; k < n; k++) {
    const fx = x + rnd(-30, 30) * s, h = rnd(18, 44) * s, fy = y - h, col = pick(cols);
    drawS(c, mk(qcurve(fx, y, fx + rnd(-4, 4) * s, fy, rnd(-4, 4), 5), 2.4 * s, '#5f8a32', { prof: 'even', nb: 0, a: .8 }));
    for (let p = 0; p < 5; p++) { const a = p / 5 * TAU + rnd(0, .4); softBlob(c, fx + Math.cos(a) * 4.5 * s, fy + Math.sin(a) * 4 * s, 4.2 * s, 4 * s, col, .85, .6); }
    softBlob(c, fx, fy, 2.4 * s, 2.4 * s, col === '#f2c94a' ? '#c8743a' : '#f2c94a', .95, .7);
  }
}
function reeds(c, x, y, s = 1, n = 9) {
  for (let k = 0; k < n; k++) { const rx = x + rnd(-40, 40) * s, h = rnd(80, 170) * s, b = rnd(-14, 14) * s;
    drawS(c, mk(qcurve(rx, y, rx + b, y - h, b * .4, 8), rnd(3, 6) * s, pick(['#6f8a3a', '#7a9a4a', '#5a7a3a', '#8a9a5a']), { prof: 'tip', nb: 2, a: .85 }));
    if (rnd() < .45) { const ex = rx + b * .9, ey = y - h * .82; drawS(c, mk(qcurve(ex, ey, ex + b * .05, ey - 26 * s, 0, 4), 9 * s, '#7a4a2a', { prof: 'even', nb: 2, a: .9 })); } }
}
function fern(c, x, y, s = 1, col = '#4e7a44') {
  for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * .35, L = rnd(60, 100) * s, pts = polar(x, y, a, L, rnd(-20, 20) * s, 10);
    drawS(c, mk(pts, 2.5 * s, shade(col, .2), { prof: 'tip', nb: 0, a: .8 }));
    for (let i = 2; i < pts.length - 1; i++) for (const sd of [-1, 1]) drawS(c, mk(polar(pts[i][0], pts[i][1], a + sd * 1.2, (1 - i / pts.length) * 22 * s, 2, 4), 5 * s, pick([col, shade(col, -.2)]), { prof: 'leaf', nb: 0, a: .75 })); }
}
function stone(c, x, y, r, col = '#9a948c', o = {}) {
  const pts = catmull([[x - r, y], [x - r * .9, y - r * .55], [x - r * .3, y - r * .85], [x + r * .5, y - r * .75], [x + r, y - r * .25], [x + r * .95, y]], true, 5);
  paint(c, pts, col, { under: o.under ?? true, wob: r * .06, line: Math.max(1, r * .04), bloom: .6, gran: .7, shadowSide: .5 });
  if (o.moss) for (let k = 0; k < 6; k++) softBlob(c, x + rnd(-r * .6, r * .5), y - r * rnd(.4, .8), r * .25, r * .14, pick(['#6f8a4a', '#86a85a']), .6, .5);
}
function fence(c, x0, x1, y, h = 70, col = '#8a6a4a', step = 90) {
  for (let x = x0; x <= x1; x += step) drawS(c, mk(qcurve(x + rnd(-3, 3), y + 4, x + rnd(-4, 4), y - h - rnd(0, 10), rnd(-2, 2), 4), 9, col, { prof: 'even', nb: 3, a: .9 }));
  for (const f of [.35, .72]) drawS(c, mk(qcurve(x0 - 10, y - h * f + rnd(-3, 3), x1 + 10, y - h * f + rnd(-3, 3), rnd(-6, 6), 30), 6, shade(col, -.1), { prof: 'even', nb: 3, a: .85 }));
}
function grassBand(c, x0, x1, y, s = 1, cols, dens = 1) {
  for (let x = x0; x < x1; x += rnd(18, 40) / dens) tuft(c, x, y + rnd(-6, 6), s * rnd(.7, 1.2), cols);
}
function cloud(c, x, y, w, col = '#fff6e8', shadow = '#e8c8b0') {
  for (let k = 0; k < 9; k++) { const u = k / 8; softBlob(c, x + (u - .5) * w, y - Math.sin(u * Math.PI) * w * .14 + rnd(-6, 6), w * rnd(.16, .24), w * rnd(.11, .16), col, .75, .5); }
  for (let k = 0; k < 5; k++) softBlob(c, x + rnd(-.4, .4) * w, y + w * .05, w * .2, w * .06, shadow, .35, .4);
}

// ---------- buildings ----------
function roofTiles(c, pts, col, rows = 6) {
  paint(c, pts, col, { wob: 2, line: 1.6, bloom: .6, gran: .7, under: true });
  const [x0, y0, x1, y1] = boundsOf(pts);
  c.save(); pathOf(c, pts); c.clip();
  for (let r = 0; r < rows; r++) { const yy = y0 + (y1 - y0) * (r + .7) / rows;
    drawS(c, mk(qcurve(x0 - 10, yy, x1 + 10, yy + rnd(-2, 2), rnd(-3, 3), 20), 2.5, shade(col, .35), { prof: 'even', nb: 0, a: .45 }));
    for (let x = x0 + rnd(0, 20); x < x1; x += rnd(16, 26)) drawS(c, mk(qcurve(x, yy - (y1 - y0) / rows * .9, x + 1, yy, 0, 3), 1.6, shade(col, .3), { prof: 'even', nb: 0, a: .35 })); }
  c.restore();
}
function windowPane(c, x, y, w, h, o = {}) {   // x,y top-left
  const glass = o.glass || '#7aa0b0';
  paint(c, [[x, y + h * .25], [x + w * .5, y - h * .02], [x + w, y + h * .25], [x + w, y + h], [x, y + h]].slice(o.square ? 0 : 0), glass, { under: true, wob: .8, line: 1.4, lineCol: '#4a3a30', bloom: .9, gran: .3 });
  if (o.lit) softBlob(c, x + w / 2, y + h * .55, w * .45, h * .4, '#ffd98a', .7, .5);
  c.save(); c.strokeStyle = rgba('#4a3a30', .8); c.lineWidth = 2; c.beginPath(); c.moveTo(x + w / 2, y + h * .05); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h * .58); c.lineTo(x + w, y + h * .58); c.stroke(); c.restore();
  if (o.shutters) for (const sd of [-1, 1]) paint(c, [[x + (sd < 0 ? -w * .42 : w), y + h * .2], [x + (sd < 0 ? 0 : w * 1.42), y + h * .2], [x + (sd < 0 ? 0 : w * 1.42), y + h], [x + (sd < 0 ? -w * .42 : w), y + h]], o.shutters, { under: true, wob: .8, line: 1.2, bloom: .4 });
  if (o.box) { paint(c, [[x - 6, y + h], [x + w + 6, y + h], [x + w + 2, y + h + 14], [x - 2, y + h + 14]], '#8a5a3a', { under: true, wob: .6, line: 1.2 }); flowers(c, x + w / 2, y + h + 2, .7, o.box, 5); }
}
function house(c, x, y, w, h, o = {}) {   // x = centre, y = ground
  const wall = o.wall || '#efd9b4', roof = o.roof || '#c8643a', rh = o.rh || h * .62;
  const wp = [[x - w / 2, y], [x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y]];
  paint(c, wp, wall, { under: true, wob: 1.5, line: 1.6, bloom: .7, gran: .6, shadowSide: .45 });
  pencilRect(c, x - w / 2, y - h, w, h, { a: .22 });
  if (o.timber) { const tc = o.timber; for (const f of [.02, .98]) drawS(c, mk(qcurve(x - w / 2 + w * f, y, x - w / 2 + w * f, y - h, 0, 6), 7, tc, { prof: 'even', nb: 2, a: .9 }));
    drawS(c, mk(qcurve(x - w / 2, y - h * .5, x + w / 2, y - h * .5, 0, 8), 7, tc, { prof: 'even', nb: 2, a: .9 }));
    for (let k = 0; k < 3; k++) { const xx = x - w / 2 + w * (.2 + k * .3); drawS(c, mk(qcurve(xx - w * .08, y - h * .5, xx + w * .08, y - h * .98, 0, 5), 5, tc, { prof: 'even', nb: 2, a: .8 })); } }
  if (o.chimney) { const cx = x + w * .25; paint(c, [[cx - 14, y - h - rh * .3], [cx - 14, y - h - rh * .95], [cx + 14, y - h - rh * .95], [cx + 14, y - h - rh * .3]], '#a8644a', { under: true, wob: .8, line: 1.2 }); }
  roofTiles(c, [[x - w / 2 - 22, y - h + 6], [x - w * .08, y - h - rh], [x + w * .08, y - h - rh], [x + w / 2 + 22, y - h + 6]], roof, 5);
  const dw = Math.min(70, w * .26), dx = o.doorX ?? x - w * .22;
  if (o.door !== false) { paint(c, [[dx - dw / 2, y], [dx - dw / 2, y - h * .5], [dx, y - h * .6], [dx + dw / 2, y - h * .5], [dx + dw / 2, y]], o.doorCol || '#7a4a2e', { under: true, wob: .8, line: 1.4, bloom: .6 });
    for (let k = 1; k < 3; k++) drawS(c, mk(qcurve(dx - dw / 2 + dw * k / 3, y, dx - dw / 2 + dw * k / 3, y - h * .5, 0, 4), 1.5, '#4a2a1a', { prof: 'even', nb: 0, a: .5 }));
    softBlob(c, dx + dw * .3, y - h * .25, 3, 3, '#e2b54a', .9, .7); }
  const nwin = o.windows ?? 2;
  for (let k = 0; k < nwin; k++) { const wx = x - w / 2 + w * (nwin === 1 ? .62 : .45 + k * .3) - 22; windowPane(c, wx, y - h * .78, 44, 52, { shutters: o.shutters, box: o.boxes ? ['#d8323a', '#f2c94a', '#e8828a'] : null, lit: o.lit }); }
}
function smokeLive(c, x, y, t, o = {}) {   // live chimney smoke puffs
  const n = o.n || 7, col = o.col || '#cfc6bc';
  for (let k = 0; k < n; k++) { const ph = ((t * (o.speed || .22) + k / n) % 1), px = x + Math.sin(ph * 4 + k) * 14 * ph + ph * (o.drift ?? 50), py = y - ph * (o.h || 220);
    softBlob(c, px, py, 16 + ph * 40, 14 + ph * 34, col, .5 * (1 - ph) * Math.min(1, ph * 6), .4); }
}
function banner(w, h, col, trim, emblem) {   // a hanging banner sprite (top edge at y=0)
  return canvasSprite(-w / 2 - 6, -6, w / 2 + 6, h + 8, 2, c => {
    paint(c, [[-w / 2, 0], [w / 2, 0], [w / 2, h], [0, h * .82], [-w / 2, h]], col, { under: true, wob: 1, line: 1.4, bloom: .8, gran: .6 });
    if (trim) brush(c, qcurve(-w / 2, 6, w / 2, 6, 0, 8), 5, trim, { prof: 'even', nb: 2, a: .9 });
    if (emblem === 'crown') { paint(c, catmull([[-14, h * .48], [-16, h * .3], [-8, h * .38], [0, h * .24], [8, h * .38], [16, h * .3], [14, h * .48]], true, 3), trim || '#e2b54a', { under: true, wob: .4, line: 1, bloom: .8 }); }
    if (emblem === 'ogre') { softBlob(c, 0, h * .4, w * .22, w * .2, '#8aa35a', .9, .7); for (const sd of [-1, 1]) brush(c, qcurve(sd * w * .1, h * .3, sd * w * .14, h * .18, 0, 3), 3, '#f6eedc', { prof: 'tip', nb: 0 }); }
  });
}
// draw a sprite as a waving flag/banner: vertical strips offset by a travelling wave (anchored at its top/left)
function waveSprite(c, spr, x, y, t, amp = 5, dir = 'down', freq = 2.2, speed = 3) {
  const cw = spr.cv.width, ch = spr.cv.height, r = spr.r, N = 14;
  for (let i = 0; i < N; i++) {
    if (dir === 'down') { const sy = i / N * ch, sh = ch / N + 1, u = i / N, off = Math.sin(u * freq * Math.PI - t * speed) * amp * u;
      c.drawImage(spr.cv, 0, sy, cw, sh, x + spr.x0 + off, y + spr.y0 + sy / r, cw / r, sh / r); }
    else { const sx = i / N * cw, sw = cw / N + 1, u = i / N, off = Math.sin(u * freq * Math.PI - t * speed) * amp * u;
      c.drawImage(spr.cv, sx, 0, sw, ch, x + spr.x0 + sx / r, y + spr.y0 + off, sw / r, ch / r); }
  }
}
function stoneWall(c, pts, col = '#8f8c94', o = {}) {
  paint(c, pts, col, { under: true, wob: 1.5, line: 1.6, bloom: .7, gran: .8, shadowSide: .45 });
  const [x0, y0, x1, y1] = boundsOf(pts);
  c.save(); pathOf(c, pts); c.clip();
  const bh = o.bh || 34;
  for (let yy = y0 + rnd(0, bh); yy < y1; yy += bh) { let x = x0 - rnd(0, 60);
    while (x < x1) { const bw = rnd(44, 80); paint(c, [[x + 3, yy + 3], [x + bw - 3, yy + 3], [x + bw - 3, yy + bh - 3], [x + 3, yy + bh - 3]], mixc(col, pick(['#a8a4ac', '#7a7680', '#9a948c', '#8a8a9a']), .5), { under: false, wob: 1.6, a: rnd(.25, .5), line: 0, edge: .7, bloom: .4, gran: .4 }); x += bw; } }
  if (o.moss) for (let k = 0; k < o.moss; k++) softBlob(c, rnd(x0, x1), rnd(y0, y1), rnd(10, 30), rnd(6, 16), pick(['#6f8a4a', '#86a85a', '#5f7a3a']), rnd(.4, .7), .5);
  c.restore();
}
function crenels(c, x0, x1, y, col, h = 26, w = 30) {
  for (let x = x0; x < x1 - w * .5; x += w * 1.8) paint(c, [[x, y], [x, y - h], [x + w, y - h], [x + w, y]], col, { under: true, wob: .8, line: 1.3, bloom: .5, gran: .7 });
}
function tower(c, x, y, w, h, col, roof, o = {}) {
  stoneWall(c, [[x - w / 2, y], [x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y]], col, { moss: o.moss || 0, bh: o.bh });
  if (roof) { const rh = w * (o.rk || 1.25); paint(c, [[x - w / 2 - 12, y - h + 4], [x, y - h - rh], [x + w / 2 + 12, y - h + 4]], roof, { under: true, wob: 1.2, line: 1.5, bloom: .8, gran: .6 });
    for (let k = 1; k < 4; k++) drawS(c, mk(qcurve(x, y - h - rh, x - w / 2 - 12 + (w + 24) * k / 4, y - h + 4, 0, 6), 1.6, shade(roof, .35), { prof: 'even', nb: 0, a: .45 })); }
  else crenels(c, x - w / 2 - 6, x + w / 2 + 6, y - h, col);
  for (let k = 0; k < (o.win ?? 2); k++) { const wy = y - h * (.35 + k * .3); paint(c, [[x - 9, wy], [x - 9, wy - 30], [x, wy - 40], [x + 9, wy - 30], [x + 9, wy]], o.lit ? '#f2c96a' : '#3a3440', { under: true, wob: .5, line: 1.2, bloom: .5 }); }
}

// ---------- small objects ----------
function barrel(c, x, y, s = 1) { const w = 46 * s, h = 64 * s;
  paint(c, catmull([[x - w * .45, y], [x - w * .52, y - h * .5], [x - w * .45, y - h], [x + w * .45, y - h], [x + w * .52, y - h * .5], [x + w * .45, y]], true, 5), '#9a6a40', { under: true, wob: .8, line: 1.4, bloom: .7 });
  for (const f of [.18, .82]) drawS(c, mk(qcurve(x - w * .5, y - h * f, x + w * .5, y - h * f, -2, 8), 4 * s, '#5a4a40', { prof: 'even', nb: 0, a: .8 })); }
function sack(c, x, y, s = 1, col = '#e8dcc0') { paint(c, catmull([[x - 26 * s, y], [x - 30 * s, y - 30 * s], [x - 14 * s, y - 56 * s], [x - 4 * s, y - 64 * s], [x + 8 * s, y - 58 * s], [x + 28 * s, y - 34 * s], [x + 26 * s, y]], true, 5), col, { under: true, wob: 1, line: 1.3, bloom: .7, gran: .6 });
  drawS(c, mk(qcurve(x - 10 * s, y - 52 * s, x + 8 * s, y - 52 * s, 2, 4), 3 * s, '#8a6a40', { prof: 'even', nb: 0 })); }
function crate(c, x, y, s = 1) { const w = 60 * s; paint(c, [[x - w / 2, y], [x - w / 2, y - w * .8], [x + w / 2, y - w * .8], [x + w / 2, y]], '#b0844a', { under: true, wob: .8, line: 1.4, bloom: .5 });
  drawS(c, mk(qcurve(x - w / 2, y - w * .4, x + w / 2, y - w * .4, 0, 5), 3 * s, '#6a4a2a', { prof: 'even', nb: 0, a: .7 })); }
function basket(c, x, y, s = 1, fruit = null, n = 7) { const w = 54 * s;
  if (fruit) for (let k = 0; k < n; k++) paint(c, ellipsePts(x + (k - n / 2 + .5) * w / n * 1.3, y - 30 * s - (k % 2) * 6 * s, 9 * s, 8.5 * s, 0, 14), fruit, { under: true, wob: .5, line: 1, bloom: .9, gran: .3 });
  paint(c, catmull([[x - w / 2, y - 30 * s], [x + w / 2, y - 30 * s], [x + w * .4, y], [x - w * .4, y]], true, 4), '#c8944a', { under: true, wob: .8, line: 1.4, bloom: .6 });
  for (let k = 0; k < 4; k++) drawS(c, mk(qcurve(x - w * .45, y - 24 * s + k * 6 * s, x + w * .45, y - 24 * s + k * 6 * s, 1, 6), 1.6 * s, '#8a5a2a', { prof: 'even', nb: 0, a: .6 })); }
function pot(c, x, y, s = 1, fl) { paint(c, catmull([[x - 22 * s, y - 40 * s], [x + 22 * s, y - 40 * s], [x + 16 * s, y], [x - 16 * s, y]], true, 4), '#c8643a', { under: true, wob: .6, line: 1.3, bloom: .7 }); flowers(c, x, y - 40 * s, .8 * s, fl, 4); tuft(c, x, y - 40 * s, .6 * s); }
function candle(c, x, y, s = 1) { paint(c, [[x - 6 * s, y], [x - 6 * s, y - 40 * s], [x + 6 * s, y - 40 * s], [x + 6 * s, y]], '#f4ead2', { under: true, wob: .3, line: 1, bloom: .5 }); }
function flameLive(c, x, y, s, t, ph = 0) {   // live candle / lantern flame with glow
  const f = 1 + .12 * Math.sin(t * 13 + ph) + .08 * Math.sin(t * 23 + ph * 2);
  c.save(); c.globalCompositeOperation = 'lighter';
  softBlob(c, x, y - 6 * s, 60 * s * f, 60 * s * f, '#ffb84a', .22, .2);
  c.restore();
  c.beginPath(); c.moveTo(x - 5 * s, y); c.quadraticCurveTo(x - 6 * s, y - 10 * s * f, x + Math.sin(t * 7 + ph) * 2 * s, y - 20 * s * f); c.quadraticCurveTo(x + 6 * s, y - 10 * s * f, x + 5 * s, y); c.closePath();
  c.fillStyle = 'rgba(255,200,90,.95)'; c.fill();
  c.beginPath(); c.ellipse(x, y - 5 * s, 2.4 * s, 5 * s, 0, 0, TAU); c.fillStyle = 'rgba(255,250,220,.95)'; c.fill();
}
function sparkleLive(c, x, y, t, ph, r = 6, col = '#ffffff') {   // a twinkle on water
  const a = Math.max(0, Math.sin(t * 3.1 + ph * 7.3)) ** 6; if (a < .02) return;
  c.save(); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 1.6; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r * .7); c.lineTo(x, y + r * .7); c.stroke();
  c.beginPath(); c.arc(x, y, 1.8, 0, TAU); c.fillStyle = col; c.fill(); c.restore();
}
function birdsLive(c, t, x0, y0, n = 4, o = {}) {
  c.save(); c.strokeStyle = rgba(o.col || '#4a3a3a', .8); c.lineWidth = 2.2; c.lineCap = 'round';
  for (let k = 0; k < n; k++) { const ph = (t * (o.speed || 40) + k * 170) % (o.span || 3000), x = x0 + ph, y = y0 + Math.sin(t * .6 + k * 2) * 20 + k * 22, f = Math.sin(t * 9 + k * 1.3) * 6, s = o.s || 1;
    c.beginPath(); c.moveTo(x - 12 * s, y - f * s); c.quadraticCurveTo(x - 5 * s, y - 6 * s, x, y); c.quadraticCurveTo(x + 5 * s, y - 6 * s, x + 12 * s, y - f * s); c.stroke(); }
  c.restore();
}
function motesLive(c, t, x0, y0, w, h, n = 30, col = '#fff2c8') {   // dust motes drifting in sunlight
  for (let k = 0; k < n; k++) { const u = hash(k * 3.1), v = hash(k * 7.7), x = x0 + ((u * w + t * 8 * (hash(k) - .3)) % w + w) % w, y = y0 + ((v * h - t * 6 * hash(k + 3) + Math.sin(t + k) * 6) % h + h) % h;
    const a = .35 + .35 * Math.sin(t * 1.3 + k); softBlob(c, x, y, 3, 3, col, a, .5); }
}
function sunbeams(c, x, y, ang, len, w, n = 3, a = .14, t = 0) { a *= .7;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < n; k++) { const off = (k - (n - 1) / 2) * w * 1.3, aa = a * (.75 + .25 * Math.sin(t * .5 + k * 2));
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    const g = c.createLinearGradient(x, y, x + dx * len, y + dy * len); g.addColorStop(0, `rgba(255,236,180,${aa})`); g.addColorStop(1, 'rgba(255,236,180,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(x + px * (off - w * .3), y + py * (off - w * .3)); c.lineTo(x + px * (off + w * .3), y + py * (off + w * .3));
    c.lineTo(x + dx * len + px * (off + w * .7), y + dy * len + py * (off + w * .7)); c.lineTo(x + dx * len + px * (off - w * .7), y + dy * len + py * (off - w * .7)); c.closePath(); c.fill(); }
  c.restore();
}
function butterflyLive(c, t, x, y, col = '#f2c94a', ph = 0) {
  const px = x + Math.sin(t * .7 + ph) * 120, py = y + Math.sin(t * 1.3 + ph * 2) * 40, f = Math.abs(Math.sin(t * 12 + ph));
  for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(px + sd * 7 * f, py, 8 * f + 1, 6, sd * .4, 0, TAU); c.fillStyle = rgba(col, .85); c.fill(); }
  c.beginPath(); c.ellipse(px, py, 1.6, 5, 0, 0, TAU); c.fillStyle = '#3a2a2a'; c.fill();
}

// ---------- vehicles ----------
function carriageBody(c, x, y, s = 1) {   // y = axle line; returns nothing
  const w = 250 * s, h = 190 * s, by = y - 30 * s;
  paint(c, catmull([[x - w * .5, by - h * .2], [x - w * .45, by - h * .85], [x, by - h], [x + w * .45, by - h * .85], [x + w * .5, by - h * .2], [x + w * .3, by], [x - w * .3, by]], true, 6), '#5b3a7a', { under: true, wob: 1, line: 2, bloom: .9, gran: .5 });
  paint(c, catmull([[x - w * .3, by - h * .5], [x - w * .26, by - h * .78], [x, by - h * .84], [x + w * .26, by - h * .78], [x + w * .3, by - h * .5], [x, by - h * .44]], true, 5), '#f6dca0', { under: true, wob: .6, line: 1.6, lineCol: '#a8843a', bloom: .9 });
  softBlob(c, x, by - h * .65, w * .2, h * .14, '#fff2c8', .6, .5);
  for (let k = 0; k < 2; k++) drawS(c, mk(qcurve(x - w * .48, by - h * (.22 + k * .05), x + w * .48, by - h * (.22 + k * .05), 4, 14), 5 * s, '#e2b54a', { prof: 'even', nb: 2, a: .95 }));
  paint(c, catmull([[x - 30 * s, by - h], [x - 36 * s, by - h - 22 * s], [x - 16 * s, by - h - 12 * s], [x, by - h - 32 * s], [x + 16 * s, by - h - 12 * s], [x + 36 * s, by - h - 22 * s], [x + 30 * s, by - h]], true, 3), '#e2b54a', { under: true, wob: .5, line: 1.3, bloom: .9 });
  drawS(c, mk(qcurve(x + w * .45, by - h * .1, x + w * .78, by + 4 * s, -8, 8), 7 * s, '#7a5a3a', { prof: 'even', nb: 3 }));
}
function wheelSprite(r, col = '#e2b54a', hub = '#7a5a3a') {
  return canvasSprite(-r - 6, -r - 6, r + 6, r + 6, 2, c => {
    c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.strokeStyle = col; c.lineWidth = r * .14; c.stroke(); c.strokeStyle = rgba(shade(col, .4), .7); c.lineWidth = 2; c.stroke(); c.restore();
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; drawS(c, mk([[0, 0], [Math.cos(a) * r * .5, Math.sin(a) * r * .5], [Math.cos(a) * r * .92, Math.sin(a) * r * .92]], r * .07, col, { prof: 'even', nb: 0, a: .95 })); }
    paint(c, ellipsePts(0, 0, r * .18, r * .18, 0, 14), hub, { under: true, wob: .4, line: 1.2, bloom: .7 });
  });
}
function millWheelSprite(r) {
  return canvasSprite(-r - 30, -r - 30, r + 30, r + 30, 1.5, c => {
    for (const rr of [r, r * .62]) { c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.strokeStyle = '#6a4a30'; c.lineWidth = r * .07; c.stroke(); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU;
      drawS(c, mk([[0, 0], [Math.cos(a) * r, Math.sin(a) * r]], r * .05, '#7a5a3a', { prof: 'even', nb: 2, a: .9 }));
      const px = Math.cos(a) * r, py = Math.sin(a) * r, tx = -Math.sin(a), ty = Math.cos(a);
      paint(c, [[px - tx * 4 + Math.cos(a) * 6, py - ty * 4 + Math.sin(a) * 6], [px + tx * 26 + Math.cos(a) * 6, py + ty * 26 + Math.sin(a) * 6], [px + tx * 26 + Math.cos(a) * 28, py + ty * 26 + Math.sin(a) * 28], [px - tx * 4 + Math.cos(a) * 28, py - ty * 4 + Math.sin(a) * 28]], '#9a6a40', { under: true, wob: .6, line: 1.2, bloom: .5 }); }
    paint(c, ellipsePts(0, 0, r * .14, r * .14, 0, 14), '#4a3a2a', { under: true, wob: .4, line: 1.2 });
  });
}

// ---------- held props & word-card objects ----------
function buildProps() {
  withSeed(5150, () => {
    const S = (x0, y0, x1, y1, r, f) => canvasSprite(x0, y0, x1, y1, r, f);
    PROPS.breadHalf = S(-40, -30, 40, 30, 4, c => { paint(c, catmull([[-34, 6], [-30, -14], [-10, -24], [14, -20], [20, -4], [22, 14], [-24, 20]], true, 6), '#d89a4a', { under: true, wob: 1, line: 1.6, bloom: .9 });
      paint(c, catmull([[18, -18], [26, -4], [24, 12], [18, 16], [14, 0]], true, 4), '#f6e2b8', { under: true, wob: 1.2, line: 1.2, bloom: .5 });
      for (let k = 0; k < 3; k++) drawS(c, mk(qcurve(-24 + k * 12, -8, -18 + k * 12, -18, 2, 4), 3, '#a8642a', { prof: 'even', nb: 0, a: .6 })); });
    PROPS.bread = S(-70, -36, 70, 36, 3, c => { paint(c, catmull([[-62, 10], [-56, -14], [-20, -28], [24, -28], [58, -14], [64, 10], [30, 22], [-30, 22]], true, 6), '#d89a4a', { under: true, wob: 1, line: 1.8, bloom: 1 });
      for (let k = 0; k < 4; k++) drawS(c, mk(qcurve(-36 + k * 22, -4, -26 + k * 22, -22, 2, 4), 4, '#a8642a', { prof: 'even', nb: 0, a: .6 })); softBlob(c, -10, -16, 30, 8, '#ffe8b8', .5, .4); });
    PROPS.loaf = PROPS.bread;
    PROPS.berry = S(-10, -10, 10, 10, 6, c => { paint(c, ellipsePts(0, 0, 7, 7, 0, 14), '#d8323a', { under: true, wob: .3, line: 1, bloom: 1 }); });
    PROPS.berryBag = S(-36, -50, 36, 34, 3, c => { paint(c, catmull([[-26, -20], [26, -20], [32, 10], [20, 28], [-20, 28], [-32, 10]], true, 5), '#c8a874', { under: true, wob: 1, line: 1.5, bloom: .7 });
      for (let k = 0; k < 9; k++) paint(c, ellipsePts(-18 + (k % 5) * 9, -24 - Math.floor(k / 5) * 9 + rnd(-2, 2), 6, 6, 0, 12), '#d8323a', { under: true, wob: .3, line: .8, bloom: 1 }); });
    PROPS.peachBasket = S(-50, -60, 50, 10, 3, c => { basket(c, 0, 0, 1.4, '#f2a46a', 6); });
    PROPS.cookieBasket = S(-50, -60, 50, 10, 3, c => { basket(c, 0, 0, 1.4, '#d8a85a', 6); });
    PROPS.cookie = S(-16, -16, 16, 16, 5, c => { paint(c, ellipsePts(0, 0, 13, 12, 0, 18), '#d8a85a', { under: true, wob: .6, line: 1.2, bloom: .8 }); for (let k = 0; k < 5; k++) softBlob(c, rnd(-7, 7), rnd(-7, 7), 2.4, 2.2, '#6a3a1a', .9, .7); });
    PROPS.peach = S(-14, -16, 14, 14, 5, c => { paint(c, ellipsePts(0, 0, 11, 11, 0, 16), '#f2a46a', { under: true, wob: .4, line: 1.1, bloom: 1, grad: ['#f8c87a', '#e8705a'] }); brush(c, qcurve(0, -10, 6, -15, -2, 4), 4, '#6f9a3a', { prof: 'leaf', nb: 0 }); });
    PROPS.honey = S(-26, -44, 26, 6, 3, c => { paint(c, catmull([[-18, 0], [-22, -22], [-14, -34], [14, -34], [22, -22], [18, 0]], true, 5), '#e8a83a', { under: true, wob: .6, line: 1.4, bloom: 1 }); paint(c, [[-16, -34], [16, -34], [14, -42], [-14, -42]], '#c8a874', { under: true, wob: .5, line: 1.1 }); });
    PROPS.bell = S(-24, -40, 24, 26, 3, c => { brush(c, qcurve(0, -38, 0, -18, 0, 4), 7, '#6a4a30', { prof: 'even', nb: 0 }); paint(c, catmull([[-6, -18], [6, -18], [12, -6], [20, 12], [-20, 12], [-12, -6]], true, 5), '#d9a93c', { under: true, wob: .5, line: 1.4, bloom: 1 }); softBlob(c, 0, 16, 5, 5, '#6a4a30', .9, .7); });
    PROPS.spear = S(-10, -260, 10, 60, 2, c => { brush(c, qcurve(0, 60, 0, -220, 0, 10), 6, '#7a5a3a', { prof: 'even', nb: 2 }); paint(c, [[0, -258], [8, -222], [0, -214], [-8, -222]], '#c8ccd4', { under: true, wob: .3, line: 1.2, bloom: 1 }); });
    PROPS.crook = S(-30, -250, 20, 60, 2, c => { brush(c, [[0, 60], [0, -200], [-4, -225], [-18, -232], [-26, -220], [-22, -206]], 6, '#8a6a40', { prof: 'even', nb: 2 }); });
    PROPS.clothes = S(-44, -30, 44, 24, 3, c => { paint(c, catmull([[-40, 10], [-36, -16], [36, -16], [40, 10], [0, 20]], true, 5), '#3f6fb0', { under: true, wob: .8, line: 1.4, bloom: .8 }); paint(c, catmull([[-34, -12], [-30, -26], [30, -26], [34, -12]], true, 4), '#c2a77e', { under: true, wob: .8, line: 1.3 }); dots([[0, -2], [12, -2]], '#e2b54a', 3).f(c); });
    PROPS.oldClothes = S(-40, -24, 40, 20, 3, c => { paint(c, catmull([[-36, 10], [-32, -14], [32, -14], [36, 10], [0, 16]], true, 5), '#b89a72', { under: true, wob: 1.2, line: 1.3, bloom: .5 }); paint(c, ellipsePts(-8, -2, 8, 7, 0, 12), '#8f9a6a', { under: true, wob: .5, line: 1 }); });
    PROPS.apple = S(-12, -14, 12, 12, 5, c => { paint(c, ellipsePts(0, 0, 10, 9.5, 0, 16), '#d8323a', { under: true, wob: .4, line: 1.1, bloom: 1 }); brush(c, qcurve(0, -8, 2, -13, 1, 3), 2, '#5a3a2a', { prof: 'even', nb: 0 }); });
    PROPS.appleBasket = S(-50, -60, 50, 10, 3, c => { basket(c, 0, 0, 1.4, '#d8323a', 7); });
    PROPS.bag = S(-34, -40, 34, 40, 3, c => { paint(c, catmull([[-24, -16], [24, -16], [30, 14], [18, 32], [-18, 32], [-30, 14]], true, 5), '#c8a874', { under: true, wob: 1, line: 1.5, bloom: .7 }); brush(c, qcurve(-20, -14, 20, -14, -3, 6), 3, '#8a6a40', { prof: 'even', nb: 0 }); brush(c, qcurve(-14, -16, -6, -36, 8, 6), 2.4, '#8a6a40', { prof: 'even', nb: 0 }); brush(c, qcurve(14, -16, 6, -36, -8, 6), 2.4, '#8a6a40', { prof: 'even', nb: 0 }); });
    PROPS.slipper = S(-90, -50, 90, 20, 2, c => { paint(c, catmull([[-80, 10], [-70, -24], [20, -30], [70, -16], [84, 6], [60, 16], [-60, 16]], true, 6), '#f4a6c6', { under: true, wob: 1.5, line: 1.6, bloom: .9 }); for (let k = 0; k < 16; k++) softBlob(c, -60 + k * 6, -26 + Math.sin(k * .5) * 3, 10, 9, pick(['#fbd6e6', '#ffe4ee']), .85, .6); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; softBlob(c, 40 + Math.cos(a) * 9, -28 + Math.sin(a) * 8, 9, 9, pick(['#fbd6e6', '#ffffff']), .9, .6); } });
    PROPS.boots = S(-60, -70, 70, 40, 3, c => { for (const dx of [-26, 22]) { const bt = catmull([[dx - 14, -56], [dx + 14, -56], [dx + 14, 8], [dx + 36, 14], [dx + 38, 32], [dx + 32, 36], [dx - 15, 36], [dx - 16, 8]], true, 5); paint(c, bt, '#7a4a2a', { under: true, wob: .8, line: 1.6, bloom: .9 }); paint(c, catmull([[dx - 18, -64], [dx + 18, -64], [dx + 20, -44], [dx - 20, -44]], true, 4), '#a8714a', { under: true, wob: .6, line: 1.3 }); paint(c, ellipsePts(dx + 1, -20, 4, 3.5, 0, 10), '#e2b54a', { under: true, wob: .3, line: .8 }); } });
    PROPS.miniCastle = S(-90, -110, 90, 60, 2, c => { stoneWall(c, [[-70, 50], [-70, -10], [70, -10], [70, 50]], '#d8cbb8', { bh: 12 }); for (const [dx, w, h] of [[-60, 26, 100], [60, 26, 100], [0, 34, 140]]) tower(c, dx, 50, w, h, '#ddd0be', '#5b3a7a', { win: 1, rk: 1.3, bh: 14 }); });
    PROPS.miniCarriage = S(-110, -110, 110, 40, 2, c => { carriageBody(c, 0, 20, .45); drawSprite(c, wheelSprite(18), -40, 22); drawSprite(c, wheelSprite(18), 40, 22); });
    PROPS.trunk = S(-120, -700, 120, 40, 1.5, c => { const tr = mk(qcurve(0, 30, 6, -700, -14, 10), 150, '#6a5040', { prof: 'trunk', nb: 9 }); drawS(c, tr); drawS(c, edgeOf(tr, 1, 6, '#3a2a20', .7)); drawS(c, edgeOf(tr, -1, 4, '#8a7060', .5)); for (let k = 0; k < 6; k++) softBlob(c, rnd(-40, 40), rnd(-500, 0), 20, 12, '#6f8a4a', .5, .5); });
    PROPS.crown = S(-22, -24, 22, 6, 4, c => { paint(c, catmull([[-16, 4], [-19, -16], [-9, -6], [0, -20], [9, -6], [19, -16], [16, 4]], true, 3), '#e8b93c', { under: true, wob: .3, line: 1.2, bloom: 1 }); });
    PROPS.lantern = S(-30, -80, 30, 10, 3, c => { brush(c, qcurve(-10, -70, 10, -70, -12, 8), 3, '#6a4a2a', { prof: 'even', nb: 0 }); paint(c, [[-20, -58], [20, -58], [24, -6], [-24, -6]], '#f6dca0', { under: true, wob: .5, line: 1.4, lineCol: '#6a4a2a', bloom: 1 }); paint(c, [[-24, -66], [24, -66], [18, -56], [-18, -56]], '#b8843a', { under: true, wob: .4, line: 1.2 }); paint(c, [[-26, -6], [26, -6], [22, 4], [-22, 4]], '#b8843a', { under: true, wob: .4, line: 1.2 }); });
  });
}

// a hearth fire: layered rounded tongues of flame with a warm glow (live)
function fireLive(c, x, y, w, h, t) {
  c.save(); c.globalCompositeOperation = 'lighter'; softBlob(c, x, y - h * .3, w * 1.6, h * 1.3, '#ff8a2a', .28, .2); c.restore();
  const N = 7;
  for (const [col, kh, kw] of [['rgba(232,96,40,.9)', 1, 1], ['rgba(255,160,50,.92)', .78, .78], ['rgba(255,226,120,.95)', .5, .5]]) {
    for (let k = 0; k < N; k++) {
      const u = (k + .5) / N - .5, fx = x + u * w * kw, ph = t * (5 + k * .7) + k * 2.3;
      const fh = h * kh * (.55 + .45 * Math.cos(u * Math.PI)) * (1 + .18 * Math.sin(ph) + .1 * Math.sin(ph * 2.3));
      const fw = w / N * 1.5 * kw, sway = Math.sin(t * 3 + k) * fw * .3;
      c.beginPath(); c.moveTo(fx - fw * .55, y);
      c.bezierCurveTo(fx - fw * .7, y - fh * .45, fx - fw * .15 + sway, y - fh * .7, fx + sway * 1.4, y - fh);
      c.bezierCurveTo(fx + fw * .2 + sway, y - fh * .65, fx + fw * .7, y - fh * .4, fx + fw * .55, y); c.closePath();
      c.fillStyle = col; c.fill();
    }
  }
  for (let k = 0; k < 6; k++) { const ph = (t * .7 + k / 6) % 1; softBlob(c, x + Math.sin(k * 7 + t) * w * .3, y - h * (.6 + ph * 1.2), 3, 3, '#ffd080', .9 * (1 - ph), .6); }
  for (let k = 0; k < 4; k++) softBlob(c, x + (k - 1.5) * w * .22, y + 4, w * .14, 8, '#ffcf70', .8, .5);
}
