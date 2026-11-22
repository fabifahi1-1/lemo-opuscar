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
  Object.assign(sc.cam, { zoom: 1.24, x: -26, y: 96, dz: K(0, .1, t / 2.2, x => x) }); sc.update(t); drawScene(g, sc); } }; }

function setTitle(Wd, t, fade = 1) {   // title letters grow from their base; the credit line types in letter by letter
  for (const l of Wd.letters) { const u = clamp((t - 1.2 - l.gi * .07) / .45); l.sy = Math.max(.001, back(u, 1.6)); l.sx = 1; l.alpha = (u > 0 ? 1 : 0) * fade; }
  for (const l of Wd.credit) { const u = clamp((t - 2.2 - l.gi * .046) / .22); l.sy = l.sx = Math.max(.001, .6 + .4 * back(u, 2)); l.alpha = ss(u) * fade; }
}
function open2() {
  return { mb: t => (t > .1 && t < 1.5 ? 5 : 1), draw(g, t) {
    const T = table(), Wd = world();
    const th = Math.PI * ss(seg(t, .15, .85)), f = T.pageFlip;
    f.vis = t > .15 && t < .95; T.pageNew.vis = t > .4;
    f.sheet = th > Math.PI / 2 ? f.back : f.face; f.sx = .78 * Math.max(.02, Math.abs(Math.cos(th))) * (th > Math.PI / 2 ? -1 : 1); f.sy = .78 * (1 + .05 * Math.sin(th));
    // the camera moves forward onto the right-hand page (a dolly: the lantern, nearer, slides out first)
    Object.assign(T.cam, { zoom: 1.24, x: K(-26, 345, (t - .1) / 1.1), y: K(96, 175, (t - .1) / 1.1), dz: K(.1, 1.6, (t - .1) / 1.3) });
    T.noGlow = t > .7; T.update(t + 2.2); drawScene(g, T);
    const a = ss(seg(t, .95, 1.45));
    if (a > 0) {
      Object.assign(Wd.cam, { zoom: 1, x: 0, y: -1500, dz: K(-.6, .4, (t - .95) / 2.85, x => x) });
      setTitle(Wd, t); Wd.update(t);
      drawScene(og, Wd); g.globalAlpha = a; g.drawImage(OFF, 0, 0); g.globalAlpha = 1;
    }
  } };
}
function open3() {
  return { mb: () => 6, draw(g, t) {
    const Wd = world(), u = clamp(t / 2.0);
    Object.assign(Wd.cam, { zoom: 1, x: 0, y: lerp(-1500, 0, eio(u)), dz: lerp(.4, 0, eio(u)) });
    setTitle(Wd, 99, 1 - ss(seg(t, .1, .9))); Wd.update(t + 3.8); drawScene(g, Wd);
  } };
}

// ---------- the mill steps ----------
const TOMBLINK = blinkTrack(3, { forced: [13.4, 19.1] }), CATBLINK = blinkTrack(8, { slow: [16.85] });   // film time
function stepsScene(ots) { const sc = steps(); sc.rear.vis = sc.hands.vis = ots; sc.tomL.vis = !ots; sc.pussL.vis = true; sc.blurOverride = null; return sc; }
// A. the hands (mid-chest to knees, no face)
function hook() {
  return { draw(g, t) {
    const sc = stepsScene(false), T0 = 8.0; sc.hires = true; sc.focus = 2.0;
    sc.tomPose = { lookY: .75, lookX: .2, browTilt: -.75, mouth: 'wobbly', worry: tt => ss(seg(tt, .5, 1.4)), rubAt: 1.9, blink: tt => TOMBLINK(tt + T0) };
    sc.catPose = { lookX: -.8, lookY: .6, blink: tt => CATBLINK(tt + T0) };
    Object.assign(sc.sackL, { x: -380, y: 196, sx: .24, sy: .24, vis: true }); Object.assign(sc.ivyL, { vis: false }); sc.pussL.vis = false;   // the cat is just outside this frame
    Object.assign(sc.cam, { zoom: 5.0, x: -150, y: 88, dz: K(0, .08, t / 3.5, x => x) });
    sc.update(t + T0); drawScene(g, sc); sc.ivyL.vis = true;
  } };
}
// B. Tom's whole face, worried; a small sigh; a blink
function worried() {
  return { draw(g, t) {
    const sc = stepsScene(false), T0 = 11.5; sc.hires = false; sc.focus = 2.0;
    sc.tomPose = { lookY: .8, lookX: .25, brow: .25, browTilt: -.85, mouth: 'wobbly', wob: tt => 1.5 * Math.sin(tt * 9), worry: 1, sigh: T0 + .45, blink: tt => TOMBLINK(tt + T0) };
    sc.catPose = { lookX: -.8, lookY: .6, sniff: tt => { const u = (tt - T0 - 1.3) / .5; return u > 0 && u < 1 ? Math.abs(Math.sin(u * Math.PI * 4)) : 0; }, blink: tt => CATBLINK(tt + T0) };
    Object.assign(sc.ivyL, { x: 300, y: -330, vis: true }); Object.assign(sc.sackL, { x: -760, y: 420, sx: 1, sy: 1 });
    Object.assign(sc.cam, { zoom: 2.4, x: -52, y: -68, dz: K(0, .06, t / 2.39, x => x) });
    sc.update(t + T0); drawScene(g, sc);
  } };
}
// C. THE EXPENSIVE SHOT: over Tom's shoulder; focus pulls from the bread to the cat's eyes; slow push-in
function focusPull() {
  return { draw(g, t) {
    const sc = stepsScene(true), T0 = 13.89, u = ss(seg(t, 1.1, 2.1));
    sc.focus = lerp(1.5, 2.2, u);
    sc.blurOverride = new Map([[sc.rear, 12], [sc.hands, lerp(0, 10, u)], [sc.pussL, lerp(9, 0, u)]]);
    Object.assign(sc.rear, { x: -340, y: 106, sx: .35, sy: .35 * (1 + .006 * Math.sin(t * 1.8)) }); Object.assign(sc.hands, { x: -152, y: 210 + Math.sin(t * 1.7) * 1.2, sx: .5, sy: .5 });
    const look = tt => antic(seg(tt - T0, 2.15, 2.65), .18);            // the cat looks up at Tom (a small dip first)
    sc.catPose = {
      lookX: tt => lerp(-.8, -.75, look(tt)), lookY: tt => lerp(.65, -.45, look(tt)),
      headLift: tt => look(tt) * .5, earLag: tt => -.06 + .12 * (spring(look, tt, T0) - look(tt)) * 4,
      sniff: tt => { const v = (tt - T0 - .45) / .6; return v > 0 && v < 1 ? Math.abs(Math.sin(v * Math.PI * 5)) : 0; },
      tailLag: tt => (spring(look, tt, T0, 60, 7) - look(tt)) * .6, blink: tt => CATBLINK(tt),
    };
    Object.assign(sc.ivyL, { vis: false }); Object.assign(sc.sackL, { vis: false });
    Object.assign(sc.cam, { zoom: 2.6, x: -56, y: 54, dz: K(0, .12, t / 3.68, eio) });
    sc.update(t + T0); drawScene(g, sc); sc.ivyL.vis = sc.sackL.vis = true;
  } };
}
// D. wide and low, steps on a diagonal: Tom's eyes go to the cat, his head follows, a small kind smile
function turnSmile() {
  return { draw(g, t) {
    const sc = stepsScene(false), T0 = 17.57; sc.hires = false; sc.focus = 2.05;
    const eyes = tt => ss(seg(tt - T0, .1, .26)), head = tt => antic(seg(tt - T0, .24, .8), .1), smile = tt => ss(seg(tt - T0, .8, 1.25));
    sc.tomPose = {
      lookX: tt => lerp(.2, .95, eyes(tt)), lookY: tt => lerp(.8, .1, eyes(tt)),
      headTurn: tt => lerp(.45, .85, head(tt)), headDip: tt => 4 * Math.sin(Math.PI * clamp(seg(tt - T0, .24, .8))),   // the head dips a little mid-turn (an arc)
      tuftRot: tt => (spring(head, tt, T0, 70, 6) - head(tt)) * -.9,                                                     // the tuft trails, overshoots, settles
      brow: tt => lerp(.25, .35, smile(tt)), browTilt: tt => lerp(-.85, 0, smile(tt)),
      mouth: tt => smile(tt) > .05 ? 'smile' : 'wobbly', smile: tt => smile(tt), wob: 0, worry: tt => 1 - smile(tt), blink: tt => TOMBLINK(tt),
    };
    sc.catPose = { lookX: -.95, lookY: -.3, headLift: .4, blink: tt => CATBLINK(tt) };
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
