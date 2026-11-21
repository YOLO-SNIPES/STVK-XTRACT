#!/usr/bin/env python3
"""Arrangement templates derived from analyzed tracks.
A template is sections as fractions of total duration, each with
energy/density/brightness descriptors. Apply to any target length.
Templates live in ../style_profiles/<name>_template.json — add more
as new tracks get analyzed.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
PROFILE_DIR = os.path.join(HERE, "..", "style_profiles")

def load_template(name):
    with open(os.path.join(PROFILE_DIR, name + "_template.json")) as f:
        return json.load(f)

def list_templates():
    return sorted(f[:-14] for f in os.listdir(PROFILE_DIR) if f.endswith("_template.json"))

def apply_template(tpl, total_s):
    """Return timed sections: [{name, t_start, t_end, energy, density, brightness, role, notes}]"""
    out = []
    for s in tpl["sections"]:
        out.append({
            "name": s["name"],
            "t_start": round(s["start_frac"] * total_s, 1),
            "t_end": round(s["end_frac"] * total_s, 1),
            "energy": s["energy"], "density": s["density"],
            "brightness": s["brightness"], "role": s["role"],
            "notes": s.get("notes", ""),
        })
    return out

def fmt_time(s):
    return f"{int(s//60)}:{int(s%60):02d}"

def arrangement_sketch(tpl, total_s, bpm, key, progression, drum_pattern):
    """Text sketch: what to place where, for a DAW session."""
    secs = apply_template(tpl, total_s)
    L = [f"ARRANGEMENT — '{tpl['name']}' ({fmt_time(total_s)}, {bpm} BPM, {key})",
         f"Source: {tpl.get('source_track','')} — {tpl.get('description','')}",
         f"Chords: {' -> '.join(f'{r}{q}' for r, q in progression)} | Drums: {drum_pattern}", ""]
    for s in secs:
        L.append(f"[{fmt_time(s['t_start'])}–{fmt_time(s['t_end'])}] {s['name']} — {s['role']}")
        L.append(f"    energy {s['energy']:.1f} | density {s['density']:.1f} | brightness {s['brightness']:.1f}")
        if s["notes"]:
            L.append(f"    -> {s['notes']}")
    return "\n".join(L)

def save_template(name, template):
    os.makedirs(PROFILE_DIR, exist_ok=True)
    with open(os.path.join(PROFILE_DIR, name + "_template.json"), "w") as f:
        json.dump(template, f, indent=1)
