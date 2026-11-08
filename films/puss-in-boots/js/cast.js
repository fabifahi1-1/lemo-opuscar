// The cast of Puss in Boots (STYLE_BIBLE.md §4). Each entry is a spec for chars.js.

// ---- shared clothing pieces (hip-local coords: hip at 0,0, shoulders at y=-torso) ----
function tunicPts(g, hem = 22, flare = 1.15) {
  const T = g.torso, sw = g.shoulder, hw = g.hipW || sw * .9;
  return catmull([[-sw * .5, -T], [0, -T - 3], [sw * .5, -T], [sw * .58, -T * .7], [hw * .55, -T * .2], [hw * .62 * flare, hem], [0, hem + 4], [-hw * .62 * flare, hem], [-hw * .55, -T * .2], [-sw * .58, -T * .7]], true, 6);
}
function dressPts(g, hem, flare) {
  const T = g.torso, sw = g.shoulder;
  return catmull([[-sw * .42, -T], [0, -T - 2], [sw * .42, -T], [sw * .5, -T * .62], [sw * .3, -T * .2], [sw * .9 * flare, hem * .5], [sw * 1.15 * flare, hem], [0, hem + 6], [-sw * 1.15 * flare, hem], [-sw * .9 * flare, hem * .5], [-sw * .3, -T * .2], [-sw * .5, -T * .62]], true, 6);
}
const belt = (g, y, col, w = 9) => F(c => brush(c, qcurve(-g.shoulder * .55, y, g.shoulder * .58, y + 2, 3, 10), w, col, { prof: 'even', nb: 3, a: .9 }), [-g.shoulder, y - 10, g.shoulder, y + 10]);
const dots = (pts, col, r) => F(c => { for (const [x, y] of pts) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col; c.fill(); c.beginPath(); c.arc(x - r * .3, y - r * .3, r * .35, 0, TAU); c.fillStyle = 'rgba(255,250,235,.8)'; c.fill(); c.strokeStyle = rgba(shade(col, .5), .7); c.lineWidth = 1; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); } }, [-200, -400, 200, 200]);
const vneck = (g, skin) => [catmull([[-g.shoulder * .2, -g.torso - 1], [g.shoulder * .2, -g.torso - 1], [0, -g.torso + 26]], true, 4), skin, { line: 1, bloom: 0, edge: .3 }];
function messyHair(hx, hy, hd, col, o = {}) {
  const pts = []; const n = 13;
  for (let i = 0; i <= n; i++) { const a = Math.PI * (1.02 + i / n * .96), r = hd.rx * (1.08 + (i % 2 ? .12 : 0) * (o.spiky ?? 1));
    pts.push([hx + Math.cos(a) * r, hy + Math.sin(a) * hd.ry * 1.06 - (i % 2 ? 4 : 0)]); }
  pts.push([hx + hd.rx * 1.02, hy - hd.ry * .05], [hx + hd.rx * .7, hy - hd.ry * .42], [hx + hd.rx * .2, hy - hd.ry * .28], [hx - hd.rx * .25, hy - hd.ry * .48], [hx - hd.rx * .7, hy - hd.ry * .3], [hx - hd.rx * 1.02, hy - hd.ry * .02]);
  return pts;
}
const hairStrands = (hx, hy, hd, col, n = 9) => F(c => { for (let i = 0; i < n; i++) { const a = Math.PI * (1.1 + i / n * .8); const x = hx + Math.cos(a) * hd.rx * .9, y = hy + Math.sin(a) * hd.ry * .9;
  brush(c, qcurve(x, y, x + Math.cos(a) * hd.rx * .25 + rnd(-6, 6), y + Math.sin(a) * hd.ry * .25 + hd.ry * .15, rnd(-6, 6), 6), rnd(3, 5), shade(col, .3), { prof: 'tip', nb: 2, a: .5 }); } }, [hx - hd.rx * 1.3, hy - hd.ry * 1.4, hx + hd.rx * 1.3, hy + hd.ry]);

// ---------------------------------------------------------------------------------------------
const TOMGEO = { leg: 105, legW: 26, torso: 92, shoulder: 64, hipW: 60, armW: 20, upper: 50, fore: 44, hand: 13, neck: 10, head: { rx: 46, ry: 47 } };
const TOMFACE = { style: 'dot', eyeR: .15, eyeX: .4, eyeY: .02, mouthY: .52, mouthW: .34, noseY: .27, browW: 1, blushCol: '#e8828a' };
const tomHair = (hx, hy, hd) => [[messyHair(hx, hy, hd, '#8a4b2a'), '#8a4b2a', { line: 1.4, bloom: .6 }], hairStrands(hx, hy, hd, '#8a4b2a')];
const tomHairBack = (hx, hy, hd) => [[ellipsePts(hx - 4, hy - 6, hd.rx * 1.06, hd.ry * 1.02, 0, 30), '#7a4024', { line: 1.2 }]];

const SPECS = {
  tom: { id: 'tom', R: 3.4, skin: SKIN.light, geo: TOMGEO, face: TOMFACE, freckles: true,
    legs: { col: '#7d6a55', patch: '#a3794e' }, shoes: { col: '#6b4a33' },
    top: { col: '#b89a72', sleeve: '#b0916a', cuff: '#a0835e' },
    torso: g => [[tunicPts(g, 24), '#b89a72', { line: 1.7 }], vneck(g, SKIN.light),
      [ellipsePts(-14, -50, 13, 11, .4, 16), '#8f9a6a', { line: 1.2, bloom: .2 }], [ellipsePts(16, -20, 10, 9, -.3, 16), '#c9875a', { line: 1.2, bloom: .2 }],
      F(c => { for (const [x, y, r] of [[-14, -50, 13], [16, -20, 10]]) for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; brush(c, qcurve(x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .8, x + Math.cos(a) * r * 1.15, y + Math.sin(a) * r * 1.05, 0, 3), 1.6, '#5a4430', { prof: 'even', nb: 0, a: .7 }); } }, [-40, -70, 40, 0]),
      belt(g, -6, '#a08350', 8)],
    hairFront: tomHair, hairBack: tomHairBack },
  tomFine: { id: 'tomFine', R: 3.4, skin: SKIN.light, geo: TOMGEO, face: TOMFACE, freckles: true,
    legs: { col: '#c2a77e' }, shoes: { col: '#2a2a33', shine: true },
    top: { col: '#3f6fb0', sleeve: '#3a68a8', cuff: '#f4ead2' },
    torso: g => [[tunicPts(g, 26, 1.1), '#3f6fb0', { line: 1.7, bloom: .6 }],
      [catmull([[-g.shoulder * .24, -g.torso - 1], [g.shoulder * .24, -g.torso - 1], [g.shoulder * .1, -g.torso + 34], [0, -g.torso + 40], [-g.shoulder * .1, -g.torso + 34]], true, 4), '#f4ead2', { line: 1.2, bloom: 0 }],
      F(c => { for (const s of [-1, 1]) brush(c, qcurve(s * g.shoulder * .26, -g.torso + 2, s * 6, -g.torso + 44, s * 4, 8), 4, '#2c5490', { prof: 'even', nb: 0, a: .8 }); }, [-60, -100, 60, 0]),
      dots([[0, -44], [0, -26], [0, -8]], '#e2b54a', 4.2),
      [catmull([[-8, -g.torso + 4], [8, -g.torso + 4], [3, -g.torso + 10], [-3, -g.torso + 10]], true, 3), '#c8443a', { line: .8, bloom: 0 }]],
    hairFront: tomHair, hairBack: tomHairBack },

  // Puss: a cat standing on two legs. Head wide, green eyes, white muzzle/chest/paws.
  puss0: null, puss: null,
};
function pussSpec(id, boots, bag) {
  const fur = '#e8873a', stripe = '#c4621f', white = '#fbf3e4';
  const g = { leg: 34, legW: 15, torso: 46, shoulder: 30, hipW: 32, armW: 11, upper: 20, fore: 18, hand: 7.5, neck: 2, head: { rx: 38, ry: 31, chin: .9 }, legSpread: 9 };
  return { id, R: 5.2, skin: fur, geo: g, ears: false, gloves: white,
    face: { style: 'iris', iris: '#3fbf5a', lidCol: fur, eyeR: .2, eyeX: .42, eyeY: -.05, mouthY: .5, mouthW: .3, nose: 'cat', noseY: .3, cat: true, whiskers: true, browW: .8, browT: .22, browCol: '#9a4a1a', browUp: .1, blushCol: '#f08a8a' },
    legs: {}, shoes: {}, top: { col: fur, sleeve: fur },
    legItems: (front) => {
      const L = g.leg, w = g.legW, it = [[capsulePts(0, -4, 0, L - 4, w * .6, w * .5), front ? fur : shade(fur, .1), { line: 1.4 }]];
      if (boots) {
        const bt = catmull([[-w * .55, L * .25], [w * .55, L * .25], [w * .55, L * .7], [w * 1.25, L * .78], [w * 1.35, L * .98], [w * 1.2, L + 2], [-w * .6, L + 2], [-w * .62, L * .7]], true, 5);
        it.push([bt, '#7a4a2a', { line: 1.6, bloom: .8 }]);
        it.push([catmull([[-w * .7, L * .12], [w * .7, L * .12], [w * .78, L * .36], [-w * .78, L * .36]], true, 4), '#a8714a', { line: 1.3, bloom: .5 }]);
        it.push([ellipsePts(w * .1, L * .52, 3.2, 2.6, 0, 10), '#e2b54a', { line: .8, bloom: .8, under: true }]);
        it.push(F(c => brush(c, qcurve(w * .3, L * .82, w * .95, L * .86, -1, 5), 2.2, '#f0d8b8', { prof: 'leaf', nb: 0, a: .7 }), [-w, 0, w * 1.5, L + 3]));
      } else {
        it.push([ellipsePts(w * .35, L - 2, w * .9, w * .45, 0, 18), white, { line: 1.2 }]);
        it.push(F(c => { for (let k = -1; k <= 1; k++) brush(c, qcurve(w * (.45 + k * .3), L - 4, w * (.45 + k * .3), L + 1, 0, 3), 1.2, '#b89a80', { prof: 'even', nb: 0, a: .7 }); }, [-w, L - 8, w * 1.5, L + 4]));
      }
      return it;
    },
    torso: gg => {
      const T = gg.torso, it = [[catmull([[-15, -T], [0, -T - 3], [15, -T], [18, -T * .5], [17, 2], [0, 6], [-17, 2], [-18, -T * .5]], true, 6), fur, { line: 1.6, bloom: .7 }],
        [catmull([[-9, -T + 2], [9, -T + 2], [10, -T * .45], [5, -4], [0, -1], [-5, -4], [-10, -T * .45]], true, 5), white, { line: 0, bloom: .3, edge: .2 }],
        F(c => { for (let k = 0; k < 3; k++) brush(c, qcurve(-17, -T * .2 - k * 9, -9, -T * .25 - k * 9, 2, 5), 3, stripe, { prof: 'tip', nb: 2, a: .55 }); for (let k = 0; k < 3; k++) brush(c, qcurve(17, -T * .2 - k * 9, 10, -T * .25 - k * 9, -2, 5), 3, stripe, { prof: 'tip', nb: 2, a: .55 }); }, [-25, -T - 5, 25, 8])];
      if (bag) {
        it.push(F(c => brush(c, qcurve(13, -T + 2, -12, -2, -6, 10), 3.4, '#8a6a40', { prof: 'even', nb: 2, a: .9 }), [-25, -T, 25, 5]));
      }
      return it;
    },
    extra: bag ? { bag: gg => [[catmull([[-10, -6], [10, -6], [14, 10], [8, 18], [-8, 18], [-14, 10]], true, 5), '#c8a874', { line: 1.5, bloom: .6 }],
      F(c => { brush(c, qcurve(-9, -4, 9, -4, -2, 5), 2.4, '#8a6a40', { prof: 'even', nb: 0, a: .9 }); for (let k = 0; k < 4; k++) brush(c, qcurve(-8 + k * 5, 2, -7 + k * 5, 14, 1, 4), 1, '#a88a58', { prof: 'even', nb: 0, a: .4 }); }, [-15, -8, 15, 20])] } : null,
    hairBack: (hx, hy, hd) => {   // ears behind the head
      const it = [];
      for (const s of [-1, 1]) {
        const ear = [[hx + s * hd.rx * .25, hy - hd.ry * .78], [hx + s * hd.rx * .72, hy - hd.ry * 1.62], [hx + s * hd.rx * .98, hy - hd.ry * .35]];
        it.push([catmull(ear, true, 4), fur, { line: 1.6, bloom: .5, wob: .6 }]);
        it.push([catmull([[hx + s * hd.rx * .42, hy - hd.ry * .75], [hx + s * hd.rx * .7, hy - hd.ry * 1.36], [hx + s * hd.rx * .86, hy - hd.ry * .5]], true, 4), '#f0a9a0', { line: 0, bloom: .2, edge: .3, wob: .4, under: false, a: .85 }]);
      }
      return it;
    },
    headExtra: (hx, hy, hd) => [
      [catmull([[hx - hd.rx * .5, hy + hd.ry * .22], [hx, hy + hd.ry * .05], [hx + hd.rx * .5, hy + hd.ry * .22], [hx + hd.rx * .42, hy + hd.ry * .7], [hx, hy + hd.ry * .86], [hx - hd.rx * .42, hy + hd.ry * .7]], true, 5), white, { line: 0, bloom: .2, edge: .25, under: false, a: .92 }],
      F(c => { for (const s of [-1, 1]) for (let k = 0; k < 3; k++) brush(c, qcurve(hx + s * hd.rx * (.98 - k * .02), hy - hd.ry * (.1 - k * .22), hx + s * hd.rx * (.72 - k * .03), hy - hd.ry * (.06 - k * .22), 0, 4), 3.2, stripe, { prof: 'tip', nb: 2, a: .6 });
        for (let k = 0; k < 3; k++) brush(c, qcurve(hx + (k - 1) * hd.rx * .16, hy - hd.ry * .98, hx + (k - 1) * hd.rx * .12, hy - hd.ry * .7, 0, 4), 3.4, stripe, { prof: 'tip', nb: 2, a: .6 }); }, [hx - hd.rx, hy - hd.ry, hx + hd.rx, hy + hd.ry])],
    tail: (c, gg, hipY, t, st) => {
      const sw = Math.sin(t * 1.7 + (st.ph || 0)) * .5 + (st.tailUp || 0);
      const x0 = -14, y0 = hipY - 4;
      const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([x0 - u * 48 - Math.sin(u * 2.6) * 6, y0 - u * 18 - Math.sin(u * Math.PI * .9 + sw * u) * 40 * u - u * u * 30]); }
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      for (const [w, col] of [[11, shade(fur, .35)], [9, fur]]) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.strokeStyle = col; c.lineWidth = w; c.stroke(); }
      for (let k = 3; k < 12; k += 3) { const [x, y] = pts[k]; c.beginPath(); c.arc(x, y, 4.2, 0, TAU); c.fillStyle = rgba(stripe, .55); c.fill(); }
      c.beginPath(); c.arc(pts[12][0], pts[12][1], 5, 0, TAU); c.fillStyle = shade(fur, .1); c.fill();
      c.restore();
    } };
}
SPECS.puss0 = pussSpec('puss0', false, false);
SPECS.puss = pussSpec('puss', true, true);

// ---- the king ----
SPECS.king = { id: 'king', R: 3, skin: SKIN.rosy, beardOver: true,
  geo: { leg: 74, legW: 26, torso: 118, shoulder: 74, hipW: 92, armW: 24, upper: 48, fore: 44, hand: 13, neck: 4, head: { rx: 46, ry: 45 }, belly: 30, legSpread: 18 },
  face: { style: 'dot', eyeR: .13, eyeX: .38, eyeY: -.08, mouthY: .44, mouthW: .3, noseY: .16, rosyNose: true, browW: 1.1, browCol: '#b8b8c0', browT: .4, teeth: true },
  legs: { col: '#6a2a3a' }, shoes: { col: '#7a2a4a' },
  top: { col: '#b02e3a', sleeve: '#a82a36', cuff: '#f6f0e4' },
  torso: g => {
    const T = g.torso, robe = catmull([[-30, -T], [0, -T - 4], [30, -T], [52, -T * .6], [62, -T * .1], [58, 40], [56, 66], [0, 70], [-56, 66], [-58, 40], [-62, -T * .1], [-52, -T * .6]], true, 6);
    return [[robe, '#b02e3a', { line: 1.8, bloom: .7 }],
      [catmull([[-56, 54], [56, 54], [58, 70], [0, 74], [-58, 70]], true, 5), '#f6f0e4', { line: 1.2, bloom: .2 }],
      [[[-9, -T + 6], [9, -T + 6], [12, 56], [-12, 56]], '#f6f0e4', { line: 1.2, bloom: .2, wob: 1.2 }],
      F(c => { for (let k = 0; k < 24; k++) { const y = rnd(-T + 10, 70), x = y > 52 ? rnd(-52, 52) : rnd(-7, 7); brush(c, qcurve(x, y, x, y + 4, 0, 2), 2.2, '#2a2420', { prof: 'tip', nb: 0, a: .8 }); } }, [-60, -T, 60, 75]),
      belt(g, -18, '#e8b93c', 8), dots([[0, -18]], '#c8343a', 4)];
  },
  hairBack: (hx, hy, hd) => [[ellipsePts(hx, hy - 4, hd.rx * 1.08, hd.ry * .98, 0, 30), '#eae6e0', { line: 1.2, bloom: .3, under: true }]],
  beard: (hx, hy, hd) => {
    const b = catmull([[hx - hd.rx * .98, hy + hd.ry * .0], [hx - hd.rx * .6, hy + hd.ry * .28], [hx, hy + hd.ry * .28], [hx + hd.rx * .6, hy + hd.ry * .28], [hx + hd.rx * .98, hy + hd.ry * .0], [hx + hd.rx * .95, hy + hd.ry * 1.2], [hx + hd.rx * .55, hy + hd.ry * 2.4], [hx, hy + hd.ry * 3.1], [hx - hd.rx * .55, hy + hd.ry * 2.4], [hx - hd.rx * .95, hy + hd.ry * 1.2]], true, 6);
    return [[b, '#f2eee8', { line: 1.4, bloom: .3, shadowSide: .4 }],
      F(c => { for (let k = 0; k < 18; k++) { const x = hx + rnd(-.8, .8) * hd.rx, y = hy + hd.ry * rnd(.4, 2.2); brush(c, qcurve(x, y, x * .97, y + hd.ry * rnd(.3, .6), rnd(-4, 4), 5), rnd(2, 3.4), '#b8c0cc', { prof: 'tip', nb: 2, a: .45 }); }
        c.beginPath(); c.ellipse(hx, hy + hd.ry * .46, hd.rx * .3, hd.ry * .14, 0, 0, TAU); c.fillStyle = 'rgba(240,200,170,.95)'; c.fill();
        for (const s of [-1, 1]) brush(c, qcurve(hx, hy + hd.ry * .32, hx + s * hd.rx * .5, hy + hd.ry * .38, s * 5, 6), 9, '#e4e0dc', { prof: 'leaf', nb: 2, a: .95 }); }, [hx - hd.rx, hy, hx + hd.rx, hy + hd.ry * 3])];
  },
  hat: (hx, hy, hd) => {   // the tiny gold crown
    const y = hy - hd.ry * 1.02, cr = catmull([[hx - 14, y], [hx - 16, y - 16], [hx - 8, y - 8], [hx, y - 20], [hx + 8, y - 8], [hx + 16, y - 16], [hx + 14, y]], true, 3);
    return [[cr, '#e8b93c', { line: 1.4, bloom: .9, wob: .3 }], [ellipsePts(hx, y - 5, 3, 3, 0, 10), '#c8343a', { line: .8, bloom: .8 }]];
  } };

// ---- the princess ----
SPECS.princess = { id: 'princess', R: 3, skin: SKIN.brown,
  geo: { leg: 92, legW: 20, torso: 86, shoulder: 52, armW: 16, upper: 44, fore: 40, hand: 11, neck: 9, head: { rx: 42, ry: 44 }, legSpread: 10 },
  face: { style: 'dot', eyeR: .155, eyeX: .4, eyeY: .02, mouthY: .52, mouthW: .3, noseY: .28, browW: .95, blushCol: '#d8606e', lipCol: '#a8384a' },
  legs: { col: '#a8714f' }, shoes: { col: '#9b84c4' },
  top: { col: '#e07a8f', sleeve: '#e48a9c', bareFore: true },
  torso: g => [[dressPts(g, 90, 1), '#e07a8f', { line: 1.7, bloom: .8 }],
    [catmull([[-g.shoulder * .34, -g.torso * .28], [g.shoulder * .34, -g.torso * .28], [g.shoulder * .3, -g.torso * .1], [-g.shoulder * .3, -g.torso * .1]], true, 4), '#9b84c4', { line: 1.2 }],
    F(c => { for (let k = 0; k < 5; k++) brush(c, qcurve(-40 + k * 20, 20, -50 + k * 25, 88, rnd(-4, 4), 6), 3, '#c45a72', { prof: 'tip', nb: 2, a: .35 }); for (let k = 0; k < 9; k++) softBlob(c, -50 + k * 12.5, 84 + (k % 2) * 4, 4, 4, '#f6e6a8', .9, .6); }, [-70, -20, 70, 100]),
    [catmull([[-g.shoulder * .26, -g.torso], [g.shoulder * .26, -g.torso], [0, -g.torso + 16]], true, 4), SKIN.brown, { line: .8, bloom: 0 }]],
  hairBack: (hx, hy, hd) => [[ellipsePts(hx, hy - 2, hd.rx * 1.14, hd.ry * 1.08, 0, 32), '#2e1f1a', { line: 1.2, bloom: .5 }],
    [ellipsePts(hx + 2, hy - hd.ry * 1.18, hd.rx * .48, hd.ry * .4, 0, 24), '#2e1f1a', { line: 1.2, bloom: .6 }]],
  hairFront: (hx, hy, hd) => [[catmull([[hx - hd.rx * 1.06, hy + hd.ry * .05], [hx - hd.rx * .9, hy - hd.ry * .7], [hx - hd.rx * .2, hy - hd.ry * 1.05], [hx + hd.rx * .6, hy - hd.ry * .95], [hx + hd.rx * 1.06, hy - hd.ry * .2], [hx + hd.rx * .98, hy + hd.ry * .1], [hx + hd.rx * .55, hy - hd.ry * .5], [hx - hd.rx * .1, hy - hd.ry * .62], [hx - hd.rx * .75, hy - hd.ry * .3]], true, 6), '#2e1f1a', { line: 1.2, bloom: .6 }],
    F(c => { for (let k = 0; k < 6; k++) brush(c, qcurve(hx - hd.rx * .7 + k * 14, hy - hd.ry * .9, hx - hd.rx * .5 + k * 14, hy - hd.ry * .55, 4, 5), 2.5, '#5a3e30', { prof: 'tip', nb: 1, a: .5 }); }, [hx - hd.rx, hy - hd.ry, hx + hd.rx, hy])],
  hat: (hx, hy, hd) => { const y = hy - hd.ry * .92; return [[catmull([[hx - 18, y + 4], [hx - 12, y - 8], [hx - 5, y - 2], [hx, y - 14], [hx + 5, y - 2], [hx + 12, y - 8], [hx + 18, y + 4], [hx, y + 7]], true, 3), '#e8c95a', { line: 1.2, bloom: .9, wob: .3 }], [ellipsePts(hx, y - 4, 2.6, 2.6, 0, 10), '#7ab8e0', { line: .8 }]]; } };

// ---- the ogre (twice the door, pink fluffy slippers) ----
SPECS.ogre = { id: 'ogre', R: 1.7, skin: '#8aa35a',
  geo: { leg: 190, legW: 84, torso: 225, shoulder: 150, hipW: 170, armW: 58, upper: 115, fore: 108, hand: 34, neck: 8, head: { rx: 96, ry: 86, chin: 1.05 }, belly: 60, legSpread: 40, shoeL: 150, shoeH: 56 },
  face: { style: 'iris', iris: '#d8a83a', lidCol: '#6f8a40', eyeR: .16, eyeX: .36, eyeY: -.12, mouthY: .5, mouthW: .46, nose: 'big', noseY: .16, tusks: true, browW: 1.6, browT: .5, browCol: '#4a3a2a', browUp: .15, teeth: false, mouthCol: '#4a1e22' },
  legs: { col: '#6d6480' }, shoes: { col: '#f4a6c6', fluffy: true },
  top: { col: '#7a5a3a', sleeve: '#8aa35a', bareFore: true },
  torso: g => {
    const T = g.torso;
    return [[catmull([[-70, -T], [0, -T - 6], [70, -T], [100, -T * .6], [112, -T * .1], [100, 20], [0, 34], [-100, 20], [-112, -T * .1], [-100, -T * .6]], true, 6), '#8aa35a', { line: 2, bloom: .7 }],
      [catmull([[-50, -T * .7], [50, -T * .7], [70, -T * .2], [60, 10], [0, 22], [-60, 10], [-70, -T * .2]], true, 6), '#b2c47a', { line: 0, bloom: .4, edge: .2 }],
      [catmull([[-72, -T + 2], [-34, -T + 6], [-40, 18], [-98, 14], [-110, -T * .2], [-100, -T * .6]], true, 5), '#7a5a3a', { line: 1.8, bloom: .6 }],
      [catmull([[72, -T + 2], [34, -T + 6], [40, 18], [98, 14], [110, -T * .2], [100, -T * .6]], true, 5), '#7a5a3a', { line: 1.8, bloom: .6 }],
      [ellipsePts(-76, -T * .45, 18, 15, .3, 16), '#a8804a', { line: 1.4, bloom: .3 }],
      F(c => brush(c, qcurve(-98, 16, 98, 18, 4, 12), 12, '#4a3a2a', { prof: 'even', nb: 4, a: .85 }), [-110, 0, 110, 30])];
  },
  hat: (hx, hy, hd) => { const it = []; for (const s of [-1, 1]) it.push([catmull([[hx + s * hd.rx * .38, hy - hd.ry * .86], [hx + s * hd.rx * .5, hy - hd.ry * 1.28], [hx + s * hd.rx * .62, hy - hd.ry * .8]], true, 4), '#e8dcc0', { line: 1.3, bloom: .5 }]); return it; },
  hairFront: (hx, hy, hd) => [F(c => { for (let k = 0; k < 7; k++) brush(c, qcurve(hx - 20 + k * 7, hy - hd.ry * .98, hx - 25 + k * 8, hy - hd.ry * 1.2, rnd(-5, 5), 5), 5, '#4a3a2a', { prof: 'tip', nb: 2, a: .8 }); }, [hx - 50, hy - hd.ry * 1.3, hx + 50, hy - hd.ry * .8])] };

// ---- supporting humans (generic) ----
function human(id, o) {
  const H = o.H || 290, k = H / 300;
  const g = { leg: 104 * k, legW: 25 * k * (o.wide || 1), torso: 92 * k, shoulder: 64 * k * (o.wide || 1), hipW: 60 * k * (o.wide || 1), armW: 19 * k * (o.wide || 1), upper: 50 * k, fore: 44 * k, hand: 13 * k, neck: 9 * k, head: { rx: 44 * k * (o.headK || 1), ry: 45 * k * (o.headK || 1) }, belly: o.belly || 0 };
  const sp = { id, R: o.R || 2.2, skin: o.skin || SKIN.light, geo: g,
    face: Object.assign({ style: 'dot', eyeR: .14, eyeX: .4, eyeY: .02, mouthY: .52, mouthW: .32, noseY: .27, browW: 1 }, o.face || {}),
    legs: { col: o.pants || '#6a5a4a', bare: o.bareLegs }, shoes: { col: o.shoes || '#5a3e2e' },
    top: { col: o.top, sleeve: o.sleeve || o.top, cuff: o.cuff, bareFore: o.bareFore },
    torso: gg => {
      const it = [[o.dress ? dressPts(gg, o.dress, 1) : tunicPts(gg, o.hem ?? 22, o.flare ?? 1.15), o.top, { line: 1.7, bloom: .7 }]];
      if (o.apron) it.push([[[-gg.shoulder * .24, -gg.torso * .62], [gg.shoulder * .24, -gg.torso * .62], [gg.shoulder * .26, -gg.torso * .12], [gg.shoulder * .5, -gg.torso * .1], [gg.shoulder * .56, 30 * k], [0, 33 * k], [-gg.shoulder * .56, 30 * k], [-gg.shoulder * .5, -gg.torso * .1], [-gg.shoulder * .26, -gg.torso * .12]], o.apron, { line: 1.2, bloom: .3, wob: 1.5 }],
        F(c => brush(c, qcurve(-gg.shoulder * .5, -gg.torso * .11, gg.shoulder * .5, -gg.torso * .11, 2, 8), 4 * k, shade(o.apron, .25), { prof: 'even', nb: 0, a: .6 }), [-80, -80, 80, 0]));
      if (o.overalls) it.push([[[-gg.shoulder * .3, -gg.torso * .62], [gg.shoulder * .3, -gg.torso * .62], [gg.shoulder * .32, -gg.torso * .2], [gg.shoulder * .52, -gg.torso * .15], [gg.shoulder * .56, 24 * k], [-gg.shoulder * .56, 24 * k], [-gg.shoulder * .52, -gg.torso * .15], [-gg.shoulder * .32, -gg.torso * .2]], o.overalls, { line: 1.4, bloom: .4, wob: 1.5 }],
        F(c => { for (const s of [-1, 1]) brush(c, qcurve(s * gg.shoulder * .26, -gg.torso * .6, s * gg.shoulder * .34, -gg.torso, 0, 5), 5 * k, o.overalls, { prof: 'even', nb: 0, a: .95 }); }, [-80, -120, 80, 0]));
      if (o.vest) it.push([catmull([[-gg.shoulder * .52, -gg.torso], [-gg.shoulder * .12, -gg.torso], [-gg.shoulder * .14, 10 * k], [-gg.shoulder * .6, 12 * k]], true, 4), o.vest, { line: 1.4 }], [catmull([[gg.shoulder * .52, -gg.torso], [gg.shoulder * .12, -gg.torso], [gg.shoulder * .14, 10 * k], [gg.shoulder * .6, 12 * k]], true, 4), o.vest, { line: 1.4 }]);
      if (o.trim) it.push(belt(gg, o.trimY ?? -gg.torso * .1, o.trim, 7 * k));
      if (o.buttons) it.push(dots([[0, -gg.torso * .7], [0, -gg.torso * .45], [0, -gg.torso * .2]], o.buttons, 3.5 * k));
      if (o.belt) it.push(belt(gg, -6 * k, o.belt, 8 * k));
      if (o.cloak) it.push([catmull([[-gg.shoulder * .6, -gg.torso], [gg.shoulder * .6, -gg.torso], [gg.shoulder * .75, 30 * k], [-gg.shoulder * .75, 30 * k]], true, 4), o.cloak, { line: 1.6, a: .6 }]);
      return it;
    },
    hairBack: o.hairBack, hairFront: o.hairFront, hat: o.hat, beard: o.beard, beardOver: !!o.beard, gloves: o.gloves };
  return sp;
}
const tricorn = (col) => (hx, hy, hd) => [[catmull([[hx - hd.rx * 1.25, hy - hd.ry * .55], [hx, hy - hd.ry * 1.55], [hx + hd.rx * 1.25, hy - hd.ry * .55], [hx, hy - hd.ry * .78]], true, 5), col, { line: 1.5, bloom: .4 }]];
const capHat = (col) => (hx, hy, hd) => [[catmull([[hx - hd.rx * 1.02, hy - hd.ry * .35], [hx - hd.rx * .8, hy - hd.ry * 1.05], [hx + hd.rx * .3, hy - hd.ry * 1.2], [hx + hd.rx * 1.02, hy - hd.ry * .55], [hx + hd.rx * 1.35, hy - hd.ry * .4], [hx, hy - hd.ry * .5]], true, 5), col, { line: 1.4, bloom: .5 }]];
const strawHat = (hx, hy, hd) => [[ellipsePts(hx, hy - hd.ry * .62, hd.rx * 1.5, hd.ry * .26, 0, 30), '#e2c46a', { line: 1.4, bloom: .5 }], [catmull([[hx - hd.rx * .7, hy - hd.ry * .62], [hx - hd.rx * .6, hy - hd.ry * 1.15], [hx + hd.rx * .6, hy - hd.ry * 1.15], [hx + hd.rx * .7, hy - hd.ry * .62]], true, 4), '#e8cc72', { line: 1.3, bloom: .5 }], [catmull([[hx - hd.rx * .68, hy - hd.ry * .78], [hx + hd.rx * .68, hy - hd.ry * .78], [hx + hd.rx * .68, hy - hd.ry * .66], [hx - hd.rx * .68, hy - hd.ry * .66]], true, 2), '#c8443a', { line: .8 }]];
const helmet = (hx, hy, hd) => [[catmull([[hx - hd.rx * 1.08, hy - hd.ry * .2], [hx - hd.rx * .95, hy - hd.ry * .95], [hx, hy - hd.ry * 1.3], [hx + hd.rx * .95, hy - hd.ry * .95], [hx + hd.rx * 1.08, hy - hd.ry * .2], [hx, hy - hd.ry * .45]], true, 5), '#a9b4bf', { line: 1.5, bloom: 1 }], [ellipsePts(hx, hy - hd.ry * 1.36, 6, 9, 0, 12), '#c8343a', { line: 1 }]];
const wig = (hx, hy, hd) => [[ellipsePts(hx, hy - hd.ry * .25, hd.rx * 1.12, hd.ry * .95, 0, 30), '#f4f0ea', { line: 1.2, bloom: .3 }], [ellipsePts(hx - hd.rx * 1.0, hy + hd.ry * .05, hd.rx * .22, hd.ry * .3, 0, 14), '#f4f0ea', { line: 1.1 }], [ellipsePts(hx + hd.rx * 1.0, hy + hd.ry * .05, hd.rx * .22, hd.ry * .3, 0, 14), '#f4f0ea', { line: 1.1 }]];
const headscarf = (col) => (hx, hy, hd) => [[catmull([[hx - hd.rx * 1.08, hy + hd.ry * .1], [hx - hd.rx * .9, hy - hd.ry * .9], [hx, hy - hd.ry * 1.18], [hx + hd.rx * .9, hy - hd.ry * .9], [hx + hd.rx * 1.08, hy + hd.ry * .1], [hx + hd.rx * .8, hy - hd.ry * .45], [hx - hd.rx * .8, hy - hd.ry * .45]], true, 5), col, { line: 1.4, bloom: .6 }], F(c => { for (let k = 0; k < 7; k++) softBlob(c, hx - hd.rx * .7 + k * hd.rx * .23, hy - hd.ry * .8 + Math.sin(k) * 6, 3, 3, '#f6e8c8', .8, .6); }, [hx - hd.rx, hy - hd.ry, hx + hd.rx, hy])];
const simpleHair = (col, o = {}) => (hx, hy, hd) => [[catmull([[hx - hd.rx * 1.04, hy + hd.ry * (o.long ? .9 : .05)], [hx - hd.rx * .95, hy - hd.ry * .75], [hx, hy - hd.ry * 1.12], [hx + hd.rx * .95, hy - hd.ry * .75], [hx + hd.rx * 1.04, hy + hd.ry * (o.long ? .9 : .05)], [hx + hd.rx * .75, hy - hd.ry * .35], [hx, hy - hd.ry * .55], [hx - hd.rx * .75, hy - hd.ry * .35]], true, 5), col, { line: 1.3, bloom: .6 }]];
const braid = (col) => (hx, hy, hd) => [[ellipsePts(hx, hy - 3, hd.rx * 1.08, hd.ry * 1.04, 0, 30), col, { line: 1.2 }], ...[0, 1, 2, 3].map(i => [ellipsePts(hx - hd.rx * .85 - i * 3, hy + hd.ry * (.6 + i * .42), hd.rx * .2, hd.ry * .24, .3, 12), col, { line: 1.1 }])];
const mustache = (col, big = 1) => (hx, hy, hd) => [F(c => { for (const s of [-1, 1]) brush(c, qcurve(hx, hy + hd.ry * .38, hx + s * hd.rx * .5 * big, hy + hd.ry * .32, s * 5, 6), 9 * big, col, { prof: 'leaf', nb: 2, a: .95 }); }, [hx - hd.rx, hy, hx + hd.rx, hy + hd.ry])];
const greyBeard = (hx, hy, hd) => [[catmull([[hx - hd.rx * .95, hy + hd.ry * .05], [hx - hd.rx * .5, hy + hd.ry * .3], [hx + hd.rx * .5, hy + hd.ry * .3], [hx + hd.rx * .95, hy + hd.ry * .05], [hx + hd.rx * .7, hy + hd.ry * 1.0], [hx, hy + hd.ry * 1.45], [hx - hd.rx * .7, hy + hd.ry * 1.0]], true, 5), '#c8c4bc', { line: 1.3, bloom: .3 }], F(c => { c.beginPath(); c.ellipse(hx, hy + hd.ry * .5, hd.rx * .26, hd.ry * .13, 0, 0, TAU); c.fillStyle = 'rgba(230,190,160,.95)'; c.fill(); }, [hx - 30, hy, hx + 30, hy + 60])];

Object.assign(SPECS, {
  bro1: human('bro1', { H: 312, top: '#8c7a5a', pants: '#5a4a3a', apron: '#f2ece0', hairFront: simpleHair('#2e2622'), beard: mustache('#2e2622'), face: { mouthY: .6 }, R: 2 }),
  bro2: human('bro2', { H: 285, wide: 1.2, top: '#6f8a5a', pants: '#6a5038', hat: capHat('#c0483a'), hairFront: simpleHair('#6a4026'), belt: '#5a4030', R: 2 }),
  guard: human('guard', { H: 305, top: '#6a3f8a', pants: '#4a3a5a', trim: '#e2b54a', trimY: -20, hat: helmet, beard: mustache('#c8783a', 1.3), face: { mouthY: .62 }, R: 2 }),
  crier: human('crier', { H: 290, wide: 1.1, top: '#3f7a4a', pants: '#e8dcc0', buttons: '#e2b54a', hat: tricorn('#3a2a2a'), hairFront: simpleHair('#d8d0c4'), face: { blushCol: '#e05a5a' }, R: 2.2 }),
  servant: human('servant', { H: 292, top: '#5d3f7a', pants: '#f0e8dc', buttons: '#e2b54a', hairBack: wig, hairFront: simpleHair('#f4f0ea'), gloves: '#f8f4ee', cuff: '#f8f4ee', R: 2.2 }),
  farmer1: human('farmer1', { H: 295, top: '#e8dcc0', overalls: '#5b7ea8', pants: '#5b7ea8', hat: strawHat, skin: SKIN.tan, hairFront: simpleHair('#7a5030'), bareFore: true, R: 2.2 }),
  farmer2: human('farmer2', { H: 275, top: '#7a9a4a', dress: 60, hat: headscarf('#d9734a'), skin: SKIN.light, apron: '#f2ece0', R: 2.2, face: { lipCol: '#a8484a' } }),
  shepherd: human('shepherd', { H: 296, top: '#9a7a54', vest: '#7a5a3a', pants: '#6a5a44', hat: capHat('#6a5a44'), hairFront: simpleHair('#c8c4bc'), beard: greyBeard, face: { mouthY: .55 }, R: 2.2 }),
  baker: human('baker', { H: 292, wide: 1.25, top: '#f2ece0', pants: '#8a7a6a', apron: '#fbf6ec', hat: (hx, hy, hd) => [[catmull([[hx - hd.rx * .85, hy - hd.ry * .6], [hx - hd.rx * 1.05, hy - hd.ry * 1.35], [hx - hd.rx * .4, hy - hd.ry * 1.75], [hx + hd.rx * .4, hy - hd.ry * 1.8], [hx + hd.rx * 1.05, hy - hd.ry * 1.35], [hx + hd.rx * .85, hy - hd.ry * .6]], true, 5), '#fbf8f2', { line: 1.4, bloom: .3 }]], beard: mustache('#6a4026', 1.1), face: { mouthY: .6, rosyNose: true }, skin: SKIN.rosy, R: 2.2 }),
  picker: human('picker', { H: 278, top: '#f2e6cc', vest: '#a84a3a', dress: 55, skin: SKIN.deep, hairBack: braid('#2a1e18'), hairFront: simpleHair('#2a1e18'), R: 2.2, face: { lipCol: '#8a3a3a' } }),
});

// ---- quadrupeds ----
const BEASTS = {
  donkey: { id: 'donkey', R: 2, col: '#9a948c', hoof: '#4a4440',
    geo: { bodyL: 150, bodyH: 78, legL: 70, legW: 18, neck: [70, -50], head: { rx: 30, ry: 34 } },
    face: { style: 'dot', eyeR: .2, eyeX: .3, eyeY: -.2, mouthY: .78, mouthW: .3, noseY: .55, nose: 'none', brow: false, hx: 26, hy: -18, hd: { rx: 30, ry: 34 } },
    body: g => [[ellipsePts(0, -g.bodyH * .5, g.bodyL * .55, g.bodyH * .5, 0, 36), '#9a948c', { line: 1.6, bloom: .7 }], [ellipsePts(10, -g.bodyH * .2, g.bodyL * .35, g.bodyH * .25, 0, 24), '#c8c2b8', { line: 0, bloom: .3, under: false, a: .5 }]],
    head: g => [[catmull([[-12, -50], [16, -54], [44, -10], [52, 22], [30, 30], [0, 12], [-14, -18]], true, 6), '#9a948c', { line: 1.5, bloom: .6 }],
      [ellipsePts(40, 14, 18, 15, .3, 20), '#e6dccc', { line: 1.2 }],
      [catmull([[-4, -46], [2, -110], [14, -48]], true, 4), '#9a948c', { line: 1.4 }], [catmull([[10, -48], [26, -106], [26, -46]], true, 4), '#8a847c', { line: 1.4 }],
      [catmull([[2, -50], [7, -96], [10, -50]], true, 3), '#e8b8b0', { line: 0, under: false, a: .7 }],
      F(c => { for (let k = 0; k < 7; k++) brush(c, qcurve(-14 + k * 3, -48 + k * 8, -30, -40 + k * 9, -3, 5), 5, '#4a4440', { prof: 'tip', nb: 2, a: .8 }); c.beginPath(); c.arc(44, 12, 2.4, 0, TAU); c.arc(52, 16, 2.4, 0, TAU); c.fillStyle = '#4a4440'; c.fill(); }, [-40, -60, 60, 40])],
    tail: (c, g, by, t) => { brush(c, qcurve(-g.bodyL * .52, by - g.bodyH * .7, -g.bodyL * .62 + Math.sin(t * 2) * 4, by - g.bodyH * .1, 6, 6), 4, '#4a4440', { prof: 'tip', nb: 0, a: .9 }); } },
  horse: { id: 'horse', R: 1.8, col: '#e6dfd2', hoof: '#6a5e54',
    geo: { bodyL: 190, bodyH: 92, legL: 104, legW: 20, neck: [92, -70], head: { rx: 34, ry: 40 } },
    face: { style: 'dot', eyeR: .17, eyeX: .3, eyeY: -.25, mouthY: .85, mouthW: .25, nose: 'none', brow: false, hx: 22, hy: -12, hd: { rx: 30, ry: 34 } },
    body: g => [[ellipsePts(0, -g.bodyH * .5, g.bodyL * .55, g.bodyH * .5, 0, 36), '#e6dfd2', { line: 1.6, bloom: .7 }],
      [[[-34, -g.bodyH * .98], [30, -g.bodyH * .98], [36, -g.bodyH * .42], [0, -g.bodyH * .36], [-40, -g.bodyH * .42]], '#5b3a7a', { line: 1.3, wob: 1.5 }],
      F(c => { for (let k = 0; k < 6; k++) softBlob(c, -36 + k * 14, -g.bodyH * .4, 3, 3, '#e2b54a', .9, .6); }, [-50, -60, 50, -20]),
      F(c => { brush(c, qcurve(-g.bodyL * .5, -g.bodyH * .5, g.bodyL * .55, -g.bodyH * .62, -4, 10), 6, '#e2b54a', { prof: 'even', nb: 2, a: .9 }); }, [-120, -100, 120, 0])],
    head: g => [[catmull([[-26, -30], [-4, -56], [22, -44], [44, -6], [60, 22], [56, 40], [36, 42], [14, 18], [-12, 8], [-28, -6]], true, 6), '#e6dfd2', { line: 1.5, bloom: .6 }],
      [ellipsePts(50, 32, 14, 11, .4, 16), '#d8cfc2', { line: 0, under: false, a: .7 }],
      [catmull([[-8, -54], [0, -82], [8, -54]], true, 3), '#e6dfd2', { line: 1.3 }],
      F(c => { for (let k = 0; k < 9; k++) brush(c, qcurve(-22 + k * 2, -52 + k * 8, -42, -40 + k * 10, -3, 5), 6, '#c8bfb0', { prof: 'tip', nb: 2, a: .85 }); brush(c, qcurve(-6, -10, 50, 12, 6, 8), 4, '#e2b54a', { prof: 'even', nb: 0, a: .9 }); c.beginPath(); c.arc(46, 24, 2.4, 0, TAU); c.fillStyle = '#6a5e54'; c.fill(); }, [-50, -60, 60, 40]),
      F(c => { for (let k = 0; k < 6; k++) brush(c, qcurve(-2, -60, -10 + k * 5, -108 + Math.abs(k - 2.5) * 5, 3, 5), 5, '#8a5aaa', { prof: 'tip', nb: 2, a: .85 }); }, [-30, -120, 30, -50])],
    tail: (c, g, by, t) => { for (let k = 0; k < 5; k++) brush(c, qcurve(-g.bodyL * .54, by - g.bodyH * .8, -g.bodyL * .7 + Math.sin(t * 1.8 + k) * 5, by - g.bodyH * .05 + k * 3, 10 + k * 2, 7), 5, '#c8bfb0', { prof: 'tip', nb: 0, a: .7 }); } },
  sheep: { id: 'sheep', R: 2.4, col: '#3e3a3a', hoof: '#2a2626',
    geo: { bodyL: 112, bodyH: 70, legL: 34, legW: 11, neck: [52, -42], head: { rx: 20, ry: 24 } },
    face: { style: 'dot', eyeR: .22, eyeX: .38, eyeY: -.05, mouthY: .62, mouthW: .3, nose: 'none', brow: false, white: false, hx: 6, hy: 0, hd: { rx: 20, ry: 24 } },
    body: g => [F(c => { for (let k = 0; k < 34; k++) { const a = rnd(0, TAU), r = Math.sqrt(rnd()); softBlob(c, Math.cos(a) * r * g.bodyL * .42, -g.bodyH * .55 + Math.sin(a) * r * g.bodyH * .38, 22, 20, pick(['#c8ccd6', '#d8dae2', '#b8bcc8']), .5, .45); } }, [-80, -100, 80, 10]),
      F(c => { const pts = []; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; pts.push([Math.cos(a) * g.bodyL * .44, -g.bodyH * .55 + Math.sin(a) * g.bodyH * .44]); }
        for (const [x, y] of pts) paint(c, ellipsePts(x, y, 17, 16, 0, 18), '#eef0f2', { under: true, wob: 1.2, line: 1.3, lineCol: '#a0a8b8', bloom: .6, a: .5, shadowSide: .5 });
        paint(c, ellipsePts(0, -g.bodyH * .55, g.bodyL * .44, g.bodyH * .42, 0, 30), '#f2f2f0', { under: true, wob: 2, line: 0, edge: 0, bloom: .9, a: .35, shadowSide: .45 });
        for (let k = 0; k < 14; k++) { const x = rnd(-.38, .38) * g.bodyL, y = -g.bodyH * .55 + rnd(-.3, .3) * g.bodyH; c.beginPath(); c.arc(x, y, rnd(5, 9), Math.PI * .1, Math.PI * 1.2); c.strokeStyle = 'rgba(150,158,176,.45)'; c.lineWidth = 1.4; c.stroke(); } }, [-80, -110, 80, 10])],
    head: g => [[catmull([[-12, -18], [14, -22], [24, 4], [14, 24], [-8, 22], [-18, 0]], true, 6), '#3e3a3a', { line: 1.2, bloom: .5 }],
      [ellipsePts(-18, -10, 12, 6, -.4, 14), '#3e3a3a', { line: 1 }], [ellipsePts(-4, -26, 14, 10, 0, 16), '#f4f2ee', { line: 1, a: .6 }]],
    tail: (c, g, by) => { softBlob(c, -g.bodyL * .55, by - g.bodyH * .6, 10, 9, '#d8dae2', .8, .6); } },
  lion: { id: 'lion', R: 1.6, col: '#e0a84a', slippers: true, maneBehind: true,
    geo: { bodyL: 230, bodyH: 110, legL: 96, legW: 32, neck: [110, -96], head: { rx: 58, ry: 54 } },
    face: { style: 'iris', iris: '#7a5a1a', lidCol: '#c88a3a', eyeR: .17, eyeX: .4, eyeY: -.12, mouthY: .5, mouthW: .5, nose: 'cat', noseY: .22, cat: false, brow: true, browW: 1.4, browT: .45, browCol: '#8a4a1a', mouthCol: '#5a1e22', hx: 16, hy: 0, hd: { rx: 58, ry: 54 } },
    body: g => [[ellipsePts(0, -g.bodyH * .5, g.bodyL * .55, g.bodyH * .5, 0, 36), '#e0a84a', { line: 1.7, bloom: .8 }]],
    head: g => [[ellipsePts(16, 0, 58, 54, 0, 36), '#e8b45a', { line: 1.6, bloom: .7 }], [ellipsePts(16, 26, 30, 20, 0, 20), '#f6e2b8', { line: 0, under: false, a: .8 }],
      [ellipsePts(-22, -42, 14, 14, 0, 14), '#e0a84a', { line: 1.2 }], [ellipsePts(54, -42, 14, 14, 0, 14), '#e0a84a', { line: 1.2 }]],
    mane: g => [F(c => { for (let k = 0; k < 30; k++) { const a = k / 30 * TAU; brush(c, qcurve(16 + Math.cos(a) * 40, Math.sin(a) * 38, 16 + Math.cos(a) * 92, Math.sin(a) * 86, rnd(-12, 12), 6), rnd(22, 30), pick(['#b8662e', '#c8743a', '#a8582a']), { prof: 'leaf', nb: 4, a: .9 }); } }, [-90, -100, 120, 100])],
    tail: (c, g, by, t) => { brush(c, qcurve(-g.bodyL * .52, by - g.bodyH * .7, -g.bodyL * .8, by - g.bodyH * 1.1 + Math.sin(t * 2) * 6, 20, 8), 8, '#d0983a', { prof: 'even', nb: 0, a: 1 }); softBlob(c, -g.bodyL * .8, by - g.bodyH * 1.1 + Math.sin(t * 2) * 6, 14, 14, '#a8582a', .9, .6); } },
  mouse: { id: 'mouse', R: 6, col: '#9b9590', hoof: '#f0a9b4',
    geo: { bodyL: 34, bodyH: 22, legL: 7, legW: 4.5, neck: [16, -18], head: { rx: 11, ry: 10 } },
    face: { style: 'dot', eyeR: .22, eyeX: .4, eyeY: -.1, mouthY: .55, mouthW: .3, nose: 'none', browW: 1.5, browT: .5, browCol: '#4a3a2a', browUp: .2, hx: 4, hy: 0, hd: { rx: 11, ry: 10 } },
    body: g => [[ellipsePts(0, -g.bodyH * .5, g.bodyL * .55, g.bodyH * .5, 0, 28), '#9b9590', { line: 1, bloom: .7 }]],
    head: g => [[catmull([[-10, -9], [6, -10], [18, 2], [6, 9], [-8, 8]], true, 6), '#a8a29c', { line: 1, bloom: .6 }], [ellipsePts(-4, -14, 8, 8, 0, 16), '#f0a9b4', { line: 1 }], [ellipsePts(6, -13, 7, 7, 0, 16), '#f0a9b4', { line: 1 }],
      F(c => { c.beginPath(); c.arc(18, 2, 2.2, 0, TAU); c.fillStyle = '#e07a8a'; c.fill(); }, [-12, -22, 22, 12])],
    tail: (c, g, by, t) => { c.save(); c.strokeStyle = '#f0a9b4'; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-g.bodyL * .5, by - g.bodyH * .4); c.bezierCurveTo(-g.bodyL, by - g.bodyH * .2, -g.bodyL * 1.1, by - g.bodyH * 1.5 + Math.sin(t * 6) * 3, -g.bodyL * 1.5, by - g.bodyH * 1.1); c.stroke(); c.restore(); } },
};

function buildCast(ids) {
  for (const id of ids) {
    if (CH[id]) continue;
    if (SPECS[id]) CH[id] = buildHuman(SPECS[id]);
    else if (BEASTS[id]) CH[id] = buildBeast(BEASTS[id]);
  }
}
const ALLCAST = ['baker', 'tom', 'tomFine', 'puss0', 'puss', 'king', 'princess', 'ogre', 'bro1', 'bro2', 'guard', 'crier', 'servant', 'farmer1', 'farmer2', 'shepherd', 'picker', 'donkey', 'horse', 'sheep', 'lion', 'mouse'];
