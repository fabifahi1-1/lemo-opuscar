// Part self-check: for every shot, render two moments 0.3 s apart and measure (1) how much the picture changes and
// (2) how many paper layers move on screen; save a frame every 2 s for review.  usage: node part_check.mjs FROM TO OUTDIR
import { openDemo, closeServer } from '/home/user/lemo-opuscar/core/render/page.mjs';
import fs from 'fs';
const [A, B, OUT] = [+process.argv[2], +process.argv[3], process.argv[4]]; fs.mkdirSync(OUT, { recursive: true });
const TL = JSON.parse(fs.readFileSync('/home/user/lemo-opuscar/film/data/timing.json'));
const { browser, page } = await openDemo('film', {});
const grab = async t => page.evaluate(t => { window.render(t); const c = document.getElementById('c'), s = document.createElement('canvas'); s.width = 240; s.height = 135; s.getContext('2d').drawImage(c, 0, 0, 240, 135); const d = s.getContext('2d').getImageData(0, 0, 240, 135).data; return { px: Array.from(d.filter((_, i) => i % 4 !== 3)), lay: (globalThis.LAST_SCENE?.placedAll || []).map(a => a.slice(0, 3)) }; }, t);
const rows = [];
for (const s of TL.shots) {
  if (s.t1 <= A || s.t0 >= B) continue;
  const vis = []; let t = s.t0; for (const c of [...(s.cards || [])].sort((a, b) => a.t0 - b.t0)) { if (c.t0 - t > .45) vis.push([t, c.t0]); t = Math.max(t, c.t1); } if (s.t1 - t > .45) vis.push([t, s.t1]);
  for (const [a, b] of vis) {
    const t1 = a + (b - a) * .35, t2 = Math.min(b - .05, t1 + .3), f1 = await grab(t1), f2 = await grab(t2);
    let diff = 0; for (let i = 0; i < f1.px.length; i++) diff += Math.abs(f1.px[i] - f2.px[i]); diff /= f1.px.length;
    let moving = 0; const n = Math.min(f1.lay.length, f2.lay.length); for (let i = 0; i < n; i++) { const [x1, y1, z1] = f1.lay[i], [x2, y2, z2] = f2.lay[i]; if (Math.hypot(x1 - x2, y1 - y2) > .3 || Math.abs(z1 - z2) / z1 > .0015) moving++; }
    rows.push({ key: s.key, t0: +a.toFixed(2), t1: +b.toFixed(2), diff: +diff.toFixed(2), layers: n, moving });
  }
  for (const c of s.cards || []) { await page.evaluate(t => window.render(t), c.noun_t1 + .02); await page.screenshot({ path: `${OUT}/card_${c.text.replace(/ /g, '_')}.jpg`, type: 'jpeg', quality: 80 }); }
}
for (let t = Math.ceil(A / 2) * 2; t < B; t += 2) { await page.evaluate(t => window.render(t), t + .01); await page.screenshot({ path: `${OUT}/f_${String(t).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 80 }); }
fs.writeFileSync(`${OUT}/shots.json`, JSON.stringify(rows, null, 1));
for (const r of rows) console.log(r.key.padEnd(11), r.t0, '-', r.t1, 'diff', r.diff, 'moving', r.moving + '/' + r.layers, (r.diff < .15 ? ' STILL?' : '') + (r.moving < 4 ? ' FEW LAYERS' : ''));
await browser.close(); closeServer();
