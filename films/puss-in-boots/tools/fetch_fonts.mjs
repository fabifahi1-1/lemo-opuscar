// Download the OFL Google Fonts this film uses into fonts/ and write fonts.css (latin subset only).
import fs from 'fs';
import path from 'path';
const ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const fams = ['family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700', 'family=Caveat:wght@600;700', 'family=Andika:wght@400;700', 'family=Fredoka:wght@600;700'];
let out = '', n = 0; fs.mkdirSync(path.join(ROOT, 'fonts'), { recursive: true });
for (const f of fams) {
  let css = await (await fetch(`https://fonts.googleapis.com/css2?${f}&display=block`, { headers: { 'User-Agent': UA } })).text();
  css = css.split('/* ').filter(b => b.startsWith('latin */') ).map(b => '/* ' + b).join('');
  for (const u of [...new Set(css.match(/https:\/\/[^)]+/g) || [])]) {
    const name = `f${n++}.woff2`;
    fs.writeFileSync(path.join(ROOT, 'fonts', name), Buffer.from(await (await fetch(u)).arrayBuffer()));
    css = css.split(u).join('fonts/' + name);
  }
  out += css;
}
fs.writeFileSync(path.join(ROOT, 'fonts.css'), out); console.log('font files', n);
