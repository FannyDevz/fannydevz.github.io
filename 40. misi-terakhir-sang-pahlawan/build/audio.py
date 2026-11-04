"""Synthesize music bed + SFX for Video 1. Cue times are written on the original 2:30 timeline
and remapped onto the tightened edit (timeline.py). Writes music.wav, sfx.wav, mix.wav."""
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
from timeline import remap_abs, TOTAL

DUR = TOTAL
N = int(SR * DUR)
rng = np.random.default_rng(7)


def mf(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def add(buf, sig, t0, gain=1.0):
    i = int(remap_abs(t0) * SR)
    j = min(len(buf), i + len(sig))
    if j > i >= 0:
        buf[i:j] += sig[:j - i] * gain


def env(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def string_pad(notes, dur, bright=1800, a=1.2, r=1.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for m in notes:
        f = mf(m)
        for det in (-0.12, 0.0, 0.11):
            ff = f * 2 ** (det / 12)
            vib = 1 + 0.003 * np.sin(2 * np.pi * 5.2 * t + rng.random() * 6)
            ph = 2 * np.pi * ff * np.cumsum(vib) / SR
            for k in range(1, 8):
                out += np.sin(k * ph + rng.random() * 6) / k ** 1.15
    out = lp(out, bright)
    return out / (len(notes) * 9) * env(n, a, r)


def pluck(m, dur=0.9, decay=0.25, bright=0.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mf(m)
    return (np.sin(2 * np.pi * f * t) + bright * np.sin(4 * np.pi * f * t)) * np.exp(-t / decay)


def sine_hit(f0, f1, dur, decay):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / decay)


def noise_burst(dur, lo, hi, decay):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return bp(rng.standard_normal(n), lo, hi) * np.exp(-t / decay)


def kick():
    return sine_hit(150, 48, 0.4, 0.12)


def hat():
    return hp(rng.standard_normal(int(0.08 * SR)), 7000) * np.exp(-np.arange(int(0.08 * SR)) / SR / 0.02)


def clap():
    return noise_burst(0.25, 900, 4000, 0.05)


def heartbeat():
    out = np.zeros(int(1.0 * SR))
    add(out, sine_hit(90, 48, 0.4, 0.09), 0)
    add(out, sine_hit(80, 45, 0.4, 0.07) * 0.75, 0.26)
    return lp(out, 200)


def footstep():
    return noise_burst(0.25, 80, 900, 0.04) * 0.8 + sine_hit(110, 60, 0.25, 0.05) * 0.5


def whoosh(dur=1.2, peak=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    e = np.exp(-((t / dur - peak) ** 2) / 0.04)
    return lp(x, 900) * e * 0.9 + bp(x, 1500, 5000) * e * np.clip(t / dur / peak, 0, 1) * 0.3


def swish(dur=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    e = np.sin(np.pi * t / dur) ** 2
    return bp(rng.standard_normal(n), 1200, 6000) * e


def shimmer(dur=2.0):
    out = np.zeros(int(dur * SR))
    for i in range(14):
        d = int(rng.uniform(0.3, 0.9) * SR)
        t = np.arange(d) / SR
        add(out, np.sin(2 * np.pi * rng.uniform(1800, 4200) * t) * np.exp(-t / 0.18), i * dur / 20, 0.12)
    return out


def boom(dur=3.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return sine_hit(70, 38, dur, 0.9) + lp(rng.standard_normal(n), 400) * np.exp(-t / 0.35) * 0.6


def slap(size=1.0):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    body = bp(rng.standard_normal(n), 250, 3500) * np.exp(-t / (0.035 * size))
    rustle = bp(rng.standard_normal(n), 2000, 8000) * np.exp(-t / 0.09) * 0.25
    return body + sine_hit(140, 70, 0.35, 0.05) * 0.6 * size + rustle


def tear(dur=0.8):
    n = int(dur * SR)
    t = np.arange(n) / SR
    crack = (rng.random(n) < 0.04) * rng.standard_normal(n) * 4
    e = np.clip(t / 0.05, 0, 1) * np.exp(-((t - dur * 0.45) ** 2) / (dur * 0.12))
    return bp(rng.standard_normal(n) + crack, 900, 7000) * e


def pop():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = 500 + 700 * t / 0.12
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.03)


def bell(freqs, dur=1.2, decay=0.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * t) * np.exp(-t / decay) for f in freqs) / len(freqs)


def alarm():
    out = np.zeros(int(0.6 * SR))
    for i in range(4):
        n = int(0.12 * SR)
        t = np.arange(n) / SR
        f = 880 if i % 2 == 0 else 660
        add(out, np.sign(np.sin(2 * np.pi * f * t)) * 0.3 * np.exp(-t / 0.1), i * 0.14)
    return lp(out, 3000)


def gong(dur=6.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k, d in [(1.0, 3.5), (2.02, 2.5), (2.76, 2.0), (3.9, 1.4), (5.4, 1.0)]:
        out += np.sin(2 * np.pi * 70 * k * t + 0.3 * np.sin(2 * np.pi * 0.7 * t)) * np.exp(-t / d) / k
    return out * np.clip(t / 0.01, 0, 1) + boom(dur) * 0.5


def chords(buf, start, prog_, bright=1800, gain=0.45):
    tt = start
    for notes, d in prog_:
        dn = remap_abs(tt + d) - remap_abs(tt)
        add(buf, string_pad(notes, dn + 1.2, bright=bright), tt, gain)
        tt += d


music = np.zeros(N)
sfx = np.zeros(N)

# ===== Scene 1 (0–15): heartbeat, footsteps, wind, sombre A minor strings
for i, tt in enumerate(np.arange(0.2, 9.5, 1.05)):
    add(sfx, heartbeat(), tt, 0.9 * (1 - i / 14))
for tt in np.arange(0.8, 6.0, 0.55):
    add(sfx, footstep(), tt, 0.18)
wind = lp(rng.standard_normal(int(15.5 * SR)), 500)
wind *= (0.5 + 0.5 * np.sin(np.linspace(0, 7, len(wind)))) * env(len(wind), 2.0, 2.5)
add(sfx, wind, 0.0, 0.35)
chords(music, 1.6, [([45, 57, 60, 64], 4.2), ([41, 57, 60, 65], 3.6), ([48, 55, 60, 64], 3.6), ([43, 55, 59, 62], 4.2)], 1400, 0.55)
tt = 3.0
for m, d in [(69, 2.0), (67, 1.0), (64, 2.2), (65, 1.6), (64, 2.0), (62, 3.0)]:
    add(music, string_pad([m - 12], d + 0.6, bright=1100, a=0.25, r=0.6), tt, 0.35)
    tt += d
add(music, string_pad([45, 52, 57, 64, 69], 3.5, bright=2600, a=2.2, r=1.0), 11.6, 0.5)
add(sfx, whoosh(1.6, 0.75), 12.0, 0.4)
for tt, g in [(1.9, 1.0), (3.7, 0.6), (4.1, 0.7), (4.45, 0.8), (5.1, 0.6), (6.1, 0.8), (6.7, 0.7)]:
    add(sfx, slap(), tt, g)
for tt in (2.5, 2.7, 6.4):
    add(sfx, tear(0.28), tt, 0.35)
add(sfx, slap(1.6), 13.75, 1.1)
add(sfx, slap(1.6), 14.0, 1.1)

# ===== Scene 2 (15–30): city, then mystery
add(sfx, tear(1.0), 15.0, 1.0)
chords(music, 15.0, [([50, 62, 65, 69, 72], 4.0), ([46, 62, 65, 70], 4.0), ([43, 58, 62, 67, 70], 4.0), ([45, 61, 64, 67], 3.4)], 2000, 0.42)
for i, m in enumerate([74, 77, 81, 79, 77, 74, 72, 74, 77, 81, 84, 81]):
    add(music, pluck(m), 15.4 + i * 0.6, 0.10 * (1 - i / 16))
add(music, string_pad([38, 45, 50, 51], 8.0, bright=700, a=2.5, r=1.5), 22.3, 0.6)
for tt in (16.7, 18.1, 18.6, 19.1, 19.7, 20.3, 25.1, 25.5, 25.9):
    add(sfx, slap(0.8), tt, 0.55)
add(sfx, slap(1.3), 24.1, 1.0)
add(sfx, boom(2.5), 24.1, 0.5)
for i, m in enumerate([86, 81, 85, 79]):
    add(music, bell([mf(m), mf(m) * 2.76, mf(m) * 5.4], 1.6, 0.5), 25.0 + i * 0.9, 0.06)
add(sfx, swish(0.6), 28.7, 0.5)
add(sfx, shimmer(1.8), 29.2, 1.0)

# ===== Scene 3 (30–50): Rupiah, building heroic C major
p3 = [([48, 60, 64, 67], 2.5), ([47, 59, 62, 67], 2.5), ([45, 57, 60, 64], 2.5), ([41, 57, 60, 65], 2.5)] * 2
chords(music, 30.0, p3, 2200, 0.42)
for i in range(40):
    m = [72, 76, 79, 84, 79, 76][i % 6]
    add(music, pluck(m, 0.6, 0.18), 31.0 + i * 0.4, 0.07)
chords(music, 50 - 10, [([48, 55, 60, 64, 67], 5.0), ([41, 53, 57, 60, 65], 5.0)], 2600, 0.45)
add(music, boom(3.0), 30.0, 0.35)
add(sfx, shimmer(2.0), 30.2, 0.9)
for i in range(6):
    add(sfx, swish(0.5), 31.8 + 0.45 * i, 0.35)
add(sfx, whoosh(1.6, 0.5), 38.6, 0.4)
add(sfx, slap(1.2), 40.1, 0.9)
for i in range(7):
    add(sfx, bell([2093, 3136], 0.6, 0.15), 41.0 + i * 0.1, 0.12)
add(sfx, slap(), 44.6, 0.7)
add(sfx, slap(), 45.1, 0.7)
for i in range(7):
    add(sfx, pop(), 45.45 + 0.3 * i, 0.35)
add(sfx, whoosh(2.0, 0.85), 48.0, 0.7)
add(music, boom(2.0), 49.8, 0.4)

# ===== Scene 4 (50–75): inspiring F–C–G–Am with arpeggios
p4 = [([41, 57, 60, 65], 3.0), ([48, 55, 60, 64], 3.0), ([43, 55, 59, 62], 3.0), ([45, 57, 60, 64], 3.0)] * 2
chords(music, 50.0, p4 + p4[:1], 2400, 0.4)
arp = {0: [65, 69, 72, 77], 1: [64, 67, 72, 76], 2: [62, 67, 71, 74], 3: [64, 69, 72, 76]}
for b in range(8):
    for k in range(12):
        add(music, pluck(arp[b % 4][k % 4], 0.5, 0.15), 50.0 + b * 3 + k * 0.25, 0.06)
for tt in (50.0, 54.0, 61.6):
    add(sfx, swish(0.8), tt, 0.6)
for tt in (50.5, 51.1, 51.6, 53.3, 54.3, 54.9, 55.1, 55.5, 55.8, 56.1, 61.9, 62.7, 64.1, 64.8, 65.5):
    add(sfx, pop(), tt, 0.3)
for tt in (50.9, 54.6, 62.2):
    add(sfx, slap(), tt, 0.7)
add(sfx, whoosh(1.4, 0.6), 72.5, 0.5)
add(sfx, slap(1.2), 73.6, 0.9)
add(sfx, shimmer(1.5), 73.7, 0.8)
add(sfx, whoosh(1.0, 0.7), 74.2, 0.5)

# ===== Scene 5 (75–95): light modern beat, 100 bpm
beat = 60 / 100
p5 = [[48, 60, 64, 67], [45, 60, 64, 69], [41, 60, 65, 69], [43, 59, 62, 67]]
for bar in range(8):
    t0 = 75.0 + bar * 4 * beat
    add(music, string_pad(p5[bar % 4][1:], 4 * beat + 0.6, bright=2600, a=0.3, r=0.4), t0, 0.28)
    for b in range(4):
        tb = t0 + b * beat
        add(music, kick(), tb, 0.55 if b % 2 == 0 else 0.3)
        add(music, hat(), tb + beat / 2, 0.18)
        if b % 2 == 1:
            add(music, clap(), tb, 0.25)
        add(music, pluck(p5[bar % 4][0] + 12, 0.4, 0.12, 0.6), tb, 0.25)
add(sfx, slap(), 75.4, 0.8)
add(sfx, slap(), 76.2, 0.6)
add(sfx, slap(), 75.9, 0.6)
add(sfx, swish(0.5), 77.5, 0.4)
add(sfx, bell([2600, 3800, 5200], 0.8, 0.2), 79.4, 0.25)
add(sfx, swish(1.0), 82.0, 0.6)
add(sfx, slap(), 83.4, 0.6)
for tt in np.arange(83.2, 85.0, 0.5):
    add(sfx, bell([1500], 0.08, 0.03), tt, 0.08)
add(sfx, bell([1760, 2637], 0.4, 0.1), 85.0, 0.25)
add(sfx, pop(), 86.2, 0.4)
add(sfx, bell([1318, 1975, 2637], 1.2, 0.35), 87.2, 0.35)
add(sfx, swish(1.0), 88.2, 0.5)
for tt in (89.1, 89.4, 89.7, 90.2):
    add(sfx, slap(), tt, 0.6)
add(sfx, whoosh(1.8, 0.8), 93.3, 0.8)

# ===== Scene 6 (95–115): tension
chords(music, 95.0, [([36, 48, 51, 55], 5.0), ([34, 46, 50, 53], 5.0), ([32, 44, 48, 51], 5.0), ([31, 43, 47, 50], 5.0)], 900, 0.5)
for i in range(80):
    tt = 95.5 + i * 0.25
    if tt > 112.5:
        break
    add(music, pluck(36 if i % 4 else 43, 0.3, 0.08, 0.8), tt, 0.18)
add(sfx, slap(1.1), 95.4, 0.8)
add(sfx, slap(1.1), 95.8, 0.8)
for tt in (98.5, 100.0, 101.4):
    add(sfx, slap(), tt, 0.6)
    add(sfx, alarm(), tt + 0.35, 0.25)
for tt in (108.0, 108.6, 109.2):
    add(sfx, swish(0.25), tt, 0.6)
    add(sfx, swish(0.25), tt + 0.22, 0.6)
    add(sfx, sine_hit(120, 50, 0.5, 0.12), tt + 0.45, 0.5)
add(sfx, alarm(), 112.2, 0.3)
add(sfx, slap(1.3), 112.1, 0.8)
add(sfx, swish(0.6), 113.5, 0.6)
add(sfx, shimmer(1.6), 114.0, 0.9)

# ===== Scene 7 (115–135): uplifting
p7 = [([48, 60, 64, 67, 72], 2.5), ([43, 59, 62, 67, 71], 2.5), ([45, 57, 60, 64, 69], 2.5), ([41, 57, 60, 65, 69], 2.5)] * 2
chords(music, 115.0, p7, 2800, 0.42)
for bar in range(8):
    t0 = 115.0 + bar * 2.5
    for k in range(10):
        add(music, pluck([72, 76, 79, 84, 79][k % 5] + (0 if bar % 4 < 2 else -3), 0.5, 0.15), t0 + k * 0.25, 0.06)
    if bar >= 4:
        for b in range(4):
            add(music, kick(), t0 + b * 0.625, 0.4)
add(sfx, boom(2.0), 115.2, 0.4)
add(sfx, shimmer(1.4), 115.3, 0.8)
add(sfx, slap(1.2), 115.7, 0.8)
for i in range(5):
    add(sfx, bell([1568, 2349], 0.9, 0.25), 117.8 + 1.4 * i, 0.3)
add(sfx, swish(0.8), 127.0, 0.5)
add(sfx, slap(), 128.3, 0.7)
add(sfx, slap(), 128.8, 0.7)
add(sfx, whoosh(2.2, 0.5), 132.3, 0.5)
add(sfx, tear(0.3), 133.6, 0.4)

# ===== Scene 8 (135–150): climax and end card
p8 = [([41, 57, 60, 65], 3.0), ([43, 59, 62, 67], 3.0), ([45, 57, 60, 64, 69], 3.0), ([48, 60, 64, 67, 72], 6.0)]
chords(music, 135.0, p8, 3000, 0.5)
for i, tt in enumerate((135.5, 136.1, 136.7)):
    add(sfx, slap(), tt, 0.6)
add(sfx, tear(0.28), 136.0, 0.3)
scrib = bp(rng.standard_normal(int(2 * SR)), 1500, 5000) * (0.5 + 0.5 * np.sin(np.linspace(0, 40, int(2 * SR))))
add(sfx, scrib, 138.0, 0.12)
add(sfx, slap(1.2), 138.7, 0.8)
add(sfx, slap(), 141.5, 0.7)
add(sfx, slap(1.1), 145.3, 0.8)
add(sfx, slap(1.6), 147.2, 1.0)
add(sfx, slap(1.6), 147.45, 1.0)
add(sfx, gong(5.0), 147.6, 0.9)
add(sfx, shimmer(1.6), 148.0, 0.7)
add(music, string_pad([36, 48, 55, 60, 64, 67, 72], 3.5, bright=3200, a=0.05, r=2.5), 147.5, 0.6)

fade = np.ones(N)
fade[-int(1.2 * SR):] = np.linspace(1, 0, int(1.2 * SR))


def norm(x, peak):
    return x / (np.max(np.abs(x)) + 1e-9) * peak


music = norm(music * fade, 0.5)
sfx = norm(sfx * fade, 0.6)
wavfile.write('music.wav', SR, (music * 32767).astype(np.int16))
wavfile.write('sfx.wav', SR, (sfx * 32767).astype(np.int16))
mix = norm(music + sfx, 0.89)
wavfile.write('mix.wav', SR, (mix * 32767).astype(np.int16))
print('ok')
