#!/bin/sh
# Render scenes FROM..TO, committing each clip as it finishes (resume: run again from the next scene)
HERE=$(cd "$(dirname "$0")/.." && pwd); cd "$HERE/../.."
for N in $(seq ${1:-1} ${2:-15}); do
  sh "$HERE/tools/render_scene.sh" "$N" || { echo "scene $N FAILED"; exit 1; }
  NN=$(printf %02d "$N")
  git add -f "$HERE/clips/scene$NN.mp4" && git commit -qm "Puss in Boots: render scene $N

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018MiCdM5zP1UEipuig2o7DK" && for i in 1 2 3 4; do git push -q origin HEAD && break; sleep $((2**i)); done
done
echo ALLDONE
