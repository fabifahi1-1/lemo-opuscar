const SC = () => ({ scene: true });
const SHOTS = [
  SC(),
  { at: 0, loc: 'desk', cam: [-150, 60, 1.05, 0, 120, 1.25] },
  { at: 3.6, loc: 'mill', tr: 'page', cam: [0, -1500, 1, 0, -1500, 1.02], fx: [{ title: 1, text: 'Puss in Boots', at: 1.2, dur: 13 }] },
  { at: 8.4, loc: 'mill', cam: [0, -1500, 1.02, 0, -60, .95], camEase: 'eio', fx: [{ title: 1, text: 'Puss in Boots', at: -3.6, dur: 6.2 }, { typed: 'Retold by Lantern and Page', sky: 1, at: .6, dur: 5.4, speed: 2.2 }] },
  { at: 14.6, loc: 'mill', cam: [500, 80, 1.0, 600, 90, 1.1],
    cast: [{ id: 'tom', x: 700, y: 330, s: 1, face: 1, expr: 'smile' }, { id: 'puss0', x: 860, y: 330, s: 1, face: -1 }, { id: 'donkey', x: 300, y: 340, s: 1 }],
    fx: [{ label: 'the mill', x: -560, y: -120, lx: 240, ly: -170, at: 2, dur: 4 }, { label: 'the river', x: 300, y: 170, ly: -80, lx: 280, at: 3, dur: 4 }] },
];
