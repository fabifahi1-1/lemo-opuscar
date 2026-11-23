// Comic pops and effects, drawn over the scene. Each returns a function (g, c) for c.fx(); positions are world
// coordinates at distance d (default 2), so effects stay pinned to the action when the camera moves.
// Pops grow 0% → 110% → 100% over 6 frames (0.25 s), wobble a little, hold, then fade.
import { glow } from '../engine.js';
import { clamp, lerp, ss, back, mulberry, TAU, hash } from '../lib.js';

const pop = (t, t0) => { const u = (t - t0) / .25; return u <= 0 ? 0 : u >= 1 ? 1 : u < .6 ? 1.1 * ss(u / .6) : 1.1 - .1 * ss((u - .6) / .4); };
const life = (t, t0, hold, out = .3) => t < t0 ? 0 : t < t0 + .25 + hold ? 1 : 1 - clamp((t - t0 - .25 - hold) / out);
const FONT = '"Lilita One"';

function paperText(g, txt, size, fill, ink = '#2a1a2e', stroke = .16) {   // cut-paper lettering: a dark backing sheet, the coloured letters, a soft drop
  g.font = `${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.save(); g.shadowColor = 'rgba(30,12,4,.35)'; g.shadowBlur = size * .12; g.shadowOffsetX = size * .04; g.shadowOffsetY = size * .07;
  g.strokeStyle = ink; g.lineWidth = size * stroke; g.strokeText(txt, 0, 0); g.restore();
  g.fillStyle = fill; g.fillText(txt, 0, 0);
  g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.18)'; g.fillText(txt, -size * .02, -size * .03); g.restore();
}
// a big hand-cut sound word: CLIP-CLOP!, SPLASH!, KNOCK!, ROAR!, POOF!, SQUEAK!, BOO!, EEEK!
export function word(txt, x, y, t0, o = {}) {
  return (g, c) => {
    const a = life(c.t, t0, o.hold ?? 1, o.out ?? .3); if (a <= 0) return;
    const [px, py, Z] = c.p(x, y, o.d ?? 2), k = pop(c.t, t0) * (o.size ?? 90) * (o.screen ? 1 : Math.min(2.4, Z));
    g.save(); g.globalAlpha = a; g.translate(px, py); g.rotate((o.rot ?? -.06) + Math.sin((c.t - t0) * 9) * .035 * Math.max(0, 1 - (c.t - t0)));
    paperText(g, txt, k, o.col || '#ffd24a', o.ink, o.stroke); g.restore();
  };
}
// speech bubble (round paper cloud with a tail), shout bubble (spiky), whisper bubble (dashed, small)
export function bubble(txt, x, y, t0, t1, o = {}) {
  return (g, c) => {
    if (c.t < t0 || c.t > t1 + .25) return;
    const a = c.t > t1 ? 1 - (c.t - t1) / .25 : 1, [px, py, Z] = c.p(x, y, o.d ?? 2), sz = (o.size ?? 64) * (o.screen ? 1 : Math.min(2.2, Z)) * pop(c.t, t0);
    if (sz <= 0) return;
    g.save(); g.globalAlpha = a; g.translate(px, py); g.rotate(o.rot ?? 0);
    g.font = `${sz}px ${FONT}`; const tw = g.measureText(txt).width, w = tw / 2 + sz * .55, h = sz * .85, kind = o.kind || 'speech', [tx, ty] = o.tail || [-.6, 1];
    g.shadowColor = 'rgba(30,12,4,.3)'; g.shadowBlur = sz * .2; g.shadowOffsetX = sz * .06; g.shadowOffsetY = sz * .1;
    g.fillStyle = o.fill || '#fffaf0'; g.strokeStyle = '#2a1a2e'; g.lineWidth = Math.max(2, sz * .06);
    g.beginPath();
    if (kind === 'shout') { const n = 18; for (let i = 0; i <= n; i++) { const ang = i / n * TAU, r = i % 2 ? .82 : 1.12; g.lineTo(Math.cos(ang) * w * r * 1.08, Math.sin(ang) * h * r * 1.15); } }
    else g.ellipse(0, 0, w, h, 0, 0, TAU);
    g.moveTo(tx * w * .35, h * .6 * Math.sign(ty || 1)); g.lineTo(tx * w * .75, ty * h * 1.6); g.lineTo(tx * w * .1, h * .7 * Math.sign(ty || 1));
    if (kind === 'whisper') g.setLineDash([sz * .18, sz * .12]);
    g.fill(); g.shadowColor = 'transparent'; g.stroke(); g.setLineDash([]);
    g.fillStyle = o.ink || '#2a1a2e'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, sz * .04);
    g.restore();
  };
}
// a thought bubble that grows from three small dots; `art(g, w, h, t)` draws its picture inside
export function thought(x, y, t0, t1, art, o = {}) {
  return (g, c) => {
    if (c.t < t0 || c.t > t1 + .3) return;
    const [px, py, Z] = c.p(x, y, o.d ?? 2), k = (o.size ?? 1) * Math.min(2, Z), tt = c.t - t0, a = c.t > t1 ? 1 - (c.t - t1) / .3 : 1;
    const [dx, dy] = o.dir || [1, -1];
    g.save(); g.globalAlpha = a; g.translate(px, py); g.fillStyle = '#fffaf0'; g.strokeStyle = '#2a1a2e'; g.lineWidth = 3 * k;
    g.shadowColor = 'rgba(30,12,4,.28)'; g.shadowBlur = 12 * k; g.shadowOffsetY = 6 * k;
    for (let i = 0; i < 3; i++) { const u = clamp((tt - i * .12) / .15); if (u <= 0) continue; const r = (6 + i * 5) * k * back(u); g.beginPath(); g.arc(dx * (i * 26 + 10) * k, dy * (i * 24 + 8) * k, r, 0, TAU); g.fill(); g.stroke(); }
    const u = clamp((tt - .4) / .3); if (u > 0) {
      const W2 = (o.w ?? 260) * k * back(u, 1.4), H2 = (o.h ?? 180) * k * back(u, 1.4), cx = dx * (100 * k + W2 / 2), cy = dy * (80 * k + H2 / 2);
      g.beginPath(); const n = 11; for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, am = (a0 + a1) / 2; g.quadraticCurveTo(cx + Math.cos(am) * W2 * .66, cy + Math.sin(am) * H2 * .68, cx + Math.cos(a1) * W2 * .52, cy + Math.sin(a1) * H2 * .52); }
      g.closePath(); g.fill(); g.shadowColor = 'transparent'; g.stroke();
      if (art && u > .5) { g.save(); g.beginPath(); g.ellipse(cx, cy, W2 * .48, H2 * .46, 0, 0, TAU); g.clip(); g.translate(cx, cy); g.globalAlpha = a * ss((u - .5) / .5); art(g, W2, H2, tt); g.restore(); }
    }
    g.restore();
  };
}
// sparkles: a little burst of four-point stars
export function sparkle(x, y, t0, o = {}) {
  return (g, c) => {
    const tt = c.t - t0, dur = o.dur ?? .8; if (tt < 0 || tt > dur) return;
    const [px, py, Z] = c.p(x, y, o.d ?? 2), R = mulberry(o.seed ?? 3), n = o.n ?? 5, k = (o.size ?? 22) * Math.min(2.4, Z);
    for (let i = 0; i < n; i++) {
      const dl = R() * .25, u = clamp((tt - dl) / (dur - dl)); if (u <= 0) continue;
      const ang = R() * TAU, r = (o.spread ?? 50) * Math.min(2.4, Z) * (.3 + R()) * ss(u), s = k * (.5 + R() * .7) * Math.sin(u * Math.PI);
      const sx = px + Math.cos(ang) * r, sy = py + Math.sin(ang) * r;
      glow(g, sx, sy, s * 2.2, o.glow || [255, 236, 170], .5);
      g.save(); g.translate(sx, sy); g.rotate(u * 1.5); g.fillStyle = o.col || '#fff6d0'; g.beginPath();
      for (let j = 0; j < 8; j++) { const a2 = j * Math.PI / 4, rr = j % 2 ? s * .22 : s; g.lineTo(Math.cos(a2) * rr, Math.sin(a2) * rr); } g.closePath(); g.fill(); g.restore();
    }
  };
}
// soft paper dust puffs (running feet), smoke poof (transformations: 12 frames to full, then fades)
export function puffs(x, y, t0, o = {}) {
  return (g, c) => {
    const tt = c.t - t0, dur = o.dur ?? .6; if (tt < 0 || tt > dur) return;
    const [px, py, Z] = c.p(x, y, o.d ?? 2), R = mulberry(o.seed ?? 9), n = o.n ?? 4, u = tt / dur;
    for (let i = 0; i < n; i++) { const ang = Math.PI + (R() - .5) * 1.6 * (o.dir ?? 1), r = (o.size ?? 22) * Z * (.6 + R() * .6) * (.5 + u), dd = (o.spread ?? 40) * Z * ss(u) * (.5 + R());
      g.fillStyle = `rgba(${o.col || '236,222,196'},${.75 * (1 - u)})`; g.beginPath(); g.arc(px + Math.cos(ang) * dd * (o.dir ?? -1) * -1, py - Math.abs(Math.sin(ang)) * dd * .4, r, 0, TAU); g.fill(); }
  };
}
export function poof(x, y, t0, o = {}) {
  return (g, c) => {
    const tt = c.t - t0, dur = o.dur ?? 1.1; if (tt < 0 || tt > dur) return;
    const [px, py, Z] = c.p(x, y, o.d ?? 2), R = mulberry(o.seed ?? 21), S = (o.size ?? 200) * Z, grow = ss(clamp(tt / .5)), fade = 1 - clamp((tt - .55) / (dur - .55));
    for (let i = 0; i < 16; i++) {
      const ang = R() * TAU, r0 = R() * .5 + .3, rr = S * (.22 + R() * .2) * (.4 + .8 * grow), x2 = px + Math.cos(ang) * S * r0 * .6 * grow, y2 = py + Math.sin(ang) * S * r0 * .45 * grow;
      g.fillStyle = `rgba(${R() < .5 ? '246,240,252' : '226,218,240'},${.95 * fade})`; g.beginPath(); g.arc(x2, y2, rr, 0, TAU); g.fill();
    }
    g.strokeStyle = `rgba(90,70,110,${.35 * fade})`; g.lineWidth = 3; for (let i = 0; i < 8; i++) { const ang = i / 8 * TAU, r1 = S * .55 * grow, r2 = S * .75 * grow; g.beginPath(); g.moveTo(px + Math.cos(ang) * r1, py + Math.sin(ang) * r1 * .7); g.lineTo(px + Math.cos(ang) * r2, py + Math.sin(ang) * r2 * .7); g.stroke(); }
  };
}
// motion / swish lines trailing behind something moving along +x (dir) at world point x,y
export function speedLines(fx, fy, t0, t1, o = {}) {
  return (g, c) => {
    if (c.t < t0 || c.t > t1) return; const [px, py, Z] = c.p(fx(c.t), fy(c.t), o.d ?? 2), dir = o.dir ?? 1, R = mulberry(5);
    g.strokeStyle = o.col || 'rgba(255,250,235,.85)'; g.lineCap = 'round';
    for (let i = 0; i < (o.n ?? 5); i++) { const yy = py + (R() - .5) * (o.h ?? 120) * Z, L = (40 + R() * 70) * Z, x0 = px - dir * (30 + R() * 40) * Z, ph = (c.t * 6 + R()) % 1; g.globalAlpha = .9 * Math.sin(ph * Math.PI); g.lineWidth = (3 + R() * 3) * Math.min(2, Z); g.beginPath(); g.moveTo(x0, yy); g.lineTo(x0 - dir * L, yy); g.stroke(); }
    g.globalAlpha = 1;
  };
}
// little curved lines around a shivering/rumbling thing; tummy-rumble arcs
export function shiver(x, y, t0, t1, o = {}) {
  return (g, c) => {
    if (c.t < t0 || c.t > t1) return; const [px, py, Z] = c.p(x, y, o.d ?? 2), w = (o.w ?? 120) * Z, h = (o.h ?? 120) * Z;
    g.strokeStyle = o.col || 'rgba(255,255,255,.9)'; g.lineWidth = 4 * Math.min(2, Z); g.lineCap = 'round';
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const yy = py - h * .3 + i * h * .3, xx = px + sx * (w * .55 + i * 6 * Z), j = Math.sin(c.t * 40 + i) * 3 * Z; g.beginPath(); g.moveTo(xx + j, yy - 12 * Z); g.quadraticCurveTo(xx + sx * 10 * Z + j, yy, xx + j, yy + 12 * Z); g.stroke(); }
  };
}
export function rumble(x, y, t0, t1, o = {}) {
  return (g, c) => {
    if (c.t < t0 || c.t > t1) return; const [px, py, Z] = c.p(x, y, o.d ?? 2), k = Math.min(2.5, Z);
    g.strokeStyle = o.col || '#3a2236'; g.lineWidth = 4 * k; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const ph = ((c.t - t0) * 2.2 + i / 3) % 1, r = (30 + ph * 60) * k; g.globalAlpha = Math.sin(ph * Math.PI); for (const sx of [-1, 1]) { g.beginPath(); for (let s = 0; s <= 12; s++) { const a = -.7 + s / 12 * 1.4; g.lineTo(px + sx * Math.cos(a) * r + Math.sin(s * 2 + c.t * 30) * 3 * k, py + Math.sin(a) * r); } g.stroke(); } }
    g.globalAlpha = 1;
  };
}
// music notes floating out (the doorbell tune), zzz, a sweat drop, steam, a "!" or "?" pop
export function notes(x, y, t0, t1, o = {}) {
  return (g, c) => {
    if (c.t < t0 || c.t > t1 + 1) return; const [px, py, Z] = c.p(x, y, o.d ?? 2), k = Math.min(2.4, Z), R = mulberry(o.seed ?? 4);
    for (let i = 0; i < (o.n ?? 6); i++) { const st = t0 + i * (o.every ?? .35), u = (c.t - st) / 1.4; if (u < 0 || u > 1 || st > t1) continue;
      const nx = px + (R() * 60 - 10 + u * 80) * k * (o.dir ?? 1), ny = py - u * 160 * k + Math.sin(u * 9 + i) * 8 * k, s = (18 + R() * 8) * k;
      g.save(); g.globalAlpha = Math.sin(u * Math.PI); g.translate(nx, ny); g.rotate(Math.sin(u * 6 + i) * .25); g.fillStyle = o.col || ['#ffd24a', '#f08cb0', '#8fd0f0', '#b0e07a'][i % 4]; g.strokeStyle = '#2a1a2e'; g.lineWidth = 2;
      g.beginPath(); g.ellipse(0, 0, s * .55, s * .42, -.4, 0, TAU); g.fill(); g.stroke(); g.fillRect(s * .4, -s * 1.6, s * .14, s * 1.6); g.strokeRect(s * .4, -s * 1.6, s * .14, s * 1.6); if (i % 2) { g.beginPath(); g.moveTo(s * .54, -s * 1.6); g.quadraticCurveTo(s * 1.1, -s * 1.2, s * .9, -s * .7); g.lineWidth = s * .14; g.strokeStyle = g.fillStyle; g.stroke(); }
      g.restore(); }
  };
}
export function zzz(x, y, t0, t1, o = {}) {
  return (g, c) => {
    if (c.t < t0 || c.t > t1) return; const [px, py, Z] = c.p(x, y, o.d ?? 2), k = Math.min(2.4, Z);
    for (let i = 0; i < 3; i++) { const u = (((c.t - t0) / 2.4 + i / 3) % 1); g.save(); g.globalAlpha = Math.sin(u * Math.PI); g.translate(px + u * 70 * k + Math.sin(u * 6) * 8 * k, py - u * 120 * k); g.rotate(-.2); paperText(g, 'z', (22 + u * 26) * k, '#eaf0ff', '#2a2a4a', .14); g.restore(); }
  };
}
export function sweat(x, y, t0, o = {}) {
  return (g, c) => {
    const u = (c.t - t0) / (o.dur ?? .9); if (u < 0 || u > 1) return; const [px, py, Z] = c.p(x, y, o.d ?? 2), k = Math.min(2.4, Z);
    g.save(); g.globalAlpha = Math.sin(u * Math.PI) ** .5; g.translate(px, py + u * 30 * k); g.scale(k, k); g.fillStyle = '#a8dcf6'; g.strokeStyle = '#2a4a6a'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -14); g.bezierCurveTo(8, -2, 9, 8, 0, 10); g.bezierCurveTo(-9, 8, -8, -2, 0, -14); g.fill(); g.stroke(); g.restore();
  };
}
export function steam(x, y, t0, t1, o = {}) {
  return (g, c) => {
    if (c.t < t0 || c.t > t1) return; const [px, py, Z] = c.p(x, y, o.d ?? 2), k = Math.min(2.4, Z);
    g.strokeStyle = 'rgba(255,250,240,.55)'; g.lineCap = 'round'; g.lineWidth = 5 * k;
    for (let i = 0; i < 3; i++) { const u = ((c.t * .5 + i / 3) % 1); g.globalAlpha = Math.sin(u * Math.PI) * .8; g.beginPath(); for (let s = 0; s <= 10; s++) { const yy = -s * 9 * k - u * 50 * k; g.lineTo(px + (i - 1) * 22 * k + Math.sin(s * .8 + c.t * 3 + i) * 7 * k, py + yy); } g.stroke(); }
    g.globalAlpha = 1;
  };
}
export function mark(ch, x, y, t0, o = {}) { return word(ch, x, y, t0, { size: 80, col: o.col || '#ffffff', hold: o.hold ?? .9, rot: o.rot ?? .08, ...o }); }
// crumbs / berries / drops flying in short arcs from a point
export function bits(x, y, t0, o = {}) {
  return (g, c) => {
    const tt = c.t - t0, dur = o.dur ?? .8; if (tt < 0 || tt > dur) return; const [px, py, Z] = c.p(x, y, o.d ?? 2), R = mulberry(o.seed ?? 11), k = Math.min(2.4, Z);
    for (let i = 0; i < (o.n ?? 10); i++) { const ang = -Math.PI / 2 + (R() - .5) * (o.spread ?? 2.2), v = (60 + R() * 120) * k, u = tt; const xx = px + Math.cos(ang) * v * u, yy = py + Math.sin(ang) * v * u + 260 * k * u * u, r = (o.r ?? 4) * k * (.6 + R() * .7);
      g.fillStyle = o.col || (R() < .5 ? '#e0b070' : '#c8904a'); g.globalAlpha = 1 - tt / dur; g.beginPath(); g.ellipse(xx, yy, r * 1.2, r, R() * 3, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
  };
}
// a label tag with an arrow pointing at (x, y): "the mill →"
export function arrowTag(txt, x, y, t0, o = {}) {
  return (g, c) => {
    if (c.t < t0) return; const [px, py, Z] = c.p(x, y, o.d ?? 2), u = back(clamp((c.t - t0) / .45), 1.4), k = Math.min(2, Z) * (o.size ?? 1), dir = o.dir ?? -1;
    g.save(); g.translate(px, py); g.scale(Math.max(.001, u) * k * -dir, k); g.rotate(o.rot ?? -.04);
    const w = 60 + txt.length * 28; g.fillStyle = '#fbf0d8'; g.shadowColor = 'rgba(30,12,4,.35)'; g.shadowBlur = 10; g.shadowOffsetY = 6;
    g.beginPath(); g.moveTo(-w, -40); g.lineTo(-70, -40); g.lineTo(-70, -58); g.lineTo(0, 0); g.lineTo(-70, 58); g.lineTo(-70, 40); g.lineTo(-w, 40); g.closePath(); g.fill(); g.shadowColor = 'transparent';
    g.save(); g.translate(-w / 2 - 30, 4); g.scale(-dir, 1); g.fillStyle = '#2a2347'; g.font = '500 52px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, 0); g.restore();
    g.restore();
  };
}
