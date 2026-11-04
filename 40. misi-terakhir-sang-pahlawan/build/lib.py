"""Shared drawing helpers for Video 1 — Misi Terakhir Sang Pahlawan."""
import functools
import math
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
FONTDIR = '/Users/fanny/Library/Fonts/'
BEBAS = 'BebasNeue-Regular.ttf'
DMK = 'DMSans-Black.ttf'
DMB = 'DMSans-Bold.ttf'
DMM = 'DMSans-Medium.ttf'

RED = (200, 16, 46)
WHITE = (248, 245, 238)
GOLD = (242, 190, 82)
DGOLD = (180, 125, 40)
NAVY = (10, 18, 40)
INK = (16, 10, 8)


# ---------- math / easing ----------
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def lerp(a, b, t):
    return a + (b - a) * t


def prog(t, a, b):
    return clamp((t - a) / (b - a)) if b > a else float(t >= a)


def eio(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def eout(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ein(x):
    x = clamp(x)
    return x ** 3


def eback(x):
    x = clamp(x)
    c1 = 1.70158
    return 1 + (c1 + 1) * (x - 1) ** 3 + c1 * (x - 1) ** 2


def lerpc(c1, c2, t):
    return tuple(int(lerp(a, b, t)) for a, b in zip(c1, c2))


# ---------- images ----------
@functools.lru_cache(maxsize=None)
def font(name, size):
    return ImageFont.truetype(FONTDIR + name, size)


def vgrad(w, h, stops):
    ys = np.linspace(0, 1, h)
    arr = np.zeros((h, 1, 3), np.float32)
    for c in range(3):
        arr[:, 0, c] = np.interp(ys, [p for p, _ in stops], [col[c] for _, col in stops])
    arr = np.repeat(arr, w, axis=1)
    return Image.fromarray(arr.astype(np.uint8)).convert('RGBA')


def radial(w, h, cx, cy, r, color, amax=255, power=1.6):
    """Soft radial glow (RGBA) — alpha falls from amax at center to 0 at radius r."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
    a = np.clip(1 - d, 0, 1) ** power * amax
    arr = np.zeros((h, w, 4), np.uint8)
    arr[..., :3] = color
    arr[..., 3] = a.astype(np.uint8)
    return Image.fromarray(arr, 'RGBA')


def vignette(strength=200, power=2.2):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
    a = np.clip(d, 0, 1) ** power * strength
    arr = np.zeros((H, W, 4), np.uint8)
    arr[..., 3] = a.astype(np.uint8)
    return Image.fromarray(arr, 'RGBA')


@functools.lru_cache(maxsize=None)
def solid(color, a=255, size=(W, H)):
    return Image.new('RGBA', size, tuple(color) + (a,))


def overlay(img, color, alpha):
    if alpha <= 0.003:
        return img
    return Image.blend(img, solid(tuple(color)), clamp(alpha))


def with_alpha(im, alpha):
    if alpha >= 0.999:
        return im
    im = im.copy()
    a = np.asarray(im.getchannel('A'), dtype=np.float32) * alpha
    im.putalpha(Image.fromarray(a.astype(np.uint8)))
    return im


def put(base, im, cx, cy, scale=1.0, alpha=1.0, rot=0.0, anchor='c'):
    """Composite sprite onto base with scale/rotation/alpha; safe for off-canvas positions."""
    if alpha <= 0.004 or scale <= 0.005:
        return
    if abs(scale - 1.0) > 1e-3:
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.BILINEAR)
    if rot:
        im = im.rotate(rot, Image.BICUBIC, expand=True)
    im = with_alpha(im, alpha)
    if anchor == 'c':
        x, y = cx - im.width / 2, cy - im.height / 2
    elif anchor == 'b':
        x, y = cx - im.width / 2, cy - im.height
    else:
        x, y = cx, cy
    x, y = int(round(x)), int(round(y))
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(base.width, x + im.width), min(base.height, y + im.height)
    if x1 <= x0 or y1 <= y0:
        return
    if (x0, y0, x1, y1) != (x, y, x + im.width, y + im.height):
        im = im.crop((x0 - x, y0 - y, x1 - x, y1 - y))
    base.alpha_composite(im, (x0, y0))


def camera(img, scale, cx, cy):
    scale = max(1.0, scale)
    w, h = W / scale, H / scale
    x0 = clamp(cx - w / 2, 0, W - w)
    y0 = clamp(cy - h / 2, 0, H - h)
    return img.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + w, y0 + h))


class U:
    """Unit-space drawing: coordinates 0..100 mapped to the sprite height."""

    def __init__(self, d, s):
        self.d, self.s = d, s

    def P(self, pts):
        return [(x * self.s, y * self.s) for x, y in pts]

    def E(self, x0, y0, x1, y1, c):
        self.d.ellipse([x0 * self.s, y0 * self.s, x1 * self.s, y1 * self.s], fill=c)

    def R(self, x0, y0, x1, y1, c, r=0):
        self.d.rounded_rectangle([x0 * self.s, y0 * self.s, x1 * self.s, y1 * self.s], radius=r * self.s, fill=c)

    def poly(self, pts, c):
        self.d.polygon(self.P(pts), fill=c)

    def L(self, pts, wd, c, caps=True):
        self.d.line(self.P(pts), fill=c, width=max(1, int(wd * self.s)), joint='curve')
        if caps:
            for x, y in (pts[0], pts[-1]):
                self.E(x - wd / 2, y - wd / 2, x + wd / 2, y + wd / 2, c)

    def arc(self, x0, y0, x1, y1, a0, a1, c, wd):
        self.d.arc([x0 * self.s, y0 * self.s, x1 * self.s, y1 * self.s], a0, a1, fill=c, width=max(1, int(wd * self.s)))

    def chord(self, x0, y0, x1, y1, a0, a1, c):
        self.d.chord([x0 * self.s, y0 * self.s, x1 * self.s, y1 * self.s], a0, a1, fill=c)


def usprite(h, fn, ss=2, wmul=1.0, crop=True):
    """Draw fn(U) in a (100*wmul x 100) unit canvas rendered at height h, supersampled."""
    s = h * ss / 100
    im = Image.new('RGBA', (int(100 * wmul * s), int(100 * s)), (0, 0, 0, 0))
    fn(U(ImageDraw.Draw(im), s))
    im = im.resize((int(100 * wmul * h / 100), int(h)), Image.LANCZOS)
    if crop:
        bb = im.getbbox()
        if bb:
            im = im.crop(bb)
    return im


@functools.lru_cache(maxsize=None)
def tspr(txt, fname, size, color=WHITE, shadow=0.6, lh=1.0, glow=None, track=0):
    f = font(fname, size)
    lines = txt.split('\n')
    dd = ImageDraw.Draw(Image.new('L', (1, 1)))
    boxes = [dd.textbbox((0, 0), ln, font=f) for ln in lines]
    lw = [b[2] - b[0] for b in boxes]
    asc, desc = f.getmetrics()
    lhpx = int((asc + desc) * lh)
    pad = int(size * 0.35)
    w = max(lw) + 2 * pad
    h = lhpx * len(lines) + 2 * pad
    txtim = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(txtim)
    for i, ln in enumerate(lines):
        x = pad + (max(lw) - lw[i]) / 2 - boxes[i][0]
        d.text((x, pad + i * lhpx), ln, font=f, fill=tuple(color) + (255,))
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    a = txtim.getchannel('A')
    if glow:
        g = Image.new('RGBA', (w, h), tuple(glow) + (0,))
        g.putalpha(a.filter(ImageFilter.GaussianBlur(size * 0.18)).point(lambda v: min(255, int(v * 1.6))))
        out.alpha_composite(g)
    if shadow:
        sh = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        sh.putalpha(a.filter(ImageFilter.GaussianBlur(size * 0.06)).point(lambda v: int(v * shadow)))
        out.alpha_composite(sh, (0, max(1, int(size * 0.04))))
    out.alpha_composite(txtim)
    return out


def mtext(img, t, txt, fname, size, cx, cy, t0, t1=None, color=WHITE, din=0.5, rise=50, pop=False, **kw):
    """Motion typography: fade/slide (or pop) in at t0, fade out ending at t1."""
    if t < t0:
        return
    p = prog(t, t0, t0 + din)
    a = eout(p)
    if t1 is not None:
        a *= 1 - eio(prog(t, t1 - 0.45, t1))
    if a <= 0.003:
        return
    spr = tspr(txt, fname, size, color, **kw)
    if pop:
        put(img, spr, cx, cy, scale=max(0.01, eback(p)), alpha=a)
    else:
        put(img, spr, cx, cy + (1 - eout(p)) * rise, alpha=a)


def blob(size, seed, color=(200, 190, 180)):
    rnd = random.Random(seed)
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for _ in range(9):
        r = rnd.uniform(0.12, 0.26) * size
        x = rnd.uniform(0.3, 0.7) * size
        y = rnd.uniform(0.35, 0.65) * size
        d.ellipse([x - r, y - r, x + r, y + r], fill=tuple(color) + (110,))
    return im.filter(ImageFilter.GaussianBlur(size * 0.08))


# ---------- flag ----------
class Flag:
    def __init__(self, w, h, amp=18, waves=1.6, pole=True, speed=4.0, shade=0.22):
        self.w, self.h, self.amp = w, h, amp
        self.A = A = int(amp) + 2
        src = np.zeros((h + 2 * A, w, 4), np.uint8)
        src[A:A + h // 2, :, :3] = RED
        src[A + h // 2:A + h, :, :3] = WHITE
        src[A:A + h, :, 3] = 255
        self.src = src
        x = np.arange(w)
        self.fall = (x / w) ** 0.9 if pole else np.ones(w)
        self.k = 2 * np.pi * waves / w
        self.speed = speed
        self.shade = shade

    def frame(self, t, amp=1.0):
        x = np.arange(self.w)
        ph = self.k * x - t * self.speed
        off = np.round(self.amp * amp * np.sin(ph) * self.fall).astype(np.int32)
        h2 = self.src.shape[0]
        ys = np.clip(np.arange(h2)[:, None] - off[None, :], 0, h2 - 1)
        out = self.src[ys, x[None, :]]
        sh = 1 + self.shade * amp * np.cos(ph) * self.fall
        rgb = np.clip(out[..., :3].astype(np.float32) * sh[None, :, None], 0, 255).astype(np.uint8)
        out = np.concatenate([rgb, out[..., 3:]], axis=2)
        return Image.fromarray(out, 'RGBA')


# ---------- characters ----------
def fighter(h, color=INK, pose=0):
    """Freedom-fighter silhouette with peci and bambu runcing."""
    c = tuple(color) + (255,)

    def fn(u):
        cx = 50
        u.E(cx - 6, 8.5, cx + 6, 21.5, c)                       # head
        u.R(cx - 2.2, 19, cx + 2.2, 25, c)                      # neck
        u.R(cx - 5.2, 5.2, cx + 5.2, 11, c, 1.0)                # peci
        u.poly([(cx - 9, 24), (cx + 9, 24), (cx + 12, 27), (cx + 8, 57), (cx - 8, 57), (cx - 12, 27)], c)  # torso
        u.E(cx - 11.5, 22.5, cx - 6, 28, c)
        u.E(cx + 6, 22.5, cx + 11.5, 28, c)
        u.L([(cx - 4.5, 55), (cx - 9, 77), (cx - 12, 98)], 7, c)
        u.L([(cx + 4.5, 55), (cx + 9, 77), (cx + 12, 98)], 7, c)
        u.poly([(cx - 9, 57), (cx + 9, 57), (cx + 10, 62), (cx - 10, 62)], c)
        if pose == 0:   # spear upright at side
            u.L([(cx - 9.5, 27), (cx - 12, 42), (cx - 11, 55)], 5.5, c)
            u.L([(cx + 9.5, 27), (cx + 16, 40), (cx + 18, 34)], 5.5, c)
            u.L([(cx + 18.5, 99), (cx + 18.5, 4)], 2.6, c, caps=False)
            u.poly([(cx + 17, 5), (cx + 20, 5), (cx + 18.5, -2 + 2)], c)
        elif pose == 1:  # fist raised
            u.L([(cx + 9.5, 27), (cx + 15, 15), (cx + 17, 3)], 5.5, c)
            u.E(cx + 13.5, -0.5 + 1, cx + 20.5, 6.5, c)
            u.L([(cx - 9.5, 27), (cx - 17, 38), (cx - 13, 44)], 5.5, c)
            u.L([(cx - 30, 70), (cx - 2, 20)], 2.4, c, caps=False)
            u.poly([(cx - 3.5, 20.5), (cx - 0.5, 22), (cx + 1, 15.5)], c)
        else:            # spear forward, charging
            u.L([(cx - 9.5, 27), (cx - 4, 40), (cx + 6, 40)], 5.5, c)
            u.L([(cx + 9.5, 27), (cx + 18, 34), (cx + 22, 30)], 5.5, c)
            u.L([(cx - 26, 52), (cx + 40, 22)], 2.4, c, caps=False)
            u.poly([(cx + 39, 20), (cx + 40.5, 24.5), (cx + 46, 19.5)], c)

    return usprite(h, fn, wmul=1.0)


def figure(h, skin, top, bottom=(45, 45, 70), head='hair', headc=(25, 20, 20), shoes=(30, 30, 30),
           face=True, sil=None):
    def fn(u):
        C = (lambda col: tuple(sil) + (255,)) if sil else (lambda col: tuple(col) + (255,))
        u.L([(45, 60), (44, 93)], 7, C(bottom))
        u.L([(55, 60), (56, 93)], 7, C(bottom))
        u.R(38.5, 92, 48, 97, C(shoes), 2)
        u.R(52, 92, 61.5, 97, C(shoes), 2)
        u.L([(38, 30), (34.5, 45), (34.5, 57)], 6, C(top))
        u.L([(62, 30), (65.5, 45), (65.5, 57)], 6, C(top))
        u.E(31.5, 55, 37.5, 61, C(skin))
        u.E(62.5, 55, 68.5, 61, C(skin))
        u.R(36, 26, 64, 64, C(top), 7)
        if head == 'hijab':
            u.E(40, 4, 60, 27, C(headc))
            u.poly([(39, 19), (61, 19), (65, 35), (35, 35)], C(headc))
            u.E(43.5, 8.5, 56.5, 23, C(skin))
            fy = 15.5
        else:
            u.R(47.5, 20, 52.5, 27, C(skin))
            u.E(42, 4.5, 58, 22, C(skin))
            fy = 13.5
            if head == 'peci':
                u.R(42.3, 2.5, 57.7, 9.5, C(headc), 1.5)
            elif head == 'hair':
                u.chord(41.5, 3.5, 58.5, 19, 180, 360, C(headc))
            elif head == 'blangkon':
                u.chord(41, 2.5, 59, 19, 175, 365, C(headc))
                u.E(55.5, 9, 61, 15, C(headc))
            elif head == 'cap':
                u.chord(41.5, 3, 58.5, 17, 180, 360, C(headc))
                u.R(50, 9, 63, 11.5, C(headc), 1)
        if face and not sil:
            dark = (35, 25, 25, 255)
            u.E(45.2, fy - 1.2, 47.4, fy + 1.4, dark)
            u.E(52.6, fy - 1.2, 54.8, fy + 1.4, dark)
            u.arc(46.5, fy + 0.5, 53.5, fy + 5.2, 20, 160, dark, 0.9)

    return usprite(h, fn)


def youth(h):
    """Gen-Z hero: red jacket, white tee, flag pin."""
    skin = (232, 182, 140, 255)
    hair = (30, 22, 20, 255)
    jacket = (205, 28, 48, 255)
    jdark = (160, 18, 36, 255)
    tee = (250, 248, 242, 255)
    jeans = (35, 52, 95, 255)

    def fn(u):
        u.L([(45.5, 60), (44.5, 93)], 7.5, jeans)
        u.L([(54.5, 60), (55.5, 93)], 7.5, jeans)
        u.R(38.5, 91.5, 48.5, 97, tee, 2.2)
        u.R(51.5, 91.5, 61.5, 97, tee, 2.2)
        u.R(38.5, 95, 48.5, 97, (200, 200, 205, 255), 1)
        u.R(51.5, 95, 61.5, 97, (200, 200, 205, 255), 1)
        u.R(40, 55, 60, 63, jeans, 3)
        u.L([(38.5, 31), (34.5, 45), (34, 56)], 6.8, jacket)
        u.L([(61.5, 31), (65.5, 45), (66, 56)], 6.8, jacket)
        u.E(30.8, 54.5, 37.2, 61, skin)
        u.E(62.8, 54.5, 69.2, 61, skin)
        u.R(40.5, 28, 59.5, 58, tee, 5)
        u.poly([(36.5, 31), (41, 28), (47, 28), (46.5, 59), (39.5, 59)], jacket)
        u.poly([(63.5, 31), (59, 28), (53, 28), (53.5, 59), (60.5, 59)], jacket)
        u.poly([(41, 28), (47, 28), (45.5, 36)], jdark)
        u.poly([(59, 28), (53, 28), (54.5, 36)], jdark)
        u.R(55.5, 38, 58.5, 39.5, (220, 20, 40, 255))
        u.R(55.5, 39.5, 58.5, 41, (255, 255, 255, 255))
        u.R(47.6, 22, 52.4, 29, skin)
        u.E(40.5, 13, 43.5, 18.5, skin)
        u.E(56.5, 13, 59.5, 18.5, skin)
        u.E(41.2, 2.8, 58.8, 18, hair)
        u.E(42, 6, 58, 25.5, skin)
        u.poly([(41.5, 13), (43, 6), (49, 3.5), (55, 4), (58.5, 9), (58.5, 13.5), (55, 9.5), (49, 9), (44, 10.5)], hair)
        dark = (40, 26, 22, 255)
        u.E(45.2, 14.6, 47.6, 17.6, dark)
        u.E(52.4, 14.6, 54.8, 17.6, dark)
        u.E(46.2, 15, 47, 15.8, (255, 255, 255, 255))
        u.E(53.4, 15, 54.2, 15.8, (255, 255, 255, 255))
        u.L([(44.8, 12.8), (47.8, 12.2)], 0.8, dark, caps=False)
        u.L([(52.2, 12.2), (55.2, 12.8)], 0.8, dark, caps=False)
        u.arc(46.8, 17.5, 53.2, 22.5, 25, 155, (150, 60, 50, 255), 0.9)
        u.E(43.5, 18.5, 46, 20, (240, 150, 130, 140))
        u.E(54, 18.5, 56.5, 20, (240, 150, 130, 140))

    return usprite(h, fn)


def car(w, body, flip=False):
    def fn(u):
        u.R(4, 40, 96, 78, tuple(body) + (255,), 9)
        u.R(22, 18, 74, 46, tuple(body) + (255,), 10)
        u.R(27, 23, 47, 42, (190, 220, 240, 255), 3)
        u.R(50, 23, 69, 42, (190, 220, 240, 255), 3)
        u.R(90, 50, 96, 58, (255, 230, 150, 255), 2)
        u.R(4, 52, 9, 60, (230, 60, 50, 255), 2)
        for x in (24, 76):
            u.E(x - 11, 64, x + 11, 86, (25, 25, 30, 255))
            u.E(x - 5, 70, x + 5, 80, (150, 150, 160, 255))

    im = usprite(w * 0.5, fn, wmul=1.0)
    im = im.resize((int(w), int(w * im.height / im.width)), Image.LANCZOS)
    return im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im


def rp_glyph(size, color=GOLD):
    return tspr('Rp', DMK, size, color, shadow=0.5, glow=(255, 170, 40))
