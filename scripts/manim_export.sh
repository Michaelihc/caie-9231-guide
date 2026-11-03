#!/usr/bin/env bash
# Render manim scenes and copy mp4 + poster (last frame) into guide/assets/media/<part>/.
# usage: scripts/manim_export.sh fp1 manim/vectors.py PointPlane PointLine SkewLines
set -euo pipefail
cd "$(dirname "$0")/.."
part=$1 file=$2; shift 2
mod=$(basename "$file" .py)
out=guide/assets/media/$part; mkdir -p "$out"
for scene in "$@"; do
  .venv/bin/manim -qm --progress_bar none "$file" "$scene"
  src=media/videos/$mod/720p30/$scene.mp4
  name=$(echo "$scene" | sed -E 's/([a-z])([A-Z])/\1-\2/g' | tr 'A-Z' 'a-z')
  ffmpeg -loglevel error -y -i "$src" -c:v libx264 -crf 30 -preset slow -pix_fmt yuv420p -movflags +faststart -an "$out/$name.mp4"
  ffmpeg -loglevel error -y -sseof -0.2 -i "$src" -frames:v 1 -q:v 4 "$out/$name.jpg"
  echo "$out/$name.mp4 $(du -h "$out/$name.mp4" | cut -f1)"
done
