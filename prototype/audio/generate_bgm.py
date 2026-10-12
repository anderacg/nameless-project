#!/usr/bin/env python3
"""
Elysian Horizon - Epic Open-World Orchestral BGM Generator
Composed for 'Ashmark' / Fantasy Adventure RPG

Generates:
  1. epic_openworld_bgm.mid  - Multi-track GM Standard MIDI file (Format 1)
  2. epic_openworld_bgm.wav  - Studio-quality 44.1kHz 16-bit Stereo WAV Master
"""

import math
import struct
import wave
import os
import numpy as np
import scipy.signal as sig

# ==============================================================================
# 1. MUSICAL SCORE DEFINITIONS & CONSTANTS
# ==============================================================================

BPM = 76.0
BEAT_DUR = 60.0 / BPM          # ~0.7895 seconds per quarter note
SAMPLE_RATE = 44100
BAR_BEATS = 4                  # 4/4 time
TOTAL_BARS = 48
TOTAL_BEATS = TOTAL_BARS * BAR_BEATS

def m2f(midi_note):
    """Convert MIDI note number to frequency in Hz."""
    return 440.0 * (2.0 ** ((midi_note - 69) / 12.0))

# Note name helper
N_C = 0; N_Cs = 1; N_D = 2; N_Ds = 3; N_E = 4; N_F = 5; N_Fs = 6; N_G = 7; N_Gs = 8; N_A = 9; N_As = 10; N_B = 11
def note(name_octave):
    """e.g. note('D4'), note('Bb3'), note('F#5')"""
    names = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
             'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
             'A#': 10, 'Bb': 10, 'B': 11}
    for k in sorted(names.keys(), key=lambda x: -len(x)):
        if name_octave.startswith(k):
            octave = int(name_octave[len(k):])
            return 12 * (octave + 1) + names[k]
    raise ValueError(f"Invalid note: {name_octave}")

# Note Event: (start_beat, duration_beat, midi_note, velocity)

# ------------------------------------------------------------------------------
# A. SOLO CELTIC FLUTE (Emotional, Yearning Melody)
# ------------------------------------------------------------------------------
flute_events = []

# Bars 5-8: Motif Exposition (Dawn Awakening)
flute_events += [
    (16.0, 1.0, note('F4'), 75),
    (17.0, 1.0, note('G4'), 80),
    (18.0, 2.5, note('A4'), 88),
    (20.5, 0.5, note('G4'), 78),
    (21.0, 1.0, note('F4'), 82),
    (22.0, 1.5, note('E4'), 80),
    (23.5, 0.5, note('C4'), 75),
    (24.0, 3.5, note('D4'), 85),
    (28.0, 1.0, note('F4'), 80),
    (29.0, 1.0, note('A4'), 85),
    (30.0, 2.0, note('C5'), 88),
]

# Bars 9-16: The Lonely Wanderer's Journey
flute_events += [
    (32.0, 2.5, note('D5'), 92),
    (34.5, 0.5, note('C5'), 85),
    (35.0, 1.0, note('A4'), 88),
    (36.0, 2.0, note('G4'), 84),
    (38.0, 1.5, note('F4'), 82),
    (39.5, 0.5, note('G4'), 80),
    (40.0, 2.0, note('A4'), 86),
    (42.0, 1.0, note('Bb4'), 85),
    (43.0, 1.0, note('C5'), 88),
    (44.0, 3.0, note('D5'), 92),
    (47.0, 1.0, note('E5'), 85),
    (48.0, 2.5, note('F5'), 94),
    (50.5, 0.5, note('E5'), 85),
    (51.0, 1.0, note('D5'), 88),
    (52.0, 2.0, note('C5'), 86),
    (54.0, 1.5, note('A4'), 84),
    (55.5, 0.5, note('C5'), 80),
    (56.0, 3.5, note('D5'), 90),
    (60.0, 1.5, note('C5'), 80),
    (61.5, 0.5, note('A4'), 78),
    (62.0, 2.0, note('G4'), 80),
]

# Bars 17-24: The Rising Peak (Anticipation / Modulating)
flute_events += [
    (64.0, 2.0, note('Bb4'), 88),
    (66.0, 1.0, note('C5'), 90),
    (67.0, 1.0, note('D5'), 92),
    (68.0, 2.5, note('F5'), 96),
    (70.5, 0.5, note('E5'), 88),
    (71.0, 1.0, note('D5'), 90),
    (72.0, 2.0, note('C5'), 92),
    (74.0, 1.0, note('D5'), 90),
    (75.0, 1.0, note('E5'), 94),
    (76.0, 3.0, note('F5'), 98),
    (79.0, 1.0, note('G5'), 96),
    (80.0, 2.5, note('A5'), 102),
    (82.5, 0.5, note('G5'), 95),
    (83.0, 1.0, note('F5'), 92),
    (84.0, 2.0, note('E5'), 96),
    (86.0, 1.0, note('D5'), 92),
    (87.0, 1.0, note('E5'), 96),
    (88.0, 4.0, note('A5'), 104),  # High sustain leading into Climax!
    (92.0, 3.5, note('A5'), 100),
]

# Bars 25-40: Orchestral Climax (Doubling & Soaring Melodic Lines)
flute_events += [
    (96.0, 2.5, note('F5'), 105),
    (98.5, 0.5, note('G5'), 100),
    (99.0, 1.0, note('A5'), 110),
    (100.0, 2.0, note('G5'), 105),
    (102.0, 1.0, note('F5'), 102),
    (103.0, 1.0, note('E5'), 100),
    (104.0, 2.5, note('D5'), 105),
    (106.5, 0.5, note('C5'), 98),
    (107.0, 1.0, note('D5'), 104),
    (108.0, 2.0, note('A5'), 112),
    (110.0, 1.0, note('G5'), 105),
    (111.0, 1.0, note('F5'), 102),
    (112.0, 2.5, note('Bb5'), 112),
    (114.5, 0.5, note('A5'), 108),
    (115.0, 1.0, note('G5'), 105),
    (116.0, 2.0, note('F5'), 102),
    (118.0, 1.0, note('G5'), 100),
    (119.0, 1.0, note('A5'), 108),
    (120.0, 3.5, note('E5'), 104),
    (124.0, 2.0, note('F5'), 102),
    (126.0, 1.0, note('G5'), 104),
    (127.0, 1.0, note('A5'), 108),

    # Bar 33: Second Wave of Climax
    (128.0, 1.0, note('D5'), 108),
    (129.0, 1.0, note('F5'), 110),
    (130.0, 1.0, note('A5'), 112),
    (131.0, 1.0, note('D6'), 118),  # Grand emotional pinnacle!
    (132.0, 2.0, note('C6'), 114),
    (134.0, 1.0, note('A5'), 108),
    (135.0, 1.0, note('G5'), 104),
    (136.0, 2.0, note('Bb5'), 112),
    (138.0, 1.0, note('A5'), 108),
    (139.0, 1.0, note('F5'), 104),
    (140.0, 2.5, note('G5'), 108),
    (142.5, 0.5, note('F5'), 100),
    (143.0, 1.0, note('E5'), 98),
    (144.0, 1.5, note('D5'), 104),
    (145.5, 0.5, note('F5'), 100),
    (146.0, 1.0, note('A5'), 108),
    (147.0, 1.0, note('G5'), 104),
    (148.0, 2.0, note('F5'), 106),
    (150.0, 2.0, note('E5'), 100),
    (152.0, 4.0, note('D5'), 108),
    (156.0, 3.0, note('D5'), 95),
]

# Bars 41-48: Sunset Resolution (Gentle Echo)
flute_events += [
    (168.0, 2.0, note('A4'), 75),
    (170.0, 1.0, note('G4'), 72),
    (171.0, 1.0, note('F4'), 70),
    (172.0, 2.5, note('E4'), 68),
    (174.5, 0.5, note('C4'), 65),
    (175.0, 1.0, note('E4'), 68),
    (176.0, 4.0, note('D4'), 74),
    (184.0, 3.5, note('D4'), 65),
]


# ------------------------------------------------------------------------------
# B. FRENCH HORN SECTION (Majestic, Noble Heroic Calls)
# ------------------------------------------------------------------------------
horn_events = []

# Bars 9-16: Distant Mountain Call
horn_events += [
    (32.0, 2.0, note('D3'), 72),
    (34.0, 2.0, note('F3'), 74),
    (36.0, 3.0, note('A3'), 78),
    (39.0, 1.0, note('G3'), 75),
    (40.0, 2.0, note('F3'), 76),
    (42.0, 2.0, note('E3'), 72),
    (44.0, 4.0, note('D3'), 80),
    (48.0, 2.0, note('Bb3'), 76),
    (50.0, 2.0, note('C4'), 78),
    (52.0, 3.0, note('D4'), 82),
    (55.0, 1.0, note('C4'), 78),
    (56.0, 2.0, note('A3'), 80),
    (58.0, 2.0, note('G3'), 76),
    (60.0, 4.0, note('A3'), 82),
]

# Bars 17-24: Rising Fanfare
horn_events += [
    (64.0, 2.0, note('G3'), 84),
    (66.0, 2.0, note('A3'), 86),
    (68.0, 2.0, note('Bb3'), 90),
    (70.0, 2.0, note('C4'), 92),
    (72.0, 2.0, note('D4'), 94),
    (74.0, 2.0, note('F4'), 96),
    (76.0, 3.0, note('G4'), 100),
    (79.0, 1.0, note('F4'), 96),
    (80.0, 2.0, note('E4'), 98),
    (82.0, 2.0, note('D4'), 95),
    (84.0, 2.0, note('C#4'), 98),
    (86.0, 2.0, note('E4'), 102),
    (88.0, 4.0, note('D4'), 105),
    (92.0, 3.0, note('A3'), 95),
]

# Bars 25-40: Heroic Counter-Melody in Climax (Full Swelling Majesty)
horn_events += [
    (96.0, 2.0, note('D4'), 108),
    (98.0, 1.0, note('E4'), 106),
    (99.0, 1.0, note('F4'), 110),
    (100.0, 2.0, note('E4'), 106),
    (102.0, 2.0, note('D4'), 105),
    (104.0, 3.0, note('A3'), 108),
    (107.0, 1.0, note('C4'), 105),
    (108.0, 4.0, note('D4'), 112),
    (112.0, 2.0, note('G4'), 110),
    (114.0, 2.0, note('F4'), 108),
    (116.0, 2.0, note('E4'), 106),
    (118.0, 2.0, note('D4'), 104),
    (120.0, 3.0, note('A3'), 108),
    (123.0, 1.0, note('Bb3'), 105),
    (124.0, 4.0, note('A3'), 106),

    # Bar 33: Triumphant Fanfare
    (128.0, 2.0, note('D4'), 114),
    (130.0, 2.0, note('F4'), 116),
    (132.0, 3.0, note('A4'), 118),
    (135.0, 1.0, note('G4'), 112),
    (136.0, 2.0, note('F4'), 114),
    (138.0, 2.0, note('D4'), 110),
    (140.0, 3.0, note('E4'), 112),
    (143.0, 1.0, note('F4'), 110),
    (144.0, 2.0, note('G4'), 112),
    (146.0, 2.0, note('F4'), 110),
    (148.0, 2.0, note('E4'), 108),
    (150.0, 2.0, note('C4'), 104),
    (152.0, 4.0, note('D4'), 112),
    (156.0, 4.0, note('D4'), 100),
]


# ------------------------------------------------------------------------------
# C. VIOLIN ENSEMBLE (Soaring Emotional Strings in Octaves & Harmonies)
# ------------------------------------------------------------------------------
violin_events = []

# Bars 13-16: Gentle High String Swell
for b, n in [(48.0, note('D4')), (48.0, note('F4')), (52.0, note('C4')), (52.0, note('E4')),
            (56.0, note('Bb3')), (56.0, note('D4')), (60.0, note('A3')), (60.0, note('C#4'))]:
    violin_events.append((b, 3.8, n, 68))

# Bars 17-24: Soaring Legato Ascent
violin_events += [
    (64.0, 2.0, note('D5'), 85),
    (66.0, 1.0, note('E5'), 88),
    (67.0, 1.0, note('F5'), 92),
    (68.0, 2.5, note('G5'), 95),
    (70.5, 0.5, note('F5'), 88),
    (71.0, 1.0, note('E5'), 90),
    (72.0, 2.0, note('F5'), 92),
    (74.0, 1.0, note('G5'), 94),
    (75.0, 1.0, note('A5'), 98),
    (76.0, 3.0, note('Bb5'), 102),
    (79.0, 1.0, note('C6'), 104),
    (80.0, 2.5, note('D6'), 108),
    (82.5, 0.5, note('C6'), 100),
    (83.0, 1.0, note('Bb5'), 98),
    (84.0, 2.0, note('A5'), 102),
    (86.0, 1.0, note('G5'), 98),
    (87.0, 1.0, note('F5'), 96),
    (88.0, 4.0, note('E5'), 102),
    (92.0, 3.5, note('A5'), 105),
]

# Bars 25-40: Glorious Climax (Lead Soaring Melody in High Register)
violin_events += [
    (96.0, 2.5, note('F5'), 112),
    (98.5, 0.5, note('G5'), 108),
    (99.0, 1.0, note('A5'), 116),
    (100.0, 2.0, note('G5'), 112),
    (102.0, 1.0, note('F5'), 108),
    (103.0, 1.0, note('E5'), 105),
    (104.0, 2.5, note('D5'), 110),
    (106.5, 0.5, note('C5'), 102),
    (107.0, 1.0, note('D5'), 108),
    (108.0, 2.0, note('A5'), 118),
    (110.0, 1.0, note('G5'), 112),
    (111.0, 1.0, note('F5'), 108),
    (112.0, 2.5, note('Bb5'), 118),
    (114.5, 0.5, note('A5'), 114),
    (115.0, 1.0, note('G5'), 110),
    (116.0, 2.0, note('F5'), 108),
    (118.0, 1.0, note('G5'), 106),
    (119.0, 1.0, note('A5'), 114),
    (120.0, 3.5, note('E5'), 110),
    (124.0, 2.0, note('F5'), 108),
    (126.0, 1.0, note('G5'), 110),
    (127.0, 1.0, note('A5'), 116),

    # Bar 33: Second Wave of Climax (Octave Soaring)
    (128.0, 1.0, note('D5'), 114),
    (129.0, 1.0, note('F5'), 116),
    (130.0, 1.0, note('A5'), 118),
    (131.0, 1.0, note('D6'), 124),  # High emotional climax!
    (132.0, 2.0, note('C6'), 120),
    (134.0, 1.0, note('A5'), 114),
    (135.0, 1.0, note('G5'), 110),
    (136.0, 2.0, note('Bb5'), 118),
    (138.0, 1.0, note('A5'), 114),
    (139.0, 1.0, note('F5'), 110),
    (140.0, 2.5, note('G5'), 114),
    (142.5, 0.5, note('F5'), 106),
    (143.0, 1.0, note('E5'), 104),
    (144.0, 1.5, note('D5'), 110),
    (145.5, 0.5, note('F5'), 106),
    (146.0, 1.0, note('A5'), 114),
    (147.0, 1.0, note('G5'), 110),
    (148.0, 2.0, note('F5'), 112),
    (150.0, 2.0, note('E5'), 106),
    (152.0, 4.0, note('D5'), 114),
    (156.0, 3.8, note('D5'), 100),
]

# Harmony accompaniment in Violins II (Bars 25-40)
violin2_chords = [
    (96.0, 3.8, note('D4'), 92), (96.0, 3.8, note('A4'), 92),
    (100.0, 3.8, note('C4'), 90), (100.0, 3.8, note('G4'), 90),
    (104.0, 3.8, note('Bb3'), 94), (104.0, 3.8, note('F4'), 94),
    (108.0, 3.8, note('D4'), 95), (108.0, 3.8, note('A4'), 95),
    (112.0, 3.8, note('G3'), 92), (112.0, 3.8, note('D4'), 92),
    (116.0, 3.8, note('Bb3'), 92), (116.0, 3.8, note('F4'), 92),
    (120.0, 3.8, note('A3'), 94), (120.0, 3.8, note('E4'), 94),
    (124.0, 3.8, note('A3'), 96), (124.0, 3.8, note('C#4'), 96),

    (128.0, 3.8, note('D4'), 100), (128.0, 3.8, note('F4'), 100),
    (132.0, 3.8, note('F4'), 98), (132.0, 3.8, note('C5'), 98),
    (136.0, 3.8, note('D4'), 98), (136.0, 3.8, note('Bb4'), 98),
    (140.0, 3.8, note('C4'), 96), (140.0, 3.8, note('G4'), 96),
    (144.0, 3.8, note('Bb3'), 96), (144.0, 3.8, note('F4'), 96),
    (148.0, 3.8, note('A3'), 98), (148.0, 3.8, note('E4'), 98),
    (152.0, 3.8, note('F3'), 95), (152.0, 3.8, note('D4'), 95),
    (156.0, 3.8, note('D4'), 90), (156.0, 3.8, note('A4'), 90),
]
violin_events += violin2_chords


# ------------------------------------------------------------------------------
# D. CELLO & CONTRABASS SECTION (Warm Emotional Foundation & Walking Bass)
# ------------------------------------------------------------------------------
cello_events = []

# Bars 1-8: Intro Drone / Warm Swell
for b in [0.0, 8.0, 16.0, 24.0]:
    cello_events.append((b, 7.8, note('D2'), 65))
    cello_events.append((b, 7.8, note('A2'), 65))

# Bars 9-16: Rich Harmonic Pad
chord_bass = [
    (32.0, 3.8, note('D2'), 75), (32.0, 3.8, note('F2'), 72),
    (36.0, 3.8, note('Bb1'), 75), (36.0, 3.8, note('F2'), 72),
    (40.0, 3.8, note('C2'), 75), (40.0, 3.8, note('G2'), 72),
    (44.0, 3.8, note('D2'), 78), (44.0, 3.8, note('A2'), 75),
    (48.0, 3.8, note('Bb1'), 78), (48.0, 3.8, note('D2'), 75),
    (52.0, 3.8, note('C2'), 78), (52.0, 3.8, note('E2'), 75),
    (56.0, 3.8, note('F1'), 78), (56.0, 3.8, note('C2'), 75),
    (60.0, 3.8, note('A1'), 80), (60.0, 3.8, note('E2'), 76),
]
cello_events += chord_bass

# Bars 17-24: Driving Rhythmic Bass (Eighth note pulses)
for bar_idx, root in enumerate([note('G1'), note('A1'), note('Bb1'), note('C2'),
                               note('D2'), note('F2'), note('A1'), note('A1')]):
    bar_start = 64.0 + bar_idx * 4.0
    for beat in range(4):
        cello_events.append((bar_start + beat, 0.85, root, 85 + beat * 2))
        cello_events.append((bar_start + beat, 0.85, root + 12, 78 + beat * 2))

# Bars 25-40: Epic Walking Bassline (Grand Orchestral Drive)
epic_bass_roots = [
    note('D2'), note('C2'), note('Bb1'), note('D2'),
    note('G1'), note('Bb1'), note('A1'), note('A1'),
    note('D2'), note('F2'), note('Bb1'), note('C2'),
    note('G1'), note('A1'), note('D2'), note('D2')
]
for bar_idx, r in enumerate(epic_bass_roots):
    b_st = 96.0 + bar_idx * 4.0
    # Beat 1 & 3: heavy root; Beat 2 & 4: octave bounce or fifth
    cello_events.append((b_st + 0.0, 1.8, r, 108))
    cello_events.append((b_st + 0.0, 1.8, r - 12 if r >= 36 else r, 112)) # Sub bass
    cello_events.append((b_st + 2.0, 0.9, r + 7, 98))
    cello_events.append((b_st + 3.0, 0.9, r + 12, 102))

# Bars 41-48: Emotional Solo Cello Reprise (Tender, Heartfelt Outro)
cello_events += [
    (160.0, 2.0, note('D3'), 82),
    (162.0, 1.0, note('F3'), 80),
    (163.0, 1.0, note('A3'), 84),
    (164.0, 2.5, note('G3'), 80),
    (166.5, 0.5, note('F3'), 75),
    (167.0, 1.0, note('E3'), 78),
    (168.0, 2.0, note('F3'), 76),
    (170.0, 1.0, note('D3'), 74),
    (171.0, 1.0, note('C3'), 72),
    (172.0, 3.5, note('D3'), 80),
    (176.0, 4.0, note('D2'), 78),
    (176.0, 4.0, note('A2'), 75),
    (180.0, 7.5, note('D2'), 65),
    (180.0, 7.5, note('A2'), 65),
]


# ------------------------------------------------------------------------------
# E. CELTIC CONCERT HARP (Cascading Flowing Broken Arpeggios)
# ------------------------------------------------------------------------------
harp_events = []

# Chords per bar across the 48 bars
bar_chords = [
    # Bars 1-8: Intro Dm -> Bb -> C -> Dm
    [note('D3'), note('A3'), note('D4'), note('F4'), note('A4')],
    [note('D3'), note('A3'), note('D4'), note('F4'), note('A4')],
    [note('Bb2'), note('F3'), note('Bb3'), note('D4'), note('F4')],
    [note('Bb2'), note('F3'), note('Bb3'), note('D4'), note('F4')],
    [note('C3'), note('G3'), note('C4'), note('E4'), note('G4')],
    [note('C3'), note('G3'), note('C4'), note('E4'), note('G4')],
    [note('D3'), note('A3'), note('D4'), note('F4'), note('A4')],
    [note('D3'), note('A3'), note('D4'), note('F4'), note('A4')],

    # Bars 9-16: Exposition
    [note('D3'), note('A3'), note('D4'), note('F4'), note('A4')],
    [note('Bb2'), note('F3'), note('Bb3'), note('D4'), note('F4')],
    [note('C3'), note('G3'), note('C4'), note('E4'), note('G4')],
    [note('D3'), note('A3'), note('D4'), note('F4'), note('A4')],
    [note('Bb2'), note('F3'), note('Bb3'), note('D4'), note('F4')],
    [note('C3'), note('G3'), note('C4'), note('E4'), note('G4')],
    [note('F2'), note('C3'), note('F3'), note('A3'), note('C4')],
    [note('A2'), note('E3'), note('A3'), note('C#4'), note('E4')],

    # Bars 17-24: Ascent
    [note('G2'), note('D3'), note('G3'), note('Bb3'), note('D4')],
    [note('A2'), note('E3'), note('A3'), note('C4'), note('E4')],
    [note('Bb2'), note('F3'), note('Bb3'), note('D4'), note('F4')],
    [note('C3'), note('G3'), note('C4'), note('E4'), note('G4')],
    [note('D3'), note('A3'), note('D4'), note('F4'), note('A4')],
    [note('F2'), note('C3'), note('F3'), note('A3'), note('C4')],
    [note('G2'), note('D3'), note('G3'), note('Bb3'), note('D4')],
    [note('A2'), note('E3'), note('A3'), note('C#4'), note('E4')],

    # Bars 25-40: Climax (Sweeping 8-note arpeggios)
    [note('D3'), note('F3'), note('A3'), note('D4'), note('F4'), note('A4'), note('D5'), note('F5')],
    [note('C3'), note('E3'), note('G3'), note('C4'), note('E4'), note('G4'), note('C5'), note('E5')],
    [note('Bb2'), note('D3'), note('F3'), note('Bb3'), note('D4'), note('F4'), note('Bb4'), note('D5')],
    [note('D3'), note('F3'), note('A3'), note('D4'), note('F4'), note('A4'), note('D5'), note('F5')],
    [note('G2'), note('Bb2'), note('D3'), note('G3'), note('Bb3'), note('D4'), note('G4'), note('Bb4')],
    [note('Bb2'), note('D3'), note('F3'), note('Bb3'), note('D4'), note('F4'), note('Bb4'), note('D5')],
    [note('A2'), note('C#3'), note('E3'), note('A3'), note('C#4'), note('E4'), note('A4'), note('C#5')],
    [note('A2'), note('D3'), note('E3'), note('A3'), note('C#4'), note('E4'), note('A4'), note('D5')],

    [note('D3'), note('F3'), note('A3'), note('D4'), note('F4'), note('A4'), note('D5'), note('F5')],
    [note('F2'), note('A2'), note('C3'), note('F3'), note('A3'), note('C4'), note('F4'), note('A4')],
    [note('Bb2'), note('D3'), note('F3'), note('Bb3'), note('D4'), note('F4'), note('Bb4'), note('D5')],
    [note('C3'), note('E3'), note('G3'), note('C4'), note('E4'), note('G4'), note('C5'), note('E5')],
    [note('G2'), note('Bb2'), note('D3'), note('G3'), note('Bb3'), note('D4'), note('G4'), note('Bb4')],
    [note('A2'), note('C#3'), note('E3'), note('A3'), note('C#4'), note('E4'), note('A4'), note('C#5')],
    [note('D3'), note('F3'), note('A3'), note('D4'), note('F4'), note('A4'), note('D5'), note('F5')],
    [note('D3'), note('A3'), note('D4'), note('F4'), note('A4'), note('D5'), note('E5'), note('D5')],

    # Bars 41-48: Outro
    [note('D3'), note('A3'), note('D4'), note('F4'), note('A4')],
    [note('Bb2'), note('F3'), note('Bb3'), note('D4'), note('F4')],
    [note('C3'), note('G3'), note('C4'), note('E4'), note('G4')],
    [note('D3'), note('A3'), note('D4'), note('F4'), note('A4')],
    [note('Bb2'), note('F3'), note('Bb3'), note('D4'), note('F4')],
    [note('C3'), note('G3'), note('C4'), note('E4'), note('G4')],
    [note('D3'), note('A3'), note('D4'), note('F4'), note('A4')],
    [note('D2'), note('A2'), note('F3'), note('A3'), note('C4'), note('E4'), note('A4'), note('D5')]
]

for bar_i, chord in enumerate(bar_chords):
    b_st = bar_i * 4.0
    if bar_i < 24 or bar_i >= 40:
        # 8 eighth-notes per bar (up and down arpeggio)
        pattern = chord + list(reversed(chord[1:-1]))
        while len(pattern) < 8:
            pattern += chord
        pattern = pattern[:8]
        vel_base = 65 if bar_i < 8 else (72 if bar_i < 16 else (80 if bar_i < 24 else 60))
        for step, n in enumerate(pattern):
            harp_events.append((b_st + step * 0.5, 0.9, n, vel_base + (step % 2) * 5))
    else:
        # Climax: 16 sixteenth-notes per bar (fluid sweeping cascades)
        full_pattern = chord + chord
        vel_base = 82
        for step in range(16):
            n = full_pattern[step % len(full_pattern)]
            harp_events.append((b_st + step * 0.25, 0.8, n, vel_base + (4 if step % 4 == 0 else 0)))


# ------------------------------------------------------------------------------
# F. ORCHESTRAL PERCUSSION (Timpani, Bass Drum, Cymbals, Shimmer Bells)
# ------------------------------------------------------------------------------
# We will use custom types for synthesis and standard GM mapping for MIDI:
# Timpani: MIDI GM 47 (note C2-G2)
# Gran Cassa / Bass Drum: GM Ch10 note 35 / 36
# Crash / Suspended Cymbal: GM Ch10 note 49 / 55
# Glockenspiel: GM Patch 9 (Glockenspiel) or high bells
percussion_events = []
# Each event: (start_beat, dur_beat, type_str, velocity)

# Timpani rolls & accents
# Build up in Bars 21-24:
for b, n in [(80.0, 'timpani_A1'), (84.0, 'timpani_A1'), (88.0, 'timpani_roll_A1'), (92.0, 'timpani_roll_A1')]:
    percussion_events.append((b, 3.8, n, 90))

# Climax Bars 25-40: Booming Timpani on Beats 1 & 3
timp_notes = ['D2', 'C2', 'Bb1', 'D2', 'G1', 'Bb1', 'A1', 'A1',
              'D2', 'F2', 'Bb1', 'C2', 'G1', 'A1', 'D2', 'D2']
for bar_idx, t_note in enumerate(timp_notes):
    b_st = 96.0 + bar_idx * 4.0
    percussion_events.append((b_st + 0.0, 1.8, f'timpani_{t_note}', 115))
    percussion_events.append((b_st + 2.0, 1.2, f'timpani_{t_note}', 100))
    if bar_idx in [3, 7, 11, 15]:
        # Roll leading to next phrase
        percussion_events.append((b_st + 3.0, 1.0, f'timpani_roll_{t_note}', 108))

# Gran Cassa (Deep Sub Impacts):
for b in [64.0, 80.0, 96.0, 112.0, 128.0, 144.0, 152.0]:
    percussion_events.append((b, 2.0, 'bass_drum', 118))

# Suspended Cymbal Swells & Crashes:
for b in [63.0, 79.0, 95.0, 111.0, 127.0, 143.0, 151.0]:
    percussion_events.append((b, 4.0, 'cymbal_swell', 110))

# Orchestral Glockenspiel Bells (Highlighting melodic apexes):
bell_cues = [
    (99.0, note('A6')), (108.0, note('A6')), (112.0, note('Bb6')),
    (119.0, note('A6')), (127.0, note('A6')),
    (131.0, note('D7')), # High sparkling bell peak!
    (132.0, note('C7')), (136.0, note('Bb6')), (140.0, note('G6')),
    (146.0, note('A6')), (152.0, note('D6'))
]
for b, n in bell_cues:
    percussion_events.append((b, 2.0, f'bell_{n}', 105))


# ==============================================================================
# 2. STANDARD MIDI FORMAT 1 EXPORTER (PURE PYTHON)
# ==============================================================================

def write_midi_file(filepath):
    """Write standard multi-track MIDI file (Format 1)."""
    ticks_per_beat = 480

    def encode_vlq(n):
        res = [n & 0x7F]
        n >>= 7
        while n > 0:
            res.append((n & 0x7F) | 0x80)
            n >>= 7
        return bytes(reversed(res))

    def make_track(events_list, channel, program, track_name):
        """events_list: [(start_beat, dur_beat, note, vel), ...]"""
        raw_events = []
        for start_beat, dur_beat, n, v in events_list:
            t_on = int(round(start_beat * ticks_per_beat))
            t_off = int(round((start_beat + dur_beat) * ticks_per_beat))
            raw_events.append((t_on, 0x90 | channel, n, max(1, min(127, v))))
            raw_events.append((t_off, 0x80 | channel, n, 0))

        raw_events.sort(key=lambda x: (x[0], 0 if (x[1] & 0xF0) == 0x80 else 1))

        track_data = bytearray()
        # Track Name Meta Event
        name_bytes = track_name.encode('utf-8')
        track_data.extend(b'\x00\xff\x03' + encode_vlq(len(name_bytes)) + name_bytes)
        # Program change
        if program is not None:
            track_data.extend(b'\x00' + bytes([0xc0 | channel, program]))

        last_tick = 0
        for tick, status, data1, data2 in raw_events:
            delta = tick - last_tick
            if delta < 0:
                delta = 0
            track_data.extend(encode_vlq(delta))
            track_data.extend(bytes([status, data1, data2]))
            last_tick = tick

        # End of Track
        track_data.extend(b'\x00\xff\x2f\x00')
        track_chunk = b'MTrk' + struct.pack('>I', len(track_data)) + bytes(track_data)
        return track_chunk

    # Track 0: Tempo & Time Signature
    t0_data = bytearray()
    t0_name = b"Master Track - Elysian Horizon (Ashmark Theme)"
    t0_data.extend(b'\x00\xff\x03' + encode_vlq(len(t0_name)) + t0_name)
    # Time Signature: 4/4
    t0_data.extend(b'\x00\xff\x58\x04\x04\x02\x18\x08')
    # Tempo: 60,000,000 / BPM
    tempo_us = int(round(60000000.0 / BPM))
    t0_data.extend(b'\x00\xff\x51\x03' + struct.pack('>I', tempo_us)[1:])
    # End of Track
    t0_data.extend(b'\x00\xff\x2f\x00')
    t0_chunk = b'MTrk' + struct.pack('>I', len(t0_data)) + bytes(t0_data)

    # Instrument Tracks
    t1 = make_track(flute_events, channel=0, program=73, track_name="Solo Celtic Flute")
    t2 = make_track(horn_events, channel=1, program=60, track_name="French Horn Section")
    t3 = make_track(violin_events, channel=2, program=48, track_name="Violin Ensemble")
    t4 = make_track(cello_events, channel=3, program=42, track_name="Cello & Bass Section")
    t5 = make_track(harp_events, channel=4, program=46, track_name="Celtic Concert Harp")

    # Percussion Track
    perc_midi_events = []
    for start_beat, dur_beat, ptype, v in percussion_events:
        if ptype.startswith('timpani'):
            n_str = ptype.split('_')[-1]
            try:
                m_n = note(n_str)
            except:
                m_n = note('D2')
            perc_midi_events.append((start_beat, dur_beat, m_n, v))
        elif ptype == 'bass_drum':
            perc_midi_events.append((start_beat, 1.0, 35, v))
        elif ptype == 'cymbal_swell':
            perc_midi_events.append((start_beat, 3.0, 49, v))
        elif ptype.startswith('bell_'):
            m_n = int(ptype.split('_')[1])
            perc_midi_events.append((start_beat, 2.0, m_n, v))

    t6 = make_track(perc_midi_events, channel=9, program=None, track_name="Orchestral Percussion")

    tracks = [t0_chunk, t1, t2, t3, t4, t5, t6]
    header = b'MThd' + struct.pack('>IHHH', 6, 1, len(tracks), ticks_per_beat)

    with open(filepath, 'wb') as f:
        f.write(header)
        for trk in tracks:
            f.write(trk)

    print(f"[MIDI] Successfully exported: {filepath} ({len(tracks)} tracks)")


# ==============================================================================
# 3. HIGH-FIDELITY STUDIO ORCHESTRAL SYNTHESIZER (WAV MASTER)
# ==============================================================================

class OrchestralSynth:
    def __init__(self, sample_rate=44100):
        self.sr = sample_rate
        self.total_seconds = (TOTAL_BEATS * BEAT_DUR) + 6.0  # +6s reverb tail
        self.total_samples = int(self.total_seconds * self.sr)
        # Stereo buffer: shape (2, total_samples)
        self.master_left = np.zeros(self.total_samples, dtype=np.float32)
        self.master_right = np.zeros(self.total_samples, dtype=np.float32)

    def pan_mix(self, audio, start_sec, pan=0.0):
        """Mix mono audio into master stereo at start_sec with pan [-1.0=Left, 1.0=Right]."""
        st_idx = int(start_sec * self.sr)
        end_idx = min(st_idx + len(audio), self.total_samples)
        chunk_len = end_idx - st_idx
        if chunk_len <= 0:
            return

        # Constant power pan law
        angle = (pan + 1.0) * (np.pi / 4.0)
        gain_l = np.cos(angle)
        gain_r = np.sin(angle)

        self.master_left[st_idx:end_idx] += audio[:chunk_len] * gain_l
        self.master_right[st_idx:end_idx] += audio[:chunk_len] * gain_r

    # --------------------------------------------------------------------------
    # Sound Generators
    # --------------------------------------------------------------------------

    def synth_flute(self, freq, duration, vel):
        """Irish / Celtic Wooden Flute: Additive harmonics + breath noise + delayed vibrato."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        if len(t) == 0: return np.array([], dtype=np.float32)

        # Natural expressive vibrato kicking in after 0.25s
        vib_envelope = np.clip((t - 0.25) / 0.4, 0.0, 1.0)
        vib_freq = 5.2 # Hz
        vib_depth = 0.012 # ~20 cents
        phase = 2 * np.pi * freq * (t + vib_envelope * (vib_depth / (2 * np.pi * vib_freq)) * np.sin(2 * np.pi * vib_freq * t))

        # Harmonics (Wood flute has strong fundamental, rich 3rd, subtle 2nd & 4th)
        sig_wave = 1.0 * np.sin(phase) + \
                   0.25 * np.sin(2 * phase) + \
                   0.45 * np.sin(3 * phase) + \
                   0.12 * np.sin(4 * phase) + \
                   0.08 * np.sin(5 * phase)

        # Chiff / breath air noise
        noise = (np.random.rand(len(t)) * 2.0 - 1.0)
        # Lowpass filter the breath noise to simulate hollow wooden bore
        b_noise, a_noise = sig.butter(2, min(freq * 3.5, 8000) / (self.sr / 2), btype='low')
        filtered_noise = sig.lfilter(b_noise, a_noise, noise)
        chiff_env = np.exp(-t / 0.08) * 0.35 + 0.08 # transient burst then subtle continuous breath

        audio = sig_wave + filtered_noise * chiff_env

        # ADSR Envelope
        attack = int(0.08 * self.sr)
        release = int(0.18 * self.sr)
        env = np.ones(len(t))
        if attack > 0 and len(env) > attack:
            env[:attack] = np.sin(np.linspace(0, np.pi / 2, attack))
        if release > 0 and len(env) > release:
            env[-release:] = np.cos(np.linspace(0, np.pi / 2, release))

        gain = (vel / 127.0) ** 1.2 * 0.42
        return (audio * env * gain).astype(np.float32)

    def synth_french_horn(self, freq, duration, vel):
        """French Horn Section: Warm brass FM synthesis + dynamic resonant lowpass swell."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        if len(t) == 0: return np.array([], dtype=np.float32)

        # Warm brass FM modeling (Modulator ratio 1:1, index modulates with swell)
        swell_env = np.ones(len(t))
        att_len = int(0.14 * self.sr)
        rel_len = int(0.25 * self.sr)
        if att_len > 0 and len(swell_env) > att_len:
            swell_env[:att_len] = np.linspace(0.1, 1.0, att_len) ** 1.5
        if rel_len > 0 and len(swell_env) > rel_len:
            swell_env[-rel_len:] = np.linspace(1.0, 0.0, rel_len) ** 2.0

        mod_index = (vel / 127.0) * 1.8 * swell_env
        modulator = np.sin(2 * np.pi * freq * t)
        carrier = np.sin(2 * np.pi * freq * t + mod_index * modulator)

        # Add 2nd unison detuned horn for section ensemble depth
        carrier2 = np.sin(2 * np.pi * (freq * 1.0018) * t + mod_index * modulator)
        carrier3 = np.sin(2 * np.pi * (freq * 0.9982) * t + mod_index * modulator)
        raw_brass = (carrier * 0.5 + carrier2 * 0.25 + carrier3 * 0.25)

        # Dynamic lowpass filter (opens with velocity and envelope)
        cutoff = min(freq * 4.5 * (vel / 127.0) + 400.0, 9000.0)
        b_horn, a_horn = sig.butter(2, cutoff / (self.sr / 2), btype='low')
        audio = sig.lfilter(b_horn, a_horn, raw_brass)

        gain = (vel / 127.0) ** 1.3 * 0.38
        return (audio * swell_env * gain).astype(np.float32)

    def synth_violin_ensemble(self, freq, duration, vel):
        """Violin Section: Multi-voice unison detune (3 chorused saw-waves) + warm filtering."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        if len(t) == 0: return np.array([], dtype=np.float32)

        # 3 detuned oscillators (+/- 1.8 cents)
        f1 = freq
        f2 = freq * (2.0 ** (1.8 / 1200.0))
        f3 = freq * (2.0 ** (-1.8 / 1200.0))

        # Rich bowed string spectrum (bandlimited sum of sines)
        saw1 = np.zeros(len(t))
        saw2 = np.zeros(len(t))
        saw3 = np.zeros(len(t))
        num_harmonics = min(int(10000.0 / freq), 16)
        for h in range(1, num_harmonics + 1):
            amp = (1.0 / h) * (0.85 ** (h - 1))
            saw1 += amp * np.sin(2 * np.pi * f1 * h * t)
            saw2 += amp * np.sin(2 * np.pi * f2 * h * t + (h * 0.3))
            saw3 += amp * np.sin(2 * np.pi * f3 * h * t - (h * 0.3))

        # Expressive vibrato for high passionate notes (starting after 0.2s)
        if freq > 400.0:
            vib = np.clip((t - 0.2) / 0.5, 0.0, 1.0) * np.sin(2 * np.pi * 5.5 * t) * 0.08
            saw1 *= (1.0 + vib)

        ensemble = (saw1 * 0.44 + saw2 * 0.28 + saw3 * 0.28)

        # Warm body formant filter (violins have warm resonance around 2.5 kHz)
        cutoff = min(freq * 3.8 + 1200.0, 9500.0)
        b_str, a_str = sig.butter(2, cutoff / (self.sr / 2), btype='low')
        audio = sig.lfilter(b_str, a_str, ensemble)

        # Bowed string envelope (slow crescendo attack, singing sustain, smooth decay)
        att_len = int(0.12 * self.sr)
        rel_len = int(0.28 * self.sr)
        env = np.ones(len(t))
        if att_len > 0 and len(env) > att_len:
            env[:att_len] = np.linspace(0.0, 1.0, att_len) ** 1.3
        if rel_len > 0 and len(env) > rel_len:
            env[-rel_len:] = np.linspace(1.0, 0.0, rel_len) ** 1.8

        gain = (vel / 127.0) ** 1.2 * 0.35
        return (audio * env * gain).astype(np.float32)

    def synth_cello(self, freq, duration, vel):
        """Cello / Bass: Deep resonant wooden warmth, rich low harmonic foundation."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        if len(t) == 0: return np.array([], dtype=np.float32)

        # 2 detuned voices
        f1 = freq
        f2 = freq * (2.0 ** (1.2 / 1200.0))
        audio = np.zeros(len(t))
        num_harmonics = min(int(6000.0 / freq), 20)
        for h in range(1, num_harmonics + 1):
            amp = (1.0 / (h ** 0.95))
            audio += amp * (np.sin(2 * np.pi * f1 * h * t) * 0.6 + np.sin(2 * np.pi * f2 * h * t) * 0.4)

        # Cello body warmth filter (warm cut above 1.8 kHz)
        cutoff = min(freq * 4.0 + 400.0, 5000.0)
        b_cel, a_cel = sig.butter(2, cutoff / (self.sr / 2), btype='low')
        audio = sig.lfilter(b_cel, a_cel, audio)

        att_len = int(0.10 * self.sr)
        rel_len = int(0.25 * self.sr)
        env = np.ones(len(t))
        if att_len > 0 and len(env) > att_len:
            env[:att_len] = np.linspace(0.0, 1.0, att_len)
        if rel_len > 0 and len(env) > rel_len:
            env[-rel_len:] = np.linspace(1.0, 0.0, rel_len)

        gain = (vel / 127.0) ** 1.15 * 0.42
        return (audio * env * gain).astype(np.float32)

    def synth_celtic_harp(self, freq, duration, vel):
        """Celtic Harp: Plucked crystalline string with exponential decay per harmonic."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        if len(t) == 0: return np.array([], dtype=np.float32)

        audio = np.zeros(len(t))
        # Plucked decay: higher harmonics die much faster than fundamental
        num_h = min(int(9000.0 / freq), 10)
        for h in range(1, num_h + 1):
            f_h = freq * h
            decay_rate = 1.6 + (h * 1.8) + (freq / 400.0)
            env_h = np.exp(-decay_rate * t)
            amp = (1.0 / (h ** 1.1))
            audio += amp * env_h * np.sin(2 * np.pi * f_h * t + (h * 0.4))

        # Soft initial pluck click transient
        click = np.random.randn(len(t)) * np.exp(-t / 0.006) * 0.15
        audio += click

        gain = (vel / 127.0) ** 1.3 * 0.38
        return (audio * gain).astype(np.float32)

    def synth_timpani(self, freq, duration, vel):
        """Timpani: Membrane pitch drop transient + circular Bessel modes (1.0, 1.59, 2.14)."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        if len(t) == 0: return np.array([], dtype=np.float32)

        # Membrane pitch drop (tension starts high at mallet strike)
        pitch_drop = freq * 0.08 * np.exp(-t / 0.05)
        phase = 2 * np.pi * (freq * t + pitch_drop * t)

        # Circular membrane modes
        m1 = np.sin(phase) * np.exp(-t / 1.6)
        m2 = 0.55 * np.sin(1.59 * phase) * np.exp(-t / 1.1)
        m3 = 0.28 * np.sin(2.14 * phase) * np.exp(-t / 0.7)

        # Soft felt mallet strike transient
        thump = np.random.randn(len(t)) * np.exp(-t / 0.02) * 0.25
        b_th, a_th = sig.butter(2, 250.0 / (self.sr / 2), btype='low')
        filtered_thump = sig.lfilter(b_th, a_th, thump)

        audio = (m1 + m2 + m3 + filtered_thump)
        gain = (vel / 127.0) ** 1.4 * 0.55
        return (audio * gain).astype(np.float32)

    def synth_bass_drum(self, duration, vel):
        """Gran Cassa / Orchestral Bass Drum: Deep visceral sub boom."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        f_start = 85.0
        f_end = 36.0
        f_sweep = f_end + (f_start - f_end) * np.exp(-t / 0.08)
        phase = 2 * np.pi * np.cumsum(f_sweep) / self.sr

        sub = np.sin(phase) * np.exp(-t / 1.2)
        click = np.random.randn(len(t)) * np.exp(-t / 0.015) * 0.2
        audio = sub + click
        gain = (vel / 127.0) * 0.52
        return (audio * gain).astype(np.float32)

    def synth_cymbal_swell(self, duration, vel):
        """Suspended Cymbal: Smooth crescendo swell followed by shimmering metallic ring."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        noise = (np.random.rand(len(t)) * 2.0 - 1.0)
        # Metallic bandpass / highpass filters
        b_c1, a_c1 = sig.butter(2, [3500.0 / (self.sr / 2), 14000.0 / (self.sr / 2)], btype='band')
        filtered = sig.lfilter(b_c1, a_c1, noise)

        # Crescendo swell up to 75% of duration, then release
        peak_t = duration * 0.7
        env = np.where(t < peak_t,
                       (t / peak_t) ** 2.5,
                       np.exp(-(t - peak_t) / (duration * 0.2)))

        gain = (vel / 127.0) * 0.36
        return (filtered * env * gain).astype(np.float32)

    def synth_glockenspiel(self, freq, duration, vel):
        """Crystalline Glockenspiel: Pure bell-like decay with inharmonic metal ratios."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        f1 = freq
        f2 = freq * 2.756
        f3 = freq * 5.404
        audio = (np.sin(2 * np.pi * f1 * t) * np.exp(-t / 1.4) +
                 0.35 * np.sin(2 * np.pi * f2 * t) * np.exp(-t / 0.6) +
                 0.15 * np.sin(2 * np.pi * f3 * t) * np.exp(-t / 0.3))
        gain = (vel / 127.0) * 0.28
        return (audio * gain).astype(np.float32)

    # --------------------------------------------------------------------------
    # Hall Reverb & Mastering
    # --------------------------------------------------------------------------

    def apply_hall_reverb(self):
        """Lush Concert Hall Reverb with stereo feedback delay network and damping."""
        print("[Audio] Applying Concert Hall Reverb & Spatial Acoustics...")
        # 4 stereo comb delays with prime delays + lowpass damping + 2 allpass diffusers
        delay_times_l = [0.0397, 0.0471, 0.0563, 0.0681]
        delay_times_r = [0.0419, 0.0493, 0.0587, 0.0709]
        feedback = 0.74

        rev_l = np.zeros_like(self.master_left)
        rev_r = np.zeros_like(self.master_right)

        for d_t in delay_times_l:
            d_samples = int(d_t * self.sr)
            comb = np.zeros_like(self.master_left)
            # Efficient vectorized feedback comb approximation
            for tap in range(1, 10):
                d_idx = d_samples * tap
                gain = (feedback ** tap) * (0.85 ** tap)
                if d_idx < len(comb):
                    comb[d_idx:] += self.master_left[:-d_idx] * gain
            rev_l += comb * 0.25

        for d_t in delay_times_r:
            d_samples = int(d_t * self.sr)
            comb = np.zeros_like(self.master_right)
            for tap in range(1, 10):
                d_idx = d_samples * tap
                gain = (feedback ** tap) * (0.85 ** tap)
                if d_idx < len(comb):
                    comb[d_idx:] += self.master_right[:-d_idx] * gain
            rev_r += comb * 0.25

        # Damping lowpass filter on reverb tail
        b_damp, a_damp = sig.butter(1, 3800.0 / (self.sr / 2), btype='low')
        rev_l = sig.lfilter(b_damp, a_damp, rev_l)
        rev_r = sig.lfilter(b_damp, a_damp, rev_r)

        # Mix Dry / Wet (72% dry, 28% wet for rich cinematic depth)
        wet = 0.28
        self.master_left = self.master_left * (1.0 - wet * 0.4) + rev_l * wet
        self.master_right = self.master_right * (1.0 - wet * 0.4) + rev_r * wet

    def master_and_export(self, filepath):
        """Soft limiting, peak normalization, and 16-bit WAV export."""
        print("[Audio] Mastering stereo audio (Limiting & Normalization)...")
        # Soft limiter (tanh saturation curve for analog warmth)
        self.master_left = np.tanh(self.master_left * 1.15)
        self.master_right = np.tanh(self.master_right * 1.15)

        # Peak normalization to -0.3 dBFS (0.965)
        peak = max(np.max(np.abs(self.master_left)), np.max(np.abs(self.master_right)))
        if peak > 0:
            norm_gain = 0.965 / peak
            self.master_left *= norm_gain
            self.master_right *= norm_gain

        # Convert to 16-bit signed PCM
        int_l = np.clip(self.master_left * 32767.0, -32768.0, 32767.0).astype(np.int16)
        int_r = np.clip(self.master_right * 32767.0, -32768.0, 32767.0).astype(np.int16)

        # Interleave stereo
        stereo = np.empty((len(int_l) * 2,), dtype=np.int16)
        stereo[0::2] = int_l
        stereo[1::2] = int_r

        with wave.open(filepath, 'w') as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(self.sr)
            wf.writeframes(stereo.tobytes())

        dur_sec = len(int_l) / self.sr
        file_size_mb = os.path.getsize(filepath) / (1024 * 1024)
        print(f"[WAV] Successfully exported: {filepath} ({dur_sec:.1f}s, {file_size_mb:.2f} MB)")


    # --------------------------------------------------------------------------
    # Full Synthesis Orchestration Process
    # --------------------------------------------------------------------------

    def render_all(self):
        print(f"[Synth] Rendering {TOTAL_BARS} bars of Orchestral Score ({TOTAL_BEATS} beats @ {BPM} BPM)...")

        # 1. Solo Celtic Flute (Pan -0.15)
        print("  -> Rendering Celtic Flute...")
        for b_st, dur, n, v in flute_events:
            freq = m2f(n)
            s_dur = dur * BEAT_DUR
            wave_note = self.synth_flute(freq, s_dur, v)
            self.pan_mix(wave_note, b_st * BEAT_DUR, pan=-0.15)

        # 2. French Horn Section (Pan +0.32)
        print("  -> Rendering French Horns...")
        for b_st, dur, n, v in horn_events:
            freq = m2f(n)
            s_dur = dur * BEAT_DUR
            wave_note = self.synth_french_horn(freq, s_dur, v)
            self.pan_mix(wave_note, b_st * BEAT_DUR, pan=0.32)

        # 3. Violin Section (Pan -0.45)
        print("  -> Rendering Violin Ensemble...")
        for b_st, dur, n, v in violin_events:
            freq = m2f(n)
            s_dur = dur * BEAT_DUR
            wave_note = self.synth_violin_ensemble(freq, s_dur, v)
            self.pan_mix(wave_note, b_st * BEAT_DUR, pan=-0.45)

        # 4. Celli & Bass Section (Pan +0.15)
        print("  -> Rendering Celli & Double Basses...")
        for b_st, dur, n, v in cello_events:
            freq = m2f(n)
            s_dur = dur * BEAT_DUR
            wave_note = self.synth_cello(freq, s_dur, v)
            self.pan_mix(wave_note, b_st * BEAT_DUR, pan=0.15)

        # 5. Celtic Concert Harp (Dynamic Pan across strings)
        print("  -> Rendering Celtic Concert Harp...")
        for b_st, dur, n, v in harp_events:
            freq = m2f(n)
            s_dur = dur * BEAT_DUR
            # Lower notes panned left (-0.35), higher notes panned right (+0.35)
            h_pan = np.clip((n - 55.0) / 30.0 * 0.7 - 0.35, -0.4, 0.4)
            wave_note = self.synth_celtic_harp(freq, s_dur, v)
            self.pan_mix(wave_note, b_st * BEAT_DUR, pan=h_pan)

        # 6. Orchestral Percussion (Timpani, Bass Drum, Cymbals, Bells)
        print("  -> Rendering Orchestral Percussion & Timpani...")
        for b_st, dur, ptype, v in percussion_events:
            s_dur = dur * BEAT_DUR
            if ptype.startswith('timpani'):
                n_str = ptype.split('_')[-1]
                freq = m2f(note(n_str))
                wave_p = self.synth_timpani(freq, s_dur, v)
                self.pan_mix(wave_p, b_st * BEAT_DUR, pan=-0.2)
            elif ptype == 'bass_drum':
                wave_p = self.synth_bass_drum(s_dur, v)
                self.pan_mix(wave_p, b_st * BEAT_DUR, pan=0.0)
            elif ptype == 'cymbal_swell':
                wave_p = self.synth_cymbal_swell(s_dur, v)
                self.pan_mix(wave_p, b_st * BEAT_DUR, pan=0.0)
            elif ptype.startswith('bell_'):
                n_val = int(ptype.split('_')[1])
                freq = m2f(n_val)
                wave_p = self.synth_glockenspiel(freq, s_dur, v)
                self.pan_mix(wave_p, b_st * BEAT_DUR, pan=0.25)

        # Apply reverb & master
        self.apply_hall_reverb()


# ==============================================================================
# MAIN ENTRY POINT
# ==============================================================================

if __name__ == '__main__':
    out_dir = os.path.dirname(os.path.abspath(__file__))
    midi_file = os.path.join(out_dir, "epic_openworld_bgm.mid")
    wav_file = os.path.join(out_dir, "epic_openworld_bgm.wav")

    print("================================================================")
    print(" ELYSIAN HORIZON - EPIC OPEN-WORLD ORCHESTRAL BGM GENERATOR")
    print("================================================================")
    print(f"Output directory: {out_dir}")

    # Step 1: Export MIDI
    write_midi_file(midi_file)

    # Step 2: Synthesize WAV Audio Master
    synth = OrchestralSynth(sample_rate=SAMPLE_RATE)
    synth.render_all()
    synth.master_and_export(wav_file)

    print("================================================================")
    print(" COMPOSITION COMPLETE! Files ready for playback and DAW editing.")
    print("================================================================")

