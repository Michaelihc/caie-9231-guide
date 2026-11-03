#!/usr/bin/env bash
# Fresh-machine setup: LaTeX + Cairo/Pango (for manim), Python venv with manim, npm deps (KaTeX), resources.
set -euo pipefail
cd "$(dirname "$0")/.."
if command -v apt-get >/dev/null; then
  sudo_cmd=""; [ "$(id -u)" -ne 0 ] && sudo_cmd=sudo
  $sudo_cmd apt-get update -qq
  DEBIAN_FRONTEND=noninteractive $sudo_cmd apt-get install -y -qq ffmpeg poppler-utils libcairo2-dev libpango1.0-dev pkg-config \
    texlive-latex-base texlive-latex-extra texlive-fonts-recommended texlive-science dvisvgm cm-super
fi
[ -x .venv/bin/manim ] || { python3 -m venv .venv && .venv/bin/pip install -q manim; }
npm install --silent
scripts/fetch_resources.sh
npm run build
