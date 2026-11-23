// Paper lightbox compositor in plain Canvas2D (no WebGL on this machine).
// Every layer has a real distance from the camera (d, in "box units"; the action layer is at D0 = 2):
//   - the camera dollies forward (cam.dz): a layer's scale is zoom * d / (d - dz), so near layers grow and leave the frame faster than far ones;
//   - a sideways camera move slides each layer by cam.x * D0 / d (parallax);
//   - each layer casts a soft shadow on the layers behind it, offset away from the scene's light, bigger and softer with the depth gap;
//   - depth of field: layers away from the focus distance are blurred (far 2-6 px, near 6-14 px);
//   - aerial perspective: far layers fade toward the haze colour.
// World units are pixels of a 1920x1080 frame for a layer at d = D0 with zoom 1; origin at the screen centre, y down.
import { mulberry, clamp, lerp, TAU } from './lib.js';

export const W = 1920, H = 1080, D0 = 2;
export const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; return c; };

// ---------- the light used while painting sheets (direction FROM the light, screen space) ----------
let LIGHT = [.62, .78];
export function setLight(dx, dy) { const n = Math.hypot(dx, dy) || 1; LIGHT = [dx / n, dy / n]; }
export const lightDir = () => LIGHT;

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
// finish: fibre grain; a thin warm rim on the edges that face the light; a dark band on the edges away from it;
// a soft shadow side across the sheet (away from the light)
export function finish(c, o = {}) {
  const x = c.getContext('2d'), Wc = c.width, Hc = c.height, res = o.res || 1, [lx, ly] = o.light || LIGHT;
  if (o.grain !== false) { x.save(); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = o.grainA ?? .8; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, Wc, Hc); x.restore(); }
  const band = (dx, dy, col, blur) => {
    const t = mk(Wc, Hc), y = t.getContext('2d');
    y.drawImage(c, 0, 0); y.globalCompositeOperation = 'destination-out'; y.drawImage(c, dx, dy);
    y.globalCompositeOperation = 'source-in'; y.fillStyle = col; y.fillRect(0, 0, Wc, Hc);
    x.save(); x.globalCompositeOperation = 'source-atop'; if (blur) x.filter = `blur(${blur}px)`; x.drawImage(t, 0, 0); x.restore();
  };
  const rp = Math.max(1, (o.rimPx ?? 2.6) * res), up = Math.max(1, (o.underPx ?? 3) * res);
  if (o.rim !== 0) band(lx * rp, ly * rp, o.rimCol || `rgba(255,232,190,${o.rim ?? .5})`, .5 * res);       // lit edge (faces the light)
  if (o.under !== 0) band(-lx * up, -ly * up, `rgba(20,8,0,${o.under ?? .32})`, .8 * res);              // dark edge (away from the light)
  if (o.side !== 0) {                                                                                 // shadow side across the sheet
    const gr = x.createLinearGradient(Wc / 2 - lx * Wc / 2, Hc / 2 - ly * Hc / 2, Wc / 2 + lx * Wc / 2, Hc / 2 + ly * Hc / 2);
    gr.addColorStop(0, 'rgba(255,240,215,0)'); gr.addColorStop(.55, 'rgba(30,12,0,0)'); gr.addColorStop(1, `rgba(30,12,0,${o.side ?? .16})`);
    x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = gr; x.fillRect(0, 0, Wc, Hc); x.restore();
  }
  return c;
}

// ---------- sheets ----------
export class Sheet {
  constructor(c, ax, ay, res) { this.c = c; this.ax = ax; this.ay = ay; this.res = res; this.cache = new Map(); }
  variant(key, make) { if (!this.cache.has(key)) this.cache.set(key, make()); return this.cache.get(key); }
  blurred(r) {    // r in sheet px (already * res); cached in 0.5 px steps
    r = Math.round(r * 2) / 2; if (r <= .4) return this;
    return this.variant('b' + r, () => {
      const pad = Math.ceil(r * 2.5), c = mk(this.c.width + pad * 2, this.c.height + pad * 2), g = c.getContext('2d');
      g.filter = `blur(${r}px)`; g.drawImage(this.c, pad, pad);
      return { c, ax: this.ax + pad, ay: this.ay + pad, res: this.res };
    });
  }
  hazed(col, a) {  // aerial perspective baked into a copy
    a = Math.round(a * 20) / 20; if (a <= .02) return this;
    return this.variant('h' + col + a, () => { const c = mk(this.c.width, this.c.height), g = c.getContext('2d'); g.drawImage(this.c, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); const s = new Sheet(c, this.ax, this.ay, this.res); return s; });
  }
  shadow(r) {     // black silhouette blurred by r sheet px
    r = Math.round(r); return this.variant('s' + r, () => {
      const pad = Math.ceil(r * 2.5), c = mk(this.c.width + pad * 2, this.c.height + pad * 2), g = c.getContext('2d');
      const t = mk(this.c.width, this.c.height), tg = t.getContext('2d'); tg.drawImage(this.c, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = '#000'; tg.fillRect(0, 0, t.width, t.height);
      g.filter = `blur(${r}px)`; g.drawImage(t, pad, pad);
      return { c, ax: this.ax + pad, ay: this.ay + pad, res: this.res };
    });
  }
}
export function paint(w, h, fn, o = {}) {
  const res = o.res ?? 1, ax = o.ax ?? w / 2, ay = o.ay ?? h / 2, c = mk(w * res, h * res), g = c.getContext('2d');
  g.scale(res, res); g.translate(ax, ay); fn(g, res); g.setTransform(1, 0, 0, 1, 0, 0);
  if (o.finish !== false) finish(c, { ...(o.fin || {}), res });
  return new Sheet(c, ax * res, ay * res, res);
}
export function dynSheet(w, h, res = 1, ax, ay) {
  const c = mk(w * res, h * res); const s = new Sheet(c, (ax ?? w / 2) * res, (ay ?? h / 2) * res, res); s.dyn = true; s.g = c.getContext('2d'); s.g.imageSmoothingQuality = 'high'; return s;
}

// ---------- layers ----------
// o: { sheet, x, y, z (draw order), d (distance; default D0/par), rot, sx, sy, alpha, trans, lit,
//      shadow: 'auto' (default) | false | {dx,dy,blur,a}, blur: 'auto' (default) | px, sharp, haze: 'auto' | 0..1,
//      bright, sat, pre(g, info, l) drawn just before the paper, draw(g, info, l) custom }
export class Layer {
  constructor(o) {
    Object.assign(this, { x: 0, y: 0, z: 0, par: 1, rot: 0, sx: 1, sy: 1, alpha: 1, trans: 0, shadow: 'auto', blur: 'auto', haze: 'auto', vis: true, flipX: false }, o);
    if (this.d === undefined) this.d = D0 / Math.max(.02, this.par);
  }
}
// screen transform of a layer under a camera
export function place(l, cam) {
  const dz = cam.dz || 0, rel = l.d - dz;
  if (rel < .12) return null;
  const Z = (cam.zoom || 1) * l.d / rel, k = D0 / l.d;
  return { Z, px: W / 2 + (l.x - (cam.x || 0) * k) * Z + (cam.sx || 0), py: H / 2 + (l.y - (cam.y || 0) * k) * Z + (cam.sy || 0) };
}
export const project = (x, y, d, cam) => place({ x, y, d }, cam);

const SC = mk(W, H), sg = SC.getContext('2d');          // scratch for the backlit pass

// scene: { bg, layers, light:{x,y,r,col,floor}, lightDir:[dx,dy], focus (distance), haze:{col}, cam:{x,y,zoom,dz,roll}, fx:[fn], pre:[fn], post }
export function drawScene(g, sc) {
  const cam = sc.cam, L = sc.light || { x: 0, y: -100, r: 900, col: [255, 214, 150], floor: .35 }, LD = sc.lightDir || [.62, .78];
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  g.fillStyle = sc.bg || '#000'; g.fillRect(0, 0, W, H);
  for (const f of sc.pre || []) { g.save(); f(g, { cam, sc }); g.restore(); }
  const ls = sc.layers.filter(l => l.vis && l.alpha > .002).sort((a, b) => a.z - b.z);
  sc.placedAll = [];
  let prevD = null;
  for (const l of ls) {
    const P = place(l, cam); if (!P) continue;
    const { Z, px, py } = P, info = { cam, Z, px, py, g, sc };
    if (l.name) (sc.placed ||= {})[l.name] = { px, py, Z };
    sc.placedAll.push([px, py, Z, l.d]);
    if (l.draw) { g.save(); l.draw(g, info, l); g.restore(); if (!l.noDepth) prevD = l.d; continue; }
    let s = l.sheet; if (!s) continue;
    if (s.dyn && l.update) l.update(s);
    // aerial perspective
    let base = s;
    const hz = l.haze === 'auto' ? (sc.haze ? clamp((l.d - (sc.haze.from ?? 3.5)) / (sc.haze.span ?? 12), 0, sc.haze.max ?? .4) : 0) : (l.haze || 0);
    if (hz > .02 && !s.dyn) base = s.hazed(sc.haze?.col || '#c9d8ec', hz);
    // depth of field (screen px)
    let B = 0;
    if (l.blur === 'auto') {
      if (sc.focus && !l.sharp) {
        const r = l.d / sc.focus;
        if (r > 1.18) B = clamp(2 + (r - 1.18) * 2.4, 2, 6);
        else if (r < .84) B = clamp(6 + (1 / r - 1.19) * 9, 6, 14);
        else B = 0;
        if (l.dofK !== undefined) B *= l.dofK;
      }
    } else B = l.blur || 0;
    if (sc.blurOverride && sc.blurOverride.has(l)) B = sc.blurOverride.get(l);
    const sp = (B > .45 && !s.dyn) ? base.blurred(B / Z * base.res) : base;
    const sc2 = Z / sp.res;
    const put = (gg, spr, ox = 0, oy = 0, skew = 0) => {
      gg.save(); gg.translate(px + ox * Z, py + oy * Z); if (skew) gg.transform(1, 0, skew, 1, 0, 0); gg.rotate((l.rot || 0) + (cam.roll || 0));
      gg.scale(sc2 * (l.sx * (l.flipX ? -1 : 1)), sc2 * l.sy); gg.drawImage(spr.c, -spr.ax, -spr.ay); gg.restore();
    };
    const hw = (sp.c.width / sp.res) * Z * Math.max(1, Math.abs(l.sx)) * .75 + 60, hh = (sp.c.height / sp.res) * Z * Math.max(1, Math.abs(l.sy)) * .75 + 60;
    const rad = Math.hypot(hw, hh); if (px + rad < 0 || px - rad > W || py + rad < 0 || py - rad > H) { prevD = l.d; continue; }
    // soft cast shadow on the layer(s) behind: offset away from the light, bigger and softer with the depth gap
    if (l.shadow && !globalThis.MASKS) {
      let dx, dy, bl, a;
      if (l.shadow === 'auto') {
        const gap = prevD == null ? .4 : clamp(prevD - l.d, .05, 30);
        const off = clamp(6 + gap * 9, 6, 30); bl = clamp(8 + gap * 5, 8, 20); a = clamp(.4 - gap * .02, .25, .4);
        dx = LD[0] * off; dy = LD[1] * off;
      } else { dx = l.shadow.dx ?? LD[0] * 10; dy = l.shadow.dy ?? LD[1] * 10; bl = l.shadow.blur ?? 10; a = l.shadow.a ?? .32; }
      if (!s.dyn) {
        const sh = s.shadow(bl / Z * s.res); g.globalAlpha = a * l.alpha;
        g.save(); g.translate(px + dx, py + dy); g.rotate(l.rot || 0); g.scale(Z / sh.res * l.sx * (l.flipX ? -1 : 1), Z / sh.res * l.sy); g.drawImage(sh.c, -sh.ax, -sh.ay); g.restore(); g.globalAlpha = 1;
      } else {
        g.globalAlpha = a * l.alpha; g.filter = `blur(${bl}px) brightness(0)`; put(g, sp, dx / Z, dy / Z); g.filter = 'none'; g.globalAlpha = 1;
      }
    }
    if (l.pre && !globalThis.MASKS) { g.save(); l.pre(g, info, l); g.restore(); }   // (measurement mode draws no shadows)
    // the paper itself
    const filt = ((B > .45 && s.dyn) ? `blur(${B}px) ` : '') + ((l.bright !== undefined && l.bright < .99) ? `brightness(${l.bright}) ` : '') + (l.sat ? `saturate(${l.sat})` : '');
    const MK = globalThis.MASKS && l.name && globalThis.MASKS[l.name];
    if (filt && !MK) g.filter = filt;
    if (MK) {   // measurement mode: this layer in one flat colour (occlusion by nearer layers is kept)
      sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, W, H); sg.globalAlpha = 1; put(sg, sp); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = MK; sg.fillRect(0, 0, W, H);
      g.drawImage(SC, 0, 0); if (l.after) { g.save(); l.after(g, info, l); g.restore(); } prevD = l.d; continue;
    }
    g.globalAlpha = l.alpha; put(g, sp); g.globalAlpha = 1; if (filt) g.filter = 'none';
    // light through the paper (backlight)
    if (l.trans > .02) {
      const lx = W / 2 + L.x, ly = H / 2 + L.y;
      sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, W, H); sg.filter = filt || 'none';
      sg.globalAlpha = 1; put(sg, sp); sg.filter = 'none';
      sg.globalCompositeOperation = 'multiply';
      const gr = sg.createRadialGradient(lx, ly, 0, lx, ly, L.r), [r, gg2, b] = L.col, fl = L.floor ?? .35, f = v => Math.round(v);
      gr.addColorStop(0, `rgb(${r},${gg2},${b})`); gr.addColorStop(.55, `rgb(${f(r * (.35 + .65 * fl))},${f(gg2 * (.35 + .65 * fl))},${f(b * (.35 + .65 * fl))})`); gr.addColorStop(1, `rgb(${f(r * fl)},${f(gg2 * fl)},${f(b * fl)})`);
      sg.fillStyle = gr; sg.fillRect(0, 0, W, H);
      sg.globalCompositeOperation = 'destination-in'; put(sg, sp);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = l.trans * l.alpha * (l.lit ?? 1) * (sc.litGain ?? 1) * (l.bright ?? 1); g.drawImage(SC, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    if (l.after) { g.save(); l.after(g, info, l); g.restore(); }
    prevD = l.d;
  }
  globalThis.LAST_SCENE = sc;
  if (globalThis.MASKS) return;   // measurement mode: no effects, no grade
  for (const f of sc.fx || []) { g.save(); f(g, { cam, sc }); g.restore(); }
  post(g, sc);
}

// ---------- post: bloom, grade, vignette ----------
const BL = mk(W / 4, H / 4), bg = BL.getContext('2d'), BL2 = mk(W / 4, H / 4), bg2 = BL2.getContext('2d');
export const VIGNETTE = .13;   // the frame's edge is 13 % darker than its centre (corners a little more)
function post(g, sc) {
  const P = { bloom: .2, vig: VIGNETTE, tint: [255, 247, 235], tintA: 0, fade: 1, ...(sc.post || {}) };
  if (P.bloom > 0) {
    bg.globalCompositeOperation = 'source-over'; bg.filter = 'none'; bg.clearRect(0, 0, W / 4, H / 4);
    bg.filter = 'brightness(.85) contrast(2.6)'; bg.drawImage(g.canvas, 0, 0, W / 4, H / 4); bg.filter = 'none';
    bg2.clearRect(0, 0, W / 4, H / 4); bg2.filter = 'blur(9px)'; bg2.drawImage(BL, 0, 0); bg2.filter = 'none';
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = P.bloom; g.drawImage(BL2, 0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  if (P.tintA > 0) { g.globalCompositeOperation = 'multiply'; g.globalAlpha = P.tintA; g.fillStyle = `rgb(${P.tint})`; g.fillRect(0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  vignette(g, P.vig);
  if (P.fade < 1) { g.fillStyle = `rgba(0,0,0,${1 - P.fade})`; g.fillRect(0, 0, W, H); }
}
// darkens by `v` at the middle of each edge (ellipse through the edge midpoints), a little more in the corners
export function vignette(g, v) {
  if (!(v > 0)) return;
  g.save(); g.translate(W / 2, H / 2); g.scale(1, H / W);
  const r = W / 2, gr = g.createRadialGradient(0, 0, 0, 0, 0, r * 1.42);   // 1.0 r = the middle of each edge, 1.42 r = the corners
  gr.addColorStop(0, 'rgba(8,4,12,0)'); gr.addColorStop(.32, 'rgba(8,4,12,0)'); gr.addColorStop(.704, `rgba(8,4,12,${v})`); gr.addColorStop(1, `rgba(8,4,12,${Math.min(.3, v * 1.6)})`);
  g.fillStyle = gr; g.fillRect(-r * 1.5, -r * 1.5, r * 3, r * 3);
  g.restore();
}

// ---------- additive helpers for fx ----------
export function glow(g, x, y, r, col, a = 1) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a})`); gr.addColorStop(.4, `rgba(${col[0]},${col[1]},${col[2]},${a * .32})`); gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
  g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.globalCompositeOperation = 'source-over';
}
// drifting specks (dust in a light beam): deterministic, wraps around the given box
export function specks(g, t, o) {
  const R = mulberry(o.seed || 1), n = o.n || 40, bx0 = o.x0 || 0, by0 = o.y0 || 0, bw = o.w || W, bh = o.h || H; g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const bx = R() * bw, by = R() * bh, sp = (o.speed ?? 12) * (.4 + R()), ph = R() * TAU, r = (o.r ?? 2.2) * (.5 + R());
    const x = bx0 + ((bx + Math.sin(t * .35 + ph) * 20 + (o.vx ?? 4) * t * (.5 + R())) % bw + bw) % bw;
    const y = by0 + (((by - sp * t * (o.up ?? 1)) % bh) + bh) % bh;
    const tw = .55 + .45 * Math.sin(t * 2.1 + ph * 3), a = (o.a ?? .5) * tw;
    const gr = g.createRadialGradient(x, y, 0, x, y, r * 3); const c = o.col || [255, 214, 150];
    gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  }
  g.globalCompositeOperation = 'source-over';
}
