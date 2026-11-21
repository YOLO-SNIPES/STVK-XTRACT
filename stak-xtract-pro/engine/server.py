#!/usr/bin/env python3
"""STAK-XTRACT engine bridge — the real music utility, behind the app.

Stdlib only. No new dependencies, no telemetry, nothing leaves the machine.

  GET  /status    -> {app, version, engine, librosa, venv}
  POST /analyze   -> multipart audio file (+ sensitivity, analysis_type,
                     transcribe=1) -> real librosa features + derived samples
  POST /create    -> JSON {like, bpm, key, mood, length, seed} -> MIDI zip

The venv is REFERENCED, not copied: STAK_VENV env var, else
~/workspace/music-utility/venv/bin/python, else this interpreter.
Audio is processed locally. Nothing is uploaded anywhere.
"""
import cgi
import json
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

VERSION = "1.0.0"
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

for _v in ("ORT_DISABLE_TELEMETRY", "HF_HUB_DISABLE_TELEMETRY",
           "DISABLE_TELEMETRY", "DO_NOT_TRACK", "HF_HUB_DISABLE_UPDATE_CHECK"):
    os.environ.setdefault(_v, "1")


def find_python():
    env = os.environ.get("STAK_VENV")
    if env:
        return env
    cand = os.path.expanduser("~/workspace/music-utility/venv/bin/python")
    if os.path.exists(cand):
        return cand
    return sys.executable


PY = find_python()
NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
PALETTE = ["#ff3366", "#00ff88", "#8b5cf6", "#ff6600", "#06b6d4",
           "#10b981", "#ff0080", "#f59e0b", "#3b82f6", "#ec4899"]

SENSITIVITY_TARGET = {"low": 8, "medium": 15, "high": 25}


def _mean(vals):
    return sum(vals) / len(vals) if vals else 0.0


def _clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))


def derive_samples(feats, sensitivity="medium"):
    """Turn real librosa features into sample segments.

    Boundaries come from the engine's own segments_suggested. Energy is the
    mean RMS dB in the segment, normalized on a fixed -60..0 dB scale.
    Pitch is the dominant chroma pitch class in the segment. Type is a
    derived heuristic from energy + spectral brightness, not a classifier
    — it says what the segment acts like, not what instrument it is.
    """
    dur = feats.get("duration_s", 0.0)
    bounds = list(feats.get("segments_suggested") or [0.0, dur])
    if bounds[0] != 0.0:
        bounds = [0.0] + bounds
    if bounds[-1] < dur:
        bounds.append(round(dur, 1))
    bounds = sorted(set(round(float(b), 2) for b in bounds))
    if len(bounds) < 2:
        bounds = [0.0, round(dur, 1)]

    dyn = feats.get("dynamics", {})
    rms = dyn.get("rms_db", [])
    win = dyn.get("window_s", 5)
    chroma = feats.get("harmony", {}).get("chroma_10s", [])
    spectral = feats.get("timbre", {}).get("spectral_5s", [])
    beats = feats.get("tempo", {}).get("beat_times_s", [])

    def seg_energy(a, b):
        i0, i1 = int(a // win), int(b // win)
        vals = rms[i0:max(i1, i0 + 1)] if rms else []
        return _clamp((_mean(vals) + 60.0) / 60.0) if vals else 0.5

    def seg_pitch(a, b):
        vecs = [c["chroma"] for c in chroma if a <= c["t_start"] < b]
        if not vecs:
            vecs = [c["chroma"] for c in chroma if c["t_start"] <= b]
        if not vecs:
            return None
        avg = [sum(v[i] for v in vecs) / len(vecs) for i in range(12)]
        return NOTE_NAMES[max(range(12), key=lambda i: avg[i])]

    def seg_centroid(a, b):
        vals = [s["centroid_hz"] for s in spectral if a <= s["t_start"] < b]
        return _mean(vals) if vals else 1200.0

    def seg_type(energy, centroid):
        if energy >= 0.65 and centroid < 800:
            return "bass"
        if energy >= 0.65:
            return "drums"
        if energy >= 0.35:
            return "melody"
        return "texture"

    segs = []
    for a, b in zip(bounds, bounds[1:]):
        if b - a < 0.2:
            continue
        energy = seg_energy(a, b)
        centroid = seg_centroid(a, b)
        segs.append({
            "start": round(a, 2), "end": round(b, 2),
            "type": seg_type(energy, centroid),
            "energy": round(energy, 3),
            "pitch": seg_pitch(a, b),
            "color": PALETTE[len(segs) % len(PALETTE)],
        })

    target = SENSITIVITY_TARGET.get(sensitivity, 15)
    # Too many: keep the highest-energy ones, in time order.
    if len(segs) > target:
        segs = sorted(sorted(segs, key=lambda s: -s["energy"])[:target],
                      key=lambda s: s["start"])
    # Too few: split the longest segments at the nearest beat time.
    guard = 0
    while len(segs) < target and guard < 64:
        guard += 1
        longest = max(range(len(segs)), key=lambda i: segs[i]["end"] - segs[i]["start"])
        seg = segs[longest]
        cands = [t for t in beats if seg["start"] + 0.5 < t < seg["end"] - 0.5]
        if not cands:
            break
        mid = min(cands, key=lambda t: abs(t - (seg["start"] + seg["end"]) / 2))
        left = dict(seg, end=round(mid, 2))
        right = dict(seg, start=round(mid, 2))
        for part in (left, right):
            part["energy"] = round(seg_energy(part["start"], part["end"]), 3)
            part["pitch"] = seg_pitch(part["start"], part["end"])
            part["type"] = seg_type(part["energy"], seg_centroid(part["start"], part["end"]))
        segs[longest:longest + 1] = [left, right]
        segs.sort(key=lambda s: s["start"])
    for i, s in enumerate(segs):
        s["color"] = PALETTE[i % len(PALETTE)]
    return segs


def best_key(feats):
    keys = feats.get("harmony", {}).get("key_30s", [])
    if not keys:
        return None
    return max(keys, key=lambda k: k.get("confidence", 0))


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *a):
        pass

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        if urlparse(self.path).path == "/status":
            librosa_ok = False
            try:
                subprocess.run([PY, "-c", "import librosa"], check=True,
                               capture_output=True, timeout=60)
                librosa_ok = True
            except Exception:
                pass
            self._json(200, {"app": "STAK-XTRACT", "version": VERSION,
                             "engine": "yolo-music-utility", "librosa": librosa_ok,
                             "venv": PY})
        else:
            self._json(404, {"error": "unknown route"})

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/analyze":
            self._analyze()
        elif path == "/create":
            self._create()
        else:
            self._json(404, {"error": "unknown route"})

    def _analyze(self):
        form = cgi.FieldStorage(fp=self.rfile, headers=self.headers,
                                environ={"REQUEST_METHOD": "POST",
                                         "CONTENT_TYPE": self.headers.get("Content-Type", "")})
        if "audio" not in form or not getattr(form["audio"], "filename", None):
            self._json(400, {"error": "no audio file in field 'audio'"})
            return
        sensitivity = form.getvalue("sensitivity", "medium")
        analysis_type = form.getvalue("analysis_type", "sample_extraction")
        do_transcribe = form.getvalue("transcribe", "") in ("1", "true", "yes")
        tmp = tempfile.mkdtemp(prefix="stak-")
        try:
            src = os.path.join(tmp, form["audio"].filename or "upload")
            with open(src, "wb") as fh:
                fh.write(form["audio"].file.read())
            wav = src
            if not src.lower().endswith(".wav"):
                wav = os.path.join(tmp, "audio.wav")
                subprocess.run(["ffmpeg", "-v", "quiet", "-y", "-i", src,
                                "-ar", "22050", "-ac", "1", wav], check=True)
            feat_path = os.path.join(tmp, "features.json")
            subprocess.run([PY, os.path.join(HERE, "analyze", "extract_features.py"),
                            wav, feat_path], check=True)
            with open(feat_path) as fh:
                feats = json.load(fh)
            out = {"engine": "yolo-music-utility", "version": VERSION,
                   "analysis_type": analysis_type,
                   "bpm": feats.get("tempo", {}).get("global_bpm"),
                   "key": best_key(feats),
                   "duration_s": feats.get("duration_s"),
                   "samples": derive_samples(feats, sensitivity),
                   "features": feats}
            if do_transcribe:
                tr_path = os.path.join(tmp, "transcript.json")
                subprocess.run([PY, os.path.join(HERE, "analyze", "transcribe.py"),
                                wav, tr_path, "tiny"], check=True)
                with open(tr_path) as fh:
                    out["transcript"] = json.load(fh)
            self._json(200, out)
        except subprocess.CalledProcessError as e:
            self._json(500, {"error": "engine failed", "detail": str(e)})
        except Exception as e:
            self._json(500, {"error": str(e)})
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def _create(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            req = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            self._json(400, {"error": "bad JSON"})
            return
        like = str(req.get("like", "artificial_instruments"))
        bpm = str(req.get("bpm", 128))
        key = str(req.get("key", "A min"))
        mood = str(req.get("mood", "dark"))
        total = str(req.get("length", "4:00"))
        seed = str(req.get("seed", "42"))
        tmp = tempfile.mkdtemp(prefix="stak-create-")
        try:
            outdir = os.path.join(tmp, "midi")
            subprocess.run([PY, os.path.join(HERE, "create", "cli.py"), "create",
                            "--like", like, "--bpm", bpm, "--key", key,
                            "--mood", mood, "--length", total,
                            "--seed", seed, "--out", outdir],
                           check=True, capture_output=True, text=True)
            zpath = os.path.join(tmp, "midi.zip")
            with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as zf:
                for name in os.listdir(outdir):
                    zf.write(os.path.join(outdir, name), name)
            with open(zpath, "rb") as fh:
                data = fh.read()
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition",
                             'attachment; filename="stak-xtract-midi.zip"')
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except subprocess.CalledProcessError as e:
            self._json(500, {"error": "create failed",
                             "detail": (e.stderr or str(e))[-500:]})
        except Exception as e:
            self._json(500, {"error": str(e)})
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


def main():
    port = int(os.environ.get("STAK_PORT", "8777"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"STAK-XTRACT engine bridge v{VERSION} on http://127.0.0.1:{port}")
    print(f"venv python: {PY}")
    print("audio is processed locally. nothing is uploaded anywhere.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
