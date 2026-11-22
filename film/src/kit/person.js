// A general jointed paper person, built from the same shapes as the approved Tom puppet (rounded shoulders, tapered
// sleeves with a soft elbow and a closed cuff, soft hands with slim rounded fingers, knee domes, soft shoes).
// Space: origin between the feet (standing) or at the seat (seated); y up is negative. The drawing faces screen right
// (a three-quarter turn, `turn` > 0); flip the layer to face left.
// Pose options (all may be numbers or functions of time): see `pose()` below.
import { paint } from '../engine.js';
import { PAL, rr, ell } from '../art.js';
import { Rig, ik } from '../puppets.js';
import { TAU, clamp, lerp, ss, mulberry } from '../lib.js';

const P = (n, sheet, parent, jx, jy, z, extra = {}) => ({ name: n, sheet, parent, jx, jy, z, ...extra });
const shade = (g, x0, x1) => { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(255,236,205,.26)'); gr.addColorStop(.45, 'rgba(255,236,205,0)'); gr.addColorStop(1, 'rgba(40,16,4,.3)'); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = gr; g.fillRect(x0, -400, x1 - x0, 800); g.restore(); };

export const LOOKS = {
  tom: { skin: PAL.skin, skinD: PAL.skinD, hair: 'tom', hairC: PAL.hair, top: PAL.tunic, topD: '#7a4f30', sleeve: '#8d5c38', cuff: '#6d4429', pants: PAL.pants, shoe: PAL.shoe, patch: true, belt: '#4a3326' },
  tomJ: { skin: PAL.skin, skinD: PAL.skinD, hair: 'tom', hairC: PAL.hair, top: '#3f6fc0', topD: '#2f55a0', sleeve: '#3866b4', cuff: '#e9e1cf', pants: '#e3d6b8', shoe: '#1e1a26', shiny: true, belt: '#d8b04a', collar: '#f4ecd8', buttons: '#e8c25a' },
  bro1: { skin: '#e0a87c', skinD: '#c98f63', hair: 'swoop', hairC: '#3a2618', top: '#4f7d52', topD: '#3a5e3e', sleeve: '#466f49', cuff: '#2f4a32', pants: '#5a4632', shoe: '#2a1e18', belt: '#2a1e18', height: 1.08, brow: '#3a2618' },
  bro2: { skin: '#eab48c', skinD: '#d39a70', hair: 'cap', hairC: '#6a4022', hatC: '#7a3a2a', top: '#b0583c', topD: '#8a4230', sleeve: '#a5523a', cuff: '#6a3020', pants: '#4a4456', shoe: '#2a2030', belt: '#3a2a20', height: 1.03 },
  king: { skin: '#f0b892', skinD: '#d89a76', hair: 'kingWhite', hairC: '#f4f0ea', top: '#6b3fa0', topD: '#523080', sleeve: '#6b3fa0', cuff: '#f6f2ea', robe: '#6b3fa0', robeTrim: '#e8b84a', fur: true, beard: true, crown: true, belly: 1.25, height: 1.04, headScale: 1.22, brow: '#f4f0ea', shoe: '#7a2a4a', eye: 'small' },
  princess: { skin: '#f3c4a2', skinD: '#dca484', hair: 'long', hairC: '#e8b850', top: '#e898b0', topD: '#cf7a96', sleeve: '#f0aec2', cuff: '#fbe6ee', robe: '#e898b0', robeTrim: '#fbe6ee', tiara: true, height: .96, lashes: true, brow: '#b88a3a', shoe: '#c86a8a', waist: .78 },
  guard: { skin: '#e2a87e', skinD: '#c98f63', hair: 'helmet', hairC: '#3a2a20', hatC: '#9aa4b4', top: '#5a6a8e', topD: '#3e4c6e', sleeve: '#4e5c80', cuff: '#2e3a56', pants: '#3a3a4a', shoe: '#2a2a32', belt: '#c8a040', tabard: '#c8a040' },
  servant: { skin: '#e8b08a', skinD: '#cf9670', hair: 'short', hairC: '#2a2020', top: '#a83a3a', topD: '#842a2a', sleeve: '#a03838', cuff: '#f0e6d4', pants: '#f0e6d4', shoe: '#2a2020', belt: '#e0b84a', buttons: '#e0b84a' },
  crier: { skin: '#eab08a', skinD: '#d29670', hair: 'tricorn', hairC: '#c8c0b8', hatC: '#2a2430', top: '#b8402e', topD: '#902e20', sleeve: '#b03c2c', cuff: '#f0d890', pants: '#2e2a3a', shoe: '#1e1a24', belt: '#2a2020', buttons: '#f0c84a', belly: 1.12 },
  baker: { skin: '#f0bc96', skinD: '#d8a07a', hair: 'chef', hairC: '#6a4a30', hatC: '#fbf6ee', top: '#f6f0e6', topD: '#ddd4c4', sleeve: '#f2ece2', cuff: '#ddd4c4', pants: '#5a5060', shoe: '#2a2228', belt: '#e8ddc8', apron: '#fbf8f2', belly: 1.18, mustache: true },
  farmer1: { skin: '#d89a6c', skinD: '#bf8254', hair: 'straw', hairC: '#6a4428', hatC: '#e6c46a', top: '#e8d2a0', topD: '#cdb682', sleeve: '#e2cc9a', cuff: '#cdb682', pants: '#5a7aa8', shoe: '#3a2a20', belt: '#5a7aa8', overalls: '#5a7aa8' },
  farmer2: { skin: '#e8b48e', skinD: '#cf9a74', hair: 'straw', hairC: '#a86a3a', hatC: '#d8b45a', top: '#c86a5a', topD: '#a85a4a', sleeve: '#c26658', cuff: '#a85a4a', pants: '#6a8a5a', shoe: '#3a2a20', belt: '#6a8a5a', overalls: '#6a8a5a', height: .95 },
  shepherd: { skin: '#e4aa80', skinD: '#ca9066', hair: 'cap', hairC: '#3a2a20', hatC: '#6a7a4a', top: '#8a6a4a', topD: '#6a5038', sleeve: '#e6dcc6', cuff: '#cfc4ac', pants: '#4a4a3a', shoe: '#2a2018', belt: '#3a2a1e', vest: '#7a5a3a', height: 1.02 },
  picker: { skin: '#f0bc94', skinD: '#d6a07a', hair: 'kerchief', hairC: '#8a4a2a', hatC: '#d85a5a', top: '#6a9a5a', topD: '#527e46', sleeve: '#f0e8d6', cuff: '#d6ccb8', robe: '#6a9a5a', robeTrim: '#f0e8d6', apron: '#f4eee0', lashes: true, height: .95, shoe: '#4a3020', waist: .9 },
  ogre: { skin: '#a8b888', skinD: '#8a9c6c', hair: 'ogre', hairC: '#4a3a2a', top: '#8a6a4e', topD: '#6e5038', sleeve: '#7e6046', cuff: '#5a4030', pants: '#5a4a5a', shoe: '#f4a8c8', slippers: true, belt: '#3a2a20', belly: 1.45, height: 1.0, headScale: 1.1, nose: 'big', eye: 'small', brow: '#4a3a2a', teeth: true },
  vill1: { skin: '#e6b08a', skinD: '#cc9670', hair: 'short', hairC: '#5a3a22', top: '#7a8ab8', topD: '#5e6c96', sleeve: '#7484b0', cuff: '#5e6c96', pants: '#4a3e36', shoe: '#2a2020', belt: '#3a2a20' },
  vill2: { skin: '#f0c09a', skinD: '#d6a47e', hair: 'bun', hairC: '#7a4a2a', top: '#d89a5a', topD: '#b87e46', sleeve: '#f0e2c8', cuff: '#d6c8ae', robe: '#c86a6a', robeTrim: '#f0e2c8', apron: '#f4ecdc', lashes: true, height: .94 },
  vill3: { skin: '#c88c62', skinD: '#ae744c', hair: 'curly', hairC: '#2a1e18', top: '#6a9a8a', topD: '#527e70', sleeve: '#649282', cuff: '#527e70', pants: '#3e3a4a', shoe: '#221c22', belt: '#3a2a20', height: 1.03 },
  vill4: { skin: '#f2c8a6', skinD: '#d8ac88', hair: 'long', hairC: '#3a2a22', top: '#9a6aa8', topD: '#7e5290', sleeve: '#f0e6dc', cuff: '#d8ccc0', robe: '#9a6aa8', robeTrim: '#f0e6dc', lashes: true, height: .93 },
};

// ---------- hands: drawn pointing down (+y) from the wrist at (0,0), seen from the back; thumb toward +x ----------
function handSheet(kind, SK, SKD, res) {
  return paint(90, 110, g => {
    const finger = (x, y, a, L, w) => { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(-w / 2, 0); g.bezierCurveTo(-w / 2 - .3, L * .5, -w * .46, L * .8, -w * .38, L - 2.4); g.bezierCurveTo(-w * .28, L + 1.4, w * .28, L + 1.4, w * .38, L - 2.4); g.bezierCurveTo(w * .46, L * .8, w / 2 + .3, L * .5, w / 2, 0); g.closePath(); g.fill(); g.restore(); };
    const nail = (x, y, a, L, w) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#f6d8c0'; g.beginPath(); g.moveTo(-w * .26, L - 6); g.bezierCurveTo(-w * .3, L - 2, w * .3, L - 2, w * .26, L - 6); g.bezierCurveTo(w * .2, L - 7.5, -w * .2, L - 7.5, -w * .26, L - 6); g.fill(); g.restore(); };
    const palm = (h = 24) => { g.beginPath(); g.moveTo(-10, -2); g.bezierCurveTo(-13, 6, -14, h - 6, -12, h); g.lineTo(12, h); g.bezierCurveTo(14, h - 8, 13, 6, 10, -2); g.closePath(); g.fill(); };
    g.fillStyle = SK;
    if (kind === 'rest') {   // relaxed: four slim fingers together, gently curved, the thumb at the side
      palm(22); const F = [[-8.4, 20, .08, 17, 6], [-2.8, 21, .03, 20, 6.2], [2.8, 21, -.02, 19, 6.1], [8, 20, -.08, 15.5, 5.6]];
      for (const f of F) finger(...f); finger(11, 6, -.62, 15, 6.4);
      g.strokeStyle = 'rgba(150,80,50,.5)'; g.lineWidth = .9; for (const x of [-5.6, 0, 5.4]) { g.beginPath(); g.moveTo(x, 23); g.lineTo(x * 1.05, 36); g.stroke(); }
      for (const f of F) nail(...f);
    } else if (kind === 'open') {   // open, fingers a little spread (a gesture or a wave)
      palm(22); const F = [[-9, 19, .3, 17, 6], [-3, 21, .1, 20, 6.2], [3, 21, -.06, 19, 6.1], [8.5, 19, -.24, 15.5, 5.6]];
      for (const f of F) finger(...f); finger(12, 5, -.95, 16, 6.6); for (const f of F) nail(...f);
    } else if (kind === 'point') {  // the index points along the hand; the other fingers curl in
      palm(22); finger(-4, 20, .02, 24, 6.4); nail(-4, 20, .02, 24, 6.4);
      g.beginPath(); g.moveTo(-1, 18); g.bezierCurveTo(0, 30, 13, 31, 13, 20); g.lineTo(13, 14); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(150,80,50,.5)'; g.lineWidth = .9; g.beginPath(); g.moveTo(2, 24); g.quadraticCurveTo(7, 28, 12, 24); g.stroke();
      finger(11, 6, -.5, 13, 6.2);
    } else if (kind === 'fist' || kind === 'hold') {   // fingers curled round (holding something)
      palm(20); g.beginPath(); g.moveTo(-12, 16); g.bezierCurveTo(-14, 34, 12, 36, 13, 18); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(150,80,50,.55)'; g.lineWidth = .9; for (const x of [-6, 0, 6]) { g.beginPath(); g.moveTo(x, 24); g.quadraticCurveTo(x + 1, 30, x, 32); g.stroke(); }
      finger(9, 8, -.25, 15, 6.4);
    }
  }, { res, ax: 45, ay: 20, fin: { rim: .4, under: .25, side: .1 } });
}

// ---------- the face, drawn every frame (head space, origin at the neck pivot) ----------
export function faceHook(L) {
  const SK = L.skin, SKD = L.skinD, BR = L.brow || L.hairC || PAL.hair, small = L.eye === 'small';
  return (g, p) => {
    const s = p.face || {}, th = clamp(s.turn ?? .45, -1, 1), sh2 = th * 18, blink = s.blink ?? 0, lx = (s.lookX ?? .5) * 7, ly = (s.lookY ?? 0) * 8;
    const dn = clamp((s.lookY || 0) - .4, 0, .6) * 16; g.save(); g.translate(0, dn);
    if (L.hair !== 'helmet' && L.hair !== 'long' && L.hair !== 'kerchief') {   // ears
      g.fillStyle = SK; const nearX = th >= 0 ? -64 + th * 16 : 64 + th * 16, farX = th >= 0 ? 64 + th * 40 : -64 + th * 40;
      if (Math.abs(th) < .35) { ell(g, farX, -62, 14, 18); g.fill(); }
      ell(g, nearX, -62, L.hair === 'ogre' ? 22 : 15, L.hair === 'ogre' ? 24 : 18); g.fill(); g.strokeStyle = SKD; g.lineWidth = 1.6; g.beginPath(); g.arc(nearX + (th >= 0 ? 2 : -2), -62, 7, -1.2, 1.2); g.stroke();
    }
    const bl = s.blush ?? .18; g.fillStyle = `rgba(240,120,110,${bl})`; ell(g, -40 + sh2 * 1.1, -56, 14 * (1 - .3 * Math.max(0, th)), 8); g.fill(); ell(g, 40 + sh2 * .7, -56, 14 * (1 - .3 * Math.max(0, -th)), 8); g.fill();
    const eyes = s.eyes || 'open';
    for (const sx of [-1, 1]) {
      const far = sx * th > 0, ew = far ? 1 - .28 * Math.abs(th) : 1, ex = sx * 24 * (far ? 1 - .2 * Math.abs(th) : 1) + sh2 + lx, ey = -82 + ly;
      const wink = (eyes === 'winkL' && sx < 0) || (eyes === 'winkR' && sx > 0);
      g.fillStyle = PAL.ink; g.strokeStyle = PAL.ink; g.lineCap = 'round';
      if (eyes === 'happy' || wink) { g.lineWidth = 3.6; g.beginPath(); g.moveTo(ex - 9 * ew, ey + 3); g.quadraticCurveTo(ex, ey - 7, ex + 9 * ew, ey + 3); g.stroke(); }
      else if (blink > .85) { g.lineWidth = 3.4; g.beginPath(); g.moveTo(ex - 9 * ew, ey); g.quadraticCurveTo(ex, ey + 4, ex + 9 * ew, ey); g.stroke(); }
      else {
        const wide = (s.wide || 0) + (eyes === 'wide' ? 1 : 0), sz = small ? .72 : 1;
        g.save(); g.translate(ex, ey); g.scale(ew * sz * (1 + wide * .12), sz * (1 - blink * .9 + wide * .22));
        if (wide > .3) { g.fillStyle = '#fffbf0'; ell(g, 0, 0, 12, 14); g.fill(); g.fillStyle = PAL.ink; ell(g, lx * .3, ly * .3, 5.5, 7); g.fill(); }
        else { ell(g, 0, 0, 8.5, 11); g.fill(); g.fillStyle = '#fff'; ell(g, -2.6 + lx * .25, -3.6 + ly * .25, 3, 3.6); g.fill(); }
        const lid = eyes === 'half' ? .5 : clamp((s.lookY || 0) - .5, 0, .5) * .25 + (s.lid || 0);
        if (lid > 0) { g.fillStyle = SK; g.beginPath(); g.moveTo(-13, -15); g.lineTo(13, -15); g.lineTo(13, -13 + 26 * lid); g.quadraticCurveTo(0, -10 + 26 * lid, -13, -13 + 26 * lid); g.closePath(); g.fill(); g.strokeStyle = PAL.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(-10, -13 + 26 * lid); g.quadraticCurveTo(0, -10 + 26 * lid, 10, -13 + 26 * lid); g.stroke(); }
        if (L.lashes) { g.strokeStyle = PAL.ink; g.lineWidth = 2; for (const k of [-1, 0, 1]) { g.beginPath(); g.moveTo(sx * 5 + k * 3, -10); g.lineTo(sx * 8 + k * 4.5, -15); g.stroke(); } }
        g.restore();
      }
      const br = (s.brow ?? 0) * 7 + (sx > 0 ? (s.browR || 0) : (s.browL || 0)) * 7, tilt = (s.browTilt || 0) * 8, bx = sx * 24 * (far ? 1 - .2 * Math.abs(th) : 1) + sh2;
      g.strokeStyle = BR; g.lineWidth = L.hair === 'kingWhite' ? 7 : 4.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx - sx * 11 * ew, -106 - br + tilt * .5); g.lineTo(bx + sx * 12 * ew, -106 - br - tilt * .5); g.stroke();
    }
    const nx = sh2 * 1.3;
    if (L.nose === 'big') { g.fillStyle = SKD; ell(g, nx + 6, -60, 17, 14); g.fill(); g.fillStyle = 'rgba(255,240,220,.35)'; ell(g, nx + 1, -65, 5, 4); g.fill(); }
    else { g.strokeStyle = SKD; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(nx - 3 + th * 4, -68); g.quadraticCurveTo(nx + 3 + th * 6, -60, nx - 2, -58); g.stroke(); }
    // mouth: closed, smile, grin, talk (open amount), o, wobbly, smirk, flat; `talk` > 0 opens it in time with the words
    let m = s.mouth || 'closed'; const o = clamp(s.talk ?? 0, 0, 1), mx = sh2 * 1.05, my = -44;
    if (o > .06 && m !== 'o') m = 'talk';
    g.strokeStyle = '#7b3b34'; g.lineWidth = 3.4; g.lineCap = 'round';
    if (m === 'closed') { g.beginPath(); g.moveTo(mx - 9, my); g.quadraticCurveTo(mx, my + 3, mx + 9, my); g.stroke(); }
    else if (m === 'flat') { g.beginPath(); g.moveTo(mx - 8, my); g.lineTo(mx + 8, my); g.stroke(); }
    else if (m === 'smile') { const k = s.smile ?? 1; g.beginPath(); g.moveTo(mx - 9 - 4 * k, my - 3 * k); g.quadraticCurveTo(mx, my + 3 + 7 * k, mx + 9 + 4 * k, my - 3 * k); g.stroke(); }
    else if (m === 'smirk') { g.beginPath(); g.moveTo(mx - 9, my + 1); g.quadraticCurveTo(mx + 2, my + 4, mx + 12, my - 5); g.stroke(); }
    else if (m === 'wobbly') { const w = s.wob ?? 0; g.beginPath(); g.moveTo(mx - 12, my + 2); g.bezierCurveTo(mx - 6, my - 3 - w, mx - 2, my + 6 + w, mx + 3, my); g.bezierCurveTo(mx + 7, my - 4 + w, mx + 10, my + 2, mx + 13, my + 1); g.stroke(); }
    else if (m === 'grin') { g.fillStyle = '#7b3b34'; g.beginPath(); g.moveTo(mx - 15, my - 4); g.quadraticCurveTo(mx, my - 1, mx + 15, my - 4); g.quadraticCurveTo(mx, my + 20, mx - 15, my - 4); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(mx - 12, my - 3); g.quadraticCurveTo(mx, my, mx + 12, my - 3); g.lineTo(mx + 10, my + 2); g.quadraticCurveTo(mx, my + 4, mx - 10, my + 2); g.fill(); }
    else if (m === 'o') { g.fillStyle = '#7b3b34'; ell(g, mx, my + 2, 7, 6 + 4 * Math.max(o, .6)); g.fill(); }
    else { const h = 2 + o * 11, w = 9 + o * 3; g.fillStyle = '#7b3b34'; g.beginPath(); g.moveTo(mx - w, my); g.quadraticCurveTo(mx, my - 2, mx + w, my); g.quadraticCurveTo(mx + w * .7, my + h, mx, my + h); g.quadraticCurveTo(mx - w * .7, my + h, mx - w, my); g.fill(); if (o > .45) { g.fillStyle = '#e07a7a'; ell(g, mx, my + h * .72, w * .5, h * .22); g.fill(); } }
    if (L.teeth) { g.fillStyle = '#fbf6e8'; for (const dx of [-8, 8]) { g.beginPath(); g.moveTo(mx + dx - 3, my + 1); g.lineTo(mx + dx, my - 7); g.lineTo(mx + dx + 3, my + 1); g.closePath(); g.fill(); } }
    if (L.mustache) { g.fillStyle = L.hairC; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(mx, -53); g.bezierCurveTo(mx + sx * 10, -58, mx + sx * 22, -54, mx + sx * 24, -46); g.bezierCurveTo(mx + sx * 16, -50, mx + sx * 8, -48, mx, -50); g.fill(); } }
    g.restore();
  };
}

// ---------- hair, hats and crowns (head space) ----------
function hairSheet(L, res) {
  const C = L.hairC, H = L.hair;
  return paint(220, 200, g => {
    g.fillStyle = C;
    const cap = () => { g.beginPath(); g.moveTo(-72, 2); g.bezierCurveTo(-84, -70, -30, -80, 8, -70); g.bezierCurveTo(52, -80, 84, -56, 72, 2); g.bezierCurveTo(54, -32, 30, -38, 4, -32); g.bezierCurveTo(-22, -28, -52, -20, -72, 2); g.closePath(); g.fill(); };
    if (H === 'tom' || H === 'short') cap();
    else if (H === 'swoop') { cap(); g.beginPath(); g.moveTo(-20, -60); g.bezierCurveTo(10, -98, 70, -86, 80, -40); g.bezierCurveTo(50, -66, 10, -60, -20, -50); g.closePath(); g.fill(); }
    else if (H === 'curly') { for (let i = 0; i < 11; i++) { const a = Math.PI + i / 10 * Math.PI; ell(g, Math.cos(a) * 64, -6 + Math.sin(a) * 58, 20, 18); g.fill(); } }
    else if (H === 'kingWhite') { for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 56, -40); g.bezierCurveTo(sx * 84, -30, sx * 84, 20, sx * 66, 40); g.bezierCurveTo(sx * 60, 10, sx * 54, -10, sx * 44, -20); g.closePath(); g.fill(); } }
    else if (H === 'ogre') { g.beginPath(); g.moveTo(-10, -60); g.bezierCurveTo(-20, -96, 14, -100, 6, -70); g.bezierCurveTo(24, -96, 40, -80, 18, -62); g.closePath(); g.fill(); }
    else if (H === 'bun') { cap(); ell(g, 6, -78, 30, 24); g.fill(); }
    else if (H === 'long') { g.beginPath(); g.moveTo(-74, 10); g.bezierCurveTo(-86, -74, -20, -86, 8, -74); g.bezierCurveTo(50, -84, 88, -60, 74, 10); g.bezierCurveTo(60, -34, 40, -44, 0, -40); g.bezierCurveTo(-40, -46, -60, -30, -74, 10); g.closePath(); g.fill(); }
    else if (H === 'straw' || H === 'cap' || H === 'tricorn' || H === 'chef' || H === 'helmet' || H === 'kerchief') { cap(); }
  }, { res, ax: 110, ay: 120, fin: { rim: .5, under: .3 } });
}
function hairBackSheet(L, res) {   // long hair behind the head and shoulders
  return paint(240, 340, g => { g.fillStyle = L.hairC; g.beginPath(); g.moveTo(-74, -80); g.bezierCurveTo(-96, 20, -104, 140, -70, 190); g.bezierCurveTo(-30, 210, 30, 210, 70, 190); g.bezierCurveTo(104, 140, 96, 20, 74, -80); g.closePath(); g.fill(); }, { res, ax: 120, ay: 120, fin: { rim: .4, under: .3 } });
}
function hatSheet(L, res) {
  const H = L.hair, C = L.hatC || '#555';
  return paint(260, 240, g => {
    g.fillStyle = C;
    if (H === 'cap') { g.beginPath(); g.moveTo(-70, 0); g.bezierCurveTo(-74, -60, 60, -70, 72, 0); g.closePath(); g.fill(); g.beginPath(); g.moveTo(40, -4); g.bezierCurveTo(70, -8, 100, -2, 104, 6); g.bezierCurveTo(80, 8, 56, 6, 40, 4); g.fill(); }
    else if (H === 'straw') { g.beginPath(); g.ellipse(0, 0, 118, 22, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-60, -2); g.bezierCurveTo(-62, -64, 62, -64, 60, -2); g.closePath(); g.fill(); g.fillStyle = '#b84a3a'; g.fillRect(-60, -18, 120, 12); g.strokeStyle = 'rgba(120,80,20,.4)'; g.lineWidth = 2; for (let x = -100; x < 100; x += 12) { g.beginPath(); g.moveTo(x, -10); g.lineTo(x + 6, 12); g.stroke(); } }
    else if (H === 'tricorn') { g.beginPath(); g.moveTo(-92, 4); g.bezierCurveTo(-60, -20, -50, -64, 0, -60); g.bezierCurveTo(50, -64, 60, -20, 92, 4); g.bezierCurveTo(40, -6, -40, -6, -92, 4); g.closePath(); g.fill(); g.fillStyle = '#e8c25a'; g.fillRect(-58, -10, 116, 5); }
    else if (H === 'chef') { g.beginPath(); g.moveTo(-58, 4); g.lineTo(-56, -40); g.bezierCurveTo(-90, -70, -60, -130, -20, -112); g.bezierCurveTo(-10, -150, 40, -150, 46, -112); g.bezierCurveTo(90, -126, 96, -60, 56, -40); g.lineTo(58, 4); g.closePath(); g.fill(); g.fillStyle = 'rgba(160,150,140,.35)'; g.fillRect(-58, -14, 116, 6); }
    else if (H === 'helmet') { g.beginPath(); g.moveTo(-76, 10); g.bezierCurveTo(-82, -80, 82, -80, 76, 10); g.closePath(); g.fill(); g.fillStyle = '#7a8494'; g.fillRect(-78, 0, 156, 12); g.fillStyle = '#c84a4a'; g.beginPath(); g.moveTo(-6, -58); g.bezierCurveTo(-30, -110, 40, -120, 30, -64); g.closePath(); g.fill(); }
    else if (H === 'kerchief') { g.beginPath(); g.moveTo(-76, 8); g.bezierCurveTo(-82, -76, 82, -76, 76, 8); g.bezierCurveTo(40, -16, -40, -16, -76, 8); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,240,220,.7)'; for (let i = 0; i < 9; i++) { ell(g, -50 + (i % 3) * 50 + (i / 3 | 0) * 8, -44 + (i / 3 | 0) * 16, 4, 4); g.fill(); } }
  }, { res, ax: 130, ay: 160, fin: { rim: .5, under: .3 } });
}
function crownSheet(res, tiara) {   // the king's crown is TINY on his big head
  return paint(80, 60, g => {
    g.fillStyle = '#e8b84a'; g.beginPath();
    if (tiara) { g.moveTo(-22, 6); g.bezierCurveTo(-18, -6, -8, -12, 0, -16); g.bezierCurveTo(8, -12, 18, -6, 22, 6); g.bezierCurveTo(10, 0, -10, 0, -22, 6); g.fill(); g.fillStyle = '#e86a8a'; ell(g, 0, -6, 3.5, 3.5); g.fill(); return; }
    g.moveTo(-14, 8); g.lineTo(-15, -6); g.lineTo(-8, 0); g.lineTo(-3, -12); g.lineTo(3, -12); g.lineTo(8, 0); g.lineTo(15, -6); g.lineTo(14, 8); g.closePath(); g.fill();
    g.fillStyle = '#d84a5a'; ell(g, 0, 2, 3, 3); g.fill(); g.fillStyle = '#fff4d0'; for (const x of [-15, 0, 15]) { ell(g, x, x ? -7 : -13, 2, 2); g.fill(); }
  }, { res: res * 1.5, ax: 40, ay: 40, fin: { rim: .6, under: .3 } });
}
function beardSheet(res) {   // a long white beard from below the mouth to the belly; a mustache above the mouth corners
  return paint(200, 300, g => {
    g.fillStyle = '#f6f2ea'; g.beginPath(); g.moveTo(-58, -48); g.bezierCurveTo(-70, -10, -60, 60, -30, 130); g.bezierCurveTo(-16, 170, 0, 200, 8, 210); g.bezierCurveTo(16, 180, 30, 150, 44, 120); g.bezierCurveTo(66, 60, 70, -10, 58, -48);
    g.bezierCurveTo(40, -30, 20, -28, 16, -30); g.quadraticCurveTo(0, -18, -16, -30); g.bezierCurveTo(-20, -28, -40, -30, -58, -48); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(160,150,140,.45)'; g.lineWidth = 2; for (const x of [-34, -14, 6, 24]) { g.beginPath(); g.moveTo(x, -10); g.bezierCurveTo(x - 4, 40, x + 2, 100, x * .3 + 4, 170); g.stroke(); }
  }, { res, ax: 100, ay: 60, fin: { rim: .5, under: .25 } });
}
function mustacheKing(res) { return paint(120, 40, g => { g.fillStyle = '#f6f2ea'; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(0, -6); g.bezierCurveTo(sx * 14, -12, sx * 34, -8, sx * 40, 4); g.bezierCurveTo(sx * 26, -2, sx * 12, 0, 0, 0); g.fill(); } }, { res, ax: 60, ay: 20, fin: { rim: .5, under: .25 } }); }

// ---------- the person ----------
export function makePerson(L, { res = 2, turn = .45, seated = false } = {}) {
  L = typeof L === 'string' ? { ...LOOKS[L], key: L } : L;
  const R = Math.max(2, res), HR = R + 1, SK = L.skin, SKD = L.skinD, tb = turn, bel = L.belly || 1, wa = L.waist || 1;
  const sh = (w, h, ax, ay, fn, rr = R, fin) => paint(w, h, fn, { ax, ay, res: rr, fin });
  const torso = sh(320, 260, 160, 190, g => {
    const k = bel, top = L.top;
    g.fillStyle = top; g.beginPath(); g.moveTo(-26, -140); g.bezierCurveTo(-50, -141, -74, -134, -80, -114); g.bezierCurveTo(-86, -94, -80 * Math.max(wa, k * .95), -60, -74 * Math.max(wa, k), -36); g.bezierCurveTo(-79 * k, -18, -88 * k, -2, -82 * k, 6);
    g.bezierCurveTo(-40 * k, 17, 40 * k, 17, 82 * k, 6); g.bezierCurveTo(88 * k, -2, 79 * k, -18, 74 * Math.max(wa, k), -36); g.bezierCurveTo(80 * Math.max(wa, k * .95), -60, 86, -94, 80, -114); g.bezierCurveTo(74, -134, 50, -141, 26, -140); g.closePath(); g.fill();
    if (L.overalls) { g.fillStyle = L.overalls; g.beginPath(); g.moveTo(-50, -84); g.lineTo(50, -84); g.lineTo(70, 8); g.bezierCurveTo(30, 16, -30, 16, -70, 8); g.closePath(); g.fill(); g.fillRect(-46, -136, 12, 54); g.fillRect(34, -136, 12, 54); g.fillStyle = '#e8c25a'; ell(g, -40, -86, 5, 5); g.fill(); ell(g, 40, -86, 5, 5); g.fill(); }
    if (L.vest) { g.fillStyle = L.vest; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 24, -136); g.bezierCurveTo(sx * 60, -134, sx * 82, -110, sx * 80, -60); g.bezierCurveTo(sx * 82, -20, sx * 84, 0, sx * 80, 6); g.lineTo(sx * 30, 12); g.bezierCurveTo(sx * 40, -40, sx * 30, -100, sx * 24, -136); g.closePath(); g.fill(); } }
    if (L.tabard) { g.fillStyle = L.tabard; g.beginPath(); g.moveTo(-40, -132); g.lineTo(40, -132); g.lineTo(46, 14); g.lineTo(-46, 14); g.closePath(); g.fill(); g.fillStyle = '#5a6a8e'; g.beginPath(); g.moveTo(0, -96); g.lineTo(16, -70); g.lineTo(0, -44); g.lineTo(-16, -70); g.closePath(); g.fill(); }
    if (L.apron) { g.fillStyle = L.apron; g.beginPath(); g.moveTo(-50 * k, -70); g.lineTo(50 * k, -70); g.bezierCurveTo(60 * k, -30, 64 * k, 0, 62 * k, 14); g.lineTo(-62 * k, 14); g.bezierCurveTo(-64 * k, 0, -60 * k, -30, -50 * k, -70); g.closePath(); g.fill(); }
    g.fillStyle = L.topD; g.beginPath(); g.moveTo(-70, -126); g.quadraticCurveTo(0, -116, 70, -126); g.lineTo(44, -100); g.quadraticCurveTo(0, -88, -44, -100); g.closePath(); g.fill();
    if (L.collar) { g.fillStyle = L.collar; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(0, -112); g.lineTo(sx * 30, -136); g.lineTo(sx * 40, -114); g.closePath(); g.fill(); } }
    if (L.fur) { g.fillStyle = '#f8f4ec'; g.beginPath(); g.moveTo(-82, -118); g.bezierCurveTo(-60, -150, 60, -150, 82, -118); g.bezierCurveTo(60, -96, -60, -96, -82, -118); g.fill(); g.fillStyle = '#2a2430'; for (let i = 0; i < 7; i++) { ell(g, -54 + i * 18, -118 + (i % 2) * 6, 2.5, 4); g.fill(); } }
    g.fillStyle = SK; g.beginPath(); g.moveTo(-24, -132); g.quadraticCurveTo(0, -112, 24, -132); g.lineTo(20, -140); g.lineTo(-20, -140); g.closePath(); g.fill();
    const ao = g.createRadialGradient(4, -128, 0, 4, -128, 46); ao.addColorStop(0, 'rgba(40,16,4,.45)'); ao.addColorStop(1, 'rgba(40,16,4,0)'); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = ao; g.fillRect(-60, -150, 120, 70); g.restore();
    if (L.buttons) { g.fillStyle = L.buttons; for (const y of [-90, -66, -42]) { ell(g, 6, y, 4.5, 4.5); g.fill(); } }
    if (!L.robe) { g.fillStyle = L.belt || '#3a2a20'; g.beginPath(); g.moveTo(-77 * k, -30); g.quadraticCurveTo(0, -24, 77 * k, -30); g.quadraticCurveTo(80 * k, -21, 78 * k, -12); g.quadraticCurveTo(0, -6, -78 * k, -12); g.quadraticCurveTo(-80 * k, -21, -77 * k, -30); g.closePath(); g.fill(); }
    else if (L.robeTrim) { g.fillStyle = L.robeTrim; g.beginPath(); g.moveTo(-74 * wa, -40); g.quadraticCurveTo(0, -32, 74 * wa, -40); g.lineTo(74 * wa, -30); g.quadraticCurveTo(0, -22, -74 * wa, -30); g.closePath(); g.fill(); }
    shade(g, -90 * k, 90 * k);
  });
  const neckHead = sh(220, 210, 110, 170, g => { const ng = g.createLinearGradient(0, -34, 0, 8); ng.addColorStop(0, SKD); ng.addColorStop(1, SK); g.fillStyle = ng; rr(g, -22, -34, 44, 44, 14); g.fill(); g.fillStyle = SK; ell(g, 0, -80, 68, 66); g.fill(); });
  const hair = hairSheet(L, R), hat = ['cap', 'straw', 'tricorn', 'chef', 'helmet', 'kerchief'].includes(L.hair) ? hatSheet(L, R) : null;
  const tuft = L.hair === 'tom' ? sh(60, 60, 16, 50, g => { g.fillStyle = L.hairC; g.beginPath(); g.moveTo(-8, 4); g.bezierCurveTo(-16, -22, 18, -28, 20, -8); g.bezierCurveTo(8, -14, 0, -6, 2, 6); g.closePath(); g.fill(); }) : null;
  const upper = sh(60, 100, 30, 16, g => { g.fillStyle = L.sleeve; g.beginPath(); g.moveTo(-17, 0); g.bezierCurveTo(-17, -15, 17, -15, 17, 0); g.bezierCurveTo(17, 22, 15, 44, 13, 58); g.bezierCurveTo(12, 70, -12, 70, -13, 58); g.bezierCurveTo(-15, 44, -17, 22, -17, 0); g.closePath(); g.fill(); shade(g, -18, 18);
    g.strokeStyle = 'rgba(70,40,18,.3)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-8, 52); g.quadraticCurveTo(-2, 56, 6, 53); g.stroke(); });
  const fore = sh(50, 80, 25, 14, g => {
    g.fillStyle = SK; g.beginPath(); g.moveTo(-7, 38); g.bezierCurveTo(-7, 44, -6.5, 49, -5, 52); g.quadraticCurveTo(0, 55, 5, 52); g.bezierCurveTo(6.5, 49, 7, 44, 7, 38); g.closePath(); g.fill();
    g.fillStyle = L.sleeve; g.beginPath(); g.moveTo(-12.5, -4); g.bezierCurveTo(-12, -13, 12, -13, 12.5, -4); g.bezierCurveTo(13, 10, 11, 24, 10, 36); g.lineTo(-10, 36); g.bezierCurveTo(-11, 24, -13, 10, -12.5, -4); g.closePath(); g.fill(); shade(g, -13, 13);
    g.fillStyle = L.cuff; g.beginPath(); g.moveTo(-11, 34); g.bezierCurveTo(-11.5, 30, 11.5, 30, 11, 34); g.bezierCurveTo(12, 39, 10.5, 43, 8.5, 44.5); g.bezierCurveTo(3, 46.5, -3, 46.5, -8.5, 44.5); g.bezierCurveTo(-10.5, 43, -12, 39, -11, 34); g.closePath(); g.fill();
  });
  const HANDS = {}; for (const k of ['rest', 'open', 'point', 'fist', 'hold']) HANDS[k] = handSheet(k, SK, SKD, HR);
  // legs
  const pantsC = L.pants || L.robe || '#444', shoeC = L.shoe || '#2a2228';
  const shoe = (g, y) => {
    if (L.slippers) { g.fillStyle = '#f4a8c8'; g.beginPath(); g.moveTo(-24, y - 6); g.bezierCurveTo(-34, y + 2, -30, y + 18, -14, y + 20); g.bezierCurveTo(10, y + 22, 40, y + 20, 44, y + 10); g.bezierCurveTo(46, y - 2, 30, y - 8, 14, y - 8); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,230,240,.9)'; for (let i = 0; i < 9; i++) { ell(g, -20 + i * 7, y - 6 + (i % 2) * 3, 6, 5); g.fill(); } return; }
    g.fillStyle = shoeC; g.beginPath(); g.moveTo(-14, y - 4); g.bezierCurveTo(-22, y, -24, y + 12, -14, y + 15); g.bezierCurveTo(4, y + 18, 28, y + 17, 32, y + 10); g.bezierCurveTo(34, y + 2, 22, y - 4, 12, y - 4); g.closePath(); g.fill();
    if (L.shiny) { g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(18, y + 4, 7, 2.4, -.2, 0, TAU); g.fill(); }
  };
  const thigh = sh(70, 110, 35, 14, g => { g.fillStyle = pantsC; g.beginPath(); g.moveTo(-21, -4); g.bezierCurveTo(-21, -14, 21, -14, 21, -4); g.bezierCurveTo(21, 26, 18, 54, 16, 68); g.bezierCurveTo(14, 82, -14, 82, -16, 68); g.bezierCurveTo(-18, 54, -21, 26, -21, -4); g.closePath(); g.fill(); shade(g, -22, 22);
    if (L.patch) { g.save(); g.translate(2, 50); g.rotate(-.2); g.fillStyle = '#5c4b72'; g.beginPath(); g.moveTo(-10, -8); g.bezierCurveTo(-3, -13, 8, -12, 10, -7); g.bezierCurveTo(13, -1, 11, 7, 8, 9); g.bezierCurveTo(1, 12, -8, 11, -10, 6); g.bezierCurveTo(-13, 1, -12, -4, -10, -8); g.closePath(); g.fill(); g.restore(); } });
  const shin = sh(90, 110, 35, 10, g => { g.fillStyle = pantsC; g.beginPath(); g.moveTo(-15, -2); g.bezierCurveTo(-15, -12, 15, -12, 15, -2); g.bezierCurveTo(15, 22, 13, 46, 12, 64); g.lineTo(-12, 64); g.bezierCurveTo(-13, 46, -15, 22, -15, -2); g.closePath(); g.fill(); shade(g, -16, 16); shoe(g, 66); });
  const seatLeg = sh(130, 200, 65, 60, g => {   // seated: the knee dome toward us and the tapering shin (as Tom on the steps)
    g.fillStyle = pantsC; g.beginPath(); g.moveTo(-14, 92); g.bezierCurveTo(-17, 62, -24, 34, -27, 10); g.bezierCurveTo(-30, -8, -18, -24, 0, -24); g.bezierCurveTo(18, -24, 30, -10, 27, 8); g.bezierCurveTo(24, 32, 17, 62, 14, 92); g.closePath(); g.fill();
    g.fillStyle = 'rgba(30,20,50,.18)'; g.beginPath(); g.moveTo(-24, 14); g.quadraticCurveTo(0, 22, 24, 12); g.quadraticCurveTo(0, 30, -24, 14); g.fill();
    g.save(); g.translate(0, 0); shoe(g, 98); g.restore();
  });
  const robeH = seated ? 120 : 160;
  const robe = L.robe ? sh(260, 220, 130, 20, g => { const k = bel, w0 = 76 * Math.max(wa, k * .98); g.fillStyle = L.robe; g.beginPath(); g.moveTo(-w0, -30); g.bezierCurveTo(-w0 - 10, 40, -w0 - 26, 110, -w0 - 34, robeH); g.bezierCurveTo(-30, robeH + 10, 30, robeH + 10, w0 + 34, robeH); g.bezierCurveTo(w0 + 26, 110, w0 + 10, 40, w0, -30); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(40,10,30,.18)'; g.lineWidth = 3; for (const x of [-40, 0, 40]) { g.beginPath(); g.moveTo(x * .6, -10); g.quadraticCurveTo(x * .9, 60, x * 1.2, robeH); g.stroke(); }
    if (L.robeTrim) { g.fillStyle = L.robeTrim; g.beginPath(); g.moveTo(-w0 - 34, robeH - 12); g.bezierCurveTo(-30, robeH - 2, 30, robeH - 2, w0 + 34, robeH - 12); g.lineTo(w0 + 35, robeH); g.bezierCurveTo(30, robeH + 10, -30, robeH + 10, -w0 - 35, robeH); g.closePath(); g.fill(); }
    if (L.fur) { g.fillStyle = '#f8f4ec'; g.fillRect(-8, -20, 16, robeH - 6); g.fillStyle = '#2a2430'; for (let y = 0; y < robeH - 20; y += 26) { ell(g, 0, y, 2.4, 4); g.fill(); } }
    if (L.apron) { g.fillStyle = L.apron; g.beginPath(); g.moveTo(-46, -28); g.lineTo(46, -28); g.bezierCurveTo(52, 40, 56, 90, 54, robeH - 20); g.lineTo(-54, robeH - 20); g.bezierCurveTo(-56, 90, -52, 40, -46, -28); g.closePath(); g.fill(); }
    shade(g, -120, 120); }) : null;
  const feet = L.robe ? sh(160, 60, 80, 20, g => { for (const x of [-30, 34]) { g.save(); g.translate(x, -10); shoe(g, 6); g.restore(); } }) : null;
  const HS = L.headScale || 1, hipY = seated ? 0 : -150;
  const parts = [
    P('root', null, null, 0, 0, 0),
    P('torso', torso, 'root', 0, hipY, 2, { sx: (1 - .08 * Math.abs(tb)) }),
    P('head', neckHead, 'torso', tb * 6, -128, 3, { hook: faceHook(L), drop: 1, sx: HS, sy: HS }),
    P('hair', hair, 'head', 0, -80, 3.5),
  ];
  if (L.hair === 'long') parts.push(P('hairBack', hairBackSheet(L, R), 'head', 0, -80, 1.2));
  if (tuft) parts.push(P('tuft', tuft, 'hair', 2, -70, 3.6));
  if (hat) parts.push(P('hat', hat, 'head', 4, L.hair === 'straw' ? -118 : L.hair === 'chef' ? -128 : -116, 3.7));
  if (L.crown || L.tiara) parts.push(P('crown', crownSheet(R, L.tiara), 'head', 6, L.tiara ? -142 : -146, 3.8));
  if (L.beard) parts.push(P('beard', beardSheet(R), 'head', tb * 12, -10, 3.45), P('must', mustacheKing(R), 'head', tb * 22, -52, 3.46));
  if (seated) {
    const k1 = tb * 14, spn = 1 - .14 * Math.abs(tb);
    parts.push(P('legL', seatLeg, 'root', -58 * spn + k1, -16, tb >= 0 ? 3.3 : 3.2, { drop: 1 }), P('legR', seatLeg, 'root', 58 * spn + k1, -16, tb >= 0 ? 3.2 : 3.3, { drop: 1, sx: -1 }));
  } else if (!L.robe) {
    const hx = 34 * bel;
    parts.push(P('thighF', thigh, 'torso', -hx + tb * 18, -6, 1.6, { drop: 1 }), P('shinF', shin, 'thighF', 0, 70, 1.5, { drop: 1 }),
      P('thighB', thigh, 'torso', hx + tb * 4, -6, 1.2, { bright: .8 }), P('shinB', shin, 'thighB', 0, 70, 1.1));
  }
  if (robe) parts.push(P('robe', robe, 'torso', 0, 0, 2.4, { drop: 1 }));
  if (feet && !seated) parts.push(P('feet', feet, 'root', tb * 10, 0, 2.2));
  // arms: N = near (toward the viewer, in front of the body), F = far (behind it)
  parts.push(P('uArmN', upper, 'torso', -66 + tb * 6, -112, 4.2, { drop: 1 }), P('fArmN', fore, 'uArmN', 0, 62, 4.1, { drop: 1 }), P('handN', HANDS.rest, 'fArmN', 0, 46, 4.15, { drop: 1 }),
    P('uArmF', upper, 'torso', 66 - tb * 8, -112, 1.5, {}), P('fArmF', fore, 'uArmF', 0, 62, 1.45), P('handF', HANDS.rest, 'fArmF', 0, 46, 1.4));
  const W = 700, H = seated ? 620 : 760, rig = new Rig(parts, W, H, W / 2, seated ? 470 : 690, R);
  rig.height = (seated ? 300 : 456) * (L.height || 1); rig.look = L; rig.seated = seated;
  rig.handSheets = HANDS;
  // for a darker far leg, drawn in the sheet itself
  rig.pose = (t, o = {}) => {
    const T = rig.parts, v = (x, d) => typeof x === 'function' ? x(t) : (x ?? d), sc = L.height || 1;
    T.root.sx = T.root.sy = sc;
    const ph = o.walk != null ? v(o.walk) : null;       // walk phase in steps (1 = one step)
    const bob = ph != null ? Math.abs(Math.sin(ph * Math.PI)) * 5 : 0;
    let br = .015 * Math.sin(t / (3.4 + (L.key || '').length * .07) * TAU + (L.key || '').length);
    if (o.sigh != null) { const u = (t - o.sigh) / 1.3; if (u > 0 && u < 1) br += u < .45 ? .05 * ss(u / .45) : .05 - .07 * ss((u - .45) / .55); }
    T.torso.sy = 1 + br; T.torso.rot = v(o.lean, 0) + Math.sin(t * .6 + 1) * .006; T.torso.jy = hipY - bob - v(o.lift, 0); T.torso.jx = v(o.shift, 0);
    if (o.shake) { const sk = v(o.shake, 0); T.torso.jx += Math.sin(t * 60) * 2.2 * sk; T.torso.sy *= 1 + Math.sin(t * 9) * .02 * sk; }
    const ht = v(o.headTurn, tb);
    T.head.face = { turn: ht, blink: v(o.blink, 0), lookX: v(o.lookX, .6), lookY: v(o.lookY, 0), mouth: v(o.mouth, 'closed'), talk: v(o.talk, 0), smile: v(o.smile, 1), wob: v(o.wob, 0),
      brow: v(o.brow, 0), browL: v(o.browL, 0), browR: v(o.browR, 0), browTilt: v(o.browTilt, 0), blush: v(o.blush, .18), eyes: v(o.eyes, 'open'), wide: v(o.wide, 0), lid: v(o.lid, 0) };
    T.head.rot = Math.sin(t * .45 + 1) * .02 + v(o.headTilt, 0) + (o.nod ? v(o.nod, 0) * .12 : 0); T.head.jx = tb * 6 + ht * 3; T.head.jy = -128 + v(o.headDip, 0);
    T.hair.jx = -ht * 10; if (T.tuft) T.tuft.rot = Math.sin(t * 1.3) * .03 + v(o.tuftRot, 0);
    if (T.beard) T.beard.rot = -T.head.rot * .3 + Math.sin(t * .8) * .02;
    // legs
    if (!seated && T.thighF) {
      if (ph != null) { const a = Math.sin(ph * Math.PI), a2 = Math.sin(ph * Math.PI + Math.PI);
        T.thighF.rot = -.3 * a; T.shinF.rot = .45 * Math.max(0, Math.sin(ph * Math.PI - .9)); T.thighB.rot = -.3 * a2; T.shinB.rot = .45 * Math.max(0, Math.sin(ph * Math.PI + Math.PI - .9));
      } else { T.thighF.rot = v(o.legF, -.03); T.shinF.rot = v(o.kneeF, 0); T.thighB.rot = v(o.legB, .05); T.shinB.rot = v(o.kneeB, 0); }
    }
    if (T.robe) { T.robe.rot = ph != null ? Math.sin(ph * Math.PI) * .03 : Math.sin(t * .7) * .01; T.robe.jy = 0; }
    if (T.feet) T.feet.jx = tb * 10 + (ph != null ? Math.sin(ph * Math.PI) * 8 : 0);
    // arms: o.armN / o.armF = { x, y } wrist target in torso space, or { a: shoulder angle, e: elbow bend }; o.handN / o.handF = shape; o.handNRot
    const arm = (u, f, h, side, spec, hand, hrot, dflt) => {
      const sx = T[u].jx, sy = T[u].jy; let s = v(spec, null) || dflt;
      if (s.x != null) { const [a1, a2] = ik(s.x - sx, s.y - sy, 62, 46, s.bend ?? (side < 0 ? -1 : 1)); T[u].rot = a1; T[f].rot = a2; }
      else { T[u].rot = s.a; T[f].rot = s.e; }
      T[h].sheet = HANDS[v(hand, 'rest')] || HANDS.rest; T[h].rot = v(hrot, 0) + (s.h || 0);
    };
    const swing = ph != null ? Math.sin(ph * Math.PI) * .35 : 0;
    arm('uArmN', 'fArmN', 'handN', -1, o.armN, o.handN, o.handNRot, { a: .12 + swing + Math.sin(t * .7) * .015, e: -.12 });
    arm('uArmF', 'fArmF', 'handF', 1, o.armF, o.handF, o.handFRot, { a: -.1 - swing + Math.sin(t * .7 + 1) * .015, e: .1 });
    if (o.extra) o.extra(T, t);
    return rig.render();
  };
  return rig;
}
