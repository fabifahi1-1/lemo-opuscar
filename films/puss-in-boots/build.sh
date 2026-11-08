#!/bin/sh
# Puss in Boots (Lantern and Page) — build the whole film from source.
#   sh build.sh            voice → timeline → score → mix → all 15 scene clips → master (+ split if over 95 MB)
#   sh build.sh render 9   re-render one scene only, then remaster
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}; export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; cd "$LIB"
if [ "$1" = render ]; then sh "$HERE/tools/render_scene.sh" "$2"; "$PY" "$HERE/tools/master.py"; exit 0; fi
[ -f "$HERE/fonts.css" ] || node "$HERE/tools/fetch_fonts.mjs"
python3 "$HERE/tools/lines.py"                       # script → narration segments (checked word for word)
[ -f "$HERE/voices/L177.wav" ] || "$PY" "$HERE/tools/voice.py"   # Kokoro narration
python3 "$HERE/tools/asr_lines.py"; "$PY" core/tts/asr_check.py "$HERE/out/asr_lines.json" "$HERE/voices" || true   # speech-to-text check + word timings
"$PY" "$HERE/tools/vtime.py"                         # voice timeline, lip-sync envelopes
node "$HERE/tools/dump.mjs"                          # resolve the shot list → out/timeline.json
python3 "$HERE/tools/shotlist.py"                    # SHOTLIST.md
"$PY" "$HERE/tools/music.py"                         # original score
"$PY" "$HERE/tools/mix.py"                           # narration + score + foley + ambience
for N in $(seq 1 15); do sh "$HERE/tools/render_scene.sh" "$N"; done
"$PY" "$HERE/tools/master.py"                        # concat, −14 LUFS, split if needed
