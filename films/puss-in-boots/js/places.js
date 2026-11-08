// Locations: layered painted worlds. Layer coords: the camera at (0,0,z=1) shows x∈[-960,960], y∈[-540,540] on every layer.
// A layer with parallax k is drawn at screen = W/2 + (x - cx*k) * z^k (same for y).
// Each layer: { k, b:[x0,y0,x1,y1] painted bounds, res, paint(c), items:[{spr,x,y,sway,ph}], live(c,t,P), haze }
const LOC = {};
const LOCDEF = {};

function buildLoc(id) {
  if (LOC[id]) return LOC[id];
  const def = LOCDEF[id]; if (!def) throw new Error('no location ' + id);
  const loc = { id, layers: [], marks: def.marks || {}, grade: def.grade, def };
  withSeed(hashStr('loc' + id), () => {
    for (const ld of def.layers) {
      const L = { k: ld.k, name: ld.name, items: [], front: !!ld.front, live: ld.live, alpha: ld.alpha, b: ld.b, res: ld.res || (ld.k >= 1 ? 1 : ld.k > .5 ? .8 : .6) };
      if (ld.paint) {
        const [x0, y0, x1, y1] = ld.b;
        L.spr = canvasSprite(x0, y0, x1, y1, L.res, c => ld.paint(c, L));
        if (ld.haze) haze(L.spr.cv, ld.haze[0], ld.haze[1]);
      }
      if (ld.items) ld.items(L);
      loc.layers.push(L);
    }
  });
  LOC[id] = loc;
  return loc;
}
// a swaying item: paint fn in local coords around its base (0,0); bounds [x0,y0,x1,y1]
function item(L, x, y, b, fn, o = {}) {
  const spr = canvasSprite(b[0], b[1], b[2], b[3], o.res || L.res || 1, fn);
  if (o.haze) haze(spr.cv, o.haze[0], o.haze[1]);
  const it = { spr, x, y, sway: o.sway || 0, ph: rnd(0, 6.28), sc: o.sc || 1, wave: o.wave, rot: o.rot, flip: o.flip, front: o.front };
  L.items.push(it); return it;
}
function drawItems(c, L, t, front = false) {
  for (const it of L.items) {
    if (it.hide || !!it.front !== front) continue;
    c.save(); c.translate(it.x, it.y);
    if (it.sway) { const sk = it.sway * (Math.sin(1.15 * t + it.ph) + .4 * Math.sin(2.7 * t + 2 * it.ph)); c.transform(1, 0, sk, 1, 0, 0); }
    if (it.rot) c.rotate(it.rot(t));
    if (it.flip) c.scale(-1, 1);
    if (it.wave) waveSprite(c, it.spr, 0, 0, t + it.ph, it.wave[0], it.wave[1], it.wave[2] || 2.2, it.wave[3] || 3);
    else drawSprite(c, it.spr, 0, 0, it.sc);
    c.restore();
  }
}
// sky gradient + painted clouds
function skyPaint(c, L, top, bot, o = {}) {
  const [x0, y0, x1, y1] = L.b;
  const g = c.createLinearGradient(0, y0, 0, o.horizon ?? y1); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let k = 0; k < 40; k++) softBlob(c, rnd(x0, x1), rnd(y0, y1), rnd(80, 300), rnd(40, 160), pick([top, bot, o.tint || bot]), rnd(.08, .2), .3);
  if (o.sun) { softBlob(c, o.sun[0], o.sun[1], 420, 420, '#fff2c8', .55, .2); softBlob(c, o.sun[0], o.sun[1], 110, 110, '#fffaf0', .8, .5); }
  for (let k = 0; k < (o.clouds ?? 7); k++) cloud(c, rnd(x0 + 100, x1 - 100), rnd(y0 + 60, (o.cloudLow ?? (y0 + y1) / 2)), rnd(220, 480), o.cloudCol || '#fff6e8', o.cloudShadow || '#e8c8b0');
}
function cloudBank(c, x, y, w) {
  for (let k = 0; k < 14; k++) { const u = k / 13; softBlob(c, x + (u - .5) * w + rnd(-20, 20), y - Math.sin(u * Math.PI) * w * .16 + rnd(-14, 14), w * rnd(.12, .2), w * rnd(.09, .13), '#fffaf2', .85, .55); }
  for (let k = 0; k < 8; k++) softBlob(c, x + rnd(-.42, .42) * w, y + w * .07, w * .16, w * .045, '#f0c0a8', .45, .45);
  for (let k = 0; k < 6; k++) { const u = rnd(.1, .9); drawS(c, mk(qcurve(x + (u - .5) * w - 40, y + w * .06, x + (u - .5) * w + 60, y + w * .06 + rnd(-3, 3), 4, 8), rnd(4, 8), '#e8b8a0', { prof: 'leaf', nb: 0, a: .35 })); }
}
function hillPaint(c, x0, x1, base, amp, col, o = {}) {
  const pts = [], seed = rnd(0, 99);
  for (let x = x0; x <= x1; x += 16) pts.push([x, base - amp * (fbm(seed + x / (o.wl || 520)) - .3) * 2 - (o.slope ? o.slope * (x - x0) : 0)]);
  pts.push([x1, o.bottom ?? base + 1200], [x0, o.bottom ?? base + 1200]);
  paint(c, pts, col, { wob: 0, a: o.a ?? .75, line: 0, edge: .6, bloom: .35, gran: .5, under: o.under, grad: o.grad });
  return pts;
}
function hillY(pts, x) { for (let i = 0; i < pts.length - 3; i++) if (pts[i + 1][0] >= x) return lerp(pts[i][1], pts[i + 1][1], (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0] || 1)); return pts[0][1]; }
// a textured meadow: gradient wash, dry-brush grass strokes, tufts, flowers, pebbles
function meadow(c, x0, x1, ytop, ybot, cols, o = {}) {
  const pts = []; const sd = rnd(0, 9); for (let x = x0; x <= x1; x += 20) pts.push([x, ytop + Math.sin(x / 240 + sd) * (o.wav ?? 10)]); pts.push([x1, ybot], [x0, ybot]);
  paint(c, pts, cols[0], { wob: 0, a: .9, line: 0, edge: .5, bloom: .6, gran: .7, grad: [cols[0], cols[1]], under: true });
  const n = Math.round((x1 - x0) * (ybot - ytop) / 9000 * (o.dens ?? 1));
  for (let k = 0; k < n; k++) { const x = rnd(x0, x1), y = rnd(ytop + 10, ybot), sc = .6 + (y - ytop) / (ybot - ytop) * 1.2;
    drawS(c, mk(polar(x, y, -Math.PI / 2 + rnd(-.5, .5), rnd(10, 26) * sc, rnd(-4, 4), 4), rnd(2, 4) * sc, pick(cols.concat([shade(cols[1], .15), shade(cols[0], -.2)])), { prof: 'tip', nb: 0, a: rnd(.35, .7) })); }
  for (let k = 0; k < n / 9; k++) softBlob(c, rnd(x0, x1), rnd(ytop, ybot), rnd(40, 140), rnd(14, 40), pick([shade(cols[0], -.25), shade(cols[1], .15), cols[2] || cols[0]]), rnd(.12, .3), .3);
  if (o.flowers) for (let k = 0; k < n / 22; k++) { const y = rnd(ytop + 20, ybot); flowers(c, rnd(x0, x1), y, .5 + (y - ytop) / (ybot - ytop), o.flowers, 3); }
  if (o.stones) for (let k = 0; k < n / 40; k++) stone(c, rnd(x0, x1), rnd(ytop + 20, ybot), rnd(5, 14), pick(['#b8a890', '#a89a88', '#c8b8a0']));
  return pts;
}
// framing foliage hanging into the frame from the top corners (foreground layers)
function cornerFoliage(c, x, y, dir, s = 1, cols) {
  cols = cols || ['#4e7a44', '#6f9a3a', '#3e6a3a', '#86a85a'];
  drawS(c, mk(qcurve(x, y, x + dir * 520 * s, y + 160 * s, -60 * s, 12), 34 * s, '#5a4030', { prof: 'trunk', nb: 6 }));
  for (let k = 0; k < 5; k++) { const bx = x + dir * (120 + k * 90) * s, by = y + (40 + k * 26) * s; drawS(c, mk(polar(bx, by, Math.PI / 2 + dir * rnd(-.6, .2), rnd(80, 160) * s, rnd(-20, 20), 6), 10 * s, '#5a4030', { prof: 'tip', nb: 3 }));
    clump(c._S = [], bx + dir * 20 * s, by + 90 * s, 110 * s, Math.round(40 * s), cols, { sx: 1.3, sy: .8, l0: 22 * s, l1: 44 * s, w0: 14 * s, w1: 26 * s, a0: .7, a1: .95 }); drawList(c, c._S); }
}
function scatter(n, x0, x1, fn) { for (let i = 0; i < n; i++) fn(rnd(x0, x1), i); }
function riverPaint(c, x0, x1, ytop, ybot, cols) {
  const top = [], bot = []; const s = rnd(0, 9);
  for (let x = x0; x <= x1; x += 20) { top.push([x, ytop + Math.sin(x / 300 + s) * 8]); bot.push([x, ybot + Math.sin(x / 260 + s * 2) * 10]); }
  const pts = top.concat(bot.reverse());
  paint(c, pts, cols[0], { wob: 2, a: .85, line: 0, edge: .6, bloom: .6, gran: .4, grad: cols, under: true, shadowSide: .15 });
  for (let k = 0; k < 140; k++) { const x = rnd(x0, x1), y = rnd(ytop + 8, ybot - 4), L = rnd(30, 120);
    drawS(c, mk(qcurve(x, y, x + L, y + rnd(-2, 2), rnd(-2, 2), 8), rnd(2, 5), pick(['#f4f8f6', '#d8ecec', cols[0]]), { prof: 'leaf', nb: 0, a: rnd(.25, .6) })); }
  return pts;
}
function waterLive(c, t, x0, x1, y0, y1, n = 40, seed = 1) {
  for (let k = 0; k < n; k++) { const u = hash(k * 1.7 + seed), v = hash(k * 3.3 + seed), x = x0 + u * (x1 - x0), y = y0 + v * (y1 - y0);
    sparkleLive(c, x + Math.sin(t * .8 + k) * 6, y, t, u * 10 + v, 5 + v * 5);
    const ph = (t * .25 + u) % 1; c.strokeStyle = `rgba(255,255,255,${.35 * Math.sin(ph * Math.PI)})`; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - 20 + ph * 30, y + 8); c.lineTo(x + 14 + ph * 30, y + 8); c.stroke(); }
}

// ======================================================================================
// THE OLD MILL BY THE RIVER — golden morning.  Ground spans x -1700..2100
LOCDEF.mill = {
  marks: { mill: [-560, 175], wheel: [-160, 40], door: [-600, 250], shack: [930, 250], bench: [1080, 300], road: [300, 330], tree: [1370, 300], river: [-200, 120] },
  layers: [
    { k: .2, name: 'sky', b: [-1500, -1500, 1500, 400], paint: (c, L) => { skyPaint(c, L, '#9ec0d4', '#fbe2b0', { sun: [-620, -330], cloudLow: -520, clouds: 6, cloudCol: '#fffaf0', cloudShadow: '#e8b8a0', horizon: 200 });
        for (const [x, y, w] of [[-60, -420, 900], [-520, -340, 560], [430, -330, 620], [0, -260, 700]]) cloudBank(c, x, y, w); },
      live: (c, t) => birdsLive(c, t, -1500, -380, 4, { speed: 32, span: 3000, col: '#6a5a5a' }) },
    { k: .35, name: 'far', b: [-1800, -460, 2000, 600], haze: ['#f2e0c0', .38], paint: (c, L) => {
      const h1 = hillPaint(c, -1800, 2000, -170, 110, '#9aac7a', { wl: 700, grad: ['#a8b884', '#8aa070'] });
      for (let k = 0; k < 40; k++) { const x = rnd(-1700, 1900), y = hillY(h1, x) + rnd(20, 160); paint(c, [[x - 70, y], [x + 70, y - 10], [x + 80, y + 34], [x - 60, y + 40]], pick(['#c8c87a', '#a8c070', '#d8c890', '#b0b868']), { wob: 2, a: .45, line: 0, edge: .7, bloom: .2 }); }
      for (let k = 0; k < 34; k++) { const x = rnd(-1700, 1900); treeRound(c, x, hillY(h1, x) + rnd(14, 60), rnd(.25, .38), { greens: ['#7a9a5a', '#8aaa6a', '#6a8a4a', '#9ab87a'] }); }
      const cx = 1250, cy = hillY(h1, 1250) + 6; for (const [dx, w, h] of [[-50, 40, 120], [0, 70, 90], [55, 36, 140]]) tower(c, cx + dx, cy, w * .9, h * .8, '#d8ccc4', '#8a6aa0', { win: 1, rk: 1.1 });
      house(c, -900, hillY(h1, -900) + 50, 80, 50, { roof: '#c8643a', windows: 1 }); house(c, 500, hillY(h1, 500) + 70, 70, 46, { roof: '#b8583a', windows: 1 });
      hillPaint(c, -1800, 2000, -30, 70, '#94ae62', { wl: 400, a: .75 }); } },
    { k: .6, name: 'mid', b: [-2000, -350, 2400, 700], haze: ['#f6e6c8', .14], paint: (c, L) => {
      const bank = hillPaint(c, -2000, 2400, 40, 40, '#86a84a', { wl: 500, a: .9 });
      scatter(18, -1900, 2300, x => treeWillow(c, x, hillY(bank, x) + 14, rnd(.55, .8)));
      scatter(16, -1900, 2300, x => treeRound(c, x, hillY(bank, x) + 16, rnd(.5, .75), { greens: ['#5f8a32', '#78a040', '#4e7a2e', '#98b850'] }));
      riverPaint(c, -2000, 2400, 100, 230, ['#8cc4c8', '#5a9aa8']); },
      live: (c, t) => waterLive(c, t, -1400, 1800, 120, 220, 50, 3) },
    { k: 1, name: 'ground', b: [-1900, -620, 2300, 900], paint: (c, L) => {
      meadow(c, -1900, 2300, 196, 900, ['#9cc050', '#6f9a36', '#b8c860'], { flowers: ['#f2c94a', '#f4f0f8', '#e8828a', '#d8323a'], stones: true, dens: 1.2 });
      // the millrace under the wheel
      paint(c, catmull([[-360, 150], [60, 140], [80, 200], [60, 252], [-360, 256]], true, 5), '#6aaab4', { under: true, wob: 2, a: .9, line: 0, edge: .6, bloom: .8, grad: ['#8cc8cc', '#4a8a9a'] });
      const path = [[-1900, 300], [-400, 285], [400, 300], [1300, 290], [2300, 305], [2300, 390], [1300, 380], [400, 395], [-400, 382], [-1900, 394]];
      paint(c, catmull(path, true, 6), '#dcc89c', { wob: 3, a: .85, line: 0, edge: .7, bloom: .6, gran: .8 });
      for (const off of [318, 366]) brush(c, qcurve(-1900, off, 2300, off + 6, 10, 60), 5, '#b8a47a', { prof: 'even', nb: 3, a: .5 });
      scatter(50, -1800, 2200, x => stone(c, x, rnd(292, 392), rnd(4, 11), pick(['#b8a890', '#a89a88'])));
      // the mill: stone base, timber top, red-brown roof
      stoneWall(c, [[-820, 250], [-820, 20], [-330, 20], [-330, 250]], '#c8b496', { bh: 30, moss: 8 });
      paint(c, [[-800, 30], [-800, -190], [-350, -190], [-350, 30]], '#d0a050', { under: true, wob: 1.5, line: 1.8, bloom: .9, gran: .7, shadowSide: .5 });
      for (let k = 0; k < 9; k++) brush(c, qcurve(-790 + k * 55, 28, -792 + k * 55, -186, 0, 8), 4, '#a8783a', { prof: 'even', nb: 2, a: .5 });
      pencilRect(c, -800, -190, 450, 220, { a: .25 }); pencil(c, [[-860, -180], [-575, -400], [-305, -180]], { a: .25 });
      roofTiles(c, [[-860, -180], [-575, -400], [-305, -180]], '#b05a3a', 7);
      windowPane(c, -720, -140, 54, 64, { shutters: '#6a8a5a', box: ['#d8323a', '#f2c94a'] }); windowPane(c, -480, -140, 54, 64, { shutters: '#6a8a5a', box: ['#e8828a', '#f4f0f8'] });
      paint(c, [[-640, 250], [-640, 120], [-600, 92], [-560, 120], [-560, 250]], '#7a4a2e', { under: true, wob: 1, line: 1.6, bloom: .6 });
      paint(c, [[-340, -40], [-150, -40], [-150, -20], [-340, -20]], '#8a6a40', { under: true, wob: 1, line: 1.4 });
      for (let k = 0; k < 6; k++) softBlob(c, -800 + k * 80, 20, 30, 14, '#7a9a4a', .55, .5);
      sack(c, -890, 260, 1.1); sack(c, -850, 282, .9, '#f2ece0'); sack(c, -930, 290, .8, '#f2ece0'); barrel(c, -290, 270, 1); barrel(c, -250, 292, .9);
      // Tom's shack: patched roof, crooked door
      paint(c, [[760, 250], [760, 40], [1100, 40], [1100, 250]], '#c0a070', { under: true, wob: 2.5, line: 1.8, bloom: .8, gran: .8, shadowSide: .55 });
      for (let k = 0; k < 8; k++) brush(c, qcurve(768 + k * 44, 248, 766 + k * 44 + rnd(-4, 4), 44, 0, 6), 3, '#8a6a4a', { prof: 'even', nb: 2, a: .5 });
      roofTiles(c, [[730, 52], [930, -110], [1130, 52]], '#8a7a5a', 5);
      paint(c, [[860, -40], [910, -50], [915, -10], [865, -4]], '#a0904a', { under: true, wob: 1, line: 1.2 }); paint(c, [[990, 0], [1040, -6], [1046, 26], [994, 30]], '#7a8a5a', { under: true, wob: 1, line: 1.2 });
      paint(c, [[880, 250], [880, 110], [960, 104], [962, 250]], '#6a4a30', { under: true, wob: 1.5, line: 1.6, bloom: .5 });
      windowPane(c, 1000, 100, 46, 50, {});
      paint(c, [[1020, -100], [1020, -40], [1052, -40], [1052, -100]], '#9a6a50', { under: true, wob: 1, line: 1.2 });
      paint(c, [[1000, 282], [1160, 282], [1160, 294], [1000, 294]], '#8a6a40', { under: true, wob: 1, line: 1.3 });
      for (const x of [1012, 1148]) brush(c, qcurve(x, 294, x, 322, 0, 3), 7, '#6a4a30', { prof: 'even', nb: 2 });
      brush(c, qcurve(1110, 60, 1300, 90, 20, 10), 2, '#6a5040', { prof: 'even', nb: 0, a: .8 });
      for (const [x, col] of [[1150, '#e8828a'], [1200, '#f4f0f8'], [1250, '#7aa0c8']]) paint(c, [[x - 18, 70 + (x - 1110) * .15], [x + 18, 70 + (x - 1110) * .15], [x + 14, 120 + (x - 1110) * .15], [x - 14, 120 + (x - 1110) * .15]], col, { under: true, wob: 1, line: 1.1 });
      fence(c, -300, 600, 280, 64, '#8a6a4a', 100); fence(c, 1180, 2100, 286, 60, '#8a6a4a', 110);
      scatter(40, -1800, 2200, x => tuft(c, x, rnd(220, 300), rnd(.7, 1.1)));
      scatter(22, -1800, 2200, x => flowers(c, x, rnd(240, 300), rnd(.7, 1), ['#f2c94a', '#f4f0f8', '#e8828a', '#d8323a'], 4));
      pot(c, -600, 262, .9, ['#d8323a', '#f2c94a']); pot(c, 850, 262, .8, ['#e8828a', '#f4f0f8']);
      bush(c, -1050, 290, 1, { greens: ['#4e7a44', '#6f9a3a', '#86a85a'], flowers: ['#f4f0f8', '#f2c94a'], under: true }); bush(c, 640, 290, .8, { greens: ['#4e7a44', '#6f9a3a', '#86a85a'], berries: '#d8323a', nb: 10, under: true }); },
      items: L => {
        L.wheel = item(L, -160, 40, [-190, -190, 190, 190], c => drawSprite(c, millWheelSprite(150)), { rot: t => t * .45 });
        item(L, 1400, 300, [-280, -580, 280, 30], c => treeRound(c, 0, 0, 1.45, { greens: ['#5f8a32', '#78a040', '#4e7a2e', '#98b850'] }), { sway: .005 });
        item(L, -1320, 280, [-240, -500, 240, 30], c => treeRound(c, 0, 0, 1.2, { greens: ['#5f8a32', '#78a040', '#4e7a2e', '#98b850'], fruit: '#e8a83a', nf: 10 }), { sway: .006 });
      },
      live: (c, t) => { smokeLive(c, 1036, -110, t, { n: 7, h: 260 }); waterLive(c, t, -340, 40, 160, 240, 14, 9);
        for (let k = 0; k < 8; k++) { const ph = (t * 1.6 + k / 8) % 1; softBlob(c, -160 + (k - 4) * 26, 180 - Math.sin(ph * Math.PI) * 40, 12, 10, '#f0fafa', .6 * (1 - ph), .5); }
        motesLive(c, t, -700, -400, 900, 500, 26); } },
    { k: 1.35, name: 'fg', b: [-2500, -1100, 2900, 1000], paint: (c, L) => {
      paint(c, [[-2500, 690], [2900, 680], [2900, 1000], [-2500, 1000]], '#6f9a36', { wob: 6, a: .55, line: 0, edge: .4, bloom: .4, under: false });
      scatter(70, -2400, 2800, x => tuft(c, x, rnd(600, 800), rnd(1.5, 2.4), ['#6f9a36', '#86ae40', '#5a8a2e', '#9cc050']));
      scatter(22, -2400, 2800, x => flowers(c, x, rnd(640, 800), rnd(1.5, 1.9), ['#d8323a', '#f2c94a', '#f4f0f8', '#e8828a'], 4));
      reeds(c, -1550, 740, 1.7, 12); reeds(c, 2400, 740, 1.7, 10);
      cornerFoliage(c, -2500, -1000, 1, 1.4); cornerFoliage(c, 2900, -1060, -1, 1.2); } },
  ],
  grade: (c, t) => { const g = c.createRadialGradient(W * .25, -H * .1, 0, W * .25, 0, W * .9); g.addColorStop(0, 'rgba(255,220,150,.14)'); g.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); sunbeams(c, 0, -60, .7, 1400, 110, 3, .035, t); },
};

// ======================================================================================
// FOREST EDGE — deep greens, bright red berries
LOCDEF.forest = {
  marks: { bush: [-120, 300], bush2: [520, 300], path: [0, 330] },
  layers: [
    { k: .2, name: 'sky', b: [-1300, -900, 1300, 400], paint: (c, L) => skyPaint(c, L, '#dfe8c8', '#f4f0d8', { clouds: 3, sun: [200, -380], cloudLow: -300 }) },
    { k: .3, name: 'far', b: [-1500, -700, 1500, 600], haze: ['#dfe8c8', .55], paint: (c, L) => {
      for (let k = 0; k < 26; k++) treePine(c, rnd(-1500, 1500), rnd(80, 140), rnd(1.1, 1.6), { cols: ['#5a7a6a', '#6a8a72', '#4e6a5a'] });
      hillPaint(c, -1500, 1500, 150, 30, '#7a9a6a', { a: .7 }); } },
    { k: .6, name: 'mid', b: [-1800, -800, 1800, 700], haze: ['#e8ecd0', .22], paint: (c, L) => {
      for (let k = 0; k < 14; k++) { const x = rnd(-1700, 1700); drawS(c, mk(qcurve(x, 200, x + rnd(-10, 10), -600, rnd(-20, 20), 10), rnd(30, 50), '#5a4a3a', { prof: 'trunk', nb: 6 })); }
      for (let k = 0; k < 10; k++) treeRound(c, rnd(-1700, 1700), 210, rnd(1.4, 1.9), { greens: ['#2f5a3a', '#3e6a44', '#4e7a50', '#5a8a4a'], dense: 1.3 });
      hillPaint(c, -1800, 1800, 210, 20, '#4e7a44', { a: .8 }); } },
    { k: 1, name: 'ground', b: [-1600, -700, 1600, 900], paint: (c, L) => {
      meadow(c, -1600, 1600, 220, 900, ['#6f9a42', '#3e6a34', '#86a84a'], { flowers: ['#f4f0f8', '#f2c94a', '#d8323a'], stones: true, dens: 1.3 });
      paint(c, catmull([[-1600, 310], [-300, 300], [400, 312], [1600, 300], [1600, 372], [400, 386], [-300, 372], [-1600, 384]], true, 6), '#b8a478', { wob: 3, a: .65, line: 0, edge: .7, bloom: .5, gran: .7 });
      // big trunk left, mossy stones, mushrooms, ferns
      const tr = mk(qcurve(-980, 330, -940, -700, -30, 10), 120, '#6a5040', { prof: 'trunk', nb: 9 }); drawS(c, tr); drawS(c, edgeOf(tr, 1, 6, '#3a2a20', .7));
      for (let k = 0; k < 10; k++) softBlob(c, -1000 + rnd(-30, 30), rnd(-200, 300), 24, 14, '#6f8a4a', .55, .5);
      stone(c, 380, 300, 50, '#8a8a7a', { moss: true }); stone(c, -600, 320, 34, '#9a9a8a', { moss: true }); stone(c, 900, 312, 40, '#8a8a7a', { moss: true });
      for (const [x, y] of [[-480, 316], [-450, 324], [820, 316], [1100, 320]]) { brush(c, qcurve(x, y, x, y - 22, 0, 3), 7, '#f4ead2', { prof: 'even', nb: 0 }); paint(c, catmull([[x - 18, y - 20], [x, y - 36], [x + 18, y - 20]], true, 4), '#d8323a', { under: true, wob: .5, line: 1.1, bloom: .8 }); for (let k = 0; k < 3; k++) softBlob(c, x - 8 + k * 8, y - 26, 2.2, 2.2, '#fff6ea', .95, .7); }
      scatter(16, -1500, 1500, x => fern(c, x, rnd(230, 290), rnd(.7, 1.1)));
      scatter(30, -1500, 1500, x => tuft(c, x, rnd(240, 300), rnd(.6, 1), ['#4e7a44', '#6f9a3a', '#3e6a3a'])); },
      items: L => {
        item(L, -120, 300, [-200, -200, 200, 20], c => bush(c, 0, 0, 1.8, { berries: '#d8323a', nb: 40, greens: ['#2f5a3a', '#4e7a44', '#6f9a3a', '#3e6a44'] }), { sway: .008 });
        item(L, 520, 305, [-200, -200, 200, 20], c => bush(c, 0, 0, 1.6, { berries: '#d8323a', nb: 34, greens: ['#2f5a3a', '#4e7a44', '#6f9a3a', '#3e6a44'] }), { sway: .008 });
        item(L, 1150, 300, [-200, -200, 200, 20], c => bush(c, 0, 0, 1.4, { berries: '#c82a3a', nb: 26, greens: ['#2f5a3a', '#4e7a44', '#6f9a3a'] }), { sway: .008 });
        item(L, -560, 290, [-150, -150, 150, 20], c => bush(c, 0, 0, 1.1, { greens: ['#3e6a44', '#5a8a4a', '#86a85a'] }), { sway: .01 });
      },
      live: (c, t) => { butterflyLive(c, t, 200, -60, '#f2c94a', 1); butterflyLive(c, t, -300, 20, '#f4f0f8', 4); sunbeams(c, 300, -700, 1.9, 1200, 90, 3, .09, t);
        for (let k = 0; k < 5; k++) { const ph = (t * .08 + k / 5) % 1; const x = -800 + k * 380 + Math.sin(t + k) * 60, y = -500 + ph * 900; c.save(); c.translate(x, y); c.rotate(t * 2 + k); paint ? 0 : 0; c.fillStyle = rgba(pick ? ['#6f9a3a', '#c8a03a', '#8eae4a'][k % 3] : '#6f9a3a', .7 * Math.sin(ph * Math.PI)); c.beginPath(); c.ellipse(0, 0, 9, 4, 0, 0, TAU); c.fill(); c.restore(); } } },
    { k: 1.35, name: 'fg', b: [-2200, -900, 2200, 1000], paint: (c, L) => {
      paint(c, [[-2200, 700], [2200, 690], [2200, 1000], [-2200, 1000]], '#3e6a34', { wob: 6, a: .6, line: 0, edge: .4, bloom: .3 });
      scatter(16, -2100, 2100, x => fern(c, x, rnd(700, 860), rnd(2, 2.8), pick(['#2f5a3a', '#3e6a44', '#4e7a44'])));
      scatter(30, -2100, 2100, x => tuft(c, x, rnd(700, 860), rnd(1.6, 2.4), ['#3e6a34', '#4e7a44', '#5f8a42']));
      for (const x of [-1500, 1600]) { brush(c, qcurve(x, 860, x, 820, 0, 3), 26, '#f4ead2', { prof: 'even', nb: 0 }); paint(c, catmull([[x - 60, 826], [x, 760], [x + 60, 826]], true, 4), '#d8323a', { under: true, wob: 1, line: 2, bloom: .9 }); for (let k = 0; k < 4; k++) softBlob(c, x - 30 + k * 20, 800, 6, 6, '#fff6ea', .95, .7); }
      for (const sd of [-1, 1]) for (let k = 0; k < 40; k++) drawS(c, mk(polar(sd * rnd(1150, 1700), rnd(-900, -500), Math.PI / 2 + rnd(-.4, .4), rnd(80, 220), rnd(-20, 20), 6), rnd(16, 26), pick(['#2f5a3a', '#3e6a44', '#4e7a50']), { prof: 'leaf', nb: 3, a: .85 })); } },
  ],
  grade: (c) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(40,80,50,.12)'); g.addColorStop(1, 'rgba(20,50,30,.18)'); c.fillStyle = g; c.fillRect(0, 0, W, H); },
};

// ======================================================================================
// THE HILL ROAD TO THE KING'S CASTLE
LOCDEF.hill = {
  marks: { road: [0, 320], gate: [560, -40] },
  layers: [
    { k: .2, name: 'sky', b: [-1300, -1000, 1300, 400], paint: (c, L) => skyPaint(c, L, '#c8b8d8', '#f4e2d0', { sun: [500, -380], cloudLow: -200, cloudCol: '#fbeee8', cloudShadow: '#d8b8c8' }),
      live: (c, t) => birdsLive(c, t, -1300, -360, 3, { speed: 36, span: 2600 }) },
    { k: .3, name: 'far', b: [-1500, -300, 1500, 600], haze: ['#e8dce8', .5], paint: c => { hillPaint(c, -1500, 1500, 0, 80, '#a8b088', { wl: 600 }); } },
    { k: .55, name: 'castle', b: [-1300, -900, 1500, 700], haze: ['#efe2e8', .12], paint: (c, L) => {
      const hill = hillPaint(c, -1300, 1500, 120, 60, '#98a868', { wl: 500, slope: -.05 });
      const cx = 380, cy = 60;
      stoneWall(c, [[cx - 330, cy], [cx - 330, cy - 200], [cx + 330, cy - 200], [cx + 330, cy]], '#d8cbb8', { bh: 26 }); crenels(c, cx - 336, cx + 330, cy - 200, '#d8cbb8', 22, 26);
      for (const [dx, w, h] of [[-330, 90, 340], [330, 90, 340], [-120, 80, 420], [120, 80, 420], [0, 110, 520]]) tower(c, cx + dx, cy, w, h, '#ddd0be', '#5b3a7a', { win: 2, rk: 1.3 });
      paint(c, [[cx - 50, cy], [cx - 50, cy - 110], [cx, cy - 140], [cx + 50, cy - 110], [cx + 50, cy]], '#6a4a2e', { under: true, wob: .8, line: 1.6, bloom: .6 });
      scatter(10, -1200, 1400, x => treeRound(c, x, hillY(hill, x) + 30, rnd(.4, .6), { greens: ['#6f8a3a', '#86a04a', '#5a7a32'] })); },
      items: L => { for (const [dx, h] of [[-330, 340], [330, 340], [-120, 420], [120, 420], [0, 520]]) item(L, 380 + dx, 60 - h - (dx === 0 ? 143 : dx % 330 === 0 ? 118 : 104) - 10, [-2, -2, 70, 40], c => drawSprite(c, banner(60, 30, '#b02e3a', '#e2b54a')), { wave: [5, 'right', 2, 4] }); } },
    { k: 1, name: 'ground', b: [-1500, -200, 1600, 900], paint: c => {
      meadow(c, -1500, 1600, 150, 900, ['#9cc25a', '#6f9a3a', '#b8cc6a'], { flowers: ['#9b84c4', '#f2c94a', '#f4f0f8', '#e8828a'], stones: true, dens: 1.2 });
      treeRound(c, -1100, 300, 1.3, { greens: ['#5f8a32', '#78a040', '#4e7a2e', '#98b850'] }); bush(c, -700, 280, 1, { flowers: ['#9b84c4', '#f4f0f8'], under: true }); bush(c, 1200, 250, .9, { flowers: ['#f2c94a', '#f4f0f8'], under: true });
      paint(c, catmull([[-1500, 320], [-400, 300], [400, 270], [1600, 230], [1600, 300], [400, 352], [-400, 384], [-1500, 400]], true, 6), '#d8c49a', { wob: 3, a: .75, line: 0, edge: .7, bloom: .6, gran: .7 });
      scatter(30, -1400, 1500, x => stone(c, x, rnd(300, 380) - x * .05, rnd(4, 9), '#b8a890'));
      fence(c, -1400, 1500, 250, 56, '#8a6a4a', 120);
      scatter(40, -1400, 1500, x => tuft(c, x, rnd(200, 290), rnd(.6, 1)));
      scatter(24, -1400, 1500, x => flowers(c, x, rnd(220, 290), rnd(.7, 1), ['#9b84c4', '#f2c94a', '#f4f0f8', '#e8828a'], 3)); } },
    { k: 1.35, name: 'fg', b: [-2400, -1100, 2400, 1000], paint: c => { paint(c, [[-2400, 690], [2400, 680], [2400, 1000], [-2400, 1000]], '#6f9a36', { wob: 6, a: .55, line: 0, edge: .4, bloom: .3 }); scatter(60, -2300, 2300, x => tuft(c, x, rnd(600, 800), rnd(1.4, 2.3))); scatter(20, -2300, 2300, x => flowers(c, x, rnd(620, 800), rnd(1.5, 1.9), ['#9b84c4', '#f2c94a', '#f4f0f8'], 4)); cornerFoliage(c, -2400, -1060, 1, 1.3); } },
  ],
};

// ======================================================================================
// THE THRONE ROOM — royal purple, gold, deep red
LOCDEF.throne = {
  marks: { throne: [380, 250], door: [-900, 300], carpet: [0, 320], gifts: [200, 300] },
  layers: [
    { k: .45, name: 'wall', b: [-1600, -1100, 1600, 700], paint: c => {
      const g = c.createLinearGradient(0, -1100, 0, 700); g.addColorStop(0, '#4a2f6a'); g.addColorStop(1, '#7a5a9a'); c.fillStyle = g; c.fillRect(-1600, -1100, 3200, 1800);
      for (let k = 0; k < 60; k++) softBlob(c, rnd(-1600, 1600), rnd(-1100, 700), rnd(60, 220), rnd(40, 140), pick(['#5a3a7a', '#8a6aa8', '#6d4a8a']), rnd(.1, .25), .3);
      for (let x = -1500; x < 1600; x += 520) { // tall arched windows with gold light
        paint(c, [[x - 80, 300], [x - 80, -380], [x, -480], [x + 80, -380], [x + 80, 300]], '#f6dca0', { under: true, wob: 1, line: 3, lineCol: '#3a2050', bloom: 1, gran: .3 });
        softBlob(c, x, -100, 80, 300, '#fff4d0', .55, .4);
        c.save(); c.strokeStyle = rgba('#5a3a2a', .7); c.lineWidth = 4; c.beginPath(); c.moveTo(x, -470); c.lineTo(x, 300); for (let yy = -360; yy < 300; yy += 110) { c.moveTo(x - 80, yy); c.lineTo(x + 80, yy); } c.stroke(); c.restore(); }
      for (let k = 0; k < 2; k++) brush(c, qcurve(-1600, -640 + k * 30, 1600, -640 + k * 30, 0, 40), 14, '#e2b54a', { prof: 'even', nb: 5, a: .8 }); } },
    { k: .7, name: 'columns', b: [-1900, -1200, 1900, 800], paint: c => {
      for (const x of [-1240, -720, -200, 320, 840, 1360]) {
        paint(c, [[x - 50, 520], [x - 44, -900], [x + 44, -900], [x + 50, 520]], '#c8b4d8', { under: true, wob: 1.5, line: 2, bloom: .9, gran: .6, shadowSide: .55 });
        for (let k = 0; k < 4; k++) brush(c, qcurve(x - 30 + k * 20, 500, x - 28 + k * 20, -880, 0, 12), 3, '#9a84b0', { prof: 'even', nb: 0, a: .4 });
        paint(c, [[x - 70, -900], [x + 70, -900], [x + 60, -950], [x - 60, -950]], '#e2b54a', { under: true, wob: 1, line: 1.5, bloom: .8 });
        paint(c, [[x - 70, 520], [x + 70, 520], [x + 60, 470], [x - 60, 470]], '#e2b54a', { under: true, wob: 1, line: 1.5, bloom: .8 }); } },
      items: L => { for (const x of [-980, -460, 60, 580, 1100]) item(L, x, -760, [-60, -6, 60, 330], c => drawSprite(c, banner(100, 300, '#a82a38', '#e2b54a', 'crown')), { wave: [4, 'down', 1.5, 1.2] }); },
      live: (c, t) => { sunbeams(c, -1500, -420, .95, 1400, 120, 1, .12, t); sunbeams(c, -980, -420, .95, 1400, 120, 1, .1, t + 2); sunbeams(c, 40, -420, .95, 1400, 120, 1, .1, t + 4); motesLive(c, t, -1300, -500, 2400, 900, 40); } },
    { k: 1, name: 'floor', b: [-1700, -700, 1700, 900], paint: c => {
      paint(c, [[-1700, 180], [1700, 180], [1700, 900], [-1700, 900]], '#8a6a9a', { wob: 0, a: .9, line: 0, under: true, grad: ['#9a7aa8', '#5a3a6a'], bloom: .4 });
      for (let x = -1700; x < 1700; x += 120) brush(c, qcurve(x, 180, x * 1.6, 900, 0, 6), 2, '#5a3a6a', { prof: 'even', nb: 0, a: .3 });
      paint(c, [[-1700, 270], [600, 230], [600, 300], [-1700, 420]], '#a82a38', { wob: 2, a: .9, line: 0, under: true, bloom: .6, gran: .5 });
      brush(c, qcurve(-1700, 278, 600, 236, 0, 20), 6, '#e2b54a', { prof: 'even', nb: 3, a: .9 }); brush(c, qcurve(-1700, 412, 600, 296, 0, 20), 6, '#e2b54a', { prof: 'even', nb: 3, a: .9 });
      // dais and throne
      paint(c, [[160, 290], [160, 250], [700, 250], [700, 290]], '#c8a8d8', { under: true, wob: 1, line: 1.6, bloom: .6 });
      paint(c, [[220, 250], [215, -120], [300, -200], [380, -230], [460, -200], [545, -120], [540, 250]], '#e2b54a', { under: true, wob: 1.5, line: 2.2, lineCol: '#8a6a2a', bloom: 1, gran: .5 });
      paint(c, [[260, 230], [258, -80], [380, -150], [502, -80], [500, 230]], '#a82a38', { under: true, wob: 1, line: 1.6, bloom: .8 });
      for (const [x, y] of [[300, -190], [380, -225], [460, -190]]) paint(c, ellipsePts(x, y, 12, 12, 0, 12), '#c8343a', { under: true, wob: .3, line: 1, bloom: 1 });
      for (const x of [-500, 820]) { paint(c, [[x - 16, 280], [x - 10, -40], [x + 10, -40], [x + 16, 280]], '#e2b54a', { under: true, wob: .8, line: 1.4, bloom: .8 }); paint(c, [[x - 60, -40], [x + 60, -40], [x + 40, -60], [x - 40, -60]], '#e2b54a', { under: true, wob: .8, line: 1.3 }); for (const d of [-40, 0, 40]) candle(c, x + d, -60, 1); }
      for (const x of [-1300, 1300]) { paint(c, catmull([[x - 40, 290], [x - 50, 200], [x - 30, 140], [x + 30, 140], [x + 50, 200], [x + 40, 290]], true, 5), '#e2b54a', { under: true, wob: 1, line: 1.5, bloom: .9 }); bush(c, x, 140, .9, { flowers: ['#f4f0f8', '#e8828a'], greens: ['#4e7a44', '#6f9a3a'], under: true }); } },
      live: (c, t) => { for (const x of [-500, 820]) for (const d of [-40, 0, 40]) flameLive(c, x + d, -102, 1, t, x + d); } },
    { k: 1.3, name: 'curtains', b: [-2200, -1200, 2200, 1000], paint: c => {
      for (const sd of [-1, 1]) { const x = sd * 1500;
        paint(c, catmull([[x - 260, -1200], [x + 260, -1200], [x + 220 * sd * 0 + 240, 400], [x + 180, 1000], [x - 180, 1000], [x - 240, 400]], true, 6), '#7a1e2e', { under: true, wob: 2, line: 2, bloom: .8, gran: .5 });
        for (let k = 0; k < 6; k++) brush(c, qcurve(x - 200 + k * 80, -1200, x - 210 + k * 84, 1000, 30 * Math.sin(k), 20), 8, '#5a1420', { prof: 'even', nb: 3, a: .45 });
        brush(c, qcurve(x - 240, 200, x + 240, 220, 20, 10), 16, '#e2b54a', { prof: 'even', nb: 4, a: .9 }); }
      for (let k = 0; k < 14; k++) paint(c, catmull([[-2200 + k * 320, -1200], [-2040 + k * 320, -1200], [-2050 + k * 320, -980], [-2120 + k * 320, -940], [-2190 + k * 320, -980]], true, 5), '#7a1e2e', { under: true, wob: 1.5, line: 1.6, bloom: .7 }); } },
  ],
  grade: (c, t) => { const g = c.createRadialGradient(W * .55, H * .45, 100, W * .55, H * .45, W * .8); g.addColorStop(0, 'rgba(255,220,150,.12)'); g.addColorStop(1, 'rgba(40,10,60,.22)'); c.fillStyle = g; c.fillRect(0, 0, W, H); },
};

// ======================================================================================
// THE VILLAGE AND BAKERY — warm terracotta, chimney smoke, the town crier
LOCDEF.village = {
  marks: { well: [-260, 300], bakery: [560, 300], street: [0, 330], stall: [-900, 300] },
  layers: [
    { k: .2, name: 'sky', b: [-1300, -1100, 1300, 300], paint: (c, L) => skyPaint(c, L, '#f2d0a8', '#fbecd8', { clouds: 6, cloudLow: -250, cloudCol: '#fff6ea', cloudShadow: '#f0c8a8' }) },
    { k: .35, name: 'far', b: [-1500, -800, 1500, 500], haze: ['#f8e6d0', .5], paint: c => {
      hillPaint(c, -1500, 1500, -20, 40, '#c8b890', { a: .6 });
      for (let x = -1450; x < 1450; x += rnd(90, 150)) house(c, x, rnd(20, 60), rnd(90, 140), rnd(70, 110), { roof: pick(['#c8643a', '#b8583a', '#d07a4a']), windows: 1, door: false, timber: null });
      tower(c, 300, 40, 70, 300, '#e0d0b8', '#7a5a4a', { win: 2, rk: 1.6 }); } },
    { k: .6, name: 'houses', b: [-1800, -900, 1900, 700], haze: ['#f8e6d0', .15], paint: c => {
      const xs = [-1500, -1080, -680, -260, 160, 600, 1020, 1460];
      for (const x of xs) house(c, x, 140, rnd(300, 380), rnd(240, 300), { wall: pick(['#efd9b4', '#f2e2c4', '#e8cfa8']), roof: pick(['#c8643a', '#b8583a', '#d07a4a']), timber: '#7a5a3a', chimney: true, shutters: pick(['#6a8a5a', '#5b7ea8', '#a8583a']), boxes: true, windows: 2 });
      paint(c, [[-1800, 140], [1900, 140], [1900, 700], [-1800, 700]], '#c8b090', { under: true, wob: 0, a: .9, line: 0, bloom: .4 }); },
      items: L => { for (let k = 0; k < 9; k++) { const x = -1600 + k * 400; item(L, x, -360, [-10, -10, 410, 120], c => { brush(c, qcurve(0, 0, 400, 0, -50, 20), 2, '#6a5040', { prof: 'even', nb: 0 }); for (let j = 0; j < 7; j++) { const px = 25 + j * 55, py = 40 - Math.sin((j + .5) / 7 * Math.PI) * 4; paint(c, [[px - 16, py - 10], [px + 16, py - 10], [px, py + 26]], pick(['#d8323a', '#f2c94a', '#5b7ea8', '#7a9a4a']), { under: true, wob: .5, line: 1, bloom: .6 }); } }, { wave: [3, 'right', 2, 2] }); } },
      live: (c, t) => { for (const [x, i] of [[-1420, 0], [-1000, 1], [-600, 2], [-180, 3], [240, 4], [680, 5], [1100, 6], [1540, 7]]) smokeLive(c, x, -190 - (i % 3) * 20, t + i * 1.3, { n: 6, h: 300 }); } },
    { k: 1, name: 'street', b: [-1700, -700, 1700, 900], paint: c => {
      paint(c, [[-1700, 200], [1700, 200], [1700, 900], [-1700, 900]], '#c8b494', { wob: 0, a: .9, line: 0, under: true, grad: ['#dcc8a4', '#b09878'], bloom: .5 });
      for (let k = 0; k < 40; k++) softBlob(c, rnd(-1700, 1700), rnd(220, 880), rnd(60, 160), rnd(20, 50), pick(['#c8a884', '#e0d0b0', '#b8a07a']), .3, .3);
      for (let k = 0; k < 260; k++) { const x = rnd(-1700, 1700), y = rnd(220, 880); paint(c, ellipsePts(x, y, rnd(14, 24) * (y / 600), rnd(8, 12) * (y / 600), 0, 10), pick(['#b8a080', '#c8b090', '#a89070']), { under: false, wob: .6, a: .45, line: 0, edge: .8, bloom: .3, gran: .3 }); }
      // the bakery front
      paint(c, [[260, 260], [260, -300], [880, -300], [880, 260]], '#f2dcb8', { under: true, wob: 1.5, line: 2, bloom: .8, gran: .6 });
      roofTiles(c, [[220, -290], [570, -520], [920, -290]], '#c8643a', 6);
      paint(c, [[300, -120], [840, -120], [870, -60], [270, -60]], '#e8e0d0', { under: true, wob: 1, line: 1.4 });
      for (let k = 0; k < 7; k++) paint(c, [[270 + k * 86, -60], [270 + (k + .5) * 86, -60], [270 + (k + .5) * 86 - 4, -34], [270 + k * 86 + 4, -34]], k % 2 ? '#f6f0e4' : '#c8443a', { under: true, wob: .5, line: .8 });
      windowPane(c, 640, -20, 170, 160, { lit: true }); paint(c, [[360, 260], [360, 10], [440, -20], [520, 10], [520, 260]], '#8a5a3a', { under: true, wob: 1, line: 1.6, bloom: .6 });
      basket(c, 680, 140, 1.2, '#d89a4a', 5); basket(c, 760, 140, 1.1, '#e8b86a', 4);
      // hanging sign with a loaf
      brush(c, qcurve(560, -180, 660, -180, 0, 6), 4, '#5a4030', { prof: 'even', nb: 0 }); paint(c, [[580, -176], [660, -176], [660, -110], [580, -110]], '#f6ead2', { under: true, wob: .8, line: 1.4 }); drawSprite(c, PROPS.bread, 620, -143, .5);
      // well
      stoneWall(c, catmull([[-360, 300], [-370, 200], [-160, 200], [-150, 300]], true, 3), '#a8a4ac', { bh: 24, moss: 3 });
      for (const x of [-350, -170]) brush(c, qcurve(x, 210, x, -40, 0, 6), 9, '#6a4a30', { prof: 'even', nb: 3 });
      roofTiles(c, [[-400, -30], [-260, -110], [-120, -30]], '#a8583a', 3);
      // market stall with peaches
      for (const x of [-1080, -720]) brush(c, qcurve(x, 290, x, -120, 0, 6), 8, '#6a4a30', { prof: 'even', nb: 3 });
      for (let k = 0; k < 6; k++) paint(c, [[-1110 + k * 70, -140], [-1040 + k * 70, -140], [-1040 + k * 70, -80], [-1075 + k * 70, -60], [-1110 + k * 70, -80]], k % 2 ? '#f2c94a' : '#5b7ea8', { under: true, wob: .6, line: 1 });
      paint(c, [[-1110, 160], [-690, 160], [-690, 200], [-1110, 200]], '#8a6a40', { under: true, wob: 1, line: 1.4 });
      for (let k = 0; k < 3; k++) basket(c, -1030 + k * 120, 160, 1.1, ['#f2a46a', '#d8323a', '#f2c94a'][k], 5);
      crate(c, -1180, 300, 1); crate(c, -1150, 250, .8); barrel(c, 980, 300, 1.1); sack(c, 920, 310, 1, '#f2ece0');
      for (const x of [-1500, -560, 1200, 1500]) pot(c, x, 300, 1.1, ['#d8323a', '#f2c94a', '#e8828a', '#9b84c4']); } },
    { k: 1.3, name: 'fg', b: [-2200, -1100, 2200, 1000], paint: c => {
      for (const x of [-1650, 1700]) { pot(c, x, 820, 2.4, ['#d8323a', '#f2c94a', '#f4f0f8']); }
      for (const x of [-1300, 1350]) { basket(c, x, 880, 2.6, pick(['#f2a46a', '#d8323a', '#e8c86a']), 6); }
      crate(c, -1950, 900, 2.6); barrel(c, 1950, 900, 2.4);
      for (let k = 0; k < 30; k++) drawS(c, mk(polar(rnd(-2200, 2200), -1100, Math.PI / 2 + rnd(-.3, .3), rnd(60, 160), rnd(-20, 20), 6), rnd(14, 22), pick(['#5f8a42', '#7a9a4a', '#4e7a44']), { prof: 'leaf', nb: 3, a: .8 })); },
      live: (c, t) => { for (let k = 0; k < 3; k++) { const x = -400 + k * 900 + Math.sin(t * .6 + k) * 60, y = 760 + Math.abs(Math.sin(t * 4 + k)) * -10; } } },
  ],
  grade: c => { const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,200,140,.14)'); g.addColorStop(1, 'rgba(255,230,190,.05)'); c.fillStyle = g; c.fillRect(0, 0, W, H); },
};

// ======================================================================================
// THE RIVER BY THE ROAD — cool blues and teals
LOCDEF.river = {
  marks: { water: [-300, 160], rock: [260, 230], bush: [700, 280], road: [0, 380], trees: [-1100, 260] },
  layers: [
    { k: .2, name: 'sky', b: [-1300, -1000, 1300, 300], paint: (c, L) => skyPaint(c, L, '#b8d4dc', '#eef2e4', { clouds: 6, cloudLow: -260, cloudCol: '#fbfcf8', cloudShadow: '#c8d4dc' }),
      live: (c, t) => birdsLive(c, t, -1300, -380, 3, { speed: 44, span: 2600, col: '#4a5a6a' }) },
    { k: .35, name: 'far', b: [-1500, -500, 1500, 500], haze: ['#e0ecec', .5], paint: c => { const h = hillPaint(c, -1500, 1500, -10, 60, '#7a9a8a', { a: .7 }); scatter(24, -1450, 1450, x => treeRound(c, x, hillY(h, x) + 16, rnd(.35, .5), { greens: ['#5a8a7a', '#6a9a8a', '#4e7a6a'] })); } },
    { k: .6, name: 'farbank', b: [-1800, -500, 1800, 600], haze: ['#e8f0ec', .2], paint: c => {
      const b = hillPaint(c, -1800, 1800, 40, 30, '#7a9a5a', { a: .85 });
      scatter(10, -1700, 1700, x => treeWillow(c, x, hillY(b, x) + 10, rnd(.6, .8)));
      scatter(18, -1700, 1700, x => reeds(c, x, hillY(b, x) + 24, .7, 6)); } },
    { k: 1, name: 'ground', b: [-1700, -300, 1700, 900], paint: c => {
      riverPaint(c, -1700, 1700, 40, 250, ['#5f9aa8', '#3e7a8a']);
      meadow(c, -1700, 1700, 250, 900, ['#94b85a', '#6f9a40', '#a8c06a'], { flowers: ['#f4f0f8', '#9b84c4', '#f2c94a'], stones: true, dens: 1.1 });
      paint(c, catmull([[-1700, 350], [0, 340], [1700, 352], [1700, 440], [0, 430], [-1700, 444]], true, 6), '#d8c49a', { wob: 3, a: .8, line: 0, edge: .7, bloom: .6, gran: .7 });
      scatter(30, -1600, 1600, x => stone(c, x, rnd(350, 440), rnd(4, 9), '#b8a890'));
      stone(c, 260, 262, 74, '#8d8a86', { moss: true }); stone(c, 360, 268, 36, '#9a9690');
      scatter(20, -1600, 1600, x => tuft(c, x, rnd(260, 330), rnd(.7, 1.1), ['#6f9a3a', '#86a85a', '#5f8a32']));
      scatter(10, -1600, 1600, x => flowers(c, x, rnd(270, 330), .8, ['#f4f0f8', '#9b84c4', '#f2c94a'], 3));
      reeds(c, -900, 260, 1, 10); reeds(c, 1100, 262, 1, 8); },
      items: L => { L.bush = item(L, 700, 300, [-230, -240, 230, 20], c => bush(c, 0, 0, 2.2, { greens: ['#3e6a44', '#5a8a4a', '#6f9a3a', '#86a85a'], flowers: ['#f4f0f8', '#f2c94a'], under: true }), { sway: .006 });
        item(L, -1250, 300, [-260, -520, 260, 30], c => treeWillow(c, 0, 0, 1.4), { sway: .008 }); },
      live: (c, t) => waterLive(c, t, -1600, 1600, 60, 240, 70, 5) },
    { k: 1.35, name: 'fg', b: [-2300, -1100, 2300, 1000], paint: c => { paint(c, [[-2300, 700], [2300, 690], [2300, 1000], [-2300, 1000]], '#6f9a40', { wob: 6, a: .5, line: 0, edge: .4, bloom: .3 }); reeds(c, -2000, 820, 2, 14); reeds(c, 2000, 820, 2, 14); cornerFoliage(c, 2300, -1080, -1, 1.2, ['#5a8a6a', '#6f9a5a', '#4e7a54', '#86a86a']); scatter(30, -2200, 2200, x => tuft(c, x, rnd(640, 800), rnd(1.4, 2))); scatter(10, -2200, 2200, x => flowers(c, x, rnd(660, 800), 1.7, ['#f4f0f8', '#9b84c4'], 3)); } },
  ],
  grade: c => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(160,210,220,.12)'); g.addColorStop(1, 'rgba(60,120,140,.1)'); c.fillStyle = g; c.fillRect(0, 0, W, H); },
};

// ======================================================================================
// FIELDS, PASTURE AND ORCHARD — one long road (x -3000 .. 3600)
LOCDEF.fields = {
  marks: { fields: [-2000, 330], pasture: [0, 330], orchard: [2000, 330], road: [0, 360] },
  layers: [
    { k: .15, name: 'sky', b: [-1500, -1000, 1600, 300], paint: (c, L) => skyPaint(c, L, '#a8cce0', '#eef4e8', { clouds: 9, cloudLow: -220, cloudCol: '#ffffff', cloudShadow: '#c8d8e4' }),
      live: (c, t) => birdsLive(c, t, -1500, -400, 4, { speed: 30, span: 3100 }) },
    { k: .3, name: 'far', b: [-2000, -400, 2200, 500], haze: ['#e4eee8', .45], paint: c => {
      const h = hillPaint(c, -2000, 2200, -30, 90, '#9cc25a', { wl: 500 });
      // patchwork fields on the far hills
      for (let k = 0; k < 40; k++) { const x = rnd(-1900, 2100), y = hillY(h, x) + rnd(30, 140); paint(c, [[x - 60, y], [x + 60, y - 8], [x + 70, y + 30], [x - 50, y + 36]], pick(['#c8d07a', '#8eb050', '#d8c87a', '#a8c86a']), { wob: 2, a: .5, line: 0, edge: .7, bloom: .2 }); }
      scatter(30, -1900, 2100, x => treeRound(c, x, hillY(h, x) + rnd(10, 40), rnd(.22, .32), { greens: ['#6f9a3a', '#7aa04a', '#5a8a32'] }));
      house(c, 900, hillY(h, 900) + 40, 90, 60, { roof: '#c8643a', windows: 1 }); } },
    { k: .6, name: 'mid', b: [-2600, -300, 2900, 600], haze: ['#eef4e8', .15], paint: c => {
      const h = hillPaint(c, -2600, 2900, 100, 30, '#8eb04a', { a: .9 });
      for (let x = -2500; x < 2800; x += rnd(160, 260)) bush(c, x, hillY(h, x) + 20, rnd(.6, .9), { greens: ['#5f8a32', '#6f9a3a', '#86a85a'] });
      // the pasture fence and the orchard rows in the distance
      scatter(14, 900, 2800, x => treeRound(c, x, hillY(h, x) + 26, rnd(.45, .55), { fruit: '#d8323a', nf: 8, greens: ['#6f9a3a', '#86a85a', '#5a8a32'] }));
      scatter(10, -2500, 800, x => treeRound(c, x, hillY(h, x) + 26, rnd(.5, .65), { greens: ['#6f9a3a', '#86a85a', '#5a8a32'] }));
      // a windmill on the rise
      const wx = -1300, wy = hillY(h, -1300) + 30; paint(c, [[wx - 50, wy], [wx - 34, wy - 220], [wx + 34, wy - 220], [wx + 50, wy]], '#e8dcc0', { under: true, wob: 1, line: 1.4, bloom: .7 }); paint(c, [[wx - 44, wy - 220], [wx, wy - 280], [wx + 44, wy - 220]], '#a0583a', { under: true, wob: 1, line: 1.3 });
      house(c, 1500, hillY(h, 1500) + 40, 160, 100, { roof: '#b8583a', windows: 1, wall: '#efd9b4' }); },
      items: L => { L.mill = item(L, -1300, -78, [-150, -150, 150, 150], c => { for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; drawS(c, mk([[0, 0], [Math.cos(a) * 130, Math.sin(a) * 130]], 8, '#8a6a4a', { prof: 'even', nb: 0 })); paint(c, [[Math.cos(a) * 30 - Math.sin(a) * 4, Math.sin(a) * 30 + Math.cos(a) * 4], [Math.cos(a) * 130 - Math.sin(a) * 4, Math.sin(a) * 130 + Math.cos(a) * 4], [Math.cos(a) * 130 - Math.sin(a) * 30, Math.sin(a) * 130 + Math.cos(a) * 30], [Math.cos(a) * 30 - Math.sin(a) * 30, Math.sin(a) * 30 + Math.cos(a) * 30]], '#f4ecdc', { under: true, wob: .6, line: 1.2, bloom: .5 }); } }, { rot: t => t * .5 }); } },
    { k: 1, name: 'ground', b: [-3300, -700, 3900, 900], paint: c => {
      meadow(c, -3300, 3900, 160, 900, ['#a8cc5a', '#74a03a', '#c0d070'], { flowers: ['#d8323a', '#f2c94a', '#f4f0f8', '#9b84c4'], stones: true, dens: .9 });
      for (const x of [-600, 300, 700]) { paint(c, catmull([[x - 70, 250], [x - 60, 180], [x, 160], [x + 60, 180], [x + 70, 250]], true, 5), '#e2c46a', { under: true, wob: 1.5, line: 1.5, bloom: .8 }); for (let k = 0; k < 8; k++) brush(c, qcurve(x - 60 + k * 16, 248, x - 50 + k * 14, 172, 4, 4), 2, '#b89830', { prof: 'even', nb: 0, a: .5 }); }
      house(c, -200, 170, 260, 170, { wall: '#f2e2c4', roof: '#c8643a', timber: '#7a5a3a', chimney: true, shutters: '#5b7ea8', boxes: true, windows: 2 });
      // crop rows (wheat and cabbages) on the left
      for (let r = 0; r < 7; r++) { const y = 170 + r * 18; brush(c, qcurve(-3200, y, -1000, y + 6, 0, 40), 12, r % 2 ? '#d8c060' : '#e8d070', { prof: 'even', nb: 6, a: .7 }); }
      for (let k = 0; k < 120; k++) { const x = rnd(-3200, -1000), y = rnd(180, 290); for (let j = 0; j < 4; j++) brush(c, polar(x, y, -Math.PI / 2 + rnd(-.3, .3), rnd(14, 26), 2, 4), 2.4, pick(['#c8a840', '#e8c860', '#b89830']), { prof: 'tip', nb: 0, a: .7 }); }
      for (const x of [-2700, -2300, -1500]) { paint(c, catmull([[x - 50, 300], [x - 40, 240], [x + 40, 240], [x + 50, 300]], true, 4), '#e8c860', { under: true, wob: 1, line: 1.4, bloom: .7 }); for (let k = 0; k < 6; k++) brush(c, qcurve(x - 40 + k * 16, 300, x - 36 + k * 16, 244, 0, 4), 2, '#b89830', { prof: 'even', nb: 0, a: .6 }); }
      fence(c, -900, 900, 250, 60, '#8a6a4a', 100);
      scatter(18, -900, 900, x => tuft(c, x, rnd(180, 280), rnd(.6, .9)));
      // the road
      paint(c, catmull([[-3300, 330], [0, 320], [3900, 334], [3900, 420], [0, 410], [-3300, 424]], true, 6), '#d8c49a', { wob: 3, a: .8, line: 0, edge: .7, bloom: .6, gran: .7 });
      scatter(70, -3200, 3800, x => stone(c, x, rnd(330, 420), rnd(4, 9), '#b8a890'));
      scatter(40, -3200, 3800, x => tuft(c, x, rnd(290, 320), rnd(.7, 1.1)));
      scatter(30, -3200, 3800, x => flowers(c, x, rnd(290, 320), .8, ['#d8323a', '#f2c94a', '#f4f0f8', '#9b84c4'], 3));
      // scarecrow and a hay cart
      brush(c, qcurve(-1900, 280, -1900, 60, 0, 6), 8, '#6a4a30', { prof: 'even', nb: 3 }); brush(c, qcurve(-1980, 130, -1820, 130, 0, 6), 8, '#6a4a30', { prof: 'even', nb: 3 });
      paint(c, [[-1940, 180], [-1940, 110], [-1860, 110], [-1860, 180]], '#c8643a', { under: true, wob: 1.5, line: 1.3 }); paint(c, ellipsePts(-1900, 80, 30, 32, 0, 18), '#e8d8a8', { under: true, wob: 1, line: 1.3 });
      paint(c, [[-1950, 60], [-1850, 60], [-1880, 30], [-1920, 30]], '#e2c46a', { under: true, wob: 1, line: 1.2 });
      // the apple ladder in the orchard
      brush(c, qcurve(2240, 300, 2300, 40, 0, 6), 5, '#8a6a40', { prof: 'even', nb: 2 }); brush(c, qcurve(2290, 300, 2340, 46, 0, 6), 5, '#8a6a40', { prof: 'even', nb: 2 }); for (let k = 0; k < 6; k++) brush(c, qcurve(2245 + k * 10, 270 - k * 42, 2292 + k * 9, 270 - k * 42, 0, 3), 4, '#8a6a40', { prof: 'even', nb: 0 });
      basket(c, 2180, 300, 1.2, '#d8323a', 6); basket(c, 1700, 305, 1.1, '#d8323a', 5); },
      items: L => {
        for (const [x, s] of [[1250, 1.3], [1650, 1.5], [2050, 1.4], [2500, 1.6], [2950, 1.3], [3350, 1.5]]) item(L, x, 290, [-300, -560, 300, 30], c => treeRound(c, 0, 0, s, { fruit: '#d8323a', nf: 22, greens: ['#5f8a32', '#6f9a3a', '#86a85a', '#9cc25a'] }), { sway: .005 });
        item(L, -1200, 280, [-260, -460, 260, 30], c => treeRound(c, 0, 0, 1.1, { greens: ['#6f9a3a', '#86a85a', '#5a8a32'] }), { sway: .006 });
      },
      live: (c, t) => { for (let k = 0; k < 12; k++) { const x = -3000 + k * 330 + Math.sin(t * .4 + k) * 20; } } },
    { k: 1.35, name: 'fg', b: [-4600, 150, 5300, 1000], paint: c => { scatter(90, -4500, 5200, x => tuft(c, x, rnd(620, 800), rnd(1.4, 2.3))); scatter(36, -4500, 5200, x => flowers(c, x, rnd(640, 800), rnd(1.5, 2), ['#d8323a', '#f2c94a', '#f4f0f8', '#9b84c4'], 3)); } },
  ],
  grade: c => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,250,220,.1)'); g.addColorStop(1, 'rgba(120,170,60,.06)'); c.fillStyle = g; c.fillRect(0, 0, W, H); },
};

// ======================================================================================
// THE OGRE'S CASTLE — grey stone, moss, stormy purple sky (clears when the ogre is gone). Funny, not scary.
LOCDEF.ogre = {
  marks: { door: [0, 300], mat: [0, 330], bell: [190, 120], roof: [395, -230], gate: [-1000, 330], tree: [-700, 300] },
  layers: [
    { k: .2, name: 'skyClear', b: [-1300, -1100, 1300, 300], paint: (c, L) => skyPaint(c, L, '#f2c87a', '#fbefd2', { sun: [300, -380], cloudLow: -250, cloudCol: '#fff4e0', cloudShadow: '#f0c8a0' }) },
    { k: .2, name: 'skyStorm', b: [-1300, -1100, 1300, 300], alpha: P => 1 - (P.clear || 0), paint: (c, L) => skyPaint(c, L, '#4a3a6a', '#9a84a8', { clouds: 12, cloudLow: -100, cloudCol: '#7a6a8a', cloudShadow: '#3a2a4a', tint: '#6a5a8a' }),
      live: (c, t, P) => { const a = 1 - (P.clear || 0); if (a < .02) return; c.save(); c.globalAlpha = a; for (let k = 0; k < 6; k++) cloudLive(c, -1300 + ((k * 520 + t * 14) % 2800), -700 + (k % 3) * 160, 420, '#5a4a6a'); c.restore(); } },
    { k: .35, name: 'far', b: [-1600, -600, 1600, 500], haze: ['#b8a8c8', .4], paint: c => {
      const h = hillPaint(c, -1600, 1600, -60, 160, '#8a8a9a', { wl: 300 });
      for (let k = 0; k < 12; k++) { const x = rnd(-1500, 1500); paint(c, [[x - 80, hillY(h, x) + 40], [x - 20, hillY(h, x) - rnd(60, 160)], [x + 70, hillY(h, x) + 40]], '#7a7a8a', { wob: 3, a: .6, line: 0, edge: .6 }); } } },
    { k: .6, name: 'castle', b: [-1800, -1200, 1800, 600], haze: ['#c8b8d0', .12], paint: c => {
      hillPaint(c, -1800, 1800, 160, 30, '#6f7a5a', { a: .9 });
      stoneWall(c, [[-1500, 170], [-1500, -300], [1500, -300], [1500, 170]], '#8f8c94', { moss: 40, bh: 40 }); crenels(c, -1510, 1500, -300, '#8f8c94', 40, 50);
      for (const [x, w, h, r] of [[-1150, 220, 950, 0], [-560, 180, 760, 1], [560, 180, 760, 1], [1150, 220, 950, 0]]) tower(c, x, 170, w, h, '#8a8790', r ? '#5a4a6a' : null, { moss: 18, win: 3, bh: 44, rk: 1.1 }); },
      items: L => { for (const x of [-1150, 1150]) item(L, x, -780 - 40, [-4, -4, 160, 90], c => { brush(c, qcurve(0, 90, 0, -60, 0, 4), 6, '#4a3a3a', { prof: 'even', nb: 0 }); }, { });
        for (const [x, col] of [[-1150, '#d8323a'], [-560, '#f2c94a'], [560, '#7ab8e0'], [1150, '#8aa35a']]) item(L, x + 6, x % 1150 === 0 ? -810 : -770, [-2, -2, 170, 80], c => drawSprite(c, banner(150, 70, col, null, 'ogre')), { wave: [10, 'right', 2.5, 7] }); } },
    { k: 1, name: 'ground', b: [-1700, -900, 1700, 900], paint: c => {
      paint(c, [[-1700, 230], [1700, 230], [1700, 900], [-1700, 900]], '#8a8a80', { wob: 0, a: .9, line: 0, under: true, grad: ['#9a988c', '#6a6a60'], bloom: .5 });
      for (let k = 0; k < 160; k++) { const x = rnd(-1700, 1700), y = rnd(240, 880); paint(c, ellipsePts(x, y, rnd(20, 34) * y / 600, rnd(10, 16) * y / 600, 0, 10), pick(['#9a988c', '#7a7a70', '#a8a69a']), { under: false, wob: .8, a: .5, line: 0, edge: .8, bloom: .3, gran: .5 }); if (rnd() < .3) softBlob(c, x, y, 16, 6, '#6f8a4a', .5, .5); }
      // the keep front: wall, the great door, the porch roof
      stoneWall(c, [[-560, 300], [-560, -520], [560, -520], [560, 300]], '#9a96a0', { moss: 22, bh: 46 });
      paint(c, [[-150, 300], [-150, 40], [-90, -40], [0, -70], [90, -40], [150, 40], [150, 300]], '#6a4a30', { under: true, wob: 1, line: 2.2, bloom: .7, gran: .6 });
      for (let k = 1; k < 5; k++) brush(c, qcurve(-150 + k * 60, 300, -150 + k * 60, -50 + Math.abs(k - 2.5) * 20, 0, 6), 3, '#4a3020', { prof: 'even', nb: 0, a: .6 });
      for (const y of [60, 200]) brush(c, qcurve(-150, y, 150, y, 0, 8), 10, '#4a4450', { prof: 'even', nb: 3, a: .9 });
      paint(c, ellipsePts(90, 160, 16, 16, 0, 14), '#c8a03a', { under: true, wob: .3, line: 1.3, bloom: 1 });
      paint(c, [[-170, 300], [-170, 40], [-100, -50], [0, -84], [100, -50], [170, 40], [170, 300], [150, 300], [150, 40], [90, -40], [0, -70], [-90, -40], [-150, 40], [-150, 300]], '#7a7680', { under: true, wob: .8, line: 1.6, bloom: .5 });
      // porch roof on the right (Puss slides on it)
      for (const x of [250, 540]) brush(c, qcurve(x, 300, x, -40, 0, 6), 14, '#6a4a30', { prof: 'even', nb: 3 });
      roofTiles(c, [[190, -20], [395, -230], [600, -20]], '#6a5a7a', 6);
      brush(c, qcurve(190, -18, 600, -18, 0, 12), 10, '#5a4a3a', { prof: 'even', nb: 3 });
      // doorbell (a gold button under a little bell)
      paint(c, [[172, 100], [208, 100], [208, 150], [172, 150]], '#e2c46a', { under: true, wob: .5, line: 1.3, bloom: .9 }); paint(c, ellipsePts(190, 125, 9, 9, 0, 12), '#c8343a', { under: true, wob: .3, line: 1, bloom: 1 });
      drawSprite(c, PROPS.bell, 190, 72, .6);
      // the doormat: BEWARE OF OGRE
      paint(c, [[-200, 330], [200, 330], [220, 392], [-220, 392]], '#c8743a', { under: true, wob: 1, line: 1.6, bloom: .7, gran: .8 });
      c.save(); c.font = '700 26px Fredoka'; c.textAlign = 'center'; c.fillStyle = rgba('#5a2a1a', .85); c.setTransform(c.getTransform().multiply(new DOMMatrix([1, 0, 0, .55, 0, 0]))); c.fillText('BEWARE OF OGRE', 0, 368 / .55); c.restore();
      // a funny little dead tree, thistles, a puddle, rocks
      const tr = mk(qcurve(-760, 300, -700, -200, 40, 8), 40, '#5a4a40', { prof: 'trunk', nb: 5 }); drawS(c, tr);
      for (const [a, l] of [[-2.3, 160], [-1.0, 140], [-1.8, 120], [-.6, 90]]) drawS(c, mk(polar(-712, -120 + l * .3, a, l, 30, 8), 12, '#5a4a40', { prof: 'tip', nb: 3 }));
      paint(c, ellipsePts(700, 380, 120, 26, 0, 30), '#7a8ab0', { under: true, wob: 2, line: 0, edge: .7, bloom: .9 });
      for (const x of [-1300, -420, 820, 1300]) stone(c, x, rnd(300, 340), rnd(30, 60), '#8a8a90', { moss: true });
      for (const x of [-1100, -380, 900, 1450]) { for (let k = 0; k < 5; k++) brush(c, polar(x + rnd(-14, 14), 320, -Math.PI / 2 + rnd(-.5, .5), rnd(40, 70), 4, 5), 4, '#6f7a4a', { prof: 'tip', nb: 2 }); softBlob(c, x, 260, 14, 12, '#9b6aa8', .9, .6); } },
      live: (c, t, P) => { if ((P.clear || 0) > .3) motesLive(c, t, -600, -400, 1200, 600, 24); } },
    { k: 1.35, name: 'fg', b: [-2300, -1100, 2300, 1000], paint: c => {
      for (const x of [-2000, -1700, 1750, 2050]) { stone(c, x, 820, rnd(90, 140), '#7a7a80', { moss: true }); for (let k = 0; k < 7; k++) brush(c, polar(x + rnd(-40, 40), 760, -Math.PI / 2 + rnd(-.6, .6), rnd(80, 140), 6, 5), 8, '#5f6a3a', { prof: 'tip', nb: 2 }); softBlob(c, x, 640, 26, 22, '#9b6aa8', .9, .6); }
      for (let k = 0; k < 18; k++) brush(c, polar(rnd(-2300, 2300), -1100, Math.PI / 2 + rnd(-.4, .4), rnd(80, 180), rnd(-20, 20), 6), rnd(10, 18), pick(['#5f6a3a', '#6f7a4a']), { prof: 'tip', nb: 3, a: .8 }); } },
  ],
  grade: (c, t, P) => { const a = 1 - (P.clear || 0); const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgba(80,60,120,${.25 * a})`); g.addColorStop(1, `rgba(60,50,80,${.12 * a})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (a < 1) { const g2 = c.createRadialGradient(W * .6, 0, 0, W * .6, 0, W); g2.addColorStop(0, `rgba(255,214,140,${.25 * (1 - a)})`); g2.addColorStop(1, 'rgba(255,214,140,0)'); c.fillStyle = g2; c.fillRect(0, 0, W, H); } },
};
function cloudLive(c, x, y, w, col) { for (let k = 0; k < 6; k++) softBlob(c, x + (k - 2.5) * w * .18, y + Math.sin(k * 2) * 18, w * .22, w * .14, col, .35, .4); }

// ======================================================================================
// THE OGRE'S HALL — empty (Puss peeks in)
LOCDEF.hall = {
  marks: { door: [-800, 320], chair: [300, 320], fire: [-200, 250] },
  layers: [
    { k: .5, name: 'wall', b: [-1500, -1000, 1500, 700], paint: c => { stoneWall(c, [[-1500, 700], [-1500, -1000], [1500, -1000], [1500, 700]], '#7a7680', { moss: 30, bh: 60 });
      for (const x of [-900, 700]) { paint(c, [[x - 130, -200], [x - 130, -700], [x + 130, -700], [x + 130, -200]], '#5a7a4a', { under: true, wob: 1.5, line: 1.6, bloom: .7 }); softBlob(c, x, -450, 50, 50, '#e8c86a', .5, .6); for (let k = 0; k < 5; k++) brush(c, qcurve(x - 120, -680 + k * 110, x + 120, -680 + k * 110, 0, 6), 3, '#e8c86a', { prof: 'even', nb: 0, a: .5 }); }
      for (let k = 0; k < 4; k++) { const x = -1300 + k * 900; c.save(); c.strokeStyle = 'rgba(240,240,240,.5)'; c.lineWidth = 1.2; for (let r = 30; r < 120; r += 30) { c.beginPath(); c.arc(x, -1000, r, 0, Math.PI); c.stroke(); } for (let a = 0; a < 5; a++) { c.beginPath(); c.moveTo(x, -1000); c.lineTo(x + Math.cos(a / 4 * Math.PI) * 120, -1000 + Math.sin(a / 4 * Math.PI) * 120); c.stroke(); } c.restore(); } } },
    { k: .8, name: 'hearth', b: [-1500, -900, 1500, 700], paint: c => {
      stoneWall(c, [[-560, 300], [-560, -400], [160, -400], [160, 300]], '#8a8690', { bh: 40 }); paint(c, [[-460, 300], [-460, -100], [-200, -200], [60, -100], [60, 300]], '#2a2028', { under: true, wob: 1, line: 1.6 });
      for (let k = 0; k < 3; k++) brush(c, qcurve(-360 + k * 60, 290, -300 + k * 60, 260, 0, 4), 18, '#5a3a2a', { prof: 'even', nb: 3 });
      paint(c, [[-600, -400], [200, -400], [200, -450], [-600, -450]], '#6a4a30', { under: true, wob: 1, line: 1.5 });
      drawSprite(c, PROPS.slipper, -400, -470, .8); drawSprite(c, PROPS.slipper, -200, -470, .8); } ,
      live: (c, t) => { for (let k = 0; k < 7; k++) { const x = -200 + (k - 3) * 30, f = 1 + .2 * Math.sin(t * 9 + k * 2); c.beginPath(); c.moveTo(x - 20, 250); c.quadraticCurveTo(x - 10, 250 - 90 * f, x + Math.sin(t * 5 + k) * 8, 250 - 140 * f); c.quadraticCurveTo(x + 14, 250 - 70 * f, x + 20, 250); c.closePath(); c.fillStyle = k % 2 ? 'rgba(255,170,60,.85)' : 'rgba(255,214,110,.85)'; c.fill(); }
        c.save(); c.globalCompositeOperation = 'lighter'; softBlob(c, -200, 160, 380, 260, '#ff9a3a', .22, .2); c.restore(); } },
    { k: 1, name: 'floor', b: [-1600, -700, 1600, 900], paint: c => {
      paint(c, [[-1600, 300], [1600, 300], [1600, 900], [-1600, 900]], '#6a6a64', { wob: 0, a: .95, line: 0, under: true, grad: ['#7a7a70', '#4a4a44'] });
      paint(c, ellipsePts(0, 420, 700, 90, 0, 40), '#8a3a3a', { under: true, wob: 3, line: 1.6, bloom: .6 });
      // the giant chair and a giant mug on a table
      paint(c, [[260, 330], [260, -400], [340, -460], [620, -460], [700, -400], [700, 330]], '#7a5a3a', { under: true, wob: 1.5, line: 2, bloom: .7, gran: .6 });
      paint(c, [[240, 100], [720, 100], [720, 160], [240, 160]], '#8a6a4a', { under: true, wob: 1, line: 1.6 }); paint(c, [[300, -380], [660, -380], [660, 90], [300, 90]], '#9a4a5a', { under: true, wob: 1, line: 1.4, bloom: .8 });
      paint(c, [[900, 330], [900, 0], [1300, 0], [1300, 330]], '#7a5a3a', { under: true, wob: 1, line: 1.6 }); paint(c, [[860, 0], [1340, 0], [1340, -30], [860, -30]], '#8a6a4a', { under: true, wob: 1, line: 1.6 });
      paint(c, catmull([[1000, -30], [1000, -180], [1140, -180], [1140, -30]], true, 3), '#a8784a', { under: true, wob: 1, line: 1.6, bloom: .8 }); brush(c, qcurve(1140, -150, 1140, -70, -40, 8), 14, '#a8784a', { prof: 'even', nb: 3 }); } },
    { k: 1.3, name: 'fg', b: [-2200, -1100, 2200, 1000], paint: c => { for (const sd of [-1, 1]) stoneWall(c, [[sd * 1700 - 260, 1000], [sd * 1700 - 260, -1100], [sd * 1700 + 260, -1100], [sd * 1700 + 260, 1000]], '#6a6670', { moss: 8, bh: 70 }); for (let k = 0; k < 12; k++) softBlob(c, rnd(-2200, 2200), -1050, 60, 40, '#3a3440', .5, .4); } },
  ],
  grade: c => { const g = c.createRadialGradient(W * .4, H * .6, 50, W * .4, H * .6, W * .8); g.addColorStop(0, 'rgba(255,160,80,.1)'); g.addColorStop(1, 'rgba(20,10,30,.35)'); c.fillStyle = g; c.fillRect(0, 0, W, H); },
};

// ======================================================================================
// THE CASTLE KITCHEN AT NIGHT — warm golden lantern and candle glow
LOCDEF.kitchen = {
  marks: { table: [0, 330], tom: [-220, 330], puss: [210, 330], hearth: [-760, 300], bed: [820, 330] },
  layers: [
    { k: .5, name: 'wall', b: [-1500, -1000, 1500, 700], paint: c => {
      stoneWall(c, [[-1500, 700], [-1500, -1000], [1500, -1000], [1500, 700]], '#6a5048', { bh: 56 });
      c.fillStyle = 'rgba(30,18,24,.35)'; c.fillRect(-1500, -1000, 3000, 1700);
      // window with the moon and stars
      paint(c, [[300, -100], [300, -560], [500, -660], [700, -560], [700, -100]], '#2a3a6a', { under: true, wob: 1, line: 3, lineCol: '#2a1a14', bloom: .6 });
      softBlob(c, 560, -470, 50, 50, '#fff6d8', .95, .7); softBlob(c, 560, -470, 120, 120, '#c8d0f0', .2, .3);
      for (let k = 0; k < 14; k++) softBlob(c, rnd(320, 680), rnd(-600, -120), 2.5, 2.5, '#fffae8', .9, .7);
      c.save(); c.strokeStyle = '#2a1a14'; c.lineWidth = 6; c.beginPath(); c.moveTo(500, -650); c.lineTo(500, -100); c.moveTo(300, -360); c.lineTo(700, -360); c.stroke(); c.restore();
      // shelves with jars and copper pots
      for (const y of [-520, -300]) { paint(c, [[-1200, y], [-140, y], [-140, y + 20], [-1200, y + 20]], '#7a5a3a', { under: true, wob: 1, line: 1.4 });
        for (let x = -1160; x < -180; x += rnd(70, 110)) { const h = rnd(50, 90); paint(c, catmull([[x - 22, y], [x - 26, y - h * .6], [x - 14, y - h], [x + 14, y - h], [x + 26, y - h * .6], [x + 22, y]], true, 4), pick(['#c87a4a', '#7a9a6a', '#e8d8b8', '#b8584a', '#d8a85a']), { under: true, wob: .8, line: 1.3, bloom: 1 }); } }
      for (let k = 0; k < 5; k++) { const x = 900 + k * 110; brush(c, qcurve(x, -700, x, -560, 0, 4), 3, '#3a2a20', { prof: 'even', nb: 0 }); paint(c, catmull([[x - 40, -560], [x + 40, -560], [x + 34, -500], [x - 34, -500]], true, 4), '#c87a4a', { under: true, wob: .8, line: 1.4, bloom: 1 }); }
      for (let k = 0; k < 6; k++) { const x = -1300 + k * 50; brush(c, qcurve(x, -900, x + 6, -760, 4, 6), 10, pick(['#6f8a4a', '#8a9a5a']), { prof: 'tip', nb: 3 }); } } },
    { k: .75, name: 'hearth', b: [-1700, -900, 1600, 700], paint: c => {
      stoneWall(c, [[-1250, 320], [-1250, -380], [-420, -380], [-420, 320]], '#8a6a5a', { bh: 40 });
      paint(c, [[-1150, 320], [-1150, -40], [-840, -150], [-520, -40], [-520, 320]], '#1e1418', { under: true, wob: 1, line: 1.6 });
      for (let k = 0; k < 3; k++) brush(c, qcurve(-980 + k * 70, 300, -920 + k * 70, 270, 0, 4), 22, '#4a2a1a', { prof: 'even', nb: 3 });
      paint(c, catmull([[-930, 120], [-750, 120], [-740, 250], [-940, 250]], true, 4), '#2a2a2a', { under: true, wob: 1, line: 1.5, bloom: .5 }); brush(c, qcurve(-1000, 110, -680, 110, -20, 8), 4, '#2a2a2a', { prof: 'even', nb: 0 }); },
      live: (c, t) => { for (let k = 0; k < 8; k++) { const x = -840 + (k - 3.5) * 34, f = 1 + .2 * Math.sin(t * 9 + k * 2); c.beginPath(); c.moveTo(x - 22, 300); c.quadraticCurveTo(x - 10, 300 - 100 * f, x + Math.sin(t * 5 + k) * 8, 300 - 150 * f); c.quadraticCurveTo(x + 14, 300 - 80 * f, x + 22, 300); c.closePath(); c.fillStyle = k % 2 ? 'rgba(255,160,50,.85)' : 'rgba(255,214,110,.85)'; c.fill(); }
        smokeLive(c, -840, 130, t, { n: 5, h: 200, col: '#e8e0d8', speed: .3, drift: 10 });
        c.save(); c.globalCompositeOperation = 'lighter'; softBlob(c, -840, 200, 520, 380, '#ff9a3a', .25, .2); c.restore(); } },
    { k: 1, name: 'floor', b: [-1700, -700, 1700, 900], paint: c => {
      paint(c, [[-1700, 300], [1700, 300], [1700, 900], [-1700, 900]], '#5a3a2a', { wob: 0, a: .95, line: 0, under: true, grad: ['#6a4a34', '#3a2418'] });
      for (let x = -1700; x < 1700; x += 140) brush(c, qcurve(x, 300, x * 1.5, 900, 0, 6), 3, '#3a2418', { prof: 'even', nb: 0, a: .5 });
      // Puss's soft bed: a velvet cushion by the warm hearth
      paint(c, catmull([[640, 330], [660, 270], [820, 250], [980, 270], [1000, 330], [820, 352]], true, 6), '#7a3a6a', { under: true, wob: 2, line: 1.8, bloom: 1 });
      paint(c, catmull([[680, 300], [700, 268], [820, 258], [940, 268], [960, 300], [820, 312]], true, 6), '#9a5a8a', { under: true, wob: 1.5, line: 0, bloom: 1 });
      for (const x of [660, 980]) softBlob(c, x, 330, 10, 10, '#e2b54a', .95, .7); } ,
      items: L => { L.table = item(L, 0, 330, [-560, -260, 560, 40], c => {
        paint(c, [[-520, -150], [520, -150], [540, -110], [-540, -110]], '#8a6040', { under: true, wob: 1.5, line: 2, bloom: .8, gran: .6 });
        for (const x of [-470, 470]) brush(c, qcurve(x, -110, x, 30, 0, 4), 22, '#6a4430', { prof: 'even', nb: 4 });
        paint(c, catmull([[-130, -150], [-120, -178], [130, -178], [140, -150]], true, 4), '#e8d8b8', { under: true, wob: .8, line: 1.4, bloom: .6 });
        candle(c, -330, -150, 1.4); candle(c, 330, -150, 1.4); drawSprite(c, PROPS.lantern, 440, -150, 1);
        paint(c, catmull([[-420, -150], [-440, -200], [-400, -230], [-360, -200], [-380, -150]], true, 4), '#7a9a6a', { under: true, wob: .6, line: 1.3, bloom: .8 }); }, { front: true }); },
      live: (c, t, P) => { for (const x of [-330, 330]) flameLive(c, x, 330 - 150 - 56, 1.4, t, x); flameLive(c, 440, 330 - 150 - 32, 1.2, t, 9); } },
    { k: 1.3, name: 'fg', b: [-2200, -1100, 2200, 1000], paint: c => {
      for (const [x, s] of [[-1800, 2.2], [1850, 2.4]]) { paint(c, catmull([[x - 60 * s, 900], [x - 70 * s, 700], [x - 40 * s, 620], [x + 40 * s, 620], [x + 70 * s, 700], [x + 60 * s, 900]], true, 5), '#a8643a', { under: true, wob: 2, line: 2, bloom: .9 }); }
      basket(c, -1500, 920, 3, '#e8c86a', 6);
      for (let k = 0; k < 10; k++) { const x = -2100 + k * 460; brush(c, qcurve(x, -1100, x + 20, -960, 6, 6), 10, '#5a4030', { prof: 'even', nb: 3 }); } } },
  ],
  grade: (c, t) => { const f = 1 + .03 * Math.sin(t * 7) + .02 * Math.sin(t * 13);
    const g = c.createRadialGradient(W * .5, H * .55, 60, W * .5, H * .55, W * .75); g.addColorStop(0, `rgba(255,190,90,${.14 * f})`); g.addColorStop(.6, 'rgba(60,30,20,.12)'); g.addColorStop(1, 'rgba(20,10,20,.42)'); c.fillStyle = g; c.fillRect(0, 0, W, H); },
};

// ======================================================================================
// THE DESK — the channel's lantern and open storybook (opening and end card)
LOCDEF.desk = {
  marks: { lantern: [-560, 260], book: [180, 280] },
  layers: [
    { k: .4, name: 'room', b: [-1500, -1000, 1500, 700], paint: c => {
      const g = c.createRadialGradient(-400, 0, 50, -400, 0, 1600); g.addColorStop(0, '#6a4a34'); g.addColorStop(1, '#1e140e'); c.fillStyle = g; c.fillRect(-1500, -1000, 3000, 1700);
      for (let k = 0; k < 40; k++) softBlob(c, rnd(-1500, 1500), rnd(-1000, 400), rnd(60, 240), rnd(40, 160), pick(['#3a281c', '#5a3a26', '#2e1d14']), rnd(.15, .35), .3);
      for (let k = 0; k < 16; k++) softBlob(c, rnd(-1300, 1300), rnd(-800, 100), rnd(18, 50), rnd(18, 50), pick(['#f2b94b', '#ffd98a', '#e8a85a']), rnd(.12, .3), .5);
      for (let k = 0; k < 8; k++) { const x = 500 + k * 120; paint(c, [[x, -100], [x, -420 + rnd(-40, 40)], [x + rnd(60, 100), -420 + rnd(-40, 40)], [x + rnd(60, 100), -100]], pick(['#7a3a2a', '#3a5a4a', '#6a5a2a', '#4a3a5a']), { under: true, wob: 1, line: 1.3, bloom: .6, a: .6 }); }
      paint(c, [[400, -100], [1500, -100], [1500, -80], [400, -80]], '#4a2e1e', { under: true, wob: 1, line: 1.2 }); } },
    { k: 1, name: 'desk', b: [-1700, -700, 1700, 900], paint: c => {
      paint(c, [[-1700, 260], [1700, 240], [1700, 900], [-1700, 900]], '#5a3a26', { wob: 1, a: .95, line: 0, under: true, grad: ['#7a5236', '#3e2618'], bloom: .7, gran: .6 });
      for (let k = 0; k < 18; k++) brush(c, qcurve(-1700, 280 + k * 34, 1700, 262 + k * 34 + rnd(-6, 6), rnd(-10, 10), 30), rnd(2, 4), '#3a2416', { prof: 'even', nb: 0, a: .3 });
      // the open storybook (pages spread)
      paint(c, [[-330, 350], [-320, 330], [330, 330], [340, 350], [0, 362]], '#7a2a2a', { under: true, wob: .6, line: 1.6, bloom: .5 });
      const pageL = [[-310, 334], [-300, 150], [-150, 132], [-10, 150], [0, 334], [-150, 320]], pageR = [[0, 334], [10, 150], [150, 132], [300, 150], [310, 334], [150, 320]];
      for (let k = 3; k >= 0; k--) { paint(c, pageL.map(([x, y]) => [x - k * 3, y + k * 3]), k ? '#e2d2b2' : '#f6ebd2', { under: true, wob: .5, line: 1.2, lineCol: '#a88a6a', bloom: k ? .2 : .9, edge: .3 }); paint(c, pageR.map(([x, y]) => [x + k * 3, y + k * 3]), k ? '#e2d2b2' : '#f6ebd2', { under: true, wob: .5, line: 1.2, lineCol: '#a88a6a', bloom: k ? .2 : .9, edge: .3 }); }
      // a little watercolour picture on the left page (a cat and a boot) and lines of text on the right
      softBlob(c, -160, 220, 70, 46, '#f2c87a', .5, .4); softBlob(c, -170, 240, 30, 26, '#e8873a', .8, .6); softBlob(c, -150, 205, 16, 16, '#e8873a', .8, .6); softBlob(c, -120, 262, 14, 10, '#7a4a2a', .8, .6);
      for (let k = 0; k < 8; k++) brush(c, qcurve(40, 170 + k * 18, 270, 172 + k * 18, -1, 8), 2, '#a89070', { prof: 'even', nb: 0, a: .45 });
      for (let k = 0; k < 7; k++) { brush(c, qcurve(-210, 160 + k * 20, -40, 150 + k * 20, 2, 8), 2, '#a89070', { prof: 'even', nb: 0, a: .45 }); brush(c, qcurve(50, 150 + k * 20, 220, 160 + k * 20, -2, 8), 2, '#a89070', { prof: 'even', nb: 0, a: .45 }); }
      softBlob(c, -120, 260, 40, 30, '#c8a07a', .3, .5);
      brush(c, qcurve(0, 146, 6, 400, 4, 8), 6, '#b02e3a', { prof: 'even', nb: 2, a: .9 });
      for (let k = 0; k < 3; k++) paint(c, [[-1150, 330 - k * 40], [-790, 326 - k * 40], [-790, 290 - k * 40], [-1150, 294 - k * 40]], ['#5b3a7a', '#3a5a4a', '#7a3a2a'][k], { under: true, wob: .8, line: 1.4, bloom: .6 });
      paint(c, catmull([[1100, 330], [1080, 250], [1180, 250], [1160, 330]], true, 4), '#b8643a', { under: true, wob: .8, line: 1.4, bloom: .8 }); bush(c, 1130, 250, .7, { greens: ['#4e7a44', '#6f9a3a', '#86a85a'], flowers: ['#f4f0f8', '#f2c94a'], under: true });
      // the lantern
      const lx = -560, ly = 260;
      paint(c, [[lx - 70, ly], [lx + 70, ly], [lx + 60, ly - 24], [lx - 60, ly - 24]], '#8a6a2a', { under: true, wob: .6, line: 1.6, bloom: .8 });
      paint(c, [[lx - 56, ly - 24], [lx + 56, ly - 24], [lx + 50, ly - 220], [lx - 50, ly - 220]], '#ffe8a8', { under: true, wob: .6, line: 2, lineCol: '#6a4a1a', bloom: 1 });
      for (const sd of [-1, 0, 1]) brush(c, qcurve(lx + sd * 52, ly - 24, lx + sd * 48, ly - 220, 0, 6), 6, '#8a6a2a', { prof: 'even', nb: 2, a: .9 });
      paint(c, [[lx - 64, ly - 220], [lx + 64, ly - 220], [lx + 30, ly - 280], [lx - 30, ly - 280]], '#a8843a', { under: true, wob: .6, line: 1.6, bloom: .9 });
      brush(c, qcurve(lx - 26, ly - 284, lx + 26, ly - 284, -40, 10), 6, '#6a4a1a', { prof: 'even', nb: 0 });
      candle(c, lx, ly - 30, 1.6);
      // a quill and a teacup
      brush(c, qcurve(400, 330, 640, 180, -40, 12), 14, '#f4ead2', { prof: 'leaf', nb: 4 }); brush(c, qcurve(380, 340, 460, 290, 0, 5), 3, '#3a2a20', { prof: 'even', nb: 0 });
      paint(c, catmull([[800, 330], [790, 250], [920, 250], [910, 330]], true, 4), '#e8e0d8', { under: true, wob: .6, line: 1.4, bloom: .8 }); brush(c, qcurve(915, 270, 915, 310, -30, 6), 6, '#e8e0d8', { prof: 'even', nb: 0 }); },
      live: (c, t, P) => { const lx = -560, ly = 260;
        c.save(); c.globalCompositeOperation = 'lighter'; const f = 1 + .06 * Math.sin(t * 6) + .04 * Math.sin(t * 15);
        softBlob(c, lx, ly - 110, 520 * f, 480 * f, '#f2b94b', .32, .15); softBlob(c, lx, ly - 110, 160 * f, 180 * f, '#ffd98a', .5, .3); c.restore();
        flameLive(c, lx, ly - 94, 1.6, t, 0); motesLive(c, t, -900, -400, 900, 600, 22, '#ffd98a'); } },
  ],
  grade: (c, t) => { const g = c.createRadialGradient(W * .35, H * .55, 100, W * .4, H * .5, W * .8); g.addColorStop(0, 'rgba(255,200,120,.08)'); g.addColorStop(1, 'rgba(10,6,4,.45)'); c.fillStyle = g; c.fillRect(0, 0, W, H); },
};
