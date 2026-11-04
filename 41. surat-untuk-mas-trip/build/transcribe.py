"""Word timestamps for the ElevenLabs VO (faster-whisper) → vo_words.json. Times are relative to the
trimmed clip used in the mix (vo.trim), so they line up with vo_timing.json."""
import glob
import json

import numpy as np
from scipy.signal import resample_poly

from faster_whisper import WhisperModel

from vo import SR, load, trim

model = WhisperModel('small', device='cpu', compute_type='int8')
out = {}
for n in range(1, 7):
    x = trim(load(glob.glob(f'../audio/vo2_s{n}_*.mp3')[0]))
    x16 = resample_poly(x, 160, 441).astype(np.float32)     # whisper wants 16 kHz
    segs, _ = model.transcribe(x16, language='id', word_timestamps=True, beam_size=5)
    out[n] = [(w.word.strip(), round(w.start, 2), round(w.end, 2)) for s in segs for w in s.words]
    print(n, ' '.join(f'{w}@{a}' for w, a, _ in out[n]))
json.dump(out, open('vo_words.json', 'w'), indent=0)
