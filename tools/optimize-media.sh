#!/usr/bin/env bash
# Re-encode frontend/public videos to small, web-friendly H.264 (and WebP for big PNGs).
#   ./tools/optimize-media.sh            # optimise everything in place (keeps filenames)
#   CRF=28 ./tools/optimize-media.sh     # higher quality / bigger files
# Rules: <=720p, <=30fps, no audio track (all clips are silent, muted autoplay),
# +faststart so playback starts before the whole file downloads.
# A file is only replaced when the new encode is smaller.
set -euo pipefail
command -v ffmpeg >/dev/null || { echo "ffmpeg is required (apt-get install ffmpeg / brew install ffmpeg)"; exit 1; }
cd "$(dirname "$0")/../frontend/public"
CRF="${CRF:-30}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
size() { stat -c %s "$1" 2>/dev/null || stat -f %z "$1"; }

for f in *.mp4 stories/*.mp4; do
  [ -f "$f" ] || continue
  out="$TMP/$(basename "$f")"
  # scale so the *shorter* side is at most 720px, keep aspect ratio, even dimensions
  ffmpeg -v error -y -i "$f" -an \
    -vf "scale='if(gt(iw,ih),-2,min(720,iw))':'if(gt(iw,ih),min(720,ih),-2)':flags=lanczos,fps=30" \
    -c:v libx264 -preset slow -crf "$CRF" -pix_fmt yuv420p -profile:v high -movflags +faststart "$out"
  old=$(size "$f"); new=$(size "$out")
  if [ "$new" -lt "$old" ]; then cp "$out" "$f"; echo "✔ $f  $old → $new bytes"; else echo "· $f  kept ($old ≤ $new)"; fi
done

# Large PNG backgrounds → WebP sibling (reference it with image-set() and keep the PNG as fallback)
for f in forest-bg.png; do
  [ -f "$f" ] || continue
  ffmpeg -v error -y -i "$f" -c:v libwebp -quality 78 -compression_level 6 "${f%.png}.webp"
  echo "✔ ${f%.png}.webp  $(size "$f") → $(size "${f%.png}.webp") bytes"
done
