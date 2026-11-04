"""Pasang rekaman dialog (animasi/suara/dialog/KODE.mp3) ke animasi.
- rapikan hening awal/akhir, samakan volume
- taruh tiap suara saat balonnya muncul (+0,15 dtk)
- jika suara lebih panjang dari balon: perpanjang balon; bila menabrak baris berikutnya, geser baris berikutnya
- hasil: animasi/suara/dialog.m4a (satu trek sepanjang video) + waktu balon baru di index.html"""
import re, sys, subprocess, wave
from pathlib import Path
import numpy as np

PROJ = Path(sys.argv[1]); WORK = Path(sys.argv[2]); WORK.mkdir(parents=True, exist_ok=True)
AN = PROJ / 'animasi'; DLG = AN / 'suara' / 'dialog'
SR = 44100
html = (AN / 'index.html').read_text(encoding='utf-8')
SEGS = eval(re.search(r'const SEGS=(\[\[.*?\]\])', html).group(1))
DUR_REAL = 262 + sum(x[2] for x in SEGS)

def to_orig(r):
    sh = 0
    for a, b, add in SEGS:
        ra, rb = a + sh, b + sh + add
        if r < ra: return r - sh
        if r < rb: return a + (r - ra) * (b - a) / (b - a + add)
        sh += add
    return r - sh

pat = re.compile(r"(  \{who:'(\w+)'(?:,vo:1|,whisper:1)?,a:)([\d.]+),b:([\d.]+)(,text:'([^']*)'\},   // ([A-Z]\d\d) )([\d.]+)-([\d.]+)( dtk)")
L = [dict(m=m, who=m[2], text=m[6], code=m[7], ra=float(m[8]), rb=float(m[9])) for m in pat.finditer(html)]
assert len(L) == 41, len(L)

def load(code):
    f = DLG / f'{code}.mp3'
    if not f.exists(): return None
    out = WORK / f'{code}.wav'
    # buang hening awal & akhir (< -45 dB), mono 44,1 kHz
    flt = ('silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,'
           'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(f), '-af', flt, '-ac', '1', '-ar', str(SR), str(out)], check=True)
    with wave.open(str(out)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    rms = np.sqrt(np.mean(x ** 2)) or 1e-4
    x = x * (0.12 / rms)                       # samakan kerasnya suara antar-baris
    pk = np.abs(x).max()
    if pk > .95: x *= .95 / pk
    return x

report = []
for i, l in enumerate(L):
    l['clip'] = load(l['code'])
for i, l in enumerate(L):
    c = l['clip']
    if c is None: continue
    d = len(c) / SR
    need = l['ra'] + .15 + d + .35                      # balon tetap tampil sebentar setelah suara selesai
    old = l['rb']
    if need > l['rb']: l['rb'] = round(need, 2)
    if i + 1 < len(L) and l['rb'] > L[i + 1]['ra'] - .1:     # menabrak baris berikutnya -> geser baris berikutnya
        n = L[i + 1]; shift = round(l['rb'] + .1 - n['ra'], 2)
        n['ra'] = round(n['ra'] + shift, 2); n['rb'] = round(max(n['rb'], n['ra'] + len(n['text'].split()) / 2.3 + .6), 2)
        report.append(f"{n['code']} digeser +{shift} dtk")
    report.append(f"{l['code']}: suara {d:.2f} dtk, balon {old - l['ra']:.1f} -> {l['rb'] - l['ra']:.1f} dtk")
for i in range(len(L) - 1):
    if L[i]['rb'] > L[i + 1]['ra'] + .01: report.append(f"PERHATIAN tumpang tindih {L[i]['code']}-{L[i+1]['code']}")

# tulis waktu balon baru
out = []; pos = 0
for l in L:
    m = l['m']; out.append(html[pos:m.start()])
    out.append(f"{m[1]}{round(to_orig(l['ra']),2)},b:{round(to_orig(l['rb']),2)}{m[5]}{l['ra']}-{l['rb']}{m[10]}")
    pos = m.end()
out.append(html[pos:]); (AN / 'index.html').write_text(''.join(out), encoding='utf-8')

# satu trek dialog sepanjang video
mix = np.zeros(int(DUR_REAL * SR), dtype=np.float32)
for l in L:
    if l['clip'] is None: continue
    s0 = int((l['ra'] + .15) * SR); seg = l['clip'][:len(mix) - s0]; mix[s0:s0 + len(seg)] += seg
with wave.open(str(WORK / 'dialog.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(WORK / 'dialog.wav'), '-c:a', 'aac', '-b:a', '128k', str(AN / 'suara' / 'dialog.m4a')], check=True)
have = [l['code'] for l in L if l['clip'] is not None]
print(f'suara terpasang: {len(have)}/41 ->', ' '.join(have))
print('\n'.join(report))
