#!/bin/bash
# 使用 whisper.cpp 转录音频。
# 用法：transcribe.sh <input_audio> <output_prefix> [model_path] [language]

set -euo pipefail

usage() {
  echo "Usage: transcribe.sh <input_audio> <output_prefix> [model_path] [language]" >&2
  exit 1
}

for command in ffmpeg ffprobe whisper-cli; do
  command -v "$command" >/dev/null 2>&1 || { echo "❌ 缺少 $command"; exit 1; }
done

INPUT="${1:-}"
OUTPUT_PREFIX="${2:-}"
MODEL="${3:-models/ggml-small.bin}"
LANG="${4:-zh}"
[[ -n "$INPUT" && -n "$OUTPUT_PREFIX" ]] || usage
[[ -f "$INPUT" ]] || { echo "❌ 输入文件不存在：$INPUT"; exit 1; }
[[ -f "$MODEL" ]] || { echo "❌ Whisper 模型不存在：$MODEL"; exit 1; }

WAV_FILE="${OUTPUT_PREFIX}.wav"
LOG_FILE="$(mktemp -t whisper-cli.XXXXXX.log)"
trap 'rm -f "$LOG_FILE"' EXIT

echo "Converting to WAV..."
ffmpeg -hide_banner -loglevel error -y -i "$INPUT" -ar 16000 -ac 1 -c:a pcm_s16le "$WAV_FILE"
[[ -s "$WAV_FILE" ]] || { echo "❌ WAV 转换失败"; exit 1; }

DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv="p=0" "$WAV_FILE" | cut -d. -f1)
echo "Audio duration: ${DURATION:-unknown}s"

echo "Transcribing with whisper.cpp (model: $(basename "$MODEL"), lang: $LANG)..."
whisper-cli -m "$MODEL" -l "$LANG" -f "$WAV_FILE" -otxt -of "$OUTPUT_PREFIX" >"$LOG_FILE" 2>&1 || {
  tail -20 "$LOG_FILE" >&2 || true
  exit 1
}

tail -5 "$LOG_FILE" || true
[[ -f "${OUTPUT_PREFIX}.txt" ]] || { echo "❌ 未生成转录结果"; exit 1; }

echo "Output: ${OUTPUT_PREFIX}.txt"
