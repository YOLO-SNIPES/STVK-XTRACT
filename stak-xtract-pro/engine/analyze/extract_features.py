#!/home/hatch/workspace/music-utility/venv/bin/python
"""Feature extraction for the YOLO SNIPES music utility.
Usage: extract_features.py <audio_file> <output_json>
Produces a JSON with dynamics, tempo map, harmony, timbre, and
segmentation features. Honest numbers only — no interpretation here.
"""
import sys, json, warnings
import numpy as np
import librosa

warnings.filterwarnings("ignore")

def db(x):
    return 20 * np.log10(np.asarray(x) + 1e-9)

def main():
    src, out = sys.argv[1], sys.argv[2]
    y, sr = librosa.load(src, sr=22050, mono=True)
    dur = len(y) / sr
    feats = {"file": src, "duration_s": round(dur, 2), "sr": sr}

    # ---- dynamics: RMS per 5s window ----
    w = 5 * sr
    n = len(y) // w
    if n == 0:
        # Short file (< 5s): treat the whole signal as one window.
        n = 1
        w = len(y)
    rms = np.sqrt((y[:n*w].reshape(n, w) ** 2).mean(axis=1))
    rms_db = db(rms)
    peak = np.abs(y[:n*w].reshape(n, w)).max(axis=1)
    feats["dynamics"] = {
        "window_s": 5,
        "rms_db": [round(float(v), 1) for v in rms_db],
        "peak_db": [round(float(v), 1) for v in db(peak)],
        "overall_rms_db": round(float(db(np.sqrt((y**2).mean()))), 1),
        "dynamic_range_db": round(float(rms_db.max() - rms_db.min()), 1),
    }

    # ---- tempo: global + per-minute map ----
    tempo_global, beats = librosa.beat.beat_track(y=y, sr=sr)
    tempo_global = float(tempo_global) if np.ndim(tempo_global) == 0 else float(np.atleast_1d(tempo_global)[0])
    tempo_map = []
    win = 60 * sr
    for start in range(0, len(y), win):
        seg = y[start:start+win]
        if len(seg) < 10 * sr:
            break
        t, _ = librosa.beat.beat_track(y=seg, sr=sr)
        t = float(t) if np.ndim(t) == 0 else float(np.atleast_1d(t)[0])
        tempo_map.append({"t_start": round(start/sr, 1), "bpm": round(t, 1)})
    feats["tempo"] = {"global_bpm": round(tempo_global, 1), "per_minute": tempo_map,
                      "n_beats": int(len(beats))}
    # beat times, downsampled to every 4th for size
    beat_times = librosa.frames_to_time(beats, sr=sr)
    feats["tempo"]["beat_times_s"] = [round(float(t), 2) for t in beat_times[::4]]

    # ---- harmony: chroma per 10s, key per 30s (Krumhansl) ----
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=4096)
    times_c = librosa.frames_to_time(np.arange(chroma.shape[1]), sr=sr, hop_length=4096)
    cw = []  # 10s windows
    t = 0.0
    while t < dur:
        m = (times_c >= t) & (times_c < t + 10)
        if m.sum() > 0:
            cw.append({"t_start": round(t, 1),
                       "chroma": [round(float(v), 3) for v in chroma[:, m].mean(axis=1)]})
        t += 10
    feats["harmony"] = {"chroma_10s": cw}

    major_prof = np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88])
    minor_prof = np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])
    names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    def key_of(ch):
        best, bk = -2, None
        for i in range(12):
            for prof, mode in ((major_prof,'maj'),(minor_prof,'min')):
                r = np.roll(prof, i)
                c = (ch - ch.mean()) * (r - r.mean())
                corr = c.sum() / (np.sqrt(((ch-ch.mean())**2).sum() * ((r-r.mean())**2).sum()) + 1e-9)
                if corr > best:
                    best, bk = corr, f"{names[i]} {mode}"
        return bk, round(float(best), 3)
    keys = []
    t = 0.0
    while t < dur:
        m = (times_c >= t) & (times_c < t + 30)
        if m.sum() > 0:
            k, conf = key_of(chroma[:, m].mean(axis=1))
            keys.append({"t_start": round(t, 1), "key": k, "confidence": conf})
        t += 30
    feats["harmony"]["key_30s"] = keys

    # ---- timbre: centroid, bandwidth, rolloff, zcr per 5s; MFCC per 10s ----
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=2048))
    fr = librosa.frames_to_time(np.arange(S.shape[1]), sr=sr, hop_length=2048)
    cent = librosa.feature.spectral_centroid(S=S, sr=sr)[0]
    bw = librosa.feature.spectral_bandwidth(S=S, sr=sr)[0]
    roll = librosa.feature.spectral_rolloff(S=S, sr=sr)[0]
    zcr = librosa.feature.zero_crossing_rate(y, hop_length=2048)[0]
    fr_z = librosa.frames_to_time(np.arange(len(zcr)), sr=sr, hop_length=2048)
    tim = []
    t = 0.0
    while t < dur:
        m = (fr >= t) & (fr < t + 5)
        mz = (fr_z >= t) & (fr_z < t + 5)
        if m.sum() > 0:
            tim.append({"t_start": round(t, 1),
                        "centroid_hz": round(float(cent[m].mean()), 0),
                        "bandwidth_hz": round(float(bw[m].mean()), 0),
                        "rolloff_hz": round(float(roll[m].mean()), 0),
                        "zcr": round(float(zcr[mz].mean()), 4) if mz.sum() else 0.0})
        t += 5
    feats["timbre"] = {"spectral_5s": tim}
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13, hop_length=4096)
    tm = librosa.frames_to_time(np.arange(mfcc.shape[1]), sr=sr, hop_length=4096)
    mfw = []
    t = 0.0
    while t < dur:
        m = (tm >= t) & (tm < t + 10)
        if m.sum() > 0:
            mfw.append({"t_start": round(t, 1),
                        "mfcc_mean": [round(float(v), 2) for v in mfcc[:, m].mean(axis=1)]})
        t += 10
    feats["timbre"]["mfcc_10s"] = mfw

    # ---- segmentation: novelty on MFCC self-similarity ----
    try:
        bound = librosa.segment.agglomerative(mfcc, k=min(12, max(4, int(dur // 90))))
        btimes = sorted(set([0.0] + [round(float(tm[b]), 1) for b in bound if tm[b] < dur] + [round(dur, 1)]))
        feats["segments_suggested"] = btimes
    except Exception as e:
        feats["segments_suggested"] = [0.0, round(dur, 1)]
        feats["segment_error"] = str(e)

    with open(out, "w") as f:
        json.dump(feats, f)
    print(f"wrote {out} ({dur:.0f}s analyzed)")

if __name__ == "__main__":
    main()
