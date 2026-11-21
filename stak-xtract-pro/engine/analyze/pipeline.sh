#!/bin/bash
export ORT_DISABLE_TELEMETRY=1
export HF_HUB_DISABLE_TELEMETRY=1
export DISABLE_TELEMETRY=1
export DO_NOT_TRACK=1
export HF_HUB_DISABLE_UPDATE_CHECK=1
# Full analysis pipeline for one track.
# Usage: pipeline.sh <audio_file> [whisper_model]
# Outputs: analyses/<name>.features.json, analyses/<name>.transcript.json
# Auto-converts compressed formats (m4a/mp3/ogg) to wav first — librosa
# can't read them directly.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$1"
MODEL="${2:-base}"
NAME="$(basename "$SRC")"
NAME="${NAME%.*}"
mkdir -p "$ROOT/analyses"
WAV="$ROOT/analyses/$NAME.wav"
case "$SRC" in
  *.wav|*.WAV) WAV="$SRC" ;;
  *) echo "== converting to wav =="
     ffmpeg -v quiet -y -i "$SRC" -ar 22050 -ac 1 "$WAV" ;;
esac
echo "== features =="
"$ROOT/venv/bin/python" "$ROOT/analyze/extract_features.py" "$WAV" "$ROOT/analyses/$NAME.features.json"
echo "== transcription ($MODEL; faster-whisper fallback w/ VAD hallucination guard) =="
"$ROOT/venv/bin/python" "$ROOT/analyze/transcribe.py" "$WAV" "$ROOT/analyses/$NAME.transcript.json" "$MODEL"
echo "== done: $ROOT/analyses/$NAME.{features,transcript}.json =="
