# SAMPLE: the first 25 seconds

**Sample 3 (premium pass):** every item of the director's 32-point list, with how each was checked, is in [`SAMPLE_CHECK.md`](SAMPLE_CHECK.md). The notes below describe earlier passes.

`sample.mp4` (picture, music and effects, no voice, no subtitles) and `sample-sound.wav` (the music and effects alone, 48 kHz stereo, peak −7 dB). One command: `sh film/build.sh 0 25 sample`.

It covers shots 1 to 9 of `SHOT_LIST.md`: the lantern and the book, the page turning into the sky and the title, the tilt down to the mill with "Retold by Lantern and Page", the hook (Tom's hands holding the bread), the cat's eyes in the doorway's shade, the pull-out to Tom sitting on the step, the reveal of the cat beside him, the mill by the river with the label "the mill →", and the start of the wheel and the door. The last shot is cut at 25.0 s.

## Director's notes 11–15 (second version of the sample)

- **11 Hands.** Each hand hangs from the shoulder through a sleeve, an elbow, a forearm with a cuff, and a wrist. The hands are smaller than his face, with a thumb, four fingers with nails and knuckle creases, curled round the bread from below and the sides. The bread is held up in front of his chest. The fingers tighten a little and ease, and the thumb rubs the crust once (about 9.5 s). The close-up shows a sleeve edge, both wrists and both hands.
- **12 Pose.** Tom sits on the top step of the mill, elbows near his knees, his feet on the step below. He is no longer standing against a wall.
- **13 Cat.** The cat is one colour, orange, in the shade of the open doorway in every shot of this scene, with only his green eyes bright. Nothing changes his colour inside a shot; the light beam never falls on him.
- **14 Shot length.** No shot is on screen longer than 5 s, apart from the opening title shots. The hook is now two shots (the hands, then the cat's eyes in the shade), the pull-out is two (Tom, then the reveal of the cat), and the wheel-and-door shot is two. The whole shot list follows the same rule (234 shots); the voice timing is unchanged.
- **15 Sparkles.** The yellow dots on the floor are gone. Flour and candle dust float only inside the light beams.

## One change from the plan: the engine

The style's own engine (three.js with WebGL) needs a graphics card. This machine has none, and a single frame took 4 to 13 seconds, which would be more than 15 hours for the film. I rebuilt the same look as a Canvas2D compositor (`src/engine.js`):

- the same stack of cut-paper sheets, each with a lit rim on its top edge and a dark band on its underside, paper fibre grain, soft cast shadows between layers, backlight glow through translucent sheets, depth of field (pre-blurred sheets and a blurred cat), bloom and a vignette;
- each sheet slides at its own parallax speed (L1 0.1 up to L6 1.5), as in your brief; the camera push, pull, pan and tilt are real moves on the sheets;
- puppets are jointed paper parts (`src/puppets.js`) with blinking, breathing, swaying and a tail that moves.

Cost: 600 frames in 99 seconds with 4 workers (0.17 s a frame), so the 725-second film is about **50 minutes of picture**, plus the sound.

## Checks I ran on the sample

- Every shot has a camera move and at least four moving layers; the breathing, blinks and tail sway run all the time. No voice, no subtitles, no mouths moving (there is no dialogue in these 25 s).
- Cuts fall on the shot list's times. Hook and callback shots are 5.89 s each.
- Sound: the score is original (felt piano, glockenspiel, strings, flute, all CC0 sample libraries from VSCO 2 CE and VCSL) and the effects are made here (candle crackle, page flip, title chimes, river and waterwheel, birds, wood creaks, grinding stones). During every voice slot the music ducks to about 15% (−16 dB), measured: the title runs at −31 dB RMS and the voice slots at −36 dB. The mix peaks at −7 dB before mastering; the master is −14 LUFS.
- I could not listen to the audio here; I checked it by level measurements only.

## Known rough spots

- The big white cloud behind the title is flat; the sky world is pale on purpose (morning) but could be richer.
- `core/render/mux.sh` refuses ffmpeg 6.1 (it mistakes loudnorm's 3 s delay for a damaged file), so `film/tools/mux.sh` does the same two-pass −14 LUFS master with the system ffmpeg.
