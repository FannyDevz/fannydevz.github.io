"""Efek suara + suasana (ambience) buatan sendiri untuk seluruh video.
Semua bunyi disintesis dengan kode, jadi bebas lisensi.
Pakai:  python3 animasi/alat/efek.py <folder-proyek> <folder-kerja-sementara>
Hasil:  animasi/suara/efek.m4a
Waktu kejadian ditulis dalam WAKTU LINIMASA (sama dengan index.html); bagian yang diregangkan
(SEGS) dibaca langsung dari index.html supaya selalu cocok."""
import re, sys, wave, subprocess
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

PROJ = Path(sys.argv[1]); WORK = Path(sys.argv[2]); WORK.mkdir(parents=True, exist_ok=True)
SR = 44100
_html = (PROJ / 'animasi' / 'index.html').read_text(encoding='utf-8')
SEGS = [tuple(x) for x in eval(re.search(r'const SEGS=(\[\[.*?\]\])', _html).group(1))]
DUR = 262 + sum(x[2] for x in SEGS)          # durasi nyata video
rng = np.random.default_rng(11)
out = np.zeros(int(DUR * SR))

def RW(o):   # waktu linimasa -> waktu nyata
    sh = 0
    for a, b, add in SEGS:
        if o < a: return o + sh
        if o < b: return a + sh + (o - a) * (b - a + add) / (b - a)
        sh += add
    return o + sh

def T(d): return np.arange(int(d * SR)) / SR
def put(s, at, v=1.0): put_r(s, RW(at), v)
def put_r(s, at, v=1.0):
    i = int(at * SR); j = min(len(out), i + len(s))
    if i < len(out): out[i:j] += v * s[:j - i]
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def fade(x, a=.01, r=.05):
    x = x.copy(); na, nr = int(a * SR), int(r * SR)
    if na: x[:na] *= np.linspace(0, 1, na)
    if nr: x[-nr:] *= np.linspace(1, 0, nr)
    return x
def norm(x, p=1.0): return x / (np.abs(x).max() or 1) * p
def sweep(f0, f1, d, curve=1.0):
    t = T(d); f = f0 + (f1 - f0) * (t / d) ** curve
    return np.sin(2 * np.pi * np.cumsum(f) / SR)

# ---------- bunyi dasar ----------
def bell(f, d=1.4):
    t = T(d); x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-k * t) for m, a, k in [(1, 1, 3), (2.76, .4, 6), (5.4, .2, 9)])
    return fade(norm(x), .002, .05)
def ting(f=1760): return bell(f, 1.2) + .3 * np.pad(bell(f * 1.5, .8), (0, int(1.2 * SR) - int(.8 * SR)))
def bubble(f0=None):
    f0 = f0 or rng.uniform(350, 750); d = .09
    return fade(sweep(f0, f0 * 3.2, d) * np.exp(-30 * T(d)), .002, .01)
def pop(): d = .12; return fade(norm(sweep(900, 250, d, .5) * np.exp(-25 * T(d)) + .4 * hp(rng.standard_normal(len(T(d))), 2000) * np.exp(-80 * T(d))), .001, .02)
def whoosh(d=.7, up=True):
    n = rng.standard_normal(int(d * SR)); t = T(d)
    a, b = (300, 2500) if up else (2500, 300)
    segs = 8; y = np.zeros_like(n); L = len(n) // segs
    for k in range(segs):
        c = a + (b - a) * k / (segs - 1)
        y[k * L:(k + 1) * L] = bp(n, c * .6, min(c * 1.6, SR / 2 - 100))[k * L:(k + 1) * L]
    return norm(lp(y, 6000) * np.sin(np.pi * t / d) ** 2)
def boing(): d = .6; t = T(d); f = 170 * (1 + .35 * np.sin(2 * np.pi * 14 * t) * np.exp(-5 * t)) * (1 + .7 * t); return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-4 * t), .003, .05)
def bonk(): d = .25; t = T(d); return norm(np.sin(2 * np.pi * 120 * t) * np.exp(-18 * t) + .6 * lp(rng.standard_normal(len(t)), 1500) * np.exp(-40 * t))
def stamp():
    d = .3; t = T(d); thump = np.sin(2 * np.pi * (90 + 60 * np.exp(-30 * t)) * t) * np.exp(-14 * t)
    click = hp(rng.standard_normal(len(t)), 1500) * np.exp(-90 * t)
    return norm(thump + .5 * click)
def tick(): d = .03; t = T(d); return norm(bp(rng.standard_normal(len(t)), 2500, 6000) * np.exp(-200 * t) + .5 * np.sin(2 * np.pi * 1800 * t) * np.exp(-150 * t))
def shimmer(up=True, d=1.4):
    x = np.zeros(int(d * SR)); notes = [1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637]
    if not up: notes = notes[::-1]
    for k, f in enumerate(notes):
        b = bell(f, .9) * .5; i = int(k * d / len(notes) * .8 * SR); x[i:i + len(b)] += b[:len(x) - i]
    return norm(x)
def splash(big=True):
    d = .9 if big else .45; t = T(d); n = rng.standard_normal(len(t))
    y = norm(lp(n, 4000) * np.exp(-(5 if big else 9) * t) + .5 * hp(n, 3000) * np.exp(-12 * t))
    for _ in range(10 if big else 4):
        b = bubble(rng.uniform(300, 600)) * .4; i = int(rng.uniform(.05, d * .7) * SR); y[i:i + len(b)] += b[:len(y) - i]
    return norm(y)
def gulp(): d = .22; t = T(d); return fade(sweep(420, 140, d, .7) * np.exp(-6 * t), .005, .04)
def chirp():
    x = np.zeros(0)
    for _ in range(rng.integers(2, 5)):
        d = rng.uniform(.06, .12); t = T(d); f0 = rng.uniform(2800, 4200)
        f = f0 * (1 + .25 * np.sin(2 * np.pi * rng.uniform(25, 45) * t)) * (1 - .3 * t / d)
        x = np.concatenate([x, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d), np.zeros(int(rng.uniform(.03, .08) * SR))])
    return x
def gull():
    d = .5; t = T(d); f = 1250 - 500 * (t / d) ** .6
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + .4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return fade(s * np.sin(np.pi * t / d) ** .5, .01, .08)
def clap(): d = .05; t = T(d); return bp(rng.standard_normal(len(t)), 800, 5000) * np.exp(-70 * t)

# ---------- suasana (ambience); rentang dalam waktu linimasa ----------
def noise(d): return rng.standard_normal(int(d * SR))
def room(a, b, v=.05): a, b = RW(a), RW(b); put_r(norm(lp(noise(b - a), 400)) * v, a)
def wind(a, b, v=.07):
    a, b = RW(a), RW(b); d = b - a; t = T(d); put_r(fade(norm(bp(noise(d), 200, 900)) * (.6 + .4 * np.sin(2 * np.pi * .12 * t)), 1, 1) * v, a)
def waves(a, b, v=.16):
    a, b = RW(a), RW(b); d = b - a; t = T(d); sw = (.35 + .65 * (.5 + .5 * np.sin(2 * np.pi * t / 6.5 - 1.5)) ** 2)
    put_r(fade(norm(lp(noise(d), 1400)) * sw, 1, 1) * v, a)
def water(a, b, v=.05):
    a, b = RW(a), RW(b); d = b - a
    put_r(fade(norm(bp(noise(d), 1500, 5000)) * (.7 + .3 * np.sin(2 * np.pi * 1.7 * T(d))), 1, 1) * v * .5, a)
    for t0 in np.arange(a, b, .35): put_r(bubble(rng.uniform(500, 900)), t0 + rng.uniform(0, .3), v * 1.2)
def market(a, b, v=.08):
    a, b = RW(a), RW(b); d = b - a; t = T(d); m = bp(noise(d), 250, 1800); am = lp(rng.standard_normal(len(t)), 3) * 6 + 1
    put_r(fade(norm(m * np.clip(am, .3, 2)), 1, 1) * v, a)
    for t0 in np.arange(a + .5, b, 1.3): put_r(bell(rng.choice([2093, 2349, 2637]), .5) * .25, t0 + rng.uniform(0, 1), v)
def birds(a, b, every=2.5, v=.10):
    for t0 in np.arange(a + .5, b - 1, every): put(chirp(), t0 + rng.uniform(0, every * .6), v)
def ticks(a, b, v=.18):
    for t0 in np.arange(np.ceil(a), b, 1.0): put(tick(), t0, v)

# ================== TIMELINE (waktu linimasa, sama dengan index.html) ==================
# Adegan 1: pembuka bawah laut
for _ in range(30): put(bubble(), rng.uniform(.3, 18.5), .10)
put(ting(1568), 3.0, .40); put(whoosh(.6), 5.2, .14); put(ting(2093), 7.0, .25)
put(boing(), 13.45, .40); put(ting(2637), 13.5, .30)
# tirai gelembung antar-tempat
for w in [19.2, 119.2, 154.2, 184.2, 239.0]:
    put(whoosh(1.5), w - .1, .28)
    for k in range(14): put(bubble(300 + k * 45), w + k * .1, .16)
# Adegan 2-3: kelas
room(20, 75, .035); ticks(20, 46.6, .16)
for w in [30.95, 229.6, 233.9]: put(whoosh(.55), w, .30)          # kamera berputar
put(shimmer(True, 1.0), 43.8, .25)                               # Bandi mengedip
put(shimmer(True, 1.6), 45.0, .35)                               # akuarium bercahaya
put(shimmer(False, 1.2), 46.0, .30); put(whoosh(1.2, False), 46.0, .20)   # waktu berhenti
put(pop(), 49.2, .45); put(whoosh(.9), 49.3, .25); put(bonk(), 50.2, .55); put(boing(), 50.25, .35)
put(shimmer(True, .8), 50.4, .18); put(pop(), 51.6, .30)
put(ting(1976), 51.8, .20); put(pop(), 55.6, .35); put(ting(3136), 56.95, .12); put(ting(1976), 57.6, .20)
put(shimmer(True, 1.8), 66.4, .32)                               # gelembung ajaib terbentuk
put(whoosh(2.2), 70.4, .32); put(shimmer(True, 1.4), 72.3, .30)
# Adegan 4: tugu
put(splash(), 75.2, .35); wind(75, 120, .06); birds(78, 118, 4.5, .07)
put(pop(), 76.4, .20); put(pop(), 103, .20)
# Adegan 5: tambak
water(120, 155, .05); birds(121, 153, 2.2, .09)
put(pop(), 121.4, .20); put(boing(), 127.4, .25)
for tt, big in [(125.0, False), (126.3, False), (141.4, False), (142.7, False)]: put(splash(big), tt, .2)
put(whoosh(1.4), 130.6, .25); put(splash(), 132.2, .30)
for tt in [137, 138.3, 139, 140.3, 141]: put(pop(), tt, .18)
# Adegan 6: pesisir
waves(155, 185, .15)
for tt in [157, 163.5, 170, 176.5, 183]: put(gull(), tt, .10)
put(pop(), 156.4, .20); put(whoosh(1.6), 159.2, .25); put(splash(), 161.0, .40); put(boing(), 162.6, .40); put(pop(), 174.3, .20)
# Adegan 7: kuliner
market(185, 215, .07); put(pop(), 186.4, .20)
for tt in [194.0, 197.94, 201.89, 205.74]: put(ting(2093), tt, .30)   # tiap kartu makanan muncul
put(ting(1568), 209.7, .25); put(gulp(), 211.05, .40)              # spanduk pecel lele berkedip; Lela "glek"
put(shimmer(True, 1.2), 213.9, .30)
# Adegan 8: kembali ke kelas
put(splash(False), 215.4, .15); room(215, 239.8, .035); ticks(215, 229.9, .14); put(pop(), 215.6, .20)
put(ting(2637), 220.45, .15)
for tt in np.arange(230.3, 234.2, .045): put(clap(), tt + rng.uniform(-.02, .02), .10 * rng.uniform(.5, 1))
# Adegan 9: penutup
put(shimmer(True, 1.5), 248.0, .22); put(bell(1047, 2.5), 252.2, .18); put(bell(784, 2.5), 255.6, .15)
# stempel "cap!" tiap pemberhentian
for tt in [117, 151.6, 181.2, 213.62]: put(stamp(), tt, .55); put(ting(2637), tt + .05, .12)

# ---------- akhir ----------
ir = rng.standard_normal(int(.6 * SR)) * np.exp(-np.linspace(0, 8, int(.6 * SR))) * .02
mix = out + .15 * fftconvolve(out, ir, 'full')[:len(out)]
mix = mix / np.abs(mix).max() * .8
with wave.open(str(WORK / 'efek.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(WORK / 'efek.wav'), '-c:a', 'aac', '-b:a', '128k', str(PROJ / 'animasi' / 'suara' / 'efek.m4a')], check=True)
print('ok', round(DUR, 1), 'dtk')
