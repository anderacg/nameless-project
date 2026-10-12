import numpy as np
import scipy.signal as sig
import wave
import struct

print("Testing numpy audio synthesis pipeline...")
sr = 44100
t = np.linspace(0, 2.0, int(sr * 2.0), endpoint=False)
tone = 0.3 * np.sin(2 * np.pi * 440.0 * t)
print(f"Generated {len(tone)} samples successfully.")

