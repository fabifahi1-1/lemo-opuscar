# SAMPLE_CHECK: sample 3 (premium pass)

`film/sample.mp4` (25.00 s, 1920×1080, 24 fps, H.264 + AAC) and `film/sample-sound.wav` (music and effects, 48 kHz, 24-bit) were rebuilt from nothing with `sh film/build.sh 0 25 sample`. `film/out/` was deleted first, so no earlier render or audio file was reused. The picture, the score and the effects were all generated again.

How I checked:
- **Frames** are taken from the final `sample.mp4` at the times given.
- **Audio** readings are ffmpeg `ebur128=peak=true` on the AAC track of `sample.mp4` (`film/tools/audio_check.py`, raw numbers in `film/checks/audio_check.json`).
- **Shapes and sizes** come from `film/tools/frame_check.mjs`. It renders the same frames with chosen layers painted in a flat colour, keeping what covers them, and counts pixels (raw numbers in `film/checks/frame_check.json`).

Shots in the sample (from `data/timing.json`):

| Shot | Time | Length |
|---|---|---|
| opening 1 (lantern) | 0.00–2.20 | 2.20 s |
| opening 2 (page, title) | 2.20–6.00 | 3.80 s |
| opening 3 (tilt) | 6.00–8.00 | 2.00 s |
| A: hands | 8.00–11.50 | 3.50 s |
| B: worried face | 11.50–13.89 | 2.39 s |
| C: focus pull | 13.89–17.57 | 3.68 s |
| D: wide, turn and smile | 17.57–19.79 | 2.21 s |
| mill wide | 19.79–22.68 | 2.89 s |
| wheel (cut at 25.0) | 22.68–25.07 | 2.39 s |

## A. Still not fixed from last time

| # | Item | Status | How I checked |
|---|---|---|---|
| 1 | "Retold by Lantern and Page" in the sky, no bar, storybook lettering, half size, typing in | DONE | Frames 4.5 s (only "R" typed) and 5.7 s (complete), under the title in the clouds. Font IM Fell English at 100 px against the title's 210 px (48 %). Letters appear one by one from 4.40 to 5.77 s. There is no bar or band; it is paper lettering in the scene, not a subtitle. |
| 2 | A real lantern; lantern and book about 60 % of the frame; no dark shape on a stick | DONE | Frame 1.0 s: dark metal cap with ring handle, frame bars round glass panes, a candle with a flickering flame (`flick()` on scale and sway). Mask measurement at 1.0 s: lantern and book together span x 465–1673 = 63 % of the width. The flowers-on-a-stick foreground is deleted from the scene. |
| 3 | No orange star after "Boots" | DONE | Frame 5.7 s. The seal layer is removed from the code. |
| 4 | Mill wide: sky ≤ 25 %, mill ≈ 40 %, wheel attached and turning, splashes, drifting ripples, wobbly reflection | DONE | Mask at 20.0 / 21.4 / 22.6 s: sky and clouds 18.0 / 18.2 / 18.4 % of the frame; mill 461 / 468 / 474 px tall (43–44 %). Frame 21.4 s: the wheel hangs on an axle bracket on the mill's side under a wooden flume with falling water, turning 0.6 rad/s; white foam and thrown droplets at the waterline; ripple lines drift; the mill's reflection is drawn in 6 px strips with a moving wobble. |
| 5 | Sound: about −30 LUFS under narration, up to −20 LUFS in the opening and pauses, true peak ≤ −6 dBTP | DONE | ffmpeg ebur128 on the final file. Narration slots: L001 −30.1, L002 −30.1, L003 −30.4, L004 (to 25 s) −30.1 LUFS. Opening (0–8.25 s) integrated −23.6 LUFS, loudest momentary −20.2. Pauses −26.1, −25.8, −26.2 LUFS (loudest momentary −23.3). True peak −8.0 dBTP for the whole file (WAV stem −9.0 dBTP). Whole file integrated −26.6 LUFS, LRA 8.4 LU. |
| 6 | No slices of faces: hands close-up from mid-chest to knees; the medium shot starts with the whole face | DONE | Frame 9.5 s: top edge on his chest (chin out of frame), bottom on his knees. Frame 11.5 s (first frame of B): whole face, hair to chin (mask: Tom from y 48). Frames 14.4 and 16.6 s show the back of his head only, no features. The cat is hidden in shot A so no sliver of him shows at the edge. |
| 7 | Bread: no slashes; domed golden-brown crust, shine, torn edge with holey crumb, two palms in size | DONE | Frame 9.5 s. The slash cuts are deleted. Crust gradient #d0923e to #7e4a1e, a soft shine and highlight stroke on the dome, a torn right edge with a pale crumb and 16 holes. Width 96 units, against each hand's visible width of about 45–50. |

## B. Light and shadow

| # | Item | Status | How I checked |
|---|---|---|---|
| 8 | One clear light per scene | DONE | The steps scene and the mill scene both have sun from the upper left (`lightDir [.62, .78]`, sun disc and beams on the left). The night room is cool blue (#0f1630 to #26335a) with one warm lantern pool. Frames 1.0, 12.5 and 21.4 s. |
| 9 | Every layer casts a soft shadow behind it, away from the light, bigger and softer with distance | DONE | Built into `engine.js`. Each layer's shadow is offset 6–30 px along the light direction, blurred 8–20 px, at opacity 0.25–0.40, all growing with the depth gap to the layer behind. Visible in frame 21.4 s (mill on the hills, clouds on the sky) and 18.9 s (step lips, doorframe). |
| 10 | Characters: dark contact shadow on the step; soft cast shadow on the wall behind | DONE | Frames 12.5 and 18.9 s. Soft dark ellipses under Tom's seat, under his feet and under the cat. Cast shadows offset down-right (26, 22 px; blur 16; 0.34) for Tom and (20, 16; blur 12; 0.32) for the cat. |
| 11 | Shadow side and warm rim on every character and prop; highlight on the crust | DONE | Every paper part is finished with a warm rim on the edges facing the light, a dark band on the far edges, and a soft shadow side across the sheet (`finish()` in `engine.js`). Puppet parts also drop shadows on the parts behind them. Crust shine: frame 9.5 s. |
| 12 | Darker corners where things meet | DONE | Dark gradient under each step lip, a dark radial fall-off inside the doorway, part shadows where the arms cross the body, and a dark gradient under the chin on the neck and collar. Frames 9.5, 12.5 and 18.9 s. |
| 13 | A visible sunbeam from the upper left, dust only inside it | DONE | Frames 12.5, 14.4 and 21.4 s: a warm diagonal beam from the top left. The dust is drawn inside a clip of the beam's shape. The candle dust in the opening is clipped to the lantern's glow. |
| 14 | Golden, warm mill scene; soft vignette, edges 10–15 % darker | DONE | Warm multiply grade (255, 222, 170) at 16 % on the mill and 12 % on the steps. Vignette measured on a flat grey test frame (`?vigtest=1`): edge midpoints 12.3 % darker than the centre, corners 19.7 %. Applied to every shot. |

## C. True depth

| # | Item | Status | How I checked |
|---|---|---|---|
| 15 | Every layer at a real distance; push-ins are camera moves | DONE | Each layer has a distance (sky 20, hills 8, wall 2.8, Tom 2.0, foreground 1.3–1.5). A layer's scale is zoom × d/(d − dz), so nearer layers grow faster as the camera dollies in. Every moving shot uses `cam.dz` for its push; there are no flat zooms. Example: in C the shoulder (d 1.3) grows 10 % while the wall (d 2.8) grows 4 %. |
| 16 | Depth of field: subject sharp, far 2–6 px, foreground 6–14 px | DONE | In `engine.js` the blur comes from distance relative to the focus. Mill wide: hills 6 px, mid hills 2.9 px, reeds 12.9 px. Steps: sack about 8.6 px, ivy about 8 px. Frames 9.5, 18.9 and 21.4 s. |
| 17 | Far layers lighter, softer, bluer | DONE | Haze toward #c6d6ec grows with distance (up to 42 % from d ≈ 7.7 back) on top of the depth-of-field blur. Frame 21.4 s: the hills behind the mill. |
| 18 | A foreground layer at the frame edge in at least half the shots | DONE | 6 of 9 shots: A (flour sack, bottom left, 9.5 s), B (ivy, top right, 12.5 s), C (Tom's shoulder, left, 14.4 s), D (sack and ivy, 18.9 s), mill wide (reeds, bottom, 21.4 s), wheel (reeds, 24.0 s). |
| 19 | The focus pull over Tom's shoulder, 3–4 s, 1 s pull, slow push-in | DONE | Shot C, 13.89–17.57 s (3.68 s). Frame 14.4 s: bread sharp, cat blurred 9 px. The focus moves from 1.1 to 2.1 s into the shot (15.0–16.0 s). Frame 16.6 s: cat sharp, bread blurred 10 px, shoulder blurred 12 px throughout. The camera dollies in 0.12 over the shot. |

## D. Staging and scale

| # | Item | Status | How I checked |
|---|---|---|---|
| 20 | Cat about 35 % of Tom's seated height, in every shot | DONE | Masks. B (12.6 s): cat 343 px, Tom seated 950 px (seat y 998 to head top y 48), so 36.1 %. D (18.9 s): cat 233 px, Tom seated 623 px, so 37.4 %. The cat is out of frame in A. In C Tom is seen from behind, and the cat's scale constant (0.37) is the same in every shot. |
| 21 | Diagonal staging: Tom three-quarters to the cat, cat three-quarters to Tom, overlapping the doorframe | DONE | Frame 18.9 s. Tom's body is turned 0.45 toward the cat and his head 0.85 after the turn. The cat is turned 0.55 toward Tom and sits further back on the threshold (higher, deeper), overlapping the doorframe's left post. Neither faces the camera. |
| 22 | Wide shot: low, slight angle, steps diagonal, steps ≤ 20 %, Tom and cat 50–60 % of the frame height | DONE | Frame 18.9 s. The step edges and wall lines rise to the right (slope 0.10). Masks: steps 19.2 % of the frame; Tom's seated height 623 px = 57.7 % of the frame height. |
| 23 | Rule of thirds; eyes on the upper third; never dead centre (except the brand shot) | DONE | Tom's eyes at y 359 (B) and y 355 (D); the third line is 360. Tom at x 600 / 651, cat at x 1250 / 1096. Bread in A at x ≈ 730. The cat in C on the right third. The mill in the mill wide at x 1220 to 1153 (mask). The lantern on the left third, the book on the right. Only the title shot is centred. |

## E. Acting

| # | Item | Status | How I checked |
|---|---|---|---|
| 24 | Nobody looks at the camera | DONE | Every pose has an off-camera gaze. Tom looks down at the bread (lowered lids) in A and B, then at the cat in D. The cat looks at the bread, then up at Tom. Frames 12.5, 16.6 and 18.9 s. |
| 25 | The hook acted to its lines | DONE | **L001 (8.50–13.64)**: the fingers tighten from 8.5 to 9.4 s, the thumb rubs the crust at 9.9 s; in B (11.5 s on) his brows pinch up in the middle and his mouth wobbles; a small sigh (shoulders up, then down) 11.95–13.25 s. **L002 (14.14–19.29)**: in C the cat's ears point forward and his eyes are on the bread, a nose twitch at 14.34–14.94 s, then he looks up at Tom (with a small dip first) at 16.04–16.54 s and does one slow blink at 16.85–17.55 s. In D Tom's eyes slide to the cat at 17.67 s and his head follows at 17.81 s (3.4 frames later), then his face softens into a small smile at 18.37–18.82 s. |
| 26 | Thumbs on the top front, fingers behind, fingertips at the sides, slim bent fingers that tighten | DONE | Frame 9.5 s: both thumbs lie along the top front of the crust; the hands and fingers sit behind the bread, with three slim fingertips (knuckle creases, nails) curling round each side; the fingertips move 2.4 units inward and the thumbs press while he is worried. |
| 27 | Blinks every 3–5 s, some doubles; Tom blinks in every shot over 3 s | DONE, with one limit | Each character runs a blink track with gaps of 3–5 s and about a 28 % chance of a double blink. Tom blinks at 13.40 s (in B) and 19.10 s (in D); the cat has a slow blink at 16.85 s. The two shots over 3 s that contain Tom (A, 3.5 s, and C, 3.68 s) don't show his eyes (hands only, and the back of his head), so there is nothing to blink there. |
| 28 | Breathing: Tom's chest and shoulders, the cat's belly | DONE | Tom's torso rises 1.8 % on a 3.6 s cycle, with the shoulders and arms riding on it; the cat's body rises 2 % on a 3.1 s cycle. The stillness test found no frame without change (smallest frame-to-frame change 0.02 grey levels at 6.04 s; 0 of 600 frames unchanged). |
| 29 | Eased arcs, follow-through, anticipation | DONE | Every move uses eased curves. Tom's head turn dips 4 units mid-turn (an arc) and starts with a small move the other way. His hair tuft follows the head through a damped spring (trails, overshoots, settles). The cat's look-up starts with a small dip; his ears and tail follow through a spring after the head stops. |

## F. Polish

| # | Item | Status | How I checked |
|---|---|---|---|
| 30 | Motion blur on fast things and fast camera moves | PARTLY DONE | DONE: the page turn and the dolly onto the page (5 sub-frames, 180° shutter, 2.3–3.7 s), and the tilt down to the mill (6 sub-frames over the whole shot, frame 7.2 s). NOT DONE: the small water droplets at the wheel move fast but have no blur. Every other move in the sample is slow. |
| 31 | Clean, smooth edges; no flicker or jagged edges | DONE (checked by eye) | All drawing is antialiased Canvas2D with high-quality image smoothing; whiskers are 3.6-unit round-capped strokes. I checked frames 1.0, 9.5, 12.5, 16.6, 18.9 and 21.4 s at full size by eye. I did not run an automatic flicker test. |
| 32 | Light direction and shadows constant within a scene | DONE | One light direction per scene, used by every layer shadow, every paper finish, the puppets' part shadows and the beams. It is the same upper left for the steps and the mill, and the lantern for the night room. Frames 9.5, 12.5, 14.4 and 18.9 s show shadows falling down-right throughout. |
