// Load the film page headless (via the library's page helper) and dump its resolved timeline to out/timeline.json
// usage (from the library root): node films/puss-in-boots/tools/dump.mjs
import fs from 'fs'; import path from 'path';
const HERE = path.dirname(path.dirname(new URL(import.meta.url).pathname)), LIB = process.env.LIB || path.resolve(HERE, '../..');
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const { browser, page } = await openDemo(HERE);
const out = await page.evaluate(() => ({ dur: window.DUR, scenes: window.SCENES, shots: window.SHOTLIST, cards: window.CARDS, ev: window.EV }));
fs.writeFileSync(path.join(HERE, 'out/timeline.json'), JSON.stringify(out, null, 1));
console.log('dur', out.dur, 'scenes', out.scenes.length, 'shots', out.shots.length, 'cards', out.cards.length, 'events', out.ev.length);
await browser.close(); closeServer();
