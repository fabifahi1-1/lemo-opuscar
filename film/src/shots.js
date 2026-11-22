// The shots of the sample (0-25 s): each shot is { draw(g, t) } with t = seconds since the shot started
import { drawScene, mk, W, H } from './engine.js';
import { buildTable, buildMillWorld, buildStep } from './scenes.js';
import { paint, Layer } from './engine.js';
import { PAL, textRun, glyphLayers } from './art.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, spring } from './lib.js';

let TABLE, WORLD, STEP;
const table = () => TABLE ??= buildTable(), world = () => WORLD ??= buildMillWorld(), step = () => STEP ??= buildStep();
const K = (a, b, t, ease = eio) => lerp(a, b, ease(clamp(t)));

// opening 1: the lantern and the open book
function s1() { return { draw(g, t) { const sc = table(); sc.pageFlip.vis = sc.pageNew.vis = false; sc.cam.zoom = K(1, 1.07, t / 2.6); sc.cam.x = K(0, 40, t / 2.6); sc.cam.y = K(0, 26, t / 2.6); sc.update(t); drawScene(g, sc); } }; }

// opening 2: the page turns and becomes the sky; the title grows in the clouds
const OFF = () => (OFF.c ??= mk(W, H)); 
function s2() {
  return { draw(g, t) {
    const T = table(), Wd = world();
    // --- the book, pushing toward the right page; the page turns at 0.2-1.0 s
    const th = Math.PI * ss(seg(t, .2, 1.0)), f = T.pageFlip;
    f.vis = t > .2 && t < 1.1; T.pageNew.vis = t > .5;
    f.sheet = th > Math.PI / 2 ? f.back : f.face; f.sx = Math.max(.02, Math.abs(Math.cos(th))) * (th > Math.PI / 2 ? -1 : 1); f.sy = 1 + .05 * Math.sin(th);
    const z = K(1.5, 6.2, (t - .2) / 1.5, eio); T.cam.zoom = z; T.cam.x = K(40, 430, (t - .2) / 1.2); T.cam.y = K(26, 150, (t - .2) / 1.2);
    T.litGain = .3; T.post.bloom = .06; T.noGlow = true; T.update(t + 1); drawScene(g, T); T.litGain = .8; T.post.bloom = .3; T.noGlow = false;
    // --- the sky world fades in while the camera is still pushing
    const a = ss(seg(t, 1.2, 1.9));
    if (a > 0) {
      Wd.cam.zoom = K(1.25, 1, (t - 1.2) / 1.4, eo); Wd.cam.x = 0; Wd.cam.y = -900;
      Wd.letters.forEach(l => { const u = clamp((t - 1.45 - l.gi * .07) / .5); l.sy = Math.max(.001, back(u, 1.6)); l.sx = 1; l.alpha = u > 0 ? 1 : 0; });
      Wd.layers.find(l => l.seal).sx = Wd.layers.find(l => l.seal).sy = Math.max(0, back(clamp((t - 2.25) / .4), 2));
      Wd.update(t); const o = OFF().getContext('2d'); drawScene(o, Wd); g.globalAlpha = a; g.drawImage(OFF(), 0, 0); g.globalAlpha = 1;
    }
  } };
}

// opening 3: the camera tilts down through the hills to the mill; "Retold by Lantern and Page" types in
let RETOLD;
const retold = () => RETOLD ??= (() => {
  const run = textRun('Retold by Lantern and Page', 'Fredoka', 46, '#f3e6cf', { res: 1, weight: 500, fin: { rim: .3, under: .3 } });
  return { run, strip: paint(1400, 120, g => { g.fillStyle = '#17141c'; g.fillRect(-700, -60, 1400, 120); }, { res: 1, fin: { rim: 0, under: 0 } }) };
})();
function s3() {
  return { draw(g, t) {
    const Wd = world(), p = ss(clamp(t / 2.8));
    Wd.cam.zoom = 1; Wd.cam.x = 0; Wd.cam.y = lerp(-900, 0, p);
    Wd.letters.forEach(l => { l.sy = 1; l.sx = 1; l.alpha = 1 - ss(seg(t, .5, 1.5)); });
    const sl = Wd.layers.find(l => l.seal); sl.sx = sl.sy = 1; sl.alpha = 1 - ss(seg(t, .5, 1.5));
    Wd.update(t + 2.6); drawScene(g, Wd);
    // the credit line: cut-paper letters appear one by one on a dark strip at the bottom
    const R = retold(), n = R.run.glyphs.length, k = clamp((t - 1.15) / 1.4) * n, a = ss(seg(t, .9, 1.3));
    g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(22,18,28,.82)'; g.fillRect(0, H - 138, W, 138); g.restore();
    g.font = '500 46px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#f3e6cf';
    let shown = ''; R.run.glyphs.forEach((gl, i) => { if (i < Math.floor(k)) shown += gl.ch; });
    g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 6; g.shadowOffsetY = 2; g.globalAlpha = a;
    const tot = R.run.total; let x = W / 2 - tot / 2; R.run.glyphs.forEach((gl, i) => { if (i < k) { g.save(); const u = clamp(k - i); g.globalAlpha = a * ss(u); g.fillText(gl.ch, W / 2 + gl.x, H - 62 - (1 - ss(u)) * 8); g.restore(); } });
    g.shadowColor = 'transparent'; g.globalAlpha = 1;
  } };
}

// the hook, the cat in the shade, and the pull-out (the mill steps). Each shot keeps the cat's colour constant.
const G = () => step();
function hook() {   // XCU: a sleeve edge, both wrists and both hands holding the bread up at his chest
  return { draw(g, t) { const sc = step(); sc.hires = true; sc.leaves = false; sc.eyeGlow = .35; sc.pose = { lookY: .7, rubAt: 1.5, brow: .1, browTilt: -.6 };
    sc.cam.zoom = lerp(5.6, 5.9, t / 3.5); sc.cam.x = -65; sc.cam.y = -52; sc.update(t); drawScene(g, sc); } };
}
function catShade() {   // XCU: the cat in the doorway's shade, still orange, only the eyes bright
  return { draw(g, t) { const sc = step(); sc.hires = false; sc.leaves = false; sc.eyeGlow = .6; sc.catLook = -.6; sc.pose = { lookY: .7 };
    sc.cam.zoom = lerp(5.0, 5.2, t / 2.4); sc.cam.x = 330; sc.cam.y = -200; sc.update(t + 3.5); drawScene(g, sc); } };
}
function pullTom() {    // pull out from the bread to Tom sitting on the step, elbows near his knees
  return { draw(g, t) { const sc = step(), u = clamp(t / 2.9); sc.hires = u < .45; sc.leaves = false; sc.eyeGlow = .35; sc.catLook = -.5; sc.pose = { lookY: .7, browTilt: -.5 };
    sc.cam.zoom = K(4.2, 1.75, u, eio); sc.cam.x = K(-65, -40, u, eio); sc.cam.y = K(-52, -40, u, eio); sc.update(t + 6); drawScene(g, sc); } };
}
function revealCat() {  // wider: the cat sits in the doorway shade behind and beside Tom; Tom glances at him
  return { draw(g, t) { const sc = step(), u = clamp(t / 2.9); sc.hires = false; sc.leaves = true; sc.eyeGlow = .3; sc.catLook = -.8;
    sc.pose = { look: ss(seg(t, .5, 1.1)) * .9, lookY: .7 - ss(seg(t, .5, 1.1)) * .6, tilt: ss(seg(t, .5, 1.1)) * .06 };
    sc.cam.zoom = K(1.32, 1.22, u, x => x); sc.cam.x = K(70, 60, u, x => x); sc.cam.y = -30; sc.update(t + 9); drawScene(g, sc); } };
}

// the mill by the river: a slow track, the label "the mill →" grows in
let LABEL;
const label = () => LABEL ??= (() => {
  const w = 330, h = 110;
  const sheet = paint(w + 20, h + 20, g => {
    g.fillStyle = '#fbf0d8'; g.beginPath(); g.moveTo(-w / 2, -40); g.lineTo(w / 2 - 70, -40); g.lineTo(w / 2 - 70, -58); g.lineTo(w / 2, 0); g.lineTo(w / 2 - 70, 58); g.lineTo(w / 2 - 70, 40); g.lineTo(-w / 2, 40); g.closePath(); g.fill();
    g.fillStyle = '#2a2347'; g.font = '500 56px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('the mill', -34, 4);
  }, { res: 1, ax: (w + 20) / 2 - 0, ay: (h + 20) / 2, fin: { rim: .5, under: .3 } });
  return new Layer({ sheet, x: -330, y: -135, z: 4.6, par: .75, trans: .5, shadow: { dy: 8, blur: 6, a: .3 }, sx: 0, sy: 1, rot: -.05 });
})();
function s6() {
  return { draw(g, t) {
    const Wd = world(); Wd.letters.forEach(l => { l.alpha = 0; }); const sl = Wd.layers.find(l => l.seal); sl.alpha = 0;
    const lb = label(); if (!Wd.layers.includes(lb)) Wd.layers.push(lb);
    lb.sx = Math.max(.001, back(clamp((t - .8) / .5), 1.5)); lb.alpha = 1;
    Wd.cam.zoom = 1; Wd.cam.x = K(-120, 110, t / 2.89, x => x); Wd.cam.y = 0; Wd.update(t + 5); drawScene(g, Wd);
  } };
}
// the wheel (L004 first half)
function s7() {
  return { draw(g, t) {
    const Wd = world(); const lb = label(); lb.alpha = 0; Wd.letters.forEach(l => { l.alpha = 0; }); Wd.layers.find(l => l.seal).alpha = 0;
    const u = t / 2.39; Wd.cam.zoom = K(1.8, 1.86, u, x => x); Wd.cam.x = K(-270, -215, u, eio); Wd.cam.y = K(190, 182, u, eio); Wd.update(t + 9); drawScene(g, Wd);
  } };
}
export const SHOT = { open1: s1(), open2: s2(), open3: s3(), 'L001[1:7]': hook(), 'L001[8:]': catShade(), 'L002[1:6]': pullTom(), 'L002[7:]': revealCat(), L003: s6(), 'L004[1:5]': s7() };
