"""Render scenes to MP4 segments or stills.

  python3 render.py video <scene_no> <out.mp4>
  python3 render.py stills <scene_no> <outdir> t1,t2,...
"""
import os
import subprocess
import sys

from lib import FPS, W, H
from timeline import Remap
from collage import Scene1C, Scene2C
from collage2 import Scene3C, Scene4C, Scene5C, Scene6C, Scene7C, Scene8C

SCENES = [Scene1C, Scene2C, Scene3C, Scene4C, Scene5C, Scene6C, Scene7C, Scene8C]


def main():
    mode, n = sys.argv[1], int(sys.argv[2])
    sc = Remap(n - 1, SCENES[n - 1]())
    if mode == 'stills':
        os.makedirs(sys.argv[3], exist_ok=True)
        for ts in sys.argv[4].split(','):
            sc.frame(float(ts)).save(os.path.join(sys.argv[3], f's{n}_{float(ts):05.2f}.jpg'), quality=85)
        return
    out = sys.argv[3]
    nframes = int(round(sc.dur * FPS))
    p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                          '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium',
                          '-crf', '18', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    for i in range(nframes):
        p.stdin.write(sc.frame(i / FPS).tobytes())
    p.stdin.close()
    p.wait()


if __name__ == '__main__':
    main()
