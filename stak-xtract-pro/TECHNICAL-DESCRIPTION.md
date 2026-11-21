# STAK-XTRACT 1.0.0 — Technical Description

**STAK-XTRACT by YOLO SNIPES. A music utility in two halves: XTRACT takes audio apart and tells you what is really in it, CREATE builds new MIDI from what it learned. Version 1.0.0, released 2026-11-20. MIT license, © 2026 Jacob L. Farmer.**

This is the official release. The Poe preview before it asked a language model to invent samples, BPM, key and genre from a file's duration alone. This version does none of that. Every number comes from the audio itself, run through librosa on your own machine. When the engine does not know something, it says so — low confidence, weak estimate — instead of inventing a confident answer.

## What it is for

You give it an audio file. It tells you the tempo, the key, where the sections change, how loud each part is, what each part acts like, and hands you the usable slices as real audio. Then, if you want, it builds you a MIDI starter — chords, bass, drums, melody, and an arrangement sketch — in the shape of one of your own tracks.

It is a utility, not a black box. The analysis is the same feature extraction that produced the 25-track analysis set behind INTERNALISM and COSMONAUT. The creation side is built from templates learned from those same tracks. Nothing leaves the machine. There is no account, no upload, no cloud.

## The shape of it

One single-file app, `STAK-XTRACT.html`, that runs in any browser. Behind it, a small local engine bridge, `engine/server.py`, standard library only, listening on `http://127.0.0.1:8777`. You start both with one command:

```
./launch.sh
```

The ENGINE pill in the app header turns green when the bridge is online. Without the bridge the app still shows waveforms and lets you work by hand. It will not invent analysis to fill the gap.

Engine only, no browser:

```
python3 engine/server.py
# status: curl http://127.0.0.1:8777/status
```

The whole package is 420 KB. It stays that small because the Python environment it needs is referenced, not copied — the bridge uses the venv at `~/workspace/music-utility/venv` by default, or wherever `STAK_VENV` points. The venv itself was 6.2 GB. The package is kilobytes because it borrows that environment instead of carrying it.

## XTRACT — the analysis

The analysis pipeline is `engine/analyze/extract_features.py`. It loads audio at 22,050 Hz, mono, and measures five things. Every number is written to a JSON file. No interpretation happens at this stage — the file is measurements only.

**Dynamics.** RMS loudness in 5-second windows, peak level per window, overall RMS, and dynamic range in dB. A track that sits at -10 dB and a track that sits at -19 dB are different facts, and the engine records them as facts.

**Tempo.** A global BPM from beat tracking, a per-minute BPM map for the whole track, and the beat times themselves (every fourth beat, to keep the file small). Long tracks drift. The map shows where.

**Harmony.** Chroma — the 12 pitch classes — measured every 10 seconds, and a key estimate every 30 seconds using Krumhansl correlation against the standard major and minor profiles, with a confidence number attached. A key at 0.93 confidence and a key at 0.64 are not the same claim, and the engine does not pretend they are.

**Timbre.** Spectral centroid, bandwidth, rolloff and zero-crossing rate every 5 seconds, plus 13 MFCC coefficients every 10 seconds. Centroid is brightness in Hz. A bright thin section and a dark heavy section have different centroids, and the numbers show it.

**Segmentation.** Section boundaries from agglomerative clustering on MFCC self-similarity — the engine finds where the sound itself changes character, rather than cutting on a fixed grid.

One fix shipped in this release: audio shorter than 5 seconds used to crash the dynamics step (a zero-size RMS window). Short files now analyze as a single window. The fix lives in this package only. The original utility is untouched.

**Transcription.** `engine/analyze/transcribe.py` runs faster-whisper (tiny model) with a VAD hallucination guard. An instrumental track is reported as instrumental. It never invents lyrics. This is the same guard that caught Whisper hallucinating 97 segments of lyrics for LYRICAL DOOM, a track with no vocals at all.

### How samples are derived — the honest version

The app turns the raw features into sample segments in `server.py`. The rules are explicit and checkable:

- Boundaries come from the engine's own `segments_suggested`, not from a timer.
- Energy is the mean RMS dB inside the segment, normalized on a fixed -60 to 0 dB scale.
- Pitch is the dominant chroma pitch class inside the segment.
- Type is a **derived heuristic** from energy plus spectral brightness — bass, drums, melody, or texture. It says what a segment *acts like*, not what instrument it is. High energy and low centroid reads as bass. High energy and high centroid reads as drums. Mid energy reads as melody. Low energy reads as texture.
- Sensitivity picks how many segments you get: low keeps 8, medium 15, high 25. Too many, and it keeps the highest-energy ones in time order. Too few, and it splits the longest segments at the nearest beat time.
- Key is the highest-confidence 30-second key estimate. Short files give weak estimates, and the engine says so by reporting low confidence. The app shows it.

### Arrangement — the energy arc

Arrangement orders the samples by the real energy arc of the source: build, peak, release. The preview asked a language model to order sample indices. This version reads the RMS curve and puts the loudest material where the track actually peaks.

### Export — real audio

Export writes real `.wav` slices of every sample, plus `samples.json` and `arrangement.json`. The preview wrote JSON metadata only — a list of samples with no sound in it. This version hands you the sound.

## CREATE — the generation

The create side is `engine/create/` — `cli.py`, `midi_gen.py`, `templates.py` — plus the learned data in `engine/style_profiles/`. You pick a template, a BPM, a key, a mood, a length and a seed. It gives you four standard MIDI files and an arrangement sketch:

- `chords.mid` — chord progression, 2 bars per chord, chord qualities maj, min, dim, sus4, maj7, min7, dom7, add9
- `bass.mid` — bassline in one of four styles: roots, eighths, offbeat, sub
- `drums.mid` — General MIDI drums on channel 9, one of five patterns: four-on-floor, halftime, trap, drum and bass, minimal
- `melody.mid` — a generative melody, a random walk across the scale, density set by the mood
- `arrangement.txt` — a timed sketch of what goes where, for a DAW session

Everything is deterministic given a seed. Run it twice with the same seed and you get the same files. The seed is printed so you can regenerate a result exactly.

### The templates — learned from your own tracks

There are 15 arrangement templates. Fourteen are per-track, one for each INTERNALISM track including ANGER MANAGEMENT, and one covers the album as a whole. A template is not a genre preset. It is the measured shape of one of your tracks: sections as fractions of total duration, each with energy, density, brightness, a role, and notes taken from the actual analysis.

GEOMETRY OF BELIEF is the clearest example. Six sections. The description reads: "One collection, three corners, loudest last: hold the Db-major collection for the whole track and drift the tonic Db to F minor to Ab major, put the loudest stretch early as the first corner, spend the middle in a long bright valley, then punch the deepest hole in the track five seconds before the loudest sustained passage and stop at full volume with no coda. The climax is the last thing that happens." The notes carry the real numbers behind that shape: the deepest dip at -19.8 dB at 11:40, the loudest sustained passage 11:45 to 12:23 at -9.3 to -10.9 dB, the hard stop at 12:23.0 at -9.3 dB — a stomp, not a fade, no coda, no comedown.

When you create `--like geometry_of_belief`, you are not getting a generic dubstep template. You are getting that arc, stretched or compressed to the length you ask for, with your chord progression and your key laid across it.

### Moods

Eight moods set the defaults for a generation — mode, drum pattern, bass style, and melody density:

| Mood | Mode | Drums | Bass | Density |
|---|---|---|---|---|
| dark | minor | halftime | sub | 0.4 |
| driving | minor | four-on-floor | eighths | 0.7 |
| heavy | minor | four-on-floor | roots | 0.6 |
| glitchy | minor | minimal | offbeat | 0.5 |
| rolling | minor | drum and bass | eighths | 0.7 |
| trappy | minor | trap | sub | 0.55 |
| open | major | minimal | roots | 0.4 |
| euphoric | major | four-on-floor | offbeat | 0.75 |

A template's own learned profile can override the mood defaults — its chord progression, its drum pattern, its bass style — when the analysis supports it. Descriptive notes in a profile that are not real pattern names are ignored, so every template yields audible parts instead of silently empty ones.

### The chord system

Chord progressions come from the learned profile when one exists, written in degree tokens — `{root}`, `{iv}`, `{v}`, `{rel_maj}`, `{root+2}`, `{root-2}` — resolved against the key you ask for. A fix from 2026-11-06 matters here: the album profiles use lowercase degrees and root offsets, and the old resolver crashed on them, so 7 of the 14 track templates failed to generate at all. That is fixed. All 14 generate now. Flat spellings are accepted too, so a track's own key of Db does not crash the creator.

## The bridge — three endpoints, local only

`GET /status` returns the app name, version, engine name, whether librosa loads, and which Python it is using.

`POST /analyze` takes a multipart audio file, plus sensitivity, analysis type, and an optional transcribe flag. Non-WAV audio is converted with ffmpeg to 22,050 Hz mono first. It returns BPM, key with confidence, duration, the derived samples, and the full feature JSON. With transcription on, it adds the transcript.

`POST /create` takes JSON — template, BPM, key, mood, length, seed — and returns a zip of the four MIDI files.

Audio is processed locally. Nothing is uploaded anywhere. Telemetry is disabled at the process level. The server binds to 127.0.0.1 only — your machine, not the network.

## What it does not do

- It does not classify instruments. Sample type is a heuristic from energy and brightness, and it says so.
- It does not know a key for certain. It reports a correlation confidence, and low confidence means a weak estimate.
- It does not transcribe lyrics it cannot hear. The guard reports instrumental tracks as instrumental.
- It does not invent analysis when the engine is offline. The app works by hand in that state and says the engine is down.
- It does not upload, phone home, or keep your audio. Temp files are deleted after each request.
- It does not replace a DAW. It gives you starters — chords, bass, drums, melody, and a sketch of where they go. The finishing is yours.

## Requirements

Python with librosa 1.0.0, numpy, faster-whisper, and mido. ffmpeg for converting non-WAV input. The bridge references the venv at `~/workspace/music-utility/venv` by default; set `STAK_VENV` to point it elsewhere. The demo loop built into the app is synthesized offline, so the app works with no network at all.

Note: the venv that the bridge points at was removed in the November 20 storage cleanup. The app opens and the status check works, but real analysis reads librosa as false until that environment is rebuilt. The code itself is unaffected.

## Verification

Tested on release, 2026-11-20. Dian impact stem: 161.5 BPM, F minor at 0.36 confidence. A 30-second clip: 123.0 BPM, E minor at 0.85 confidence. The create endpoint returned a valid MIDI zip. All 14 track templates generate.

## Version history

- **1.0.0 (2026-11-20)** — Official release. Real engine bridge, real WAV export, real energy-arc arrangement, CREATE_MIDI, offline demo, honest docs. Built from the Poe preview plus the YOLO music utility.
- **Preview (Poe)** — Mock analysis via language-model prompt, JSON-only export, no create side.

## File layout

```
STAK-XTRACT-official/
├── STAK-XTRACT.html      # the app (single file, works anywhere)
├── launch.sh             # start engine + open app
├── README.md             # short version of this document
├── VERSION               # 1.0.0
├── LICENSE               # MIT, © 2026 Jacob L. Farmer
├── build_html.py         # rebuilds STAK-XTRACT.html from the Poe preview
└── engine/
    ├── server.py         # bridge (stdlib only)
    ├── requirements.txt  # librosa, numpy, faster-whisper, mido
    ├── yolo              # CLI shim (yolo analyze / create / templates / profile)
    ├── analyze/          # extract_features.py, transcribe.py, pipeline.sh
    ├── create/           # cli.py, midi_gen.py, templates.py
    └── style_profiles/   # learned profiles + templates (JSON)
```

© 2026 Jacob L. Farmer. All rights reserved.
