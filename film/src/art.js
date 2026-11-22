// Drawing helpers and shared paper motifs (all in world px, y down, origin = the sheet's anchor)
import { mulberry, TAU, clamp, lerp } from './lib.js';
import { paint, Layer, dynSheet } from './engine.js';

export const PAL = {
  ink: '#1a1426', paper: '#f1e2c4',
  skin: '#e8b185', skinD: '#d69a6c', blush: '#f08c80', hair: '#5a3a26',
  orange: '#ee8a2e', orangeD: '#c9631b', white: '#fbf3e4', green: '#86d46c', pink: '#f4a1a0',
  tunic: '#9d6a42', pants: '#4a3b5a', shoe: '#2d2434', blue: '#3f6fc0', bread: '#e0a758', breadIn: '#f7dfa8',
};
export const cut = (g, fn) => { g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.strokeStyle = '#000'; fn(); g.restore(); };
export const rr = (g, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
export const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); };

// a ridge silhouette from x0 to x1, filled down to `bottom`; sum of sines + seeded bumps
export function ridge(g, { x0, x1, base, bottom, amp = 40, f = [.006, .017, .041], seed = 1, step = 8 }) {
  const R = mulberry(seed), ph = f.map(() => R() * TAU), w = [1, .5, .22];
  g.beginPath(); g.moveTo(x0, bottom);
  for (let x = x0; x <= x1 + 1; x += step) { let y = 0; f.forEach((ff, i) => { y += Math.sin(x * ff + ph[i]) * w[i]; }); g.lineTo(x, base - amp * (y + 1.2) / 2.4); }
  g.lineTo(x1, bottom); g.closePath(); g.fill();
}
export function fir(g, x, y, h, w = h * .42, tiers = 4) {   // a paper fir tree standing on (x,y)
  g.beginPath(); g.moveTo(x, y - h);
  for (let k = 0; k < tiers; k++) { const t = (k + 1) / tiers, yy = y - h * (1 - t); g.lineTo(x + w * (.28 + .72 * t) / 1, yy); g.lineTo(x + w * (.14 + .72 * t) * .5, yy - h * .04); }
  g.lineTo(x + 3, y + 2); g.lineTo(x - 3, y + 2);
  for (let k = tiers - 1; k >= 0; k--) { const t = (k + 1) / tiers, yy = y - h * (1 - t); g.lineTo(x - w * (.14 + .72 * t) * .5, yy - h * .04); g.lineTo(x - w * (.28 + .72 * t), yy); }
  g.closePath(); g.fill();
}
export function puffCloud(g, x, y, w, h, seed = 1) {   // flat-bottomed paper cloud from overlapping discs
  const R = mulberry(seed); g.beginPath(); const n = 6 + (R() * 3 | 0);
  g.moveTo(x - w / 2, y);
  for (let i = 0; i <= n; i++) { const t = i / n, cx = x - w / 2 + t * w, r = h * (.35 + .65 * Math.sin(Math.PI * t) * (.7 + .3 * R())); g.arc(cx, y - r * .55, r * .62, Math.PI, 0); }
  g.lineTo(x + w / 2, y); g.closePath(); g.fill();
}
export function tufts(g, x0, x1, y, h, seed = 1, gap = 14) {  // grass tufts / reeds along an edge
  const R = mulberry(seed); g.beginPath(); g.moveTo(x0, y + 400);
  for (let x = x0; x <= x1; x += gap * (.5 + R())) { const hh = h * (.4 + R() * .9); g.lineTo(x - 5, y); g.quadraticCurveTo(x + (R() - .5) * 12, y - hh * .6, x + (R() - .35) * 16, y - hh); g.lineTo(x + 5, y); }
  g.lineTo(x1, y + 400); g.closePath(); g.fill();
}
export function star5(g, x, y, r, rot = -Math.PI / 2) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5, rad = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } g.closePath(); }

// ---------- fonts ----------
export async function loadFonts() {
  await Promise.all([document.fonts.load('200px "Lilita One"', 'Puss in Boots'), document.fonts.load('500 44px Fredoka', 'Retold by Lantern and Page the mill'), document.fonts.load('100px "IM Fell English"', 'Retold by Lantern and Page'), document.fonts.load('italic 100px "IM Fell English"', 'Retold by Lantern and Page')]);
}
// a sheet of cut-paper text; returns { sheet, glyphs:[{ch, x, w}] } so letters can grow one by one
export function textRun(str, family, size, fill, { res = 1, fin, weight = '' } = {}) {
  const font = `${weight} ${size}px ${family}`.trim(); const m = document.createElement('canvas').getContext('2d'); m.font = font;
  const adv = [...str].map(ch => m.measureText(ch).width), total = adv.reduce((a, b) => a + b, 0);
  let x = -total / 2; const glyphs = [];
  [...str].forEach((ch, i) => { glyphs.push({ ch, x: x + adv[i] / 2, w: adv[i] }); x += adv[i]; });
  return { total, glyphs, size, font, fill, res, fin };
}
export function glyphLayers(run, o = {}) {   // one Layer per glyph, anchored at the bottom centre so it can grow upward
  const ls = [];
  for (const gl of run.glyphs) {
    if (gl.ch === ' ') continue;
    const w = Math.ceil(gl.w + run.size * .5), h = Math.ceil(run.size * 1.5);
    const sh = paint(w, h, g => { g.font = run.font; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = run.fill; g.fillText(gl.ch, 0, 0); }, { res: run.res, ax: w / 2, ay: h * .74, fin: run.fin });
    ls.push(new Layer({ sheet: sh, x: (o.x || 0) + gl.x, y: (o.y || 0), d: o.d, par: o.par ?? 1, z: o.z || 0, shadow: o.shadow ?? 'auto', trans: o.trans || 0, glyph: gl, sharp: true }));
  }
  return ls;
}
