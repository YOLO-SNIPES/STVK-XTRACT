#!/bin/bash
# STAK-XTRACT 1.0.0 Official — launcher.
# Starts the engine bridge (port 8777) and opens the app.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
echo "STAK-XTRACT 1.0.0 Official — by YOLO SNIPES"
echo "Starting engine bridge..."
python3 "$DIR/engine/server.py" &
ENGINE_PID=$!
trap "kill $ENGINE_PID 2>/dev/null || true" EXIT
sleep 2
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$DIR/STAK-XTRACT.html"
elif command -v open >/dev/null 2>&1; then
  open "$DIR/STAK-XTRACT.html"
else
  echo "Open $DIR/STAK-XTRACT.html in your browser."
  echo "Engine status: http://127.0.0.1:8777/status"
fi
echo "Engine running (PID $ENGINE_PID). Ctrl+C to stop."
wait $ENGINE_PID
