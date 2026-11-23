// The film's locations, each a stack of paper layers (L1 sky ... L6 foreground frame, L7 atmosphere drawn as fx).
// Conventions: the action plane is d = 2; characters stand with their feet on y = GY (outdoors) or FLOOR (indoors).
import { paint, Layer, glow, specks, W, H, project, setLight, Sheet } from '../engine.js';
import { PAL, cut, rr, ell, ridge, fir, puffCloud, tufts, star5 } from '../art.js';
import { mulberry, TAU, clamp, lerp } from '../lib.js';
import * as PR from './props.js';

export const GY = 300;
const grad = (g, x0, y0, x1, y1, st) => { const gr = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([p, c]) => gr.addColorStop(p, c)); return gr; };
const scr = (x, y, d, cam) => { const p = project(x, y, d, cam); return p ? [p.px, p.py, p.Z] : [-9e3, -9e3, 1]; };
// ---------- shared paper motifs ----------
export function tree(g, x, y, h, col = '#4f8a4a', trunk = '#6a4a30', seed = 1) {   // a round paper tree standing on (x, y)
  const R = mulberry(seed); g.fillStyle = trunk; g.beginPath(); g.moveTo(x - h * .05, y); g.lineTo(x - h * .035, y - h * .45); g.lineTo(x + h * .035, y - h * .45); g.lineTo(x + h * .05, y); g.closePath(); g.fill();
  g.fillStyle = col; g.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, r = h * (.2 + R() * .08), cx = x + Math.cos(a) * h * .18, cy = y - h * .66 + Math.sin(a) * h * .16; g.moveTo(cx + r, cy); g.arc(cx, cy, r, 0, TAU); } g.fill();
}
function flowers(g, x0, x1, y, seed = 2, cols = ['#f4d24a', '#f08cb0', '#fbf6ee', '#e86a5a']) {
  const R = mulberry(seed); for (let x = x0; x < x1; x += 18 + R() * 30) { const h = 30 + R() * 70; g.strokeStyle = '#3e6a34'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (R() - .5) * 20, y - h * .5, x + (R() - .5) * 14, y - h); g.stroke(); g.fillStyle = cols[(R() * cols.length) | 0]; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; g.beginPath(); g.ellipse(x + Math.cos(a) * 7, y - h + Math.sin(a) * 7, 6, 4, a, 0, TAU); g.fill(); } g.fillStyle = '#e8a030'; ell(g, x, y - h, 4, 4); g.fill(); }
}
function fence(g, x0, x1, y, col = '#a88a64') { g.fillStyle = col; for (let x = x0; x < x1; x += 120) { rr(g, x, y - 110, 16, 110, 4); g.fill(); } g.fillRect(x0, y - 92, x1 - x0, 12); g.fillRect(x0, y - 52, x1 - x0, 12); }

// ---------- a generic outdoor set ----------
// o: { sky:[top,mid,low], sunX, sunY, far:{col,amp,base,items(g)}, mid:{col,items(g)}, main(g), road:{col,edge}, near:{col}, fg:[{draw,x,y,d}], light, lightDir, haze, post }
export function outdoor(o) {
  setLight(...(o.lightDir || [.62, .78]));
  const L = [], WD = o.width || 9000;
  const sky = paint(WD * .5, 2600, g => { g.fillStyle = grad(g, 0, -1300, 0, 1300, [[0, o.sky[0]], [.42, o.sky[1]], [.62, o.sky[2]], [1, o.sky[2]]]); g.fillRect(-WD * .25, -1300, WD * .5, 2600); }, { res: .3, fin: { rim: 0, under: 0, side: 0, grain: false } });
  L.push(new Layer({ sheet: sky, x: 0, y: -400, z: 0, d: 20, trans: .4, lit: .45, shadow: false, haze: 0, name: 'sky' }));
  if (o.sunX != null) { const sun = paint(260, 260, g => { g.fillStyle = o.sunCol || '#fff4d0'; ell(g, 0, 0, 80, 80); g.fill(); }, { res: 1, fin: { rim: 0, under: 0, side: 0 } }); L.push(new Layer({ sheet: sun, x: o.sunX, y: o.sunY, z: .5, d: 18, trans: 1, lit: 1, shadow: false, haze: 0, name: 'sun' })); }
  const clouds = [];
  const R = mulberry(o.seed || 7);
  for (let i = 0; i < (o.clouds ?? 7); i++) {
    const w = 380 + R() * 500, h = w * .32, d = 8 + R() * 2, s = paint(w + 60, h + 60, g => { g.fillStyle = o.cloudCol || '#fff2da'; puffCloud(g, 0, h / 2 - 10, w, h, (R() * 99) | 0); }, { res: .7, fin: { rim: .5, under: .12, side: .1 } });
    const l = new Layer({ sheet: s, x: (i - 3) * 900 + R() * 300, y: -520 - R() * 260, z: 1 + 1 / d, d, trans: .55, lit: .55, drift: (R() - .5) * 14, name: 'cloud' }); l.x0 = l.x; L.push(l); clouds.push(l);
  }
  if (o.far) { const f = o.far, s = paint(WD * .7, 900, g => { g.fillStyle = f.col; ridge(g, { x0: -WD * .35, x1: WD * .35, base: f.base ?? -60, bottom: 450, amp: f.amp ?? 150, f: [.0028, .008, .02], seed: f.seed ?? 5 }); f.items?.(g); }, { res: .5, ay: 450, fin: { rim: .4, under: .18 } }); L.push(new Layer({ sheet: s, x: 0, y: f.y ?? -120, z: 2.0, d: 8, trans: .5, lit: .7, name: 'far' })); }
  if (o.mid) { const f = o.mid, s = paint(WD * .8, 900, g => { g.fillStyle = f.col; ridge(g, { x0: -WD * .4, x1: WD * .4, base: f.base ?? 20, bottom: 450, amp: f.amp ?? 90, f: [.004, .011, .027], seed: f.seed ?? 21 }); f.items?.(g); }, { res: .5, ay: 450, fin: { rim: .4, under: .2 } }); L.push(new Layer({ sheet: s, x: 0, y: f.y ?? 40, z: 2.3, d: 4, trans: .35, lit: .7, name: 'mid' })); }
  if (o.main) { const s = paint(WD, 1400, o.main, { res: .55, ay: 1000, fin: { rim: .45, under: .3, side: .12 } }); L.push(new Layer({ sheet: s, x: 0, y: GY - 40, z: 2.5, d: o.mainD ?? 2.7, trans: .2, lit: .6, name: 'main' })); }
  if (o.road) { const r = o.road, s = paint(WD, 900, g => { g.fillStyle = r.col; g.fillRect(-WD / 2, -60, WD, 960); g.fillStyle = r.edge || 'rgba(0,0,0,.1)'; g.fillRect(-WD / 2, -60, WD, 14); const Q = mulberry(9); g.fillStyle = r.spot || 'rgba(90,60,30,.18)'; for (let i = 0; i < WD / 30; i++) { ell(g, -WD / 2 + Q() * WD, -30 + Q() * 600, 4 + Q() * 10, 2 + Q() * 4); g.fill(); } r.items?.(g); }, { res: .5, ay: 0, fin: { rim: .3, under: .25, side: .05 } }); L.push(new Layer({ sheet: s, x: 0, y: GY - 30, z: 2.7, d: 2.05, trans: .05, name: 'road' })); }
  if (o.near) { const n = o.near, s = paint(WD * 1.2, 700, g => { g.fillStyle = n.col; tufts(g, -WD * .6, WD * .6, -150, n.h ?? 70, n.seed ?? 4, 16); g.fillRect(-WD * .6, -150, WD * 1.2, 860); n.items?.(g); }, { res: .45, ay: 0, fin: { rim: .3, under: .3 } }); L.push(new Layer({ sheet: s, x: 0, y: GY + 330, z: 8, d: 1.6, name: 'near' })); }
  for (const f of o.fg || []) { const s = paint(f.w || 800, f.h || 800, f.draw, { res: .7, fin: { rim: .3, side: .2 } }); L.push(new Layer({ sheet: s, x: f.x, y: f.y, z: 9 + (f.z || 0), d: f.d || 1.3, name: f.name || 'fg', vis: f.vis ?? true, flipX: !!f.flip })); }
  const sc = {
    bg: o.bg || '#8fbfe0', layers: L, cam: { x: 0, y: 0, zoom: 1, dz: 0 }, clouds, actD: 2,
    light: o.light || { x: -700, y: -420, r: 2200, col: [255, 226, 170], floor: .55 }, lightDir: o.lightDir || [.62, .78], focus: 2.0,
    haze: o.haze === null ? null : { col: o.hazeCol || '#c6d6ec', from: 3.5, span: 10, max: .42 }, post: o.post || { bloom: .1, tint: [255, 222, 170], tintA: .14 }, litGain: o.litGain ?? .3,
    fx: [(g, { cam }) => { if (o.sunX != null) { const [x, y] = scr(o.sunX, o.sunY, 18, cam); glow(g, x, y, 560, [255, 228, 160], .3); } }, ...(o.fx || [])],
    update(t) { sc.t = t; for (const l of clouds) l.x = l.x0 + l.drift * t; o.update?.(sc, t); },
  };
  return sc;
}

// ---------- SHED: the shed corner at the mill (planks, shelves, a crate, a basket; the bag and boots on a shelf) ----------
export const SHED_GEO = { floor: 300, shelfY: -150 };
export function SHED() {
  setLight(.7, .7);
  const L = [], F = SHED_GEO.floor;
  const wall = paint(3000, 1600, g => {
    g.fillStyle = '#c9a678'; g.fillRect(-1500, -800, 3000, 1600); const R = mulberry(3);
    for (let x = -1500; x < 1500; x += 70) { g.fillStyle = `rgba(${90 + R() * 30},${60 + R() * 20},30,${.12 + R() * .1})`; g.fillRect(x, -800, 66, 1600); g.fillStyle = 'rgba(70,40,20,.35)'; g.fillRect(x + 66, -800, 4, 1600); }
    cut(g, () => { rr(g, -700, -560, 300, 260, 20); g.fill(); });
    g.fillStyle = '#7a5434'; g.fillRect(-712, -572, 324, 14); g.fillRect(-712, -312, 324, 14); g.fillRect(-712, -572, 14, 274); g.fillRect(-402, -572, 14, 274); g.fillRect(-557, -572, 10, 274);
    g.fillStyle = '#8a5e3a'; g.fillRect(-1500, 260, 3000, 540);   // floor boards
    g.strokeStyle = 'rgba(50,30,15,.4)'; g.lineWidth = 3; for (let y = 300; y < 800; y += 50) { g.beginPath(); g.moveTo(-1500, y); g.lineTo(1500, y); g.stroke(); }
    for (const y of [SHED_GEO.shelfY, SHED_GEO.shelfY - 250]) { g.fillStyle = '#7a5434'; g.fillRect(100, y, 700, 22); g.fillStyle = '#5e3e24'; for (const x of [140, 740]) { g.beginPath(); g.moveTo(x, y + 22); g.lineTo(x + 30, y + 22); g.lineTo(x, y + 80); g.closePath(); g.fill(); } }
    g.fillStyle = '#b0a090'; for (const [x, w, h] of [[160, 60, 90], [240, 40, 70], [600, 80, 110]]) { rr(g, x, SHED_GEO.shelfY - 250 - h, w, h, 8); g.fill(); }
    g.strokeStyle = '#6a6a72'; g.lineWidth = 8; g.beginPath(); g.moveTo(-200, -400); g.lineTo(-120, -120); g.stroke(); g.fillStyle = '#9a9aa4'; g.beginPath(); g.moveTo(-140, -140); g.lineTo(-80, -100); g.lineTo(-130, -60); g.closePath(); g.fill();   // a hanging tool
  }, { res: .6, fin: { rim: .3, under: .3, side: .14 } });
  const light = paint(320, 280, g => { g.fillStyle = grad(g, 0, -130, 0, 130, [[0, '#ffe6a8'], [1, '#ffc870']]); g.fillRect(-160, -140, 320, 280); }, { res: .6, fin: { rim: 0, under: 0, side: 0 } });
  L.push(new Layer({ sheet: light, x: -550, y: -430, z: -1, d: 3.1, trans: 1, lit: 1, shadow: false, haze: 0 }));
  L.push(new Layer({ sheet: wall, x: 0, y: 0, z: 0, d: 2.6, trans: .1, lit: .5, name: 'wall' }));
  L.push(new Layer({ sheet: PR.crate(2), x: -260, y: F + 30, z: 2, d: 2.2, sx: 1.4, sy: 1.4, name: 'crate' }));
  L.push(new Layer({ sheet: PR.basket(2, 'none'), x: -40, y: F + 30, z: 2.1, d: 2.2, sx: 1.2, sy: 1.2, name: 'basket' }));
  L.push(new Layer({ sheet: PR.bag(3), x: 340, y: SHED_GEO.shelfY + 2, z: 1.5, d: 2.55, sx: 1.05, sy: 1.05, name: 'bag' }));
  L.push(new Layer({ sheet: PR.boots(3), x: 620, y: SHED_GEO.shelfY + 4, z: 1.5, d: 2.55, sx: 1.3, sy: 1.3, name: 'boots' }));
  const fg = paint(700, 1400, g => { g.fillStyle = '#3a2618'; g.fillRect(-120, -700, 240, 1400); g.fillStyle = '#4a3220'; g.fillRect(-120, -700, 40, 1400); }, { res: .5, fin: { rim: .3 } });
  L.push(new Layer({ sheet: fg, x: -1200, y: 0, z: 9, d: 1.35, name: 'fgPost' }));
  const sc = { bg: '#3a2a20', layers: L, cam: { x: 0, y: 0, zoom: 1, dz: 0 }, actD: 2.2, light: { x: -550, y: -430, r: 1600, col: [255, 214, 150], floor: .4 }, lightDir: [.7, .7], focus: 2.2, haze: null,
    post: { bloom: .14, tint: [255, 220, 170], tintA: .14 }, litGain: .35,
    fx: [(g, { cam }) => { const t = sc.t || 0, P = [[-700, -560], [-400, -560], [300, F + 40], [-300, F + 40]].map(([x, y]) => scr(x, y, 2.5, cam)); g.save(); g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,226,170,.1)'; g.fill(); g.globalCompositeOperation = 'source-over'; g.clip(); specks(g, t, { n: 70, seed: 6, a: .5, r: 1.8 * (P[2][2] || 1), speed: 4, vx: 5 }); g.restore(); }],
    update(t) { sc.t = t; } };
  return sc;
}

// ---------- ROAD: the country road (fields far away, a fence and trees, the road, a grass edge, flowers in front) ----------
export function ROAD() {
  return outdoor({
    sky: ['#86b6dc', '#cfe3ee', '#f4e6c4'], sunX: -900, sunY: -600, seed: 11,
    far: { col: '#9db8a8', amp: 120, base: -40, items: g => { const R = mulberry(5); g.fillStyle = '#c8c48a'; for (let i = 0; i < 18; i++) { const x = -3000 + i * 340; g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 300, 30); g.lineTo(x + 280, 80); g.lineTo(x - 20, 90); g.closePath(); g.fill(); } } },
    mid: { col: '#7fa878', amp: 70, base: 60, items: g => { const R = mulberry(8); for (let x = -3500; x < 3500; x += 220 + R() * 260) tree(g, x, 110 + Math.sin(x * .01) * 20, 160 + R() * 80, '#5f8a5a', '#6a4a30', x | 0); } },
    main: g => { fence(g, -4500, 4500, -70, '#b89a70'); const R = mulberry(12); for (let x = -4300; x < 4300; x += 600 + R() * 700) tree(g, x, -60, 420 + R() * 160, '#4f7f48', '#5e4028', (x | 0) + 3); },
    road: { col: '#d8c08e', edge: 'rgba(120,90,50,.25)', items: g => { g.fillStyle = 'rgba(150,120,70,.25)'; for (let x = -4500; x < 4500; x += 90) { ell(g, x, 150, 30, 5); g.fill(); ell(g, x + 40, 320, 34, 6); g.fill(); } } },
    near: { col: '#2f4a2e', h: 90, items: g => flowers(g, -5400, 5400, -150, 4) },
    fg: [{ w: 700, h: 900, x: -1100, y: 260, d: 1.3, name: 'flowersL', draw: g => { g.fillStyle = '#1d2f22'; tufts(g, -350, 350, 300, 360, 7, 18); g.fillRect(-350, 300, 700, 160); flowers(g, -320, 320, 300, 9, ['#f08cb0', '#f4d24a', '#fbf6ee']); } }],
  });
}

// ---------- FOREST: the forest edge in the morning (far firs, trunks and berry bushes, ferns, hanging leaves) ----------
export function FOREST() {
  return outdoor({
    sky: ['#a8c8e0', '#f2e0b8', '#f6d8a8'], sunX: 700, sunY: -560, seed: 3, clouds: 4, lightDir: [-.6, .8], light: { x: 700, y: -420, r: 2200, col: [255, 226, 170], floor: .55 },
    far: { col: '#7e9a94', amp: 60, base: -10, items: g => { g.fillStyle = '#6a8a80'; const R = mulberry(2); for (let x = -3200; x < 3200; x += 36 + R() * 40) fir(g, x, 40 + R() * 30, 140 + R() * 120); } },
    mid: { col: '#5f7f5a', amp: 40, base: 80, items: g => { g.fillStyle = '#4a6a46'; const R = mulberry(7); for (let x = -3500; x < 3500; x += 60 + R() * 70) fir(g, x, 120, 240 + R() * 160); } },
    main: g => { const R = mulberry(14); for (let x = -4400; x < 4400; x += 260 + R() * 260) { g.fillStyle = '#6a4a32'; g.fillRect(x - 26, -900, 52 + R() * 20, 900); g.fillStyle = '#3f6a3a'; ell(g, x, -880, 220, 160); g.fill(); } },
    road: { col: '#8aa86a', edge: 'rgba(40,60,30,.25)', spot: 'rgba(60,90,40,.2)' },
    near: { col: '#24402a', h: 120, items: g => { g.fillStyle = '#2e5232'; const R = mulberry(3); for (let x = -5000; x < 5000; x += 120 + R() * 140) { for (let k = 0; k < 7; k++) { g.save(); g.translate(x, -140); g.rotate(-1.2 + k * .4); g.beginPath(); g.ellipse(0, -60, 14, 64, 0, 0, TAU); g.fill(); g.restore(); } } } },
    fg: [{ w: 800, h: 900, x: 1100, y: -500, d: 1.3, name: 'leavesR', draw: g => { const R = mulberry(12); g.strokeStyle = '#1e3220'; g.lineWidth = 8; g.beginPath(); g.moveTo(400, -450); g.bezierCurveTo(200, -300, 60, -100, -100, 200); g.stroke(); g.fillStyle = '#244028'; for (let i = 0; i < 36; i++) { const u = R(), x = 400 - u * 460 + (R() - .5) * 110, y = -450 + u * 620 + (R() - .5) * 70; g.save(); g.translate(x, y); g.rotate(R() * TAU); g.beginPath(); g.moveTo(0, -30); g.quadraticCurveTo(26, -12, 0, 30); g.quadraticCurveTo(-26, -12, 0, -30); g.fill(); g.restore(); } } }],
    post: { bloom: .14, tint: [255, 226, 170], tintA: .12 },
  });
}

// ---------- HILL: the long road up to the king's castle (seen low; the castle with flags at the top) ----------
export function HILL() {
  const sc = outdoor({
    sky: ['#7fb0d8', '#bcd8ec', '#f2e2c0'], sunX: -800, sunY: -900, seed: 5, clouds: 6,
    far: { col: '#a8b8d0', amp: 80, base: 60, y: -260 },
    mid: { col: '#8ab07a', amp: 40, base: 160, y: -100, items: g => { g.fillStyle = '#7aa06a'; g.beginPath(); g.moveTo(-3600, 450); g.bezierCurveTo(-1200, 400, -400, -40, 0, -120); g.bezierCurveTo(400, -40, 1200, 400, 3600, 450); g.closePath(); g.fill(); } },
    main: g => { g.fillStyle = '#6a9a5e'; g.beginPath(); g.moveTo(-4500, 1000); g.bezierCurveTo(-2000, 900, -800, 200, 0, -40); g.bezierCurveTo(800, 200, 2000, 900, 4500, 1000); g.closePath(); g.fill(); g.fillStyle = '#d8c08e'; g.beginPath(); g.moveTo(-500, 1000); g.bezierCurveTo(-200, 700, 200, 400, -40, -30); g.lineTo(20, -30); g.bezierCurveTo(300, 400, 120, 700, 500, 1000); g.closePath(); g.fill(); },
    mainD: 3.4, near: { col: '#3a5a34', h: 110 },
    fg: [{ w: 900, h: 700, x: -1150, y: -560, d: 1.35, name: 'branch', draw: g => { g.strokeStyle = '#2a2a22'; g.lineWidth = 14; g.beginPath(); g.moveTo(-450, -200); g.bezierCurveTo(-100, -150, 100, -60, 380, 40); g.stroke(); const R = mulberry(4); g.fillStyle = '#2e4a2a'; for (let i = 0; i < 30; i++) { const u = R(), x = -440 + u * 800, y = -200 + u * 230 + (R() - .5) * 90; g.save(); g.translate(x, y); g.rotate(R() * TAU); g.beginPath(); g.moveTo(0, -26); g.quadraticCurveTo(22, -10, 0, 26); g.quadraticCurveTo(-22, -10, 0, -26); g.fill(); g.restore(); } } }],
  });
  const castle = new Layer({ sheet: PR.castle(.7), x: 0, y: -60, z: 2.4, d: 4.2, sx: .9, sy: .9, trans: .25, lit: .7, name: 'castle' });
  sc.layers.push(castle); sc.castle = castle;
  return sc;
}

// ---------- THRONE: the king's throne room (arched windows, red curtains, pillars, the throne, a carpet; a door on the left) ----------
export const THRONE_GEO = { floor: 330, throneX: 380, doorX: -760 };
export function THRONE() {
  setLight(.6, .8);
  const L = [], G = THRONE_GEO;
  const back = paint(3600, 1800, g => {
    g.fillStyle = '#e2c58f'; g.fillRect(-1800, -900, 3600, 1800);
    const R = mulberry(5); g.strokeStyle = 'rgba(140,100,60,.25)'; g.lineWidth = 3; for (let y = -900; y < 500; y += 60) for (let x = -1800 + (y / 60 % 2) * 60; x < 1800; x += 120) g.strokeRect(x, y, 120, 60);
    cut(g, () => { for (const x of [-500, 0, 500]) { g.beginPath(); g.moveTo(x - 110, -100); g.lineTo(x - 110, -440); g.arc(x, -440, 110, Math.PI, 0); g.lineTo(x + 110, -100); g.closePath(); g.fill(); } });
    g.fillStyle = '#a8763a'; for (const x of [-500, 0, 500]) { g.fillRect(x - 6, -540, 12, 440); g.fillRect(x - 110, -330, 220, 10); }
    g.fillStyle = '#c8a060'; g.fillRect(-1800, 300, 3600, 600);   // floor
    g.fillStyle = '#a83a4a'; g.beginPath(); g.moveTo(-160, 900); g.lineTo(-90, 300); g.lineTo(90, 300); g.lineTo(160, 900); g.closePath(); g.fill();   // carpet strip toward the throne
  }, { res: .55, fin: { rim: .35, under: .3, side: .12 } });
  const win = paint(1400, 600, g => { g.fillStyle = grad(g, 0, -300, 0, 300, [[0, '#cfe6f6'], [1, '#fff2d0']]); g.fillRect(-700, -300, 1400, 600); g.fillStyle = '#a8c4a0'; ridge(g, { x0: -700, x1: 700, base: 140, bottom: 300, amp: 60, seed: 3 }); }, { res: .6, fin: { rim: 0, under: 0, side: 0 } });
  const winL = new Layer({ sheet: win, x: 0, y: -330, z: -1, d: 3.3, trans: 1, lit: .9, shadow: false, haze: 0, name: 'windows' });
  L.push(winL, new Layer({ sheet: back, x: 0, y: 0, z: 0, d: 2.9, trans: .1, lit: .5, name: 'wall' }));
  const pillar = paint(200, 1600, g => { g.fillStyle = '#d8c4a0'; g.fillRect(-60, -800, 120, 1600); g.fillStyle = '#c0aa84'; g.fillRect(20, -800, 40, 1600); g.fillStyle = '#e8d8b8'; rr(g, -80, -800, 160, 50, 10); g.fill(); rr(g, -80, 640, 160, 60, 10); g.fill(); }, { res: .7 });
  for (const x of [-1100, 1100]) L.push(new Layer({ sheet: pillar, x, y: -100, z: 1, d: 2.6, name: 'pillar' }));
  const curtain = paint(500, 1500, g => { g.fillStyle = '#8a2a4a'; g.beginPath(); g.moveTo(-250, -750); g.lineTo(250, -750); g.bezierCurveTo(200, -200, 80, 100, 60, 750); g.lineTo(-250, 750); g.closePath(); g.fill(); g.strokeStyle = 'rgba(40,0,20,.35)'; g.lineWidth = 8; for (const x of [-180, -90, 0]) { g.beginPath(); g.moveTo(x, -750); g.quadraticCurveTo(x + 40, 0, x - 10, 750); g.stroke(); } g.fillStyle = '#e8b84a'; g.fillRect(-250, -750, 500, 30); }, { res: .6, fin: { rim: .4, side: .25 } });
  L.push(new Layer({ sheet: curtain, x: 800, y: -200, z: 1.2, d: 2.55, name: 'curtainBack' }));
  const door = paint(420, 760, g => { g.fillStyle = '#6a4228'; g.beginPath(); g.moveTo(-180, 380); g.lineTo(-180, -200); g.arc(0, -200, 180, Math.PI, 0); g.lineTo(180, 380); g.closePath(); g.fill(); g.strokeStyle = '#4a2a18'; g.lineWidth = 6; for (const x of [-90, 0, 90]) { g.beginPath(); g.moveTo(x, 380); g.lineTo(x, -300); g.stroke(); } g.fillStyle = '#e8b84a'; ell(g, 120, 40, 14, 14); g.fill(); }, { res: .8 });
  const doorL = new Layer({ sheet: door, x: G.doorX, y: G.floor - 380, z: 1.1, d: 2.62, name: 'door' });
  const doorHole = paint(420, 760, g => { g.fillStyle = '#3a2a2a'; g.beginPath(); g.moveTo(-180, 380); g.lineTo(-180, -200); g.arc(0, -200, 180, Math.PI, 0); g.lineTo(180, 380); g.closePath(); g.fill(); }, { res: .5, finish: false });
  L.push(new Layer({ sheet: doorHole, x: G.doorX, y: G.floor - 380, z: 1.05, d: 2.63, shadow: false, name: 'doorHole' }), doorL);
  L.push(new Layer({ sheet: PR.throne(2), x: G.throneX, y: G.floor + 10, z: 2, d: 2.25, sx: 1.05, sy: 1.05, name: 'throne' }));
  const table = paint(520, 300, g => { g.fillStyle = '#8a5a34'; rr(g, -240, -140, 480, 30, 8); g.fill(); g.fillRect(-220, -110, 24, 110); g.fillRect(196, -110, 24, 110); g.fillStyle = '#f0e6d0'; g.beginPath(); g.moveTo(-250, -140); g.lineTo(250, -140); g.lineTo(240, -80); g.lineTo(-240, -80); g.closePath(); g.fill(); }, { res: 1, ax: 260, ay: 260 });
  L.push(new Layer({ sheet: table, x: -60, y: G.floor + 60, z: 2.5, d: 2.15, name: 'giftTable', vis: false }));
  const floorEdge = paint(4000, 500, g => { g.fillStyle = '#2a1420'; g.fillRect(-2000, 0, 4000, 500); g.fillStyle = '#4a2030'; g.fillRect(-2000, 0, 4000, 18); }, { res: .4, ay: 0 });
  L.push(new Layer({ sheet: floorEdge, x: 0, y: G.floor + 300, z: 8, d: 1.6, name: 'floorEdge' }));
  const curtainF = paint(700, 1700, g => { g.fillStyle = '#150a10'; g.beginPath(); g.moveTo(-350, -850); g.lineTo(350, -850); g.bezierCurveTo(250, -300, 160, 200, 200, 850); g.lineTo(-350, 850); g.closePath(); g.fill(); g.fillStyle = '#3a1a26'; g.fillRect(-350, -850, 700, 40); }, { res: .5, fin: { rim: .25, side: .2 } });
  L.push(new Layer({ sheet: curtainF, x: -1250, y: -100, z: 9, d: 1.3, name: 'curtainF' }));
  const sc = { bg: '#2a1a20', layers: L, cam: { x: 0, y: 0, zoom: 1, dz: 0 }, actD: 2.2, light: { x: 0, y: -400, r: 1800, col: [255, 226, 170], floor: .45 }, lightDir: [.6, .8], focus: 2.2, haze: null,
    post: { bloom: .14, tint: [255, 224, 176], tintA: .12 }, litGain: .35, winL, doorL, winTint: null,
    fx: [(g, { cam }) => { const t = sc.t || 0, wk = sc.week || 0; for (const x of [-500, 0, 500]) { const P = [[x - 110, -540], [x + 110, -540], [x + 420, G.floor + 40], [x - 60, G.floor + 40]].map(([a, b]) => scr(a, b, 2.6, cam)); g.save(); g.beginPath(); P.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); g.globalCompositeOperation = 'lighter'; g.fillStyle = wk === 1 ? 'rgba(200,220,255,.08)' : wk === 2 ? 'rgba(255,200,110,.16)' : 'rgba(255,232,180,.11)'; g.fill(); g.globalCompositeOperation = 'source-over'; g.clip(); specks(g, t, { n: 26, seed: 3 + x, a: .45, r: 1.6 * (P[2][2] || 1), speed: 4 }); g.restore(); } }],
    update(t) { sc.t = t; const wk = sc.week || 0; winL.bright = wk === 1 ? .85 : 1; sc.post.tint = wk === 2 ? [255, 200, 130] : wk === 1 ? [225, 232, 255] : [255, 224, 176]; sc.post.tintA = wk === 2 ? .2 : .12; },
    reset() { sc.week = 0; } };
  return sc;
}

// ---------- SQUARE: the village square (rooftops, houses, the crier's stand, the bakery stall, bunting, cobbles) ----------
export const SQ = { standX: 260, stallX: -700 };
function house(g, x, w, h, col, roof, seed) {
  const R = mulberry(seed); g.fillStyle = col; g.fillRect(x - w / 2, -h, w, h); g.fillStyle = roof; g.beginPath(); g.moveTo(x - w / 2 - 30, -h); g.lineTo(x, -h - w * .55); g.lineTo(x + w / 2 + 30, -h); g.closePath(); g.fill();
  g.fillStyle = 'rgba(90,50,30,.55)'; for (const yy of [-h + 30, -h * .55]) { g.fillRect(x - w / 2, yy, w, 8); }
  g.fillStyle = '#ffd27a'; for (let i = 0; i < 2; i++) { rr(g, x - w * .3 + i * w * .4, -h + 60, w * .18, w * .22, 10); g.fill(); }
  g.fillStyle = '#6a4228'; rr(g, x - w * .12, -h * .42, w * .24, h * .42, w * .12); g.fill();
}
export function SQUARE() {
  return outdoor({
    sky: ['#86b6dc', '#d6e8f2', '#f6e8c8'], sunX: 900, sunY: -650, seed: 21, clouds: 6, lightDir: [-.62, .78], light: { x: 900, y: -500, r: 2400, col: [255, 226, 170], floor: .55 },
    far: { col: '#b8a8a0', amp: 30, base: 40, items: g => { const R = mulberry(3); for (let x = -3000; x < 3000; x += 140 + R() * 120) { g.fillStyle = ['#c87a5a', '#a86a5a', '#b88a6a'][(R() * 3) | 0]; g.beginPath(); g.moveTo(x - 70, 60); g.lineTo(x, -40 - R() * 60); g.lineTo(x + 70, 60); g.closePath(); g.fill(); } g.fillStyle = '#a89888'; g.fillRect(200, -240, 60, 300); g.beginPath(); g.moveTo(180, -240); g.lineTo(230, -360); g.lineTo(280, -240); g.closePath(); g.fill(); } },
    main: g => { const R = mulberry(7), cols = ['#e8d2b0', '#f0c8a8', '#d8c8e0', '#e8e0c0', '#f4d8c0'], roofs = ['#b4573b', '#7a5a8a', '#9a4a3a', '#5a7a9a']; for (let i = 0; i < 14; i++) { const x = -4200 + i * 620 + R() * 80; house(g, x, 420 + R() * 120, 560 + R() * 200, cols[i % 5], roofs[i % 4], i); } },
    road: { col: '#c8b8a0', edge: 'rgba(90,70,50,.3)', spot: 'rgba(90,70,50,.0)', items: g => { g.strokeStyle = 'rgba(90,70,50,.28)'; g.lineWidth = 3; for (let y = 0; y < 900; y += 46) for (let x = -4500 + (y / 46 % 2) * 40; x < 4500; x += 80) { g.beginPath(); g.ellipse(x, y, 36, 18, 0, 0, TAU); g.stroke(); } } },
    near: { col: '#5a4a40', h: 10 },
    fg: [{ w: 3000, h: 400, x: 0, y: -640, d: 1.4, name: 'bunting', draw: g => { g.strokeStyle = '#3a2a2a'; g.lineWidth = 4; for (const [x0, x1, sag] of [[-1500, 0, 120], [0, 1500, 100]]) { g.beginPath(); g.moveTo(x0, -120); g.quadraticCurveTo((x0 + x1) / 2, -120 + sag * 2, x1, -120); g.stroke(); for (let i = 1; i < 14; i++) { const u = i / 14, x = x0 + (x1 - x0) * u, y = -120 + sag * 4 * u * (1 - u); g.fillStyle = ['#e85a5a', '#f4d24a', '#5a9ae8', '#7ac86a', '#f08cb0'][i % 5]; g.beginPath(); g.moveTo(x - 26, y); g.lineTo(x + 26, y); g.lineTo(x, y + 60); g.closePath(); g.fill(); } } } }],
    update: (sc, t) => {},
  });
}
// the crier's wooden stand and the bakery stall (striped awning, counter, bread and treats), as props for the square
export const crierStand = (res = 1) => paint(500, 360, g => { g.fillStyle = '#9a6a3e'; rr(g, -220, -200, 440, 40, 8); g.fill(); g.fillStyle = '#7a5030'; for (const x of [-200, 170]) g.fillRect(x, -170, 30, 170); g.fillRect(-200, -100, 400, 20); g.fillStyle = '#8a5a34'; for (let i = 0; i < 3; i++) rr(g, 200 + i * 10, -150 + i * 50, 80, 20, 5), g.fill(); }, { res, ax: 250, ay: 340, fin: { rim: .45, under: .3, side: .15 } });
export const stall = (res = 1) => paint(900, 900, g => {
  g.fillStyle = '#8a5a34'; for (const x of [-400, 380]) g.fillRect(x, -760, 22, 760);
  for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#fbf6ee' : '#e85a5a'; g.beginPath(); g.moveTo(-440 + i * 100, -760); g.lineTo(-340 + i * 100, -760); g.lineTo(-330 + i * 100, -600); g.quadraticCurveTo(-380 + i * 100, -570, -430 + i * 100, -600); g.closePath(); g.fill(); }
  g.fillStyle = '#b07a46'; g.fillRect(-420, -320, 840, 320); g.fillStyle = '#8a5a34'; g.fillRect(-430, -340, 860, 30);
  g.strokeStyle = 'rgba(60,30,10,.35)'; g.lineWidth = 4; for (let x = -400; x < 420; x += 60) { g.beginPath(); g.moveTo(x, -310); g.lineTo(x, 0); g.stroke(); }
  g.fillStyle = '#fbf0d8'; rr(g, -160, -720, 320, 80, 14); g.fill(); g.fillStyle = '#8a4a2a'; g.font = '60px "Lilita One"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BAKERY', 0, -678);
  const b = PR.bread(2); for (const x of [-300, -180, 200, 320]) g.drawImage(b.c, x - b.ax / b.res * 1.2, -380 - b.ay / b.res * 1.2, b.c.width / b.res * 1.2, b.c.height / b.res * 1.2);
}, { res, ax: 450, ay: 880, fin: { rim: .45, under: .3, side: .15 } });

// ---------- RIVER: the riverbank by the road (far trees, the river with sparkle, the bank, a bush and a rock, reeds, grass) ----------
export const RIV = { waterY: 360, bankY: 300 };
export function RIVER() {
  const sc = outdoor({
    sky: ['#86b6dc', '#cfe3ee', '#f4e6c4'], sunX: -700, sunY: -620, seed: 31, clouds: 6,
    far: { col: '#8aa894', amp: 70, base: -30, items: g => { const R = mulberry(4); for (let x = -3500; x < 3500; x += 160 + R() * 160) tree(g, x, 60, 240 + R() * 100, '#6e9a7a', '#5e4a3a', x | 0); } },
    mid: { col: '#7aa070', amp: 30, base: 120, items: g => { g.fillStyle = '#d8c08e'; g.fillRect(-3600, 60, 7200, 60); } },
    main: g => { const R = mulberry(9); for (let x = -4200; x < 4200; x += 700 + R() * 600) tree(g, x, -380, 460 + R() * 140, '#4f8a4a', '#5e4028', (x | 0) + 7); g.fillStyle = '#6a9a5a'; g.fillRect(-4500, -380, 9000, 420); },
    road: { col: '#7aa860', edge: 'rgba(40,70,30,.3)', spot: 'rgba(40,80,30,.15)' },
    near: { col: '#2a4430', h: 140, seed: 8 },
    fg: [{ w: 700, h: 900, x: 1150, y: 300, d: 1.3, name: 'grassR', draw: g => { g.fillStyle = '#1c2e20'; tufts(g, -350, 350, 300, 420, 12, 16); g.fillRect(-350, 300, 700, 200); } }],
  });
  // the river itself: a band of water with moving ripples and sparkles, in front of the far bank, behind the near bank
  const W2 = paint(9000, 520, g => { g.fillStyle = grad(g, 0, -40, 0, 480, [[0, '#8ac0d8'], [1, '#4a86a8']]); g.fillRect(-4500, -40, 9000, 520); }, { res: .4, ay: 0, fin: { rim: .4, under: .2, side: 0 } });
  const water = new Layer({ sheet: W2, x: 0, y: RIV.waterY - 330, z: 3.8, d: 2.25, trans: .3, lit: .7, name: 'water' });
  const ripples = new Layer({ x: 0, y: 0, z: 3.85, d: 2.25, noDepth: true, draw(g, info) {
    const t = sc.t || 0, R = mulberry(31); g.strokeStyle = 'rgba(255,250,235,.6)'; g.lineCap = 'round';
    for (let i = 0; i < 90; i++) { const y = RIV.waterY - 320 + R() * 470, l = 30 + R() * 60, x = ((R() * 6000 + t * (14 + R() * 10)) % 6000) - 3000; const [qx, qy, Z] = scr(x, y, 2.25, sc.cam); g.lineWidth = 2.2 * Z; g.beginPath(); g.moveTo(qx, qy); g.bezierCurveTo(qx + l * .3 * Z, qy - 4 * Z, qx + l * .6 * Z, qy + 4 * Z, qx + l * Z, qy); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 40; i++) { const x = R() * 5000 - 2500, y = RIV.waterY - 300 + R() * 400, tw = Math.max(0, Math.sin(t * (2 + R() * 3) + R() * 9)); if (tw < .7) continue; const [qx, qy, Z] = scr(x, y, 2.25, sc.cam); g.beginPath(); g.arc(qx, qy, 2.5 * Z * tw, 0, TAU); g.fill(); }
  } });
  const bank = paint(9000, 900, g => { g.fillStyle = '#5a8a4a'; g.beginPath(); g.moveTo(-4500, 900); g.lineTo(-4500, 40); for (let x = -4500; x <= 4500; x += 60) g.lineTo(x, 30 + Math.sin(x * .004) * 20); g.lineTo(4500, 900); g.closePath(); g.fill(); g.fillStyle = '#3e6a3a'; tufts(g, -4500, 4500, 40, 60, 3, 16); }, { res: .45, ay: 0, fin: { rim: .4, under: .3 } });
  const bankL = new Layer({ sheet: bank, x: 0, y: RIV.waterY + 120, z: 5, d: 1.9, name: 'bank' });
  const i = sc.layers.findIndex(l => l.name === 'road'); sc.layers.splice(i + 1, 0, water, ripples, bankL);
  const bush = new Layer({ sheet: PR.bush(2, '#3e7a3c'), x: 520, y: RIV.waterY + 160, z: 5.5, d: 1.88, name: 'bush' });
  const rock = new Layer({ sheet: PR.rock(2), x: -380, y: RIV.waterY + 150, z: 5.4, d: 1.88, name: 'rock' });
  sc.layers.push(bush, rock); sc.water = water; sc.bush = bush; sc.rock = rock;
  return sc;
}

// ---------- CARRIAGE: the royal coach (outside, by the road) and inside (seat, window with the landscape passing) ----------
export const coachCut = (res = 1.5) => { const s = PR.coach(res); return s.variant('cut', () => { const c = document.createElement('canvas'); c.width = s.c.width; c.height = s.c.height; const g = c.getContext('2d'); g.drawImage(s.c, 0, 0); g.globalCompositeOperation = 'destination-out'; g.setTransform(res, 0, 0, res, s.ax, s.ay); for (const x of [-140, 40]) { rr(g, x, -350, 120, 130, 34); g.fill(); } return new Sheet(c, s.ax, s.ay, res); }); };
export const coachBack = (res = 1) => paint(760, 520, g => { g.fillStyle = '#6a2436'; for (const x of [-140, 40]) { rr(g, x - 12, -362, 144, 154, 24); g.fill(); } }, { res, ax: 380, ay: 520, finish: false });
// a carriage on the road: two white horses, the coach on two turning wheels, passengers seen through the windows
export function carriage(c, x, y, o = {}) {
  const d = o.d ?? 2.1, s = o.s ?? .9, ph = o.phase ?? c.t * 2.6, face = o.face || 'R', dir = face === 'R' ? 1 : -1, z0 = o.z ?? 3.5;
  c.layer(new Layer({ sheet: coachBack(1), x, y: y - 30 * s, d: d + .005, z: z0, sx: s * dir, sy: s, shadow: false }));
  // passengers are seen only through the two windows (screen-space clip of the window openings)
  const winClip = gg => { for (const wx of [-140, 40]) { const xa = x + (dir > 0 ? wx - 4 : -(wx + 124)) * s, xb = xa + 128 * s, ya = y - 30 * s - 356 * s, yb = y - 30 * s - 214 * s; const [p0x, p0y] = c.p(xa, ya, d + .003), [p1x, p1y] = c.p(xb, yb, d + .003); gg.rect(p0x, p0y, p1x - p0x, p1y - p0y); } };
  for (const p of o.pass || []) c.actor(p.kind, { clip: winClip, x: x + p.dx * s * dir, y: y - ((o.passY ?? 95) - (p.dy || 0)) * s, d: d + .003, z: z0 + .1, face: p.face || face, s: 1.25 * s * .62, contact: false, shadow: false, who: p.who, pose: p.pose || {} });
  c.layer(new Layer({ sheet: coachCut(1.5), x, y: y - 30 * s, d, z: z0 + .2, sx: s * dir, sy: s, shadow: { dx: 20, dy: 14, blur: 16, a: .3 } }));
  for (const wx of [-190, 200]) c.layer(new Layer({ sheet: PR.wheel(1.5), x: x + wx * s * dir, y: y - 110 * s, d: d - .01, z: z0 + .3, sx: s, sy: s, rot: (o.roll ?? c.t * 2.2) * dir, shadow: false }));
  if (o.horses !== false) for (const [hx, dd, k] of [[460, .02, .8], [520, -.02, .95]]) c.actor('horse', { x: x + hx * s * dir, y, d: d + dd, z: z0 + (dd < 0 ? .5 : -.1), face, s: 1.25 * s * k, who: 'horse' + hx, pose: { walk: o.still ? null : ph + hx * .01, lookX: .6 } });
}
export function CARRIAGE_IN() {
  setLight(.6, .8);
  const L = [];
  const land = paint(8000, 900, g => { g.fillStyle = grad(g, 0, -450, 0, 450, [[0, '#9ac4e0'], [.45, '#e8e2c4'], [.46, '#9ab878'], [1, '#6a9a5a']]); g.fillRect(-4000, -450, 8000, 900); const R = mulberry(5); for (let x = -4000; x < 4000; x += 160 + R() * 200) tree(g, x, 40, 200 + R() * 120, '#5f8a5a', '#5e4028', x | 0); g.fillStyle = '#e8c97a'; for (let x = -4000; x < 4000; x += 900) g.fillRect(x, 120, 500, 300); }, { res: .5, fin: { rim: .3, under: .2 } });
  const landL = new Layer({ sheet: land, x: 0, y: -80, z: 0, d: 4, trans: .3, lit: .6, name: 'land' });
  const wall = paint(3000, 1600, g => { g.fillStyle = '#7a2a3e'; g.fillRect(-1500, -800, 3000, 1600); g.fillStyle = '#8a3448'; for (let x = -1500; x < 1500; x += 120) for (let y = -800; y < 300; y += 120) { g.beginPath(); g.arc(x + 60, y + 60, 50, 0, TAU); g.fill(); } cut(g, () => { rr(g, -380, -520, 760, 460, 90); g.fill(); }); g.strokeStyle = '#e8b84a'; g.lineWidth = 22; rr(g, -390, -530, 780, 480, 96); g.stroke(); g.fillStyle = '#5a1e2e'; g.fillRect(-1500, 300, 3000, 500); }, { res: .55, fin: { rim: .4, under: .3, side: .15 } });
  L.push(landL, new Layer({ sheet: wall, x: 0, y: 0, z: 1, d: 2.6, trans: .1, lit: .5, name: 'wall' }));
  const curtain = paint(400, 700, g => { g.fillStyle = '#c8a040'; g.beginPath(); g.moveTo(-200, -350); g.lineTo(200, -350); g.bezierCurveTo(100, -100, 0, 100, -40, 350); g.lineTo(-200, 350); g.closePath(); g.fill(); }, { res: .7, fin: { rim: .4, side: .2 } });
  L.push(new Layer({ sheet: curtain, x: -520, y: -300, z: 1.2, d: 2.55, name: 'curtain' }));
  const seat = paint(3000, 700, g => { g.fillStyle = '#a83a4a'; rr(g, -1500, -300, 3000, 300, 60); g.fill(); g.fillStyle = '#c84a5a'; for (let x = -1400; x < 1500; x += 200) { ell(g, x, -150, 80, 110); g.fill(); } g.fillStyle = '#8a2a3a'; g.fillRect(-1500, 0, 3000, 700); }, { res: .55, fin: { rim: .4, under: .3 } });
  L.push(new Layer({ sheet: seat, x: 0, y: 330, z: 1.5, d: 2.35, name: 'seat' }));
  const frame = paint(900, 1600, g => { g.fillStyle = '#2a1420'; g.fillRect(-450, -800, 900, 1600); g.fillStyle = '#e8b84a'; g.fillRect(380, -800, 26, 1600); }, { res: .5, fin: { rim: .3, side: .2 } });
  L.push(new Layer({ sheet: frame, x: -1300, y: 0, z: 9, d: 1.3, name: 'frameL' }));
  const sc = { bg: '#3a1420', layers: L, cam: { x: 0, y: 0, zoom: 1, dz: 0 }, actD: 2.2, light: { x: 0, y: -350, r: 1500, col: [255, 230, 180], floor: .5 }, lightDir: [.6, .8], focus: 2.2, haze: null, post: { bloom: .12, tint: [255, 224, 180], tintA: .1 }, litGain: .35,
    update(t) { sc.t = t; landL.x = -((t * 260) % 3000); sc.cam.sy = (sc.cam.sy || 0) + Math.sin(t * 13) * 1.2 + Math.sin(t * 7.3) * .8; } };
  return sc;
}
// the outside of the coach, close: its side with the window, the passenger looking out (the king's "Whose ... ?" framing)
export function COACHSIDE() {
  const sc = outdoor({ sky: ['#86b6dc', '#cfe3ee', '#f4e6c4'], seed: 41, clouds: 5, far: { col: '#9db8a8', amp: 60, base: 0 }, mid: { col: '#7fa878', amp: 40, base: 60, items: g => { const R = mulberry(8); for (let x = -3500; x < 3500; x += 220 + R() * 260) tree(g, x, 110, 180 + R() * 80, '#5f8a5a', '#6a4a30', x | 0); } }, haze: null });
  return sc;
}
