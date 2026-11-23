// The shot system. A shot is a function of a context `c` that picks a set, moves the camera once (eased), places
// actors (paper puppets with contact shadows), and adds effects. Everything is a pure function of time.
//   S(c => { c.set(MILL); c.cam({zoom:1.6,x:0,y:0}, {x:40}); c.actor('tom', 'tom', {x:-200, y:100, pose:{...}}); c.fx(word(...)); })
import { drawScene, project, W, H } from '../engine.js';
import { makePerson, LOOKS } from './person.js';
import { makePussStand } from './cat.js';
import { makePuss, makeTom, blinkTrack } from '../puppets.js';
import { clamp, lerp, eio, ss, hash, mulberry, TAU } from '../lib.js';
import * as A from './animals.js';

// ---------- talking: the speaker's mouth moves only on their own quoted words ----------
const TALK = {};
const syl = w => Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, '').match(/[aeiouy]+/g) || []).length);
export function talk(speaker) {
  return TALK[speaker] ??= (() => {
    const TL = globalThis.TL, ev = [];
    for (const l of TL.lines) if (l.speaker === speaker) for (const w of l.wordtimes) if (w.dialog) {
      const n = syl(w.w), d = (w.t1 - w.t0) * .92;
      for (let k = 0; k < n; k++) ev.push([w.t0 + d * k / n, w.t0 + d * (k + 1) / n, .45 + .55 * hash(w.t0 * 13 + k * 7)]);
    }
    return T => { for (const [a, b, amp] of ev) if (T >= a && T < b) { const u = (T - a) / (b - a); return amp * Math.pow(Math.sin(u * Math.PI), .7); } return 0; };
  })();
}
export const speaking = (speaker, T) => { const TL = globalThis.TL; for (const l of TL.lines) if (l.speaker === speaker) for (const s of l.dialog_spans) if (T >= s[0] - .05 && T < s[1] + .05) return true; return false; };
// blinks every 3-5 s (some double), seeded per character so two characters rarely blink together
const BL = {}; export const blink = (who, extra = []) => { const f = BL[who] ??= blinkTrack([...who].reduce((a, ch) => a + ch.charCodeAt(0), 0)); if (!extra.length) return f; const g = blinkTrack(1, { forced: extra }); return T => Math.max(f(T), 0); };

// ---------- puppets: one rig per (kind, resolution, facing) ----------
const RIGS = new Map();
const RES = [2, 3, 4, 5, 6];
export const SCALE = { person: 1.25, cat: .37 };
export function rigFor(kind, res, face = 'R') {
  const key = kind + '|' + res + '|' + face; if (RIGS.has(key)) return RIGS.get(key);
  let rig;
  if (kind === 'pussSit') rig = makePuss({ res, turn: face === 'L' ? -.55 : .55 });
  else if (kind === 'puss') rig = makePussStand({ res, turn: face === 'L' ? -.5 : .5 });
  else if (kind === 'tomBread' || kind === 'tomBreadJ') rig = makeTom({ res, bodyTurn: .45, jacket: kind === 'tomBreadJ' });
  else if (A[kind]) rig = A[kind]({ res });
  else { const [look, mode] = kind.split(':'); rig = makePerson(look, { res, seated: mode === 'seat', turn: mode === 'front' ? .15 : .45 }); }
  RIGS.set(key, rig); return rig;
}

// ---------- sets: built once, every base layer restored to its built state before each shot ----------
const SETS = new Map();
const KEEP = ['x', 'y', 'z', 'd', 'vis', 'alpha', 'sx', 'sy', 'rot', 'flipX', 'blur', 'bright', 'trans', 'lit'];
function useSet(build) {
  let s = SETS.get(build);
  if (!s) { s = build(); s.base = s.layers.slice(); s.snap = s.base.map(l => Object.fromEntries(KEEP.map(k => [k, l[k]]))); s.fx0 = (s.fx || []).slice(); s.post0 = { ...(s.post || {}) }; s.focus0 = s.focus; s.light0 = s.light && { ...s.light }; SETS.set(build, s); }
  s.base.forEach((l, i) => Object.assign(l, s.snap[i]));
  s.fx = s.fx0.slice(); s.post = { ...s.post0 }; s.focus = s.focus0; s.blurOverride = null; if (s.light0) s.light = { ...s.light0 };
  s.cam = { x: 0, y: 0, zoom: 1, dz: 0, sx: 0, sy: 0, roll: 0 }; s.reset?.();
  return s;
}

export class Ctx {
  constructor(lt, shot) { this.t = lt; this.T = shot.t0 + lt; this.dur = shot.t1 - shot.t0; this.u = clamp(lt / this.dur); this.shot = shot; this.actors = []; this.over = []; this.shk = 0; }
  // the set; `name` layers can be fetched with c.L(name)
  set(build) { this.sc = useSet(build); this.sc.shotT = this.T; return this.sc; }
  L(name) { return this.sc.base.find(l => l.name === name); }
  show(...names) { for (const n of names) { const l = this.L(n); if (l) l.vis = true; } }
  hide(...names) { for (const n of names) { const l = this.L(n); if (l) l.vis = false; } }
  // one slow camera move over the shot, eased in and out; with no `to`, a slow push so the frame is never still
  cam(a, b = null, ease = eio, span = null) {
    const u = span ? clamp((this.t - span[0]) / (span[1] - span[0])) : this.u, e = ease(u), c = this.sc.cam;
    const from = { zoom: 1, x: 0, y: 0, dz: 0, roll: 0, ...a }, to = { ...from, ...(b || { dz: from.dz + .04 }) };
    for (const k of ['zoom', 'x', 'y', 'dz', 'roll']) c[k] = lerp(from[k], to[k], e);
    return c;
  }
  snap(at = 0, frames = 6, amount = .6) {   // a comic snap-zoom: 6 frames, then holds
    const u = clamp((this.t - at) / (frames / 24)); this.sc.cam.dz += amount * (1 - Math.pow(1 - u, 3)) * (u > 0 ? 1 : 0);
  }
  shake(at, dur = .3, px = 3) { if (this.t > at && this.t < at + dur) { const k = 1 - (this.t - at) / dur; this.sc.cam.sx = Math.sin(this.t * 97) * px * k; this.sc.cam.sy = Math.cos(this.t * 83) * px * k; } }
  // screen position of a world point at distance d
  p(x, y, d = 2) { const q = project(x, y, d, this.sc.cam); return q ? [q.px, q.py, q.Z] : [-9e3, -9e3, 1]; }
  // an actor: kind = a LOOKS key ('tom', 'king', ... with ':seat' or ':front'), 'puss', 'pussSit', 'tomBread', or an animal
  actor(kind, o = {}) {
    const isCat = kind === 'puss' || kind === 'pussSit', face = o.face || 'R', d = o.d ?? this.sc.actD ?? 2;
    const s = o.s ?? (isCat ? SCALE.cat : A[kind] ? (A[kind].scale || .6) : SCALE.person) * (o.k ?? 1);
    const Z = this.sc.cam.zoom * d / Math.max(.15, d - this.sc.cam.dz), need = s * Z * (o.sharpen ?? 1.05);
    const res = o.res ?? RES.find(r => r >= need) ?? 6;
    const rig = rigFor(kind, Math.min(res, o.maxRes ?? (kind.startsWith('tomBread') ? 6 : 5)), isCat ? face : 'R');
    const pose = {}; const P = o.pose || {};
    for (const k in P) pose[k] = P[k];
    if (o.who && pose.blink === undefined) pose.blink = blink(o.who);
    if (o.who && pose.talk === undefined) pose.talk = talk(o.who);
    rig.pose(this.T, pose);
    const lay = { sheet: rig.dyn, x: o.x ?? 0, y: o.y ?? 0, z: o.z ?? 3, d, sx: s * (!isCat && face === 'L' ? -1 : 1), sy: s, rot: o.rot || 0, alpha: o.alpha ?? 1, vis: o.vis ?? true, name: o.name || kind,
      shadow: o.shadow ?? { dx: (this.sc.lightDir || [.6, .8])[0] * 22, dy: (this.sc.lightDir || [.6, .8])[1] * 16, blur: 14, a: o.wallA ?? .26 }, blur: o.blur ?? 'auto', sharp: o.sharp, haze: o.haze ?? 0, trans: 0, lit: 0 };
    if (o.contact !== false) { const cw = (o.cw ?? (isCat ? 110 : 90)), ca = o.ca ?? .5; lay.pre = (g, info, l) => { const { px, py, Z } = info, w = cw * Z * Math.abs(l.sy); g.save(); g.translate(px + 4 * Z, py + 2 * Z); g.scale(1, .2); const gr = g.createRadialGradient(0, 0, 0, 0, 0, w); gr.addColorStop(0, `rgba(25,12,6,${ca})`); gr.addColorStop(1, 'rgba(25,12,6,0)'); g.fillStyle = gr; g.fillRect(-w, -w, w * 2, w * 2); g.restore(); }; }
    if (o.clip) lay.clip = o.clip;
    this.actors.push(lay); return lay;
  }
  layer(l) { this.actors.push(l); return l; }
  fx(...fs) { this.over.push(...fs); }
  draw(g) {
    const sc = this.sc; sc.update?.(this.T, this);
    sc.layers = sc.base.concat(this.actors);
    const user = this.over, c = this; sc.fx = sc.fx.concat(user.map(f => (gg) => f(gg, c)));
    sc.cam.sx = (sc.cam.sx || 0); drawScene(g, sc);
  }
}
// a shot
export function S(fn) { return { draw(g, lt, s) { const c = new Ctx(lt, s); fn(c); c.draw(g); } }; }
// helpers for poses
export const at = (T0, a, b, f = ss) => T => f(clamp((T - T0 - a) / (b - a)));   // 0→1 between shot-local times a..b (T0 = the shot's start)
export const pulse = (t, a, b) => { const u = (t - a) / (b - a); return u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0; };
export const antic3 = (t, a, dur = .5, back = .12) => {   // three beats: a small move the opposite way, the big pose, a settle
  const u = (t - a) / dur; if (u <= 0) return 0; if (u < .2) return -back * Math.sin(u / .2 * Math.PI / 2); if (u < .55) return -back + (1.08 + back) * ss((u - .2) / .35); return 1.08 - .08 * ss((u - .55) / .45);
};
export { W, H };
