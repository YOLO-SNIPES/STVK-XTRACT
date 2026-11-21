#!/home/hatch/workspace/music-utility/venv/bin/python
"""Vocal transcription via faster-whisper.
Usage: transcribe.py <audio_file> <output_json> [model]
If no speech is found, the JSON says so honestly — never invent lyrics.
Whisper can hallucinate on pure music; repetitive low-confidence output is
flagged as unreliable rather than presented as lyrics.
"""
import os, sys, json, warnings
warnings.filterwarnings("ignore")
# This environment's network blocks HuggingFace's xet download endpoint;
# force the classic download path so model fetch works here.
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")

def repetition_ratio(texts):
    if not texts:
        return 1.0
    return len(set(texts)) / len(texts)

def main():
    src, out = sys.argv[1], sys.argv[2]
    model_name = sys.argv[3] if len(sys.argv) > 3 else "base"
    from faster_whisper import WhisperModel
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    # Decode with librosa instead of letting faster-whisper use PyAV:
    # the installed av version is incompatible with this faster-whisper
    # release (metadata_errors kwarg). Whisper wants 16 kHz mono.
    import librosa
    audio, _ = librosa.load(src, sr=16000, mono=True)
    # VAD gate is ESSENTIAL: without it whisper hallucinates fluent lyrics
    # on instrumental music (observed: 178 segments of pseudo-poetic
    # confabulation about "co-creation" on a track with zero vocals).
    segments, info = model.transcribe(
        audio, beam_size=5, vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500))
    segs = [{"start": round(s.start, 1), "end": round(s.end, 1),
             "text": s.text.strip(), "avg_logprob": round(s.avg_logprob, 3),
             "no_speech_prob": round(float(getattr(s, "no_speech_prob", 0.0)), 3)}
            for s in segments if s.text.strip()]
    texts = [s["text"] for s in segs]
    full_text = " ".join(texts)
    # honesty guard: music-only tracks often yield repetitive hallucinated
    # phrases at low confidence. Flag rather than invent.
    rep = repetition_ratio(texts)
    avg_lp = (sum(s["avg_logprob"] for s in segs) / len(segs)) if segs else 0.0
    mean_nsp = (sum(s["no_speech_prob"] for s in segs) / len(segs)) if segs else 1.0
    # three independent hallucination signals; VAD no_speech_prob is strongest
    unreliable = bool(segs) and (rep < 0.35 or avg_lp < -0.8 or mean_nsp > 0.5)
    if not segs:
        note = "No speech detected — instrumental track. Do NOT invent lyrics."
    elif unreliable:
        note = ("Whisper output failed reliability checks "
                "(repetition %.2f, avg_logprob %.2f, mean_no_speech_prob %.2f) — likely music "
                "hallucination, not reliable vocals. Do NOT present as lyrics."
                % (rep, avg_lp, mean_nsp))
    else:
        note = "Verify against the audio; whisper can hallucinate on music."
    payload = {"file": src, "model": model_name,
               "language": info.language,
               "language_probability": round(info.language_probability, 3),
               "has_vocals": bool(segs) and not unreliable,
               "vocals_reliable": bool(segs) and not unreliable,
               "full_text": full_text,
               "segments": segs,
               "repetition_ratio": round(rep, 3),
               "avg_logprob": round(avg_lp, 3),
               "note": note}
    with open(out, "w") as f:
        json.dump(payload, f, indent=1)
    print(f"wrote {out} — has_vocals={payload['has_vocals']}"
          + (" (UNRELIABLE — flagged)" if unreliable else ""))

if __name__ == "__main__":
    main()
