// Scenes for the sample. Each scene: { layers, cam, light, lightDir, focus, haze, fx, pre, post, update(t) }.
// Depth (d): sky 20, clouds/far hills 8, mid hills 4, walls ~2.6-2.8, characters 2.0-2.2, near ground 1.6, foreground 1.3.
import { paint, Layer, glow, specks, W, H, mk, D0, place, project, setLight } from './engine.js';
import { PAL, cut, rr, ell, ridge, fir, puffCloud, tufts, star5, textRun, glyphLayers } from './art.js';
import { makeTom, makePuss, tomRear, breadRear, blinkTrack, spring, antic } from './puppets.js';
import { mulberry, TAU, clamp, lerp, seg, ss, eo, eio, back } from './lib.js';

const grad = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([p, c]) => gr.addColorStop(p, c)); return gr; };
const flick = t => 1 + .07 * Math.sin(7.3 * t) * Math.sin(3.1 * t) + .03 * Math.sin(17 * t);
const scr = (x, y, d, cam) => { const p = project(x, y, d, cam); return p ? [p.px, p.py, p.Z] : [-9999, -9999, 1]; };

// ===================== TABLE: a cool blue night room, a warm pool of lantern light =====================
export const TABLE_GEO = { lanX: -300, lanY: 150, bookX: 240, bookY: 222 };
export function buildTable() {
  setLight(.86, .5);   // light comes from the lantern on the left
  const G = TABLE_GEO, L = [];
  const wall = paint(2600, 1500, g => {
    g.fillStyle = grad(g, 0, -750, 0, 750, [[0, '#0f1630'], [.55, '#1e2b52'], [1, '#26335a']]); g.fillRect(-1300, -750, 2600, 1500);
    cut(g, () => { rr(g, 410, -360, 300, 380, 140); g.fill(); });
  }, { res: .6, fin: { rim: .2, under: .15, side: 0 } });
  L.push(new Layer({ sheet: wall, x: 0, y: -40, z: 0, d: 6, trans: .25, shadow: false }));
  const night = paint(520, 560, g => {
    g.fillStyle = grad(g, 0, -280, 0, 280, [[0, '#0b1740'], [1, '#2c3f78']]); g.fillRect(-260, -280, 520, 560);
    g.fillStyle = '#fff4cf'; g.beginPath(); g.arc(-30, -90, 46, 0, TAU); g.arc(-10, -104, 40, 0, TAU); g.fill('evenodd');
    const R = mulberry(4); for (let i = 0; i < 34; i++) { g.globalAlpha = .4 + R() * .6; g.beginPath(); g.arc((R() - .5) * 480, (R() - .5) * 520, .8 + R() * 2, 0, TAU); g.fill(); } g.globalAlpha = 1;
  }, { res: 1, fin: { rim: 0, under: 0, side: 0 } });
  L.push(new Layer({ sheet: night, x: 560, y: -210, z: -.5, d: 7, trans: .8, lit: .5, shadow: false }));
  const frame = paint(360, 430, g => { g.fillStyle = '#3c2a3e'; rr(g, -180, -215, 360, 430, 160); g.fill(); cut(g, () => { rr(g, -150, -190, 300, 380, 140); g.fill(); }); g.fillRect(-4, -190, 8, 380); g.fillRect(-150, -10, 300, 8); }, { res: 1 });
  L.push(new Layer({ sheet: frame, x: 560, y: -210, z: .2, d: 5.9, trans: .1 }));
  const shelf = paint(700, 300, g => {
    g.fillStyle = '#2c2e56'; g.fillRect(-350, 110, 700, 20);
    const R = mulberry(9); let x = -340; const cols = ['#5a2d4a', '#2f4f6a', '#6a4a3a', '#3a4a7a', '#6a3a3a'];
    for (let i = 0; i < 9; i++) { const w = 26 + R() * 22, h = 90 + R() * 60; g.fillStyle = cols[i % 5]; rr(g, x, 110 - h, w, h, 4); g.fill(); g.fillStyle = 'rgba(255,230,190,.25)'; g.fillRect(x + 4, 110 - h * .6, w - 8, 3); x += w + 3; }
  }, { res: 1 });
  L.push(new Layer({ sheet: shelf, x: -560, y: -190, z: .5, d: 5 }));
  const table = paint(2800, 700, g => {
    g.fillStyle = grad(g, 0, -350, 0, 350, [[0, '#4a2c22'], [.12, '#3a2219'], [1, '#1c1210']]); g.fillRect(-1400, -350, 2800, 700);
    const R = mulberry(3); g.strokeStyle = 'rgba(12,4,2,.4)'; g.lineWidth = 3; for (let i = 0; i < 26; i++) { const y = -300 + i * 25 + R() * 10; g.beginPath(); g.moveTo(-1400, y); g.bezierCurveTo(-400, y + R() * 16, 400, y - R() * 16, 1400, y + R() * 10); g.stroke(); }
  }, { res: .7, fin: { rim: .5, rimPx: 3 } });
  L.push(new Layer({ sheet: table, x: 0, y: 590, z: 1, d: 2.6, trans: .1 }));
  // the lantern: a metal cap with a ring handle, a frame around glass panes, a little flame inside
  const lantern = paint(300, 520, g => {
    const M = '#34323e', Mh = '#5a5868';
    g.strokeStyle = M; g.lineWidth = 9; g.beginPath(); g.arc(0, -238, 30, 0, TAU); g.stroke();                                          // ring handle
    g.fillStyle = M; g.beginPath(); g.moveTo(-86, -150); g.quadraticCurveTo(-80, -205, 0, -210); g.quadraticCurveTo(80, -205, 86, -150); g.closePath(); g.fill();   // domed cap
    rr(g, -16, -226, 32, 22, 6); g.fill(); g.fillStyle = Mh; g.fillRect(-70, -160, 140, 6);
    g.fillStyle = M; rr(g, -98, -152, 196, 20, 6); g.fill(); rr(g, -104, 150, 208, 22, 6); g.fill(); rr(g, -116, 168, 232, 26, 8); g.fill();   // top plate, bottom plate, foot
    g.fillStyle = 'rgba(255,214,140,.82)'; g.fillRect(-86, -132, 172, 284);                                                              // glass
    g.fillStyle = 'rgba(255,248,226,.45)'; g.beginPath(); g.moveTo(-74, -126); g.lineTo(-58, -126); g.lineTo(-74, 120); g.closePath(); g.fill();   // a glint on the glass
    g.fillStyle = M; for (const x of [-90, -4, 82]) rr(g, x, -136, 10, 292, 3), g.fill();                                               // frame bars
    g.fillStyle = Mh; for (const x of [-90, -4, 82]) g.fillRect(x + 2, -136, 2, 292);
    g.fillStyle = '#c8b9a0'; rr(g, -14, 96, 28, 54, 6); g.fill(); g.fillStyle = '#efe4d2'; ell(g, 0, 96, 14, 5); g.fill();              // the candle inside
  }, { res: 1.5, fin: { rim: .5, side: .2 } });
  const lanL = new Layer({ sheet: lantern, x: G.lanX, y: G.lanY, z: 3, d: 2.05, trans: .45, lit: .9, name: 'lantern' });
  L.push(lanL);
  const flame = new Layer({ x: G.lanX, y: G.lanY + 66, z: 3.1, d: 2.05, noDepth: true, draw(g, info) {
    const t = sc.t || 0, f = flick(t), { px, py, Z } = info, sw = Math.sin(t * 5.3) * 2.2 + Math.sin(t * 11) * .8;
    glow(g, px, py - 10 * Z, 120 * Z * f, [255, 190, 100], .55);
    g.save(); g.translate(px, py); g.scale(Z, Z * (.92 + .1 * f));
    g.fillStyle = '#ffb648'; g.beginPath(); g.moveTo(0, -46); g.bezierCurveTo(14 + sw, -24, 14, -4, 0, 0); g.bezierCurveTo(-14, -4, -14 + sw, -24, 0, -46); g.fill();
    g.fillStyle = '#fff3c8'; g.beginPath(); g.moveTo(sw * .5, -30); g.bezierCurveTo(7, -16, 6, -4, 0, -2); g.bezierCurveTo(-6, -4, -7, -16, sw * .5, -30); g.fill();
    g.restore();
  } });
  L.push(flame);
  const PAGE = (g, s) => { g.beginPath(); g.moveTo(s * 6, 20); g.lineTo(s * 6, -170); g.bezierCurveTo(s * 120, -190, s * 280, -176, s * 358, -150); g.lineTo(s * 366, 30); g.bezierCurveTo(s * 250, 14, s * 110, 24, s * 6, 20); g.closePath(); };
  const book = paint(760, 360, g => {
    g.fillStyle = '#6a2d4a'; rr(g, -380, -30, 760, 70, 14); g.fill();
    for (const s of [-1, 1]) { PAGE(g, s); g.fillStyle = '#efe0c0'; g.fill(); g.fillStyle = '#d9c7a0'; g.beginPath(); g.moveTo(s * 366, 30); g.lineTo(s * 366, 44); g.lineTo(s * 8, 36); g.lineTo(s * 8, 20); g.closePath(); g.fill(); }
    g.strokeStyle = 'rgba(90,60,40,.55)'; g.lineWidth = 3; g.lineCap = 'round'; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(-320, -130 + i * 24); g.lineTo(-40 - (i % 3) * 30, -126 + i * 24); g.stroke(); }
    g.fillStyle = '#6a8fb0'; g.beginPath(); g.moveTo(40, 0); g.lineTo(110, -90); g.lineTo(170, -30); g.lineTo(230, -110); g.lineTo(330, 0); g.closePath(); g.fill();
    g.fillStyle = '#e8a050'; g.beginPath(); g.arc(256, -100, 22, 0, TAU); g.fill();
  }, { res: 1.2, ay: 200 });
  L.push(new Layer({ sheet: book, x: G.bookX, y: G.bookY, z: 3.2, d: 2.0, sx: .78, sy: .78, trans: .25, name: 'book' }));
  const pageFace = paint(380, 240, g => { PAGE(g, 1); g.fillStyle = '#efe0c0'; g.fill(); g.strokeStyle = 'rgba(90,60,40,.5)'; g.lineWidth = 3; g.lineCap = 'round'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(30, -120 + i * 22); g.lineTo(300 - (i % 3) * 40, -116 + i * 22); g.stroke(); } }, { res: 1.2, ax: 6, ay: 190 });
  const pageBack = paint(380, 240, g => { PAGE(g, 1); g.fillStyle = '#e6d5b0'; g.fill(); }, { res: 1.2, ax: 6, ay: 190 });
  const newPage = paint(380, 240, g => { PAGE(g, 1); g.save(); g.clip(); g.fillStyle = grad(g, 0, -190, 0, 40, [[0, '#7fb0d8'], [.55, '#f4dcae'], [1, '#ffcf92']]); g.fillRect(0, -200, 380, 250); g.fillStyle = '#fff4de'; puffCloud(g, 120, -60, 120, 50, 3); puffCloud(g, 260, -100, 140, 56, 5); g.restore(); }, { res: 2, ax: 6, ay: 190 });
  const pageNew = new Layer({ sheet: newPage, x: G.bookX, y: G.bookY, z: 3.3, d: 1.995, sx: .78, sy: .78, trans: .05, vis: false, shadow: false, haze: 0 });
  const pageFlip = new Layer({ x: G.bookX, y: G.bookY, z: 3.4, d: 1.99, vis: false, flip: 0, draw(g, info, l) {
    const { px, py, Z } = info, s = Z * .78, th = Math.PI * l.flip, c = Math.cos(th), sn = Math.sin(th), W2 = 356;
    // a point of the turning page: u from the spine (0) to the free edge (1), v from the top (0) to the bottom (1)
    const P = (u, v) => {
      const bend = Math.sin(u * Math.PI) * 34 * sn;                         // the page bows as it lifts
      const lift = 1 + .16 * sn * u;                                         // the lifted edge is nearer the camera: it looks taller
      const ytop = -170 + (-176 + 170 + 26) * u, ybot = 20 + 10 * u, y = (ytop + (ybot - ytop) * v + 75) * lift - 75;
      return [px + (6 + u * W2 * c + bend * (c >= 0 ? 1 : -1) * .6) * s, py + y * s];
    };
    // the shadow it throws on the page below
    if (sn > .02) { g.save(); g.globalAlpha = .35 * sn; const [ax, ay] = P(0, 0), [bx] = P(1, .5); const gr = g.createLinearGradient(ax, 0, ax + (bx - ax) * 1.2 + 60 * s, 0); gr.addColorStop(0, 'rgba(20,10,4,.8)'); gr.addColorStop(1, 'rgba(20,10,4,0)'); g.fillStyle = gr; g.fillRect(Math.min(ax, bx + 80 * s), ay, Math.abs(bx - ax) + 160 * s, 200 * s); g.restore(); }
    g.beginPath(); for (let i = 0; i <= 16; i++) g.lineTo(...P(i / 16, 0)); for (let i = 16; i >= 0; i--) g.lineTo(...P(i / 16, 1)); g.closePath();
    const front = c >= 0; g.fillStyle = front ? '#efe0c0' : '#e4d2ac'; g.fill();
    g.save(); g.clip();
    const [sx0] = P(0, .5), [sx1] = P(1, .5), sg2 = g.createLinearGradient(sx0, 0, sx1, 0);     // shading: dark in the crease, a soft light on the curl
    sg2.addColorStop(0, `rgba(60,36,14,${.35 * sn + .08})`); sg2.addColorStop(.55, `rgba(255,248,230,${.18 * sn})`); sg2.addColorStop(1, `rgba(60,36,14,${.22 * sn})`);
    g.fillStyle = sg2; g.fillRect(Math.min(sx0, sx1) - 10, py - 260 * s, Math.abs(sx1 - sx0) + 20, 400 * s);
    if (front) {   // the same picture as the book's right-hand page: two blue mountains and an orange sun
      const L2P = (x, y) => { const uu = (x - 6) / W2, yt = -170 + 20 * uu, yb = 20 + 10 * uu; return P(uu, (y - yt) / (yb - yt)); };
      g.fillStyle = '#6a8fb0'; g.beginPath(); [[40, 0], [110, -90], [170, -30], [230, -110], [330, 0]].forEach(([x, y], i) => i ? g.lineTo(...L2P(x, y)) : g.moveTo(...L2P(x, y))); g.closePath(); g.fill();
      g.fillStyle = '#e8a050'; g.beginPath(); for (let k = 0; k <= 20; k++) { const a = k / 20 * TAU; g.lineTo(...L2P(256 + Math.cos(a) * 22, -100 + Math.sin(a) * 22)); } g.fill();
    }
    g.restore();
    g.strokeStyle = 'rgba(60,40,20,.35)'; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i <= 16; i++) g.lineTo(...P(i / 16, 0)); g.stroke();
  } });
  L.push(pageFlip, pageNew);
  const sc = {
    bg: '#0c1226', layers: L, cam: { x: 0, y: 0, zoom: 1, dz: 0 }, pageFlip, pageNew, flame,
    light: { x: -300, y: 120, r: 900, col: [255, 196, 120], floor: .25 }, lightDir: [.86, .5], focus: 2.05, haze: null,
    post: { bloom: .26, tint: [190, 205, 255], tintA: 0 }, litGain: .7,
    fx: [(g, { cam }) => {
      if (sc.noGlow) return;
      const t = sc.t || 0, f = flick(t), [lx, ly, Z] = scr(G.lanX, G.lanY, 2.05, cam);
      glow(g, lx, ly, 560 * Z * f, [255, 160, 80], .36);                                  // the warm pool on the wall and table
      glow(g, lx + 260 * Z, ly + 150 * Z, 520 * Z, [255, 150, 70], .18);
      g.save(); g.beginPath(); g.arc(lx, ly - 40 * Z, 380 * Z, 0, TAU); g.clip(); specks(g, t, { n: 34, seed: 3, col: [255, 214, 150], a: .65, r: 2.2 * Z, speed: 9 }); g.restore();   // dust only in the lantern's light
    }],
    update(t) { sc.t = t; lanL.lit = .9 * flick(t); },
  };
  return sc;
}

// ===================== the opening sky + the mill by the river (one world: the camera tilts down through it) =====================
// Composition at cam (0,0), zoom 1 = the mill wide shot: sky above y = -270 (25 %), the mill 470 px tall (43 %), its base at y = 130.
export const MILL = { x: 70, base: 130, wheelX: -118, wheelY: 0, wheelR: 150 };
export function buildMillWorld() {
  setLight(.62, .78);   // afternoon sun from the upper left, as on the steps
  const L = [], M = MILL;
  const sky = paint(3600, 2800, g => { g.fillStyle = grad(g, 0, -1400, 0, 1400, [[0, '#5d93c8'], [.3, '#8fc0e2'], [.5, '#f3dba6'], [.6, '#ffcf8a'], [1, '#f0b070']]); g.fillRect(-1800, -1400, 3600, 2800); }, { res: .35, fin: { rim: 0, under: 0, side: 0, grain: false } });
  L.push(new Layer({ sheet: sky, x: 0, y: -620, z: 0, d: 20, trans: .4, lit: .45, shadow: false, haze: 0, name: 'sky' }));
  const sun = paint(220, 220, g => { g.fillStyle = '#fff4d0'; g.beginPath(); g.arc(0, 0, 70, 0, TAU); g.fill(); }, { res: 1, fin: { rim: 0, under: 0, side: 0 } });
  L.push(new Layer({ sheet: sun, x: -640, y: -380, z: .5, d: 18, trans: 1, lit: 1, shadow: false, haze: 0 }));
  const cl = [];
  for (const [x, y, w, h, seed, d, drift] of [[-40, -760, 1300, 360, 5, 4, 0], [-820, -720, 520, 170, 3, 9, 9], [820, -660, 560, 190, 7, 9, -7], [-700, -330, 460, 150, 11, 8.5, 6], [720, -300, 500, 160, 13, 8.5, -5], [80, -420, 420, 140, 9, 9.5, 4]]) {
    const s = paint(w + 60, h + 60, g => { g.fillStyle = '#fff2da'; puffCloud(g, 0, h / 2 - 10, w, h, seed); }, { res: .8, fin: { rim: .5, under: .12, side: .1 } });
    const l = new Layer({ sheet: s, x, y, z: 1 + 1 / d, d, trans: .55, lit: .55, drift, x0: x, name: 'cloud' }); L.push(l); cl.push(l);
  }
  // title in the big cloud, and the storybook credit line under it (letters type in one by one)
  const run = textRun('Puss in Boots', '"Lilita One"', 210, '#2a2347', { res: 1, fin: { rim: .55, under: .35 } });
  const letters = glyphLayers(run, { x: 0, y: -740, d: 4, z: 5.5 }); letters.forEach((l, i) => { l.gi = i; }); L.push(...letters);
  const run2 = textRun('by Lantern and Page', '"IM Fell English"', 100, '#3a2a4a', { res: 1.2, fin: { rim: .5, under: .3 } });
  const credit = glyphLayers(run2, { x: 0, y: -620, d: 4, z: 5.51 }); credit.forEach((l, i) => { l.gi = i; }); L.push(...credit);
  // hills
  const far = paint(3600, 700, g => { g.fillStyle = '#8fa8cf'; ridge(g, { x0: -1800, x1: 1800, base: -100, bottom: 350, amp: 150, f: [.0035, .009, .022], seed: 5 }); }, { res: .6, ay: 350, fin: { rim: .4, under: .18 } });
  L.push(new Layer({ sheet: far, x: 0, y: -170, z: 2.2, d: 8, trans: .5, lit: .7, name: 'far' }));
  const mid = paint(3600, 700, g => { g.fillStyle = '#6e9a84'; ridge(g, { x0: -1800, x1: 1800, base: 0, bottom: 350, amp: 110, f: [.005, .013, .031], seed: 21 }); g.fillStyle = '#4f7d66'; const R = mulberry(8); for (let x = -1700; x < 1700; x += 48 + R() * 60) fir(g, x, 50 + 30 * Math.sin(x * .013 + 1) - 12, 70 + R() * 70); }, { res: .7, ay: 350, fin: { rim: .4, under: .2 } });
  L.push(new Layer({ sheet: mid, x: 0, y: -60, z: 3, d: 4, trans: .35, lit: .7, name: 'mid' }));
  // the mill: plaster, timber, a tiled roof, lit windows, an open door
  const win = paint(100, 120, g => { g.fillStyle = '#ffcb70'; rr(g, -26, -34, 52, 70, 26); g.fill(); }, { res: 1.5, fin: { rim: 0, under: 0, side: 0 } });
  const body = paint(640, 560, g => {
    g.fillStyle = '#e6c58c'; g.beginPath(); g.moveTo(-160, 0); g.lineTo(160, 0); g.lineTo(142, -270); g.lineTo(-142, -270); g.closePath(); g.fill();
    g.fillStyle = '#8f5a3c'; for (const x of [-128, 0, 128]) g.fillRect(x - 5, -270, 10, 270); g.fillRect(-150, -140, 300, 10); g.fillRect(-150, -10, 300, 10);
    g.fillStyle = '#b4573b'; g.beginPath(); g.moveTo(-200, -258); g.lineTo(200, -258); g.lineTo(108, -420); g.lineTo(-108, -420); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,20,10,.35)'; g.lineWidth = 2.4; for (let r = 0; r < 5; r++) { const y = -270 - r * 30; g.beginPath(); for (let x = -190 + r * 18; x < 190 - r * 18; x += 26) { g.moveTo(x, y); g.arc(x + 13, y, 13, Math.PI, 0, true); } g.stroke(); }
    g.fillStyle = '#9b7a62'; rr(g, 70, -470, 40, 90, 4); g.fill();
    cut(g, () => { for (const x of [-84, 84]) { rr(g, x - 26, -230, 52, 72, 26); g.fill(); } g.beginPath(); g.arc(0, -350, 22, 0, TAU); g.fill(); rr(g, -50, -150, 100, 150, 50); g.fill(); });
    g.fillStyle = '#5a3a2c'; g.beginPath(); g.moveTo(-60, 0); g.lineTo(-60, -110); g.arc(0, -110, 60, Math.PI, 0); g.lineTo(60, 0); g.lineTo(52, 0); g.lineTo(52, -110); g.arc(0, -110, 52, 0, Math.PI, true); g.lineTo(-52, 0); g.closePath(); g.fill();
    g.fillStyle = '#4a3a2c'; rr(g, -150, -70, 22, 28, 4); g.fill();                                    // the axle bracket for the wheel
    g.fillStyle = '#7a5238'; g.beginPath(); g.moveTo(-170, -230); g.lineTo(-60, -232); g.lineTo(-60, -214); g.lineTo(-170, -212); g.closePath(); g.fill();   // the wooden flume over the wheel
  }, { res: 2, ax: 320, ay: 500, fin: { rim: .5, under: .32 } });
  const inner = paint(140, 200, g => { const ig = g.createRadialGradient(0, -60, 10, 0, -60, 110); ig.addColorStop(0, '#4a3340'); ig.addColorStop(1, '#1e121a'); g.fillStyle = ig; rr(g, -52, -158, 104, 160, 52); g.fill(); g.fillStyle = '#e8dcc4'; g.beginPath(); g.moveTo(-40, 0); g.bezierCurveTo(-48, -40, -36, -70, -14, -76); g.lineTo(8, -76); g.bezierCurveTo(30, -70, 40, -40, 36, 0); g.closePath(); g.fill(); g.fillStyle = '#8f8890'; ell(g, 26, -28, 26, 26); g.fill(); }, { res: 2, ax: 70, ay: 130, fin: { rim: .2 } });
  for (const [dx, dy, s] of [[-84, -194, 1], [84, -194, 1], [0, -328, .8]]) L.push(new Layer({ sheet: win, x: M.x + dx, y: M.base + dy, z: 3.9, d: 2.62, sx: s, sy: s, trans: 1, lit: .5, shadow: false, glowwin: true }));
  L.push(new Layer({ sheet: inner, x: M.x, y: M.base - 2, z: 3.92, d: 2.62, shadow: false }));
  L.push(new Layer({ sheet: body, x: M.x, y: M.base, z: 4, d: 2.6, trans: .25, lit: .8, name: 'mill' }));
  // the waterwheel, on the mill's side, turning; water falls from the flume onto it
  const wheel = paint(380, 380, g => {
    g.strokeStyle = '#6a4630'; g.lineWidth = 16; g.beginPath(); g.arc(0, 0, M.wheelR, 0, TAU); g.stroke(); g.lineWidth = 9; g.beginPath(); g.arc(0, 0, 112, 0, TAU); g.stroke();
    g.fillStyle = '#7a5238'; for (let i = 0; i < 12; i++) { g.save(); g.rotate(i * TAU / 12); g.fillRect(-5, -150, 10, 150); rr(g, -24, -178, 48, 30, 5); g.fill(); g.restore(); }
    g.fillStyle = '#4a3020'; g.beginPath(); g.arc(0, 0, 28, 0, TAU); g.fill(); g.fillStyle = '#2e1e14'; g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.fill();
  }, { res: 2, fin: { rim: .55, under: .3, side: .15 } });
  const wheelL = new Layer({ sheet: wheel, x: M.x + M.wheelX * 1 - 60, y: M.base + M.wheelY - 40, z: 4.2, d: 2.55, trans: .2, lit: .7, spin: true, name: 'wheel' });
  L.push(wheelL);
  // falling water from the flume onto the wheel (drawn), splashes where the wheel meets the river
  const water = new Layer({ x: M.x - 172, y: M.base - 222, z: 4.25, d: 2.55, noDepth: true, draw(g, info) {
    const t = sc.t || 0, { px, py, Z } = info;
    g.save(); g.translate(px, py); g.scale(Z, Z);
    for (let s = 0; s < 3; s++) {   // three overlapping translucent ribbons, each wavering, flowing down
      const off = s * 4 - 4; g.beginPath();
      for (let y = 0; y <= 120; y += 6) { const x = -2 + off - y * .14 + Math.sin(y * .09 - t * 9 + s * 2) * (1.5 + y * .03); y ? g.lineTo(x - 5 - y * .03, y) : g.moveTo(x - 5, y); }
      for (let y = 120; y >= 0; y -= 6) { const x = -2 + off - y * .14 + Math.sin(y * .09 - t * 9 + s * 2) * (1.5 + y * .03); g.lineTo(x + 5 + y * .03, y); }
      g.closePath(); g.fillStyle = `rgba(${190 + s * 20},${225 + s * 8},${245},${.38 - s * .06})`; g.fill();
    }
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.8; g.lineCap = 'round';
    for (let k = 0; k < 6; k++) { const o = ((t * 150 + k * 23) % 130); g.beginPath(); g.moveTo(-4 - o * .14, o); g.lineTo(-5 - (o + 10) * .14, o + 10); g.stroke(); }   // highlights running down
    const R = mulberry(5); g.fillStyle = 'rgba(235,246,255,.8)';
    for (let k = 0; k < 8; k++) { const ph = (t * 1.6 + R()) % 1, x = -18 - ph * 22 * (R() + .3), y = 20 + ph * 100; g.beginPath(); g.arc(x, y, 1.2 + R() * 1.4, 0, TAU); g.fill(); }   // drops falling off the stream
    g.restore();
  } });
  const splash = new Layer({ x: M.x - 178, y: M.base + 6, z: 5.2, d: 2.32, noDepth: true, draw(g, info) {
    const t = sc.t || 0, { px, py, Z } = info, R = mulberry(77);
    g.save(); g.translate(px, py); g.scale(Z, Z);
    for (let i = 0; i < 16; i++) {   // soft foam: blurred white puffs that swell and fade
      const ph = (t * .7 + R()) % 1, x = -130 + R() * 260 + Math.sin(t * 1.3 + i) * 6, r = 14 + R() * 22 + ph * 10, a = .55 * Math.sin(ph * Math.PI);
      const gr = g.createRadialGradient(x, -2, 0, x, -2, r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(.6, `rgba(250,252,255,${a * .45})`); gr.addColorStop(1, 'rgba(250,252,255,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, -2, r * 1.6, r * .55, 0, 0, TAU); g.fill();
    }
    for (let i = 0; i < 26; i++) {   // droplets on short arcs
      const ph = (t * 1.3 + R()) % 1, ang = -Math.PI / 2 + (R() - .5) * 1.8, v = 50 + R() * 70, x = (R() - .5) * 220 + Math.cos(ang) * v * ph, y = Math.sin(ang) * v * ph + 140 * ph * ph, r = 1.4 + R() * 2.4;
      g.fillStyle = `rgba(255,255,255,${.85 * (1 - ph)})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    g.restore();
  } });
  L.push(water);
  // river: a ripple sheet, the mill's wobbly reflection, drifting ripples, the splashes
  const river = paint(3600, 260, g => { g.fillStyle = grad(g, 0, -130, 0, 130, [[0, '#7eaabf'], [1, '#4a7b98']]); g.fillRect(-1800, -130, 3600, 260); }, { res: .7, fin: { rim: .45, under: .25 } });
  L.push(new Layer({ sheet: river, x: 0, y: M.base + 120, z: 5, d: 2.3, trans: .3, lit: .7, name: 'river' }));
  const reflect = mk(700, 560); { const rg = reflect.getContext('2d'); rg.translate(350, 0); rg.scale(1, -1); rg.drawImage(body.c, -body.ax / 2, -body.ay / 2 - 0, body.c.width / 2, body.c.height / 2); }
  const rippleL = new Layer({ x: 0, y: M.base, z: 5.1, d: 2.3, noDepth: true, draw(g, info) {
    const t = sc.t || 0, { Z } = info, [rx, ry] = scr(M.x, M.base, 2.3, sc.cam), [, bottom] = scr(0, M.base + 250, 2.3, sc.cam);
    g.save(); g.beginPath(); g.rect(0, ry, W, bottom - ry); g.clip();
    g.globalAlpha = .3; g.filter = 'blur(2.5px)';
    for (let y = 0; y < 230; y += 6) { const wob = Math.sin(y * .09 + t * 2.2) * 5 + Math.sin(y * .23 - t * 3.1) * 2; g.drawImage(reflect, 0, y * 1, 700, 6, rx - 350 * Z + wob * Z, ry + y * Z, 700 * Z, 6 * Z + 1); }
    g.filter = 'none'; g.globalAlpha = 1;
    g.strokeStyle = 'rgba(255,248,230,.55)'; g.lineWidth = 2.4 * Z; g.lineCap = 'round'; const R = mulberry(31);
    for (let i = 0; i < 46; i++) { const y = R() * 230, l = 30 + R() * 60, x = ((R() * 3000 + t * (10 + R() * 14)) % 3000) - 1500; const [qx, qy] = scr(x, M.base + y + 4, 2.3, sc.cam); g.beginPath(); g.moveTo(qx, qy); g.bezierCurveTo(qx + l * .3 * Z, qy - 4 * Z, qx + l * .6 * Z, qy + 4 * Z, qx + l * Z, qy); g.stroke(); }
    g.restore();
  } });
  L.push(rippleL, splash);
  const ground = paint(3600, 400, g => { g.fillStyle = '#2e4a30'; tufts(g, -1800, 1800, -130, 40, 4, 18); g.fillRect(-1800, -130, 3600, 540); }, { res: .7, ay: 200, fin: { rim: .3, under: .3 } });
  L.push(new Layer({ sheet: ground, x: 0, y: M.base + 430, z: 6, d: 1.67, name: 'ground' }));
  const reeds = paint(520, 700, g => { g.fillStyle = '#16241c'; tufts(g, -260, 260, 340, 600, 7, 24); }, { res: .7, ay: 350, fin: { rim: .1 } });
  L.push(new Layer({ sheet: reeds, x: -880, y: M.base + 340, z: 8, d: 1.33, name: 'reedsL' }), new Layer({ sheet: reeds, x: 900, y: M.base + 380, z: 8, d: 1.33, flipX: true, sx: .9, sy: .8, name: 'reedsR' }));
  const sc = {
    bg: '#8fbfe0', layers: L, cam: { x: 0, y: 0, zoom: 1, dz: 0 }, letters, credit, cl, wheelL,
    light: { x: -640, y: -380, r: 2000, col: [255, 226, 170], floor: .55 }, lightDir: [.62, .78], focus: 2.6, haze: { col: '#c6d6ec', from: 3.5, span: 10, max: .42 },
    post: { bloom: .1, tint: [255, 222, 170], tintA: .16 }, litGain: .3,
    fx: [(g, { cam }) => {
      const t = sc.t || 0;
      const [sx, sy] = scr(-640, -380, 18, cam); glow(g, sx, sy, 560, [255, 228, 160], .32);
      for (const l of L) if (l.glowwin) { const [a, b, Z] = scr(l.x, l.y, l.d, cam); glow(g, a, b, 90 * Z, [255, 196, 110], .45); }
      if (cam.y < -350) return;   // no beam over the title
      // a sunbeam from the upper left across the mill door, with flour dust only inside it
      const poly = [[-900, -800], [-560, -800], [M.x + 150, M.base + 10], [M.x - 110, M.base + 10]].map(([x, y]) => scr(x, y, 2.6, cam));
      g.save(); g.beginPath(); poly.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
      const [a1, b1] = scr(-730, -800, 2.6, cam), [a2, b2] = scr(M.x, M.base, 2.6, cam), gr = g.createLinearGradient(a1, b1, a2, b2); gr.addColorStop(0, 'rgba(255,234,180,.16)'); gr.addColorStop(1, 'rgba(255,234,180,.03)');
      g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fill(); g.globalCompositeOperation = 'source-over'; g.clip();
      const [, , Zm] = scr(M.x, M.base, 2.6, cam); specks(g, t, { n: 60, seed: 8, col: [255, 244, 214], a: .6, r: 1.8 * Zm, speed: 6, vx: 6 }); g.restore();
    }],
    update(t) { sc.t = t; for (const l of cl) l.x = l.x0 + l.drift * t; wheelL.rot = t * .6; },
  };
  return sc;
}

// ===================== STEPS: the mill's front steps on a slight diagonal; afternoon sun from the upper left =====================
// Tom sits on the top step, turned three-quarters toward the cat; the cat sits on the threshold behind him, turned toward Tom, overlapping the doorframe.
const slope = .1;                                                      // step edges rise toward the right
export const STEP = { tomX: -200, tomY: 120, tomS: 1.25, catX: 150, catS: .37, doorX: 190 };
STEP.catY = STEP.tomY + 8 - (STEP.catX - STEP.tomX) * slope + 9;   // ON the landing: paws and bottom resting on the top of the step, in front of the doorway
const stepTop = x => STEP.tomY + 8 - (x - STEP.tomX) * slope;          // the landing's front edge at x
export function buildSteps({ ots = false } = {}) {
  setLight(.62, .78);
  const G = STEP, L = [];
  const sky = paint(1600, 1200, g => { g.fillStyle = grad(g, 0, -600, 0, 600, [[0, '#7fb0d8'], [.5, '#f3d8a0'], [1, '#f0b070']]); g.fillRect(-800, -600, 1600, 1200); }, { res: .4, fin: { rim: 0, under: 0, side: 0, grain: false } });
  L.push(new Layer({ sheet: sky, x: -1100, y: -300, z: 0, d: 20, trans: .3, shadow: false, haze: 0 }));
  const far = paint(1600, 600, g => { g.fillStyle = '#8fa8cf'; ridge(g, { x0: -800, x1: 800, base: -40, bottom: 300, amp: 110, f: [.004, .011, .027], seed: 3 }); g.fillStyle = '#7e9d88'; ridge(g, { x0: -800, x1: 800, base: 90, bottom: 300, amp: 70, f: [.006, .015, .03], seed: 9 }); }, { res: .6, fin: { rim: .3, under: .15 } });
  L.push(new Layer({ sheet: far, x: -1150, y: 40, z: .5, d: 8 }));
  // the mill's front wall (seen at a slight angle: its lines rise gently to the right), with the open doorway
  const wall = paint(2600, 1500, g => {
    g.save(); g.transform(1, -slope * .45, 0, 1, 0, 0);
    g.fillStyle = '#d2a870'; g.fillRect(-760, -800, 2400, 1600);
    g.fillStyle = '#8a5434'; for (const x of [-760, -430, -90, 620, 980]) g.fillRect(x - 10, -800, 20, 1600); g.fillRect(-760, -470, 2400, 20); g.fillRect(-760, -40, 2400, 20);
    g.fillStyle = '#a3917f'; g.fillRect(-760, 0, 2400, 700); g.fillStyle = '#8f7e6e'; const R = mulberry(4); for (let r = 0; r < 9; r++) for (let x = -760 + (r % 2) * 60; x < 1640; x += 120) { rr(g, x + 4, 6 + r * 46, 112 - R() * 8, 40, 6); g.fill(); }
    g.fillStyle = '#f0b860'; rr(g, -660, -390, 150, 190, 20); g.fill(); g.fillStyle = '#8a5434'; g.fillRect(-589, -390, 8, 190); g.fillRect(-660, -299, 150, 8);
    cut(g, () => { rr(g, G.doorX - 130, -420, 260, 460, 130); g.fill(); g.fillRect(G.doorX - 130, -290, 260, 330); });
    g.restore();
  }, { res: .9, fin: { rim: .45, under: .3, side: .12 } });
  L.push(new Layer({ sheet: wall, x: 0, y: 0, z: 1, d: 2.8, trans: .15, lit: .6, name: 'wall' }));
  const inside = paint(340, 520, g => { const ig = g.createRadialGradient(0, -40, 20, 0, -40, 230); ig.addColorStop(0, '#3a2a34'); ig.addColorStop(1, '#120a10'); g.fillStyle = ig; g.fillRect(-170, -260, 340, 520); g.fillStyle = 'rgba(70,52,62,.8)'; rr(g, -130, 120, 80, 110, 30); g.fill(); ell(g, 100, 180, 52, 52); g.fill(); }, { res: 1, fin: { rim: .1, side: 0 } });
  L.push(new Layer({ sheet: inside, x: G.doorX, y: -150 - (G.doorX) * slope * .45, z: .9, d: 2.8, shadow: false, haze: 0 }));
  const frame = paint(320, 520, g => { g.save(); g.transform(1, -slope * .45, 0, 1, 0, 0); g.strokeStyle = '#6a4630'; g.lineWidth = 20; g.beginPath(); g.moveTo(-140, 250); g.lineTo(-140, -120); g.arc(0, -120, 140, Math.PI, 0); g.lineTo(140, 250); g.stroke(); g.restore(); }, { res: 1.2, fin: { rim: .5, side: .15 } });
  L.push(new Layer({ sheet: frame, x: G.doorX, y: -170 - G.doorX * slope * .45, z: 1.1, d: 2.8, shadow: { dx: 8, dy: 10, blur: 9, a: .3 }, name: 'doorframe' }));
  // the steps: a landing and one step, edges rising to the right, the side profile showing on the left; dark under each lip
  const steps = paint(2600, 1100, g => {
    const sl = x => -x * slope;
    const band = (top, h, x0, x1, c1, c2) => {
      g.fillStyle = c2; g.beginPath(); g.moveTo(x0, top + sl(x0) + 14); g.lineTo(x1, top + sl(x1) + 14); g.lineTo(x1, top + h + sl(x1)); g.lineTo(x0, top + h + sl(x0)); g.closePath(); g.fill();
      const ao = g.createLinearGradient(0, top + 14, 0, top + 46); ao.addColorStop(0, 'rgba(30,16,8,.55)'); ao.addColorStop(1, 'rgba(30,16,8,0)');   // dark under the lip
      g.save(); g.clip(); g.fillStyle = ao; g.translate(0, 0); for (let x = x0; x < x1; x += 40) { g.save(); g.translate(0, sl(x)); g.fillRect(x, top + 14, 41, 34); g.restore(); } g.restore();
      g.fillStyle = c1; g.beginPath(); g.moveTo(x0 - 6, top + sl(x0)); g.lineTo(x1 + 6, top + sl(x1)); g.lineTo(x1 + 6, top + sl(x1) + 16); g.lineTo(x0 - 6, top + sl(x0) + 16); g.closePath(); g.fill();
      g.fillStyle = '#6e625c'; g.beginPath(); g.moveTo(x0 - 6, top + sl(x0)); g.lineTo(x0 - 40, top + sl(x0) - 24); g.lineTo(x0 - 40, top + h + sl(x0) - 24); g.lineTo(x0, top + h + sl(x0)); g.closePath(); g.fill();   // side face
    };
    band(0, 130, -760, 900, '#cbbcae', '#8f8078'); band(130, 140, -860, 1000, '#c2b2a4', '#857770');
    g.strokeStyle = 'rgba(40,24,16,.35)'; g.lineWidth = 2.4; const R = mulberry(8); for (const [t, b, x0, x1] of [[0, 130, -760, 900], [130, 270, -860, 1000]]) for (let x = x0 + 140 + R() * 80; x < x1 - 60; x += 180 + R() * 90) { g.beginPath(); g.moveTo(x, t + 20 + sl(x)); g.lineTo(x + R() * 6, b - 4 + sl(x)); g.stroke(); }
  }, { res: .9, ax: 1300, ay: 200, fin: { rim: .5, under: .3, side: .1 } });   // headroom above y = 0: the steps rise to the right
  L.push(new Layer({ sheet: steps, x: 0, y: stepTop(0), z: 2, d: 2.2, trans: .08, name: 'steps' }));
  const ground = paint(2800, 500, g => { g.fillStyle = '#7a6a50'; g.fillRect(-1400, 0, 2800, 500); g.fillStyle = '#3a5234'; tufts(g, -1400, 1400, 40, 46, 9, 20); g.fillRect(-1400, 40, 2800, 480); }, { res: .7, ay: 0, fin: { rim: .3, under: .3 } });
  L.push(new Layer({ sheet: ground, x: 0, y: stepTop(0) + 262, z: 2.1, d: 2.1 }));
  // puppets
  const tomLo = makeTom({ res: 2, bodyTurn: .45 }), tomHi = makeTom({ res: 6, bodyTurn: .45 }), puss = makePuss({ res: 3, turn: -.55 });
  const contact = (w, h, a) => (g, info, l) => { const { px, py, Z } = info; g.save(); g.translate(px + 6 * Z, py + 2 * Z); g.scale(1, h / w); const gr = g.createRadialGradient(0, 0, 0, 0, 0, w * Z * l.sx); gr.addColorStop(0, `rgba(25,12,6,${a})`); gr.addColorStop(1, 'rgba(25,12,6,0)'); g.fillStyle = gr; g.fillRect(-w * Z * 1.5 * l.sx, -w * Z * 1.5 * l.sx, w * 3 * Z * l.sx, w * 3 * Z * l.sx); g.restore(); };
  const tomL = new Layer({ sheet: tomLo.dyn, x: G.tomX, y: G.tomY, z: 3, d: 2.0, sx: G.tomS, sy: G.tomS, shadow: { dx: 26, dy: 22, blur: 16, a: .34 }, name: 'tom',
    pre: (g, info, l) => { contact(110, 26, .55)(g, info, l); const f = { ...info, py: info.py + 138 * G.tomS * info.Z }; contact(150, 22, .45)(g, f, l); } });
  const pussL = new Layer({ sheet: puss.dyn, x: G.catX, y: G.catY, z: 2.95, d: 2.2, sx: G.catS, sy: G.catS, shadow: { dx: 16, dy: -4, blur: 12, a: .26 }, name: 'puss', pre: contact(130, 16, .6) });   // a faint shadow on the wall behind, a dark contact shadow under him
  L.push(pussL, tomL);
  // over-the-shoulder pieces (only in the focus-pull shot)
  const rear = new Layer({ sheet: tomRear(1.4), x: G.catX - 560, y: G.catY + 120, z: 7, d: 1.3, vis: ots, shadow: false, name: 'tomRear' });
  const hands = new Layer({ sheet: breadRear(2), x: G.catX - 300, y: G.catY + 230, z: 7.2, d: 1.5, vis: ots, shadow: { dx: 16, dy: 18, blur: 14, a: .3 }, name: 'breadRear' });
  L.push(rear, hands);
  // foreground: a flour sack (bottom left) and ivy (top right), soft
  const sack = paint(420, 440, g => {
    g.fillStyle = '#c8a878'; g.beginPath(); g.moveTo(-150, 210); g.bezierCurveTo(-200, 120, -190, -40, -110, -110); g.quadraticCurveTo(-50, -150, -40, -150); g.lineTo(40, -150); g.quadraticCurveTo(60, -150, 110, -110); g.bezierCurveTo(190, -40, 200, 120, 150, 210); g.closePath(); g.fill();   // body
    g.beginPath(); g.moveTo(-42, -150); g.bezierCurveTo(-80, -190, -60, -215, -20, -200); g.quadraticCurveTo(0, -225, 30, -205); g.bezierCurveTo(70, -215, 80, -185, 42, -150); g.closePath(); g.fill();   // the floppy top
    g.strokeStyle = '#8a6a40'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(-46, -152); g.quadraticCurveTo(0, -140, 46, -152); g.stroke(); g.beginPath(); g.moveTo(30, -146); g.quadraticCurveTo(50, -120, 40, -96); g.stroke();   // rope and its loose end
    g.strokeStyle = 'rgba(110,80,45,.35)'; g.lineWidth = 1.6; for (let y = -100; y < 200; y += 9) { g.beginPath(); g.moveTo(-180, y); g.lineTo(180, y + 3); g.stroke(); } for (let x = -170; x < 180; x += 9) { g.beginPath(); g.moveTo(x, -110); g.lineTo(x + 2, 205); g.stroke(); }   // burlap weave
    g.strokeStyle = 'rgba(90,60,30,.6)'; g.lineWidth = 3; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(-130, 200); g.quadraticCurveTo(-170, 60, -105, -95); g.stroke(); g.setLineDash([]);   // a stitched seam
    g.fillStyle = 'rgba(255,250,238,.85)'; g.beginPath(); g.ellipse(0, -150, 44, 10, 0, 0, TAU); g.fill(); const Q = mulberry(21); for (let i = 0; i < 40; i++) { g.globalAlpha = .4 + Q() * .5; g.beginPath(); g.arc((Q() - .5) * 120, -150 + (Q() - .3) * 60, 1 + Q() * 3, 0, TAU); g.fill(); } g.globalAlpha = 1;   // flour spilling at the neck
  }, { res: .9, fin: { rim: .5, side: .25 } });
  const sackL = new Layer({ sheet: sack, x: -760, y: 420, z: 8, d: 1.6, name: 'sack' });
  const ivy = paint(700, 600, g => { g.fillStyle = '#2e4a2c'; const R = mulberry(12); g.strokeStyle = '#2a3a22'; g.lineWidth = 6; g.beginPath(); g.moveTo(300, -300); g.bezierCurveTo(100, -200, 40, -40, -60, 120); g.stroke(); for (let i = 0; i < 30; i++) { const u = R(), x = 300 - u * 360 + (R() - .5) * 90, y = -300 + u * 420 + (R() - .5) * 60; g.save(); g.translate(x, y); g.rotate(R() * TAU); g.beginPath(); g.moveTo(0, -22); g.quadraticCurveTo(20, -10, 0, 22); g.quadraticCurveTo(-20, -10, 0, -22); g.fill(); g.restore(); } }, { res: .8, fin: { rim: .4, side: .2 } });
  const ivyL = new Layer({ sheet: ivy, x: 820, y: -470, z: 8.1, d: 1.4, name: 'ivy' });
  L.push(sackL, ivyL);
  const beam = [[-1250, -900], [-880, -900], [-160, stepTop(-160) + 10], [-560, stepTop(-560) + 30]];   // falls on Tom's side, never on the cat
  const sc = {
    bg: '#2a1f2e', layers: L, cam: { x: 0, y: 0, zoom: 1, dz: 0 }, tomL, pussL, tomLo, tomHi, puss, rear, hands, sackL, ivyL, hires: false, tomPose: {}, catPose: {},
    light: { x: -900, y: -600, r: 1700, col: [255, 214, 150], floor: .45 }, lightDir: [.62, .78], focus: 2.0, haze: { col: '#c8d6ea', from: 3.6, span: 10, max: .4 },
    post: { bloom: .1, tint: [255, 226, 180], tintA: .12 }, litGain: .3,
    fx: [(g, { cam }) => {
      const t = sc.t || 0, pts = beam.map(([x, y]) => scr(x, y, 2.4, cam));
      g.save(); g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
      const gr = g.createLinearGradient(pts[0][0], pts[0][1], pts[2][0], pts[2][1]); gr.addColorStop(0, 'rgba(255,228,170,.12)'); gr.addColorStop(1, 'rgba(255,228,170,.02)');
      g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fill(); g.globalCompositeOperation = 'source-over'; g.clip();
      specks(g, t, { n: 80, seed: 5, col: [255, 240, 205], a: .55, r: 1.5 * Math.min(2.2, pts[0][2] || 1), speed: 5, vx: 7 }); g.restore();
    }],
    reset() { sc.tomRig = null; sc.tomPose = {}; sc.catPose = {}; sc.hires = false; sc.rear.vis = sc.hands.vis = false; },
    update(t) {
      sc.t = t;
      const rig = sc.tomRig || (sc.hires ? tomHi : tomLo); tomL.sheet = rig.dyn; if (tomL.vis) rig.pose(t, sc.tomPose);
      puss.pose(t, sc.catPose);
    },
  };
  return sc;
}
