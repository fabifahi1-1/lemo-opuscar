// Does the cat sit ON the step? In each frame, paint the cat blue and the steps magenta (keeping what covers them),
// find the cat's lowest pixels and check that directly under each one is step (through at most 8 px of anti-aliased cat/step edge).
import { openDemo, closeServer } from '/home/user/lemo-opuscar/core/render/page.mjs';
const times = process.argv.slice(2).map(Number);
const { browser, page } = await openDemo('film', { q: 'mask=puss:00f,steps:f0f' });
for (const t of times) {
  const r = await page.evaluate(t => {
    window.render(t); const d = document.getElementById('c').getContext('2d').getImageData(0, 0, 1920, 1080).data;
    const isC = i => d[i] < 40 && d[i + 1] < 40 && d[i + 2] > 215, isS = i => d[i] > 215 && d[i + 1] < 40 && d[i + 2] > 215;
    let y1 = -1; for (let y = 1079; y >= 0 && y1 < 0; y--) for (let x = 0; x < 1920; x++) if (isC((y * 1920 + x) * 4)) { y1 = y; break; }
    if (y1 < 0) return { cat: 'not in frame' };
    let xs = []; for (let x = 0; x < 1920; x++) if (isC((y1 * 1920 + x) * 4)) xs.push(x);
    // walk down from the paw through the anti-aliased edge (pixels that blend cat and step colours: red and blue both high or
    // both mid, green low) for up to 8 px; touching = we reach step colour. Wall, shadow or air (green channel up) under a paw = a gap.
    const blend = i => d[i + 1] < 60 && d[i + 2] > 150;
    let touch = 0, n = 0; for (const x of xs) { n++; for (let y = y1 + 1; y < Math.min(1080, y1 + 9); y++) { const i = (y * 1920 + x) * 4; if (isS(i)) { touch++; break; } if (!blend(i)) break; } }
    let stepAbove = 0; for (const x of xs) for (let y = y1 - 25; y < y1; y++) if (y >= 0 && isS((y * 1920 + x) * 4)) { stepAbove++; break; }
    return { catBottomY: y1, bottomPixels: n, touchingStep: touch, frac: +(touch / n).toFixed(2), stepBehindPaws: stepAbove };
  }, t);
  console.log(t, JSON.stringify(r));
}
await browser.close(); closeServer();
