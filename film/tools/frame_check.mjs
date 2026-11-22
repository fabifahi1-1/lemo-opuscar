// Measure frames of the sample: node film/tools/frame_check.mjs  -> JSON on stdout
// mask colours: tom f00, puss 00f, steps f0f, sky 0f0, mill ff0. Pixel counts and bounding boxes are read from the canvas.
import { openDemo, closeServer } from '/home/user/lemo-opuscar/core/render/page.mjs';
const out = {};
const measure = async (q, times) => {
  const { browser, page } = await openDemo('film', { q });
  const res = {};
  for (const t of times) {
    res[t] = await page.evaluate(t => {
      window.render(t);
      const c = document.getElementById('c'), x = c.getContext('2d'), d = x.getImageData(0, 0, 1920, 1080).data;
      const cols = { tom: [255, 0, 0], puss: [0, 0, 255], steps: [255, 0, 255], sky: [0, 255, 0], mill: [255, 255, 0], lantern: [0, 255, 255] }, r = {};
      for (const [k, [R, G, B]] of Object.entries(cols)) { let n = 0, y0 = 1e9, y1 = -1, x0 = 1e9, x1 = -1; for (let i = 0, p = 0; i < d.length; i += 4, p++) if (Math.abs(d[i] - R) < 40 && Math.abs(d[i + 1] - G) < 40 && Math.abs(d[i + 2] - B) < 40) { n++; const yy = (p / 1920) | 0, xx = p % 1920; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; } if (n) r[k] = { frac: +(n / (1920 * 1080)).toFixed(4), x0, x1, y0, y1, h: y1 - y0 + 1 }; }
      r.placed = window.PLACED(); return r;
    }, t);
  }
  await browser.close(); return res;
};
out.steps = await measure('mask=tom:f00,puss:00f,steps:f0f', [12.6, 18.9, 19.6]);
out.table = await measure('mask=lantern:0ff,book:0ff', [1.0, 2.0]);
out.mill = await measure('mask=sky:0f0,cloud:0f0,mill:ff0', [20.0, 21.4, 22.6]);
{ const { browser, page } = await openDemo('film', { q: 'vigtest=1' }); out.vignette = await page.evaluate(() => { window.render(0); const x = document.getElementById('c').getContext('2d'); const L = (px, py) => { const d = x.getImageData(px - 2, py - 2, 5, 5).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]; return s / 25; }; const c = L(960, 540); return { centre: c, topMid: L(960, 3) / c, leftMid: L(3, 540) / c, corner: L(3, 3) / c }; }); await browser.close(); }
console.log(JSON.stringify(out, null, 1));
closeServer();
