"""Padatkan waktu video berdasarkan panjang suara dialog (menghilangkan 'dead air').
- tiap balon dialog tampil sepanjang suaranya + 0,5 dtk (0,15 sebelum suara, 0,35 sesudahnya)
- jeda antar-dialog: default 0,5 dtk; momen visual penting diberi jeda khusus (GAP)
- layar akhir mulai 0,6 dtk setelah dialog terakhir; kredit diputar 1:1
Menulis ulang SEGS (pemetaan waktu linimasa -> waktu nyata) dan waktu nyata tiap baris di index.html.
Pakai:  python3 animasi/alat/padatkan.py <folder-proyek> <folder-kerja-pasang_dialog>
Lalu jalankan lagi pasang_dialog.py dan efek.py."""
import re, sys, wave
from pathlib import Path

PROJ = Path(sys.argv[1]); WORK = Path(sys.argv[2])
p = PROJ / 'animasi' / 'index.html'; s = p.read_text(encoding='utf-8')
pat = re.compile(r"(\{who:'\w+'(?:,vo:1|,whisper:1)?,a:)([\d.]+),b:([\d.]+)(,text:'[^']*'\},   // ([A-Z]\d\d) )[\d.]+-[\d.]+( dtk)")

# jeda (detik nyata) sebelum baris ini dimulai, dihitung dari selesainya baris sebelumnya
GAP = {'B01': 7.0,            # intro: logo PGRI + judul
       'G01': 2.5,            # tirai gelembung + kelas
       'K01': 1.6,            # kamera berputar ke murid
       'L01': 4.0,            # akuarium bercahaya, waktu berhenti, Lela melompat
       'K04': 3.0,            # kilatan putih, tiba di tugu
       'K05': .6, 'L04': 2.5,  # pindah ke tambak
       'B08': .8, 'L05': 2.8,  # pindah ke pesisir
       'B11': 2.8,            # pindah ke pasar
       'B12': .8, 'B13': .8, 'K09': .8, 'B14': .6, 'B15': .6,
       'K10': .8,             # spanduk pecel lele berkedip
       'K11': 2.8,            # kilatan putih, pulang ke kelas, buku stempel
       'L07': 1.0,            # kamera berputar ke akuarium
       'K13': 1.6}            # tirai gelembung ke senja

L = []
for m in pat.finditer(s):
    with wave.open(str(WORK / f'{m[5]}.wav')) as w: d = w.getnframes() / w.getframerate()
    L.append(dict(code=m[5], a=float(m[2]), b=float(m[3]), d=d))
assert len(L) == 41, len(L)

knots = [(0.0, 0.0)]; r = 0.0
for i, l in enumerate(L):
    ra = max((r + GAP.get(l['code'], .5)) if i else GAP.get(l['code'], .5), knots[-1][1] + .05)
    knots.append((l['a'], round(ra, 3)))
    r = ra + .15 + l['d'] + .35
    knots.append((l['b'], round(r, 3)))
knots.append((252.2, round(r + .6, 3))); knots.append((262.0, round(r + .6 + 9.8, 3)))

SEGS = []
for (o1, r1), (o2, r2) in zip(knots, knots[1:]):
    add = round((r2 - r1) - (o2 - o1), 3)
    if abs(add) > .005: SEGS.append([round(o1, 3), round(o2, 3), add])

def RW(o):
    sh = 0
    for a, b, add in SEGS:
        if o < a: return o + sh
        if o < b: return a + sh + (o - a) * (b - a + add) / (b - a)
        sh += add
    return o + sh

s = s.replace(re.search(r'const SEGS=\[\[.*?\]\]', s).group(0), 'const SEGS=' + str(SEGS).replace(' ', ''), 1)
s, n = pat.subn(lambda m: f"{m[1]}{m[2]},b:{m[3]}{m[4]}{round(RW(float(m[2])), 2)}-{round(RW(float(m[3])), 2)}{m[6]}", s)
assert n == 41
p.write_text(s, encoding='utf-8')
total = 262 + sum(x[2] for x in SEGS)
print(f'total {int(total // 60)}:{total % 60:04.1f}  (B01 mulai {RW(15.6):.1f} dtk)')
