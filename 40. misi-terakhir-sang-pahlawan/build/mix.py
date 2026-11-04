"""Mix voice-over over music (ducked) and SFX. Writes final_mix.wav.

Voice-over files live in ../audio as vo_s<scene>_<name>.mp3 (e.g. vo_s1_prolog.mp3).
"""
import glob
import os
import subprocess

import numpy as np
from scipy.io import wavfile
from scipy.ndimage import uniform_filter1d

from timeline import VO_START

SR = 44100
VO_DIR = '../audio'


def load(p):
    sr, x = wavfile.read(p)
    x = x.astype(np.float32) / 32768.0
    return x.mean(axis=1) if x.ndim > 1 else x


def load_vo(k):
    fs = sorted(glob.glob(os.path.join(VO_DIR, f'vo_s{k}_*.*')))
    if not fs:
        return None, None
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', fs[0], '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0, os.path.basename(fs[0])


music = load('music.wav')
sfx = load('sfx.wav')
N = len(music)
vo = np.zeros(N, np.float32)
for k, t0 in VO_START.items():
    x, name = load_vo(k)
    if x is None:
        continue
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.92
    i = int(t0 * SR)
    j = min(N, i + len(x))
    vo[i:j] += x[:j - i]
    print(f'{name}: {t0:.1f}s → {t0 + len(x) / SR:.1f}s')

# ducking: smooth speech envelope → music gain 1.0 → 0.35 while the narrator talks
e = uniform_filter1d(np.abs(vo), int(0.05 * SR))
e = (e > 0.02).astype(np.float32)
e = uniform_filter1d(e, int(0.6 * SR))
duck = 1.0 - 0.65 * np.clip(e * 1.5, 0, 1)
mix = vo * 1.0 + music * 0.55 * duck + sfx * 0.5 * (1 - 0.35 * np.clip(e * 1.5, 0, 1))
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.95
wavfile.write('final_mix.wav', SR, (mix * 32767).astype(np.int16))
print('ok')
