#!/bin/sh
# usage: mux.sh video.mp4 mix.wav out.mp4
# The music-and-effects stem is mixed to its final level in audio/mix.py (about -30 LUFS under narration, -21 LUFS in the
# opening and pauses, true peak under -6 dBTP), so this only muxes: no loudness normalisation.
set -e
ffmpeg -hide_banner -loglevel error -y -i "$1" -i "$2" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$3"
echo "-> $3"
