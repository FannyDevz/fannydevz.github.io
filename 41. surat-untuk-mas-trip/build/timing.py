"""Sync each scene's animation to its voice-over.

Scenes are authored on estimated cue times (their SUBS). vo_timing.json holds the real cue spans.
remap(n) gives (real, est) anchor arrays: frame(t_real) = scene.frame(interp(t_real, real, est)).
"""
import json
import os

import numpy as np

from buku import Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7

CLASSES = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7]
VO = {int(k): v for k, v in json.load(open(os.path.join(os.path.dirname(__file__), 'vo_timing.json'))).items()}


# Authored moments pinned to a spoken word: scene → [(authored time, cue index, word)].
# 'word+0.6' pins 0.6 s after the word starts (to hold once a piece of writing is done).
BEATS = {
    1: [(16.6, 5, 'seumuran')],
    2: [(3.3, 1, 'tentara'), (3.92, 1, 'republik'), (4.54, 1, 'indonesia'), (5.16, 1, 'pelajar'),
        (7.2, 2, 'juli'), (7.9, 2, '1946+0.6'), (8.0, 2, 'anak'), (8.8, 2, 'sma'), (11.0, 3, 'meninggalkan'),
        (14.0, 3, 'belum')],
    3: [(1.0, 0, 'tanggal'), (5.4, 1, 'uangnya'), (11.8, 3, 'bergantung'), (18.6, 4, 'namanya')],
    4: [(4.8, 1, 'gak'), (9.3, 3, 'dilihat'), (10.4, 3, 'diraba'), (11.5, 3, 'diterawang'),
        (16.8, 5, 'tunai'), (18.0, 5, 'scan')],
    5: [(5.0, 2, 'ada'), (8.5, 3, 'ada'), (10.1, 4, 'ada'), (13.4, 5, 'kode'), (20.2, 8, 'butuh')],
    6: [(6.0, 2, 'kepercayaan'), (7.1, 2, 'pada'), (10.9, 4, 'hormat')],
}
# authored time by which each scene's last drawing is finished
LAST = {1: 17.5, 2: 21.0, 3: 20.0, 4: 19.7, 5: 22.0, 6: 12.6}
TAIL = 0.5          # seconds after the last word before the page turns
HOLD_GAP = 0.8      # a pause this long keeps its cue-end anchor (the scene waits out the silence)


def _norm(w):
    return ''.join(c for c in w.lower() if c.isalnum())


def anchors(n):
    cls = CLASSES[n - 1]
    if n not in VO:
        return np.array([0.0, cls.dur]), np.array([0.0, cls.dur])
    subs = cls.SUBS
    t0 = subs[0][0]                   # the voice starts where the first subtitle was planned
    spans = VO[n]['spans']
    words = VO[n].get('words', [])
    pts = []
    for i, ((es, ee, _), (rs, re)) in enumerate(zip(subs, spans)):
        pts.append((t0 + rs, es, 0))
        if i + 1 < len(spans) and spans[i + 1][0] - re >= HOLD_GAP:
            pts.append((t0 + re, ee, 0))
    for est, ci, w in BEATS.get(n, []):
        rs, re = spans[ci]
        pre, _, off = w.partition('+')
        hit = [a for x, a, _ in words if _norm(x).startswith(pre) and rs - 0.3 <= a <= re + 0.1]
        if hit:
            pts.append((t0 + hit[0] + float(off or 0), est, 1))
    if n > 1:
        pts.append((0.85, 0.85, 1))   # the opening page turn keeps its authored length
    # beats win over nearby cue anchors; keep both axes strictly increasing
    beats = [p for p in pts if p[2]]
    pts = beats + [p for p in pts if not p[2] and all(abs(p[0] - b[0]) > 0.15 for b in beats)]
    pts.sort()
    R, E = [0.0], [0.0]
    for r, e, _ in pts:
        if r > R[-1] + 0.02 and e > E[-1]:
            R.append(r)
            E.append(e)
    # finish the last drawing at authored speed, but never before the voice is done
    last = max(LAST.get(n, E[-1]), E[-1])
    r_end = max(t0 + spans[-1][1] + TAIL, R[-1] + (last - E[-1]) + 0.3)
    if last > E[-1]:
        R.append(r_end - 0.3)
        E.append(last)
    R.append(max(r_end, R[-1] + 0.3))
    E.append(cls.dur)
    return np.array(R), np.array(E)


def dur(n):
    return float(anchors(n)[0][-1])


def vo_start(n):
    return CLASSES[n - 1].SUBS[0][0] if n in VO else None


STARTS = np.cumsum([0.0] + [dur(n) for n in range(1, 8)])


def real_time(n, est):
    """Absolute time (whole film) of an authored moment in scene n."""
    R, E = anchors(n)
    return float(STARTS[n - 1] + np.interp(est, E, R))


def subtitle_cues(n):
    """Subtitles on the voice clock: on at the cue's first word, off when the next cue starts
    (or shortly after the voice, before a long pause)."""
    if n not in VO:
        return []
    subs, t0 = CLASSES[n - 1].SUBS, vo_start(n)
    spans, words = VO[n]['spans'], VO[n].get('words', [])
    starts = []
    for rs, re in spans:
        w = [a for _, a, _ in words if rs - 0.3 <= a <= re]
        starts.append(t0 + (w[0] if w else rs) - 0.05)
    out = []
    for i, ((_, _, txt), (rs, re)) in enumerate(zip(subs, spans)):
        end = t0 + re + 0.35
        if i + 1 < len(spans):
            end = min(end, starts[i + 1] - 0.03) if spans[i + 1][0] - re >= HOLD_GAP else starts[i + 1] - 0.03
        out.append((starts[i], end, txt))
    return out
