"""Render Video 2 scenes.

  python3 render.py video <n> <out.mp4>
  python3 render.py stills <n> <outdir> t1,t2,...

Set NOSUB=1 to render without burned-in subtitles.
"""
import os
import subprocess
import sys

import numpy as np

from buku import Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, W, H
from timing import anchors, subtitle_cues
from buku import subtitle

FPS = 30


SCENES = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7]


class Timed:
    """A scene played on the voice-over's clock (see timing.py)."""

    def __init__(self, sc, n):
        self.sc = sc
        self.R, self.E = anchors(n)
        self.dur = float(self.R[-1])
        self.subs = [] if os.environ.get('NOSUB') else subtitle_cues(n)
        sc.SUBS = []                      # the scene's own (authored-clock) subtitles are replaced

    def frame(self, t):
        img = self.sc.frame(float(np.interp(t, self.R, self.E)))
        if not self.subs:
            return img
        img = img.convert('RGBA')
        subtitle(img, t, self.subs)
        return img.convert('RGB')


def scene(n):
    """Each scene opens with a page turn off the previous scene's last frame."""
    sc = Timed(Scene1(), 1)
    for k, cls in enumerate(SCENES[1:n], start=2):
        sc = Timed(cls(sc.frame(sc.dur - 1 / FPS).convert('RGBA')), k)
    return sc


def main():
    mode, n = sys.argv[1], int(sys.argv[2])
    sc = scene(n)
    if mode == 'stills':
        os.makedirs(sys.argv[3], exist_ok=True)
        for ts in sys.argv[4].split(','):
            sc.frame(float(ts)).save(os.path.join(sys.argv[3], f's{n}_{float(ts):05.2f}.jpg'), quality=85)
        return
    p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                          '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                          '-pix_fmt', 'yuv420p', sys.argv[3]], stdin=subprocess.PIPE)
    for i in range(int(round(sc.dur * FPS))):
        p.stdin.write(sc.frame(i / FPS).tobytes())
    p.stdin.close()
    p.wait()


if __name__ == '__main__':
    main()
