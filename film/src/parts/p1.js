// PART 1 (after the approved first 25 s): the mill door, the father, the brothers, Tom and the talking cat.
// On the steps the camera always keeps one side: the wall behind, Tom on the left, the cat on the right.
import { S, rigFor, talk, blink, pulse, antic3 } from '../kit/stage.js';
import { word, bubble, sparkle, puffs, rumble, mark, bits } from '../kit/fx.js';
import * as PR from '../kit/props.js';
import { buildSteps, buildMillWorld, STEP, MILL } from '../scenes.js';
import { Layer, glow, specks } from '../engine.js';
import { clamp, lerp, ss, eio, seg, back } from '../lib.js';
import { wt, beam, aim, atS, HEAD } from './util.js';
const TOM = HEAD.tom, CAT = HEAD.cat;
const camTom = (c, z = 3.0, o = {}) => aim(c, TOM[0], TOM[1], TOM[2], z, .42, .38, { dz: .07, ...o });
const camCat = (c, z = 4.4, o = {}) => aim(c, CAT[0], CAT[1], CAT[2], z, .56, .4, { dz: .08, ...o });

const STEPS = () => buildSteps({ ots: false }), WORLD = () => buildMillWorld();
const G = STEP, top = x => G.tomY + 8 - (x - G.tomX) * .1;
const lineBlinks = who => blink(who);
// set up the steps: Tom (bread puppet unless `free`), the cat, foreground pieces
function steps(c, o = {}) {
  const sc = c.set(STEPS); sc.hires = !!o.hires; sc.focus = o.focus ?? 2.0;
  sc.tomL.vis = o.tom !== false; sc.pussL.vis = o.cat !== false;
  Object.assign(sc.tomL, { x: G.tomX, y: G.tomY, d: 2.0, sx: G.tomS, sy: G.tomS });
  const after = c.T > 64.9;   // after he gives the cat half the bread, Tom holds his own half in his lap
  if (o.free || after) sc.tomRig = rigFor('tom:seat', o.res ?? 3);
  const half = after ? { armN: { x: -10, y: -40 }, handN: 'hold', propN: { sheet: PR.breadHalf(1, 4), x: 0, y: 12, s: .95 } } : {};
  sc.tomPose = { blink: blink('Tom'), talk: talk('Tom'), ...half, ...(o.tomPose || {}) };
  sc.catPose = { blink: blink('Puss'), talk: talk('Puss'), ...(o.catPose || {}) };
  Object.assign(sc.sackL, { x: -760, y: 420, sx: 1, sy: 1, vis: o.sack ?? true }); Object.assign(sc.ivyL, { x: 820, y: -470, vis: o.ivy ?? true });
  return sc;
}
const prop = (c, sheet, x, y, d, s = 1, extra = {}) => c.layer(new Layer({ sheet, x, y, d, sx: s, sy: s, z: extra.z ?? 2.6, shadow: { dx: 14, dy: 12, blur: 12, a: .3 }, ...extra }));

export const P1 = {
  // the mill door: a millstone and a flour sack; flour dust in the sunbeam only
  'L004[6:]': S(c => {
    const sc = steps(c, { tom: false, cat: false, sack: false });
    prop(c, PR.millstone(2), 420, top(420) + 4, 2.2, 1.05); prop(c, PR.sack(2), -40, top(-40) + 6, 2.15, 1.1, { z: 2.7 });
    c.cam({ zoom: 1.55, x: 100, y: -130 }, { x: 200, y: -120, dz: .05 });
    c.fx(beam([[-300, -900], [60, -900], [460, top(460)], [60, top(60)]], 2.4, { n: 90, a: .5 }));
  }),
  // the father, shown gently: his empty chair and hat by the mill door; a slow push-in; dust in a sunbeam
  'L005': S(c => {
    const sc = steps(c, { tom: false, cat: false, sack: false });
    prop(c, PR.chairHat(2), 0, top(0) + 2, 2.2, 1.25); sc.post.tintA = .2;
    c.cam({ zoom: 1.5, x: 60, y: -170 }, { zoom: 1.5, x: 40, y: -180, dz: .14 });
    c.fx(beam([[-500, -900], [-120, -900], [190, top(190)], [-180, top(-180)]], 2.4, { n: 60, a: .45 }));
  }),
  // the oldest brother takes the mill key, struts to the door (then the word card "the mill")
  'L006': S(c => {
    steps(c, { tom: false, cat: false });
    const x = lerp(-150, 60, eio(c.t / 1.43)), wk = c.t * 2.2;
    c.actor('bro1', { x, y: top(x) + 6, d: 2.15, who: 'bro1', pose: { walk: wk, lookX: .8, lookY: -.1, headTilt: -.08, eyes: 'half', mouth: 'smirk', armN: { x: 60, y: -120, bend: 1 }, handN: 'hold', propN: { sheet: PR.key(4), x: 4, y: 4, rot: -1.2, s: .8 } } });
    c.cam({ zoom: 1.45, x: -40, y: -190 }, { x: 40, y: -190 });
    c.fx(sparkle(x + 110, top(x) - 340, .55, { n: 4, size: 18, d: 2.15 }));
  }),
  // the middle brother leads the donkey away along the river bank (ears flop, tail swish), then the card "the donkey"
  'L007': S(c => {
    const sc = c.set(WORLD); sc.focus = 1.75; sc.post = { ...sc.post };
    const x = lerp(300, -60, c.t / 1.78), wk = c.t * 2.1;
    c.actor('bro2', { x: x - 270, y: 470, d: 1.75, z: 6.6, who: 'bro2', face: 'L', pose: { walk: wk, lookX: .9, armF: { x: 80, y: -70 }, handF: 'hold' } });
    c.actor('donkey', { x: x + 40, y: 470, d: 1.76, who: 'donkey', face: 'L', z: 6.5, pose: { walk: wk * .95, earFlop: 1, lookX: .5 } });
    c.cam({ zoom: 1.35, x: -60, y: 190 }, { zoom: 1.35, x: -150, y: 190, dz: .03 });
  }),
  // Tom alone on the step with the cat beside him; a slow pull-out so they look small (then the card "the cat")
  'L008': S(c => {
    const sc = steps(c, { tomPose: { lookY: .8, lookX: .4, browTilt: -.6, worry: .2 }, catPose: { lookX: -1, lookY: .3 } });
    c.cam({ zoom: 1.55, x: -20, y: -40, dz: .08 }, { zoom: 1.2, x: -20, y: -10, dz: 0 });
  }),
  // "A cat?": eyebrows up, both hands open (anticipate, pop, settle)
  'L009': S(c => {
    const a = antic3(c.t, .55, .6), up = clamp(a, -.2, 1.1);
    steps(c, { free: true, res: 4, tomPose: { lookX: .9, lookY: .1, brow: up * 1.1, wide: up * .3, mouth: 'o', headTilt: -.04 * up,
      armN: { x: -60 - 55 * up, y: -40 - 25 * up }, armF: { x: 60 + 55 * up, y: -40 - 25 * up }, handN: up > .3 ? 'open' : 'rest', handF: up > .3 ? 'open' : 'rest', lift: 6 * up } });
    camTom(c, 2.7); const [mx, my] = atS(c, .62, .18); c.fx(mark('?', mx, my, .95, { size: 70, col: '#fff6e0' }));
  }),
  // "I can't buy dinner with a cat!": over the cat's head (foreground right, soft), Tom gestures with both hands
  'L010': S(c => {
    const g1 = Math.sin(c.t * 3.1) * .5 + .5;
    steps(c, { free: true, res: 3, cat: false, tomPose: { lookX: .9, lookY: .3, brow: .5, browTilt: .3, armN: { x: -70 - 20 * g1, y: -90 - 30 * g1 }, armF: { x: 60 + 30 * g1, y: -80 - 20 * g1 }, handN: 'open', handF: 'open', headTilt: Math.sin(c.t * 2.2) * .03 } });
    aim(c, TOM[0], TOM[1], 2, 1.9, .38, .36, { dz: .06 }); const [fx0, fy0] = atS(c, .84, 1.12, 1.45);
    c.actor('pussSit', { face: 'L', x: fx0, y: fy0, d: 1.45, s: .95, who: 'Puss', z: 7, contact: false, shadow: false, pose: { lookX: -1, lookY: -.8, headLift: .7, earLag: .1 } });
  }),
  // his tummy rumbles: comic rumble lines, he pats it
  'L011': S(c => {
    const pat = Math.abs(Math.sin(c.t * 5)) * (c.t > .9 ? 1 : 0);
    steps(c, { free: true, res: 5, cat: false, ivy: false, tomPose: { lookY: 1, armN: { x: -10, y: -40 - pat * 12 }, handN: 'open', armF: { x: 40, y: -20 }, handF: 'rest' } });
    aim(c, -195, 45, 2, 4.0, .5, .48, { dz: .1 }); c.fx(rumble(-200, 40, .1, 2.2, { col: '#4a2a3e' }));
  }),
  // he looks at his last piece of bread, worried; the camera pans down to his hands (then the card "the bread")
  'L012': S(c => {
    steps(c, { hires: true, cat: false, tomPose: { lookY: .95, lookX: .3, brow: .25, browTilt: -.85, mouth: 'wobbly', wob: t => 1.2 * Math.sin(t * 7), worry: .3 } });
    c.cam({ zoom: 3.2, x: -160, y: -120 }, { zoom: 3.4, x: -170, y: -10 });
  }),
  // XCU: the bread cracks in two in Tom's hands (the hook's framing family)
  'L013[1:6]': S(c => {
    const sp = ss(seg(c.t, 1.0, 1.45));
    steps(c, { hires: true, cat: false, ivy: false, tomPose: { lookY: .75, lookX: .2, browTilt: -.4, worry: t => pulse(t - c.shot.t0, .4, 1.0) * .8, split: sp } });
    Object.assign(c.sc.sackL, { x: -380, y: 196, sx: .24, sy: .24 });
    c.cam({ zoom: 5.0, x: -150, y: 88 }, { zoom: 5.0, x: -150, y: 88, dz: .08 }, x => x);
    c.fx(bits(-190, 30, 1.0, { n: 14, d: 2.0, r: 2.4 }));
  }),
  // over Tom's shoulder: he holds out one half to the cat; the cat sniffs it
  'L013[7:]': S(c => {
    const sc = steps(c, { hires: true, tomPose: { lookY: .55, lookX: .9, browTilt: -.2, mouth: 'smile', smile: .4, split: 1, offer: ss(seg(c.t, .2, 1.2)) * 1.6 },
      catPose: { lookX: -1, lookY: .55, headDown: .5, sniff: t => { const v = (t - c.shot.t0 - 1.3) / .8; return v > 0 && v < 1 ? Math.abs(Math.sin(v * Math.PI * 5)) : 0; } } });
    Object.assign(sc.tomL, { x: -450, y: 55, d: 1.45, sx: 2.4, sy: 2.4 }); sc.focus = 2.2; sc.ivyL.vis = sc.sackL.vis = false;
    c.cam({ zoom: 2.0, x: -60, y: -30 }, { zoom: 2.0, x: -30, y: -30, dz: .08 });
  }),
  // tilt up the sleek orange cat, now in the light
  'L014[1:6]': S(c => {
    steps(c, { tom: false, ivy: false, catPose: { lookX: -.8, lookY: .1, tailLag: .1 } });
    prop(c, PR.breadHalf(-1, 4), G.catX - 70, G.catY - 6, 2.2, .45, { z: 3.1 });
    aim(c, CAT[0], CAT[1] + 70, 2.2, 4.2, .56, .5, { Y: CAT[1], fy: .4, dz: .04 });
    c.fx((g, cc) => { const [x, y, Z] = cc.p(G.catX, G.catY - 80, 2.2); glow(g, x - 40 * Z, y - 60 * Z, 260 * Z, [255, 214, 150], .22); });
  }),
  // XCU: bright green eyes open wide; a white paw lifts to wipe a whisker
  'L014[7:]': S(c => {
    const paw = ss(seg(c.t, 1.2, 1.7)) * (1 - ss(seg(c.t, 2.6, 3.1)));
    steps(c, { tom: false, ivy: false, sack: false, catPose: { lookX: -.6, lookY: -.1, wide: ss(seg(c.t, .2, .5)) * .3, sparkle: pulse(c.t, .3, 1.1), pawLift: paw, pawWave: Math.sin(c.t * 12) * paw, whisk: pulse(c.t, 1.8, 2.3) } });
    aim(c, CAT[0], CAT[1] - 6, 2.2, 7.0, .55, .45, { dz: .07 }); c.fx(sparkle(CAT[0] - 8, CAT[1] - 22, .35, { d: 2.2, n: 3, size: 9, spread: 20 }));
  }),
  // he eats slowly, every last crumb: eyes closed with pleasure; at the end a paw wipes the whiskers
  'L015': S(c => {
    const left = 1 - ss(seg(c.t, .2, 2.4)), paw = ss(seg(c.t, 2.4, 2.7)) * (1 - ss(seg(c.t, 2.9, 3.05)));
    steps(c, { tom: false, ivy: false, catPose: { eyes: c.t < 2.3 ? 'happy' : 'open', lookX: -.6, lookY: .4, headDown: .6 + .4 * Math.abs(Math.sin(c.t * 2.4)) * (c.t < 2.4 ? 1 : 0), talk: c.t < 2.4 ? Math.max(0, Math.sin(c.t * 9)) * .35 : 0, pawLift: paw } });
    if (left > .02) prop(c, PR.breadHalf(-1, 4), G.catX - 62, G.catY - 4, 2.2, .45 * (.4 + .6 * left), { z: 3.1 });
    aim(c, CAT[0] - 20, CAT[1] + 30, 2.2, 3.8, .54, .45, { dz: .08 });
    for (const tt of [.5, 1.3, 2.0]) c.fx(bits(G.catX - 62, G.catY - 12, tt, { d: 2.2, n: 5, r: 1.6, dur: .5, spread: 1.6 }));
  }),
  // "Thank you, Master." (his mouth moves only on the words); a sparkle
  'L016': S(c => {
    steps(c, { tom: false, ivy: false, catPose: { lookX: -1, lookY: -.2, headLift: .4, mouth: 'smile', earLag: -.05 } });
    camCat(c, 4.4, { dz: .09 });
    c.fx(sparkle(CAT[0] - 20, CAT[1] - 50, 2.0, { d: 2.2, n: 4, size: 12, spread: 30 }));
  }),
  // Tom jumps back: SURPRISE in three beats; "!" pops; a comic snap-zoom
  'L017': S(c => {
    const a = antic3(c.t, .05, .5, .15), up = Math.max(0, a);
    steps(c, { free: true, res: 3, tomPose: { lookX: 1, lookY: -.1, brow: 1.2 * up, wide: up, mouth: 'o', lean: -.18 * up, lift: 28 * up * (1 - ss(seg(c.t, .9, 1.4))), headTilt: -.06 * up,
      armN: { x: -60 - 40 * up, y: -100 - 80 * up }, armF: { x: 60 + 40 * up, y: -100 - 80 * up }, handN: up > .3 ? 'open' : 'rest', handF: up > .3 ? 'open' : 'rest' }, catPose: { lookX: -1, lookY: -.1 } });
    aim(c, TOM[0] + 120, TOM[1] + 60, 2, 1.8, .45, .45, { dz: .06 }); c.snap(.05, 6, .18); const [mx, my] = atS(c, .42, .14); c.fx(mark('!', mx, my, .3, { size: 110, col: '#fff2c0' }));
  }),
  // "You can TALK?": eyes wide, mouth on the words; a speech bubble "TALK?"
  'L018': S(c => {
    steps(c, { free: true, res: 4, tomPose: { lookX: 1, lookY: .05, brow: .9, wide: .8, mouth: 'o', armN: { x: -50, y: -70 }, armF: { x: 50, y: -60 }, handN: 'open', handF: 'open', lean: -.05 } });
    camTom(c, 2.7); const [bx, by] = atS(c, .72, .2); c.fx(bubble('TALK?', bx, by, .55, 2.25, { kind: 'shout', size: 60, tail: [-.8, 1] }));
  }),
  // "Of course." (calm, one brow raised)
  'L019': S(c => {
    steps(c, { tom: false, ivy: false, catPose: { lookX: -1, lookY: -.3, headLift: .3, browR: .9, eyes: 'half', mouth: 'smile' } });
    camCat(c);
  }),
  // over Tom's shoulder: the cat explains; a paw gestures on "boots", chin up (PROUD)
  'L020[1:9]': S(c => {
    const [b0] = wt('L020', 'boots'), paw = ss(seg(c.T, b0 - .25, b0 + .1)) * (1 - ss(seg(c.T, b0 + .9, b0 + 1.3)));
    const sc = steps(c, { hires: true, res: 5, tomPose: { lookY: .3, lookX: .9 }, catPose: { lookX: -1, lookY: -.3, headLift: .5, pawLift: paw * .9, pawWave: Math.sin(c.t * 10) * paw * .5, eyes: 'open', mouth: 'smile' } });
    Object.assign(sc.tomL, { x: -450, y: 55, d: 1.45, sx: 2.4, sy: 2.4 }); sc.focus = 2.2; sc.ivyL.vis = sc.sackL.vis = false;
    c.cam({ zoom: 2.0, x: -20, y: -40 }, { zoom: 2.0, x: 10, y: -40, dz: .06 });
  }),
  // reaction: Tom listens, eyebrows going up, mouth a small O; a tiny sparkle on "rich"
  'L020[10:]': S(c => {
    const [r0] = wt('L020', 'rich.'), up = ss(seg(c.t, .3, 1.6));
    steps(c, { free: true, res: 4, tomPose: { lookX: 1, lookY: .1, brow: up * .8, mouth: c.T > r0 - .2 ? 'o' : 'closed', talk: 0, armN: { x: -30, y: -50 }, armF: { x: 40, y: -50 } } });
    camTom(c); c.fx(sparkle(TOM[0] + 20, TOM[1] - 70, r0 - c.shot.t0, { n: 3, size: 12, spread: 26 }));
  }),
  // "Why boots?" (puzzled, a head tilt)
  'L021': S(c => {
    steps(c, { free: true, res: 4, tomPose: { lookX: 1, lookY: 0, browL: .8, browR: -.2, browTilt: .2, headTilt: ss(seg(c.t, .1, .5)) * -.12, armN: { x: -10, y: -100 }, handN: 'point', armF: { x: 40, y: -50 } } });
    camTom(c); const [mx, my] = atS(c, .64, .16); c.fx(mark('?', mx, my, .8, { size: 60, col: '#fff6e0' }));
  }),
  // the cat, chin up, tail high on "important"
  'L022': S(c => {
    const [i0] = wt('L022', 'important,"'), pr = ss(seg(c.T, i0 - .4, i0));
    steps(c, { tomPose: { lookX: 1, lookY: .4, brow: .3 }, catPose: { lookX: -1, lookY: -.5, headLift: .3 + .5 * pr, eyes: pr > .5 ? 'half' : 'open', mouth: 'smile', tailLag: -.4 * pr } });
    c.cam({ zoom: 2.4, x: 80, y: -40 }, { zoom: 2.4, x: 100, y: -40, dz: .07 });
  }),
  // "And important cats get invited places." (PROUD: half-closed eyes, chin up, a sparkle, a chime)
  'L023': S(c => {
    steps(c, { tom: false, ivy: false, catPose: { lookX: -.6, lookY: -.6, headLift: .8, eyes: 'half', mouth: 'smile', tailLag: -.4 } });
    camCat(c, 4.4, { dz: .1 });
    c.fx(sparkle(CAT[0] + 30, CAT[1] - 60, 1.6, { d: 2.2, n: 6, size: 14, spread: 40 }));
  }),
};
