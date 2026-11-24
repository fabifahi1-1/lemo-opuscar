# Puss in Boots: the finished film

12:05.48, 1920×1080, 24 fps, 17,412 frames. Music and effects only, no voice and no subtitles. Your narration goes on top, following `VOICE_TIMING.md`.

## The files

The whole film and its sound are too big for GitHub (over 100 MB each), so the repository holds them in four pieces. Every cut falls on a part boundary, which is also a scene break.

| Piece | Film time | Picture + sound | Sound only (24-bit WAV) |
|---|---|---|---|
| 1 of 4 | 0:00.00–4:17.54 (Parts 1–3) | `puss-in-boots-1-of-4.mp4` | `puss-in-boots-sound-1-of-4.wav` |
| 2 of 4 | 4:17.54–7:21.38 (Parts 4–5) | `puss-in-boots-2-of-4.mp4` | `puss-in-boots-sound-2-of-4.wav` |
| 3 of 4 | 7:21.38–10:56.35 (Parts 6–7) | `puss-in-boots-3-of-4.mp4` | `puss-in-boots-sound-3-of-4.wav` |
| 4 of 4 | 10:56.35–12:05.48 (Part 8, end screen) | `puss-in-boots-4-of-4.mp4` | `puss-in-boots-sound-4-of-4.wav` |

The pieces butt-join exactly. Each cut sits on the 24 fps frame grid, and each WAV piece starts on the same frame as its video piece.

To rebuild the single files `puss-in-boots.mp4` and `puss-in-boots-sound.wav` (run from `film/`):

```bash
printf "file 'puss-in-boots-%s-of-4.mp4'\n" 1 2 3 4 > join.txt && ffmpeg -f concat -safe 0 -i join.txt -c copy puss-in-boots.mp4
```

```bash
ffmpeg -i puss-in-boots-sound-1-of-4.wav -i puss-in-boots-sound-2-of-4.wav -i puss-in-boots-sound-3-of-4.wav -i puss-in-boots-sound-4-of-4.wav -filter_complex concat=n=4:v=0:a=1 -c:a pcm_s24le puss-in-boots-sound.wav
```

The eight part files (`part1.mp4` … `part8.mp4`, each with `partN-sound.wav`) are also in the repository. Each part has a self-check in `checks/partN/`: a frame every 2 s, shot-by-shot motion, and loudness.

## Checks (whole film)

- **Soundtrack, mixed in one pass over the whole film** (`checks/final/audio_wav.json`):
  - true peak −8.9 dBTP (limit −6);
  - every narration slot is quiet (about −30 LUFS, never above −20.7 LUFS momentary);
  - pauses, the opening and the end screen are fuller but never above −20.5 LUFS momentary (limit −20).
- **Picture:**
  - Every shot moves, with at least 4 paper layers moving, except the end screen, which drifts gently (5 of 6 layers) with the candle flickering.
  - No shot is longer than 5 s except the opening, the 15 s end screen and L012 (5.09 s, set by the frozen voice timing).
  - Three slots in the timing run 5.3–5.5 s (L025[8:], L035, L122[1:12]), but a word card cuts into each, so no single picture stays on screen over 5 s.
  - Comic snap-zooms are used 4 times ("TALK?" jump, "TRUST ME!", "EEEK!", "BOO!").
  - Small shakes are used only on KNOCK, ROAR, SPLASH and POOF.
- **Sync:** the picture is built frame-exact from the raw renders. Frames at 5, 8 and 11 minutes match the renders made at those film times.
- **On-screen text:** no screen text uses "pants", "trousers", "cookies", "biscuits", "colorful" or "favorite".
- **`VOICE_TIMING.md` is unchanged:** the timings were frozen before production and are the final times. Every line slot in the film sits exactly where that file says.

Sounds and their licences are listed in `CREDITS.md`: CC0 instrument samples, and effects synthesised in code.
