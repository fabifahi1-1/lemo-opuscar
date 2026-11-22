// Scene builders for the sample: the lantern table, the opening sky, the mill by the river, the mill step with Tom and Puss
import { paint, Layer, glow, specks, W, H, mk } from './engine.js';
import { PAL, cut, rr, ell, ridge, fir, puffCloud, tufts, star5, textRun, glyphLayers } from './art.js';
import { makeTom, makePuss, blinkAt, breathe, ik } from './puppets.js';
import { mulberry, TAU, clamp, lerp, seg, ss, eo, eio, back, spring } from './lib.js';

const flick = t => 1 + .06 * Math.sin(7.3 * t) * Math.sin(3.1 * t);
const grad = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([p, c]) => gr.addColorStop(p, c)); return gr; };

// =============== TABLE: a paper lantern beside an open storybook ===============
export function buildTable() {
  const L = [];
  const wall = paint(2400, 1500, g => {
    g.fillStyle = grad(g, 0, -750, 0, 750, [[0, '#0e1228'], [.5, '#232a52'], [1, '#2e2a4a']]); g.fillRect(-1200, -750, 2400, 1500);
    // a window with night sky and a crescent moon
    cut(g, () => { rr(g, 380, -330, 330, 400, 150); g.fill(); });
  }, { res: 1, fin: { rim: .25, under: .2 } });
  L.push(new Layer({ sheet: wall, x: 0, y: -60, z: 0, par: .12, trans: .5 }));
  const sky = paint(520, 560, g => {
    g.fillStyle = grad(g, 0, -280, 0, 280, [[0, '#0b1740'], [1, '#34457c']]); g.fillRect(-260, -280, 520, 560);
    g.fillStyle = '#fff4cf'; g.beginPath(); g.arc(-40, -90, 52, 0, TAU); g.arc(-18, -104, 46, 0, TAU); g.fill('evenodd');
    g.fillStyle = '#fff4cf'; const R = mulberry(4); for (let i = 0; i < 30; i++) { g.globalAlpha = .4 + R() * .6; g.beginPath(); g.arc((R() - .5) * 480, (R() - .5) * 520, .8 + R() * 2, 0, TAU); g.fill(); } g.globalAlpha = 1;
  }, { res: 1, fin: { rim: 0, under: 0 } });
  L.push(new Layer({ sheet: sky, x: 545, y: -190, z: -.2, par: .12, trans: .9, lit: .7 }));
  const frame = paint(380, 450, g => { g.fillStyle = '#4a2e3e'; rr(g, -190, -225, 380, 450, 170); g.fill(); cut(g, () => { rr(g, -165, -200, 330, 400, 150); g.fill(); }); g.fillStyle = '#4a2e3e'; g.fillRect(-4, -200, 8, 400); g.fillRect(-165, -10, 330, 8); }, { res: 1 });
  L.push(new Layer({ sheet: frame, x: 545, y: -190, z: .1, par: .12, trans: .2 }));
  // shelf with books and a plant on the left
  const shelf = paint(900, 340, g => {
    g.fillStyle = '#3a2f58'; g.fillRect(-450, 120, 900, 22);
    const R = mulberry(9); let x = -440; const cols = ['#6a2d4a', '#2f5a6a', '#8a5a3a', '#40507a', '#7a3a3a'];
    for (let i = 0; i < 9; i++) { const w = 26 + R() * 22, h = 100 + R() * 70; g.fillStyle = cols[i % 5]; rr(g, x, 120 - h, w, h, 4); g.fill(); cut(g, () => { g.fillRect(x + 4, 120 - h * .6, w - 8, 3); }); x += w + 3; }
    g.fillStyle = '#2f3a50'; rr(g, 20, 60, 70, 60, 10); g.fill();   // a pot
    g.fillStyle = '#3f6a58'; for (let k = -3; k <= 3; k++) { g.beginPath(); g.ellipse(55 + k * 18, 40 - Math.abs(k) * 12, 12, 46, k * .28, 0, TAU); g.fill(); }
  }, { res: 1 });
  L.push(new Layer({ sheet: shelf, x: -380, y: -60, z: .5, par: .3, trans: .3 }));
  // table
  const table = paint(2600, 700, g => {
    g.fillStyle = grad(g, 0, -350, 0, 350, [[0, '#5a3626'], [.15, '#432618'], [1, '#2a170f']]); g.fillRect(-1300, -350, 2600, 700);
    { const R = mulberry(3); g.strokeStyle = 'rgba(20,8,4,.35)'; g.lineWidth = 3; for (let i = 0; i < 26; i++) { const y = -300 + i * 25 + R() * 10; g.beginPath(); g.moveTo(-1300, y); g.bezierCurveTo(-400, y + R() * 16, 400, y - R() * 16, 1300, y + R() * 10); g.stroke(); } }
  }, { res: 1, fin: { rim: .55, rimPx: 3 } });
  L.push(new Layer({ sheet: table, x: 0, y: 520, z: 2, par: .95, trans: .22, shadow: { dy: -10, blur: 10, a: .5 } }));
  // lantern (a paper lantern: barrel with cut stars and moons, glowing)
  const lantern = paint(300, 520, g => {
    g.fillStyle = '#3b2a2e'; rr(g, -56, -240, 112, 30, 10); g.fill(); rr(g, -70, 214, 140, 30, 10); g.fill();                  // caps
    g.strokeStyle = '#3b2a2e'; g.lineWidth = 8; g.beginPath(); g.arc(0, -258, 44, Math.PI, 0); g.stroke();                       // handle
    g.fillStyle = '#f0a85c'; g.beginPath(); g.moveTo(-58, -210); g.bezierCurveTo(-140, -120, -140, 120, -66, 214); g.lineTo(66, 214); g.bezierCurveTo(140, 120, 140, -120, 58, -210); g.closePath(); g.fill();
    g.fillStyle = '#d98a58'; for (const x of [-96, 0, 96]) { g.globalAlpha = .55; g.fillRect(x - 3, -210, 6, 424); } g.globalAlpha = 1;       // ribs
    cut(g, () => { const R = mulberry(2); for (let i = 0; i < 7; i++) { star5(g, (R() - .5) * 150, -150 + i * 52 + R() * 12, 13 + R() * 8, R() * 2); g.fill(); } g.beginPath(); g.arc(0, 10, 20, 0, TAU); g.fill(); });
  }, { res: 1, fin: { rim: .3, grain: true, grainA: .35 } });
  L.push(new Layer({ sheet: lantern, x: -420, y: 150, z: 3, par: 1, trans: .35, lit: .95, shadow: { dy: 10, blur: 9, a: .3 }, flick: true }));
  // open storybook
  const PAGE = (g, s) => { g.beginPath(); g.moveTo(s * 6, 20); g.lineTo(s * 6, -170); g.bezierCurveTo(s * 120, -190, s * 280, -176, s * 358, -150); g.lineTo(s * 366, 30); g.bezierCurveTo(s * 250, 14, s * 110, 24, s * 6, 20); g.closePath(); };
  const book = paint(760, 360, g => {
    g.fillStyle = '#6a2d4a'; rr(g, -380, -30, 760, 70, 14); g.fill();                              // cover below the pages
    for (const s of [-1, 1]) {
      g.fillStyle = '#efe0c0'; g.beginPath(); g.moveTo(s * 6, 20); g.lineTo(s * 6, -170); g.bezierCurveTo(s * 120, -190, s * 280, -176, s * 358, -150); g.lineTo(s * 366, 30); g.bezierCurveTo(s * 250, 14, s * 110, 24, s * 6, 20); g.closePath(); g.fill();
      g.fillStyle = '#d9c7a0'; g.beginPath(); g.moveTo(s * 366, 30); g.lineTo(s * 366, 44); g.lineTo(s * 8, 36); g.lineTo(s * 8, 20); g.closePath(); g.fill();
    }
    cut(g, () => { g.lineWidth = 3; g.lineCap = 'round'; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(-320, -130 + i * 24); g.lineTo(-40 - (i % 3) * 30, -126 + i * 24); g.stroke(); } });
    g.fillStyle = '#6a8fb0'; g.beginPath(); g.moveTo(40, 0); g.lineTo(110, -90); g.lineTo(170, -30); g.lineTo(230, -110); g.lineTo(330, 0); g.closePath(); g.fill();   // an illustration on the right page
    g.fillStyle = '#e8a050'; g.beginPath(); g.arc(256, -100, 22, 0, TAU); g.fill();
  }, { res: 1, ay: 200 });
  L.push(new Layer({ sheet: book, x: 250, y: 215, z: 3.2, par: 1, trans: .4, shadow: { dy: 8, blur: 8, a: .35 } }));
  // pages for the page-turn (shot 2): the turning page, its back, and the next page (a sky painting)
  const pageFace = paint(380, 240, g => {
    PAGE(g, 1); g.fillStyle = '#efe0c0'; g.fill();
    cut(g, () => { g.lineWidth = 3; g.lineCap = 'round'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(30, -120 + i * 22); g.lineTo(300 - (i % 3) * 40, -116 + i * 22); g.stroke(); } });
    g.fillStyle = '#c9a070'; g.beginPath(); g.arc(300, -60, 26, 0, TAU); g.fill();
  }, { res: 1, ax: 6, ay: 190 });
  const pageBack = paint(380, 240, g => { PAGE(g, 1); g.fillStyle = '#e6d5b0'; g.fill(); }, { res: 1, ax: 6, ay: 190 });
  const newPage = paint(380, 240, g => {
    PAGE(g, 1); g.save(); g.clip(); g.fillStyle = grad(g, 0, -190, 0, 40, [[0, '#8dbbdc'], [.55, '#f4e2b6'], [1, '#ffd9a2']]); g.fillRect(0, -200, 380, 250);
    g.fillStyle = '#fff4de'; puffCloud(g, 120, -60, 120, 50, 3); puffCloud(g, 260, -100, 140, 56, 5); g.restore();
  }, { res: 1, ax: 6, ay: 190 });
  const pageFlip = new Layer({ sheet: pageFace, x: 250, y: 215, z: 3.4, par: 1, trans: .5, shadow: { dy: 6, blur: 6, a: .3 }, vis: false, name: 'flip', face: pageFace, back: pageBack });
  const pageNew = new Layer({ sheet: newPage, x: 250, y: 215, z: 3.3, par: 1, trans: .05, vis: false, name: 'newpage' });
  L.push(pageFlip, pageNew);
  // blurred flowers on the right edge (foreground frame)
  const flowers = paint(300, 700, g => {
    g.strokeStyle = '#0c0f1c'; g.fillStyle = '#0c0f1c'; g.lineWidth = 7; g.lineCap = 'round';
    for (const [x, a] of [[40, -.12], [-20, .05], [90, -.25]]) { g.beginPath(); g.moveTo(x, 350); g.quadraticCurveTo(x + a * 200, 0, x + a * 420, -250); g.stroke(); for (let k = 0; k < 9; k++) { g.save(); g.translate(x + a * 420, -250); g.rotate(k * TAU / 9); ell(g, 0, -26, 8, 20); g.fill(); g.restore(); } }
  }, { res: 1, fin: { rim: .1 } });
  L.push(new Layer({ sheet: flowers, x: 840, y: 170, z: 6, par: 1.5, blur: 9, shadow: null }));
  const sc = {
    bg: '#0a0d1e', layers: L, cam: { x: 0, y: 0, zoom: 1 }, pageFlip, pageNew,
    light: { x: -420, y: 120, r: 980, col: [255, 196, 120], floor: .28 },
    post: { bloom: .3, vig: .5 }, litGain: .8,
    fx: [(g, { cam }) => {
      const t = sc.t || 0, f = flick(t);
      const Z = 1 + (cam.zoom - 1) * .9, lx = W / 2 + (-420 - cam.x) * Z, ly = H / 2 + (150 - cam.y) * Z;
      if (!sc.noGlow) glow(g, lx, ly, 520 * Z, [255, 170, 90], .42 * f); if (!sc.noGlow) glow(g, lx, ly, 230 * Z, [255, 214, 150], .5 * f);
      if (!sc.noGlow) glow(g, W / 2 + (-100 - cam.x) * Z, H / 2 + (330 - cam.y) * Z, 640 * Z, [255, 160, 80], .22 * f);   // spill on the table
      g.save(); g.beginPath(); g.arc(lx, ly - 60 * Z, 430 * Z, 0, TAU); g.clip(); specks(g, t, { n: 40, seed: 3, col: [255, 214, 150], a: .7, r: 2.4, speed: 10, w: W, h: H }); g.restore();   // candle dust only in the lantern's light
    }],
    update(t) { sc.t = t; for (const l of L) if (l.flick) l.lit = .8 * flick(t); },
  };
  return sc;
}

// =============== the opening sky + the mill world (one world; the camera tilts down through it) ===============
const FAR = '#8fa9d0', MID = '#6f9a86', MIDD = '#4f7d66';
export function buildMillWorld({ title = true } = {}) {
  const L = [];
  const sky = paint(3200, 2600, g => {
    g.fillStyle = grad(g, 0, -1300, 0, 1300, [[0, '#5a93cc'], [.28, '#86bde2'], [.5, '#f1dcae'], [.62, '#ffd49a'], [1, '#f2b97c']]); g.fillRect(-1600, -1300, 3200, 2600);
  }, { res: .5, fin: { rim: 0, under: 0, grain: false } });
  L.push(new Layer({ sheet: sky, x: 0, y: -500, z: 0, par: .1, trans: .5, lit: .5, name: 'sky' }));
  const sun = paint(200, 200, g => { g.fillStyle = '#fff6d6'; g.beginPath(); g.arc(0, 0, 64, 0, TAU); g.fill(); }, { res: 1, fin: { rim: 0, under: 0 } });
  L.push(new Layer({ sheet: sun, x: 560, y: 70, z: .5, par: .15, trans: 1, lit: 1 }));
  // clouds
  const clouds = [[-640, -250, 520, 170, 3, .30, 9], [-150, -300, 1180, 330, 5, .30, 0], [560, -215, 560, 190, 7, .32, -7], [820, -520, 420, 140, 9, .26, 6], [-900, -560, 460, 150, 11, .26, -5], [100, -640, 520, 160, 13, .28, 5]];
  const cl = [];
  for (const [x, y, w, h, seed, par, drift] of clouds) {
    const s = paint(w + 60, h + 60, g => { g.fillStyle = '#fff4de'; puffCloud(g, 0, h / 2 - 10, w, h, seed); }, { res: 1, fin: { rim: .5, under: .12 } });
    const l = new Layer({ sheet: s, x, y, z: 1 + par, par, trans: .6, lit: .6, shadow: { dy: 14, blur: 12, a: .12 }, drift, x0: x }); L.push(l); cl.push(l);
  }
  // title in the big cloud: cut-paper letters that grow from their base
  let letters = [];
  if (title) {
    const run = textRun('Puss in Boots', '"Lilita One"', 210, '#2a2347', { res: 1, fin: { rim: .5, under: .35 } });
    letters = glyphLayers(run, { x: 0, y: -300 + 70, par: .3, z: 1.7, shadow: { dy: 8, blur: 6, a: .3 } }); letters.forEach((l, i) => { l.gi = i; }); L.push(...letters);
    const seal = paint(120, 120, g => { g.fillStyle = '#d4402c'; g.beginPath(); g.arc(0, 0, 40, 0, TAU); g.fill(); cut(g, () => { star5(g, 0, 0, 20, 0); g.fill(); }); }, { res: 1 });
    L.push(new Layer({ sheet: seal, x: 640, y: -230, z: 1.75, par: .3, rot: .2, sx: 0, sy: 0, trans: .5, seal: true }));
  }
  // far hills
  const far = paint(3200, 640, g => { g.fillStyle = FAR; ridge(g, { x0: -1600, x1: 1600, base: -60, bottom: 320, amp: 150, f: [.0035, .009, .022], seed: 5 }); }, { res: 1, ay: 320, fin: { rim: .4, under: .18 } });
  L.push(new Layer({ sheet: far, x: 0, y: 190, z: 2.2, par: .25, trans: .8, lit: .8, shadow: { dy: 12, blur: 14, a: .14 }, name: 'far' }));
  const far2 = paint(3200, 640, g => { g.fillStyle = '#9fb3d8'; ridge(g, { x0: -1600, x1: 1600, base: -90, bottom: 320, amp: 120, f: [.004, .011, .027], seed: 12 }); }, { res: 1, ay: 320, fin: { rim: .3, under: .1 } });
  L.push(new Layer({ sheet: far2, x: 0, y: 150, z: 2.1, par: .2, trans: .85, lit: .8 }));
  const mid = paint(3200, 640, g => {
    g.fillStyle = MID; ridge(g, { x0: -1600, x1: 1600, base: 40, bottom: 320, amp: 120, f: [.005, .013, .031], seed: 21 });
    g.fillStyle = MIDD; const R = mulberry(8); for (let x = -1500; x < 1500; x += 48 + R() * 60) { const hh = 70 + R() * 70; fir(g, x, 90 + 30 * Math.sin(x * .013 + 1) - 12, hh); }
  }, { res: 1, ay: 320, fin: { rim: .4, under: .2 } });
  L.push(new Layer({ sheet: mid, x: 0, y: 270, z: 3, par: .5, trans: .6, lit: .75, shadow: { dy: 14, blur: 14, a: .2 }, name: 'mid' }));
  // the mill (res 2 so close-ups hold up)
  const MILLBASE = 330;
  const win = paint(100, 120, g => { g.fillStyle = '#ffcf78'; rr(g, -26, -34, 52, 70, 26); g.fill(); }, { res: 1, fin: { rim: 0, under: 0 } });
  const body = paint(620, 560, g => {
    g.fillStyle = '#ead09a'; g.beginPath(); g.moveTo(-160, 0); g.lineTo(160, 0); g.lineTo(142, -270); g.lineTo(-142, -270); g.closePath(); g.fill();
    g.fillStyle = '#8f5a3c'; for (const x of [-128, 0, 128]) g.fillRect(x - 5, -270, 10, 270); g.fillRect(-150, -140, 300, 10); g.fillRect(-150, -10, 300, 10);          // timber frame
    g.fillStyle = '#b4573b'; g.beginPath(); g.moveTo(-200, -258); g.lineTo(200, -258); g.lineTo(108, -420); g.lineTo(-108, -420); g.closePath(); g.fill();                  // roof
    cut(g, () => { g.lineWidth = 2.4; for (let r = 0; r < 5; r++) { const y = -270 - r * 30; g.beginPath(); for (let x = -190 + r * 18; x < 190 - r * 18; x += 26) { g.moveTo(x, y); g.arc(x + 13, y, 13, Math.PI, 0, true); } g.stroke(); } });
    g.fillStyle = '#9b7a62'; rr(g, 70, -470, 40, 90, 4); g.fill();                                                                                                        // chimney
    cut(g, () => { for (const x of [-84, 84]) { rr(g, x - 26, -230, 52, 72, 26); g.fill(); } g.beginPath(); g.arc(0, -350, 22, 0, TAU); g.fill(); });                     // window holes
    cut(g, () => { rr(g, -50, -150, 100, 150, 50); g.fill(); });                                                                                                              // doorway
    g.fillStyle = '#5a3a2c'; g.beginPath(); g.moveTo(-60, 0); g.lineTo(-60, -110); g.arc(0, -110, 60, Math.PI, 0); g.lineTo(60, 0); g.lineTo(52, 0); g.lineTo(52, -110); g.arc(0, -110, 52, 0, Math.PI, true); g.lineTo(-52, 0); g.closePath(); g.fill();   // door frame
  }, { res: 2, ax: 310, ay: 500, fin: { rim: .45, under: .3 } });
  const inner = paint(140, 200, g => {   // the dark inside of the doorway with a flour sack and a millstone
    g.fillStyle = '#4a3340'; rr(g, -52, -158, 104, 160, 52); g.fill();
    g.fillStyle = '#f1e6d0'; g.beginPath(); g.moveTo(-40, 0); g.bezierCurveTo(-48, -40, -36, -70, -14, -76); g.lineTo(8, -76); g.bezierCurveTo(30, -70, 40, -40, 36, 0); g.closePath(); g.fill();
    g.fillStyle = '#9b9298'; ell(g, 26, -28, 26, 26); g.fill(); cut(g, () => { g.lineWidth = 2; for (let a = 0; a < 6; a++) { g.beginPath(); g.moveTo(26, -28); g.lineTo(26 + Math.cos(a * 1.05) * 24, -28 + Math.sin(a * 1.05) * 24); g.stroke(); } });
  }, { res: 2, ax: 70, ay: 130, fin: { rim: .2 } });
  const mx = 40;
  L.push(new Layer({ sheet: win, x: mx - 84, y: MILLBASE - 194, z: 3.9, par: .75, trans: 1, lit: 1.0, glowwin: true }), new Layer({ sheet: win, x: mx + 84, y: MILLBASE - 194, z: 3.9, par: .75, trans: 1, lit: 1.0, glowwin: true }), new Layer({ sheet: win, x: mx, y: MILLBASE - 328, z: 3.9, par: .75, sx: .8, sy: .8, trans: 1, lit: 1, glowwin: true }));
  L.push(new Layer({ sheet: inner, x: mx, y: MILLBASE - 2, z: 3.92, par: .75, trans: .15 }));
  L.push(new Layer({ sheet: body, x: mx, y: MILLBASE, z: 4, par: .75, trans: .35, lit: .85, shadow: { dy: 14, blur: 12, a: .28 }, name: 'mill' }));
  // step
  const step = paint(360, 60, g => { g.fillStyle = '#a79a92'; rr(g, -150, -20, 300, 36, 6); g.fill(); g.fillStyle = '#8d8078'; rr(g, -170, 8, 340, 30, 6); g.fill(); }, { res: 2 });
  L.push(new Layer({ sheet: step, x: mx, y: MILLBASE + 12, z: 4.1, par: .78, trans: .2 }));
  // waterwheel
  const wheel = paint(380, 380, g => {
    g.strokeStyle = '#6a4630'; g.lineWidth = 16; g.beginPath(); g.arc(0, 0, 150, 0, TAU); g.stroke(); g.lineWidth = 9; g.beginPath(); g.arc(0, 0, 112, 0, TAU); g.stroke();
    g.fillStyle = '#7a5238'; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.save(); g.rotate(a); g.fillRect(-5, -150, 10, 150); rr(g, -24, -178, 48, 30, 5); g.fill(); g.restore(); }
    g.fillStyle = '#5a3a2a'; g.beginPath(); g.arc(0, 0, 26, 0, TAU); g.fill();
    cut(g, () => { for (let i = 0; i < 12; i++) { g.save(); g.rotate(i * TAU / 12 + .26); g.fillRect(-2.5, -140, 5, 22); g.restore(); } });
  }, { res: 2, fin: { rim: .5, under: .3 } });
  L.push(new Layer({ sheet: wheel, x: mx - 270, y: MILLBASE - 40, z: 3.95, par: .8, trans: .35, lit: .8, shadow: { dy: 10, blur: 8, a: .25 }, spin: true, name: 'wheel' }));
  // river and banks
  const river = paint(3200, 200, g => { g.fillStyle = grad(g, 0, -100, 0, 100, [[0, '#8dbfdc'], [1, '#5f98c0']]); g.fillRect(-1600, -100, 3200, 200); cut(g, () => { const R = mulberry(31); g.lineWidth = 3; g.lineCap = 'round'; for (let i = 0; i < 70; i++) { const x = -1600 + R() * 3200, y = -70 + R() * 150, l = 30 + R() * 60; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + l * .3, y - 6, x + l * .6, y + 6, x + l, y); g.stroke(); } }); }, { res: 1, fin: { rim: .45, under: .25 } });
  L.push(new Layer({ sheet: river, x: 0, y: MILLBASE + 68, z: 5, par: .9, trans: .55, lit: .8, shadow: { dy: 8, blur: 8, a: .25 }, name: 'river' }));
  // near ground and reeds
  const ground = paint(3200, 360, g => { g.fillStyle = '#24402e'; tufts(g, -1600, 1600, -120, 36, 4, 18); g.fillRect(-1600, -120, 3200, 480); }, { res: 1, ay: 180, fin: { rim: .3, under: .3 } });
  L.push(new Layer({ sheet: ground, x: 0, y: 590, z: 6, par: 1.2, trans: .08, shadow: { dy: -8, blur: 10, a: .4 }, name: 'ground' }));
  const reeds = paint(500, 640, g => { g.fillStyle = '#0f1c1a'; tufts(g, -250, 250, 310, 560, 7, 26); }, { res: 1, ay: 320, fin: { rim: .08 } });
  L.push(new Layer({ sheet: reeds, x: -820, y: 440, z: 8, par: 1.5, blur: 4, name: 'reedsL' }), new Layer({ sheet: reeds, x: 880, y: 470, z: 8, par: 1.5, blur: 4, flipX: true, sx: .9, sy: .8, name: 'reedsR' }));
  const sc = {
    bg: '#9cc0de', layers: L, cam: { x: 0, y: 0, zoom: 1 }, letters, cl,
    light: { x: 200, y: -100, r: 1500, col: [255, 226, 176], floor: .55 },
    post: { bloom: .08, vig: .3, tint: [255, 242, 226], tintA: .06 }, litGain: .22,
    fx: [(g, { cam }) => {
      const t = sc.t || 0, Z = 1 + (cam.zoom - 1) * .7;
      const p = (x, y, par) => [W / 2 + (x - cam.x * par) * (1 + (cam.zoom - 1) * (.35 + .65 * par / 1.5)), H / 2 + (y - cam.y * par) * (1 + (cam.zoom - 1) * (.35 + .65 * par / 1.5))];
      const [sx, sy] = p(560, 70, .15); glow(g, sx, sy, 560, [255, 226, 160], .3);
      const [wx, wy] = p(mx, MILLBASE - 194, .75); for (const dx of [-84, 84]) { const [a, b] = p(mx + dx, MILLBASE - 194, .75); glow(g, a, b, 120 * Z, [255, 200, 110], .55); }
      // flour specks in the sunbeam by the mill
      g.save(); g.beginPath(); [[520, -700], [780, -700], [mx + 120, MILLBASE + 10], [mx - 120, MILLBASE + 10]].map(([x, y]) => p(x, y, .75)).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
      { const [a1, b1] = p(650, -700, .75), [a2, b2] = p(mx, MILLBASE, .75), gr = g.createLinearGradient(a1, b1, a2, b2); gr.addColorStop(0, 'rgba(255,236,190,.14)'); gr.addColorStop(1, 'rgba(255,236,190,.02)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fill(); g.globalCompositeOperation = 'source-over'; }
      g.clip(); specks(g, t, { n: 46, seed: 8, col: [255, 244, 214], a: .6, r: 1.8 * Z, speed: 6, vx: 6, w: W, h: H }); g.restore();   // flour dust: only inside the sunbeam
      // smooth river sparkle
      const [rx, ry] = p(0, MILLBASE + 60, .9); g.globalCompositeOperation = 'lighter'; const R = mulberry(17);
      for (let i = 0; i < 26; i++) { const x = ((R() * 3200 - 1600 + t * 6 * (.4 + R())) % 3200 + 3200) % 3200 - 1600, y = R() * 120 - 40, a = (.5 + .5 * Math.sin(t * 3 + i * 7)) * .55; const [qx, qy] = p(x, MILLBASE + 30 + y, .9); g.fillStyle = `rgba(255,248,226,${a})`; g.fillRect(qx, qy, 14 * Z, 2.4 * Z); }
    }],
    update(t) {
      sc.t = t;
      for (const l of cl) l.x = l.x0 + l.drift * t;
      for (const l of L) { if (l.spin) l.rot = t * .55; if (l.glowwin) l.lit = 1 + .04 * Math.sin(t * 2.3 + l.x); }
    },
  };
  return sc;
}

// =============== STEP: the mill's front steps. Tom sits on the top step, the cat sits in the shade of the open doorway behind him ===============
// Sunlight comes from the upper left through a gap past the mill's corner; flour dust floats only inside that beam.
const LAND = 30, STEP2 = 168, STEP1 = 300, GROUND = 432;           // tops of the steps (world y)
export const STEP_GEO = { tomX: -60, seatY: LAND + 10, tomS: 1.25, catX: 225, catY: LAND + 4, catS: .82 };
export function buildStep() {
  const L = [], G = STEP_GEO;
  const sky = paint(2600, 1400, g => { g.fillStyle = grad(g, 0, -700, 0, 700, [[0, '#7fb0d8'], [.45, '#f3dcae'], [1, '#f2b77c']]); g.fillRect(-1300, -700, 2600, 1400); }, { res: .5, fin: { rim: 0, under: 0, grain: false } });
  L.push(new Layer({ sheet: sky, x: 0, y: -200, z: 0, par: .1, trans: .4, lit: .5 }));
  const far = paint(1800, 600, g => { g.fillStyle = '#93abcf'; ridge(g, { x0: -900, x1: 900, base: -40, bottom: 300, amp: 120, f: [.004, .011, .027], seed: 3 }); g.fillStyle = '#7e9d88'; ridge(g, { x0: -900, x1: 900, base: 90, bottom: 300, amp: 70, f: [.006, .015, .03], seed: 9 }); }, { res: .7, fin: { rim: .3, under: .15 } });
  L.push(new Layer({ sheet: far, x: -900, y: 120, z: .5, par: .25, trans: .5, lit: .6 }));
  // the mill's front wall: stone foundation, timber frame and plaster, with the open doorway cut out
  const wall = paint(2200, 1300, g => {
    g.fillStyle = '#cfa978'; g.fillRect(-640, -650, 1800, 1300);                                  // plaster (starts at the mill's corner, x = -640)
    g.fillStyle = '#8f5a3c'; for (const x of [-640, -330, 20, 470, 900]) g.fillRect(x - 9, -650, 18, 1300); g.fillRect(-640, -420, 1800, 18); g.fillRect(-640, -40, 1800, 18);
    g.save(); g.beginPath(); g.rect(-640, 0, 1800, 650); g.clip(); g.fillStyle = '#a99a8f'; g.fillRect(-640, 0, 1800, 650);     // stone foundation
    g.fillStyle = '#95877d'; const R = mulberry(4); for (let r = 0; r < 8; r++) for (let x = -640 + (r % 2) * 60; x < 1160; x += 120) { rr(g, x + 4, 6 + r * 46, 112 - R() * 8, 40, 6); g.fill(); } g.restore();
    g.fillStyle = '#f0b860'; rr(g, -520, -360, 150, 190, 20); g.fill();                             // a lit window on the left
    cut(g, () => { rr(g, G.catX - 160, -400, 320, 440, 150); g.fill(); g.fillRect(G.catX - 160, -250, 320, 290); });   // doorway
    g.fillStyle = '#6a4630'; g.lineWidth = 20; g.strokeStyle = '#6a4630'; g.beginPath(); g.moveTo(G.catX - 170, 40); g.lineTo(G.catX - 170, -250); g.arc(G.catX, -250, 170, Math.PI, 0); g.lineTo(G.catX + 170, 40); g.stroke();
  }, { res: 1, fin: { rim: .4, under: .3 } });
  L.push(new Layer({ sheet: wall, x: 0, y: 0, z: 1, par: .5, trans: .18, lit: .6, shadow: { dx: 10, dy: 14, blur: 14, a: .3 } }));
  const inside = paint(380, 520, g => { g.fillStyle = '#2a1e28'; g.fillRect(-190, -260, 380, 520); g.fillStyle = '#3b2c38'; rr(g, -150, 120, 90, 120, 30); g.fill(); ell(g, 110, 180, 60, 60); g.fill(); }, { res: 1, fin: { rim: .1 } });
  L.push(new Layer({ sheet: inside, x: G.catX, y: -170, z: .9, par: .5 }));
  // the steps: each a light top edge and a darker riser
  const steps = paint(2400, 900, g => {
    const band = (top, h, w, c1, c2) => { g.fillStyle = c1; rr(g, -w / 2, top, w, 16, 4); g.fill(); g.fillStyle = c2; g.fillRect(-w / 2 + 6, top + 14, w - 12, h - 14); };
    band(LAND, STEP2 - LAND, 1500, '#cbbdb2', '#8f817a'); band(STEP2, STEP1 - STEP2, 1700, '#c4b5aa', '#857770'); band(STEP1, GROUND - STEP1, 1900, '#bcad a2'.replace(' ', ''), '#7c6f69');
    cut(g, () => { g.lineWidth = 2.4; const R = mulberry(8); for (const [t, b, w] of [[LAND, STEP2, 1500], [STEP2, STEP1, 1700], [STEP1, GROUND, 1900]]) for (let x = -w / 2 + 140 + R() * 80; x < w / 2 - 60; x += 180 + R() * 90) { g.beginPath(); g.moveTo(x, t + 20); g.lineTo(x + R() * 6, b - 4); g.stroke(); } });
  }, { res: 1, ay: 0, ax: 1200, fin: { rim: .5, under: .3 } });
  L.push(new Layer({ sheet: steps, x: 60, y: 0, z: 2, par: .9, trans: .12, lit: .7, shadow: { dy: -8, blur: 10, a: .25 } }));
  // puppets: two resolutions of Tom (close-ups use the sharp one); the cat is one colour, orange, in the doorway's shade
  const tomLo = makeTom({ res: 2 }), tomHi = makeTom({ res: 5 }), puss = makePuss({ res: 3 });
  const tomL = new Layer({ sheet: tomLo.dyn, x: G.tomX, y: G.seatY, z: 3, par: .92, sx: G.tomS, sy: G.tomS, trans: 0, shadow: { dx: 14, dy: 6, blur: 9, a: .33 }, name: 'tom' });
  const pussL = new Layer({ sheet: puss.dyn, x: G.catX, y: G.catY, z: 2.5, par: .9, sx: G.catS, sy: G.catS, trans: 0, bright: .46, sat: 1.35, name: 'puss' });
  L.push(pussL, tomL);
  const ground = paint(2600, 400, g => { g.fillStyle = '#6f6a52'; g.fillRect(-1300, 0, 2600, 400); g.fillStyle = '#2f4430'; tufts(g, -1300, 1300, 30, 46, 9, 20); g.fillRect(-1300, 30, 2600, 380); }, { res: 1, ay: 0, fin: { rim: .3, under: .3 } });
  L.push(new Layer({ sheet: ground, x: 0, y: GROUND, z: 5, par: 1.1, trans: .05 }));
  const leaves = paint(500, 900, g => { g.fillStyle = '#16231c'; const R = mulberry(12); for (let i = 0; i < 26; i++) { g.save(); g.translate((R() - .5) * 300, -420 + i * 34); g.rotate(-.8 + R() * 1.6); ell(g, 60, 0, 70, 22); g.fill(); g.restore(); } g.fillRect(-20, -450, 14, 900); }, { res: .7, fin: { rim: .1 } });
  const leafL = new Layer({ sheet: leaves, x: -1020, y: -60, z: 8, par: 1.5, blur: 6, name: 'leaves' }); L.push(leafL);
  // the light beam (world space, follows the wall layer) with flour dust inside it only
  const beamPoly = [[-900, -720], [-600, -720], [-120, 300], [-560, 320]];   // falls to the left of Tom, never on the cat
  const sc = {
    bg: '#2a1f2e', layers: L, cam: { x: 0, y: 0, zoom: 1 }, tomL, pussL, tomLo, tomHi, puss, hires: false, pose: {},
    light: { x: -700, y: -420, r: 1500, col: [255, 214, 150], floor: .45 },
    post: { bloom: .1, vig: .45, tint: [255, 236, 212], tintA: .06 }, litGain: .35,
    fx: [(g, { cam }) => {
      const t = sc.t || 0, par = .7, Zp = 1 + (cam.zoom - 1) * (.35 + .65 * par / 1.5);
      const P = ([x, y]) => [W / 2 + (x - cam.x * par) * Zp, H / 2 + (y - cam.y * par) * Zp];
      const pts = beamPoly.map(P);
      g.save(); g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
      const [ax, ay] = P([-750, -720]), [bx, by] = P([-340, 300]); const gr = g.createLinearGradient(ax, ay, bx, by);
      gr.addColorStop(0, 'rgba(255,226,170,.10)'); gr.addColorStop(1, 'rgba(255,226,170,0)');
      g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fill(); g.globalCompositeOperation = 'source-over';
      g.clip();   // dust only inside the beam
      const [cx, cy] = P([-300, -200]); specks(g, t, { n: 70, seed: 5, col: [255, 240, 205], a: .6, r: 1.6 * Zp, speed: 5, vx: 7, w: W, h: H });
      g.restore();
      // the cat's eyes stay bright in the shade
      const cs = G.catS, eyeY = G.catY - (158 + 92) * cs, k = sc.eyeGlow ?? .45, bl = blinkAt(t, 5, 3.2);
      if (k > 0 && bl < .5) for (const sx of [-1, 1]) { const [ex, ey] = P([G.catX + sx * 42 * cs, eyeY]).map((v, i) => v); const par2 = .9, Z2 = 1 + (cam.zoom - 1) * (.35 + .65 * par2 / 1.5); const qx = W / 2 + (G.catX + sx * 42 * cs - cam.x * par2) * Z2, qy = H / 2 + (eyeY - cam.y * par2) * Z2; glow(g, qx, qy, 46 * Z2, [150, 255, 130], k); }
    }],
    update(t) {
      sc.t = t;
      const rig = sc.hires ? tomHi : tomLo; tomL.sheet = rig.dyn; rig.pose(t, sc.pose);
      const Pp = puss.parts;
      Pp.tail.rot = Math.sin(t * 2.3) * .1; Pp.body.sy = breathe(t, .3, 3.4); Pp.head.rot = Math.sin(t * .5 + 2) * .035;
      Pp.head.face = { blink: blinkAt(t, 5, 3.2), lookX: sc.catLook ?? -.5, mouth: 'closed', brow: 0 };
      puss.render();
      leafL.vis = !!sc.leaves;
    },
  };
  return sc;
}
