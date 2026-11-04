"""Campur musik latar (Pixabay) mengikuti adegan, lalu kecilkan otomatis saat ada dialog (ducking).
Berkas di animasi/suara/musik/ (unduhan Pixabay, nama asli), dipetakan di CUES.
Waktu cue ditulis dalam waktu linimasa (sama seperti render(t)), diubah ke waktu nyata lewat SEGS di index.html.
Hasil: animasi/suara/musik.m4a (panjang = durasi video).
Pakai:  python3 animasi/alat/musik.py <folder-proyek>"""
import re, subprocess, sys
from pathlib import Path
import numpy as np

PROJ = Path(sys.argv[1]); A = PROJ / 'animasi'; SR = 44100
s = (A / 'index.html').read_text(encoding='utf-8')
SEGS = eval(re.search(r'const SEGS=(\[\[.*?\]\])', s).group(1))
DUR_REAL = 262 + sum(x[2] for x in SEGS)

def RW(o):
    sh = 0
    for a, b, add in SEGS:
        if o < a: return o + sh
        if o < b: return a + sh + (o - a) * (b - a + add) / (b - a)
        sh += add
    return o + sh

# (berkas, mulai, selesai, fade masuk, fade keluar, tambahan dB); waktu linimasa, fade dalam detik nyata
CUES = [('bombinsound-happy-ukulele*',   0.0,  21.0, 1.0, 2.5,  0),   # pembuka; memudar saat masuk kelas
        ('atlasaudio-modern-classical*', 21.0,  45.0, 2.0, 1.0, -6),   # kelas: pelan, berhenti saat waktu berhenti
        ('bombinsound-happy-ukulele*',  55.0, 185.0, 2.0, 2.0,  0),   # Bandi & Lela muncul -> tugu, tambak, pesisir
        ('fassounds-spirit-of-bali*',  185.0, 215.0, 1.5, 2.0,  0),   # kuliner / pasar
        ('the_mountain-hopeful*',      215.0, 262.0, 2.0, 4.0,  0)]   # kembali ke kelas, senja, kredit

LEVEL_DB, DUCK_DB = -24.0, -9.0                  # tingkat musik (RMS dBFS) dan pengurangan saat dialog

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()

def find(name):
    for p in sorted((A / 'suara' / 'musik').glob(name)):
        return p
    sys.exit(f'Berkas musik belum ada: animasi/suara/musik/{name}')

def looped(x, n, xf=int(1.0 * SR)):
    """ulang lagu sampai n sampel, sambungan disilang-pudar 1 dtk supaya tidak ada letupan"""
    if len(x) >= n: return x[:n]
    out = x.copy(); r = np.linspace(0, 1, xf, dtype=np.float32)[:, None]
    while len(out) < n:
        out = np.concatenate([out[:-xf], out[-xf:] * (1 - r) + x[:xf] * r, x[xf:]])
    return out

N = int(DUR_REAL * SR) + SR
out = np.zeros((N, 2), np.float32)
pos = {}                                          # lagu yang dipakai lagi melanjutkan dari posisi terakhir
cache = {}
for name, a, b, fi, fo, db in CUES:
    if name not in cache:
        x = load(find(name)); cache[name] = x * (10 ** (LEVEL_DB / 20) / (np.sqrt(np.mean(x ** 2)) + 1e-9))
    r0, r1 = int(RW(a) * SR), int(RW(b) * SR); n = r1 - r0
    st = pos.get(name, 0); full = looped(cache[name], st + n)   # diulang bila lagu lebih pendek
    seg = full[st:st + n] * 10 ** (db / 20); pos[name] = (st + n) % len(cache[name])
    env = np.ones(n, np.float32)
    k = int(fi * SR); env[:k] = np.linspace(0, 1, k)
    k = int(fo * SR); env[-k:] = np.minimum(env[-k:], np.linspace(1, 0, k))
    out[r0:r1] += seg * env[:, None]

# ducking: ikuti selubung suara dialog
d = load(A / 'suara' / 'dialog.m4a').mean(1)
w = int(.05 * SR); m = len(d) // w
rms = np.sqrt(np.mean(d[:m * w].reshape(m, w) ** 2, 1))
on = (rms > 10 ** (-45 / 20)).astype(np.float32)
g = np.zeros(m, np.float32); cur = 0.0
for i, v in enumerate(on):                        # cepat turun (0,15 dtk), pelan naik (0,6 dtk)
    cur += (v - cur) * (.33 if v > cur else .08); g[i] = cur
gain = 10 ** (DUCK_DB * g / 20)
gs = np.ones(N, np.float32); L = min(N, m * w); gs[:L] = np.repeat(gain, w)[:L]
out *= gs[:, None]
out = np.clip(out[:int(DUR_REAL * SR)], -1, 1)

dst = A / 'suara' / 'musik.m4a'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                '-c:a', 'aac', '-b:a', '160k', str(dst)], input=out.tobytes(), check=True)
print(f'musik.m4a dibuat ({DUR_REAL:.1f} dtk)')
for name, a, b, *_ in CUES: print(f'  {name:32s} {RW(a):6.1f} - {RW(b):6.1f} dtk')
