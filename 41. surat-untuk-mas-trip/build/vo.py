"""Voice-over for Video 2, one clip per subtitle cue, plus the timing that syncs the animation to it.

  python3 vo.py guide   → ../audio/guide/*.wav made with macOS `say` (Damayanti) as a stand-in voice
  python3 vo.py         → timing.json from whatever VO is present

Each scene's narration is split into the same cues as its SUBS list. When the real ElevenLabs files
(../audio/vo2_s<n>_*.mp3) exist they are used whole and the cue times are found from their pauses;
otherwise the guide clips are joined with the pauses written below.
"""
import glob
import json
import os
import subprocess
import sys

import numpy as np
from scipy.io import wavfile

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
AUD = os.path.join(HERE, '../audio')
GUIDE = os.path.join(AUD, 'guide')
_WP = os.path.join(HERE, 'vo_words.json')            # word timestamps from transcribe.py
WORDS = json.load(open(_WP)) if os.path.exists(_WP) else {}

# (subtitle text, spoken text or None, pause after in seconds)
CUES = {
    1: [('Kamu tiap hari lewat Jalan Mastrip.', None, 0.3),
        ('Tahu itu nama siapa?', None, 0.6),
        ('Mas, aku Rara.', None, 0.15),
        ('Aku nulis surat ini dari Surabaya, tahun 2026.', 'Aku nulis surat ini dari Surabaya, tahun dua ribu dua puluh enam.', 0.3),
        ('Aku kelas sebelas.', None, 0.25),
        ('Kalau Mas ada di sini, mungkin kita seumuran.', None, 0)],
    2: [('Di buku sejarah, nama kalian TRIP:', 'Di buku sejarah, nama kalian, Trip.', 0.15),
        ('Tentara Republik Indonesia Pelajar.', None, 0.6),
        ('Juli 1946, anak-anak SMP dan SMA di Jawa Timur', 'Juli sembilan belas empat puluh enam, anak-anak es em pe dan es em a di Jawa Timur', 0.1),
        ('meninggalkan bangku sekolah untuk menjaga republik yang umurnya belum genap setahun.', None, 0.3),
        ('Tiap pagi aku lewat jalan yang pakai nama kalian,', None, 0.1),
        ('dan baru minggu lalu aku tahu artinya.', None, 0)],
    3: [('Tahun itu juga, tanggal tiga puluh Oktober,', None, 0.1),
        ('republik untuk pertama kali memakai uangnya sendiri:', None, 0.25),
        ('Oeang Republik Indonesia.', 'Uang Republik Indonesia.', 0.6),
        ('Dengan uang itu, kita tidak lagi bergantung pada uang peninggalan penjajah.', None, 2.6),   # the long silence
        ('Uang itu sekarang namanya Rupiah.', None, 0)],
    4: [('Jadi ini caraku menjaganya, Mas.', None, 0.3),
        ('Uang kertas di dompetku nggak aku lipat-lipat atau remas.', None, 0.2),
        ('Kalau terima kembalian, aku cek dulu:', None, 0.2),
        ('dilihat, diraba, diterawang.', 'dilihat, [[slnc 350]] diraba, [[slnc 350]] diterawang.', 0.6),
        ('Di warung dekat sekolah, aku bayar pakai Rupiah,', None, 0.1),
        ('kadang tunai, kadang scan QRIS.', 'kadang tunai, kadang sken kiuris.', 0)],
    5: [('Medan perangku beda sama Mas.', None, 0.25),
        ('Ancamannya datang lewat HP.', 'Ancamannya datang lewat ha pe.', 0.5),
        ('Ada link hadiah dari undian yang nggak pernah aku ikuti.', None, 0.1),
        ('Ada yang minta kode OTP.', 'Ada yang minta kode o te pe.', 0.1),
        ('Ada diskon yang muncul jam dua pagi.', None, 0.6),
        ('Kode OTP nggak aku kasih ke siapa pun.', 'Kode o te pe nggak aku kasih ke siapa pun.', 0.2),
        ('Sebelum scan, aku cek nama merchant-nya.', 'Sebelum sken, aku cek nama merchen-nya.', 0.2),
        ('Sebelum checkout, aku tanya diri sendiri:', 'Sebelum cek aut, aku tanya diri sendiri:', 0.35),
        ('butuh, atau cuma pengin?', None, 0)],
    6: [('Mas, aku nggak perlu angkat senjata.', None, 0.3),
        ('Yang aku jaga lebih kecil:', None, 0.15),
        ('uang di saku sendiri, dan kepercayaan orang pada uang itu.', None, 0.6),
        ('Surat ini aku tulis di Jalan Mastrip.', None, 0.3),
        ('Hormat dari pelajar tahun 2026.', 'Hormat, dari pelajar tahun dua ribu dua puluh enam.', 0)],
}


def load(path):
    """Any audio file → mono float32 at SR."""
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def trim(x, thr=0.01):
    idx = np.nonzero(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    return x[max(0, idx[0] - int(0.02 * SR)): idx[-1] + int(0.06 * SR)]


def make_guide():
    os.makedirs(GUIDE, exist_ok=True)
    for n, cues in CUES.items():
        for i, (sub, spoken, _) in enumerate(cues):
            aiff = os.path.join(GUIDE, f's{n}_{i}.aiff')
            subprocess.run(['say', '-v', 'Damayanti', '-r', '172', '-o', aiff, spoken or sub], check=True)
            x = trim(load(aiff))
            os.remove(aiff)
            wavfile.write(os.path.join(GUIDE, f's{n}_{i}.wav'), SR, (x * 32767).astype(np.int16))


def guide_spans(n):
    spans, t = [], 0.0
    for i, (_, _, gap) in enumerate(CUES[n]):
        sr, c = wavfile.read(os.path.join(GUIDE, f's{n}_{i}.wav'))
        spans.append((t, t + len(c) / SR))
        t += len(c) / SR + gap
    return spans, t - CUES[n][-1][2]


# extra silence inserted before a cue (scene, cue index): seconds of pause wanted in total
HOLD = {(3, 4): 3.0}       # the silence before "Uang itu sekarang namanya Rupiah"


def scene_vo(n):
    """(mono VO for the scene starting at its first cue, [(start, end)] per cue, [(word, start, end)])."""
    real = glob.glob(os.path.join(AUD, f'vo2_s{n}_*.mp3'))
    if real:
        x = trim(load(real[0]))
        gs, gl = guide_spans(n)
        spans = split_by_pauses(x, [a / gl for a, _ in gs[1:]])
        words = [tuple(w) for w in WORDS.get(str(n), [])]
        for (sn, ci), want in sorted(HOLD.items(), reverse=True):
            if sn != n:
                continue
            gap = spans[ci][0] - spans[ci - 1][1]
            add = max(0.0, want - gap)
            at = (spans[ci - 1][1] + spans[ci][0]) / 2
            i = int(at * SR)
            x = np.concatenate([x[:i], np.zeros(int(add * SR), np.float32), x[i:]])
            spans = [(a + add * (a >= at), b + add * (b > at)) for a, b in spans]
            words = [(w, a + add * (a >= at), b + add * (b > at)) for w, a, b in words]
        return x, spans, words
    parts = []
    for i, (_, _, gap) in enumerate(CUES[n]):
        sr, c = wavfile.read(os.path.join(GUIDE, f's{n}_{i}.wav'))
        parts += [c.astype(np.float32) / 32767, np.zeros(int(gap * SR), np.float32)]
    return np.concatenate(parts), guide_spans(n)[0], []


def pauses(x, thr=0.012, min_len=0.04):
    """[(start, end)] of quiet runs inside the speech, in seconds."""
    hop = int(0.01 * SR)
    e = np.sqrt(np.convolve(x ** 2, np.ones(hop * 3) / (hop * 3), 'same')[::hop])
    quiet = e < thr
    out, i = [], 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]:
                j += 1
            if i > 0 and j < len(quiet) and (j - i) * 0.01 >= min_len:
                out.append((i * 0.01, j * 0.01))
            i = j
        else:
            i += 1
    return out


def split_by_pauses(x, fracs):
    """Cue spans for a whole-file VO. fracs: where each later cue should start, as a fraction of the file
    (from the guide voice). Each boundary takes a pause near that spot, longer pauses preferred, in order."""
    L = len(x) / SR
    cands = pauses(x)
    exp = [f * L for f in fracs]
    k, m = len(exp), len(cands)
    INF = 1e9

    def cost(b, c):
        a, e = cands[c]
        return abs((a + e) / 2 - exp[b]) - 1.5 * (e - a)

    best = [[INF] * m for _ in range(k)]
    back = [[-1] * m for _ in range(k)]
    for c in range(m):
        best[0][c] = cost(0, c)
    for b in range(1, k):
        run, arg = INF, -1
        for c in range(m):
            if c > 0 and best[b - 1][c - 1] < run:
                run, arg = best[b - 1][c - 1], c - 1
            if arg >= 0:
                best[b][c] = run + cost(b, c)
                back[b][c] = arg
    c = int(np.argmin(best[k - 1]))
    pick = []
    for b in range(k - 1, -1, -1):
        pick.append(cands[c])
        c = back[b][c]
    pick.reverse()
    bounds = [0.0] + [v for a, e in pick for v in (a, e)] + [L]
    return [(bounds[2 * i], bounds[2 * i + 1]) for i in range(k + 1)]


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'guide':
        make_guide()
    out = {}
    for n in CUES:
        x, spans, words = scene_vo(n)
        out[n] = {'spans': spans, 'len': len(x) / SR, 'words': words}
        wavfile.write(os.path.join(HERE, f'vo_s{n}.wav'), SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
    json.dump(out, open(os.path.join(HERE, 'vo_timing.json'), 'w'), indent=1)
    for n, v in out.items():
        print(n, round(v['len'], 2), [tuple(round(a, 2) for a in s) for s in v['spans']])
