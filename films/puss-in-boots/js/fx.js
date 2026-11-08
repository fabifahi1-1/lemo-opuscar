// Effects, cards, title, moral and end card. Screen-space unless f.world (then drawn in that layer's transform).
const END_TAIL = 12.2;          // seconds after the last line: the moral card holds, then the end card
const CARDOBJ = {};
const CARD_NEEDS = { donkey: 'donkey', cat: 'puss0', sheep: 'sheep', lion: 'lion', mouse: 'mouse' };
const CARD_CAST = ['donkey', 'puss0', 'sheep', 'lion', 'mouse'];
const CARD_TINT = ['#e8d2b0', '#d8e0c4', '#e4d0d8', '#d0dce4', '#e8dcb8'];

function charSprite(id, sc, expr, pose, o = {}) {
  const ch = CH[id]; const h = ch.kind === 'human' ? (ch.g.leg + ch.g.torso + ch.g.neck + ch.g.head.ry * 2.4) : (ch.g.legL + ch.g.bodyH + ch.g.head.ry * 2.4 + 60);
  const w = ch.kind === 'human' ? h * .8 : ch.g.bodyL * 1.7 + ch.g.head.rx * 2;
  return canvasSprite(-w * sc / 2, -h * sc - 20, w * sc / 2, 20, 2, c => drawChar(c, id, Object.assign({ x: 0, y: 0, s: sc, face: 1, E: exprMix(expr, expr, 0), arms: POSE[pose || 'down'], ph: 1, noShadow: false }, o), 1.3));
}
function buildCards(objs) {
  withSeed(4242, () => {
    const S = (r, f) => canvasSprite(-330, -330, 330, 330, r, f);
    const B = {
      mill: () => S(1.4, c => { stoneWall(c, [[-200, 180], [-200, 20], [120, 20], [120, 180]], '#c8b496', { bh: 28, moss: 3 }); paint(c, [[-190, 30], [-190, -120], [110, -120], [110, 30]], '#c99a52', { under: true, wob: 1.5, line: 1.8, bloom: .8 }); roofTiles(c, [[-230, -110], [-40, -270], [150, -110]], '#a0583a', 5); windowPane(c, -130, -90, 50, 60, { shutters: '#6a8a5a' }); paint(c, [[-60, 180], [-60, 90], [-20, 64], [20, 90], [20, 180]], '#7a4a2e', { under: true, wob: 1, line: 1.5 }); drawSprite(c, millWheelSprite(120), 190, 60, .9); riverPaint(c, -320, 320, 180, 260, ['#9cc0c0', '#7aa8b0']); }),
      donkey: () => charSprite('donkey', 2.2, 'happy'),
      cat: () => charSprite('puss0', 2.6, 'smile', 'down'),
      bread: () => S(2, c => { drawSprite(c, PROPS.bread, 0, 0, 3.4); }),
      loaf: () => S(2, c => { drawSprite(c, PROPS.bread, 0, 10, 3.6); for (let k = 0; k < 3; k++) { const x = -60 + k * 60; c.save(); c.globalAlpha = .5; brush(c, qcurve(x, -120, x + 10, -220, 20, 8), 6, '#f6eedc', { prof: 'tip', nb: 0 }); c.restore(); } }),
      boots: () => S(2, c => { for (const [dx, s] of [[-110, 1], [90, 1]]) { const bt = catmull([[dx - 50, -170], [dx + 50, -170], [dx + 50, 40], [dx + 130, 60], [dx + 140, 130], [dx + 120, 150], [dx - 54, 150], [dx - 56, 40]], true, 5); paint(c, bt, '#7a4a2a', { under: true, wob: 2, line: 2.4, bloom: .9 }); paint(c, catmull([[dx - 64, -200], [dx + 64, -200], [dx + 70, -120], [dx - 70, -120]], true, 4), '#a8714a', { under: true, wob: 1.5, line: 2, bloom: .6 }); paint(c, ellipsePts(dx + 4, -40, 18, 14, 0, 14), '#e2b54a', { under: true, wob: .5, line: 1.4, bloom: 1 }); brush(c, qcurve(dx + 20, 70, dx + 110, 90, -10, 6), 8, '#f0d8b8', { prof: 'leaf', nb: 0, a: .7 }); } }),
      bag: () => S(2, c => { drawSprite(c, PROPS.bag, 0, 0, 5.4); }),
      berries: () => S(2, c => { for (let k = 0; k < 6; k++) brush(c, polar(0, 0, k / 6 * TAU, 170, 30, 6), 46, pick(['#4e7a44', '#6f9a3a']), { prof: 'leaf', nb: 4 }); for (let k = 0; k < 22; k++) { const a = rnd(0, TAU), r = Math.sqrt(rnd()) * 120; paint(c, ellipsePts(Math.cos(a) * r, Math.sin(a) * r * .8, 26, 26, 0, 18), pick(['#d8323a', '#c82a3a', '#e84a4a']), { under: true, wob: .6, line: 1.6, bloom: 1 }); } }),
      castle: () => S(1.4, c => { stoneWall(c, [[-280, 220], [-280, 20], [280, 20], [280, 220]], '#d8cbb8', { bh: 26 }); crenels(c, -286, 280, 20, '#d8cbb8', 22, 26); for (const [dx, w, h] of [[-250, 80, 300], [250, 80, 300], [-100, 70, 360], [100, 70, 360], [0, 100, 460]]) tower(c, dx, 220, w, h, '#ddd0be', '#5b3a7a', { win: 2, rk: 1.3 }); paint(c, [[-40, 220], [-40, 120], [0, 96], [40, 120], [40, 220]], '#6a4a2e', { under: true, wob: .8, line: 1.6 }); }),
      throne: () => S(1.6, c => { paint(c, [[-150, 260], [-155, -150], [-80, -230], [0, -260], [80, -230], [155, -150], [150, 260]], '#e2b54a', { under: true, wob: 1.5, line: 2.4, lineCol: '#8a6a2a', bloom: 1 }); paint(c, [[-110, 220], [-112, -110], [0, -190], [112, -110], [110, 220]], '#a82a38', { under: true, wob: 1, line: 1.8, bloom: .8 }); paint(c, [[-170, 120], [170, 120], [170, 160], [-170, 160]], '#c8a03a', { under: true, wob: 1, line: 1.8 }); for (const [x, y] of [[-80, -220], [0, -252], [80, -220]]) paint(c, ellipsePts(x, y, 16, 16, 0, 12), '#c8343a', { under: true, wob: .3, line: 1.2, bloom: 1 }); }),
      crown: () => S(2, c => { const cr = catmull([[-170, 90], [-190, -90], [-95, -10], [0, -150], [95, -10], [190, -90], [170, 90]], true, 3); paint(c, cr, '#e8b93c', { under: true, wob: 1.5, line: 2.4, lineCol: '#8a6a2a', bloom: 1 }); for (const [x, y, col] of [[0, 30, '#c8343a'], [-100, 40, '#3a7ac8'], [100, 40, '#3aa86a']]) paint(c, ellipsePts(x, y, 22, 22, 0, 14), col, { under: true, wob: .4, line: 1.4, bloom: 1 }); brush(c, qcurve(-160, 70, 160, 70, 0, 12), 10, '#c8983a', { prof: 'even', nb: 3 }); }),
      bell: () => S(2, c => { drawSprite(c, PROPS.bell, 0, 30, 6); brush(c, qcurve(-160, -120, -120, -170, 10, 4), 6, '#b8a080', { prof: 'tip', nb: 0, a: .6 }); brush(c, qcurve(160, -120, 120, -170, -10, 4), 6, '#b8a080', { prof: 'tip', nb: 0, a: .6 }); }),
      carriage: () => S(1.4, c => { carriageBody(c, 0, 150, 1.6); drawSprite(c, wheelSprite(70), -150, 160); drawSprite(c, wheelSprite(70), 150, 160); }),
      sheep: () => charSprite('sheep', 3.2, 'happy'),
      cookies: () => S(2, c => { paint(c, ellipsePts(0, 60, 260, 70, 0, 40), '#f4f0e8', { under: true, wob: 1.5, line: 2, lineCol: '#a8b8c8', bloom: .8 }); for (const [x, y] of [[-110, 30], [0, 10], [110, 30], [-55, -40], [55, -40], [0, -100]]) drawSprite(c, PROPS.cookie, x, y, 3.4); }),
      doormat: () => S(1.6, c => { paint(c, [[-280, -90], [280, -90], [310, 110], [-310, 110]], '#c8743a', { under: true, wob: 2, line: 2.4, bloom: .8, gran: .9 }); for (let k = 0; k < 40; k++) brush(c, qcurve(-300 + k * 15, 100, -296 + k * 15, 124, 0, 3), 3, '#a8582a', { prof: 'even', nb: 0, a: .7 }); c.save(); c.font = '700 64px Fredoka'; c.textAlign = 'center'; c.fillStyle = rgba('#5a2a1a', .9); c.fillText('BEWARE', 0, -14); c.fillText('OF OGRE', 0, 64); c.restore(); }),
      slippers: () => S(2, c => { drawSprite(c, PROPS.slipper, -10, -50, 3.2); drawSprite(c, PROPS.slipper, 20, 90, 3.2); }),
      doorbell: () => S(2, c => { stoneWall(c, [[-220, 250], [-220, -250], [220, -250], [220, 250]], '#9a96a0', { bh: 50, moss: 4 }); paint(c, [[-70, -20], [70, -20], [70, 170], [-70, 170]], '#e2c46a', { under: true, wob: 1, line: 2, bloom: 1 }); paint(c, ellipsePts(0, 75, 40, 40, 0, 20), '#c8343a', { under: true, wob: .6, line: 1.8, bloom: 1 }); drawSprite(c, PROPS.bell, 0, -120, 3.2); }),
      lion: () => charSprite('lion', 1.6, 'happy'),
      mouse: () => charSprite('mouse', 8, 'surprised'),
    };
    for (const o of objs) if (B[o] && !CARDOBJ[o]) {
      const spr = B[o]();
      // blotch reveal order
      const [x0, y0, x1, y1] = [spr.x0, spr.y0, spr.x1, spr.y1];
      const bl = []; for (let k = 0; k < 34; k++) bl.push([rnd(x0, x1), rnd(y0, y1), rnd(.0, .7)]);
      bl.sort((a, b) => a[2] - b[2]);
      const cb = contentBox(spr); CARDOBJ[o] = { spr, bl, r: Math.max(x1 - x0, y1 - y0), cb };
    }
  });
}
function cardPaper(c, tint) {
  c.fillStyle = tint; c.fillRect(0, 0, W, H);
  c.save(); c.globalAlpha = .5; c.drawImage(GRAN, 0, 0, W, H); c.restore();
  // the sheet: deckled edge, soft shadow
  withSeed(77, () => {
    const pts = []; const x0 = 150, y0 = 90, x1 = W - 150, y1 = H - 90;
    for (let x = x0; x < x1; x += 14) pts.push([x, y0 + rnd(-3, 3)]); for (let y = y0; y < y1; y += 14) pts.push([x1 + rnd(-3, 3), y]);
    for (let x = x1; x > x0; x -= 14) pts.push([x, y1 + rnd(-3, 3)]); for (let y = y1; y > y0; y -= 14) pts.push([x0 + rnd(-3, 3), y]);
    c.save(); c.shadowColor = 'rgba(60,40,20,.35)'; c.shadowBlur = 40; c.shadowOffsetY = 14; pathOf(c, pts); c.fillStyle = '#f6efe0'; c.fill(); c.restore();
    pathOf(c, pts); c.strokeStyle = 'rgba(160,130,90,.35)'; c.lineWidth = 1.5; c.stroke();
  });
}
function revealSprite(c, O, x, y, sc, p) {
  if (p >= 1) { drawSprite(c, O.spr, x, y, sc); return; }
  c.save(); c.beginPath();
  for (const [bx, by, d] of O.bl) { const r = O.r * .38 * ss(seg(p, d * .8, d * .8 + .45)); if (r > 1) { c.moveTo(x + bx * sc + r * sc, y + by * sc); c.arc(x + bx * sc, y + by * sc, r * sc, 0, TAU); } }
  c.clip(); drawSprite(c, O.spr, x, y, sc); c.restore();
}
function drawCard(c, card, t) {
  const i = TL.cards.indexOf(card), u = t - card.t0;
  cardPaper(c, CARD_TINT[i % CARD_TINT.length]);
  const O = CARDOBJ[card.obj];
  if (O) { const [cx0, cy0, cx1, cy1] = O.cb, sc = Math.min(600 / (cx1 - cx0), 560 / (cy1 - cy0), 2.6); const bob = Math.sin(u * 2) * 4; revealSprite(c, O, 640 - (cx0 + cx1) / 2 * sc, 540 - (cy0 + cy1) / 2 * sc + bob, sc, seg(u, .05, .9)); }
  // the word, typed in sync with the narrator
  const txt = card.text, n = Math.floor(clamp((t - card.tw) / .5) * txt.length + .001);
  c.save(); c.font = '700 132px Andika'; c.textBaseline = 'alphabetic'; c.fillStyle = INKC;
  const shown = txt.slice(0, n); c.fillText(shown, 1080, 600);
  if (n > 0 && n < txt.length && Math.floor(t * 4) % 2 === 0) { const w = c.measureText(shown).width; c.fillRect(1080 + w + 6, 500, 6, 110); }
  const full = c.measureText(txt).width;
  c.restore();
  // underline grows after the word
  const up = seg(t, card.tw + .5, card.tw + 1.0);
  if (up > 0) withSeed(31 + i, () => drawS(c, mk(qcurve(1076, 632, 1076 + full, 628, -6, 14), 7, '#c8443a', { prof: 'even', nb: 3, a: .85 }), up));
}
function cardTexts(card, t) { return [{ id: 'card' + card.t0.toFixed(2), text: card.text, x0: 1080, y0: 480, x1: 1080 + card.text.length * 62, y1: 640 }]; }

// ---------------- effects ----------------
function fxAlive(f, t) { const d = f.dur ?? 2.1; return t >= f.t && t < (f.t2 ?? f.t + d); }
function fxSkip(f) { return f.pre; }
function fxPos(f, cam, s, states) {
  // returns screen position for a world-anchored or character-anchored effect
  if (f.who !== undefined) { const st = states.find(x => x.cs.id === f.who); if (!st) return [W / 2, H / 3]; const ch = CH[f.who];
    const hy = ch.kind === 'human' ? -(ch.g.leg + ch.g.torso + ch.g.neck + ch.g.head.ry * 2) : -(ch.g.legL + ch.g.bodyH + 40);
    const [x, y, zk] = w2s(cam, st.cs.ly ?? 1, st.st.x + (f.dx || 0) * (st.st.face || 1), st.st.y + hy * (st.st.s || 1) + (f.dy || 0));
    return [x, y, zk]; }
  if (f.on) { const st = states.find(x => x.cs.id === f.on); if (st) { const [wx, wy] = partPos(f.on, st.st, f.part || 'head'); return w2s(cam, st.cs.ly ?? 1, wx + (f.dx || 0), wy + (f.dy || 0)); } }
  if (f.world) return [f.x, f.y, 1];
  const [x, y, zk] = w2s(cam, f.layer ?? 1, f.x, f.y); return [x, y, zk];
}
function paintedText(c, txt, x, y, size, col, o = {}) {
  c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot); if (o.sc) c.scale(o.sc, o.sc);
  c.font = `700 ${size}px ${o.font || 'Fredoka'}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = size * .2; c.strokeStyle = o.halo || '#fbf4e4'; c.strokeText(txt, 0, 0);
  c.lineWidth = size * .07; c.strokeStyle = rgba(shade(col, .45), .9); c.strokeText(txt, 0, 0);
  c.fillStyle = col; c.globalAlpha = .9; c.fillText(txt, 0, 0);
  c.globalAlpha = .45; c.fillStyle = shade(col, -.35); c.fillText(txt, -size * .03, -size * .04);
  c.globalAlpha = .3; c.fillStyle = shade(col, .25); c.save(); c.beginPath(); c.rect(-2000, size * .08, 4000, 400); c.clip(); c.fillText(txt, 0, 0); c.restore();
  c.restore();
}
function bubbleShape(c, x, y, w, h, tx, ty, think) {
  withSeed(Math.round(w * 7 + h), () => {
    const pts = ellipsePts(x, y, w / 2, h / 2, 0, 40), P = wobble(pts, 4, .2);
    if (!think) { c.beginPath(); c.moveTo(x - w * .12, y + h * .3); c.lineTo(tx, ty); c.lineTo(x + w * .08, y + h * .38); c.closePath(); c.fillStyle = '#fffaf0'; c.fill(); c.strokeStyle = rgba(INKC, .8); c.lineWidth = 3; c.stroke(); }
    else for (let k = 0; k < 3; k++) { const u = (k + 1) / 4; c.beginPath(); c.arc(lerp(tx, x, u * .9), lerp(ty, y + h * .4, u * .9), 6 + k * 5, 0, TAU); c.fillStyle = '#fffaf0'; c.fill(); c.strokeStyle = rgba(INKC, .7); c.lineWidth = 2.5; c.stroke(); }
    pathOf(c, P); c.fillStyle = '#fffaf0'; c.fill(); c.lineWidth = 3.2; c.strokeStyle = rgba(INKC, .85); c.stroke();
    softBlob(c, x - w * .15, y - h * .15, w * .3, h * .25, '#f4e8d0', .5, .4);
  });
}
function drawFx(c, f, t, s, cam, states) {
  if (!fxAlive(f, t) || f.pre) return;
  const u = t - f.t, d = f.dur ?? 2.1, out = 1 - seg(u, d - .3, d);
  c.save();
  if (f.sw) {   // big comic sound word
    const [x, y, zk] = fxPos(f, cam, s, states);
    const pop = u < .25 ? EASE.back(u / .25) : 1, wob = Math.sin(u * 14) * .03 * (1 - seg(u, 0, .8));
    c.globalAlpha = out; paintedText(c, f.sw, x, y, (f.size || 120), f.col || '#e8553a', { rot: (f.rot || -.08) + wob, sc: pop });
  } else if (f.bub) {   // speech bubble for shouted words
    const [hx, hy] = fxPos(f, cam, s, states);
    const bx = hx + (f.bx ?? 180), by = hy + (f.by ?? -170), pop = u < .2 ? EASE.back(u / .2) : 1;
    c.globalAlpha = out; c.translate(bx, by); c.scale(pop, pop); c.translate(-bx, -by);
    c.font = `700 ${f.size || 64}px Fredoka`; const w = c.measureText(f.bub).width + 90, h = (f.size || 64) * 1.9;
    bubbleShape(c, bx, by, w, h, hx + (f.tx ?? 40), hy + (f.ty ?? -10));
    c.fillStyle = f.col || '#c8343a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(f.bub, bx, by + 2);
  } else if (f.think) {   // thought bubble with a little picture
    const [hx, hy] = fxPos(f, cam, s, states); const bx = hx + (f.bx ?? 200), by = hy + (f.by ?? -200), pop = u < .3 ? EASE.back(u / .3) : 1;
    c.globalAlpha = out; c.translate(bx, by); c.scale(pop, pop); c.translate(-bx, -by);
    bubbleShape(c, bx, by, 300, 210, hx + 30, hy - 20, true);
    if (f.think === '?') { c.font = '700 130px Fredoka'; c.fillStyle = '#5b7ea8'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', bx, by + 6); }
    else if (PROPS[f.think]) drawSprite(c, PROPS[f.think], bx, by, f.ts || 1.6);
    else if (CARDOBJ[f.think]) drawSprite(c, CARDOBJ[f.think].spr, bx, by, .3);
  } else if (f.label) {   // hand-written label with an arrow that ends exactly on the target
    const [x, y] = fxPos(f, cam, s, states);
    const lx = x + (f.lx ?? -220), ly = y + (f.ly ?? -160);
    const p = seg(u, 0, .6), ap = seg(u, .3, 1.0);
    c.globalAlpha = out;
    c.font = `700 ${f.size || 80}px Caveat`; c.textBaseline = 'middle'; c.textAlign = 'center';
    const tw = c.measureText(f.label).width;
    c.save(); c.beginPath(); c.rect(lx - tw / 2 - 10, ly - 70, (tw + 20) * p, 140); c.clip();
    c.lineWidth = 16; c.strokeStyle = 'rgba(251,244,228,.85)'; c.lineJoin = 'round'; c.strokeText(f.label, lx, ly); c.fillStyle = INKC; c.fillText(f.label, lx, ly); c.restore();
    // arrow from the label edge to the target point (x, y)
    const sx = lx + Math.sign(x - lx) * Math.min(tw / 2 + 14, Math.abs(x - lx)) * (Math.abs(x - lx) > tw / 2 ? 1 : 0), sy = ly + (Math.abs(x - lx) > tw / 2 ? 0 : Math.sign(y - ly) * 44);
    const mx = (sx + x) / 2 + (y - sy) * .18, my = (sy + y) / 2 - (x - sx) * .18;
    const N = 20, pts = []; for (let k = 0; k <= N; k++) { const q = k / N * ap, a = 1 - q; pts.push([a * a * sx + 2 * a * q * mx + q * q * x, a * a * sy + 2 * a * q * my + q * q * y]); }
    c.strokeStyle = 'rgba(251,244,228,.8)'; c.lineWidth = 11; c.lineCap = 'round'; c.beginPath(); pts.forEach(([px, py], k) => k ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke();
    c.strokeStyle = INKC; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); pts.forEach(([px, py], k) => k ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke();
    if (ap >= 1) { const ang = Math.atan2(y - my, x - mx); c.beginPath(); c.moveTo(x, y); c.lineTo(x - Math.cos(ang - .45) * 26, y - Math.sin(ang - .45) * 26); c.moveTo(x, y); c.lineTo(x - Math.cos(ang + .45) * 26, y - Math.sin(ang + .45) * 26); c.stroke(); }
  } else if (f.notes) {   // music notes floating up
    const [x, y] = fxPos(f, cam, s, states);
    for (let k = 0; k < 5; k++) { const q = u - k * .28; if (q < 0) continue; const a = clamp(1 - q / 1.6); if (a <= 0) continue;
      const nx = x + k * 46 + Math.sin(q * 3 + k) * 24, ny = y - q * 110 - k * 10; c.globalAlpha = a * out; c.fillStyle = ['#5b7ea8', '#c8443a', '#7a9a4a', '#9b84c4', '#e2a83a'][k];
      c.beginPath(); c.ellipse(nx, ny, 14, 10, -.4, 0, TAU); c.fill(); c.fillRect(nx + 10, ny - 50, 4.5, 50); if (k % 2) c.fillRect(nx + 10, ny - 50, 22, 7); }
  } else if (f.pop) {   // objects popping in one by one
    const step = f.step || .3;
    f.pts.forEach(([px, py], k) => { const q = u - k * step; if (q < 0) return; const sc = q < .22 ? EASE.back(q / .22) : 1;
      const [x, y, zk] = f.world ? [px, py, 1] : w2s(cam, f.layer ?? 1, px, py); c.globalAlpha = f.keep ? 1 : out; drawSprite(c, PROPS[f.pop], x, y, (f.s || 1) * sc * (f.world ? 1 : zk)); });
  } else if (f.poof) {   // pigment cloud: the painted transformation
    const [x, y, zk] = fxPos(f, cam, s, states);
    const cols = f.cols || ['#f4a6c6', '#9b84c4', '#8aa35a', '#f6dca0'];
    for (let k = 0; k < 22; k++) { const a = k / 22 * TAU + hash(k) * .5, r = (60 + 220 * eo(seg(u, 0, .7))) * zk * (.6 + hash(k * 3) * .6);
      const al = (1 - seg(u, .5, 1.6)) * .85; if (al <= 0) continue; softBlob(c, x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .55, (70 + hash(k * 7) * 70) * zk, (60 + hash(k * 5) * 50) * zk, cols[k % cols.length], al, .5); }
    if (u < .5) softBlob(c, x, y, 160 * zk, 140 * zk, '#fffaf0', (1 - u / .5) * .9, .5);
    for (let k = 0; k < 12; k++) sparkleLive(c, x + Math.cos(k) * (100 + u * 260) * zk, y + Math.sin(k * 1.7) * (60 + u * 160) * zk, t * 3 + k, k, 10, '#fffaf0');
  } else if (f.crumbs) {
    const [x, y, zk] = fxPos(f, cam, s, states);
    for (let k = 0; k < 18; k++) { const vx = (hash(k) - .5) * 420, vy = -120 - hash(k * 3) * 260, q = u; const px = x + vx * q * zk, py = y + (vy * q + 600 * q * q) * zk; c.globalAlpha = out; c.fillStyle = k % 2 ? '#c8944a' : '#e8c07a'; c.beginPath(); c.arc(px, py, (3 + hash(k * 9) * 4) * zk, 0, TAU); c.fill(); }
  } else if (f.drops) {   // a splash of water drops
    const [x, y, zk] = fxPos(f, cam, s, states);
    for (let k = 0; k < 26; k++) { const vx = (hash(k + 4) - .5) * 700, vy = -300 - hash(k * 5) * 420, q = u * 1.1; const px = x + vx * q * zk, py = y + (vy * q + 900 * q * q) * zk; if (py > y + 30 * zk) continue; c.globalAlpha = .8 * out; c.fillStyle = k % 3 ? '#a8d4dc' : '#f4fbfb'; c.beginPath(); c.ellipse(px, py, (6 + hash(k) * 6) * zk, (8 + hash(k) * 8) * zk, Math.atan2(vy + 900 * q, vx), 0, TAU); c.fill(); }
  } else if (f.hearts) {
    const [x, y] = fxPos(f, cam, s, states);
    for (let k = 0; k < 4; k++) { const q = u - k * .3; if (q < 0) continue; const a = clamp(1 - q / 1.6) * out; const hx = x + (k - 1.5) * 50 + Math.sin(q * 3 + k) * 16, hy = y - q * 90; c.globalAlpha = a; c.fillStyle = '#e8607a';
      c.beginPath(); c.moveTo(hx, hy + 12); c.bezierCurveTo(hx - 26, hy - 6, hx - 12, hy - 26, hx, hy - 10); c.bezierCurveTo(hx + 12, hy - 26, hx + 26, hy - 6, hx, hy + 12); c.fill(); }
  } else if (f.sparkle) {
    const [x, y, zk] = fxPos(f, cam, s, states); for (let k = 0; k < 8; k++) sparkleLive(c, x + Math.cos(k * 2.4) * 80 * zk * (1 + u), y + Math.sin(k * 2.4) * 60 * zk * (1 + u), t * 2 + k * .3, k, 14, f.col || '#fff4c8');
  } else if (f.speed) {   // speed lines behind a runner
    const st = states.find(x => x.cs.id === f.who); if (st) { const [x, y, zk] = w2s(cam, 1, st.st.x, st.st.y - 80 * (st.st.s || 1)); c.globalAlpha = .6 * out; c.strokeStyle = '#f4ead2'; c.lineWidth = 4; c.lineCap = 'round';
      for (let k = 0; k < 5; k++) { const yy = y + (k - 2) * 26 * zk, L = (90 + hash(k + Math.floor(t * 12)) * 80) * zk, dir = -(st.st.face || 1); c.beginPath(); c.moveTo(x + dir * 70 * zk, yy); c.lineTo(x + dir * (70 * zk + L), yy); c.stroke(); } }
  } else if (f.prop) {   // a prop placed in the world (drawn in front of the characters)
    const [x, y, zk] = w2s(cam, f.layer ?? 1, f.x, f.y); const ap = f.popin ? (u < .25 ? EASE.back(u / .25) : 1) : 1; c.globalAlpha = f.fade ? out : 1; if (f.flip) { c.translate(x, y); c.scale(-1, 1); c.translate(-x, -y); } drawSprite(c, PROPS[f.prop], x, y, (f.s || 1) * zk * ap);
  } else if (f.zz) {
    const [x, y] = fxPos(f, cam, s, states); for (let k = 0; k < 3; k++) { const q = (u * .6 + k / 3) % 1; c.globalAlpha = Math.sin(q * Math.PI) * out; c.font = `700 ${40 + k * 10}px Fredoka`; c.fillStyle = '#5b7ea8'; c.fillText('z', x + q * 60 + k * 20, y - q * 110); }
  } else if (f.title) {   // the story title painted on the clouds (sky layer)
    const [x, y, zk] = w2s(cam, .2, f.x || 0, f.y || -380);
    const p = seg(u, 0, 1.6);
    withSeed(9, () => { for (let k = 0; k < 9; k++) softBlob(c, x + (k - 4) * 95, y + Math.sin(k) * 14, 120, 70, pick(['#f6dca0', '#f2c87a', '#ffe8b0']), .55 * ss(seg(u, 0, .8)) * out, .4); });
    c.save(); c.beginPath(); c.rect(x - 700, y - 200, 1400 * eio(p), 400); c.clip();
    c.globalAlpha = out; c.font = 'italic 700 168px "Cormorant Garamond"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 16; c.strokeStyle = 'rgba(255,248,232,.8)'; c.lineJoin = 'round'; c.strokeText(f.text, x, y); c.fillStyle = INKC; c.fillText(f.text, x, y);
    c.globalAlpha = .35 * out; c.fillStyle = '#8a5a2a'; c.fillText(f.text, x + 2, y + 3);
    c.restore();
  } else if (f.typed) {   // letters typed one by one
    const [x, y] = f.sky ? w2s(cam, .2, f.x || 0, f.y || -250) : [f.x, f.y];
    const n = Math.floor(clamp(u / (f.speed || 2.0)) * f.typed.length + .001);
    c.globalAlpha = out; c.font = `700 ${f.size || 64}px Caveat`; c.textAlign = 'left'; c.textBaseline = 'middle';
    const tw = c.measureText(f.typed).width, sx = x - tw / 2;
    c.lineWidth = 10; c.strokeStyle = 'rgba(255,248,232,.75)'; c.lineJoin = 'round'; c.strokeText(f.typed.slice(0, n), sx, y); c.fillStyle = f.col || INKC; c.fillText(f.typed.slice(0, n), sx, y);
  }
  c.restore();
}
// every on-screen text at t (for readcheck): full text from the first visible frame
function textsAt(t) {
  const out = [];
  const card = cardAt(t); if (card) return cardTexts(card, t);
  const s = TL.shots[shotAt(t)]; if (!s) return out;
  if (s.kind === 'moral') return moralTexts(s, t);
  if (s.kind === 'end') return endTexts(s, t);
  const cam = camAt(s, t);
  for (const f of s.fx || []) {
    if (!fxAlive(f, t)) continue;
    const id = (f.sw || f.bub || f.label || f.typed || f.text || '') + '@' + f.t.toFixed(2);
    if (f.sw) { const [x, y] = f.world ? [f.x, f.y] : w2s(cam, f.layer ?? 1, f.x, f.y); const w = f.sw.length * (f.size || 120) * .3; out.push({ id, text: f.sw, x0: x - w, y0: y - 60, x1: x + w, y1: y + 60 }); }
    else if (f.label) { const st = s.cast && f.on ? null : null; const [x, y] = f.on ? labelAnchor(f, s, t, cam) : w2s(cam, f.layer ?? 1, f.x, f.y); const lx = x + (f.lx ?? -220), ly = y + (f.ly ?? -160); const w = f.label.length * 17; out.push({ id, text: f.label, x0: lx - w, y0: ly - 40, x1: lx + w, y1: ly + 40 }); }
    else if (f.bub) out.push({ id, text: f.bub, x0: 200, y0: 200, x1: 600, y1: 300 });
    else if (f.title) { const [x, y] = w2s(cam, .2, f.x || 0, f.y || -380); out.push({ id, text: f.text, x0: x - 500, y0: y - 80, x1: x + 500, y1: y + 80 }); }
    else if (f.typed) { const [x, y] = f.sky ? w2s(cam, .2, f.x || 0, f.y || -250) : [f.x, f.y]; out.push({ id, text: f.typed, x0: x - 300, y0: y - 40, x1: x + 300, y1: y + 40 }); }
  }
  return out.filter(o => o.x0 > -50 && o.x1 < W + 50 && o.y0 > -50 && o.y1 < H + 50).map(o => Object.assign(o, { x0: Math.max(0, o.x0), x1: Math.min(W, o.x1), y0: Math.max(0, o.y0), y1: Math.min(H, o.y1) }));
}

// ---------------- the moral card ----------------
const MORAL = 'A little kindness can come back to you in a big way.';
function drawMoral(c, s, t) {
  const u = t - s.t0;
  const zm = 1 + .07 * ss(seg(t, s.t0, s.t1)); c.translate(W / 2, H / 2); c.scale(zm, zm); c.translate(-W / 2, -H / 2);
  cardPaper(c, '#e8cfa4');
  // warm glow and the two halves of the loaf, painted in
  c.save(); c.globalCompositeOperation = 'source-over'; softBlob(c, W / 2, 400, 520, 260, '#ffd98a', .35, .3); c.restore();
  const p = seg(u, .2, 2.2);
  c.save(); c.globalAlpha = ss(p);
  c.translate(W / 2 - 200 - 50 * ss(seg(u, 2.4, 3.6)), 390); c.rotate(-.12); drawSprite(c, PROPS.breadHalf, 0, 0, 6.2 * (.9 + .1 * ss(p))); c.restore();
  c.save(); c.globalAlpha = ss(p); c.translate(W / 2 + 200 + 50 * ss(seg(u, 2.4, 3.6)), 390); c.scale(-1, 1); c.rotate(-.12); drawSprite(c, PROPS.breadHalf, 0, 0, 6.2 * (.9 + .1 * ss(p))); c.restore();
  withSeed(3, () => { for (let k = 0; k < 4; k++) { const q = (u * .3 + k / 4) % 1; c.save(); c.globalAlpha = Math.sin(q * Math.PI) * .5 * ss(p); brush(c, qcurve(W / 2 - 60 + k * 40, 300 - q * 60, W / 2 - 50 + k * 40 + Math.sin(u + k) * 14, 230 - q * 80, 12, 6), 5, '#fff6e6', { prof: 'tip', nb: 0 }); c.restore(); } });
  // the moral, revealed word by word as the narrator says it
  const L = lineById('L177'), words = L.words.slice(1);   // skip "Moral:"
  const lines = ['A little kindness can come back', 'to you in a big way.'];
  c.save(); c.font = 'italic 700 104px "Cormorant Garamond"'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = INKC;
  let wi = 0;
  lines.forEach((ln, li) => { const tw = c.measureText(ln).width; let x = W / 2 - tw / 2; const y = 735 + li * 120;
    for (const w of ln.split(' ')) { const ww = words[wi++]; const a = ww ? ss(seg(t, ww[1] - .08, ww[1] + .25)) : 1; c.globalAlpha = a; c.fillText(w, x, y + (1 - a) * 10); x += c.measureText(w + ' ').width; } });
  c.restore();
  withSeed(5, () => drawS(c, mk(qcurve(W / 2 - 420, 905, W / 2 + 420, 900, -8, 20), 6, '#c8443a', { prof: 'even', nb: 3, a: .8 }), seg(t, L.t1, L.t1 + .8)));
}
function moralTexts(s, t) { const L = lineById('L177'); if (t < L.words[1][1] - .1) return []; return [{ id: 'moral', text: MORAL, x0: 300, y0: 660, x1: 1620, y1: 880 }]; }

// ---------------- the end card ----------------
function drawEndCard(c, s, t) {
  const u = t - s.t0, a = ss(seg(u, .4, 1.4));
  c.save(); c.globalAlpha = a;
  c.font = 'italic 700 120px "Cormorant Garamond"'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = 14; c.strokeStyle = 'rgba(40,24,14,.55)'; c.lineJoin = 'round'; c.strokeText('Lantern and Page', 1220, 330);
  c.fillStyle = '#f6e2b0'; c.fillText('Lantern and Page', 1220, 330);
  c.restore();
  withSeed(8, () => drawS(c, mk(qcurve(900, 410, 1540, 404, -6, 20), 7, '#f2b94b', { prof: 'even', nb: 3, a: .9 }), seg(u, 1.2, 2.2)));
  c.save(); c.globalAlpha = ss(seg(u, 2.0, 2.8)); c.font = '700 64px Caveat'; c.textAlign = 'center'; c.fillStyle = '#f4e7cc'; c.fillText('Thank you for reading with us.', 1220, 488); c.restore();
}
function endTexts(s, t) { const u = t - s.t0; const o = []; if (u > .4) o.push({ id: 'endA', text: 'Lantern and Page', x0: 820, y0: 260, x1: 1620, y1: 400 }); if (u > 2.0) o.push({ id: 'endB', text: 'Thank you for reading with us.', x0: 860, y0: 450, x1: 1580, y1: 520 }); return o; }

// effects drawn behind the characters (in layer coords): an open doorway, a door swinging
function drawPre(c, f, t, cam, L) {
  const u = t - f.t;
  if (f.door) {   // the ogre's door opening inward: dark doorway + narrowing panel at the hinge
    const o = ss(seg(u, 0, f.open || 1.6)) * (f.close ? 1 - ss(seg(t, f.t2 - .8, f.t2)) : 1);
    c.save(); c.beginPath(); c.moveTo(-150, 300); c.lineTo(-150, 40); c.lineTo(-90, -40); c.lineTo(0, -70); c.lineTo(90, -40); c.lineTo(150, 40); c.lineTo(150, 300); c.closePath();
    c.fillStyle = '#6a4a30'; c.fill(); c.clip();
    c.fillStyle = rgba('#1e1418', o); c.fillRect(-160, -80, 320, 390);
    if (f.glow) { c.globalAlpha = o; softBlob(c, 0, 150, 160, 160, '#ff9a3a', .25, .3); }
    const w = 300 * (1 - o * .92); c.globalAlpha = 1;
    c.fillStyle = '#6a4a30'; c.fillRect(-150, -80, w, 390); c.fillStyle = 'rgba(40,24,14,.35)'; c.fillRect(-150 + w - 8, -80, 8, 390);
    c.restore();
  }
}

function labelAnchor(f, s, t, cam) { const cs = (s.cast || []).find(c => c.id === f.on); if (!cs) return [W / 2, H / 2]; const st = castState(cs, t, s); const [wx, wy] = partPos(f.on, st, f.part || 'head'); return w2s(cam, cs.ly ?? 1, wx + (f.dx || 0), wy + (f.dy || 0)); }

function contentBox(spr) {   // tight bounds of painted pixels, in the sprite's local units
  const c = spr.cv.getContext('2d'), w = spr.cv.width, h = spr.cv.height, d = c.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 <= x0) return [spr.x0, spr.y0, spr.x1, spr.y1];
  return [spr.x0 + x0 / spr.r, spr.y0 + y0 / spr.r, spr.x0 + x1 / spr.r, spr.y0 + y1 / spr.r];
}
