#!/bin/sh
# usage: mux.sh video.mp4 mix.wav out.mp4 [fps=24]
# Same job as core/render/mux.sh (two-pass loudnorm to -14 LUFS, true peak -1.2 dB, AAC), written to work with ffmpeg 6.x,
# where core/render/mux.sh mistakes loudnorm's 3 s output delay for a damaged file.
set -e
V=$1; A=$2; OUT=$3
J=$(ffmpeg -hide_banner -nostats -i "$A" -af loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
IL=$(g input_i); TP=$(g input_tp); LRA=$(g input_lra); TH=$(g input_thresh); OF=$(g target_offset)
echo "measured: I=$IL LUFS TP=$TP LRA=$LRA"
ffmpeg -hide_banner -loglevel error -y -i "$V" -i "$A" -map 0:v -map 1:a \
  -af "loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=$IL:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OF:linear=true,alimiter=limit=0.87:level=disabled" \
  -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "-> $OUT"
