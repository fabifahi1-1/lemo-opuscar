// The YouTube thumbnail for "Puss in Boots" (1920x1080 master; export 1280x720).
// A painted storybook look: a warm sky with soft clouds, the king's castle far away, and Puss as a shaped, shaded
// character (orange tabby, green eyes, white chest, the film's brown cavalier boots, his sack of red berries).
// Render: node <scratch>/snap.mjs out.png   (page contract: window.READY, window.render)
await document.fonts.load('300px "Lilita One"', 'PUSS IN BOOTS American accent');

// ---------- helpers ----------
const n1 = v => Math.round(v * 10) / 10;
let UID = 0; const uid = p => `${p}${++UID}`;
const DEFS = [];
const LIGHT = [.55, -.83];   // toward the light (upper right, where the sky glows)
function spline(P, N) {      // Catmull-Rom through P, N+1 samples
  const out = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N * (P.length - 1), k = Math.min(P.length - 2, Math.floor(u)), t = u - k;
    const p0 = P[Math.max(0, k - 1)], p1 = P[k], p2 = P[k + 1], p3 = P[Math.min(P.length - 1, k + 2)];
    const c = (a, b, c2, d) => .5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t * t + (-a + 3 * b - 3 * c2 + d) * t * t * t);
    out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
  }
  return out;
}
function tube(P, w0, w1, N = 60) {   // a tapered limb along a smooth curve, with round ends
  const S = spline(P, N), L = [], R = [];
  S.forEach((p, i) => {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(N, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * i / N) / 2; L.push([p[0] - dy / l * w, p[1] + dx / l * w]); R.push([p[0] + dy / l * w, p[1] - dx / l * w]);
  });
  const pt = p => `${n1(p[0])} ${n1(p[1])}`;
  const cap = (p, from, w) => {   // a half circle from one side of the end to the other, bulging outward
    const ax = (from[0] - p[0]) / (w / 2), ay = (from[1] - p[1]) / (w / 2), o = [];
    const q = p === S[N] ? S[N - 1] : S[1], l = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1, fx = (p[0] - q[0]) / l, fy = (p[1] - q[1]) / l;
    for (let k = 1; k < 12; k++) { const t = k / 12 * Math.PI; o.push([p[0] + (ax * Math.cos(t) + fx * Math.sin(t)) * w / 2, p[1] + (ay * Math.cos(t) + fy * Math.sin(t)) * w / 2]); }
    return o;
  };
  return `M${pt(L[0])}` + L.slice(1).map(p => `L${pt(p)}`).join('') + cap(S[N], L[N], w1).map(p => `L${pt(p)}`).join('') + R.slice().reverse().map(p => `L${pt(p)}`).join('') + cap(S[0], R[0], w0).map(p => `L${pt(p)}`).join('') + 'Z';
}
// a shaded part: base colour, a soft form shadow on the side away from the light, a rim of light on the lit side, a thin darker edge
function part(d, base, shade, { hi, s = 22, blur = 7, rim = 10, edge, ew = 3, extra = '', op = 1 } = {}) {
  const c = uid('c'), m = uid('m'), [lx, ly] = LIGHT;
  DEFS.push(`<clipPath id="${c}"><path d="${d}"/></clipPath>`);
  if (hi) DEFS.push(`<mask id="${m}" maskUnits="userSpaceOnUse" x="-500" y="-500" width="3000" height="3000"><path d="${d}" fill="#fff"/><path d="${d}" fill="#000" transform="translate(${-lx * rim} ${-ly * rim})" filter="url(#b3)"/></mask>`);
  return `<g opacity="${op}">` + (edge ? `<path d="${d}" fill="none" stroke="${edge}" stroke-width="${ew * 2}" stroke-linejoin="round"/>` : '') + `<g clip-path="url(#${c})"><path d="${d}" fill="${shade}"/><path d="${d}" fill="${base}" transform="translate(${lx * s} ${ly * s})" filter="url(#b${blur})"/>${extra}</g>` +
    (hi ? `<path d="${d}" fill="${hi}" mask="url(#${m})" opacity=".85"/>` : '') +
    `</g>`;
}
const R0 = s => { let x = s; return () => (x = (x * 16807) % 2147483647) / 2147483647; };

// ---------- palette (Puss as in the film) ----------
const OR = '#ee8a2e', ORS = '#c8611c', ORH = '#ffb867', STR = '#b9561a', EDGE = '#8a3f12';
const WH = '#fdf6ea', WHS = '#e3cdb8', WHE = '#b99a82';
const BOOT = { l: '#7a4626', ls: '#55301a', lh: '#a8683a', cuff: '#a86c38', cuffS: '#7d4c26', cuffH: '#cf9658', sole: '#3a2416', in: '#3d2213', buckle: '#f0c85a' };
const BAG = { b: '#cfa86c', s: '#9a7444', h: '#ecd09a', rope: '#7d5a32', patch: '#a8875a' };
const INK = '#3b2417';

// ---------- the character (local coordinates, feet at y ~ 1010) ----------
function puss() {
  const out = [];
  // tail: sweeps along behind the boots and curls up at the left
  const tailP = [[282, 708], [214, 772], [126, 784], [62, 742], [46, 676], [76, 628], [112, 622]];
  const tailD = tube(tailP, 46, 30);
  let stripes = ''; spline(tailP, 9).slice(1, 9).forEach((p, i) => { if (i % 2) return; stripes += `<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="20" fill="${STR}" opacity=".8"/>`; });
  out.push(part(tailD, OR, ORS, { hi: ORH, s: 12, blur: 5, rim: 6, edge: EDGE, extra: stripes }));
  // the sack, slung over his shoulder and hanging behind him
  const bagD = 'M160 452 C118 470 48 512 40 594 C32 676 92 726 168 726 C240 726 288 694 292 632 C298 568 252 490 212 454 Z';
  let weave = ''; for (let x = 20; x < 320; x += 11) weave += `<path d="M${x} 440 L${x - 40} 740" stroke="${BAG.s}" stroke-width="1.6" opacity=".35"/>`; for (let y = 440; y < 740; y += 11) weave += `<path d="M20 ${y} L320 ${y + 10}" stroke="${BAG.h}" stroke-width="1.4" opacity=".35"/>`;
  const patch = `<path d="M88 600 L150 590 L158 652 L96 664 Z" fill="${BAG.patch}"/><path d="M88 600 L150 590 L158 652 L96 664 Z" fill="none" stroke="${BAG.rope}" stroke-width="3" stroke-dasharray="9 7"/>`;
  out.push(part(bagD, BAG.b, BAG.s, { hi: BAG.h, s: 34, blur: 12, rim: 8, edge: '#6e5030', extra: weave + patch + `<path d="M120 500 C108 560 112 640 150 700" fill="none" stroke="${BAG.s}" stroke-width="7" opacity=".5" filter="url(#b3)"/><path d="M220 500 C240 560 238 630 214 690" fill="none" stroke="${BAG.s}" stroke-width="6" opacity=".45" filter="url(#b3)"/>` }));
  const neckD = 'M146 456 C132 428 148 404 174 410 C196 398 226 416 216 456 Z';
  out.push(part(neckD, BAG.b, BAG.s, { hi: BAG.h, s: 10, blur: 4, rim: 5, edge: '#6e5030' }));
  // red berries spilling out of the top (the gifts for the king)
  const berry = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#c8202e"/><circle cx="${x + r * .15}" cy="${y + r * .15}" r="${r * .8}" fill="#e23440"/><circle cx="${x - r * .35}" cy="${y - r * .35}" r="${r * .28}" fill="#ffd6cf" opacity=".9"/>`;
  out.push(`<path d="M150 402 C140 380 160 372 176 384 Z" fill="#4f8a3a"/><path d="M204 398 C222 374 238 388 224 404 Z" fill="#5e9a44"/>` + berry(166, 404, 17) + berry(196, 396, 18) + berry(184, 418, 15) + berry(214, 412, 14) + berry(146, 418, 13));
  // far arm: paw on the hip (elbow out, confident)
  const farArm = tube([[452, 472], [500, 516], [544, 562]], 62, 54) + tube([[544, 562], [520, 604], [492, 640]], 54, 46);
  out.push(part(farArm, OR, ORS, { hi: ORH, s: 14, blur: 5, rim: 7, edge: EDGE, extra: `<path d="M518 512 L540 528 M536 552 L558 560" stroke="${STR}" stroke-width="11" stroke-linecap="round"/>` }));
  // boots and the short legs inside them (far leg stepping forward, near leg standing)
  out.push(boot(486, 764, -5, 'back'), part('M428 700 C438 730 444 766 444 806 L530 800 C528 762 514 728 480 702 Z', OR, ORS, { s: 12, blur: 5, edge: EDGE }), boot(486, 764, -5, 'front'));
  out.push(boot(298, 774, 2, 'back'), part('M276 704 C262 736 256 772 254 812 L346 812 C346 772 344 732 336 700 Z', OR, ORS, { s: 12, blur: 5, edge: EDGE }), boot(298, 774, 2, 'front'));
  // shine on the boots
  out.push(spark(560, 830, 22), spark(372, 846, 16), spark(610, 960, 12));
  // torso: soft pear, white chest, side stripes, the head's shadow under the chin
  const torso = 'M298 430 C262 472 248 560 256 640 C262 702 302 732 362 734 C428 736 472 706 478 650 C486 570 472 482 442 432 C402 410 338 410 298 430 Z';
  const bib = 'M344 430 C320 500 326 604 360 686 C384 708 424 704 444 678 C464 600 460 500 432 428 Z';
  out.push(part(torso, OR, ORS, { hi: ORH, s: 30, blur: 12, rim: 9, edge: EDGE,
    extra: part(bib, WH, WHS, { s: 22, blur: 9 }) + `<g stroke="${STR}" stroke-width="15" stroke-linecap="round" fill="none"><path d="M252 520 Q278 524 300 538"/><path d="M252 582 Q278 588 298 600"/><path d="M258 642 Q280 648 300 656"/><path d="M484 556 Q466 562 456 574"/><path d="M482 610 Q466 614 456 624"/></g>` +
      `<ellipse cx="376" cy="436" rx="150" ry="34" fill="${ORS}" opacity=".75" filter="url(#b12)"/>` }));
  out.push(paw(486, 646, -2.2, 1));
  // ears (behind the head)
  out.push(part('M192 216 C172 150 168 80 186 28 C240 50 290 88 320 124 Z', OR, ORS, { hi: ORH, s: 10, blur: 5, edge: EDGE, extra: `<path d="M208 192 C197 142 195 98 205 64 C242 86 272 110 296 134 Z" fill="#f4a1a0"/><path d="M208 192 C197 142 195 98 205 64 C222 76 236 88 246 98 C228 120 218 160 208 192 Z" fill="#e48a8c"/>` }));
  out.push(part('M410 114 C450 74 505 42 550 24 C568 80 568 150 554 220 Z', OR, ORS, { hi: ORH, s: 10, blur: 5, edge: EDGE, extra: `<path d="M438 118 C470 90 505 68 534 56 C544 96 546 140 540 188 Z" fill="#f4a1a0"/>` }));
  out.push(`<g stroke="#fff3e0" stroke-width="3" stroke-linecap="round" opacity=".85"><path d="M222 176 L238 150 M232 186 L254 166 M218 160 L230 132"/><path d="M520 150 L540 128 M524 170 L546 156"/></g>`);
  // head
  const head = 'M362 96 C455 92 540 140 556 222 Q592 248 574 272 Q602 298 572 318 Q594 350 548 358 C520 404 450 430 368 430 C288 430 214 404 186 360 Q140 352 162 322 Q126 300 158 276 Q134 248 170 226 C186 140 268 100 362 96 Z';
  out.push(part(head, OR, ORS, { hi: ORH, s: 30, blur: 14, rim: 10, edge: EDGE, extra:
    `<g fill="${STR}"><path d="M332 98 Q340 150 348 160 Q356 150 360 98 Z"/><path d="M372 96 Q380 166 388 172 Q396 166 402 96 Z"/><path d="M414 98 Q424 150 432 158 Q440 148 444 102 Z"/></g>` +
    `<g stroke="${STR}" stroke-width="12" stroke-linecap="round"><path d="M168 248 Q196 252 218 264"/><path d="M168 290 Q192 292 210 300"/><path d="M574 246 Q554 252 540 262"/></g>` }));
  out.push(faceArt());
  // near arm: holds the sack's neck over his shoulder
  const nearArm = tube([[298, 478], [282, 534], [268, 588]], 64, 56) + tube([[268, 588], [238, 534], [206, 476]], 56, 50);
  out.push(part(nearArm, OR, ORS, { hi: ORH, s: 16, blur: 6, rim: 8, edge: EDGE, extra: `<path d="M262 560 L286 552 M254 528 L276 520" stroke="${STR}" stroke-width="11" stroke-linecap="round"/>` }));
  out.push(paw(198, 462, -.4, 1.05, true));
  return out.join('');
}
function paw(x, y, rot, k = 1, grip = false) {   // a white mitten paw with toe lines
  const d = grip ? 'M-30 -14 C-34 -34 -6 -40 14 -34 C34 -28 38 -6 30 12 C22 30 -6 34 -22 24 C-34 16 -34 0 -30 -14 Z' : 'M-30 -8 C-30 -30 -4 -36 16 -30 C36 -24 38 0 30 16 C20 32 -10 32 -24 22 C-34 14 -32 4 -30 -8 Z';
  return `<g transform="translate(${x} ${y}) rotate(${rot * 57.3}) scale(${k})">${part(d, WH, WHS, { s: 8, blur: 4, edge: WHE, ew: 2.5 })}<g stroke="${WHE}" stroke-width="2.6" stroke-linecap="round"><path d="M${grip ? '4 -32 L2 -18' : '20 6 L32 8'}"/><path d="M${grip ? '18 -26 L14 -12' : '18 18 L28 24'}"/></g></g>`;
}
function spark(x, y, r) { return `<path d="M${x} ${y - r * 2} Q${x + r * .2} ${y - r * .2} ${x + r * 2} ${y} Q${x + r * .2} ${y + r * .2} ${x} ${y + r * 2} Q${x - r * .2} ${y + r * .2} ${x - r * 2} ${y} Q${x - r * .2} ${y - r * .2} ${x} ${y - r * 2} Z" fill="#fffbe6" filter="url(#sparkGlow)"/>`; }
function boot(x, y, rot, layer) {   // a cavalier boot: flared cuff, shaft, rounded toe pointing right, sole, ankle strap and buckle
  const shaft = 'M-48 64 C-50 120 -48 170 -46 200 C-48 222 -42 232 -30 234 L74 234 C104 234 116 220 110 204 C104 190 78 184 48 180 C46 148 46 108 48 64 Z';
  const cuff = 'M-78 0 C-72 30 -58 58 -50 78 C-20 88 20 88 50 78 C58 58 72 30 78 0 C40 18 -40 18 -78 0 Z';
  const sole = 'M-46 228 L112 222 C118 232 108 246 92 248 L-38 250 C-48 248 -50 238 -46 228 Z';
  if (layer === 'front') return `<g transform="translate(${x} ${y}) rotate(${rot})">${part(cuff, BOOT.cuff, BOOT.cuffS, { hi: BOOT.cuffH, s: 16, blur: 6, rim: 6, edge: '#4a2a14' })}<path d="M-76 1 C-40 19 40 19 76 1" fill="none" stroke="${BOOT.cuffH}" stroke-width="4" stroke-linecap="round" opacity=".8"/></g>`;
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <ellipse cx="20" cy="250" rx="120" ry="16" fill="#2a1a10" opacity=".35" filter="url(#b8)"/>
    ${part(shaft, BOOT.l, BOOT.ls, { hi: BOOT.lh, s: 22, blur: 9, rim: 7, edge: '#3a2010', extra: `<path d="M-46 150 L48 150 L48 168 L-46 168 Z" fill="${BOOT.ls}"/><path d="M18 22 C26 90 26 150 22 176" stroke="#c98a52" stroke-width="9" stroke-linecap="round" opacity=".55" filter="url(#b3)"/><path d="M60 196 C80 196 96 200 104 208" stroke="#c98a52" stroke-width="6" stroke-linecap="round" opacity=".5" filter="url(#b2)"/>` })}
    <rect x="-2" y="146" width="30" height="26" rx="5" fill="none" stroke="${BOOT.buckle}" stroke-width="6"/><rect x="10" y="152" width="5" height="14" fill="${BOOT.buckle}"/>
    ${part(sole, BOOT.sole, '#24160c', { s: 4, blur: 2 })}
    <path d="M-76 2 C-40 20 40 20 76 2 C40 -16 -40 -16 -76 2 Z" fill="${BOOT.in}"/>
  </g>`;
}
function faceArt() {
  const eye = (cx, cy, rx, ry, lid) => {
    const c = uid('e'); DEFS.push(`<clipPath id="${c}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>`);
    const ix = cx + rx * .22, iy = cy + ry * .1, ly = cy - ry + ry * 2 * lid;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 5}" ry="${ry + 5}" fill="${INK}"/>
      <g clip-path="url(#${c})"><rect x="${cx - rx}" y="${cy - ry}" width="${rx * 2}" height="${ry * 2}" fill="#fffbee"/>
      <ellipse cx="${ix}" cy="${iy}" rx="${rx * .74}" ry="${ry * .78}" fill="url(#iris)"/>
      <ellipse cx="${ix + 2}" cy="${iy + 2}" rx="${rx * .26}" ry="${ry * .5}" fill="#160f1c"/>
      <circle cx="${ix - rx * .28}" cy="${iy - ry * .3}" r="${rx * .24}" fill="#fff"/><circle cx="${ix + rx * .26}" cy="${iy + ry * .34}" r="${rx * .1}" fill="#fff" opacity=".9"/>
      <path d="M${cx - rx - 4} ${cy - ry - 4} L${cx + rx + 4} ${cy - ry - 4} L${cx + rx + 4} ${ly + 6} Q${cx} ${ly - 8} ${cx - rx - 4} ${ly + 12} Z" fill="${OR}"/>
      <path d="M${cx - rx - 4} ${cy - ry - 4} L${cx + rx + 4} ${cy - ry - 4} L${cx + rx + 4} ${ly - 4} Q${cx} ${ly - 18} ${cx - rx - 4} ${ly + 2} Z" fill="${ORS}" opacity=".5"/></g>
      <path d="M${cx - rx - 2} ${ly + 12} Q${cx} ${ly - 8} ${cx + rx + 2} ${ly + 6}" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`;
  };
  return `<g>
    <ellipse cx="290" cy="336" rx="34" ry="18" fill="#f07c74" opacity=".45" filter="url(#b6)"/><ellipse cx="500" cy="330" rx="26" ry="15" fill="#f07c74" opacity=".4" filter="url(#b6)"/>
    ${eye(318, 262, 50, 58, .36)}${eye(464, 258, 42, 55, .38)}
    <path d="M266 196 Q308 160 352 184" fill="none" stroke="${STR}" stroke-width="11" stroke-linecap="round"/><path d="M432 206 Q468 194 502 206" fill="none" stroke="${STR}" stroke-width="10" stroke-linecap="round"/>
    ${part('M328 336 C326 304 360 294 392 304 C424 294 458 304 458 336 C458 372 424 386 392 380 C360 386 328 372 328 336 Z', WH, WHS, { s: 10, blur: 6 })}
    <path d="M372 312 C372 300 412 300 412 312 C412 324 398 334 392 336 C386 334 372 324 372 312 Z" fill="#e8708c"/><ellipse cx="386" cy="308" rx="9" ry="4" fill="#ffc0cc" opacity=".9"/>
    <path d="M392 336 L392 350 M392 350 Q376 366 354 352 M392 350 Q416 364 444 338" fill="none" stroke="#5a2a20" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M444 338 Q450 334 452 328" fill="none" stroke="#5a2a20" stroke-width="4.5" stroke-linecap="round"/>
    <g stroke="#fffaf0" stroke-width="4" stroke-linecap="round" fill="none" opacity=".95"><path d="M338 334 Q260 318 196 320"/><path d="M336 348 Q262 350 198 362"/><path d="M342 360 Q280 376 222 398"/><path d="M448 330 Q510 314 572 312"/><path d="M450 344 Q514 346 576 352"/><path d="M446 356 Q500 370 556 388"/></g>
  </g>`;
}

// ---------- the scene ----------
function cloud(cx, cy, w, h, seed, { top = '#fffaf1', bot = '#f1c9bb', op = 1 } = {}) {
  const r = R0(seed * 7919 + 3), id = uid('g'); let c = '';
  const n = 9; for (let i = 0; i < n; i++) { const t = i / (n - 1), x = cx - w / 2 + t * w, rr = h * (.32 + .5 * Math.sin(Math.PI * t) * (.7 + .3 * r())); c += `<circle cx="${n1(x)}" cy="${n1(cy - rr * .5)}" r="${n1(rr)}"/>`; }
  for (let i = 0; i < 4; i++) { const x = cx - w * .3 + r() * w * .6, rr = h * (.35 + r() * .25); c += `<circle cx="${n1(x)}" cy="${n1(cy - h * .45 - r() * h * .3)}" r="${n1(rr)}"/>`; }
  DEFS.push(`<linearGradient id="${id}" x1="0" y1="${cy - h * 1.2}" x2="0" y2="${cy + h * .2}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${top}"/><stop offset=".6" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient>`);
  const cl = uid('c'); DEFS.push(`<clipPath id="${cl}"><rect x="${cx - w}" y="${cy - h * 2}" width="${w * 2}" height="${h * 2.15}"/></clipPath>`);
  return `<g opacity="${op}" clip-path="url(#${cl})"><g fill="${bot}" transform="translate(0 10)" filter="url(#b6)" opacity=".6">${c}</g><g fill="url(#${id})" filter="url(#cloudEdge)">${c}</g></g>`;
}
function castle(x, y, k) {   // the king's castle (purple roofs, gold flags, lit windows) on its hill
  const tower = (tx, w, h, rh) => `<rect x="${tx - w / 2}" y="${-h}" width="${w}" height="${h}" fill="#f6ead4"/><rect x="${tx + w * .12}" y="${-h}" width="${w * .38}" height="${h}" fill="#dcc6a6"/><path d="M${tx - w / 2 - 16} ${-h} L${tx} ${-h - rh} L${tx + w / 2 + 16} ${-h} Z" fill="#9a5ccc"/><path d="M${tx} ${-h - rh} L${tx + w / 2 + 16} ${-h} L${tx + 6} ${-h} Z" fill="#6e3a9e"/><path d="M${tx} ${-h - rh} L${tx} ${-h - rh - 60}" stroke="#6a4a3a" stroke-width="7"/><path d="M${tx} ${-h - rh - 60} L${tx + 62} ${-h - rh - 44} L${tx} ${-h - rh - 28} Z" fill="#ffcf3a"/>` +
    [0, 1, 2].map(i => `<rect x="${tx - 12}" y="${-h + 70 + i * 110}" width="24" height="44" rx="12" fill="#ffd56e"/><rect x="${tx - 12}" y="${-h + 70 + i * 110}" width="24" height="44" rx="12" fill="#fff2b0" opacity=".6" filter="url(#b6)"/>`).join('');
  let cren = ''; for (let i = 0; i < 14; i++) cren += `<rect x="${-420 + i * 60}" y="-414" width="36" height="38" fill="#f6ead4"/>`;
  let bricks = ''; for (let yy = -360; yy < -20; yy += 40) for (let xx = -410 + ((yy / 40) % 2 ? 30 : 0); xx < 400; xx += 80) bricks += `<rect x="${xx}" y="${yy}" width="60" height="26" rx="4" fill="#e7d6ba"/>`;
  return `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="-420" rx="900" ry="700" fill="url(#cglow)"/><rect x="-420" y="-380" width="840" height="380" fill="#f6ead4"/>${bricks}${cren}${tower(-470, 150, 640, 200)}${tower(470, 150, 600, 200)}${tower(-150, 130, 760, 180)}${tower(170, 140, 700, 190)}<path d="M-90 0 L-90 -170 A90 90 0 0 1 90 -170 L90 0 Z" fill="#7a4a34"/><path d="M-90 -40 L90 -40" stroke="#5a3424" stroke-width="10"/></g>`;
}
DEFS.push(`<radialGradient id="cglow"><stop offset="0" stop-color="#fff6d0" stop-opacity=".75"/><stop offset=".6" stop-color="#fff0c0" stop-opacity=".25"/><stop offset="1" stop-color="#fff0c0" stop-opacity="0"/></radialGradient>`);
function rays(cx, cy, n, a) {   // soft sunbeams fanning out from behind the castle
  let p = ''; for (let i = 0; i < n; i++) { const a0 = Math.PI + i / n * Math.PI, a1 = a0 + Math.PI / n * .5; p += `<path d="M${cx} ${cy} L${n1(cx + Math.cos(a0) * 2400)} ${n1(cy + Math.sin(a0) * 2400)} L${n1(cx + Math.cos(a1) * 2400)} ${n1(cy + Math.sin(a1) * 2400)} Z"/>`; }
  return `<g fill="#fffbe8" opacity="${a}" filter="url(#b8)">${p}</g>`;
}
function scene() {
  const o = [];
  // sky: a rich sunset (rose-orange at the top to gold), a bright glow behind the castle
  DEFS.push(`<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1080" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e8705a"/><stop offset=".35" stop-color="#f6a066"/><stop offset=".68" stop-color="#ffd08a"/><stop offset="1" stop-color="#ffe2a6"/></linearGradient>`);
  DEFS.push(`<radialGradient id="glow" cx="1560" cy="700" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fffbe6" stop-opacity=".95"/><stop offset=".4" stop-color="#ffe9b8" stop-opacity=".5"/><stop offset="1" stop-color="#ffe2a6" stop-opacity="0"/></radialGradient>`);
  o.push(`<rect width="1920" height="1080" fill="url(#sky)"/>${rays(1560, 720, 22, .2)}<rect width="1920" height="1080" fill="url(#glow)"/><rect width="1920" height="1080" filter="url(#mottle)" opacity=".45"/>`);
  // clouds: a bright bank behind Puss (so the orange cat pops), smaller ones in the sky
  o.push(cloud(170, 170, 440, 130, 2), cloud(1840, 760, 420, 120, 5, { op: .85 }), cloud(930, 820, 420, 120, 9, { op: .8 }));
  o.push(cloud(420, 780, 1150, 360, 4));
  // far lavender hills, the castle on its green hill, the road from Puss to the castle, the front hill
  o.push(`<path d="M600 960 C760 900 920 900 1080 930 C1260 880 1420 860 1600 890 C1740 880 1840 890 1920 900 L1920 1080 L600 1080 Z" fill="#c09ac4"/>`);
  o.push(`<path d="M980 1080 C1120 1010 1300 975 1480 990 C1620 965 1780 975 1920 985 L1920 1080 Z" fill="#9cc458"/><path d="M980 1080 C1120 1010 1300 975 1480 990 C1620 965 1780 975 1920 985" fill="none" stroke="#d6ec8e" stroke-width="6" opacity=".8"/>`);
  o.push(castle(1590, 1004, .37));
  o.push(`<path d="M1520 1000 C1500 1030 1360 1050 1200 1080 L1330 1080 C1440 1060 1560 1040 1600 1000 Z" fill="#f2dca0"/>`);
  o.push(`<path d="M0 1006 C220 986 560 996 940 1036 C1020 1046 1060 1064 1080 1080 L0 1080 Z" fill="#6fa040"/>`);
  let tufts = ''; const r = R0(41); for (let x = 10; x < 1040; x += 26 + r() * 20) { const yb = 1010 + (x / 1040) * 34, h = 18 + r() * 26; tufts += `<path d="M${n1(x - 6)} ${n1(yb + 10)} Q${n1(x - 2)} ${n1(yb - h * .5)} ${n1(x + 4)} ${n1(yb - h)} Q${n1(x + 4)} ${n1(yb - h * .4)} ${n1(x + 8)} ${n1(yb + 10)} Z"/>`; }
  o.push(`<g fill="#4f8a2c">${tufts}</g>`);
  let fl = ''; for (const [x, y, c] of [[70, 1030, '#fff6e0'], [130, 1050, '#ffd23a'], [880, 1056, '#fff6e0'], [960, 1064, '#ff7aa8'], [40, 1062, '#ff7aa8']]) fl += `<g fill="${c}">${[0, 1, 2, 3, 4].map(i => `<circle cx="${n1(x + Math.cos(i * 1.2566) * 7)}" cy="${n1(y + Math.sin(i * 1.2566) * 7)}" r="6"/>`).join('')}</g><circle cx="${x}" cy="${y}" r="4.5" fill="#e8a22a"/>`;
  o.push(fl);
  return o.join('');
}
function title() {
  const m = document.createElement('canvas').getContext('2d'), CX = 1330, MAXW = 1060, F = '"Lilita One"';
  DEFS.push(`<linearGradient id="tfill" x1="0" y1="0" x2="0" y2="1" ><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#ffffff"/><stop offset="1" stop-color="#ffeccc"/></linearGradient>`);
  // white letters, a thick dark outline and a deep 3D edge, like the white titles of the references
  const line = (s, size, base, track = 0) => {
    m.font = `${size}px ${F}`; const w = m.measureText(s).width + track * (s.length - 1), k = Math.min(1, MAXW / w); size *= k; track *= k;
    const at = `x="${CX}" y="${base}" font-family='${F}' font-size="${n1(size)}" text-anchor="middle" letter-spacing="${n1(track)}"`, ow = n1(size * .085);
    let ext = ''; for (let i = 14; i >= 1; i--) ext += `<text ${at} fill="#4a2414" stroke="#4a2414" stroke-width="${ow}" stroke-linejoin="round" transform="translate(${n1(i * .55)} ${n1(i * .85)})">${s}</text>`;
    return `<text ${at} fill="#3a1a0c" opacity=".45" filter="url(#b14)" transform="translate(14 26)">${s}</text>` + ext +
      `<text ${at} fill="#4a2414" stroke="#4a2414" stroke-width="${ow}" stroke-linejoin="round">${s}</text>` +
      `<text ${at} fill="url(#tfill)">${s}</text>` +
      `<text ${at} fill="none" stroke="#ffffff" stroke-width="2" opacity=".5" transform="translate(-2 -3)">${s}</text>`;
  };
  // the accent label above the title, after the US reference: a round flag badge and the words
  const lab = 'American accent', ls = 76; m.font = `${ls}px ${F}`; const lw = m.measureText(lab).width, fr = 44, gap = 22, x0 = CX - (lw + fr * 2 + gap) / 2, fx = x0 + fr, fy = 96;
  let flag = ''; for (let i = 0; i < 7; i++) flag += `<rect x="${n1(fx - fr)}" y="${n1(fy - fr + i * 2 * fr / 7)}" width="${2 * fr}" height="${n1(2 * fr / 7 + .5)}" fill="${i % 2 ? '#fbf6ee' : '#d0303c'}"/>`;
  let stars = ''; for (let rr = 0; rr < 3; rr++) for (let c = 0; c < 3; c++) stars += `<circle cx="${n1(fx - fr + 11 + c * 14 + (rr % 2) * 6)}" cy="${n1(fy - fr + 11 + rr * 13)}" r="3.4" fill="#fbf6ee"/>`;
  DEFS.push(`<clipPath id="flagc"><circle cx="${n1(fx)}" cy="${fy}" r="${fr}"/></clipPath>`);
  const tx = x0 + fr * 2 + gap, lat = `x="${n1(tx)}" y="${fy + 27}" font-family='${F}' font-size="${ls}"`;
  const label = `<g><circle cx="${n1(fx + 4)}" cy="${fy + 8}" r="${fr + 8}" fill="#3a1a0c" opacity=".35" filter="url(#b6)"/><circle cx="${n1(fx)}" cy="${fy}" r="${fr + 7}" fill="#4a2414"/><g clip-path="url(#flagc)">${flag}<rect x="${n1(fx - fr)}" y="${fy - fr}" width="${n1(fr * 1.04)}" height="${n1(fr * .92)}" fill="#2a3f7a"/>${stars}</g>` +
    `<text ${lat} fill="#3a1a0c" opacity=".4" filter="url(#b6)" transform="translate(5 8)">${lab}</text><text ${lat} fill="#4a2414" stroke="#4a2414" stroke-width="12" stroke-linejoin="round" transform="translate(3 5)">${lab}</text><text ${lat} fill="#4a2414" stroke="#4a2414" stroke-width="12" stroke-linejoin="round">${lab}</text><text ${lat} fill="#fff">${lab}</text></g>`;
  return label + line('PUSS IN', 270, 372, 6) + line('BOOTS', 330, 640, 10);
}

function build() {
  const sceneSvg = scene(), pussSvg = puss(), titleSvg = title();
  const filters = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14].map(b => `<filter id="b${b}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${b * .5}"/></filter>`).join('') +
    `<filter id="cloudEdge" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="14"/><feGaussianBlur stdDeviation="1.2"/></filter>` +
    `<filter id="mottle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".004 .006" numOctaves="3" seed="8"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .92  0 0 0 0 .8  0 0 0 .9 -.32"/></filter>` +
    `<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .12  0 0 0 0 .05  0 0 0 .55 -.16"/></filter>` +
    `<filter id="brush" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".02 .09" numOctaves="2" seed="12"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .95  0 0 0 0 .85  0 0 0 .7 -.3"/></filter>` +
    `<filter id="halo" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="5" result="d"/><feGaussianBlur in="d" stdDeviation="9" result="b"/><feFlood flood-color="#fffbe8" flood-opacity=".9"/><feComposite in2="b" operator="in" result="h"/><feMerge><feMergeNode in="h"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
    `<filter id="sparkGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
    `<radialGradient id="iris" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#c8f08a"/><stop offset=".55" stop-color="#7cc84e"/><stop offset="1" stop-color="#3f8a30"/></radialGradient>` +
    `<radialGradient id="vig" cx="960" cy="540" r="1150" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#2a1208" stop-opacity="0"/><stop offset="1" stop-color="#2a1208" stop-opacity=".32"/></radialGradient>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080"><defs>${filters}${DEFS.join('')}</defs>
    ${sceneSvg}
    <g transform="translate(150 40)" filter="url(#halo)">${pussSvg}</g>
    ${titleSvg}
    <rect width="1920" height="1080" filter="url(#brush)" opacity=".18" style="mix-blend-mode:soft-light"/>
    <rect width="1920" height="1080" filter="url(#grain)" opacity=".5"/>
    <rect width="1920" height="1080" fill="url(#vig)"/></svg>`;
}
document.getElementById('root').innerHTML = build();
window.render = () => {};
window.READY = true;
