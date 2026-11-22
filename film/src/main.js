// Page contract: window.READY, window.DUR, window.render(t). The timeline comes from data/timing.json (tools/build_plan.py).
// Shots that move fast ask for motion blur: several sub-frames inside a 180-degree shutter, averaged.
import { W, H, mk, vignette, VIGNETTE } from './engine.js';
import { loadFonts } from './art.js';
import { SHOT } from './shots.js';
const Q = new URLSearchParams(location.search);
if (Q.has('mask')) globalThis.MASKS = Object.fromEntries(Q.get('mask').split(',').map(kv => kv.split(':')).map(([k, c]) => [k, '#' + c]));
window.PLACED = () => globalThis.LAST_SCENE?.placed || {};
const TL = await (await fetch('/film/data/timing.json')).json();
const FROM = Q.has('from') ? +Q.get('from') : 0, TO = Q.has('to') ? +Q.get('to') : TL.film_length, FPS = 24;
window.DUR = +(TO - FROM).toFixed(3);
await loadFonts();
const canvas = document.getElementById('c'), g = canvas.getContext('2d'); g.imageSmoothingQuality = 'high';
const ACC = mk(W, H), ag = ACC.getContext('2d');
const shots = TL.shots;
function drawAt(t) {
  let i = shots.findIndex(s => t >= s.t0 && t < s.t1); if (i < 0) i = shots.length - 1;
  const s = shots[i], f = SHOT[s.key]; if (!f) { g.fillStyle = '#222'; g.fillRect(0, 0, W, H); return null; }
  return { f, lt: t - s.t0, s };
}
window.render = tt => {
  const t = FROM + tt, d = drawAt(t); if (!d) return;
  if (Q.has('vigtest')) { g.fillStyle = '#808080'; g.fillRect(0, 0, W, H); vignette(g, VIGNETTE); return; }
  const n = d.f.mb ? Math.max(1, d.f.mb(d.lt)) : 1;
  if (n <= 1) { d.f.draw(g, d.lt); return; }
  ag.globalCompositeOperation = 'source-over'; ag.fillStyle = '#000'; ag.fillRect(0, 0, W, H);
  for (let k = 0; k < n; k++) {
    const off = (k / (n - 1) - .5) * .5 / FPS, lt = clamp0(d.lt + off, d.s.t1 - d.s.t0 - 1e-3);
    d.f.draw(g, lt); ag.globalCompositeOperation = 'lighter'; ag.globalAlpha = 1 / n; ag.drawImage(canvas, 0, 0);
  }
  ag.globalAlpha = 1; ag.globalCompositeOperation = 'source-over'; g.drawImage(ACC, 0, 0);
};
const clamp0 = (x, hi) => Math.max(0, Math.min(hi, x));
window.READY = true;
