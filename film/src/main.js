// Page contract: window.READY, window.DUR, window.render(t). The timeline comes from data/timing.json (tools/build_plan.py).
// A word card replaces the picture during its slot; "time passes" shots open with a slow cross-dissolve (15 frames).
import { W, H, mk, vignette, VIGNETTE } from './engine.js';
import { loadFonts } from './art.js';
import { SHOT } from './shots.js';
const Q = new URLSearchParams(location.search);
if (Q.has('mask')) globalThis.MASKS = Object.fromEntries(Q.get('mask').split(',').map(kv => kv.split(':')).map(([k, c]) => [k, '#' + c]));
window.PLACED = () => globalThis.LAST_SCENE?.placed || {};
const TL = await (await fetch('/film/data/timing.json')).json(); globalThis.TL = TL;
const { PARTS } = await import('./parts/index.js');
for (const k in PARTS) if (!SHOT[k]) SHOT[k] = PARTS[k];
const { drawCard } = await import('./kit/card.js');
const FROM = Q.has('from') ? +Q.get('from') : 0, TO = Q.has('to') ? +Q.get('to') : TL.film_length, FPS = 24;
window.DUR = +(TO - FROM).toFixed(3);
await loadFonts();
const canvas = document.getElementById('c'), g = canvas.getContext('2d'); g.imageSmoothingQuality = 'high';
const OFF = mk(W, H), og = OFF.getContext('2d');
const shots = TL.shots;
export const DISSOLVE = new Set(['L032', 'L048[1:3]', 'L052[1:4]', 'L058[1:9]', 'L182[1:2]', 'end']);
const DISS = 15 / FPS;
const findShot = t => { let i = shots.findIndex(s => t >= s.t0 && t < s.t1); return i < 0 ? shots.length - 1 : i; };
function frame(gg, t, depth = 0) {
  const i = findShot(t), s = shots[i];
  for (const cd of s.cards || []) if (t >= cd.t0 && t < cd.t1) { drawCard(gg, cd, t); return; }
  const f = SHOT[s.key];
  if (!f) { gg.setTransform(1, 0, 0, 1, 0, 0); gg.fillStyle = '#222'; gg.fillRect(0, 0, W, H); gg.fillStyle = '#888'; gg.font = '40px sans-serif'; gg.fillText(s.key, 60, 80); return; }
  const lt = t - s.t0;
  if (depth === 0 && DISSOLVE.has(s.key) && lt < DISS && i > 0) {
    const pt = s.t0 - 1e-3; frame(og, pt, 1);
    f.draw(gg, lt, s); gg.setTransform(1, 0, 0, 1, 0, 0); gg.globalAlpha = 1 - ss(lt / DISS); gg.drawImage(OFF, 0, 0); gg.globalAlpha = 1; return;
  }
  f.draw(gg, lt, s);
}
const ss = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
window.render = tt => {
  const t = FROM + tt;
  if (Q.has('vigtest')) { g.fillStyle = '#808080'; g.fillRect(0, 0, W, H); vignette(g, VIGNETTE); return; }
  frame(g, t);
};
if (Q.has('lab')) { const lab = await import('./lab.js'); window.render = tt => lab.draw(g, tt, Q.get('lab')); }
window.READY = true;
