// Watercolour painting helpers on top of brush.js (mk / drawS strokes).
// Every function here consumes the global RNG: call them inside withSeed() (build time) only.

const TAU = Math.PI * 2;
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

// ---------- textures (built once) ----------
let GRAN = null, GRANPAT = null, PAPERTEX = null;
function buildTextures() {
  withSeed(911, () => {
    // pigment granulation: speckle + soft blotches, mid-grey around 255 (for multiply)
    const s = 512; GRAN = mkCanvas(s, s); const g = GRAN.getContext('2d');
    const id = g.createImageData(s, s), d = id.data;
    const blot = new Float32Array(s * s);
    for (let k = 0; k < 90; k++) { const cx = rnd(0, s), cy = rnd(0, s), r = rnd(8, 60), a = rnd(-.5, 1);
      for (let y = Math.max(0, cy - r | 0); y < Math.min(s, cy + r); y++) for (let x = Math.max(0, cx - r | 0); x < Math.min(s, cx + r); x++) {
        const q = 1 - Math.hypot(x - cx, y - cy) / r; if (q > 0) blot[y * s + x] += a * q * q; } }
    for (let i = 0; i < s * s; i++) {
      const sp = RNG() < .22 ? rnd(0, 70) : rnd(0, 14);
      const v = 255 - sp - Math.max(0, blot[i]) * 22;
      d[i * 4] = v; d[i * 4 + 1] = v - 2; d[i * 4 + 2] = v - 6; d[i * 4 + 3] = 255;
    }
    g.putImageData(id, 0, 0);
  });
}
function granPattern(c) { return c.createPattern(GRAN, 'repeat'); }

// ---------- geometry ----------
function catmull(ctrl, closed = true, n = 6) {
  const out = [], N = ctrl.length;
  const P = i => closed ? ctrl[(i + N) % N] : ctrl[Math.max(0, Math.min(N - 1, i))];
  const segs = closed ? N : N - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  if (!closed) out.push(ctrl[N - 1]);
  return out;
}
// displace a closed polygon along its normals with value noise (hand-painted edge)
function wobble(pts, amt, freq = .08) {
  const n = pts.length, seed = rnd(0, 999), out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const k = (vnoise(seed + i * freq * 6) - .5) * 2 * amt + (vnoise(seed * 3 + i * freq * 22) - .5) * amt * .5;
    out.push([pts[i][0] - dy / L * k, pts[i][1] + dx / L * k]);
  }
  return out;
}
function ellipsePts(cx, cy, rx, ry, rot = 0, n = 44) {
  const out = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); }
  return out;
}
function boundsOf(pts) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; }
function pathOf(c, pts) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); }
function jitterPts(pts, j) { const s = rnd(0, 99); return pts.map(([x, y], i) => [x + (vnoise(s + i * .37) - .5) * 2 * j, y + (vnoise(s + 50 + i * .37) - .5) * 2 * j]); }
const shade = (col, k) => k >= 0 ? mixc(col, '#2a2028', k) : mixc(col, '#fff6e6', -k);   // k>0 darker (warm-violet shadow), k<0 lighter

// ---------- the watercolour fill ----------
// pts: closed polygon (already wobbled or not). o:
//   a: body opacity (.8)   under: paper-coloured underlayer so the shape is opaque (characters, props in front)
//   wob: edge wobble px    edge: darker pooled-edge strength (0..1)   line: ink edge stroke width (0 = none)
//   bloom: inner light/dark bloom (0..1)   light: [lx,ly] light direction   gran: granulation (0..1)
//   grad: [top, bottom] colours instead of col   shadowSide: amount of shadow wash on the far side
function paint(c, pts, col, o = {}) {
  const wob = o.wob ?? 3, a = o.a ?? .82;
  const P = wob > 0 ? wobble(pts, wob, o.freq ?? .08) : pts;
  const [x0, y0, x1, y1] = boundsOf(P), w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  c.save();
  if (o.under) { pathOf(c, P); c.fillStyle = o.under === true ? PAPER : o.under; c.globalAlpha = 1; c.fill(); }
  const fillOf = () => {
    if (!o.grad) return col;
    const g = c.createLinearGradient(0, y0, 0, y1); o.grad.forEach((cc, i) => g.addColorStop(i / (o.grad.length - 1), cc)); return g;
  };
  // three jittered passes at a third of the opacity: edges pool where passes disagree
  const passes = o.passes ?? 3, jit = o.jit ?? Math.max(.6, Math.min(w, h) * .012);
  for (let p = 0; p < passes; p++) {
    pathOf(c, p ? jitterPts(P, jit) : P);
    c.globalAlpha = 1 - Math.pow(1 - a, 1 / passes); c.fillStyle = fillOf(); c.fill();
  }
  c.globalAlpha = 1;
  // inside effects, clipped to the shape
  pathOf(c, P); c.clip();
  const L = o.light || [-.5, -.7];
  const ssd = (o.shadowSide ?? .35) * Math.min(1, 700 / Math.max(w, h, 1));
  if (ssd > 0) {   // shadow wash on the side away from the light
    const g = c.createLinearGradient(cx + L[0] * w * .5, cy + L[1] * h * .5, cx - L[0] * w * .55, cy - L[1] * h * .55);
    g.addColorStop(0, rgba(shade(o.grad ? o.grad[0] : col, .2), 0)); g.addColorStop(.55, rgba(shade(o.grad ? o.grad[o.grad.length - 1] : col, .25), 0));
    g.addColorStop(1, rgba(shade(o.grad ? o.grad[o.grad.length - 1] : col, .32), ssd));
    c.fillStyle = g; c.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
  }
  const bl = (o.bloom ?? .5) * Math.min(1, 520 / Math.max(w, h, 1));
  if (bl > 0) {   // a lighter bloom toward the light + one darker cauliflower blotch
    const bx = cx + L[0] * w * .22, by = cy + L[1] * h * .22, r = Math.max(w, h) * rnd(.28, .42);
    const g = c.createRadialGradient(bx, by, 0, bx, by, r); g.addColorStop(0, `rgba(255,248,235,${.42 * bl})`); g.addColorStop(1, 'rgba(255,248,235,0)');
    c.fillStyle = g; c.fillRect(x0, y0, w, h);
    const dx = cx + rnd(-.3, .3) * w, dy = cy + rnd(0, .35) * h, dr = Math.max(w, h) * rnd(.14, .26);
    const g2 = c.createRadialGradient(dx, dy, dr * .55, dx, dy, dr);
    g2.addColorStop(0, rgba(shade(o.grad ? o.grad[0] : col, .12), .0)); g2.addColorStop(.86, rgba(shade(o.grad ? o.grad[0] : col, .18), .22 * bl)); g2.addColorStop(1, rgba(shade(o.grad ? o.grad[0] : col, .18), 0));
    c.fillStyle = g2; c.fillRect(x0, y0, w, h);
  }
  const gr = o.gran ?? .55;
  if (gr > 0 && GRAN) { c.globalCompositeOperation = 'multiply'; c.globalAlpha = gr; c.fillStyle = granPattern(c);
    c.save(); c.translate(rnd(0, 512), rnd(0, 512)); c.fillRect(x0 - 600, y0 - 600, w + 1200, h + 1200); c.restore();
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  c.restore();
  // pooled edge + optional ink edge
  const ed = o.edge ?? .55;
  if (ed > 0) { c.save(); pathOf(c, P); c.lineJoin = 'round'; c.strokeStyle = rgba(shade(o.grad ? o.grad[o.grad.length - 1] : col, .25), .5 * ed);
    c.lineWidth = Math.max(1, Math.min(w, h) * .018 + 1); c.stroke(); c.restore(); }
  if (o.line) edgeLine(c, P, o.line, o.lineCol || shade(o.grad ? o.grad[o.grad.length - 1] : col, .55), o.lineA ?? .75);
  return P;
}
// a broken, varying ink/edge line around a closed polygon (the only "line" in watercolour)
function edgeLine(c, P, w, col, a = .75) {
  const n = P.length, k = Math.max(3, Math.round(n / 16));
  let i = Math.floor(rnd(0, n));
  let done = 0;
  while (done < n) {
    const len = Math.floor(rnd(n / k * .8, n / k * 1.6)), pts = [];
    for (let j = 0; j <= len && done + j <= n; j++) pts.push(P[(i + j) % n]);
    if (pts.length > 2) drawS(c, mk(pts, w * rnd(.7, 1.25), col, { prof: 'even', nb: 0, a: a * rnd(.7, 1), rough: .45 }));
    const gap = rnd(0, 1) < .25 ? Math.floor(rnd(1, 3)) : 0;
    i = (i + len + gap) % n; done += len + gap;
  }
}
// dry-brush texture strokes across a shape (direction ang), clipped
function hatch(c, pts, col, n, o = {}) {
  const [x0, y0, x1, y1] = boundsOf(pts), w = x1 - x0, h = y1 - y0;
  c.save(); pathOf(c, pts); c.clip();
  for (let i = 0; i < n; i++) {
    const x = rnd(x0, x1), y = rnd(y0, y1), ang = (o.ang ?? 0) + rnd(-(o.spread ?? .3), o.spread ?? .3), L = rnd(o.l0 ?? w * .2, o.l1 ?? w * .5);
    drawS(c, mk(qcurve(x - Math.cos(ang) * L / 2, y - Math.sin(ang) * L / 2, x + Math.cos(ang) * L / 2, y + Math.sin(ang) * L / 2, rnd(-L * .08, L * .08), 8),
      rnd(o.w0 ?? 3, o.w1 ?? 8), Array.isArray(col) ? pick(col) : col, { prof: o.prof || 'brush', nb: o.nb ?? 3, a: rnd(o.a0 ?? .15, o.a1 ?? .35), rough: .35 }));
  }
  c.restore();
}
// light graphite construction line
function pencil(c, pts, o = {}) {
  c.save(); c.lineCap = 'round'; c.strokeStyle = rgba(o.col || '#5a5560', o.a ?? .32); c.lineWidth = o.w ?? 1.1;
  for (let rep = 0; rep < (o.rep ?? 2); rep++) {
    c.beginPath(); const j = o.j ?? .8;
    pts.forEach(([x, y], i) => { const xx = x + rnd(-j, j), yy = y + rnd(-j, j); i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); });
    if (o.closed) c.closePath(); c.stroke();
  }
  c.restore();
}
function pencilRect(c, x, y, w, h, o) { pencil(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], Object.assign({ closed: true }, o)); }
// a single brush stroke along points
function brush(c, pts, w, col, o = {}) { drawS(c, mk(pts, w, col, o)); }
// a soft wet blob (no hard edge): radial gradient wash, used for clouds, glows, moss, shadows
function softBlob(c, x, y, rx, ry, col, a, hard = .55) {
  c.save(); c.translate(x, y); c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, rgba(col, a)); g.addColorStop(hard, rgba(col, a * .8)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
}
// ground shadow under a character/prop
function groundShadow(c, x, y, rx, ry, a = .22, col = '#3a2a3a') { softBlob(c, x, y, rx, ry, col, a, .35); }
// haze a finished layer canvas toward a colour (aerial perspective): only on painted pixels
function haze(cv, col, a) {
  const c = cv.getContext('2d'); c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = rgba(col, a); c.fillRect(0, 0, cv.width, cv.height); c.restore();
}
// paper texture for the whole frame (grain over everything), built once
function buildPaper() {
  withSeed(77, () => {
    PAPERTEX = mkCanvas(W, H); const c = PAPERTEX.getContext('2d');
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
    // low-frequency mottling
    for (let i = 0; i < 260; i++) softBlob(c, rnd(0, W), rnd(0, H), rnd(40, 260), rnd(30, 200), pick(['#e9dcc4', '#efe4d0', '#f4ead8']), rnd(.06, .16), .2);
    // fibres
    c.lineCap = 'round';
    for (let i = 0; i < 3200; i++) {
      let x = rnd(0, W), y = rnd(0, H), a = rnd(0, Math.PI), L = rnd(8, 38);
      c.beginPath(); c.moveTo(x, y);
      for (let k = 0; k < 4; k++) { a += rnd(-.35, .35); x += Math.cos(a) * L / 4; y += Math.sin(a) * L / 4; c.lineTo(x, y); }
      c.strokeStyle = RNG() < .5 ? `rgba(160,140,110,${rnd(.05, .14)})` : `rgba(255,255,255,${rnd(.2, .5)})`; c.lineWidth = rnd(.5, 1.2); c.stroke();
    }
    // fine tooth
    const id = c.getImageData(0, 0, W, H), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = rnd(-7, 5); d[i] += n; d[i + 1] += n; d[i + 2] += n - 1; }
    c.putImageData(id, 0, 0);
    // vignette
    const g = c.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, W * .7); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,60,40,.16)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  });
}
// sprite helper: paint into an offscreen canvas in local coords [x0,y0]-[x1,y1] at resolution r
function canvasSprite(x0, y0, x1, y1, r, fn) {
  const cv = mkCanvas((x1 - x0) * r, (y1 - y0) * r), c = cv.getContext('2d');
  c.scale(r, r); c.translate(-x0, -y0); fn(c);
  return { cv, x0, y0, x1, y1, r };
}
function drawSprite(c, s, x = 0, y = 0, sc = 1) { c.drawImage(s.cv, x + s.x0 * sc, y + s.y0 * sc, (s.x1 - s.x0) * sc, (s.y1 - s.y0) * sc); }
