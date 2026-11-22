// Paper lightbox compositor in plain Canvas2D (no WebGL): this machine has no GPU, and the three.js engine took 4-13 s a frame.
// Same look as the style: stacked cut-paper sheets, a lit rim and dark underside on every sheet, soft cast shadows,
// warm backlight through translucent paper, depth of field by pre-blurred sheets, bloom and vignette.
// World units are pixels of a 1920x1080 frame at zoom 1, origin at the screen centre, y down.
import { mulberry, clamp, lerp, TAU } from './lib.js';

export const W = 1920, H = 1080;
export const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

// ---------- paper grain and finish ----------
function makeGrain(n, seed) {
  const c = mk(n, n), x = c.getContext('2d'), R = mulberry(seed), img = x.createImageData(n, n), d = img.data;
  for (let i = 0; i < n * n; i++) { const v = R(); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v < .5 ? 0 : 255; d[i * 4 + 3] = Math.abs(v - .5) * 30; }
  x.putImageData(img, 0, 0); x.lineCap = 'round';
  for (let i = 0; i < n * 1.4; i++) {
    const px = R() * n, py = R() * n, a = R() * TAU, l = 5 + R() * 22;
    x.strokeStyle = R() < .5 ? 'rgba(40,30,20,.10)' : 'rgba(255,255,255,.16)'; x.lineWidth = .5 + R() * .8;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + .5) * l * .5, py + Math.sin(a + .5) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  return c;
}
export const GRAIN = makeGrain(512, 7);
// finish: fibre grain, a thin warm rim on the top edge and a dark band under the bottom edge (pixel space, y down)
export function finish(c, o = {}) {
  const x = c.getContext('2d'), Wc = c.width, Hc = c.height, res = o.res || 1;
  if (o.grain !== false) { x.save(); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = o.grainA ?? .8; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, Wc, Hc); x.restore(); }
  const band = (dy, col, blur) => {
    const t = mk(Wc, Hc), y = t.getContext('2d');
    y.drawImage(c, 0, 0); y.globalCompositeOperation = 'destination-out'; y.drawImage(c, 0, dy);
    y.globalCompositeOperation = 'source-in'; y.fillStyle = col; y.fillRect(0, 0, Wc, Hc);
    x.save(); x.globalCompositeOperation = 'source-atop'; if (blur) x.filter = `blur(${blur}px)`; x.drawImage(t, 0, 0); x.restore();
  };
  if (o.rim !== 0) band(-Math.max(1, Math.round((o.rimPx ?? 2.4) * res)), o.rimCol || `rgba(255,238,205,${o.rim ?? .42})`, .5 * res);   // lit top edge
  if (o.under !== 0) band(Math.max(1, Math.round((o.underPx ?? 3) * res)), `rgba(0,0,0,${o.under ?? .3})`, .7 * res);                       // dark bottom edge
  return c;
}

// ---------- sheets ----------
// paint(w, h, fn, { res, ax, ay, fin }): fn(g, res) draws with the origin at the anchor (default centre), y down, in world px
export class Sheet {
  constructor(c, ax, ay, res) { this.c = c; this.ax = ax; this.ay = ay; this.res = res; this.cache = new Map(); }
  get w() { return this.c.width / this.res; } get h() { return this.c.height / this.res; }
  blurred(r) {    // r in world px; cached; returns { c, ax, ay } with padding
    r = Math.round(r * 2) / 2; if (r <= .4) return this;
    const k = 'b' + r; if (this.cache.has(k)) return this.cache.get(k);
    const pad = Math.ceil(r * this.res * 2.5), c = mk(this.c.width + pad * 2, this.c.height + pad * 2), g = c.getContext('2d');
    g.filter = `blur(${r * this.res}px)`; g.drawImage(this.c, pad, pad);
    const s = { c, ax: this.ax + pad, ay: this.ay + pad, res: this.res }; this.cache.set(k, s); return s;
  }
  shadow(r) {     // black silhouette blurred by r
    const k = 's' + r; if (this.cache.has(k)) return this.cache.get(k);
    const pad = Math.ceil(r * this.res * 2.5), c = mk(this.c.width + pad * 2, this.c.height + pad * 2), g = c.getContext('2d');
    const t = mk(this.c.width, this.c.height), tg = t.getContext('2d'); tg.drawImage(this.c, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = '#000'; tg.fillRect(0, 0, t.width, t.height);
    g.filter = `blur(${r * this.res}px)`; g.drawImage(t, pad, pad);
    const s = { c, ax: this.ax + pad, ay: this.ay + pad, res: this.res }; this.cache.set(k, s); return s;
  }
}
export function paint(w, h, fn, o = {}) {
  const res = o.res ?? 1, ax = o.ax ?? w / 2, ay = o.ay ?? h / 2, c = mk(w * res, h * res), g = c.getContext('2d');
  g.scale(res, res); g.translate(ax, ay); fn(g, res); g.setTransform(1, 0, 0, 1, 0, 0);
  if (o.finish !== false) finish(c, { ...(o.fin || {}), res });
  return new Sheet(c, ax * res, ay * res, res);
}
// a sprite whose canvas is redrawn every frame (puppets, text that grows)
export function dynSheet(w, h, res = 1, ax, ay) {
  const c = mk(w * res, h * res); const s = new Sheet(c, (ax ?? w / 2) * res, (ay ?? h / 2) * res, res); s.dyn = true; s.g = c.getContext('2d'); return s;
}

// ---------- layers ----------
// o: { sheet, x, y, z, par, zk, rot, sx, sy, alpha, trans, shadow:{dx,dy,blur,a}, blur, lit, tint:[r,g,b] mult, draw(g, info) custom }
export class Layer {
  constructor(o) { Object.assign(this, { x: 0, y: 0, z: 0, par: 1, rot: 0, sx: 1, sy: 1, alpha: 1, trans: 0, shadow: null, blur: 0, vis: true, flipX: false }, o); if (this.zk === undefined) this.zk = .35 + .65 * clamp(this.par / 1.5); }
}

const SC = mk(W, H), sg = SC.getContext('2d');          // scratch for the backlit pass
let gradCache = new Map();
function lightGrad(g, L, cx, cy, r) { return g.createRadialGradient(cx, cy, 0, cx, cy, r); }

// Draw one scene at the camera. scene: { bg, layers, light:{x,y,r,col:[r,g,b],floor}, cam:{x,y,zoom,roll}, fx:[fn(g,info)], grade }
export function drawScene(g, sc) {
  const cam = sc.cam, L = sc.light || { x: 0, y: -100, r: 900, col: [255, 214, 150], floor: .35 };
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = sc.bg || '#000'; g.fillRect(0, 0, W, H);
  const ls = sc.layers.filter(l => l.vis && l.alpha > .002).sort((a, b) => a.z - b.z);
  for (const l of ls) {
    const Z = 1 + (cam.zoom - 1) * l.zk;
    const px = W / 2 + (l.x - cam.x * l.par) * Z, py = H / 2 + (l.y - cam.y * l.par) * Z;
    const info = { cam, Z, px, py, g };
    if (l.draw) { g.save(); l.draw(g, info, l); g.restore(); continue; }
    let s = l.sheet; if (!s) continue;
    if (s.dyn && l.update) l.update(s);
    const sp = l.blur > .4 ? (s.dyn ? s : s.blurred(l.blur)) : s;
    const sc2 = Z / sp.res;
    const put = (gg, spr, ox = 0, oy = 0) => {
      gg.save(); gg.translate(px + ox * Z, py + oy * Z); gg.rotate((l.rot || 0) + (cam.roll || 0) * l.zk); gg.scale(sc2 * (l.sx * (l.flipX ? -1 : 1)), sc2 * l.sy);
      gg.drawImage(spr.c, -spr.ax, -spr.ay); gg.restore();
    };
    // cull
    const hw = (sp.c.width / sp.res) * Z * Math.max(1, Math.abs(l.sx)) * .75 + 40, hh = (sp.c.height / sp.res) * Z * Math.max(1, Math.abs(l.sy)) * .75 + 40;
    const rad = Math.hypot(hw, hh); if (px + rad < 0 || px - rad > W || py + rad < 0 || py - rad > H) continue;
    // soft shadow onto everything behind
    if (l.shadow && !s.dyn) {
      const sh = s.shadow(l.shadow.blur ?? 7); g.globalAlpha = (l.shadow.a ?? .32) * l.alpha;
      g.save(); g.translate(px + (l.shadow.dx || 0) * Z, py + (l.shadow.dy ?? 9) * Z); g.rotate(l.rot || 0); g.scale(Z / sh.res * l.sx * (l.flipX ? -1 : 1), Z / sh.res * l.sy); g.drawImage(sh.c, -sh.ax, -sh.ay); g.restore(); g.globalAlpha = 1;
    } else if (l.shadow && s.dyn) {
      g.globalAlpha = (l.shadow.a ?? .3) * l.alpha; g.filter = `blur(${(l.shadow.blur ?? 6) * Z}px) brightness(0)`; put(g, sp, l.shadow.dx || 0, l.shadow.dy ?? 8); g.filter = 'none'; g.globalAlpha = 1;
    }
    // the paper itself (front light baked into its colour)
    const filt = ((l.blur > .4 && s.dyn) ? `blur(${l.blur * Z}px) ` : '') + ((l.bright !== undefined && l.bright < .99) ? `brightness(${l.bright}) ` : '') + (l.sat ? `saturate(${l.sat})` : '');
    if (filt) g.filter = filt;
    g.globalAlpha = l.alpha; put(g, sp); g.globalAlpha = 1; if (filt) g.filter = 'none';
    // light through the paper
    if (l.trans > .02 && (l.bright === undefined || l.bright > .15)) {
      const lx = W / 2 + (L.x - cam.x * .5) * 1, ly = H / 2 + (L.y - cam.y * .5) * 1;   // light follows the camera a little
      sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, W, H);
      sg.globalAlpha = 1; put(sg, sp);
      sg.globalCompositeOperation = 'multiply';
      const gr = lightGrad(sg, L, lx, ly, L.r * Z), [r, gg2, b] = L.col, fl = L.floor ?? .35, f = v => Math.round(v);
      gr.addColorStop(0, `rgb(${r},${gg2},${b})`); gr.addColorStop(.55, `rgb(${f(r * (.35 + .65 * fl))},${f(gg2 * (.35 + .65 * fl))},${f(b * (.35 + .65 * fl))})`); gr.addColorStop(1, `rgb(${f(r * fl)},${f(gg2 * fl)},${f(b * fl)})`);
      sg.fillStyle = gr; sg.fillRect(0, 0, W, H);
      sg.globalCompositeOperation = 'destination-in'; put(sg, sp);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = l.trans * l.alpha * (l.lit ?? 1) * (sc.litGain ?? 1) * (l.bright ?? 1); g.drawImage(SC, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
  }
  for (const f of sc.fx || []) { g.save(); f(g, { cam, sc }); g.restore(); }
  post(g, sc);
}

// ---------- post: bloom, grade, vignette ----------
const BL = mk(W / 4, H / 4), bg = BL.getContext('2d'), BL2 = mk(W / 4, H / 4), bg2 = BL2.getContext('2d');
function post(g, sc) {
  const P = { bloom: .3, vig: .38, tint: [255, 247, 235], tintA: 0, fade: 1, ...(sc.post || {}) };
  if (P.bloom > 0) {
    bg.globalCompositeOperation = 'source-over'; bg.filter = 'none'; bg.clearRect(0, 0, W / 4, H / 4);
    bg.filter = 'brightness(.85) contrast(2.6)'; bg.drawImage(g.canvas, 0, 0, W / 4, H / 4); bg.filter = 'none';
    bg2.clearRect(0, 0, W / 4, H / 4); bg2.filter = 'blur(9px)'; bg2.drawImage(BL, 0, 0); bg2.filter = 'none';
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = P.bloom; g.drawImage(BL2, 0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  if (P.tintA > 0) { g.globalCompositeOperation = 'multiply'; g.globalAlpha = P.tintA; g.fillStyle = `rgb(${P.tint})`; g.fillRect(0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  if (P.vig > 0) {
    const v = g.createRadialGradient(W / 2, H / 2, H * .34, W / 2, H / 2, H * 1.0); v.addColorStop(0, 'rgba(6,4,14,0)'); v.addColorStop(1, `rgba(6,4,14,${P.vig})`);
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  }
  if (P.fade < 1) { g.fillStyle = `rgba(0,0,0,${1 - P.fade})`; g.fillRect(0, 0, W, H); }
}

// ---------- additive helpers for fx ----------
export function glow(g, x, y, r, col, a = 1) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a})`); gr.addColorStop(.4, `rgba(${col[0]},${col[1]},${col[2]},${a * .32})`); gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
  g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.globalCompositeOperation = 'source-over';
}
// drifting specks (candle dust, flour, pollen): deterministic, wraps around the frame
export function specks(g, t, o) {
  const R = mulberry(o.seed || 1), n = o.n || 40; g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const bx = R() * (o.w || W), by = R() * (o.h || H), sp = (o.speed ?? 12) * (.4 + R()), ph = R() * TAU, r = (o.r ?? 2.2) * (.5 + R());
    const x = ((bx + Math.sin(t * .35 + ph) * 20 + (o.vx ?? 4) * t * (.5 + R())) % (o.w || W) + (o.w || W)) % (o.w || W);
    const y = (((by - sp * t * (o.up ?? 1)) % (o.h || H)) + (o.h || H)) % (o.h || H);
    const tw = .55 + .45 * Math.sin(t * 2.1 + ph * 3), a = (o.a ?? .5) * tw;
    const gr = g.createRadialGradient(x, y, 0, x, y, r * 3); const c = o.col || [255, 214, 150];
    gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  }
  g.globalCompositeOperation = 'source-over';
}
