// A test bench: characters in a row on cream paper, to check their look and poses. ?lab=people|cats|...
import { drawScene, Layer, paint } from './engine.js';
import { makePerson, LOOKS } from './kit/person.js';
import { makePussStand } from './kit/cat.js';
import { makePuss } from './puppets.js';
const cache = {};
export function draw(g, t, which) {
  const sc = cache[which] ??= build(which);
  sc.update(t); drawScene(g, sc);
}
function build(which) {
  const L = []; const bg = paint(2000, 1200, g => { g.fillStyle = '#efe2c6'; g.fillRect(-1000, -600, 2000, 1200); g.fillStyle = '#cdb994'; g.fillRect(-1000, 330, 2000, 300); }, { res: .5 });
  L.push(new Layer({ sheet: bg, d: 2.6, shadow: false }));
  const items = [];
  if (which === 'people') {
    const keys = Object.keys(LOOKS);
    keys.forEach((k, i) => { const rig = makePerson(k, { res: 2 }); const x = -880 + (i % 10) * 196, y = i < 10 ? 20 : 340; const l = new Layer({ sheet: rig.dyn, x, y, d: 2, sx: .55, sy: .55 }); L.push(l); items.push({ rig, o: k === 'tom' ? { armN: { x: -30, y: -200 }, handN: 'open', talk: t => .5 + .5 * Math.sin(t * 9), mouth: 'smile' } : { walk: t => t * 2 } }); });
  } else {
    const cats = [[makePussStand({ res: 3, turn: -.5 }), {}], [makePussStand({ res: 3, turn: .5 }), { walk: t => t * 2.4, strut: 1 }], [makePussStand({ res: 3, turn: -.5 }), { armF: { x: -60, y: -230 }, pawF: 'open', mouth: 'smile', eyes: 'half', chest: 1 }], [makePussStand({ res: 3, turn: .5 }), { run: 1, walk: t => t * 4 }], [makePuss({ res: 3, turn: -.55 }), { pawLift: .8, talk: .7 }], [makePussStand({ res: 3, turn: -.5 }), { puff: 1, eyes: 'wide', mouth: 'o', earsDown: .6 }]];
    cats.forEach(([rig, o], i) => { const l = new Layer({ sheet: rig.dyn, x: -760 + i * 300, y: 300, d: 2, sx: .62, sy: .62 }); L.push(l); items.push({ rig, o }); });
  }
  const sc = { bg: '#efe2c6', layers: L, cam: { x: 0, y: 0, zoom: 1, dz: 0 }, focus: 2, light: { x: -500, y: -400, r: 1800, col: [255, 226, 180], floor: .6 }, post: { bloom: 0, vig: .05 }, update(t) { for (const it of items) it.rig.pose(t, it.o); } };
  return sc;
}
