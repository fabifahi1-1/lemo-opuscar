// WORD CARDS: a full-screen dark-blue paper card. The object sits middle-left as a small paper piece with a soft shadow
// (very slow push-in); on the right the word types in letter by letter, finishing exactly when the word is spoken.
import { W, H, mk, GRAIN, paint, vignette, glow } from '../engine.js';
import { PAL, rr, ell, star5, puffCloud } from '../art.js';
import { clamp, ss, back, lerp, eio, mulberry, TAU } from '../lib.js';
import * as PR from './props.js';
import { makePerson } from './person.js';
import { makePuss } from '../puppets.js';
import * as A from './animals.js';
import { blink } from './stage.js';

const BG = (() => { const c = mk(W, H), g = c.getContext('2d');
  const gr = g.createRadialGradient(W * .42, H * .48, 60, W / 2, H / 2, W * .7); gr.addColorStop(0, '#22356a'); gr.addColorStop(.6, '#152451'); gr.addColorStop(1, '#0b1332'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalAlpha = .55; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  const R = mulberry(12); g.fillStyle = 'rgba(255,240,200,.5)'; for (let i = 0; i < 26; i++) { const x = R() * W, y = R() * H; if (x > W * .2 && x < W * .9 && y > H * .2 && y < H * .8) continue; g.beginPath(); g.arc(x, y, .8 + R() * 1.6, 0, TAU); g.fill(); }
  return c; })();
const millSheet = () => paint(520, 520, g => {
  g.fillStyle = '#e6c58c'; g.beginPath(); g.moveTo(-120, 0); g.lineTo(120, 0); g.lineTo(106, -200); g.lineTo(-106, -200); g.closePath(); g.fill();
  g.fillStyle = '#8f5a3c'; for (const x of [-96, 0, 96]) g.fillRect(x - 4, -200, 8, 200); g.fillRect(-112, -104, 224, 8);
  g.fillStyle = '#b4573b'; g.beginPath(); g.moveTo(-150, -190); g.lineTo(150, -190); g.lineTo(80, -310); g.lineTo(-80, -310); g.closePath(); g.fill();
  g.fillStyle = '#ffcb70'; for (const x of [-60, 60]) { rr(g, x - 20, -170, 40, 54, 20); g.fill(); } g.fillStyle = '#5a3a2c'; rr(g, -36, -110, 72, 110, 36); g.fill();
  g.strokeStyle = '#6a4630'; g.lineWidth = 12; g.beginPath(); g.arc(-170, -70, 100, 0, TAU); g.stroke(); g.lineWidth = 7; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.moveTo(-170, -70); g.lineTo(-170 + Math.cos(a) * 100, -70 + Math.sin(a) * 100); g.stroke(); }
  g.fillStyle = '#7eaabf'; g.fillRect(-260, 0, 520, 40);
}, { res: 2, ax: 260, ay: 420, fin: { rim: .5, under: .3, side: .15 } });
const riverSheet = () => paint(700, 360, g => {
  g.fillStyle = '#4f8a4a'; g.beginPath(); g.moveTo(-340, -60); g.bezierCurveTo(-200, -110, 200, -110, 340, -60); g.lineTo(340, 140); g.lineTo(-340, 140); g.closePath(); g.fill();
  g.fillStyle = '#6aa8c8'; g.beginPath(); g.moveTo(-340, -20); g.bezierCurveTo(-100, -60, 100, 40, 340, -10); g.lineTo(340, 90); g.bezierCurveTo(100, 130, -100, 40, -340, 100); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 5; g.lineCap = 'round'; for (const [x, y] of [[-220, 20], [-60, 40], [100, 50], [220, 20]]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20, y - 8, x + 40, y); g.stroke(); }
  g.fillStyle = '#e89a4a'; g.beginPath(); g.ellipse(40, 70, 26, 12, -.2, 0, TAU); g.fill(); g.beginPath(); g.moveTo(14, 74); g.lineTo(-4, 60); g.lineTo(-4, 88); g.closePath(); g.fill();
  g.fillStyle = '#2e5a2e'; for (let i = 0; i < 9; i++) { const x = -330 + i * 24; g.beginPath(); g.moveTo(x, 140); g.quadraticCurveTo(x + 6, 40, x + 2 + (i % 3) * 5, -10 - (i % 4) * 14); g.lineTo(x + 8, 140); g.fill(); }
}, { res: 2, ax: 350, ay: 220, fin: { rim: .5, under: .3, side: .15 } });
const crownSheet = () => paint(320, 240, g => {
  g.fillStyle = '#e8b84a'; g.beginPath(); g.moveTo(-110, 60); g.lineTo(-120, -40); g.lineTo(-60, 10); g.lineTo(-20, -80); g.lineTo(20, -80); g.lineTo(60, 10); g.lineTo(120, -40); g.lineTo(110, 60); g.closePath(); g.fill();
  g.fillStyle = '#c8902e'; g.fillRect(-110, 34, 220, 26); g.fillStyle = '#d84a5a'; ell(g, 0, 46, 14, 12); g.fill(); g.fillStyle = '#4a8ad8'; for (const x of [-64, 64]) { ell(g, x, 46, 10, 9); g.fill(); }
  g.fillStyle = '#fff4d0'; for (const [x, y] of [[-120, -48], [0, -92], [120, -48]]) { ell(g, x, y, 12, 12); g.fill(); }
}, { res: 2, ax: 160, ay: 140, fin: { rim: .6, under: .3 } });
const applesSheet = () => paint(360, 220, g => { const a = PR.apple(4), b = PR.apple(4, '#e84a3a'), c = PR.apple(4, '#c82a3a'); for (const [s, x, y, k] of [[a, -90, 10, 2.2], [b, 0, -20, 2.5], [c, 90, 14, 2.1]]) g.drawImage(s.c, x - s.ax / s.res * k, y - s.ay / s.res * k, s.c.width / s.res * k, s.c.height / s.res * k); }, { res: 2, finish: false });
const castleCard = () => PR.castle(.5);
const carriageCard = () => paint(820, 620, g => { const s = PR.coach(1.5), w = PR.wheel(1.5); g.drawImage(s.c, -s.ax / s.res, -s.ay / s.res, s.c.width / s.res, s.c.height / s.res); for (const x of [-180, 190]) g.drawImage(w.c, x - w.ax / w.res, -110 - w.ay / w.res, w.c.width / w.res, w.c.height / w.res); }, { res: 1, ax: 410, ay: 560, finish: false });

// an object for each card: a sheet (static) or a puppet (alive: breathing and blinking)
let OBJ = null;
function objects() {
  return OBJ ??= {
    'the mill': { sheet: millSheet(), k: 1.25 },
    'the donkey': { rig: A.donkey({ res: 3 }), k: 1.05, pose: { blink: blink('donkey'), earFlop: .3 } },
    'the cat': { rig: makePuss({ res: 4, turn: .55 }), k: 1.2, pose: { blink: blink('Puss'), lookX: .6, lookY: .1 } },
    'the bread': { sheet: PR.bread(6), k: 4.2 },
    'the bag': { sheet: PR.bag(4), k: 2.2 },
    'the boots': { sheet: PR.boots(4), k: 2.5 },
    'the castle': { sheet: PR.castle(.6), k: .48 },
    'the king': { rig: makePerson('king', { res: 3, turn: .3 }), k: 1.05, pose: { blink: blink('King'), lookX: .5, mouth: 'smile', smile: .6 } },
    'the crown': { sheet: crownSheet(), k: 1.5 },
    'the river': { sheet: riverSheet(), k: 1.0 },
    'the carriage': { sheet: carriageCard(), k: .82 },
    'the princess': { rig: makePerson('princess', { res: 3, turn: .3 }), k: 1.1, pose: { blink: blink('Princess'), lookX: .5, mouth: 'smile', smile: .7, blush: .3 } },
    'the sheep': { rig: A.sheep({ res: 4 }), k: 2.2, pose: { blink: blink('Sheep') } },
    'the apples': { sheet: applesSheet(), k: 1.3 },
    'the ogre': { rig: makePerson('ogre', { res: 3, turn: .3 }), k: .9, pose: { blink: blink('Ogre'), lookX: .5, mouth: 'flat' } },
    'the lion': { rig: A.lion({ res: 3 }), k: 1.15, pose: { blink: blink('Lion') } },
    'the mouse': { rig: A.mouse({ res: 6 }), k: 5, pose: { blink: blink('Mouse'), lookX: .8 } },
    'the slipper': { sheet: PR.slipper(4), k: 2.2 },
  };
}
const OBJY = { 'the bread': 40, 'the crown': 20, 'the apples': 30, 'the bag': 200, 'the boots': 130, 'the slipper': 60, 'the river': -20, 'the mill': 230, 'the castle': 270, 'the carriage': 250 };
export function drawCard(g, card, T) {
  const o = objects()[card.text], lt = T - card.t0, dur = card.t1 - card.t0, push = 1 + .06 * eio(clamp(lt / dur));
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
  g.save(); g.translate(W / 2, H / 2); g.scale(push, push); g.translate(-W / 2, -H / 2); g.drawImage(BG, 0, 0); g.restore();
  // the object: middle-left, on its own soft shadow, popping in at the start of the card
  const ox = W * .3 + ({ 'the mill': 60, 'the castle': 0 }[card.text] || 0), oy = H * .5, pk = back(clamp(lt / .35), 1.3) * push;
  glow(g, ox, oy, 380, [120, 150, 230], .25);
  if (o) {
    let sh, k = o.k;
    if (o.rig) { const p = {}; for (const kk in o.pose || {}) p[kk] = o.pose[kk]; o.rig.pose(T, p); sh = o.rig.dyn; }
    else sh = o.sheet;
    const s = k * pk / sh.res, yy = oy + (o.rig ? (o.rig.height || 300) * k * .5 * pk : (OBJY[card.text] ?? 0) * pk);
    g.save(); g.filter = 'blur(14px) brightness(0)'; g.globalAlpha = .45; g.drawImage(sh.c, ox + 18 - sh.ax * s, yy + 22 - sh.ay * s, sh.c.width * s, sh.c.height * s); g.restore();
    g.filter = 'none'; g.drawImage(sh.c, ox - sh.ax * s, yy - sh.ay * s, sh.c.width * s, sh.c.height * s);
  }
  // the word: letters pop one by one; the last letter lands at the moment the word is spoken
  const txt = card.text, n = txt.replace(/ /g, '').length, step = Math.min(.12, Math.max(.06, (card.noun_t1 - card.t0 - .4) / Math.max(1, n)));
  const start = card.noun_t1 - step * (n - 1) - .16;
  g.font = '150px "Lilita One"'; g.textBaseline = 'middle'; g.textAlign = 'left';
  const total = g.measureText(txt).width; let x = W * .72 - total / 2, k = 0;
  for (const ch of txt) {
    const cw = g.measureText(ch).width;
    if (ch !== ' ') {
      const u = clamp((T - (start + k * step)) / .16); k++;
      if (u > 0) { const s = (.7 + .3 * back(u, 2)) * push; g.save(); g.translate(W / 2 + (x + cw / 2 - W / 2) * push, H / 2 + (H * .5 + 40 - H / 2) * push); g.scale(s, s); g.globalAlpha = ss(u);
        g.textAlign = 'center'; g.shadowColor = 'rgba(0,0,10,.5)'; g.shadowBlur = 16; g.shadowOffsetX = 5; g.shadowOffsetY = 9; g.fillStyle = '#fbefd2'; g.fillText(ch, 0, -40); g.shadowColor = 'transparent'; g.restore(); }
    }
    x += cw;
  }
  vignette(g, .18);
}
