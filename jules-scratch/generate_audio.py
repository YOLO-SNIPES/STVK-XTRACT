import numpy as np
from scipy.io.wavfile import write

# Audio parameters
samplerate = 44100  # 44.1kHz
frequency = 440.0   # A4 note
duration = 1.0      # 1 second

# Generate time axis
t = np.linspace(0., duration, int(samplerate * duration))

# Generate sine wave
amplitude = np.iinfo(np.int16).max * 0.5
data = amplitude * np.sin(2. * np.pi * frequency * t)

# Write to WAV file
write("test.wav", samplerate, data.astype(np.int16))

print("test.wav generated successfully.")
