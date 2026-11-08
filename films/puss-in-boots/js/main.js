// The film: timeline, camera, shots, transitions, page contract.
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const QS = new URLSearchParams(location.search);
const FPS = 24;
let VT = null;            // voice timeline (script/vtime.json)
let TL = null;            // resolved shots, cards, events
let BUF = null, BCTX = null;
const SCENE_Q = QS.get('scene');   // render one scene (clip) when set; 'all' or absent = whole film

// ---------------- anchors ----------------
function lineById(id) { return VT.lines.find(l => l.id === id); }
function wordTime(lid, word, which = 'start') {
  const L = lineById(lid); if (!L) throw new Error('no line ' + lid);
  let [w, n] = word.split('#'); n = +(n || 1); const nw = w.toLowerCase();
  let k = 0;
  for (const x of L.words) { const xx = x[0].toLowerCase().replace(/[^a-z0-9']/g, ''); if (xx === nw || xx.startsWith(nw)) { if (++k === n) return which === 'end' ? x[2] : x[1]; } }
  throw new Error(`word "${word}" not in ${lid}: ${L.text}`);
}
// "L012" line start · "L012>" line end · "L012:bread" word start · "L012:bread>" word end · "+1.5" offsets · numbers absolute
function anchor(a, base = 0) {
  if (typeof a === 'number') return a;
  let s = a.trim(), off = 0;
  const m = s.match(/^(.*?)([+-]\d+(\.\d+)?)$/); if (m && m[1] !== '') { s = m[1]; off = +m[2]; } else if (m) return base + +m[2];
  let t;
  if (s.includes(':')) { const [lid, w] = s.split(':'); t = w.endsWith('>') ? wordTime(lid, w.slice(0, -1), 'end') : wordTime(lid, w); }
  else if (s.endsWith('>')) t = lineById(s.slice(0, -1)).t1;
  else t = lineById(s).t0;
  return t + off;
}

// ---------------- timeline ----------------
function resolveTimeline() {
  const shots = [], ev = [];
  let sc = 0, last = 0;
  for (const S of SHOTS) {
    if (S.scene) { sc++; continue; }
    const t0 = anchor(S.at, last); last = t0;
    shots.push(Object.assign({}, S, { t0, sc: S.sc ?? sc }));
  }
  shots.sort((a, b) => a.t0 - b.t0);
  for (let i = 0; i < shots.length; i++) shots[i].t1 = i + 1 < shots.length ? shots[i + 1].t0 : FILM_END;
  for (const s of shots) {   // resolve relative times inside each shot
    const R = a => typeof a === 'number' ? s.t0 + a : anchor(a, s.t0);
    s.cast = (s.cast || []).map(c => { const o = Object.assign({}, c); o.kf = (c.kf || []).map(([tt, p]) => [R(tt), p]).sort((a, b) => a[0] - b[0]); return o; });
    s.fx = (s.fx || []).map(f => Object.assign({}, f, { t: R(f.at ?? 0), t2: f.to !== undefined ? R(f.to) : undefined }));
    s.camT = s.camAt ? s.camAt.map(R) : [s.t0, s.t1];
    for (const f of s.fx) { if (f.sfx) ev.push({ t: +(f.t + (f.sd || 0)).toFixed(3), type: f.sfx, g: f.g ?? 1, pan: f.pan ?? 0 }); }
    if (s.tr && s.tr !== 'cut') ev.push({ t: +s.t0.toFixed(3), type: 'tr_' + s.tr, g: 1 });
    if (s.sfx) for (const [tt, ty, g] of s.sfx) ev.push({ t: +R(tt).toFixed(3), type: ty, g: g ?? 1 });
  }
  // word cards: cut in just before the word, hold 3.0 s
  const cards = (VT.cards || []).map(c => { const tw = wordTime(c.line, c.word); return Object.assign({}, c, { tw, t0: tw - .28, t1: tw - .28 + 3.0 }); });
  for (const c of cards) { ev.push({ t: +c.t0.toFixed(3), type: 'card_in', g: 1 }); ev.push({ t: +(c.tw).toFixed(3), type: 'type', n: c.text.length, g: 1 }); ev.push({ t: +(c.t1).toFixed(3), type: 'card_out', g: 1 }); }
  // scenes (clips): frame ranges
  const scenes = [];
  for (const s of shots) { if (!scenes[s.sc]) scenes[s.sc] = { sc: s.sc, t0: s.t0, t1: s.t1, locs: new Set(), cast: new Set(), name: s.name || '' }; const Z = scenes[s.sc]; Z.t1 = Math.max(Z.t1, s.t1); }
  const sceneList = scenes.filter(Boolean);
  for (const Z of sceneList) { Z.f0 = Math.round(Z.t0 * FPS); }
  for (let i = 0; i < sceneList.length; i++) sceneList[i].f1 = i + 1 < sceneList.length ? sceneList[i + 1].f0 : Math.round(FILM_END * FPS);
  ev.sort((a, b) => a.t - b.t);
  return { shots, cards, ev, scenes: sceneList };
}
let FILM_END = 0;

// ---------------- easing & keyframes ----------------
const EASE = { ss, lin: x => clamp(x), eo, ei, eio, back: x => { x = clamp(x); const s = 1.7; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); } };
function castState(cs, t, shot) {
  // base state + keyframes; numeric props interpolate, discrete props switch, poses/expressions blend
  const st = Object.assign({ s: 1, face: 1, expr: 'smile', pose: 'down', turn: 0 }, cs);
  delete st.kf;
  let prev = null;
  const kf = cs.kf;
  let walkDist = 0;
  const base = Object.assign({}, st);
  let cur = Object.assign({}, base);
  let curT = shot.t0;
  // fold keyframes up to t
  let exprFrom = base.expr, exprTo = base.expr, exprT = -99, poseFrom = POSE[base.pose] || base.pose, poseTo = poseFrom, poseT = -99, poseDur = .35;
  for (let i = 0; i < kf.length; i++) {
    const [tk, p] = kf[i];
    if (tk > t) {   // interpolate toward this keyframe from cur
      const span = p.dur ?? (tk - curT);
      const t0 = tk - span;
      const u = clamp((t - t0) / Math.max(1e-3, span));
      const e = (EASE[p.ease] || ss)(u);
      const out = Object.assign({}, cur);
      for (const k of ['x', 'y', 's', 'turn', 'tilt', 'lean', 'alpha', 'dy', 'sy', 'sx', 'tailUp', 'water']) if (p[k] !== undefined && typeof p[k] === 'number') {
        const a = cur[k] ?? (k === 's' || k === 'alpha' || k === 'sy' || k === 'sx' ? 1 : 0);
        out[k] = lerp(a, p[k], e);
        if (k === 'y' && p.hop) out.y -= Math.sin(u * Math.PI) * p.hop;
      }
      if (p.x !== undefined && p.walk !== false && Math.abs(p.x - (cur.x ?? 0)) > 2) { out.walking = true; walkDist += Math.abs(out.x - (cur.x ?? 0)); out.walkRun = p.run; }
      walkDist += 0;
      return finish(out, t, walkDist + (cur._walk || 0), exprFrom, exprTo, exprT, poseFrom, poseTo, poseT, poseDur, cs);
    }
    // keyframe passed: apply fully
    if (p.x !== undefined && p.walk !== false) cur._walk = (cur._walk || 0) + Math.abs(p.x - (cur.x ?? 0));
    for (const k in p) if (!['dur', 'ease', 'hop', 'walk', 'run'].includes(k)) cur[k] = p[k];
    if (p.expr) { exprFrom = exprAt(exprFrom, exprTo, exprT, tk); exprTo = p.expr; exprT = tk; }
    if (p.pose) { poseFrom = poseAt(poseFrom, poseTo, poseT, tk, poseDur); poseTo = POSE[p.pose] || p.pose; poseT = tk; poseDur = p.pdur ?? .35; }
    curT = tk;
  }
  return finish(cur, t, cur._walk || 0, exprFrom, exprTo, exprT, poseFrom, poseTo, poseT, poseDur, cs);
}
function exprAt(a, b, t0, t) { return seg(t, t0, t0 + .25) >= 1 ? b : (seg(t, t0, t0 + .25) > .5 ? b : a); }
function poseAt(a, b, t0, t, dur) { const u = ss(seg(t, t0, t0 + dur)); return a.map((v, i) => lerp(v, b[i], u)); }
function finish(st, t, walkDist, ef, et, eT, pf, pt, pT, pD, cs) {
  // expression blend over .25 s, pose blend over pD
  const ek = ss(seg(t, eT, eT + .25));
  st.E = exprMix(ef, et, ek);
  if (st.exprNow) st.E = exprMix(st.exprNow, st.exprNow, 0);
  st.arms = poseAt(Array.isArray(pf) ? pf : POSE[pf], Array.isArray(pt) ? pt : POSE[pt], pT, t, pD);
  if (st.wave) { st.arms = st.arms.slice(); st.arms[2] += Math.sin(t * 9) * .25; st.arms[3] += Math.sin(t * 9 + 1) * .2; }
  if (st.waveBoth) { st.arms = st.arms.slice(); st.arms[0] += Math.sin(t * 9 + 2) * .25; st.arms[2] += Math.sin(t * 9) * .25; }
  const ch = CH[cs.id];
  const ph = hash(hashStr(cs.id) % 997) * 6.28;
  if (ch && ch.kind === 'human') {
    const stride = ch.g.leg * (st.walkRun ? 1.3 : .95);
    const a = walkDist / stride * Math.PI;
    if (st.walking) {
      const amp = st.walkRun ? .55 : .36;
      st.legF = Math.sin(a) * amp; st.legB = -Math.sin(a) * amp; st.bob = -Math.abs(Math.cos(a)) * ch.g.leg * .05;
      if (!cs.keepArms) { st.arms = st.arms.slice(); st.arms[0] += -Math.sin(a) * (st.walkRun ? .6 : .3); st.arms[2] += Math.sin(a) * (st.walkRun ? .6 : .3); }
    }
    st.breath = .012 * Math.sin(t * 2.1 + ph);
    if (st.tilt === undefined) st.tilt = .035 * Math.sin(t * .7 + ph);
    if (st.shiver) { st.x += Math.sin(t * 60) * 1.5; st.tilt = (st.tilt || 0) + Math.sin(t * 47) * .02; }
  } else if (ch && ch.kind === 'beast') {
    st.walk = walkDist / (ch.g.legL * 1.1) * Math.PI; st.moving = !!st.walking;
    if (st.tilt === undefined) st.tilt = .04 * Math.sin(t * .8 + ph);
  }
  // blinking
  const per = 2.6 + hash(ph) * 2.2, bt = (t + ph * 3) % per;
  st.blink = bt < .07 ? bt / .07 : bt < .15 ? 1 - (bt - .07) / .08 : 0;
  if (st.eyesClosed) st.blink = 1;
  // lip-sync from the narration
  st.talk = talkAt(cs.id, cs.voice, t);
  st.ph = ph;
  return st;
}
const WHO = { tom: ['tom', 'tomFine'], puss: ['puss', 'puss0'], king: ['king'], crier: ['crier'], ogre: ['ogre'], mouse: ['mouse'], farmers: ['farmer1', 'farmer2'], shepherd: ['shepherd'], picker: ['picker'], sheep: ['sheep'], princess: ['princess'] };
function talkAt(id, voice, t) {
  for (const L of VT.lines) {
    if (!L.quote || t < L.t0 - .1 || t > L.t1 + .1) continue;
    const ids = WHO[L.who] || [];
    if (!ids.includes(id) && voice !== L.who) continue;
    if (voice === false) continue;
    for (const [a, b] of L.quote) if (t >= a && t <= b) { const i = Math.floor((t - L.t0) * FPS); const e = L.env[Math.max(0, Math.min(L.env.length - 1, i))] || 0; return clamp(e * 1.05); }
  }
  return 0;
}

// ---------------- camera ----------------
// cam: [x, y, z] or [x0, y0, z0, x1, y1, z1]; camEase: easing name; shake
function camAt(s, t) {
  const c = s.cam || [0, 0, 1];
  const u = (EASE[s.camEase] || (x => ss(x) * .5 + clamp(x) * .5))(seg(t, s.camT[0], s.camT[1]));
  let x, y, z;
  if (c.length === 6) { x = lerp(c[0], c[3], u); y = lerp(c[1], c[4], u); z = Math.exp(lerp(Math.log(c[2]), Math.log(c[5]), u)); }
  else { x = c[0]; y = c[1]; z = c[2]; }
  if (s.shake) { const k = s.shake[0] * Math.max(0, 1 - (t - anchorShake(s)) / s.shake[1]); if (t > anchorShake(s)) { x += Math.sin(t * 61) * k; y += Math.cos(t * 53) * k; } }
  return { x, y, z };
}
function anchorShake(s) { return s._shakeT ?? (s._shakeT = typeof s.shake[2] === 'number' ? s.t0 + s.shake[2] : anchor(s.shake[2])); }
// world (layer k) → screen
function w2s(cam, k, x, y) { const zk = Math.pow(cam.z, k); return [W / 2 + (x - cam.x * k) * zk, H / 2 + (y - cam.y * k) * zk, zk]; }
function layerXf(c, cam, k) { const zk = Math.pow(cam.z, k); c.setTransform(zk, 0, 0, zk, W / 2 - cam.x * k * zk, H / 2 - cam.y * k * zk); }

// ---------------- drawing a shot ----------------
function lpAt(s, t) { const P = {}; const u = ss(seg(t, s.t0 + (s.lpDelay || 0), s.t1)); for (const [k, v] of Object.entries(s.lp || {})) P[k] = Array.isArray(v) ? lerp(v[0], v[1], u) : v; return P; }
function drawShot(c, s, t) {
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  if (s.kind === 'moral') return drawMoral(c, s, t);
  if (s.kind === 'end') { drawLocation(c, s, t); return drawEndCard(c, s, t); }
  drawLocation(c, s, t);
}
function drawLocation(c, s, t) {
  const loc = LOC[s.loc], cam = camAt(s, t), P = lpAt(s, t);
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  const states = (s.cast || []).map(cs => ({ cs, st: castState(cs, t, s) }));
  for (const L of loc.layers) {
    if (s.hide && s.hide.includes(L.name)) continue;
    const a = L.alpha ? L.alpha(P) : 1; if (a <= .001) continue;
    layerXf(c, cam, L.k); c.globalAlpha = a;
    if (L.spr) drawSprite(c, L.spr);
    drawItems(c, L, t);
    if (L.live) L.live(c, t, P, s);
    c.globalAlpha = 1;
    // characters on this layer (default: the ground layer, k=1)
    for (const { cs, st } of states) {
      if ((cs.ly ?? 1) !== L.k || st.hidden) continue;
      if (st.alpha !== undefined && st.alpha <= .01) continue;
      layerXf(c, cam, L.k);
      if (st.water !== undefined) { c.save(); c.beginPath(); c.rect(st.x - 400, st.y - 2000, 800, 2000 - (st.y - st.water) * 0 - (st.y - st.water)); c.clip(); }
      drawChar(c, cs.id, st, t);
      if (st.water !== undefined) { c.restore(); drawRipples(c, st.x, st.water, t, (CH[cs.id] && CH[cs.id].g.shoulder || 60) * (st.s || 1)); }
    }
    layerXf(c, cam, L.k); drawItems(c, L, t, true);
    for (const f of s.fx || []) if ((f.layer ?? 1) === L.k && f.world) drawFx(c, f, t, s, cam, states);
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (loc.grade) loc.grade(c, t, P);
  for (const f of s.fx || []) if (!f.world) drawFx(c, f, t, s, cam, states);
}
function drawRipples(c, x, y, t, w) {
  for (let k = 0; k < 3; k++) { const ph = (t * .6 + k / 3) % 1; c.beginPath(); c.ellipse(x, y, w * (.8 + ph * 1.2), 8 + ph * 10, 0, 0, TAU); c.strokeStyle = `rgba(240,250,250,${.6 * (1 - ph)})`; c.lineWidth = 2.5; c.stroke(); }
  c.beginPath(); c.ellipse(x, y, w * .9, 9, 0, 0, TAU); c.fillStyle = 'rgba(120,180,190,.35)'; c.fill();
}

// ---------------- transitions ----------------
function transition(s, t) { const d = { page: 1.0, wipe: .75, mist: 1.1, flash: .3 }[s.tr] || 0; return d && t < s.t0 + d ? seg(t, s.t0, s.t0 + d) : 1; }
function composeTransition(c, prevS, s, t, u) {
  drawShot(BCTX, prevS, t);           // outgoing into the buffer
  drawShot(c, s, t);                  // incoming on screen
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (s.tr === 'page') {   // the old page lifts and turns from right to left
    const e = eio(u), fx = lerp(W * 1.02, -W * .55, e), back = (W - fx) * .42 * Math.sin(Math.PI * Math.min(1, e * 1.1));
    c.save(); c.beginPath(); c.rect(0, 0, Math.max(0, fx - back * .02), H); c.clip(); c.drawImage(BUF, 0, 0); c.restore();
    // the curling page back
    if (fx < W && fx > -back) {
      const g = c.createLinearGradient(fx - back, 0, fx, 0); g.addColorStop(0, '#e6d8bc'); g.addColorStop(.75, '#f6eedc'); g.addColorStop(1, '#d8c8a8');
      c.fillStyle = g; c.beginPath(); c.moveTo(fx, -20); c.quadraticCurveTo(fx - back * 1.1, H * .5, fx - back * .2, H + 20); c.lineTo(fx, H + 20); c.closePath(); c.fill();
      const sh = c.createLinearGradient(fx, 0, fx + 140, 0); sh.addColorStop(0, 'rgba(40,25,15,.32)'); sh.addColorStop(1, 'rgba(40,25,15,0)'); c.fillStyle = sh; c.fillRect(fx, 0, 140, H);
    }
  } else if (s.tr === 'wipe') {   // brush-edge wipe left → right
    const e = eio(u), x = lerp(-200, W + 200, e);
    c.save(); c.beginPath(); c.moveTo(W, 0); c.lineTo(x + 40, 0);
    for (let y = 0; y <= H; y += 30) c.lineTo(x + Math.sin(y * .021 + 1) * 40 + Math.sin(y * .07) * 14, y);
    c.lineTo(W, H); c.closePath(); c.clip(); c.drawImage(BUF, 0, 0); c.restore();
    c.save(); c.globalAlpha = .5; for (let y = 0; y <= H; y += 26) softBlob(c, x + Math.sin(y * .021 + 1) * 40, y, 26, 18, '#e8dcc4', .6, .5); c.restore();
  } else if (s.tr === 'mist') {   // paper mist rises over the old picture and clears off the new one
    if (u < .5) { c.drawImage(BUF, 0, 0); mistLayer(c, u * 2, t); } else mistLayer(c, (1 - u) * 2, t);
  } else if (s.tr === 'flash') { c.save(); c.globalAlpha = 1 - u; c.fillStyle = '#fff8ea'; c.fillRect(0, 0, W, H); c.restore(); }
}
function mistLayer(c, a, t) {
  const top = lerp(H + 100, -200, ss(a));
  c.save(); c.fillStyle = rgba('#f3ead8', 1); c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 40) c.lineTo(x, top + Math.sin(x * .006 + t) * 50 + Math.sin(x * .017) * 20); c.lineTo(W, H); c.closePath(); c.fill();
  for (let x = 0; x <= W; x += 60) softBlob(c, x, top + Math.sin(x * .006 + t) * 50, 90, 60, '#f3ead8', .9, .4);
  c.restore();
}

// ---------------- the frame ----------------
function shotAt(t) { const S = TL.shots; let lo = 0, hi = S.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (S[m].t0 <= t) lo = m; else hi = m - 1; } return lo; }
function cardAt(t) { for (const c of TL.cards) if (t >= c.t0 && t < c.t1) return c; return null; }
function renderGlobal(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const card = cardAt(t);
  if (card) drawCard(ctx, card, t);
  else {
    const i = shotAt(t), s = TL.shots[i], u = transition(s, t);
    if (u < 1 && i > 0) composeTransition(ctx, TL.shots[i - 1], s, t, u); else drawShot(ctx, s, t);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  // paper grain over everything
  ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(PAPERTEX, 0, 0); ctx.globalCompositeOperation = 'source-over';
  // fade from / to black only at the very start and end
  const fin = 1 - seg(t, 0, .8), fout = seg(t, FILM_END - 1.2, FILM_END);
  if (fin > 0 || fout > 0) { ctx.fillStyle = `rgba(14,9,6,${Math.max(fin, fout)})`; ctx.fillRect(0, 0, W, H); }
}

// ---------------- init ----------------
let T_OFF = 0;
window.render = t => renderGlobal(t + T_OFF);
window.TEXTS = t => textsAt(t + T_OFF);
(async () => {
  VT = await (await fetch('script/vtime.json')).json();
  FILM_END = VT.last_line_end + END_TAIL;
  TL = resolveTimeline();
  window.EV = TL.ev; window.SCENES = TL.scenes.map(z => ({ sc: z.sc, t0: z.t0, t1: z.t1, f0: z.f0, f1: z.f1, name: z.name })); window.SHOTLIST = TL.shots.map(s => ({ t0: s.t0, t1: s.t1, sc: s.sc, loc: s.loc, kind: s.kind, name: s.name, note: s.note, tr: s.tr, cam: s.cam, cast: (s.cast || []).map(c => c.id), fx: (s.fx || []).map(f => f.sw || f.bub || f.label || f.sfx || f.type || f.think || '').filter(Boolean) }));
  window.CARDS = TL.cards.map(c => ({ t0: c.t0, t1: c.t1, text: c.text }));
  let t0 = 0, t1 = FILM_END;
  if (QS.get('loc')) {   // debug: one location, one camera
    const [x, y, z] = (QS.get('cam') || '0,0,1').split(',').map(Number);
    TL.shots = [{ t0: 0, t1: 99, loc: QS.get('loc'), cam: [x, y, z], camT: [0, 99], cast: [], fx: [], lp: { clear: +(QS.get('clear') || 0) } }]; TL.cards = [];
  }
  if (SCENE_Q && SCENE_Q !== 'all') { const Z = TL.scenes.find(z => z.sc === +SCENE_Q); t0 = Z.f0 / FPS; t1 = Z.f1 / FPS; }
  T_OFF = t0; window.DUR = +(t1 - t0).toFixed(4);
  // what this range needs
  const need = new Set(), cast = new Set(['puss', 'puss0', 'tom']), cardObjs = new Set();
  TL.shots.forEach((s, i) => { const nxt = TL.shots[i + 1]; if (s.t1 > t0 - 2 && s.t0 < t1) { if (s.loc) need.add(s.loc); (s.cast || []).forEach(c => cast.add(c.id)); if (s.kind === 'moral' || s.kind === 'end') need.add('desk'); } });
  TL.cards.forEach(c => { if (c.t1 > t0 && c.t0 < t1) cardObjs.add(c.obj); });
  await document.fonts.load('700 120px Andika'); await document.fonts.load('700 60px Caveat'); await document.fonts.load('700 80px Fredoka'); await document.fonts.load('italic 700 80px "Cormorant Garamond"'); await document.fonts.load('700 80px "Cormorant Garamond"'); await document.fonts.ready;
  buildTextures(); buildPaper(); buildProps();
  buildCast([...cast].concat(CARD_CAST.filter(id => [...cardObjs].some(o => CARD_NEEDS[o] === id))));
  for (const id of need) buildLoc(id);
  buildCards([...cardObjs]);
  BUF = document.createElement('canvas'); BUF.width = W; BUF.height = H; BCTX = BUF.getContext('2d');
  window.READY = true;
})().catch(e => { console.error(e); throw e; });
