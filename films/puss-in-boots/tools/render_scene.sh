#!/bin/sh
# Render one scene (clip) of the film: sh tools/render_scene.sh <scene number>
# raw frames → out/raw/sceneNN.mp4 → delivery encode (H.264 crf 22, colour lift) → clips/sceneNN.mp4
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
N=$1; NN=$(printf %02d "$N")
mkdir -p "$HERE/out/raw" "$HERE/clips"
cd "$LIB"
node core/render/video.mjs "$HERE" --q "scene=$N" --fps 24 --workers ${WORKERS:-4} --out "$HERE/out/raw/scene$NN.mp4"
ffmpeg -loglevel error -y -i "$HERE/out/raw/scene$NN.mp4" -vf "eq=saturation=1.18:contrast=1.04" \
  -c:v libx264 -preset slow -crf 22 -tune animation -pix_fmt yuv420p -r 24 -g 48 -an "$HERE/clips/scene$NN.mp4"
rm -f "$HERE/out/raw/scene$NN.mp4"
echo "clips/scene$NN.mp4 $(ffprobe -v error -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "$HERE/clips/scene$NN.mp4") frames"
