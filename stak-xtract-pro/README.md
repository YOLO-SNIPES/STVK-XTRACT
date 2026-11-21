# STAK-XTRACT 1.0.0 Official

**AI-powered sample extraction and MIDI creation — by YOLO SNIPES.**

This is the official release. It takes the Poe preview and replaces everything
that was a mock with the real thing: the YOLO music utility engine
(librosa feature extraction, honest numbers, no invented samples) runs
locally behind the app, export writes real audio, and the CREATE side
generates real MIDI from your analyzed tracks.

## What changed from the preview

| Preview | Official 1.0.0 |
|---|---|
| Analysis asked an LLM to invent samples, BPM, key and genre from duration alone | Analysis runs **librosa** on your actual audio: real BPM, real key (with confidence), real beat times, real segment boundaries, real RMS energy, real chroma pitch |
| Arrangement asked an LLM to order sample indices | Arrangement orders by the **real energy arc** — build, peak, release |
| Export wrote JSON metadata only | Export writes **real .wav slices** of every sample, plus samples.json and arrangement.json |
| Sample pack loaded from a Poe CDN URL | Built-in demo loop is **synthesized offline** — the app works with no network |
| Docs claimed "Claude AI" analysis | Docs describe the real local engine |
| No create side | **CREATE_MIDI** generates chords, bass, drums, melody + arrangement sketch from any of your 14 learned templates |

## How to run

```bash
./launch.sh
```

That starts the engine bridge on `http://127.0.0.1:8777` and opens
`STAK-XTRACT.html` in your browser. The ENGINE pill in the header turns
green when the bridge is online. Without the bridge, the app still shows
waveforms and lets you work manually — it will not invent analysis.

Engine only (no browser):

```bash
python3 engine/server.py
# status: curl http://127.0.0.1:8777/status
```

## The engine

`engine/` is the YOLO music utility, repackaged — not a copy of the whole
7.1 GB workspace, just the code and the learned data:

- `engine/server.py` — the bridge. Stdlib only, no new dependencies.
  `GET /status`, `POST /analyze` (multipart audio), `POST /create` (JSON).
  Audio is processed locally. Nothing is uploaded anywhere.
- `engine/analyze/extract_features.py` — librosa: dynamics (5s RMS),
  tempo (global + per-minute BPM, beat times), chroma (10s), key per 30s
  (Krumhansl, with confidence), spectral centroid/bandwidth/rolloff/ZCR,
  MFCCs, suggested section boundaries. Honest numbers only.
- `engine/analyze/transcribe.py` — faster-whisper with the VAD
  hallucination guard. Instrumental tracks are reported as instrumental.
  Never invents lyrics.
- `engine/create/` — `yolo create`: MIDI starters from learned templates.
- `engine/style_profiles/` — the learned per-track profiles and templates
  (INTERNALISM, COSMONAUT, and the rest). These are what `yolo create
  --like <track>` builds from.
- `engine/yolo` — the CLI shim (`yolo analyze`, `yolo create`,
  `yolo templates`, `yolo profile`).

The bridge uses the Python venv at `~/workspace/music-utility/venv` by
default (set `STAK_VENV` to point elsewhere). The venv itself is
referenced, not copied — that is why this package is kilobytes, not
gigabytes.

One fix shipped in this repackage: `extract_features.py` crashed on
audio shorter than 5 seconds (zero-size RMS window). Short files now
analyze as a single window. The fix lives in this package only; the
original utility is untouched.

## How samples are derived (honest version)

Boundaries come from the engine's own `segments_suggested`. Energy is the
mean RMS dB in the segment, normalized on a fixed -60..0 dB scale. Pitch
is the dominant chroma pitch class in the segment. Type is a **derived
heuristic** from energy + spectral brightness (bass / drums / melody /
texture) — it says what a segment acts like, not what instrument it is.
Sensitivity (low 8 / medium 15 / high 25) keeps the highest-energy
segments, or splits the longest ones at beat times. Key is the
highest-confidence 30s key estimate. Short files give weak estimates —
the engine says so by reporting low confidence, and the app shows it.

## Layout

```
STAK-XTRACT-official/
├── STAK-XTRACT.html      # the app (single file, works anywhere)
├── launch.sh             # start engine + open app
├── README.md             # this file
├── VERSION               # 1.0.0
├── LICENSE               # MIT, © 2026 Jacob L. Farmer
├── build_html.py         # rebuilds STAK-XTRACT.html from the Poe preview
└── engine/
    ├── server.py         # bridge (stdlib only)
    ├── requirements.txt  # librosa, numpy, faster-whisper, mido
    ├── yolo              # CLI shim
    ├── analyze/          # extract_features.py, transcribe.py, pipeline.sh
    ├── create/           # cli.py, midi_gen.py, templates.py
    └── style_profiles/   # learned profiles + templates (JSON)
```

## Version history

- **1.0.0 (2026-11-20)** — Official release. Real engine bridge, real
  WAV export, real energy-arc arrangement, CREATE_MIDI, offline demo,
  honest docs. Built from the Poe preview + the YOLO music utility.
- Preview (Poe) — mock analysis via LLM prompt, JSON-only export.

## Credits

STAK-XTRACT by YOLO SNIPES. Engine: the YOLO music utility.
© 2026 Jacob L. Farmer. All rights reserved.
