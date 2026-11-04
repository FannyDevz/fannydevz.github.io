"""Music bed, SFX and the final mix for Video 2. Cues are written in each scene's authored time and
placed on the voice-over clock with timing.real_time. Writes mix2.wav."""
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

from timing import STARTS, real_time, vo_start

SR = 44100
TOTAL = float(STARTS[-1])
N = int(SR * TOTAL)
rng = np.random.default_rng(11)


def mf(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)


def add(buf, sig, t, gain=1.0):
    i = int(t * SR)
    j = min(len(buf), i + len(sig))
    if j > i >= 0:
        buf[i:j] += sig[:j - i] * gain


def guitar(m, dur=2.2, bright=0.5):
    """Karplus-Strong plucked string."""
    f = mf(m)
    p = max(2, int(SR / f))
    n = int(dur * SR)
    out = np.zeros(n)
    buf = rng.uniform(-1, 1, p)
    buf = lp(buf, 1500 + 4000 * bright)
    k = 0.5 + 0.004 * (1 - bright)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.996 * (k * buf[i % p] + (1 - k) * buf[(i + 1) % p])
    return out * np.exp(-np.linspace(0, dur * 1.2, n))


_CACHE = {}


def note(m, dur=2.2, bright=0.5):
    key = (m, dur, bright)
    if key not in _CACHE:
        _CACHE[key] = guitar(m, dur, bright)
    return _CACHE[key]


# G – D – Em – C, fingerpicked eighths at 84 bpm
CHORDS = [[43, 59, 62, 67], [50, 57, 62, 66], [40, 59, 64, 67], [48, 55, 60, 64]]
PATTERN = [0, 2, 1, 3, 2, 1, 3, 2]
BEAT = 60 / 84


def picking(buf, t0, t1, gain=0.22, bright=0.45):
    t, k = t0, 0
    while t < t1:
        ch = CHORDS[(k // 8) % 4]
        idx = PATTERN[k % 8]
        add(buf, note(ch[idx], 1.8, bright), t, gain * (1.25 if idx == 0 else 0.9))
        t += BEAT / 2
        k += 1


def strum(buf, t, chord, gain=0.3, spread=0.035, dur=4.0):
    for i, m in enumerate(chord):
        add(buf, note(m, dur, 0.6), t + i * spread, gain)


def shaker(buf, t0, t1, gain=0.05):
    s = bp(rng.normal(0, 1, int(0.06 * SR)), 5000, 11000) * np.exp(-np.linspace(0, 6, int(0.06 * SR)))
    t = t0
    while t < t1:
        add(buf, s, t, gain)
        t += BEAT / 2


def page_turn_sfx(dur=0.55):
    n = int(dur * SR)
    x = rng.normal(0, 1, n)
    x = bp(x, 900, 6000)
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return x * e * np.linspace(1, 0.6, n)


def ping(f0=1320, f1=1760):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    a = np.sin(2 * np.pi * f0 * t) * np.exp(-t * 18)
    b = np.zeros(n)
    k = int(0.09 * SR)
    b[k:] = np.sin(2 * np.pi * f1 * t[:n - k]) * np.exp(-t[:n - k] * 12)
    return a + b


def ting():
    n = int(1.0 * SR)
    t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in ((2093, 5), (3136, 7), (4186, 9)))


def norm(x, peak):
    return x * (peak / max(1e-6, np.abs(x).max()))


music = np.zeros(N)
sfx = np.zeros(N)

# music: calm picking → silence before "Rupiah" → warmer again → light shaker under the phone scene
silence_at = real_time(3, 13.9)
rupiah_at = real_time(3, 17.4)
picking(music, 0.4, silence_at, 0.2, 0.4)
strum(music, rupiah_at, [43, 55, 59, 62, 67], 0.26, dur=5.0)
picking(music, real_time(4, 0.0), real_time(6, 13.0), 0.22, 0.55)
shaker(music, real_time(5, 0.4), real_time(5, 22.6))
# fade the bed into the silence and out at the end of the letter
for a, b in ((silence_at - 1.2, silence_at + 0.05), (real_time(6, 12.0), real_time(6, 13.2))):
    i, j = int(a * SR), int(b * SR)
    music[i:j] *= np.linspace(1, 0, j - i)
    if b > silence_at + 1:
        music[j:int(real_time(7, 0.0) * SR)] = 0
music[int(silence_at * SR):int((rupiah_at - 0.02) * SR)] = 0
strum(music, real_time(7, 0.9), [43, 50, 55, 59, 62, 67], 0.3, spread=0.05, dur=6.0)   # the single closing chord

# sfx
for n, t in ((1, 3.0), (2, 0.0), (2, 15.2), (3, 0.0), (3, 14.0), (4, 0.0), (4, 6.6), (4, 13.0), (5, 0.0), (6, 0.0), (7, 0.0)):
    add(sfx, page_turn_sfx(), real_time(n, t) if t else STARTS[n - 1], 0.16)
for t in (5.0, 8.5, 10.1):
    add(sfx, ping(), real_time(5, t), 0.12)
add(sfx, ting(), real_time(4, 19.4), 0.1)

# voice-over
vo = np.zeros(N)
for n in range(1, 7):
    sr, x = wavfile.read(f'vo_s{n}.wav')
    add(vo, x.astype(np.float64) / 32767, STARTS[n - 1] + vo_start(n), 1.0)
vo = norm(vo, 0.9)

# duck the music under the voice
hop = int(0.02 * SR)
e = np.sqrt(np.convolve(vo ** 2, np.ones(hop * 10) / (hop * 10), 'same'))
talk = np.clip(e / 0.05, 0, 1)
talk = np.convolve(talk, np.ones(int(0.4 * SR)) / int(0.4 * SR), 'same')
music *= 1 - 0.62 * np.clip(talk, 0, 1)

mix = norm(music, 0.32) + sfx + vo
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
wavfile.write('mix2.wav', SR, (np.stack([mix, mix], 1) * 32767 * 0.95).astype(np.int16))
print('mix2.wav', round(TOTAL, 2), 's')
