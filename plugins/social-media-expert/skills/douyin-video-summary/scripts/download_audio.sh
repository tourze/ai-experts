#!/bin/bash
# 通过 Douyin CDN 直链下载音频。
# 用法：download_audio.sh <audio_direct_url> <output_file>

set -euo pipefail

usage() {
  echo "Usage: download_audio.sh <audio_url> <output_file>" >&2
  exit 1
}

command -v curl >/dev/null 2>&1 || { echo "❌ 缺少 curl"; exit 1; }

AUDIO_URL="${1:-}"
OUTPUT="${2:-}"
[[ -n "$AUDIO_URL" && -n "$OUTPUT" ]] || usage

echo "Downloading audio..."
curl -fsSL \
  -H "Referer: https://www.douyin.com/" \
  -H "User-Agent: Mozilla/5.0" \
  -o "$OUTPUT" \
  "$AUDIO_URL"

[[ -s "$OUTPUT" ]] || { echo "❌ 下载失败：输出文件为空"; exit 1; }

SIZE_BYTES=$(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT" 2>/dev/null)
SIZE_MB=$(awk "BEGIN { printf \"%.1f\", ${SIZE_BYTES:-0} / 1024 / 1024 }")

echo "Done: $OUTPUT (${SIZE_MB}MB)"
