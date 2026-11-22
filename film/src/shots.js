// The sample's shots. Each: { draw(g, t), mb?: (t) => subframes for motion blur }. t = seconds since the shot started.
// Moves inside a shot are camera dollies (cam.dz), never flat zooms; cam.zoom is the lens chosen for the shot.
import { drawScene, mk, W, H, paint, Layer } from './engine.js';
import { buildTable, buildMillWorld, buildSteps, MILL, STEP } from './scenes.js';
import { blinkTrack, spring, antic } from './puppets.js';
import { clamp, lerp, seg, ss, eio, eo, back } from './lib.js';

let TABLE, WORLD, STEPS;
const table = () => TABLE ??= buildTable(), world = () => WORLD ??= buildMillWorld(), steps = () => STEPS ??= buildSteps({ ots: false });
const K = (a, b, u, ease = eio) => lerp(a, b, ease(clamp(u)));
const OFF = mk(W, H), og = OFF.getContext('2d');

// ---------- opening ----------
function open1() { return { draw(g, t) { const sc = table(); sc.pageFlip.vis = sc.pageNew.vis = false; sc.noGlow = false;
  Object.assign(sc.cam, { zoom: 1.24, x: -26, y: 96, dz: K(0, .1, t / 1.8, x => x) }); sc.update(t); drawScene(g, sc); } }; }

// the title types in letter by letter (each letter pops from 70 % to full size), then the credit line; no thin lines, no cursor
function setTitle(Wd, t, t0 = 0) {
  for (const l of Wd.letters) { const u = clamp((t - t0 - l.gi * .055) / .18); l.sx = l.sy = .7 + .3 * back(u, 2); l.alpha = ss(u); }
  for (const l of Wd.credit) { const u = clamp((t - t0 - .85 - l.gi * .045) / .16); l.sx = l.sy = .7 + .3 * back(u, 2); l.alpha = ss(u); }
}
const PAGE_C = [385, 164];   // the middle of the right-hand page
function open2() {
  return { draw(g, t) {
    const T = table(), Wd = world();
    // a real page turn: the right-hand page lifts, bows and falls to the left, uncovering the next page (a painted sky)
    T.pageFlip.vis = t < 1.6; T.pageFlip.flip = ss(seg(t, .1, .85)); T.pageNew.vis = true;
    // the camera moves in until the painted sky fills the whole frame (no book in view), only then the real sky takes over
    const m = seg(t, .5, 1.5);
    Object.assign(T.cam, { zoom: 1.24, x: lerp(-26, PAGE_C[0], eio(m)), y: lerp(96, PAGE_C[1], eio(m)), dz: lerp(.1, 1.72, eio(m)) });
    T.noGlow = t > .6; T.update(t + 1.8); drawScene(g, T);
    const a = ss(seg(t, 1.5, 1.9));
    if (a > 0) {
      Object.assign(Wd.cam, { zoom: 1, x: 0, y: -1200, dz: K(-.6, .4, (t - 1.5) / 2.2, x => x) });
      setTitle(Wd, t, 1.95); Wd.update(t);
      drawScene(og, Wd); g.globalAlpha = a; g.drawImage(OFF, 0, 0); g.globalAlpha = 1;
    }
  } };
}
function open3() {   // a slow, eased 2.5 s tilt; the title rides up and out of frame; the mill ends sharp
  return { draw(g, t) {
    const Wd = world(), u = eio(clamp(t / 2.5));
    Object.assign(Wd.cam, { zoom: 1, x: 0, y: lerp(-1200, 0, u), dz: lerp(.4, 0, u) });
    setTitle(Wd, 99); Wd.focus = 2.6; Wd.update(t + 3.7); drawScene(g, Wd);
  } };
}

// ---------- the mill steps (Tom on the left, the cat on the right, the wall behind them in every shot) ----------
const blinks = (list, d = .2) => tt => { let v = 0; for (const [a, dd] of list.map(x => Array.isArray(x) ? x : [x, d])) { const w = (tt - a) / dd; if (w > 0 && w < 1) v = Math.max(v, w < .4 ? w / .4 : 1 - (w - .4) / .6); } return v; };
const bump = (tt, a, b) => { const w = seg(tt, a, b); return w > 0 && w < 1 ? Math.sin(w * Math.PI) : 0; };
function stepsScene() {
  const sc = steps(), G = STEP; sc.rear.vis = sc.hands.vis = false; sc.tomL.vis = true; sc.pussL.vis = true; sc.blurOverride = null;
  Object.assign(sc.tomL, { x: G.tomX, y: G.tomY, d: 2.0, sx: G.tomS, sy: G.tomS }); return sc;
}
// A. the hands (mid-chest to knees, no face): the fingers tighten once, the thumb rubs the crust once
function hook() {
  return { draw(g, t) {
    const sc = stepsScene(), T0 = 8.0; sc.hires = true; sc.focus = 2.0;
    sc.tomPose = { lookY: .75, lookX: .2, browTilt: -.75, worry: tt => bump(tt, 8.8, 9.9), rubAt: 10.2, blink: blinks([]) };
    sc.catPose = { lookX: -1, lookY: .7 };
    Object.assign(sc.sackL, { x: -380, y: 196, sx: .24, sy: .24, vis: true }); Object.assign(sc.ivyL, { vis: false }); sc.pussL.vis = false;   // the cat is just outside this frame
    Object.assign(sc.cam, { zoom: 5.0, x: -150, y: 88, dz: K(0, .08, t / 3.5, x => x) });
    sc.update(t + T0); drawScene(g, sc); sc.ivyL.vis = true;
  } };
}
// B. Tom's whole face: eyes open, looking down at the bread, worried brows; one sigh, one blink. The cat looks at the bread.
function worried() {
  return { draw(g, t) {
    const sc = stepsScene(), T0 = 11.5; sc.hires = false; sc.focus = 2.0;
    sc.tomPose = { lookY: .95, lookX: .3, brow: .25, browTilt: -.85, mouth: 'wobbly', wob: tt => 1.2 * Math.sin(tt * 7), worry: .3, sigh: T0 + .45, blink: blinks([13.3]) };
    sc.catPose = { lookX: -1, lookY: 1, headDown: 1, blink: blinks([12.2]) };
    Object.assign(sc.ivyL, { x: 300, y: -330, vis: true }); Object.assign(sc.sackL, { x: -760, y: 420, sx: 1, sy: 1 });
    Object.assign(sc.cam, { zoom: 2.4, x: -52, y: -68, dz: K(0, .06, t / 2.39, x => x) });
    sc.update(t + T0); drawScene(g, sc);
  } };
}
// C. THE EXPENSIVE SHOT: the camera at Tom's right side, looking along the step to the cat. Tom's shoulder, arm and hands
// with the bread are big in the left foreground (his whole puppet, so they stay joined to his body); the cat sits further along
// the step, the wall behind both. The focus moves from the bread to the cat in 1 s; the camera moves from the first frame.
function focusPull() {
  return { draw(g, t) {
    const sc = stepsScene(), T0 = 13.89, u = ss(seg(t, 1.0, 2.0)); sc.hires = true;
    Object.assign(sc.tomL, { x: -450, y: 55, d: 1.45, sx: 2.4, sy: 2.4 });   // chin above the frame, Tom on the left
    sc.focus = lerp(1.45, 2.2, u);
    sc.blurOverride = new Map([[sc.tomL, lerp(0, 9, u)], [sc.pussL, lerp(9, 0, u)]]);
    sc.tomPose = { lookY: .9, lookX: .5, browTilt: -.6, worry: .3, blink: blinks([]) };
    sc.catPose = { lookX: -1, lookY: .55, earLag: -.06, blink: blinks([15.25]),
      sniff: tt => { const v = (tt - T0 - .45) / .6; return v > 0 && v < 1 ? Math.abs(Math.sin(v * Math.PI * 5)) : 0; } };
    Object.assign(sc.ivyL, { vis: false }); Object.assign(sc.sackL, { vis: false });
    Object.assign(sc.cam, { zoom: 2.0, x: -97, y: 26, dz: K(0, .1, t / 3.68, x => x) });
    sc.update(t + T0); drawScene(g, sc); sc.ivyL.vis = sc.sackL.vis = true;
  } };
}
// D. wide and low, steps on a diagonal: Tom's eyes go to the cat, then his head, then he smiles; the cat looks up at Tom and does one slow blink
function turnSmile() {
  return { draw(g, t) {
    const sc = stepsScene(), T0 = 17.57; sc.hires = false; sc.focus = 2.05;
    const eyes = tt => ss(seg(tt - T0, .1, .26)), head = tt => antic(seg(tt - T0, .24, .8), .1), smile = tt => ss(seg(tt - T0, .8, 1.25));
    sc.tomPose = {
      lookX: tt => lerp(.3, .95, eyes(tt)), lookY: tt => lerp(.9, .1, eyes(tt)),
      headTurn: tt => lerp(.45, .85, head(tt)), headDip: tt => 4 * Math.sin(Math.PI * clamp(seg(tt - T0, .24, .8))),
      tuftRot: tt => (spring(head, tt, T0, 70, 6) - head(tt)) * -.9,
      brow: tt => lerp(.25, .35, smile(tt)), browTilt: tt => lerp(-.85, 0, smile(tt)),
      mouth: tt => smile(tt) > .05 ? 'smile' : 'wobbly', smile: tt => smile(tt), wob: 0, worry: tt => .3 * (1 - smile(tt)), blink: blinks([]),
    };
    const up = tt => antic(seg(tt - T0, .3, .75), .15);
    sc.catPose = { lookX: tt => lerp(-1, -.95, up(tt)), lookY: tt => lerp(.8, -.35, up(tt)), headLift: tt => .45 * up(tt), headDown: tt => 1 - up(tt),
      earLag: tt => -.06 + .5 * (spring(up, tt, T0) - up(tt)), tailLag: tt => (spring(up, tt, T0, 60, 7) - up(tt)) * .6, blink: blinks([[18.75, .75]]) };
    Object.assign(sc.sackL, { x: -470, y: 290, sx: .8, sy: .8, vis: true }); Object.assign(sc.ivyL, { x: 450, y: -360, vis: true });
    Object.assign(sc.cam, { zoom: 1.62, x: -12, y: -30, dz: K(0, .05, t / 2.22, x => x) });
    sc.update(t + T0); drawScene(g, sc);
  } };
}

// ---------- the mill by the river ----------
let LABEL;
const label = () => LABEL ??= (() => {   // a paper tag whose arrow tip is the anchor; it points at the mill's left wall
  const w = 330, h = 116;
  const sheet = paint(w + 20, h + 20, g => {
    g.fillStyle = '#fbf0d8'; g.beginPath(); g.moveTo(-w, -40); g.lineTo(-70, -40); g.lineTo(-70, -58); g.lineTo(0, 0); g.lineTo(-70, 58); g.lineTo(-70, 40); g.lineTo(-w, 40); g.closePath(); g.fill();
    g.fillStyle = '#2a2347'; g.font = '500 56px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('the mill', -w / 2 - 30, 4);
  }, { res: 1.5, ax: w + 10, ay: (h + 20) / 2, fin: { rim: .5, under: .3 } });
  return new Layer({ sheet, x: MILL.x - 168, y: MILL.base - 300, z: 4.6, d: 2.59, sx: 0, rot: -.04, sharp: true, name: 'label' });
})();
function millWide() {
  return { draw(g, t) {
    const Wd = world(); setTitle(Wd, 99, 0);
    const lb = label(); if (!Wd.layers.includes(lb)) Wd.layers.push(lb);
    lb.vis = true; lb.sx = Math.max(.001, back(clamp((t - .7) / .45), 1.4));
    Object.assign(Wd.cam, { zoom: 1, x: K(-255, -150, t / 2.89, x => x), y: 0, dz: K(0, .08, t / 2.89, x => x) });   // the mill on the right third
    Wd.focus = 2.6; Wd.update(t + 6); drawScene(g, Wd);
  } };
}
function wheelMS() {
  return { draw(g, t) {
    const Wd = world(); setTitle(Wd, 99, 0); label().vis = false;
    Object.assign(Wd.cam, { zoom: 1.9, x: -286, y: 141, dz: K(0, .1, t / 2.39, eio) });
    Wd.focus = 2.55; Wd.update(t + 9); drawScene(g, Wd);
  } };
}

export const SHOT = { open1: open1(), open2: open2(), open3: open3(), 'L001[1:7]': hook(), 'L001[8:]': worried(), 'L002[1:8]': focusPull(), 'L002[9:]': turnSmile(), L003: millWide(), 'L004[1:5]': wheelMS() };
