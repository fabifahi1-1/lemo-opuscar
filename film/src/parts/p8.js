// PART 8: the bread again, the ending, the moral, the end screen. L184[1:5] repeats the hook's framing exactly (Tom at the
// same place relative to the camera, the same lens, the same push-in speed) so the two bread breaks rhyme.
import { S, blink } from '../kit/stage.js';
import { word, sparkle, mark, zzz, steam } from '../kit/fx.js';
import * as PR from '../kit/props.js';
import { OGRE_NIGHT, OG, HALL_LIVED, HL, KITCHEN, KT, BEDROOM, BR, ENDTABLE } from '../kit/sets2.js';
import { Layer } from '../engine.js';
import { clamp, lerp, ss, eio, seg, back, TAU } from '../lib.js';
import { wt, aim, atS } from './util.js';

const puss = (c, o) => c.actor('puss', { who: 'Puss', ...o });
const pussHead = (x, y, s = .37) => [x, y - s * 380];
const HEADY = 455;
// the kitchen cast: Tom on the bench (the steps position), Puss standing on his stool at the table, the loaf on the table
const CAT = [KT.catX, KT.tableY + 10];
const kTom = (c, pose = {}, o = {}) => c.actor('tomBreadJ', { x: KT.tomX, y: KT.tomY, d: 2.0, z: 3, who: 'Tom', contact: false, ...o, pose: { blink: blink('Tom'), lookX: .9, lookY: .3, ...pose } });
const kCat = (c, pose = {}, o = {}) => puss(c, { x: CAT[0], y: CAT[1], d: 2.08, z: 2.35, face: 'L', contact: false, ...o, pose: { lookX: -.8, lookY: .1, ...pose } });
const loaf = (c, x = 160) => c.layer(new Layer({ sheet: PR.bread(3), x, y: KT.tableY + 4, d: 2.11, z: 2.28, sx: .8, sy: .8, name: 'loaf' }));
const halves = (c, gap = 70) => { c.layer(new Layer({ sheet: PR.breadHalf(-1, 4, true), x: 160 - gap / 2, y: KT.tableY + 2, d: 2.11, z: 2.28, sx: .9, sy: .9, rot: -.06 })); c.layer(new Layer({ sheet: PR.breadHalf(1, 4, true), x: 160 + gap / 2, y: KT.tableY + 2, d: 2.11, z: 2.29, sx: .9, sy: .9, rot: .06 })); };
// the moral: cut-paper letters that grow up from their baseline, one after another
function grow(txt, cx, cy, t0, size, step = .045) {
  return (g, c) => {
    g.save(); g.font = `${size}px "Lilita One"`; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    const W = g.measureText(txt).width; let x = cx - W / 2, k = 0;
    for (const ch of txt) {
      const cw = g.measureText(ch).width, u = clamp((c.t - t0 - k * step) / .3); k++;
      if (u > 0 && ch !== ' ') {
        const s = back(u, 1.6); g.save(); g.translate(x + cw / 2, cy); g.scale(1, s); g.globalAlpha = ss(clamp(u * 2));
        g.lineJoin = 'round'; g.shadowColor = 'rgba(20,8,2,.45)'; g.shadowBlur = size * .12; g.shadowOffsetY = size * .07; g.strokeStyle = '#3a1e12'; g.lineWidth = size * .16; g.strokeText(ch, -cw / 2, 0);
        g.shadowColor = 'transparent'; g.fillStyle = '#fbefd2'; g.fillText(ch, -cw / 2, 0); g.restore();
      }
      x += cw;
    }
    g.restore();
  };
}

export const P8 = {
  // that night: the castle under the stars, its kitchen window lit (a slow cross-dissolve)
  'L182[1:2]': S(c => { c.set(OGRE_NIGHT); c.cam({ zoom: .42, x: 300, y: -700 }, { zoom: .42, x: 340, y: -700, dz: .03 }); }),
  // the hall decorated with ribbons after the happy news
  'L182[3:7]': S(c => { c.set(HALL_LIVED); c.cam({ zoom: .75, x: -200, y: -260 }, { zoom: .75, x: 300, y: -260, dz: .03 }); }),
  // the castle kitchen: Tom and Puss at supper, candle glow, the night window
  'L182[8:]': S(c => {
    c.set(KITCHEN); kTom(c, { lookX: .9, lookY: .2, mouth: 'smile', split: 0 }); kCat(c, { lookX: -.6, lookY: .3, mouth: 'smile' });
    c.cam({ zoom: .95, x: 60, y: -60 }, { zoom: 1.05, x: 80, y: -40, dz: .04 });
  }),
  // one warm loaf on the table; steam rises
  'L183': S(c => { c.set(KITCHEN); kTom(c, { lookX: .3, lookY: .8, mouth: 'smile', split: 0 }); kCat(c, { lookX: -.8, lookY: .5, mouth: 'smile', sniff: 1 }); aim(c, -80, 20, 2.0, 2.4, .45, .5, { dz: .06 }); c.fx(steam(-150, 40, 0, c.dur, { d: 2.0 })); }),
  // MATCHES THE HOOK: the same lens, the same place, the same push-in speed: Tom's hands break the warm bread in two
  'L184[1:5]': S(c => {
    c.set(KITCHEN); kTom(c, { lookY: .75, lookX: .2, mouth: 'smile', smile: .6, split: ss(seg(c.t, .5, 1.7)) }, { s: 1.25 });
    c.cam({ zoom: 5.0, x: -150, y: 88, dz: 0 }, { zoom: 5.0, x: -150, y: 88, dz: .08 * c.dur / 3.5 }, u => u);
    c.fx(steam(-130, 40, .6, c.dur, { d: 2.0 }));
  }),
  // Puss receives one half, eyes closed happily
  'L184[6:]': S(c => {
    c.set(KITCHEN); const of = ss(seg(c.t, .1, 1.0)), got = c.t > 1.2;
    kTom(c, { lookX: .9, lookY: .2, mouth: 'smile', eyes: 'open', split: 1, offer: got ? 0 : of, give: got ? 1 : 0 });
    kCat(c, { lookX: -.8, lookY: .2, eyes: got ? 'happy' : 'open', mouth: 'grin', armF: got ? { x: -30, y: -95 } : { x: -70 * of, y: -150 + 40 * of }, pawF: 'open', propF: got ? { sheet: PR.breadHalf(1, 4, true), x: 0, y: 8, s: 1.4 } : null });
    aim(c, 150, -120, 2.05, 1.7, .5, .45, { dz: .06 });
    c.fx(sparkle(CAT[0] - 40, CAT[1] - 160, 1.3, { n: 5, size: 14, spread: 60, d: 2.08 }));
  }),
  // Puss: "Thank you, Master,"
  'L185': S(c => { c.set(KITCHEN); kCat(c, { lookX: -.8, lookY: -.1, eyes: 'open', mouth: 'smile', armF: { x: -30, y: -95 }, pawF: 'open', propF: { sheet: PR.breadHalf(1, 4, true), x: 0, y: 8, s: 1.4 } }); const [hx, hy] = pussHead(CAT[0], CAT[1]); aim(c, hx, hy, 2.08, 4.2, .55, .45, { dz: .07 }); }),
  // Tom smiling: "No, Puss. Thank YOU."
  'L186-L187': S(c => {
    c.set(KITCHEN); kTom(c, { lookX: .9, lookY: -.1, mouth: 'smile', eyes: c.t > 2.6 ? 'happy' : 'open', split: 1, give: 1 });
    aim(c, KT.tomX + 10, KT.tomY - 260, 2.0, 2.8, .42, .45, { dz: .07 });
    const [y0] = wt('L187', 'YOU."'); c.fx(sparkle(KT.tomX + 40, KT.tomY - 360, y0 - c.shot.t0, { n: 5, size: 14, spread: 70 }));
  }),
  // Tom and the princess in the lived-in castle, candlelit (a slow pull-back)
  'L188': S(c => {
    c.set(HALL_LIVED);
    c.actor('tomJ', { x: -120, y: HL.floor + 30, d: 2.1, z: 3, who: 'Tom', face: 'R', pose: { lookX: .9, mouth: 'smile', eyes: c.t > 2 ? 'happy' : 'open', armF: { x: 80, y: -110 }, handF: 'open' } });
    c.actor('princess', { x: 120, y: HL.floor + 30, d: 2.1, z: 2.9, who: 'Princess', face: 'L', pose: { lookX: .9, mouth: 'smile', blush: .4, armF: { x: 80, y: -110 }, handF: 'open' } });
    c.cam({ zoom: 1.6, x: 0, y: -100 }, { zoom: .95, x: 60, y: -120, dz: 0 });
  }),
  // "And Puss?" The empty chair; a question mark pops
  'L189': S(c => { c.set(HALL_LIVED); c.cam({ zoom: 1.8, x: HL.chairX - 160, y: 40 }, { zoom: 1.8, x: HL.chairX - 60, y: 40, dz: .04 }); c.fx(mark('?', HL.chairX, HL.floor - 420, .3, { size: 120, col: '#ffd24a', d: 2.2 })); }),
  // the softest bed: Puss bounces on it in his boots
  'L190[1:8]': S(c => {
    c.set(BEDROOM); const b = Math.abs(Math.sin(c.t * 4.2)), topY = BR.floor + 40 - 300 + 10;
    puss(c, { x: BR.bedX - 40, y: topY - b * 140, d: 2.12, z: 2.2, face: 'R', contact: false, pose: { lookX: .5, lookY: -.3, eyes: 'happy', mouth: 'grin', tailUp: 1, armF: { x: 60, y: -230 * b - 80 }, armB: { x: -40, y: -220 * b - 80 }, pawF: 'open', pawB: 'open', legF: -.3 * b, legB: .3 * b } });
    c.cam({ zoom: 2.1, x: BR.bedX - 40, y: -90 }, { zoom: 1.6, x: BR.bedX - 40, y: -110, dz: 0 });
    c.fx((g, cc) => { const l = cc.sc.layers.find(x => x.name === 'bed'); });
  }),
  // Puss struts through the castle in his boots, everywhere
  'L190[9:]': S(c => {
    c.set(HALL_LIVED); const x = -900 + c.t * 260; puss(c, { x, y: HL.floor + 40, d: 2.15, z: 2.5, face: 'R', pose: { walk: c.t * 2.4, strut: 1, chest: 1, headLift: .4, eyes: 'half', mouth: 'smile' } });
    c.cam({ zoom: 1.3, x: -860, y: 40 }, { zoom: 1.3, x: -900 + 3.1 * 260 + 40, y: 40, dz: .02 }, u => u);
  }),
  // even to bed: Puss asleep with his boots still on; zzz; slow breathing; a tiny snore
  'L191': S(c => {
    c.set(BEDROOM); const topY = BR.floor + 40 - 300 + 30, br = Math.sin(c.T * 1.6);
    puss(c, { x: BR.bedX - 140, y: topY - 50, d: 2.12, z: 2.2, face: 'R', rot: -1.45, contact: false, shadow: false, pose: { lookX: 0, lookY: 0, lid: 1, eyes: 'half', mouth: 'smile', chest: .5 + .5 * br, armF: { x: 30, y: -140 }, armB: { x: 20, y: -140 } } });
    aim(c, BR.bedX - 110, topY - 70, 2.12, 2.8, .5, .5, { dz: .06 });
    c.fx(zzz(BR.bedX - 140 + 60, topY - 200, .2, c.dur, { d: 2.12 }));
  }),
  // the two bread halves on the table, candlelit
  'L192[1:8]': S(c => { c.set(KITCHEN); halves(c); aim(c, 200, KT.tableY - 40, 2.11, 3.6, .45, .5, { dz: .06 }); c.fx(steam(160, KT.tableY - 40, .3, c.dur, { d: 2.11 })); }),
  // Tom and Puss side by side at the table, sharing
  'L192[9:]': S(c => {
    c.set(KITCHEN); kTom(c, { lookX: .9, lookY: .1, mouth: 'smile', eyes: 'happy', split: 1, give: 1 });
    kCat(c, { lookX: -.8, eyes: 'happy', mouth: 'grin', armF: { x: -30, y: -95 }, pawF: 'open', propF: { sheet: PR.breadHalf(1, 4, true), x: 0, y: 8, s: 1.4 } });
    aim(c, 140, -150, 2.05, 1.5, .5, .45, { dz: .06 });
  }),
  // MORAL CARD: the two bread halves; "A little kindness" grows in as cut paper
  'L193[1:4]': S(c => { c.set(KITCHEN); halves(c, 90); aim(c, 160, KT.tableY - 20, 2.11, 2.6, .5, .74, { dz: .05 }); c.fx(grow('A little kindness', 960, 250, .15, 120)); }),
  // closer: "can come back to you in a big way." grows in below
  'L193[5:]': S(c => {
    c.set(KITCHEN); halves(c, 90); aim(c, 160, KT.tableY - 20, 2.11, 3.0, .5, .76, { dz: .06 });
    c.fx(grow('A little kindness', 960, 210, -1, 110), grow('can come back to you', 960, 360, .1, 90, .035), grow('in a big way.', 960, 480, .8, 90, .04));
  }),
  // END SCREEN, 15 s: the lantern and the closed storybook in the middle third; "Lantern and Page" small at the bottom
  'end': S(c => { const sc = c.set(ENDTABLE); sc.t = c.T; c.cam({ zoom: 1.12, x: 0, y: 120 }, { zoom: 1.12, x: 0, y: 120, dz: .05 }, eio); }),
};
