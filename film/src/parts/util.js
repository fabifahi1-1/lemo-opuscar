// Small helpers for the parts: word times from the timing sheet, a sunbeam with dust only inside it.
import { specks } from '../engine.js';
// [t0, t1] of the n-th word `w` (exact token, punctuation included or not) in line `id`
export function wt(id, w, n = 1) {
  const l = globalThis.TL.lines.find(x => x.id === id), clean = s => s.toLowerCase().replace(/[^a-z']/g, '');
  let k = 0; for (const x of l.wordtimes) if (clean(x.w) === clean(w) && ++k === n) return [x.t0, x.t1];
  throw new Error(`word ${w} not in ${id}`);
}
export const line = id => globalThis.TL.lines.find(x => x.id === id);
// a light shaft (world polygon at distance d) with dust drifting only inside it
export function beam(pts, d = 2.4, o = {}) {
  return (g, c) => {
    const P = pts.map(([x, y]) => c.p(x, y, d)); g.save(); g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
    const gr = g.createLinearGradient(P[0][0], P[0][1], P[2][0], P[2][1]); gr.addColorStop(0, `rgba(255,232,180,${o.top ?? .14})`); gr.addColorStop(1, 'rgba(255,232,180,.02)');
    g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fill(); g.globalCompositeOperation = 'source-over'; g.clip();
    specks(g, c.T, { n: o.n ?? 70, seed: o.seed ?? 5, col: o.col || [255, 240, 205], a: o.a ?? .5, r: 1.6 * Math.min(2.4, P[2][2] || 1), speed: 5, vx: 6 }); g.restore();
  };
}
export const still = 0;
// camera that puts world point (x, y) at distance d at screen fraction (fx, fy) for a given lens; optional end state
const solve = (X, Y, d, zoom, dz, fx, fy) => { const Z = zoom * d / (d - dz); return { zoom, dz, x: (X - (fx * 1920 - 960) / Z) * d / 2, y: (Y - (fy * 1080 - 540) / Z) * d / 2 }; };
export function aim(c, X, Y, d, zoom, fx = .5, fy = .4, to = {}, ease) {
  const a = solve(X, Y, d, zoom, to.dz0 ?? 0, fx, fy), b = solve(to.X ?? X, to.Y ?? Y, d, to.zoom ?? zoom, to.dz ?? .06, to.fx ?? fx, to.fy ?? fy);
  return c.cam(a, b, ease);
}
// the world point at distance d that is at screen fraction (fx, fy) for the current camera
export function atS(c, fx, fy, d = 2) { const cam = c.sc.cam, Z = cam.zoom * d / (d - cam.dz); return [cam.x * 2 / d + (fx * 1920 - 960) / Z, cam.y * 2 / d + (fy * 1080 - 540) / Z]; }
// head centres on the steps (world, d), for framing close-ups
export const HEAD = { tom: [-190, -140, 2.0], cat: [143, 13, 2.2] };
