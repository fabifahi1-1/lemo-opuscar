// Page contract: window.READY, window.DUR, window.render(t). The timeline comes from data/timing.json (written by tools/build_plan.py).
import { W, H, mk } from './engine.js';
import { loadFonts } from './art.js';
import { SHOT } from './shots.js';
const Q = new URLSearchParams(location.search);
const TL = await (await fetch('/film/data/timing.json')).json();
const FROM = Q.has('from') ? +Q.get('from') : 0, TO = Q.has('to') ? +Q.get('to') : TL.film_length;
window.DUR = +(TO - FROM).toFixed(3);
await loadFonts();
const canvas = document.getElementById('c'), g = canvas.getContext('2d');
const shots = TL.shots;
window.render = tt => {
  const t = FROM + tt;
  let i = shots.findIndex(s => t >= s.t0 && t < s.t1); if (i < 0) i = shots.length - 1;
  const s = shots[i], f = SHOT[s.key]; if (!f) { g.fillStyle = '#222'; g.fillRect(0, 0, W, H); return; }
  f.draw(g, t - s.t0);
};
window.READY = true;
