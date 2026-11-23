// Locations for Parts 5 to 8: the fields, the ogre's castle (day and night), the hall (empty, then lived-in), the kitchen at
// night, the bedroom, and the end-screen table. Same conventions as sets.js: action plane d = 2, feet on GY outdoors.
import { paint, Layer, glow, specks, project, setLight } from '../engine.js';
import { cut, rr, ell, ridge, fir, puffCloud, tufts, star5 } from '../art.js';
import { mulberry, TAU, clamp, lerp } from '../lib.js';
import * as PR from './props.js';
import { outdoor, tree, GY } from './sets.js';
import { buildTable, TABLE_GEO } from '../scenes.js';

const grad = (g, x0, y0, x1, y1, st) => { const gr = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([p, c]) => gr.addColorStop(p, c)); return gr; };
const scr = (x, y, d, cam) => { const p = project(x, y, d, cam); return p ? [p.px, p.py, p.Z] : [-9e3, -9e3, 1]; };
const flick = t => .9 + .06 * Math.sin(t * 13.1) + .04 * Math.sin(t * 29.7 + 1) + .03 * Math.sin(t * 5.3);

// ---------- props for these parts ----------
const once = (() => { const m = new Map(); return (k, f) => m.has(k) ? m.get(k) : (m.set(k, f()), m.get(k)); })();
// a big apple tree (trunk wide enough to hide a cat), standing on y = 0
export const appleTree = (res = 1.2) => once('appleTree' + res, () => paint(900, 1300, g => {
  g.fillStyle = '#6a4628'; g.beginPath(); g.moveTo(-90, 0); g.bezierCurveTo(-70, -200, -60, -420, -40, -560); g.lineTo(40, -560); g.bezierCurveTo(60, -420, 70, -200, 90, 0); g.closePath(); g.fill();
  g.fillStyle = '#5a3a20'; g.fillRect(-20, -520, 10, 420); g.fillRect(20, -380, 8, 300);
  g.fillStyle = '#4f8a46'; const R = mulberry(7); g.beginPath(); for (let i = 0; i < 11; i++) { const a = i / 11 * TAU, r = 190 + R() * 60; g.moveTo(Math.cos(a) * 250 + r, -820 + Math.sin(a) * 200); g.arc(Math.cos(a) * 250, -820 + Math.sin(a) * 200, r, 0, TAU); } g.fill();
  g.fillStyle = '#5c9a50'; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3; g.moveTo(Math.cos(a) * 150 + 120, -880 + Math.sin(a) * 120); g.arc(Math.cos(a) * 150, -880 + Math.sin(a) * 120, 120, 0, TAU); } g.fill();
  g.fillStyle = '#d8343a'; for (let i = 0; i < 22; i++) { const x = (R() - .5) * 640, y = -820 + (R() - .5) * 420; g.beginPath(); g.arc(x, y, 18, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.35)'; const Q = mulberry(7); for (let i = 0; i < 22; i++) { const x = (Q() - .5) * 640, y = -820 + (Q() - .5) * 420; g.beginPath(); g.arc(x - 6, y - 6, 5, 0, TAU); g.fill(); }
}, { res, ay: 1250, fin: { rim: .45, under: .3, side: .12 } }));
// a cookie with a bite out of it, crumbs drawn as fx
export const bitten = (res = 3) => once('bitten' + res, () => { const c = PR.cookie(res); return paint(70, 70, g => { g.drawImage(c.c, -c.ax / c.res, -c.ay / c.res, c.c.width / c.res, c.c.height / c.res); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(30, -22, 16, 0, TAU); g.arc(16, -30, 12, 0, TAU); g.fill(); }, { res, finish: false }); });
// a closed storybook (plum cover, gold corners, a cream page block)
export const closedBook = (res = 1.4) => once('cbook' + res, () => paint(640, 420, g => {   // seen from above at an angle: the plum cover, gold corners, a cream page edge
  g.fillStyle = '#efe0c0'; g.beginPath(); g.moveTo(-250, 60); g.lineTo(270, 60); g.lineTo(290, 100); g.lineTo(-240, 100); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(150,120,80,.5)'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-246 + i * 2, 68 + i * 8); g.lineTo(282, 68 + i * 8); g.stroke(); }
  g.fillStyle = '#6a2d4a'; g.beginPath(); g.moveTo(-270, -130); g.lineTo(250, -130); g.lineTo(290, 70); g.lineTo(-250, 70); g.closePath(); g.fill();
  g.fillStyle = '#56223c'; g.beginPath(); g.moveTo(-270, -130); g.lineTo(-230, -130); g.lineTo(-210, 70); g.lineTo(-250, 70); g.closePath(); g.fill();
  g.strokeStyle = '#e8b84a'; g.lineWidth = 6; g.beginPath(); g.moveTo(-170, -100); g.lineTo(220, -100); g.lineTo(248, 40); g.lineTo(-150, 40); g.closePath(); g.stroke();
  g.fillStyle = '#e8b84a'; g.beginPath(); g.arc(40, -30, 30, 0, TAU); g.fill(); g.fillStyle = '#6a2d4a'; star5(g, 40, -30, 18, 8); g.fill();
  for (const [x, y] of [[250, -130], [290, 70], [-250, 70]]) { g.fillStyle = '#e8b84a'; g.beginPath(); g.arc(x, y, 14, 0, TAU); g.fill(); }
}, { res, ay: 100, fin: { rim: .5, side: .2 } }));
export const ribbon = (res = 1) => once('ribbon' + res, () => paint(1400, 260, g => {   // a looping garland of ribbons with bows
  g.strokeStyle = '#e86a8a'; g.lineWidth = 16; g.beginPath(); g.moveTo(-680, -100); g.quadraticCurveTo(-340, 120, 0, -60); g.quadraticCurveTo(340, 120, 680, -100); g.stroke();
  g.strokeStyle = '#f4d24a'; g.lineWidth = 8; g.beginPath(); g.moveTo(-680, -80); g.quadraticCurveTo(-340, 140, 0, -40); g.quadraticCurveTo(340, 140, 680, -80); g.stroke();
  for (const x of [-680, 0, 680]) { g.fillStyle = '#e86a8a'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x, -80); g.lineTo(x + s * 60, -120); g.lineTo(x + s * 60, -40); g.closePath(); g.fill(); } g.fillStyle = '#c84a6a'; ell(g, x, -80, 16, 16); g.fill(); }
}, { res, fin: { rim: .4, side: .15 } }));
export const portrait = (res = 1.5) => once('portrait' + res, () => paint(260, 320, g => {   // a little framed picture: Tom, the princess and Puss
  g.fillStyle = '#c8962e'; rr(g, -120, -150, 240, 300, 14); g.fill(); g.fillStyle = '#f4e2b8'; g.fillRect(-96, -126, 192, 252);
  g.fillStyle = '#3f6fc0'; rr(g, -76, 10, 56, 100, 18); g.fill(); g.fillStyle = '#f0c09a'; ell(g, -48, -20, 26, 28); g.fill(); g.fillStyle = '#5a3a22'; ell(g, -48, -40, 28, 14); g.fill();
  g.fillStyle = '#e898b0'; g.beginPath(); g.moveTo(8, 110); g.lineTo(24, 10); g.lineTo(64, 10); g.lineTo(80, 110); g.closePath(); g.fill(); g.fillStyle = '#f3c4a2'; ell(g, 44, -20, 24, 26); g.fill(); g.fillStyle = '#e8b850'; ell(g, 44, -38, 28, 14); g.fill();
  g.fillStyle = '#f0b860'; ell(g, -2, 96, 18, 16); g.fill(); g.beginPath(); g.moveTo(-14, 86); g.lineTo(-12, 72); g.lineTo(-4, 84); g.fill(); g.beginPath(); g.moveTo(10, 86); g.lineTo(12, 72); g.lineTo(4, 84); g.fill();
}, { res, fin: { rim: .45, side: .2 } }));
export const bed = (res = 1) => once('bed' + res, () => paint(1300, 760, g => {   // the softest bed: a carved headboard, a puffy quilt, big pillows
  g.fillStyle = '#8a5a34'; rr(g, -560, -620, 120, 640, 30); g.fill(); g.fillStyle = '#7a4a2a'; g.beginPath(); g.moveTo(-560, -560); g.quadraticCurveTo(-500, -700, -440, -560); g.fill();
  g.fillStyle = '#8a5a34'; rr(g, 470, -380, 100, 400, 26); g.fill();
  g.fillStyle = '#f2e8d8'; rr(g, -470, -300, 960, 120, 40); g.fill();
  g.fillStyle = '#fbf6ee'; for (const x of [-400, -220]) { rr(g, x, -400, 200, 120, 50); g.fill(); }
  g.fillStyle = '#5a8ac8'; g.beginPath(); g.moveTo(-470, -260); g.bezierCurveTo(-200, -320, 200, -300, 490, -250); g.lineTo(500, -60); g.bezierCurveTo(200, -20, -200, -30, -480, -60); g.closePath(); g.fill();
  g.fillStyle = '#7aa4dc'; for (let i = 0; i < 4; i++) { const x = -380 + i * 230; g.beginPath(); g.arc(x, -170, 60, 0, TAU); g.fill(); }
  g.fillStyle = '#f4d24a'; for (let i = 0; i < 4; i++) star5(g, -380 + i * 230, -170, 20, 9), g.fill();
  g.fillStyle = '#6a4224'; g.fillRect(-470, -60, 980, 60); g.fillRect(-460, 0, 40, 40); g.fillRect(440, 0, 40, 40);
}, { res, ay: 700, fin: { rim: .45, under: .3, side: .12 } }));

// ---------- FIELDS: the farmland along the road (wheat, a sheep meadow, the orchard) ----------
export const FIELD = { wheatX: -1400, meadowX: 0, orchardX: 1500 };
export function FIELDS() {
  const sc = outdoor({
    sky: ['#7fb2dc', '#cfe4ee', '#f6e8c4'], sunX: -900, sunY: -650, seed: 51, clouds: 7,
    far: { col: '#a6bca8', amp: 90, base: -20 },
    mid: { col: '#8cb26a', amp: 50, base: 70, items: g => { const R = mulberry(3); for (let x = -3500; x < 3500; x += 300) { g.fillStyle = (x / 300 | 0) % 2 ? '#d8c070' : '#a8c870'; g.beginPath(); g.moveTo(x, 120); g.lineTo(x + 300, 110); g.lineTo(x + 310, 420); g.lineTo(x - 10, 430); g.closePath(); g.fill(); }
      g.fillStyle = '#fbf6ee'; for (let i = 0; i < 40; i++) { const x = -800 + R() * 1600, y = 160 + R() * 160; ell(g, x, y, 14, 9); g.fill(); } } },
    main: g => {
      // the wheat field on the left, the sheep meadow in the middle, the orchard on the right; a low fence along the road
      g.fillStyle = '#e2c062'; g.fillRect(-4500, -260, 3800, 300); g.strokeStyle = '#c8a04a'; g.lineWidth = 4; const R = mulberry(4);
      for (let x = -4480; x < -700; x += 22) { const h = 40 + R() * 40; g.beginPath(); g.moveTo(x, -250); g.lineTo(x + (R() - .5) * 10, -250 - h); g.stroke(); g.fillStyle = '#d8a848'; ell(g, x + (R() - .5) * 10, -250 - h, 5, 12); g.fill(); }
      g.fillStyle = '#7ab060'; g.fillRect(-700, -240, 1500, 280);
      g.fillStyle = '#6aa058'; g.fillRect(800, -260, 3700, 300);
      for (let x = 900; x < 4400; x += 360) tree(g, x, -200, 380 + R() * 60, '#4f8a46', '#6a4628', x | 0), (() => { g.fillStyle = '#d8343a'; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(x + (R() - .5) * 160, -200 - 250 + (R() - .5) * 120, 9, 0, TAU); g.fill(); } })();
      g.fillStyle = '#b89a70'; for (let x = -4500; x < 4500; x += 140) { rr(g, x, -70, 14, 80, 4); g.fill(); } g.fillRect(-4500, -54, 9000, 10);
    },
    road: { col: '#d8c08e', edge: 'rgba(120,90,50,.25)', items: g => { g.fillStyle = 'rgba(150,120,70,.22)'; for (let x = -4500; x < 4500; x += 90) { ell(g, x, 160, 30, 5); g.fill(); } } },
    near: { col: '#2f4a2e', h: 90, items: g => { const R = mulberry(5); for (let x = -5400; x < 5400; x += 40 + R() * 60) { g.fillStyle = ['#f4d24a', '#fbf6ee', '#f08cb0'][(R() * 3) | 0]; ell(g, x, -150 - R() * 40, 7, 7); g.fill(); } } },
  });
  return sc;
}

// ---------- OGRE: outside the ogre's castle. A stone front with a huge door (two people tall), a porch roof on the right
// (tiles, a drainpipe), a high window, towers with flags behind; the doormat, the doorbell, the slippers, a bush on the left. ----------
export const OG = { doorX: 0, doorW: 380, doorH: 700, floor: GY + 40, roofX0: 420, roofY0: GY - 560, roofX1: 980, roofY1: GY - 250, winX: -560, winY: GY - 760, bellX: 260, bellY: GY - 95, bushX: -900, castleD: 2.3 };
function castleFront(night) {
  return paint(4400, 3600, g => {
    const st = night ? '#5e6478' : '#b4ad9c', st2 = night ? '#4e5468' : '#9e9686', mort = night ? 'rgba(20,20,40,.35)' : 'rgba(90,80,70,.3)';
    // towers behind the wall
    for (const [x, h, w] of [[-1300, 1650, 360], [1350, 1750, 380], [-250, 1900, 320], [600, 1600, 300]]) {
      g.fillStyle = st2; g.fillRect(x - w / 2, -h, w, h); g.fillStyle = night ? '#3a3e5a' : '#6a5a8a'; g.beginPath(); g.moveTo(x - w / 2 - 30, -h); g.lineTo(x, -h - w * 1.1); g.lineTo(x + w / 2 + 30, -h); g.closePath(); g.fill();
      g.fillStyle = '#4a3a30'; g.fillRect(x - 4, -h - w * 1.1 - 110, 8, 120);
      g.fillStyle = st; for (let i = 0; i < 4; i++) g.fillRect(x - w / 2 + i * w / 3.5, -h - 40, w / 7, 40);
      g.fillStyle = night ? '#ffd27a' : '#3a3040'; rr(g, x - 30, -h + 160, 60, 100, 30); g.fill();
    }
    // the main wall
    g.fillStyle = st; g.fillRect(-2200, -1100, 4400, 1100);
    g.fillStyle = night ? '#3a3e4e' : '#a89a80'; g.fillRect(-2200, 0, 4400, 1100); g.strokeStyle = night ? 'rgba(10,10,30,.35)' : 'rgba(80,66,50,.3)'; g.lineWidth = 3; for (let y = 40; y < 1100; y += 60 + y * .08) { g.beginPath(); g.moveTo(-2200, y); g.lineTo(2200, y); g.stroke(); }
    g.fillStyle = st; for (let x = -2200; x < 2200; x += 120) g.fillRect(x, -1160, 70, 60);
    g.strokeStyle = mort; g.lineWidth = 4; for (let y = -1100; y < 0; y += 70) for (let x = -2200 + (y / 70 % 2) * 70; x < 2200; x += 140) g.strokeRect(x, y, 140, 70);
    // the high window (a dark opening; the shadow passes inside it) and its shutters are separate layers
    cut(g, () => { rr(g, OG.winX - 110, OG.winY - OG.floor - 160, 220, 320, 100); g.fill(); });
    // the door arch (the door itself is a layer that swings open)
    g.fillStyle = night ? '#2a2430' : '#6a6058'; g.beginPath(); g.moveTo(-OG.doorW / 2 - 50, 0); g.lineTo(-OG.doorW / 2 - 50, -OG.doorH + 140); g.arc(0, -OG.doorH + 140, OG.doorW / 2 + 50, Math.PI, 0); g.lineTo(OG.doorW / 2 + 50, 0); g.closePath(); g.fill();
    g.fillStyle = '#1a1418'; g.beginPath(); g.moveTo(-OG.doorW / 2, 0); g.lineTo(-OG.doorW / 2, -OG.doorH + 190); g.arc(0, -OG.doorH + 190, OG.doorW / 2, Math.PI, 0); g.lineTo(OG.doorW / 2, 0); g.closePath(); g.fill();
    // a stone step in front
    g.fillStyle = night ? '#4a4e60' : '#8e8676'; g.fillRect(-OG.doorW / 2 - 120, 0, OG.doorW + 240, 50);
    if (night) { g.fillStyle = '#ffd27a'; rr(g, 900, -620, 180, 220, 70); g.fill(); g.fillStyle = '#c8962e'; g.fillRect(984, -620, 12, 220); g.fillRect(900, -516, 180, 12); }   // the lit kitchen window
  }, { res: .45, ay: 2500, fin: { rim: .4, under: .3, side: .12 } });
}
const door = () => paint(420, 760, g => { g.translate(190, 0); g.fillStyle = '#6a4228'; g.beginPath(); g.moveTo(-190, 0); g.lineTo(-190, -510); g.arc(0, -510, 190, Math.PI, 0); g.lineTo(190, 0); g.closePath(); g.fill();
  g.strokeStyle = '#4a2a18'; g.lineWidth = 8; for (const x of [-95, 0, 95]) { g.beginPath(); g.moveTo(x, -10); g.lineTo(x, -640); g.stroke(); }
  g.fillStyle = '#3a3040'; for (const y of [-160, -480]) g.fillRect(-190, y, 380, 26); g.fillStyle = '#c8a040'; ell(g, 130, -300, 18, 18); g.fill(); g.strokeStyle = '#c8a040'; g.lineWidth = 7; g.beginPath(); g.arc(130, -270, 26, 0, Math.PI); g.stroke(); }, { res: 1.1, ax: 20, ay: 700, fin: { rim: .45, under: .3, side: .15 } });
const roof = () => paint(800, 900, g => {   // the porch roof: tiles in rows on a slope, a gutter and a drainpipe
  const x0 = 0, y0 = 0, x1 = OG.roofX1 - OG.roofX0, y1 = OG.roofY1 - OG.roofY0;
  g.fillStyle = '#9a4a3a'; g.beginPath(); g.moveTo(x0 - 20, y0 - 20); g.lineTo(x1 + 30, y1 - 20); g.lineTo(x1 + 30, y1 + 30); g.lineTo(x0 - 20, y0 + 50); g.closePath(); g.fill();
  g.fillStyle = '#b4583e'; for (let i = 0; i < 12; i++) { const u = i / 12, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; g.beginPath(); g.arc(x + 20, y + 6, 24, 0, Math.PI); g.fill(); }
  g.fillStyle = '#6a6a72'; g.fillRect(x1 + 8, y1 + 20, 20, OG.floor - OG.roofY1 - 50); g.fillRect(x1 - 10, y1 + 20, 50, 14);
  g.fillStyle = '#b4ad9c'; g.fillRect(x0 - 10, y0 + 50, 60, 400);
}, { res: .9, ax: 40, ay: 40, fin: { rim: .45, under: .3, side: .15 } });
const shutter = s => paint(140, 320, g => { g.fillStyle = '#5a7a4a'; rr(g, -60, -150, 120, 300, 10); g.fill(); g.strokeStyle = '#3e5a34'; g.lineWidth = 5; for (let y = -120; y < 150; y += 40) { g.beginPath(); g.moveTo(-50, y); g.lineTo(50, y); g.stroke(); } }, { res: 1, ax: s < 0 ? 130 : 10, fin: { rim: .4, side: .15 } });
const flag = col => paint(240, 140, g => { g.fillStyle = col; g.beginPath(); g.moveTo(0, -60); g.quadraticCurveTo(110, -80, 220, -40); g.lineTo(160, 0); g.lineTo(220, 40); g.quadraticCurveTo(110, 20, 0, 50); g.closePath(); g.fill(); }, { res: 1, ax: 10, ay: 70, fin: { rim: .4, side: .1 } });
export function OGRE(night = false) {
  const sc = outdoor({
    sky: night ? ['#0e1636', '#1e2c58', '#3a4478'] : ['#8ab0d4', '#d8d8d0', '#f0d8b0'], sunX: night ? 700 : 1200, sunY: night ? -820 : -760, sunCol: night ? '#fff4cf' : undefined, seed: 61, clouds: night ? 0 : 6,
    lightDir: [-.55, .8], light: night ? { x: 900, y: -300, r: 1400, col: [180, 190, 255], floor: .35 } : { x: 1200, y: -600, r: 2600, col: [255, 222, 170], floor: .55 },
    far: { col: night ? '#2a3458' : '#9aa8b4', amp: 120, base: 0 },
    haze: night ? null : undefined, hazeCol: '#d6d8e6',
    post: night ? { bloom: .22, tint: [170, 185, 255], tintA: .16 } : { bloom: .1, tint: [255, 220, 176], tintA: .12 }, litGain: night ? .5 : .3,
  });
  const L = sc.layers, i = L.findIndex(l => l.name === 'main' || l.name === 'far');
  const front = new Layer({ sheet: castleFront(night), x: 0, y: OG.floor, z: 2.4, d: OG.castleD, trans: .1, lit: .5, name: 'castle' });
  const winBack = new Layer({ x: OG.winX, y: OG.winY, z: 2.35, d: OG.castleD + .01, noDepth: true, name: 'winBack', draw(g, info) {
    const { px, py, Z } = info; g.fillStyle = night ? '#ffd27a' : '#2a2030'; g.fillRect(px - 120 * Z, py - 170 * Z, 240 * Z, 330 * Z);
    const t = sc.t || 0; if (sc.shadowAt != null) { const u = (t - sc.shadowAt) / 1.6; if (u > 0 && u < 1) { g.fillStyle = 'rgba(0,0,0,.85)'; g.beginPath(); g.ellipse(px + lerp(-260, 260, u) * Z, py - 20 * Z, 120 * Z, 200 * Z, 0, 0, TAU); g.fill(); } } } });
  const doorL = new Layer({ sheet: door(), x: -OG.doorW / 2, y: OG.floor, z: 2.45, d: OG.castleD - .005, name: 'door' });
  const roofL = new Layer({ sheet: roof(), x: OG.roofX0, y: OG.roofY0 + (OG.floor - GY), z: 2.5, d: OG.castleD - .01, name: 'roof' });
  const shL = new Layer({ sheet: shutter(-1), x: OG.winX - 110, y: OG.winY, z: 2.46, d: OG.castleD - .006, name: 'shutL' }), shR = new Layer({ sheet: shutter(1), x: OG.winX + 110, y: OG.winY, z: 2.46, d: OG.castleD - .006, name: 'shutR' });
  const flags = [[-1300, -2046, '#e8544a'], [1350, -2168, '#f4c84a'], [-250, -2252, '#5aa0e0'], [600, -1930, '#7ac060']].map(([x, y, col]) => new Layer({ sheet: flag(col), x: x + 4, y: y + OG.floor - 80, z: 2.38, d: OG.castleD + .01, name: 'flag', shadow: false }));
  const mat = new Layer({ sheet: PR.doormat(3), x: 0, y: OG.floor + 70, z: 2.8, d: OG.castleD - .08, sx: .8, sy: .8, name: 'mat' });
  const bell = new Layer({ sheet: PR.doorbell(3), x: OG.bellX, y: OG.bellY, z: 2.6, d: OG.castleD - .012, sx: .6, sy: .6, name: 'bell' });
  const slippers = [[-430, -.1], [-330, .12]].map(([x, r]) => new Layer({ sheet: PR.slipper(3), x, y: OG.floor + 14, z: 2.75, d: OG.castleD - .05, sx: .55, sy: .55, rot: r, name: 'slipper' }));
  const bush = new Layer({ sheet: PR.bush(2, night ? '#24402e' : '#3e7a3c'), x: OG.bushX, y: OG.floor + 60, z: 3.9, d: 2.0, sx: 1.2, sy: 1.2, name: 'bush' });
  L.splice(i + 1, 0, winBack, front, shL, shR, doorL, roofL, ...flags, mat, bell, ...slippers, bush);
  Object.assign(sc, { door: doorL, flags, shL, shR, bush, mat, bellL: bell, slippers, front, winBack, night });
  const up0 = sc.update; sc.update = t => { up0(t); flags.forEach((f, k) => { f.sx = 1 + .08 * Math.sin(t * 7 + k); f.rot = .06 * Math.sin(t * 5 + k * 2); }); const o = sc.doorOpen || 0; doorL.sx = 1 - .82 * o; };
  sc.reset = () => { sc.doorOpen = 0; sc.shadowAt = null; shL.rot = shR.rot = 0; };
  if (night) sc.fx.push((g, { cam }) => { const R = mulberry(9), t = sc.t || 0; g.fillStyle = '#fff6d8'; for (let k = 0; k < 90; k++) { const [x, y] = scr(-3000 + R() * 6000, -1700 + R() * 900, 14, cam), tw = .5 + .5 * Math.sin(t * (1 + R() * 2) + k); g.globalAlpha = .3 + .7 * tw; g.beginPath(); g.arc(x, y, 1.2 + R() * 1.8, 0, TAU); g.fill(); } g.globalAlpha = 1;
    const [wx, wy, Z] = scr(990, OG.floor - 510, OG.castleD, cam); glow(g, wx, wy, 260 * Z, [255, 200, 120], .35 * flick(t)); });
  return sc;
}
export const OGRE_NIGHT = () => OGRE(true);

// ---------- HALL: the castle hall. Empty: grey stone, dust in the light. Lived-in: rugs, ribbons, candles, a portrait. ----------
export const HL = { floor: 340, doorX: -900, chairX: 520 };
export function HALL(lived = false) {
  setLight(.6, .8);
  const L = [], F = HL.floor;
  const back = paint(4200, 2000, g => {
    g.fillStyle = lived ? '#d8b88a' : '#a8a298'; g.fillRect(-2100, -1000, 4200, 2000);
    g.strokeStyle = lived ? 'rgba(140,100,60,.25)' : 'rgba(70,64,60,.3)'; g.lineWidth = 3; for (let y = -1000; y < F; y += 70) for (let x = -2100 + (y / 70 % 2) * 70; x < 2100; x += 140) g.strokeRect(x, y, 140, 70);
    cut(g, () => { for (const x of [-300, 300, 900]) { g.beginPath(); g.moveTo(x - 100, -150); g.lineTo(x - 100, -560); g.arc(x, -560, 100, Math.PI, 0); g.lineTo(x + 100, -150); g.closePath(); g.fill(); } });
    g.fillStyle = lived ? '#b07a46' : '#857c70'; g.fillRect(-2100, F, 4200, 700);
    g.fillStyle = '#2a2024'; g.beginPath(); g.moveTo(HL.doorX - 170, F); g.lineTo(HL.doorX - 170, F - 520); g.arc(HL.doorX, F - 520, 170, Math.PI, 0); g.lineTo(HL.doorX + 170, F); g.closePath(); g.fill();
    if (lived) { g.fillStyle = '#a83a4a'; rr(g, -700, F + 40, 1400, 200, 30); g.fill(); g.strokeStyle = '#e8b84a'; g.lineWidth = 10; rr(g, -680, F + 56, 1360, 168, 24); g.stroke(); }
  }, { res: .5, fin: { rim: .35, under: .3, side: .12 } });
  const win = paint(1600, 600, g => { g.fillStyle = grad(g, 0, -300, 0, 300, lived ? [[0, '#26305a'], [1, '#4a4a7a']] : [[0, '#cfe0ee'], [1, '#f2ead6']]); g.fillRect(-800, -300, 1600, 600); }, { res: .5, fin: { rim: 0, under: 0, side: 0 } });
  L.push(new Layer({ sheet: win, x: 300, y: -380, z: -1, d: 3.3, trans: 1, lit: .9, shadow: false, haze: 0, name: 'windows' }));
  L.push(new Layer({ sheet: back, x: 0, y: 0, z: 0, d: 2.8, trans: .1, lit: .5, name: 'wall' }));
  const pillar = paint(200, 1800, g => { g.fillStyle = lived ? '#c8a878' : '#968e84'; g.fillRect(-60, -900, 120, 1800); g.fillStyle = lived ? '#b8986a' : '#867e74'; g.fillRect(20, -900, 40, 1800); }, { res: .5, fin: { rim: .4, side: .15 } });
  for (const x of [-1500, 1500]) L.push(new Layer({ sheet: pillar, x, y: -100, z: 1, d: 2.5, name: 'pillar' }));
  if (lived) {
    L.push(new Layer({ sheet: ribbon(1), x: 300, y: -760, z: 1.3, d: 2.6, name: 'ribbon' }));
    L.push(new Layer({ sheet: portrait(1.5), x: -300, y: -420, z: 1.2, d: 2.7, sx: .9, sy: .9, name: 'portrait' }));
    const chair = paint(300, 420, g => { g.fillStyle = '#8a3a4a'; rr(g, -110, -400, 220, 260, 40); g.fill(); g.fillStyle = '#e8b84a'; rr(g, -120, -150, 240, 40, 10); g.fill(); g.fillStyle = '#7a4a2a'; g.fillRect(-100, -110, 20, 110); g.fillRect(80, -110, 20, 110); g.fillStyle = '#c84a5a'; rr(g, -100, -170, 200, 40, 16); g.fill(); }, { res: 1, ay: 410, fin: { rim: .45, under: .3, side: .12 } });
    L.push(new Layer({ sheet: chair, x: HL.chairX, y: F + 30, z: 2, d: 2.2, name: 'chair' }));
    for (const [x, y] of [[-1000, F - 40], [1000, F - 40], [-500, -200], [800, -200]]) L.push(new Layer({ sheet: PR.candle(3), x, y, z: 1.6, d: 2.5, sx: .7, sy: .7, name: 'candle' }));
  }
  const floorEdge = paint(4000, 500, g => { g.fillStyle = '#20181c'; g.fillRect(-2000, 0, 4000, 500); }, { res: .4, ay: 0 });
  L.push(new Layer({ sheet: floorEdge, x: 0, y: F + 330, z: 8, d: 1.6, name: 'floorEdge' }));
  const sc = { bg: '#1a1418', layers: L, cam: { x: 0, y: 0, zoom: 1, dz: 0 }, actD: 2.2, light: lived ? { x: 0, y: -200, r: 1700, col: [255, 200, 130], floor: .4 } : { x: 300, y: -500, r: 1800, col: [235, 235, 245], floor: .4 }, lightDir: [.5, .85], focus: 2.2, haze: null,
    post: lived ? { bloom: .2, tint: [255, 206, 150], tintA: .16 } : { bloom: .1, tint: [210, 220, 240], tintA: .1 }, litGain: .35, lived,
    fx: [(g, { cam }) => { const t = sc.t || 0;
      if (!lived) { for (const x of [-300, 300, 900]) { const P = [[x - 100, -650], [x + 100, -650], [x + 420, F + 40], [x - 60, F + 40]].map(([a, b]) => scr(a, b, 2.75, cam)); g.save(); g.beginPath(); P.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(230,236,255,.08)'; g.fill(); g.globalCompositeOperation = 'source-over'; g.clip(); specks(g, t, { n: 40, seed: x | 0, col: [240, 240, 255], a: .5, r: 1.8 * (P[2][2] || 1), speed: 3, vx: 4 }); g.restore(); } }
      else for (const [x, y] of [[-1000, F - 40], [1000, F - 40], [-500, -200], [800, -200]]) { const [px, py, Z] = scr(x, y - 96, 2.5, cam); glow(g, px, py, 160 * Z, [255, 190, 110], .4 * flick(t + x)); } }],
    update(t) { sc.t = t; } };
  return sc;
}
export const HALL_LIVED = () => HALL(true);

// ---------- KITCHEN: the castle kitchen at night. A night window, a hearth with embers, pots, the table with a candle.
// Tom sits on the bench at the left end of the table exactly where he sat on the steps (so the hook framing can be matched). ----------
export const KT = { tomX: -200, tomY: 120, tableX: 260, tableY: 150, candleX: 360, catX: 40 };
export function KITCHEN() {
  setLight(.75, .6);
  const L = [];
  const night = paint(700, 600, g => { g.fillStyle = grad(g, 0, -300, 0, 300, [[0, '#0b1740'], [1, '#2c3f78']]); g.fillRect(-350, -300, 700, 600); g.fillStyle = '#fff4cf'; g.beginPath(); g.arc(120, -120, 44, 0, TAU); g.arc(140, -134, 38, 0, TAU); g.fill('evenodd'); const R = mulberry(8); for (let i = 0; i < 30; i++) { g.globalAlpha = .4 + R() * .6; g.beginPath(); g.arc((R() - .5) * 660, (R() - .5) * 560, .8 + R() * 2, 0, TAU); g.fill(); } g.globalAlpha = 1; }, { res: 1, fin: { rim: 0, under: 0, side: 0 } });
  L.push(new Layer({ sheet: night, x: -560, y: -300, z: -.5, d: 6, trans: .8, lit: .5, shadow: false, name: 'night' }));
  const wall = paint(3400, 1800, g => {
    g.fillStyle = '#5a3e34'; g.fillRect(-1700, -900, 3400, 1800);
    g.strokeStyle = 'rgba(30,16,10,.3)'; g.lineWidth = 3; for (let y = -900; y < 900; y += 64) for (let x = -1700 + (y / 64 % 2) * 64; x < 1700; x += 128) g.strokeRect(x, y, 128, 64);
    cut(g, () => { rr(g, -790, -560, 460, 420, 200); g.fill(); });
    g.fillStyle = '#3a2420'; g.beginPath(); g.moveTo(700, 400); g.lineTo(700, -100); g.quadraticCurveTo(950, -260, 1200, -100); g.lineTo(1200, 400); g.closePath(); g.fill();   // the hearth
    g.fillStyle = '#7a3a1a'; ell(g, 950, 330, 180, 40); g.fill();
    g.fillStyle = '#5a5a62'; for (const [x, r] of [[-120, 60], [40, 46], [180, 54]]) { g.fillRect(x - 2, -620, 4, 120); ell(g, x, -500 + r * .5, r, r * .7); g.fill(); }   // hanging pots
  }, { res: .55, fin: { rim: .35, under: .3, side: .12 } });
  L.push(new Layer({ sheet: wall, x: 0, y: 0, z: 0, d: 2.7, trans: .1, lit: .5, name: 'wall' }));
  const frame = paint(520, 480, g => { g.fillStyle = '#3c2a2e'; rr(g, -260, -240, 520, 480, 220); g.fill(); cut(g, () => { rr(g, -230, -210, 460, 420, 200); g.fill(); }); g.fillRect(-4, -210, 8, 420); g.fillRect(-230, -4, 460, 8); }, { res: .8, fin: { rim: .4 } });
  L.push(new Layer({ sheet: frame, x: -560, y: -350, z: .2, d: 2.68, name: 'winFrame' }));
  const table = paint(1100, 420, g => { g.fillStyle = '#8a5a34'; rr(g, -520, -60, 1040, 60, 14); g.fill(); g.fillStyle = '#6a4224'; g.fillRect(-500, 0, 40, 400); g.fillRect(460, 0, 40, 400); g.fillStyle = 'rgba(255,220,170,.15)'; g.fillRect(-510, -56, 1020, 8); }, { res: .8, ay: 60, fin: { rim: .45, under: .3, side: .12 } });
  L.push(new Layer({ sheet: table, x: KT.tableX, y: KT.tableY + 60, z: 2.2, d: 2.12, name: 'table' }));
  const bench = paint(700, 300, g => { g.fillStyle = '#7a4a2a'; rr(g, -330, -40, 660, 40, 10); g.fill(); g.fillStyle = '#5a3a20'; g.fillRect(-300, 0, 30, 220); g.fillRect(270, 0, 30, 220); }, { res: .8, ay: 40, fin: { rim: .45, under: .3, side: .12 } });
  L.push(new Layer({ sheet: bench, x: KT.tomX - 20, y: KT.tomY + 12, z: 1.9, d: 2.02, name: 'bench' }));
  const stool = paint(300, 300, g => { g.fillStyle = '#7a4a2a'; rr(g, -120, -30, 240, 34, 10); g.fill(); g.fillStyle = '#5a3a20'; g.fillRect(-100, 0, 22, 240); g.fillRect(78, 0, 22, 240); }, { res: .8, ay: 30, fin: { rim: .45, under: .3, side: .12 } });
  L.push(new Layer({ sheet: stool, x: KT.catX, y: KT.tableY + 40, z: 2.25, d: 2.1, name: 'stool' }));
  const candleL = new Layer({ sheet: PR.candle(3), x: KT.candleX, y: KT.tableY, z: 2.3, d: 2.11, sx: .8, sy: .8, name: 'candle' });
  L.push(candleL);
  const floorEdge = paint(4000, 600, g => { g.fillStyle = '#1e1410'; g.fillRect(-2000, 0, 4000, 600); }, { res: .4, ay: 0 });
  L.push(new Layer({ sheet: floorEdge, x: 0, y: 560, z: 8, d: 1.6, name: 'floorEdge' }));
  const sc = { bg: '#140c0a', layers: L, cam: { x: 0, y: 0, zoom: 1, dz: 0 }, actD: 2.0, light: { x: KT.candleX, y: KT.tableY - 120, r: 1200, col: [255, 190, 110], floor: .22 }, lightDir: [-.4, .9], focus: 2.0, haze: null,
    post: { bloom: .24, tint: [255, 196, 140], tintA: .14 }, litGain: .6, candleL,
    fx: [(g, { cam }) => { const t = sc.t || 0, f = flick(t), [px, py, Z] = scr(KT.candleX, KT.tableY - 96 * .8, 2.11, cam);
      glow(g, px, py, 600 * Z * f, [255, 170, 90], .36); glow(g, px, py, 90 * Z * f, [255, 230, 170], .6);
      g.save(); g.beginPath(); g.arc(px, py, 300 * Z, 0, TAU); g.clip(); specks(g, t, { n: 26, seed: 12, col: [255, 214, 150], a: .6, r: 2 * Z, speed: 7 }); g.restore();
      const [hx, hy, Z2] = scr(950, 300, 2.7, cam); glow(g, hx, hy, 300 * Z2, [255, 110, 40], .25 * (.85 + .15 * Math.sin(t * 3))); }],
    update(t) { sc.t = t; candleL.sy = .8 * (1 + .01 * Math.sin(t * 9)); } };
  return sc;
}

// ---------- BEDROOM: the softest bed, a moon window, a candle ----------
export const BR = { bedX: 120, floor: 330 };
export function BEDROOM() {
  setLight(.6, .8);
  const L = [], F = BR.floor;
  const night = paint(600, 600, g => { g.fillStyle = grad(g, 0, -300, 0, 300, [[0, '#0b1740'], [1, '#2c3f78']]); g.fillRect(-300, -300, 600, 600); g.fillStyle = '#fff4cf'; ell(g, 60, -80, 60, 60); g.fill(); const R = mulberry(3); for (let i = 0; i < 26; i++) { g.globalAlpha = .4 + R() * .6; g.beginPath(); g.arc((R() - .5) * 560, (R() - .5) * 560, .8 + R() * 2, 0, TAU); g.fill(); } g.globalAlpha = 1; }, { res: 1, fin: { rim: 0, under: 0, side: 0 } });
  L.push(new Layer({ sheet: night, x: -700, y: -300, z: -.5, d: 6, trans: .8, lit: .5, shadow: false, name: 'night' }));
  const wall = paint(3400, 1800, g => { g.fillStyle = '#6a5a8a'; g.fillRect(-1700, -900, 3400, 1800); g.fillStyle = '#5e4e7e'; for (let x = -1700; x < 1700; x += 160) g.fillRect(x, -900, 60, 1800); cut(g, () => { rr(g, -920, -560, 440, 440, 200); g.fill(); }); g.fillStyle = '#8a5a3a'; g.fillRect(-1700, F, 3400, 600); }, { res: .55, fin: { rim: .35, under: .3, side: .12 } });
  L.push(new Layer({ sheet: wall, x: 0, y: 0, z: 0, d: 2.7, trans: .1, lit: .5, name: 'wall' }));
  L.push(new Layer({ sheet: bed(1), x: BR.bedX, y: F + 40, z: 2, d: 2.15, name: 'bed' }));
  const candleL = new Layer({ sheet: PR.candle(3), x: -420, y: F - 40, z: 2.1, d: 2.15, sx: .8, sy: .8, name: 'candle' });
  const sidet = paint(300, 300, g => { g.fillStyle = '#7a4a2a'; rr(g, -110, -260, 220, 30, 8); g.fill(); g.fillRect(-90, -230, 180, 230); }, { res: 1, ay: 280, fin: { rim: .45, under: .3, side: .12 } });
  L.push(new Layer({ sheet: sidet, x: -420, y: F + 40, z: 2.05, d: 2.16, name: 'sideTable' }), candleL);
  const floorEdge = paint(4000, 500, g => { g.fillStyle = '#1e1418'; g.fillRect(-2000, 0, 4000, 500); }, { res: .4, ay: 0 });
  L.push(new Layer({ sheet: floorEdge, x: 0, y: F + 330, z: 8, d: 1.6, name: 'floorEdge' }));
  const sc = { bg: '#140c18', layers: L, cam: { x: 0, y: 0, zoom: 1, dz: 0 }, actD: 2.1, light: { x: -420, y: F - 160, r: 1300, col: [255, 196, 120], floor: .3 }, lightDir: [.6, .8], focus: 2.1, haze: null,
    post: { bloom: .22, tint: [200, 190, 255], tintA: .1 }, litGain: .55,
    fx: [(g, { cam }) => { const t = sc.t || 0, [px, py, Z] = scr(-420, F - 40 - 96 * .8, 2.15, cam); glow(g, px, py, 520 * Z * flick(t), [255, 180, 100], .34); glow(g, px, py, 80 * Z, [255, 230, 170], .55); }],
    update(t) { sc.t = t; } };
  return sc;
}

// ---------- END: the lantern and the closed storybook in the middle third; "Lantern and Page" small at the bottom ----------
export function ENDTABLE() {
  const sc = buildTable(), G = TABLE_GEO;
  for (const l of sc.layers) {
    if (l.name === 'book' || l === sc.pageFlip || l === sc.pageNew) l.vis = false;
    if (l.sheet && l.x === -560) l.vis = false;                            // the bookshelf (the outer thirds stay calm: only the dark window frame)
    if (l.sheet && l.x === 560 && l.d === 7) l.vis = false;
  }
  const lan = sc.layers.find(l => l.name === 'lantern'), dx = -140 - G.lanX; lan.x += dx; sc.flame.x += dx;
  for (const l of sc.layers) if (l.sheet && l.x === 560 && l.d !== 7) l.vis = false;                 // the window frame too: the outer thirds stay empty
  const patch = paint(340, 420, g => { g.fillStyle = '#1c2850'; g.fillRect(-170, -210, 340, 420); }, { res: .5, fin: { rim: 0, under: 0, side: 0 } });
  sc.layers.push(new Layer({ sheet: patch, x: 560, y: -210, z: .1, d: 6, shadow: false, name: 'patch' }));
  sc.layers.push(new Layer({ sheet: closedBook(1.4), x: 120, y: G.bookY + 10, z: 3.2, d: 2.0, sx: .45, sy: .45, trans: .2, name: 'cbook' }));
  const fx0 = sc.fx[0];
  sc.fx = [(g, c) => { const save = TABLE_GEO.lanX; TABLE_GEO.lanX = -140; fx0(g, c); TABLE_GEO.lanX = save; },
    g => { g.save(); g.font = '40px "Lilita One"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(251,239,210,.88)'; g.shadowColor = 'rgba(0,0,10,.5)'; g.shadowBlur = 10; g.shadowOffsetY = 4; g.fillText('Lantern and Page', 960, 990); g.restore(); }];
  return sc;
}
