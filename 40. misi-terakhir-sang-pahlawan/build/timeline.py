"""Edit timeline: per-scene time remaps that close dead air between voice-over lines.

Each scene's anchors map NEW local time -> ORIGINAL local time (piecewise linear), so the
original animation is sped up only where nothing is being said.
"""
import numpy as np

OLD_DUR = [15.0, 15.0, 20.0, 25.0, 20.0, 20.0, 20.0, 15.0]
ANCHORS = [
    [(0, 0), (2.0, 2.0), (2.89, 3.01), (6.56, 6.95), (8.07, 8.56), (9.23, 9.79), (10.59, 11.25), (13.36, 14.32), (14.04, 15.0)],
    [(0, 0), (0.1, 0.1), (0.88, 0.82), (3.63, 3.67), (4.96, 4.99), (8.05, 8.18), (8.87, 9.0), (10.87, 11.6), (12.42, 13.98), (13.2, 15.0)],
    [(0, 0), (0.2, 0.2), (3.89, 4.26), (4.94, 5.45), (8.69, 9.63), (12.7, 14.07), (13.72, 15.0), (13.96, 15.51), (15.04, 19.09), (15.43, 20.0)],
    [(0, 0), (1.13, 1.16), (3.77, 4.09), (5.65, 6.19), (9.85, 11.02), (11.44, 12.76), (13.75, 15.34), (14.44, 16.0), (15.6, 22.3), (17.43, 25.0)],
    [(0, 0), (0.68, 0.78), (3.47, 4.57), (10.32, 12.82), (10.69, 13.2), (11.47, 13.99), (14.78, 18.37), (15.82, 19.64), (16.08, 20.0)],
    [(0, 0), (0.6, 0.72), (3.66, 3.29), (3.91, 3.5), (5.58, 4.8), (5.84, 5.0), (7.22, 6.2), (7.44, 6.4), (9.82, 9.53), (12.35, 12.89), (12.43, 13.0), (14.4, 15.0), (14.97, 16.53), (15.2, 17.1), (16.25, 18.5), (17.3, 19.4), (17.91, 19.9), (18.03, 20.0)],
    [(0, 0), (0.68, 0.54), (3.41, 2.67), (3.6, 2.8), (5.0, 3.94), (7.64, 6.14), (9.39, 7.51), (10.33, 8.4), (11.89, 12.0), (12.38, 12.62), (12.89, 13.2), (14.74, 15.46), (16.09, 17.3), (16.84, 18.41), (17.64, 19.52), (17.81, 19.8), (17.99, 20.0)],
    [(0, 0), (2.6, 3.0), (2.64, 3.04), (3.61, 3.8), (6.6, 6.1), (6.98, 6.4), (8.19, 7.21), (9.9, 8.37), (12.31, 9.99), (12.56, 10.2), (14.52, 11.9), (15.12, 12.53), (15.39, 12.8), (16.37, 13.7), (17.73, 14.06), (18.87, 14.3), (19.87, 15.0)],
]
NEW_DUR = [a[-1][0] for a in ANCHORS]
OLD_START = np.concatenate([[0], np.cumsum(OLD_DUR)])
NEW_START = np.concatenate([[0], np.cumsum(NEW_DUR)])

# voice-over start times on the NEW timeline (absolute seconds)
VO_START = {1: 2.0, 2: 14.14, 3: 27.44, 4: 42.28, 5: 59.44, 6: 75.64, 7: 94.89, 8: 111.85}


def local_old(k, t_new):
    a = ANCHORS[k]
    return float(np.interp(t_new, [p[0] for p in a], [p[1] for p in a]))


_G_OLD, _G_NEW = [], []
for k, a in enumerate(ANCHORS):
    for n, o in a:
        _G_OLD.append(OLD_START[k] + o)
        _G_NEW.append(NEW_START[k] + n)


def remap_abs(t_old):
    """Original absolute time -> new absolute time (for audio cues)."""
    return float(np.interp(t_old, _G_OLD, _G_NEW))


TOTAL = float(NEW_START[-1])


class Remap:
    def __init__(self, k, scene):
        self.k, self.sc = k, scene
        self.dur = NEW_DUR[k]

    def frame(self, t):
        return self.sc.frame(local_old(self.k, t))
