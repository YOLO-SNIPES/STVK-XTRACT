#!/usr/bin/env python3
"""MIDI generation primitives for the YOLO SNIPES music utility.
Chords, basslines, melodies, drum patterns -> standard .mid files.
All functions are deterministic given a seed (no seed = random).
"""
import random
import mido

NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
MAJOR = [0,2,4,5,7,9,11]
MINOR = [0,2,3,5,7,8,10]

# General MIDI drums
KICK=36; SNARE=38; CLAP=39; CHAT=42; OHAT=46; PHAT=44; RIM=37; SHAKER=70

def note_to_midi(name):
    """'C4' -> 60. Sharps with #."""
    n = name[:-1]; octv = int(name[-1])
    return NOTE_NAMES.index(n) + (octv + 1) * 12

def midi_to_note(m):
    return f"{NOTE_NAMES[m % 12]}{(m // 12) - 1}"

def scale_notes(root, mode, octv=3, span=2):
    iv = MAJOR if mode == 'maj' else MINOR
    r = NOTE_NAMES.index(root)
    out = []
    for o in range(span):
        for i in iv:
            out.append(r + i + (octv + 1 + o) * 12)
    return out

def chord_midi(root, quality, octv=3):
    """quality: 'maj','min','dim','sus4','maj7','min7','dom7','add9'"""
    r = NOTE_NAMES.index(root) + (octv + 1) * 12
    Q = {'maj':[0,4,7],'min':[0,3,7],'dim':[0,3,6],'sus4':[0,5,7],
         'maj7':[0,4,7,11],'min7':[0,3,7,10],'dom7':[0,4,7,10],
         'add9':[0,4,7,14],'min_add9':[0,3,7,14]}
    return [r + i for i in Q[quality]]

def _track_with_tempo(bpm):
    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(bpm), time=0))
    return mid, tr

def _note_events(tr, notes, start_tick, dur_tick, vel=90, channel=0):
    for n in notes:
        tr.append(mido.Message('note_on', note=n, velocity=vel, time=start_tick, channel=channel))
        start_tick = 0
    for n in notes:
        tr.append(mido.Message('note_off', note=n, velocity=0, time=dur_tick, channel=channel))
        dur_tick = 0
    return dur_tick

def _render(mid, events):
    """events: list of (abs_tick, mido.Message). Sorted render."""
    tr = mid.tracks[0]
    events.sort(key=lambda e: e[0])
    last = 0
    for tick, msg in events:
        msg.time = tick - last
        last = tick
        tr.append(msg)
    return mid

# ---------------- parts ----------------

def chords(progression, bpm, bars_per_chord=2, octv=3, vel=80, humanize=0.0, seed=None):
    """progression: list of (root, quality), e.g. [('A','min'),('F','maj')].
    Returns MidiFile."""
    rng = random.Random(seed)
    mid, _ = _track_with_tempo(bpm)
    tpb = mid.ticks_per_beat
    bar = 4 * tpb
    ev = []
    tick = 0
    for root, qual in progression:
        notes = chord_midi(root, qual, octv)
        d = bars_per_chord * bar
        for n in notes:
            h = int(rng.uniform(-humanize, humanize) * tpb) if humanize else 0
            ev.append((tick + h, mido.Message('note_on', note=n, velocity=vel, channel=0)))
            ev.append((tick + d + h, mido.Message('note_off', note=n, velocity=0, channel=0)))
        tick += d
    return _render(mid, ev)

def bassline(progression, bpm, style='roots', octv=1, vel=100, seed=None):
    """style: 'roots' (whole-note roots), 'eighths', 'offbeat', 'sub' (long subs)."""
    rng = random.Random(seed)
    mid, _ = _track_with_tempo(bpm)
    tpb = mid.ticks_per_beat
    bar = 4 * tpb
    ev = []
    tick = 0
    for root, qual in progression:
        r = NOTE_NAMES.index(root) + (octv + 1) * 12
        if style == 'roots':
            ev += [(tick, mido.Message('note_on', note=r, velocity=vel, channel=1)),
                   (tick + 2*bar, mido.Message('note_off', note=r, velocity=0, channel=1))]
        elif style == 'sub':
            ev += [(tick, mido.Message('note_on', note=r-12, velocity=vel, channel=1)),
                   (tick + 2*bar, mido.Message('note_off', note=r-12, velocity=0, channel=1))]
        elif style == 'eighths':
            for i in range(16):
                nn = r + (12 if (i % 8 == 6) else 0)
                ev += [(tick+i*tpb//2, mido.Message('note_on', note=nn, velocity=vel if i%4==0 else vel-15, channel=1)),
                       (tick+i*tpb//2+tpb//2, mido.Message('note_off', note=nn, velocity=0, channel=1))]
        elif style == 'offbeat':
            for i in [1,3,5,7,9,11,13,15]:
                ev += [(tick+i*tpb//2, mido.Message('note_on', note=r, velocity=vel-10, channel=1)),
                       (tick+i*tpb//2+tpb//3, mido.Message('note_off', note=r, velocity=0, channel=1))]
        tick += 2 * bar
    return _render(mid, ev)

def drums(pattern, bpm, bars=8, vel=100, seed=None):
    """pattern: 'four' (four-on-floor), 'halftime', 'trap', 'dnb', 'minimal'.
    Returns MidiFile on channel 9."""
    rng = random.Random(seed)
    mid, _ = _track_with_tempo(bpm)
    tpb = mid.ticks_per_beat
    bar = 4 * tpb
    ev = []
    def hit(tick, drum, v=vel):
        ev.append((tick, mido.Message('note_on', note=drum, velocity=v, channel=9)))
        ev.append((tick + tpb//8, mido.Message('note_off', note=drum, velocity=0, channel=9)))
    for b in range(bars):
        t0 = b * bar
        if pattern == 'four':
            for i in range(4): hit(t0+i*tpb, KICK)
            for i in range(4): hit(t0+i*tpb+tpb//2, CHAT, vel-25)
            hit(t0+tpb, CLAP); hit(t0+3*tpb, CLAP)
        elif pattern == 'halftime':
            hit(t0, KICK); hit(t0+2*tpb, SNARE)
            for i in range(8): hit(t0+i*tpb//2, CHAT, vel-30)
        elif pattern == 'trap':
            hit(t0, KICK); hit(t0+int(1.5*tpb), KICK); hit(t0+2*tpb, SNARE)
            for i in range(16):
                v = vel-20 if i%2 else vel-35
                if rng.random() < 0.12:  # occasional roll
                    for k in range(3):
                        hit(t0+i*tpb//4+k*tpb//16, CHAT, v)
                else:
                    hit(t0+i*tpb//4, CHAT, v)
        elif pattern == 'dnb':
            hit(t0, KICK); hit(t0+int(2.5*tpb), KICK); hit(t0+tpb, SNARE); hit(t0+3*tpb, SNARE)
            for i in range(8): hit(t0+i*tpb//2, CHAT, vel-30)
        elif pattern == 'minimal':
            for i in range(4): hit(t0+i*tpb, KICK, vel-10)
            hit(t0+2*tpb, RIM, vel-20)
            for i in range(0,16,2): hit(t0+i*tpb//4, SHAKER, vel-40)
    return _render(mid, ev)

def melody(root, mode, bpm, bars=8, octv=4, density=0.6, vel=85, seed=None):
    """Generative melody from a scale. density 0..1 = note probability per 8th."""
    rng = random.Random(seed)
    mid, _ = _track_with_tempo(bpm)
    tpb = mid.ticks_per_beat
    pool = scale_notes(root, mode, octv, span=2)
    ev = []
    tick = 0
    idx = len(pool)//2
    for _ in range(bars * 8):
        if rng.random() < density:
            idx = max(0, min(len(pool)-1, idx + rng.choice([-2,-1,-1,1,1,2])))
            n = pool[idx]
            d = (tpb//2) * rng.choice([1,1,2])
            ev += [(tick, mido.Message('note_on', note=n, velocity=vel, channel=2)),
                   (tick+d, mido.Message('note_off', note=n, velocity=0, channel=2))]
        tick += tpb//2
    return _render(mid, ev)

def save(mid, path):
    mid.save(path)
    return path
