# Puss in Boots — Credits and licences

A **Lantern and Page** film. Story script by the channel (the classic public-domain fairy tale, retold).
Everything in the picture and the sound was made in code for this film; no stock footage, no stock music, no downloaded sound effects.

## Sound effects — all made in code (procedural synthesis, `tools/mix.py`), no third-party recordings

| Sound | How it is made | Licence |
|---|---|---|
| clip-clop (boots) | band-passed noise click + falling sine "tock" | own work (made in code) |
| pick, pick, pick / pop | short rising sine blips | own work |
| ding-ding-ding (crier's bell) | three inharmonic sine partials with exponential decay | own work |
| splash | high-passed noise burst + low splash body + random droplet pings | own work |
| swish, swish, swish | swept band-passed noise | own work |
| baaa (sheep) | harmonic voice at ~380 Hz with 7 Hz vibrato, formant band-pass, tremolo | own work |
| tap, tap | two wooden clicks | own work |
| knock / KNOCK! | low-passed noise + falling sine thud | own work |
| doorbell tune ("Ding-a-ling-a-ling") | five glockenspiel notes, VCSL glockenspiel samples | CC0 (VCSL) |
| door creak | buzzy harmonic tone with slowly sweeping pitch and stick-slip modulation | own work |
| funny roar | low growl (harmonics + 26 Hz flutter) + a silly falling brass-like buzz | own work |
| eeek | high buzzy chirp with vibrato | own work |
| slide, slide, slide | descending slide-whistle sine glide | own work |
| poof | soft noise puff + falling sine thump + airy sparkle | own work |
| squeak | short high sine chirp | own work |
| boing, jump, gulp, zoom, whoa | pitched sine/buzz sweeps | own work |
| tummy rumble, brrr (shiver), purr | modulated low buzz / filtered noise | own work |
| page turn, brush wipe, mist whoosh, card brush, pen ticks | shaped band-passed noise | own work |
| bread tear, nibble, crumbs, rustle, clap, whisper, breath, giggle, cheer, footsteps, tiptoe | shaped noise bursts | own work |
| ambience: river water, wind, birds, fire crackle, crickets, village murmur, room tone | filtered noise beds, synthesized bird chirps and crickets | own work |

## Music — original score composed for this film (`tools/music.py`)

- Composition: original, written in code for this film, including the channel's signature tune (STYLE_BIBLE.md §1). No existing melodies.
- Instrument samples (played by `core/audio/sampler.py`):
  - **VS Chamber Orchestra: Community Edition** (Versilian Studios / Sam Gossner) — **CC0 1.0**: violins, violas, cellos (sustained and pizzicato), flute (staccato), clarinet, bassoon (staccato), French horn, timpani, upright piano.
  - **Versilian Community Sample Library** (VCSL) — **CC0 1.0**: harp, glockenspiel, triangle.
  - Music box: physically modelled in code (`core/audio/pluck.py`) — own work.
- The CC-BY Salamander grand piano was deliberately **not** used, to keep every sound CC0 or self-made.

## Voice

- Narration: **Kokoro-82M** text-to-speech (hexgrad), run offline through `kokoro-onnx`; model weights under the **Apache License 2.0**. Voice `af_heart`; the bracketed asides use a blend of `af_heart` and `af_nicole`.
- Pronunciation fixes in the TTS input only (the script is unchanged): "Carabas" phonemes set to KA-ra-bas; "Marquis" is read mar-KEE.

## Fonts (SIL Open Font License 1.1, from Google Fonts, self-hosted in `fonts/`)

Cormorant Garamond (title, moral, end card) · Caveat (labels, "Retold by…") · Andika (word cards) · Fredoka (sound words, bubbles).

## Code

- Brush-stroke engine adapted from the Lemo-Opuscar library's Watercolor Brush style (`js/brush.js`, from `styles/watercolor/demo/engine.js`), MIT licence.
- Render, check and mux tools from the library's `core/` (MIT).
- Everything else (characters, places, effects, timeline, score, foley, mix) written for this film.

You are responsible for the materials you use in your films.
