#!/bin/bash
# Optimize a video for web background use
# Usage: ./optimize-video-bg.sh input.mp4 [output.mp4]

INPUT="$1"
OUTPUT="${2:-${INPUT%.*}-web.mp4}"
POSTER="${OUTPUT%.*}-poster.jpg"

if [ -z "$INPUT" ]; then
    echo "Usage: $0 input.mp4 [output.mp4]"
    exit 1
fi

echo "=== Optimizing video for web background ==="
echo "Input:  $INPUT"
echo "Output: $OUTPUT"

# 1. Encode to 720p, H.264, capped at 2 Mbps, 15s max, no audio
ffmpeg -y -i "$INPUT" \
    -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720" \
    -c:v libx264 \
    -preset slow \
    -crf 28 \
    -maxrate 2M \
    -bufsize 4M \
    -profile:v main \
    -level 3.1 \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -an \
    -t 15 \
    "$OUTPUT"

echo ""
echo "=== Extracting poster frame ==="

# 2. Extract a poster image from the 1s mark
ffmpeg -y -i "$OUTPUT" \
    -ss 1 \
    -frames:v 1 \
    -q:v 2 \
    "$POSTER"

echo ""
echo "=== Results ==="
echo "Video:  $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"
echo "Poster: $POSTER ($(du -h "$POSTER" | cut -f1))"
echo ""
echo "HTML usage:"
echo "<video src=\"$OUTPUT\" poster=\"$POSTER\" autoplay muted loop playsinline></video>"
