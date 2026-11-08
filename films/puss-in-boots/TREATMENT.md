# Puss in Boots — Treatment

**Channel:** Lantern and Page · **Style:** Watercolor Brush (`styles/watercolor/STYLE.md`) · **Format:** 1920×1080, 24 fps, US English, ~10–11 min, YouTube read-along for ages 4–10.
**Script:** the user's, word for word (177 narration segments, checked against `script/script.txt` by `tools/lines.py`).

## 1. Three candidate structures

1. **One painted road (a journey).** The kingdom is one continuous painted world laid along a single road: mill → forest edge → castle on the hill → village → river → fields, pasture and orchard → the ogre's castle at the road's end. Each chapter is a new stretch of the same road, so kids always know where they are. Wide shots establish each place, then the camera cuts in to faces.
2. **The lantern-lit book (a bookend).** Everything happens inside the storybook on the narrator's desk: the film opens on the book, every chapter is a page turn, and the film ends with the book open on the last page, the lantern still glowing.
3. **The two halves of bread (an object that turns).** Built around one small object: the half loaf Tom shares at the start comes back in the kitchen at the end, and becomes the moral card. The bread is the only "hero prop" that gets a painting-in close-up three times.

**Chosen: 1 + 2 + 3 together, with 1 as the spine.** The road gives a clear, reusable geography (the same mill, river and castles shot from several angles); the lantern book frames the film as the channel's signature (opening and end card) and supplies the page-turn transition between chapters; the bread gives the ending its echo. The first idea for watercolour (a slow naturalist scroll with notes) is the style's cliché and is used only as seasoning: the hand-written arrow labels ("the mill →").

## 2. Logline and arc

A poor miller's son shares his last piece of bread with a talking cat, and the cat's clever (and very cheeky) plan wins him a castle, a princess and a lesson about kindness.

- **Setup** (0:00–2:10): the lantern book opens; the mill; three brothers split the inheritance; the bread is shared; the cat talks, gets boots, becomes Puss.
- **Rising** (2:10–5:20): berries for the king, the invented "Marquis of Carabas", the town crier, SPLASH in the river, the carriage, the new clothes, the princess.
- **Turn** (5:20–8:40): cookies buy the farmers' help; "Whose fields are these?"; the ogre's castle; knock-knock-KNOCK, the doorbell, the lion, the slide, POOF, the mouse runs away; the storm over the castle clears.
- **Ending** (8:40–end): Tom tells the truth; the king laughs; "Yes, please!"; the kitchen at night, the loaf broken in half again; the moral card; the end card.

## 3. Benchmark

- **Iconographic read-along films** (the long tradition of filming picture-book art with a rostrum camera): learn the grammar — slow pans across a painted plate, push-ins on faces at emotional beats, the cut on a narrative beat, the page turn as chapter break. Don't take any book's art, characters or layouts.
- **Loose watercolour animated features** (white paper as light, colour economy, edges left open): learn the restraint of 3–5 hues per place, unpainted paper as highlight, and the warmth of bloomed edges. Don't take characters, designs or shots.
- **Classic picture-book "learn a word" pages**: learn the object-plus-word card (one painted object, one word, nothing else). Our cards are painted, not photographed, in our own type.

## 4. Native moves (from STYLE.md §8)

- **Painting-in as reveal**: every word card paints its object stroke by stroke as the word is said; the title clouds paint in on the sky.
- **Page turn / new sheet**: chapter changes are page turns of the lantern book's pages (opening, castle, village, river, fields, ogre's castle, kitchen night).
- **Mist erase**: the dream-like time skips ("Every week…", "That night…").
- **Painted transformation** (signature moment): POOF — the ogre washes into a cloud of pigment and is re-painted as a mouse; then the stormy purple sky over his castle bleeds into clear gold as he runs away (palette as data: the sky colour is a function of story time).
- **Specimen + note**: hand-drawn arrow labels inside scenes ("the mill →", "the throne", "the doorbell").

## 5. Departures from STYLE.md (requested by the user, deliberate)

- STYLE.md says cutting is rare. The user asks for a shot change every 3–5 s for small children. **Within a place we cut** (wide → close → reaction), like a read-along; **between places we use the style's own transitions** (page turn, brush-edge wipe, mist). No dissolves between unrelated pictures.
- STYLE.md says "not a children's picture book (no crayon, no cute outlines)". The film *is* for children, so characters are simple and cute, but they are still painted the watercolour way: translucent washes with pooled edges, colour blooms, dry-brush texture, a darker edge stroke as the only line; no crayon, no flat vector fills.
- No subtitles (the user's rule). The only text: title, word cards, labels, sound words, speech bubbles, moral card, end card.

## 6. Shot list, beat sheet, cue map

The full shot list (every shot with its time, framing, camera move, action, word card, label, effect and sound) is generated from the build data and lives in **`SHOTLIST.md`** (source: `js/shots.js`, resolved against the measured voice timings by `tools/timeline.py`). Shots are anchored to words of the narration, so they stay in sync if a line is re-voiced.

Editing rule: every shot 3–5 s (word cards 2.6–3.2 s); a wide to show the place, then close-ups on whoever speaks or feels; each location reused from at least two angles and zoom levels.

## 7. Score shape (cue map)

The music plays at the opening, the ending and the big moments only, never under every line; it ducks under the voice; there are real silences.

| Section | Music state | Instruments |
|---|---|---|
| Opening (lantern book, title) | **Signature tune** (full) | glockenspiel, harp, clarinet, upright piano, soft strings |
| Mill, inheritance | theme softly under the first two lines, then out | upright piano, harp |
| Bread shared | a single held clarinet phrase, then silence | clarinet, harp |
| Boots on, clip-clop walk | playful march, 4 bars | pizzicato strings, bassoon staccato, woodblock |
| Throne room | a tiny royal fanfare (soft) | horn, glockenspiel, timpani (soft) |
| Village, town crier | bell + 2-bar sting | glockenspiel, flute staccato |
| River: TRUST ME → SPLASH | comic rise, cut to silence on SPLASH | pizzicato, flute |
| Carriage, princess smiles | warm theme, 4 bars | strings, harp, horn |
| Cookies montage | bouncy pizzicato, 6 bars | pizzicato, clarinet staccato, glockenspiel |
| Ogre's castle | sneaky low comic figure | bassoon staccato, cello pizzicato, timpani |
| Lion / slide / POOF | stings only (SFX lead) | — |
| Sky clears, mouse gone | theme swells, 4 bars | strings, harp, glockenspiel |
| Confession | **silence** (only room tone) | — |
| King laughs → "Yes, please!" | theme returns, bright | full ensemble (soft) |
| Kitchen at night | tender music-box/harp reprise of the theme | music box (modelled), harp, clarinet |
| Moral card | theme, warm | piano, strings, clarinet |
| End card | **Signature tune** | as opening |

Silences: before "But one day, he died."; between the knocks; the confession ("Your Majesty… I must tell you the truth"); the breath before the moral.

## 8. Sound design (summary; every row is in `tools/mix.py`)

| Place | Ambience | Foley |
|---|---|---|
| Desk (opening/end) | warm room tone, lantern flame flutter | page turn, soft paper rustle, pen tick for typed letters |
| Mill | river water, birds, creak of the wheel | tummy rumble, bread tear, clip-clop boots |
| Forest edge | leaves, birds | pick-pick-pick pops |
| Castle / throne room | big soft room | footsteps, bow swish |
| Village | distant chatter-free murmur bed (filtered noise), chickens | ding-ding-ding bell |
| River | water, reeds | splash, shiver brr, clothes rustle |
| Road / carriage | birds, wind | horse clip-clop, wheels, HELP |
| Fields | wind in grass, birds | swish swish swish, crumbs, baaa, tap tap |
| Ogre's castle | wind, distant soft thunder (gentle) | knock ×6, doorbell tune, door creak, funny roar, eeek, slide whistle, poof, squeak, boo |
| Kitchen (night) | fire crackle | bread tear, cosy purr |

## 9. Text design

- Title: Cormorant Garamond Bold Italic, painted in ink on the cloud, with a gold wash behind.
- "Retold by Lantern and Page": Caveat, typed letter by letter.
- Word cards: **Andika** (designed for early readers: single-storey a and g), lower case "the boots", ink colour, typed in sync with the spoken word.
- Labels: Caveat, ink, with a hand-drawn pen arrow that ends exactly on the object.
- Sound words: Fredoka Bold, painted (layered washes + darker edge), with a pop-in squash.
- Speech bubbles: hand-painted wobbly bubble, Fredoka.
- Moral and end card: Cormorant Garamond Italic + Caveat.
