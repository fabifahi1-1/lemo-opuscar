# Lantern and Page — Style Bible

The house look of the **Lantern and Page** channel, first used for *Puss in Boots*. Every future story keeps **§1 Channel branding**, **§2 Medium** and **§7 Sound**; characters (§4) and locations (§5) are per story.
Built on the library style **Watercolor Brush** (`styles/watercolor/STYLE.md`): all its material invariants hold (one sheet of warm paper under everything, transparent strokes with dry-brush bristles, pooled edges, paper as the white, ink only for lines and text).

---

## 1. Channel branding (reuse for every story)

### Opening (≈ 14 s)
1. **Dark warm desk, night.** A small brass lantern glows on the left (flame flicker, a soft halo that breathes). Beside it an open storybook, pages cream, a ribbon bookmark. Dust motes drift in the lantern light.
2. **A page turns** (paper sound). As it flips toward camera it fills the frame and **becomes the sky**: a pale wash of dawn with watercolour clouds painting themselves in.
3. **The title is painted on the clouds**: the story title in Cormorant Garamond Bold Italic, ink over a gold wash bloom, revealed by a left-to-right brush clip.
4. **The camera tilts slowly down** from the sky to the first scene, while **"Retold by Lantern and Page"** types in letter by letter (Caveat, ink, a soft pen tick per letter).
5. The **signature tune** plays under all of it and settles as the first scene arrives.

### End card (≈ 9 s)
The same desk and lantern, the book open on its last page, warm and still. "Lantern and Page" in Cormorant Garamond Italic on the right page, a thin hand-drawn underline that grows, and below in Caveat: "Thank you for reading with us." The signature tune plays to the end; the lantern glow is the last thing to fade.

### Signature tune (≈ 10 s, F major, 3/4, ♩ = 92)
| Bar | Chord | Melody (glockenspiel + clarinet an octave below) | Under |
|---|---|---|---|
| 1 | F | A4 · C5 · F5 | harp arpeggio F–A–C–F |
| 2 | Dm | E5 (half) · D5 | upright piano D3+A3 |
| 3 | B♭ | D5 · F5 · B♭5 | harp B♭–D–F |
| 4 | C | A5 (half) · G5 | piano C3+G3, strings pad |
| 5 | F | F5 (dotted half), harp roll up, a triangle tick | piano F2+C3+A3 |
Instruments: glockenspiel (VCSL), clarinet, upright piano, violins/cellos pad (VSCO 2 CE), harp (VCSL), all CC0. The tune returns, slowed and on harp/music box, for the story's tender ending.

### Channel colours
| Role | Hex |
|---|---|
| Lantern gold (accent, glows) | `#f2b94b` → halo `#ffd98a` |
| Desk walnut | `#5a3a26`, shadow `#2e1d14` |
| Book page cream | `#f4e7cc` |
| Ink (text, lines) | `#2f2420` warm near-black, `#6b4a36` light brown |
| Paper | `#f3ead8` base |

---

## 2. Medium (every story)

- **Paper grain over everything**: a pre-made cotton-paper texture (fibres, three octaves of noise, vignette) multiplied over every frame, plus light film grain in ffmpeg.
- **Washes**: each shape is painted in 3 jittered passes at a third of the opacity (pooled darker edge), a colour bloom (a lighter or darker blotch inside), granulation, and a darker edge stroke with dry-brush bristles as the only "line".
- **Pencil**: light graphite construction lines in places (architecture, furniture), never as outlines of characters.
- **Depth**: ≥ 5 parallax layers per place — sky · far (hills/walls) · middle ground · characters' ground · foreground framing (grass, flowers, leaves, curtains). Aerial perspective: far = paler, bluer, less saturated, mist bands between layers; near = stronger and warmer.
- **Living world**: something always moves (leaves, grass sway, birds, smoke, flags, water sparkles, mill wheel, dust in sunbeams, clouds).
- **Camera**: every shot moves slowly (pan, tilt, push-in, pull-out) with parallax across all layers. Cuts within a place; page turns, brush-edge wipes and mist between places.
- **Characters big in frame**; close-ups often; no large empty sky.

## 3. Type

| Use | Face (OFL) | Treatment |
|---|---|---|
| Title, moral, end card | Cormorant Garamond Bold / Bold Italic | ink, gold wash behind |
| Word cards | Andika Bold (early-reader letterforms) | ink, typed in sync with the spoken word |
| Labels, notes, "Retold by" | Caveat Bold | ink over a paper halo, pen arrow to the object |
| Sound words, bubbles | Fredoka Bold | painted: layered wash fill + darker edge, pop-in squash |

Word card layout: a cream watercolour-paper card fills the frame (deckled edge, soft shadow), the object painted large left of centre (painting-in, 0.8 s), the word right of it, lower case with its article ("the boots").

## 4. Characters (*Puss in Boots*)

Heights in world units (the door of a house = 300). Every character is a cut-out rig of painted parts (body, head, arms, legs, tail) cached as sprites, with face features (eyes, brows, mouth, cheeks) painted live so they can blink, emote and lip-sync. Views: 3/4 facing right (mirrored for left), head turn by sliding the features. Life: blink every 2.5–4.5 s, breathing (1–2 % scale), small head tilts, mouth driven by the voice envelope while the character's quoted words play. Walks: a two-step cycle with body bob and arm swing.

Expressions (all characters): `happy`, `smile`, `proud` (eyes half-closed, chin up, smirk), `surprised` (round eyes, O mouth, raised brows), `scared` (wide eyes, small pupils, brows up-in), `sad` (brows down-out, small frown), `cheeky` (one brow up, side smile), `shy` (eyes down, blush), `laugh` (closed arc eyes, open mouth).

| Character | Design (fixed) | Palette |
|---|---|---|
| **Puss** (150) | Sleek orange cat standing on two legs; white paws, white muzzle and chest; big **bright green** eyes; pink nose; pointed ears with pink insides; long curling tail with darker stripes. **Tiny brown leather boots** with a turned-down cuff and a gold buckle (after "The cat put them on"). Carries a burlap **bag** on a drawstring over the shoulder. No hat, no cape, no sword. Posture: chest out, chin up. | fur `#e8873a`, stripes `#c4621f`, white `#fbf3e4`, eyes `#3fbf5a`, nose `#e9868f`, boots `#7a4a2a` / cuff `#a8714a`, buckle `#e2b54a`, bag `#c8a874` |
| **Tom, before** (300) | Kind young man, round face, freckles, messy chestnut hair. Old oatmeal tunic with a green and a rust **patch**, rope belt, patched brown trousers, worn shoes. | skin `#f2c9a5`, hair `#8a4b2a`, tunic `#b89a72`, patches `#8f9a6a` `#c9875a`, trousers `#7d6a55`, shoes `#6b4a33` |
| **Tom, after** | Same face and hair. **Blue jacket** with gold buttons, cream shirt collar, **new tan trousers**, **shiny black shoes** (white highlight). | jacket `#3f6fb0`, buttons `#e2b54a`, shirt `#f4ead2`, trousers `#c2a77e`, shoes `#2a2a33` |
| **King** (290) | Round and jolly; very **long white beard** to the belly; **tiny gold crown** with a red gem perched on top; rosy nose and cheeks; deep red robe with white ermine trim (black flecks). | robe `#b02e3a`, trim paper + `#2a2420`, crown `#e8b93c`, beard paper + `#c9d2dc`, skin `#f0c8a8` |
| **Princess** (275) | Kind, always smiling; warm brown skin; dark hair in a bun with a small gold tiara; rose dress with a lavender sash. | skin `#a8714f`, hair `#2e1f1a`, dress `#e07a8f`, sash `#9b84c4`, tiara `#e8c95a` |
| **Ogre** (600, twice the door) | Huge, round, silly; mossy olive skin; two tiny horns; bushy brows; small underbite tusks; patched brown vest; grey-purple trousers; **fluffy pink slippers**. Voice like thunder (in the narration), face never scary. | skin `#8aa35a`, belly `#b2c47a`, vest `#7a5a3a`, trousers `#6d6480`, slippers `#f4a6c6` |
| **Ogre as lion** | Golden body, big orange mane, goofy grin, **still wearing the pink slippers**. | body `#e0a84a`, mane `#b8662e` |
| **Ogre as mouse** | Tiny grey mouse with pink ears and tail, big ogre eyebrows. | `#9b9590`, pink `#f0a9b4` |
| Oldest brother (310) | Tall, thin, black hair, moustache, flour-dusted apron. | tunic `#8c7a5a`, apron paper |
| Middle brother (285) | Stocky, red cap, green tunic. | cap `#c0483a`, tunic `#6f8a5a` |
| Donkey | Grey, cream muzzle, very long ears, dark mane. | `#9a948c` |
| Guard (300) | Purple tunic with gold trim, silver helmet, spear, ginger moustache. | `#6a3f8a`, helmet `#a9b4bf` |
| Town crier (290) | Green coat, black tricorn hat, brass hand bell, red cheeks. | coat `#3f7a4a`, bell `#d9a93c` |
| Servant (290) | Purple footman livery, white wig, white gloves, carries folded clothes. | `#5d3f7a` |
| Farmers | A man in a straw hat and blue overalls; a woman in a rust headscarf and green dress. | `#e2c46a` `#5b7ea8` `#d9734a` `#7a9a4a` |
| Shepherd | Brown cloak, grey beard, crook. | `#8a6a4a` |
| Apple picker | Young woman with a braid, red-brown vest, basket of apples. | `#a84a3a` |
| Sheep | Fluffy cloud of wool (paper + blue-grey shadow washes), dark face and legs. | `#c8ccd6`, face `#3e3a3a` |
| Carriage horse | Cream-white with grey shadows, gold harness, purple plume. | `#d8d2c8` |
| Royal carriage | Purple and gold coach, round windows, gold wheels, crown on top. | `#5b3a7a`, `#e2b54a` |

## 5. Locations (*Puss in Boots*)

| Location | Mood | Palette | Layers (back → front) | Living details |
|---|---|---|---|---|
| **Old mill by the river** | golden morning | sky `#f6dca0`→`#fbefd2`, hills `#c9c08a`, mill ochre `#c99a52`, roof `#a0583a`, river `#8fb0b0`, grass `#a8b45a` | sky + sun glow · far hills · river, mill, wheel, Tom's shack · bank, path, fence · grass, flowers, reeds | mill wheel turns, water sparkles, birds, dust motes |
| **Forest edge** | deep green, red berries | `#2f5a3a` `#4e7a44` `#86a85a`, berries `#d8323a` | sky gaps · far trees · mid trees · berry bushes & path · ferns, leaves | leaves sway, butterflies |
| **Castle on the hill** | royal | sky `#e9d7c4`, castle `#d8cbb8`, roofs `#5b3a7a`, banners `#b02e3a`/`#e2b54a` | sky · far hills · castle · hill road · flowers, fence | banners wave |
| **Throne room** | purple, gold, deep red | walls `#6d4a8a`, gold `#e2b54a`, carpet `#a82a38`, windows `#f6dca0` | back wall & windows · columns · banners · floor & carpet & throne · curtain framing | dust in sunbeams, banners stir, candle flames |
| **Village & bakery** | warm terracotta | roofs `#c8643a`, walls `#efd9b4`, timber `#7a5a3a`, smoke `#cfc6bc` | sky · far roofs · houses & bakery · street & well · flower pots, baskets | chimney smoke, chickens, flags |
| **River** | cool blues and teals | water `#5f9aa8` `#8cc2c4`, reeds `#7a9a4a`, rock `#8d8a86` | sky · far trees · river · bank (rock, bush) · road & reeds | ripples, sparkles, drifting leaves |
| **Fields, pasture, orchard** | bright greens | `#9cc25a` `#6f9a3a`, apples `#d8323a`, sky `#cfe3ec` | sky · far hills · fields/orchard · road · grass & flowers | grass waves, sheep graze, clouds |
| **Ogre's castle** | grey stone, moss, stormy purple (funny) | stone `#8f8c94`, moss `#6f8a4a`, storm `#5e4a7a` → clears to `#f6dca0` | sky · far crags · castle & towers & flags · courtyard & door · thistles, rocks | flags snap, clouds churn, then clear |
| **Castle kitchen, night** | warm golden glow | `#3a2a2a` dark, glow `#f2b94b`, wood `#7a5a3a`, copper `#c87a4a` | back wall & window (moon) · shelves & pots · hearth · table · foreground jugs & bread | fire flicker, candle flames, steam |

Aerial perspective in every place: each layer back is blended 10–25 % toward the sky colour and desaturated.

## 6. Effects

- **Thought bubbles**: three small painted circles rising to a wobbly cloud with a tiny painted picture inside.
- **Speech bubbles** (shouts only: "HELP!", "TRUST ME!", "EEEK!", "BOO!", "SQUEAK!"): painted wobbly bubble with a tail to the speaker's mouth.
- **Sound words**: SPLASH!, POOF!, KNOCK!, ROAR!, CLIP-CLOP!, PICK!, DING!, SWISH!, BAAA!, TAP TAP, SLIDE!, CREAK… — Fredoka, painted, pop-in squash and a slight wobble, gone in ≤ 1.6 s.
- **Music notes** for the doorbell, floating up and fading.
- **Pop-ins**: objects (berries, cookies, apples, gifts) appear one by one with a squash-and-settle and a soft pop.
- **Labels**: hand-drawn pen arrow + Caveat word; the arrowhead ends on the object (checked per shot).

## 7. Sound (every story)

- Narrator leads; music only at the opening, ending and big moments, ducked ≥ 12 dB under the voice, real silences left in.
- Sound effects short, soft, cartoon-like; nothing loud or frightening. Made procedurally in code or from CC0 samples only; every sound listed in `CREDITS.md`.
- Final loudness −14 LUFS, true peak ≤ −1 dBTP.
