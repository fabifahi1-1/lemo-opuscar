#!/bin/sh
# One command for any span of the film:  sh film/build.sh FROM TO NAME   (seconds; default 0 25 sample)
#   picture (Canvas2D, 4 workers) -> music+effects stem at its final level -> film/NAME.mp4 and film/NAME-sound.wav (24-bit)
# Whole film: sh film/build.sh 0 725.5 puss-in-boots   (about 50 min on 4 CPU cores, no GPU)
set -e
A=${1:-0}; B=${2:-25}; NAME=${3:-sample}
HERE=$(cd "$(dirname "$0")" && pwd); LIB=$(cd "$HERE/.." && pwd); cd "$LIB"
python3 film/tools/build_plan.py > /dev/null
node core/render/video.mjs film --fps 24 --workers ${WORKERS:-4} --q "from=$A&to=$B" --out film/out/${NAME}_video.mp4
.venv/bin/python film/audio/mix.py "$A" "$B"
sh film/tools/mux.sh film/out/${NAME}_video.mp4 film/out/mix_${A}-${B}.wav film/out/${NAME}_master.mp4
ffmpeg -v error -y -i film/out/${NAME}_master.mp4 -c:v libx264 -crf 22 -preset slow -pix_fmt yuv420p -c:a copy -movflags +faststart film/$NAME.mp4
.venv/bin/python - <<PY
import soundfile as sf
x, sr = sf.read('film/out/mix_${A}-${B}.wav', dtype='float32'); sf.write('film/$NAME-sound.wav', x, sr, subtype='PCM_24')
PY
echo "-> film/$NAME.mp4  film/$NAME-sound.wav"
