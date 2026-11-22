// Do the fingers stay put on the bread? For every frame of a span, take Tom's rig and map the four fingertips and the
// thumb tip into the loaf's own coordinates. Anything that moves there slides on the bread. usage: node hands_check.mjs FROM TO
import { openDemo, closeServer } from '/home/user/lemo-opuscar/core/render/page.mjs';
const [A, B] = process.argv.slice(2).map(Number), FPS = 24;
const { browser, page } = await openDemo('film', {});
const rows = [];
for (let f = Math.ceil(A * FPS); f / FPS < B; f++) {
  const t = f / FPS;
  rows.push(await page.evaluate(t => {
    window.render(t); const sc = globalThis.LAST_SCENE, rig = sc.hires ? sc.tomHi : sc.tomLo, P = rig.parts;
    const loc = p => { const c = Math.cos(p.rot), s = Math.sin(p.rot); return [c * p.sx, s * p.sx, -s * p.sy, c * p.sy, p.jx, p.jy]; };
    const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
    const tips = [[-50, -12], [-50, -3], [-50, 6], [-48, 14]], out = {};
    for (const h of ['handL', 'handR']) tips.forEach((q, i) => out[h + i] = ap(loc(P[h]), ...q));   // hands are children of the bread
    for (const h of ['thumbL', 'thumbR']) out[h] = ap(loc(P[h]), 52, 0);
    return { t, vis: sc.tomL?.vis !== false, out };
  }, t));
}
await browser.close(); closeServer();
const r0 = rows[0].out; let report = [];
for (const r of rows) {
  let fing = 0, thumb = 0;
  for (const k in r.out) { const dd = Math.hypot(r.out[k][0] - r0[k][0], r.out[k][1] - r0[k][1]); if (k.startsWith('thumb')) thumb = Math.max(thumb, dd); else fing = Math.max(fing, dd); }
  report.push({ t: +r.t.toFixed(3), fingerMovePx: +fing.toFixed(2), thumbMovePx: +thumb.toFixed(2) });
}
for (const r of report) console.log(r.t.toFixed(3), 'fingers', r.fingerMovePx, 'thumb', r.thumbMovePx);
const moving = report.filter(r => r.fingerMovePx > .05).map(r => r.t);
console.log('frames:', report.length, '| fingers move (vs the first frame) in', moving.length, 'frames', moving.length ? `${moving[0]}–${moving.at(-1)} s` : '', '| max finger move', Math.max(...report.map(r => r.fingerMovePx)), 'px (puppet units) | max thumb move', Math.max(...report.map(r => r.thumbMovePx)));
