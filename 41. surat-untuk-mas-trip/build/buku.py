"""Buku Tulis style: animation primitives + scenes for Video 2 ("Surat untuk Mas TRIP").

Everything is a pure function of t. Lines are drawn on (revealed in stroke order), text is written
left to right with a pen tip following it, and scenes change with a notebook page turn.
"""
import math
import random

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

from style_frames import (F, HAND, INKB, PENCIL, STABILO, W, H, put, notebook, penline, rara, trip, street_sign, usprite,
                          bike, note_sketch, torn_edge_mask)
from styles import multiply
from lib import camera, clamp, lerp, prog, eio, eout, ein
from assets import logo_bi, logo_cbp

DMB = '/Users/fanny/Library/Fonts/DMSans-Bold.ttf'
RED = (205, 45, 45)
GREEN_ST = (110, 230, 150)


# ---------------------------------------------------------------- primitives
class Ink:
    """A line-art sprite that can be drawn on progressively.

    order: per-pixel value in [0, 1]; a pixel is visible once progress passes it.
    mode 'draw' sweeps top-left → bottom-right with noise (sketching), 'write' sweeps left → right.
    """

    def __init__(self, rgba, mode='draw', seed=0):
        self.im = rgba
        self.mode = mode
        a = np.asarray(rgba.getchannel('A'), np.float32) / 255
        h, w = a.shape
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        if mode == 'write':
            o = xx / max(1, w - 1)
        else:
            r = np.random.default_rng(seed)
            n = np.asarray(Image.fromarray((r.random((max(2, h // 40), max(2, w // 40))) * 255).astype(np.uint8))
                           .resize((w, h), Image.BICUBIC), np.float32) / 255
            o = 0.7 * yy / max(1, h - 1) + 0.15 * xx / max(1, w - 1) + 0.15 * n
        o = (o - o.min()) / max(1e-6, o.max() - o.min())
        self.order = o
        self.alpha = a
        self.ink = a > 0.15
        self.w, self.h = w, h

    def frame(self, p):
        if p >= 1:
            return self.im
        if p <= 0:
            return None
        soft = 0.03
        m = np.clip((p - self.order) / soft + 1, 0, 1)
        if self.mode == 'draw':
            # faint underdrawing of the whole shape, so no part (e.g. a head) floats alone mid-sweep
            m = np.maximum(m, 0.28 * min(1.0, p / 0.2))
        m = m * self.alpha * 255
        out = self.im.copy()
        out.putalpha(Image.fromarray(m.astype(np.uint8)))
        return out

    def tip(self, p):
        """Where the pen is (sprite-local) at progress p."""
        band = self.ink & (self.order > p - 0.04) & (self.order <= p)
        ys, xs = np.nonzero(band)
        if len(xs) == 0:
            return None
        k = np.argmax(self.order[ys, xs])
        return xs[k], ys[k]

    def put(self, img, x, y, p, anchor='c', alpha=1.0, pen=None):
        fr = self.frame(p)
        if fr is None:
            return
        x0, y0 = _origin(x, y, self.w, self.h, anchor)
        put(img, fr, x0, y0, alpha=alpha, anchor='tl')
        if pen is not None and 0 < p < 1:
            tp = self.tip(p)
            if tp:
                draw_pen(img, x0 + tp[0], y0 + tp[1], pen)


def _origin(x, y, w, h, anchor):
    if anchor == 'c':
        return x - w / 2, y - h / 2
    if anchor == 'b':
        return x - w / 2, y - h
    if anchor == 'l':
        return x, y - h / 2
    return x, y


def text_sprite(txt, size, col=INKB, font=HAND):
    f = F(font, size)
    bb = ImageDraw.Draw(Image.new('RGBA', (1, 1))).textbbox((0, 0), txt, font=f)
    im = Image.new('RGBA', (bb[2] - bb[0] + 20, bb[3] - bb[1] + 20), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((10 - bb[0], 10 - bb[1]), txt, font=f, fill=tuple(col) + (255,))
    return im


class Words(Ink):
    def __init__(self, txt, size, col=INKB, font=HAND):
        super().__init__(text_sprite(txt, size, col, font), 'write')


def _pen_sprite():
    im = Image.new('RGBA', (60, 300), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.polygon([(30, 300), (22, 262), (38, 262)], fill=(60, 60, 70, 255))
    d.rounded_rectangle([20, 60, 40, 266], radius=8, fill=(245, 245, 248, 255), outline=(150, 150, 160, 255), width=2)
    d.rounded_rectangle([18, 0, 42, 70], radius=10, fill=(40, 70, 170, 255))
    d.rectangle([40, 14, 46, 90], fill=(40, 70, 170, 255))
    return im.rotate(-28, Image.BICUBIC, expand=True)


PEN = _pen_sprite()
PENCIL_SPR = None


def draw_pen(img, x, y, kind='pen'):
    spr = PEN
    # the tip is at the bottom-left of the rotated sprite
    put(img, spr, x - 8, y - spr.height + 10, anchor='tl', alpha=0.95)


def stabilo(img, box, p=1.0, col=STABILO, a=140):
    """Highlighter swipe that grows left → right."""
    if p <= 0:
        return
    x0, y0, x1, y1 = box
    x1 = lerp(x0, x1, eio(p))
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(lay).polygon([(x0, y0 + 6), (x1, y0), (x1 + 4, y1 - 4), (x0 - 2, y1)], fill=tuple(col) + (a,))
    img.alpha_composite(lay)


def pen_line(img, pts, p, col=INKB, width=5, dash=None):
    """Polyline drawn on to fraction p of its length."""
    if p <= 0:
        return None
    seg = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    total = sum(seg)
    left = total * clamp(p)
    d = ImageDraw.Draw(img)
    out = pts[0]
    for i, L in enumerate(seg):
        if left <= 0:
            break
        f = min(1, left / L)
        a, b = pts[i], pts[i + 1]
        e = (lerp(a[0], b[0], f), lerp(a[1], b[1], f))
        if dash:
            n = int(math.dist(a, e) // dash)
            for k in range(0, n, 2):
                u0, u1 = k * dash / L, min((k + 1) * dash / L, f)
                d.line([(lerp(a[0], b[0], u0), lerp(a[1], b[1], u0)), (lerp(a[0], b[0], u1), lerp(a[1], b[1], u1))],
                       fill=tuple(col) + (255,), width=width)
        else:
            d.line([a, e], fill=tuple(col) + (255,), width=width)
        out = e
        left -= L
    return out


def page_turn(old, new, p):
    """Notebook page turning over its left binding: front shrinks, then the back of the page passes."""
    if p <= 0:
        return old
    if p >= 1:
        return new
    img = new.copy()
    c = math.cos(p * math.pi)
    # front: shrinks to the binding; back: opens a little, then folds away to the binding (no pop at the end)
    w = max(1, int(W * (c if c > 0 else -c * 2 * (1 - p))))
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rectangle([0, 0, w + 60, H], fill=(0, 0, 0, int(70 * math.sin(p * math.pi))))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(30)))
    if c > 0:
        face = old.resize((w, H), Image.BILINEAR)
        shade = int(90 * (1 - c))
    else:
        face = notebook_back().resize((w, H), Image.BILINEAR)
        shade = int(60 * (1 + c))
    face = face.copy()
    g = Image.linear_gradient('L').rotate(90 if c > 0 else -90).resize((w, H)).point(lambda v: v * shade // 255)
    dark = Image.new('RGBA', (w, H), (0, 0, 0, 255))
    dark.putalpha(g)
    face.alpha_composite(dark)
    img.alpha_composite(face, (0, 0))
    return img


_BACK = None


def notebook_back():
    global _BACK
    if _BACK is None:
        b = notebook().transpose(Image.FLIP_LEFT_RIGHT)
        _BACK = Image.blend(b.convert('RGB'), Image.new('RGB', (W, H), (235, 230, 215)), 0.35).convert('RGBA')
    return _BACK


def subtitle(img, t, cues):
    for t0, t1, txt in cues:
        if t0 <= t < t1:
            a = min(eio(prog(t, t0, t0 + 0.2)), 1 - eio(prog(t, t1 - 0.2, t1)))
            f = F(DMB, 50)
            d = ImageDraw.Draw(Image.new('RGBA', (1, 1)))
            lines = _wrap(txt, f, 900)
            hgt = 68 * len(lines) + 36
            lay = Image.new('RGBA', (W, hgt), (0, 0, 0, 0))
            ld = ImageDraw.Draw(lay)
            wmax = max(d.textlength(l, font=f) for l in lines)
            ld.rounded_rectangle([540 - wmax / 2 - 30, 0, 540 + wmax / 2 + 30, hgt], radius=22, fill=(255, 255, 255, 225))
            for i, l in enumerate(lines):
                ld.text((540, 18 + 34 + 68 * i), l, font=f, fill=(25, 30, 50, 255), anchor='mm')
            put(img, lay, 0, 1840 - hgt, anchor='tl', alpha=a)


def _wrap(txt, f, maxw):
    d = ImageDraw.Draw(Image.new('RGBA', (1, 1)))
    words, lines, cur = txt.split(), [], ''
    for w_ in words:
        nxt = (cur + ' ' + w_).strip()
        if d.textlength(nxt, font=f) > maxw and cur:
            lines.append(cur)
            cur = w_
        else:
            cur = nxt
    return lines + [cur]


# ---------------------------------------------------------------- drawings
def rider(h):
    """Rara riding her bicycle; wheels are separate (they spin). crop=False keeps unit coordinates."""
    skin = (226, 176, 134, 255)
    hair = (28, 22, 20, 255)
    shirt = (248, 248, 244, 255)
    skirt = (110, 116, 128, 255)
    bag = (40, 70, 130, 255)
    frame = (40, 70, 160, 255)

    def fn(u):
        u.R(20, 34, 31, 52, bag, 3)                                        # backpack
        u.L([(22, 82), (42, 82), (36, 60), (22, 82)], 1.6, frame)          # rear triangle
        u.L([(36, 60), (64, 58), (42, 82)], 1.6, frame)
        u.L([(64, 58), (74, 82)], 1.6, frame)                               # fork
        u.L([(64, 58), (62, 51), (69, 49)], 1.6, frame)                     # stem + bar
        u.R(32, 58, 41, 61, (30, 30, 30, 255), 1)                           # saddle
        u.L([(47, 63), (45, 84)], 3.8, skin)                                # shin
        u.R(42, 83, 51, 86.5, (30, 30, 30, 255), 1.5)
        u.poly([(31, 52), (40, 51), (52, 62), (49, 68), (36, 64)], skirt)  # skirt over the thigh
        u.R(37.5, 8, 46, 31, hair, 4)                                       # hair down the back
        u.L([(47, 20), (45, 31)], 5.4, skin)                                # neck, under the collar
        u.L([(36, 54), (43, 30)], 11.5, shirt)                             # torso, leaning up to the neck
        u.L([(45, 34), (56, 42), (66, 49)], 4.0, shirt)                     # arm to bar
        u.E(64, 46.5, 69, 51.5, skin)
        u.L([(42, 29), (36, 54)], 1.4, bag)                                 # strap
        u.E(41, 6, 55, 24, skin)
        u.chord(40, 4.5, 55.5, 19, 180, 360, hair)
        u.poly([(39.5, 14), (41.5, 6), (48, 4), (53, 4.5), (55.5, 9), (55.5, 12.5), (52, 9), (46, 9), (42, 11), (41.5, 16)], hair)
        u.E(48.8, 13.3, 50.6, 15.6, (40, 26, 22, 255))
        u.E(52.8, 13.3, 54.6, 15.6, (40, 26, 22, 255))
        u.arc(49.5, 16.5, 54.5, 20.5, 20, 150, (170, 60, 60, 255), 0.8)
    return usprite(h, fn, wmul=1.0, crop=False)


def wheel(r_px):
    s = int(r_px * 2 + 12)
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = s / 2
    d.ellipse([c - r_px, c - r_px, c + r_px, c + r_px], outline=(40, 40, 40, 255), width=int(r_px * 0.16))
    for k in range(6):
        a = k * math.pi / 3
        d.line([c, c, c + r_px * 0.9 * math.cos(a), c + r_px * 0.9 * math.sin(a)], fill=(80, 80, 90, 255), width=3)
    d.ellipse([c - 8, c - 8, c + 8, c + 8], fill=(40, 40, 40, 255))
    return im


def bench(w):
    def fn(u):
        wood = (170, 120, 70, 255)
        u.R(5, 40, 95, 52, wood, 2)
        u.L([(12, 52), (10, 95)], 4, wood)
        u.L([(88, 52), (90, 95)], 4, wood)
        u.L([(12, 75), (88, 75)], 3, wood)
        u.R(20, 26, 50, 40, (200, 60, 60, 255), 1)          # books
        u.R(24, 16, 52, 26, (60, 120, 200, 255), 1)
        u.R(60, 30, 80, 40, (240, 240, 230, 255), 1)          # open notebook
    return usprite(w * 0.6, fn, wmul=1.6)


def question_mark(size=170, col=INKB):
    return text_sprite('?', size, col)


# ---------------------------------------------------------------- scene 1: Jalan Mastrip (POV hook → letter opens)
RU = 8.8          # rider unit → px
ROAD = 1560


class Scene1:
    dur = 19.0
    SUBS = [(2.0, 4.4, 'Kamu tiap hari lewat Jalan Mastrip.'),
            (4.6, 6.4, 'Tahu itu nama siapa?'),
            (7.0, 8.4, 'Mas, aku Rara.'),
            (8.6, 12.1, 'Aku nulis surat ini dari Surabaya, tahun 2026.'),
            (12.3, 13.7, 'Aku kelas sebelas.'),
            (14.0, 17.4, 'Kalau Mas ada di sini, mungkin kita seumuran.')]

    def __init__(self):
        self.page = notebook()
        self.pov = [Words('POV:', 90), Words('kamu pelajar SMA,', 92), Words('dan tahunnya 1946.', 92)]
        self.sign = Ink(penline(street_sign(400, (40, 150, 90), (255, 255, 255), (60, 60, 60)), INKB, seed=1, hatch=False), seed=1)
        rp = rider(100 * RU)
        self.rider = Ink(penline(rp, INKB, w=7, seed=4), seed=4)
        self.rh = rp.height
        self.wheel = penline(wheel(15 * RU), INKB, w=7, hatch=False)
        tr = trip(860)
        body = Image.new('RGBA', tr.size, (250, 247, 236, 0))
        body.putalpha(tr.getchannel('A').point(lambda v: v * 235 // 255))   # paper-coloured body hides the sign pole
        lines = penline(tr, PENCIL, w=7, seed=3)
        pad = Image.new('RGBA', lines.size, (0, 0, 0, 0))
        pad.alpha_composite(body, ((lines.width - tr.width) // 2, (lines.height - tr.height) // 2))
        pad.alpha_composite(lines)
        self.ghost = Ink(pad, seed=3)
        self.q = Ink(question_mark(190), 'write')
        self.lbl_rara = Words('Rara, kelas 11', 58)
        self.lbl_trip = Words('Mas TRIP, 1946', 60, PENCIL)
        self.head = [Words('Untuk: Mas TRIP', 76), Words('Surabaya, 2026', 64)]
        self.same = Words('seumuran?', 62, RED)

    def page1(self, t):
        img = self.page.copy()
        for i, y in enumerate((600, 730, 860)):
            t0, d = (0.2, 0.7, 1.5)[i], (0.4, 0.75, 0.75)[i]
            w_ = self.pov[i]
            if i == 2 and t > 2.3:
                x1 = 170 + w_.w
                stabilo(img, (x1 - 240, y + 26, x1 - 45, y + 110), prog(t, 2.3, 2.7))
            w_.put(img, 170, y, prog(t, t0, t0 + d), anchor='tl', pen='pen')
        return img

    def page2(self, t):
        img = self.page.copy()
        self.head[0].put(img, 170, 230, prog(t, 9.0, 9.9), anchor='tl', pen='pen')
        self.head[1].put(img, 1040 - self.head[1].w, 315, prog(t, 9.9, 10.8), anchor='tl', pen='pen')
        # road: a notebook line inked over as the street
        pen_line(img, [(0, ROAD), (W, ROAD)], prog(t, 3.5, 4.1), (60, 60, 70), 7)
        pen_line(img, [(0, ROAD + 60), (W, ROAD + 60)], prog(t, 3.6, 4.2), (60, 60, 70), 4, dash=30)
        # Mas TRIP in pencil, standing under the sign that carries his name
        self.sign.put(img, 640, ROAD - self.sign.h, prog(t, 3.5, 4.5), anchor='tl', pen='pen')
        self.ghost.put(img, 890, ROAD, prog(t, 14.0, 15.8), anchor='b', alpha=0.8)
        sy = ROAD - self.sign.h
        if t > 5.0:
            stabilo(img, (645, sy + 8, 1035, sy + 122), prog(t, 5.0, 5.4), GREEN_ST, 110)
        self.q.put(img, 585, sy + 60, prog(t, 4.9, 5.4), anchor='c')
        self.lbl_trip.put(img, 1040 - self.lbl_trip.w, sy - 92, prog(t, 15.6, 16.4), anchor='tl')
        # Rara rides in from the left and stops short of the sign
        xs = lerp(-900, 20, eout(prog(t, 4.2, 7.0)))
        oy = ROAD - 89 * RU
        ang = -math.degrees((xs + 900) / (15 * RU))
        if t > 4.2:
            for cx in (22, 74):
                put(img, self.wheel.rotate(ang, Image.BICUBIC), xs + cx * RU, oy + 82 * RU)
            self.rider.put(img, xs, oy, 1.0, anchor='tl')
        hx, hy = xs + 48 * RU, oy + 4 * RU
        if t > 7.2:
            pen_line(img, [(hx - 40, hy - 10), (hx - 70, hy - 70), (hx - 80, hy - 120)], prog(t, 7.2, 7.5), INKB, 4)
        self.lbl_rara.put(img, 140, hy - 200, prog(t, 7.2, 8.4), anchor='tl', pen='pen')
        # "seumuran?" — a dotted line between the two heads
        if t > 16.6:
            gx, gy = 890, ROAD - 860 + 60
            pen_line(img, [(hx + 70, hy + 40), (gx - 60, gy + 30)], prog(t, 16.6, 17.1), RED, 4, dash=14)
            self.same.put(img, (hx + gx) / 2 + 10, (hy + gy) / 2 - 20, prog(t, 16.8, 17.5), anchor='c')
        return img

    def frame(self, t):
        if t < 3.0:
            return self.page1(t).convert('RGB')
        p2 = self.page2(t)
        p2 = camera(p2, 1 + 0.04 * eio(prog(t, 7.0, 18.5)), 540, 1100)
        img = page_turn(self.page1(3.0), p2, eio(prog(t, 3.0, 3.8)))
        subtitle(img, t, self.SUBS)
        return img.convert('RGB')


# ---------------------------------------------------------------- scene 2: siapa Mas TRIP
class Scene2:
    dur = 22.0
    SUBS = [(0.5, 3.0, 'Di buku sejarah, nama kalian TRIP:'),
            (3.1, 6.2, 'Tentara Republik Indonesia Pelajar.'),
            (6.7, 10.5, 'Juli 1946, anak-anak SMP dan SMA di Jawa Timur'),
            (10.5, 15.1, 'meninggalkan bangku sekolah untuk menjaga republik yang umurnya belum genap setahun.'),
            (15.5, 18.3, 'Tiap pagi aku lewat jalan yang pakai nama kalian,'),
            (18.4, 20.8, 'dan baru minggu lalu aku tahu artinya.')]

    def __init__(self, prev_last):
        self.prev = prev_last
        self.page = notebook()
        self.letters = [Words(c, 250, RED) for c in 'TRIP']
        self.rest = [Words(s, 104) for s in ('entara', 'epublik', 'ndonesia', 'elajar')]
        self.figs = [Ink(penline(trip(520), PENCIL, w=7, seed=11 + i), seed=11 + i) for i in range(2)]
        self.figlbl = [Words('SMP', 58, PENCIL), Words('SMA', 58, PENCIL)]
        self.bench = Ink(penline(bench(380), PENCIL, w=7, seed=20, hatch=False), seed=20)
        self.t_right = Words('Juli 1946', 66, RED)
        self.t_left = Words('17 Agustus 1945', 54)
        self.gap = Words('belum genap setahun', 66)
        self.sign = Ink(penline(street_sign(760, (40, 150, 90), (255, 255, 255), (60, 60, 60)).crop((0, 0, 760, 560)), INKB, w=7, seed=31, hatch=False), seed=31)
        self.eq = [Words('Mas', 120), Words('+', 120), Words('TRIP', 120, RED), Words('=', 120)]
        self.res = Words('MASTRIP', 160)
        self.oh = Words('oh, jadi itu artinya.', 70, PENCIL)

    def page2(self, t):
        img = self.page.copy()
        # T R I P written large, then folded into an acrostic
        fold = eio(prog(t, 2.7, 3.3))
        ws = [L.w - 20 for L in self.letters]
        x0 = 540 - (sum(ws) + 40 * 3) / 2
        for i, L in enumerate(self.letters):
            hx, hy = x0 + sum(ws[:i]) + 40 * i + ws[i] / 2, 420
            vx, vy = 230, 250 + 125 * i
            fr = L.frame(prog(t, 0.6 + 0.3 * i, 0.9 + 0.3 * i))
            if fr is not None:
                put(img, fr, lerp(hx, vx, fold), lerp(hy, vy, fold), scale=lerp(1.0, 0.58, fold))
            if fold >= 1:
                self.rest[i].put(img, vx + 50, vy, prog(t, 3.3 + 0.62 * i, 3.85 + 0.62 * i), anchor='l', pen='pen')
        if t > 5.8:
            stabilo(img, (275, 590, 285 + self.rest[3].w, 665), prog(t, 5.8, 6.2))
        # students leave the school bench
        self.bench.put(img, 250, 1290, prog(t, 10.4, 11.2), anchor='b')
        walk = eio(prog(t, 11.0, 12.6))
        for i, f in enumerate(self.figs):
            fx = lerp(560 + 240 * i, 640 + 240 * i, walk)
            bob = math.sin(prog(t, 11.0, 12.6) * math.pi * 4) * 8 * (0 < walk < 1)
            f.put(img, fx, 1290 + bob, prog(t, 8.0 + 0.8 * i, 9.0 + 0.8 * i), anchor='b')
            self.figlbl[i].put(img, fx - 50, 700, prog(t, 8.8 + 0.8 * i, 9.3 + 0.8 * i), anchor='tl')
        # timeline: 17 Agustus 1945 ———— Juli 1946
        y = 1390
        pen_line(img, [(170, y), (990, y)], prog(t, 6.7, 7.6), INKB, 6)
        for x_, t0 in ((185, 12.5), (975, 7.2)):
            if t > t0:
                pen_line(img, [(x_, y - 30), (x_, y + 30)], prog(t, t0, t0 + 0.2), INKB, 7)
        self.t_right.put(img, 1010 - self.t_right.w, y + 40, prog(t, 7.2, 7.9), anchor='tl', pen='pen')
        self.t_left.put(img, 150, y + 46, prog(t, 12.5, 13.4), anchor='tl', pen='pen')
        if t > 13.4:
            pen_line(img, [(190, y + 140), (190, y + 170), (970, y + 170), (970, y + 140)], prog(t, 13.4, 14.0), INKB, 5)
        if t > 14.9:
            stabilo(img, (580 - self.gap.w / 2, y + 205, 580 + self.gap.w / 2, y + 285), prog(t, 14.9, 15.2))
        self.gap.put(img, 580, y + 245, prog(t, 14.0, 14.9), anchor='c', pen='pen')
        return img

    def page3(self, t):
        img = self.page.copy()
        self.sign.put(img, 540 - self.sign.w / 2, 300, prog(t, 16.0, 17.0), anchor='tl', pen='pen')
        x = 150
        for i, w_ in enumerate(self.eq):
            w_.put(img, x, 1240, prog(t, 18.2 + 0.25 * i, 18.45 + 0.25 * i), anchor='l')
            x += w_.w + 10
        if t > 19.9:
            stabilo(img, (540 - self.res.w / 2, 1340, 540 + self.res.w / 2, 1470), prog(t, 19.9, 20.3))
        self.res.put(img, 540, 1405, prog(t, 19.3, 19.9), anchor='c', pen='pen')
        self.oh.put(img, 540, 1580, prog(t, 20.2, 21.0), anchor='c')
        return img

    def frame(self, t):
        if t < 0.9:
            img = page_turn(self.prev, self.page2(t), eio(prog(t, 0.0, 0.8)))
        elif t < 15.2:
            img = self.page2(t)
        else:
            img = page_turn(self.page2(15.2), self.page3(t), eio(prog(t, 15.2, 16.0)))
        subtitle(img, t, self.SUBS)
        return img.convert('RGB')


# ---------------------------------------------------------------- shared drawings for scenes 3–7
GREEN_OK = (40, 150, 80)


def inked(spr, col, fill_a=0.4, seed=0, hatch=False, w=7):
    """Pen outline over a faded copy of the flat colours (keeps notes and screens readable)."""
    out = Image.new('RGBA', spr.size, (0, 0, 0, 0))
    fill = spr.copy()
    fill.putalpha(spr.getchannel('A').point(lambda v: int(v * fill_a)))
    out.alpha_composite(fill)
    out.alpha_composite(penline(spr, col, w=w, seed=seed, hatch=hatch))
    return out


def hand_grip(h, sleeve, skin):
    """A hand coming in from the left edge; palm centre at unit (52, 50), thumb over whatever it holds."""
    def fn(u):
        u.R(0, 36, 46, 66, sleeve, 3)
        u.E(38, 33, 66, 67, skin)
        u.L([(56, 43), (70, 37)], 8, skin)
    return usprite(h, fn, wmul=0.76, crop=False)


def grip_group(note, hand, flip=False):
    """Note held by a hand at its outer edge (left edge, or right edge when flip); the note itself is never mirrored."""
    s = hand.height / 100
    nx = int(52 * s)
    g = Image.new('RGBA', (nx + note.width, max(hand.height, note.height)), (0, 0, 0, 0))
    if flip:
        hand = hand.transpose(Image.FLIP_LEFT_RIGHT)
        g.alpha_composite(note, (0, (g.height - note.height) // 2))
        g.alpha_composite(hand, (g.width - hand.width, (g.height - hand.height) // 2))
    else:
        g.alpha_composite(note, (nx, (g.height - note.height) // 2))
        g.alpha_composite(hand, (0, (g.height - hand.height) // 2))
    return g


def old_page():
    return multiply(notebook(), Image.new('RGBA', (W, H), (238, 226, 196, 255)))


def split_page(seed=5):
    img = notebook()
    m = torn_edge_mask(seed)
    img.paste(old_page(), (0, 0), m)
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sh.putalpha(ImageChops.subtract(m.filter(ImageFilter.MaxFilter(15)), m).filter(ImageFilter.GaussianBlur(6)).point(lambda v: v // 2))
    img.alpha_composite(sh)
    return img


def wallet(w):
    """Open bifold wallet: back panel and the front pocket drawn separately (a note slides between)."""
    h = int(w * 0.55)
    back = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(back)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=26, fill=(150, 95, 55, 255))
    d.line([w / 2, 8, w / 2, h - 8], fill=(110, 65, 35, 255), width=6)
    front = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(front)
    d.rounded_rectangle([0, int(h * 0.42), w - 1, h - 1], radius=26, fill=(170, 112, 66, 255))
    d.line([w / 2, int(h * 0.42) + 8, w / 2, h - 8], fill=(110, 65, 35, 255), width=6)
    for k in range(3):
        y = int(h * 0.58) + k * 26
        d.line([30, y, w / 2 - 30, y], fill=(130, 80, 45, 255), width=4)
    return back, front


def eye_icon(s):
    im = Image.new('RGBA', (s, int(s * 0.6)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    w, h = im.size
    d.chord([4, -h * 0.35, w - 4, h * 0.95], 25, 155, fill=(255, 255, 255, 255), outline=(30, 30, 30, 255), width=6)
    d.chord([4, h * 0.05, w - 4, h * 1.35], 205, 335, fill=(255, 255, 255, 255), outline=(30, 30, 30, 255), width=6)
    d.ellipse([w / 2 - h * 0.28, h / 2 - h * 0.28, w / 2 + h * 0.28, h / 2 + h * 0.28], fill=(90, 60, 40, 255))
    d.ellipse([w / 2 - h * 0.11, h / 2 - h * 0.11, w / 2 + h * 0.11, h / 2 + h * 0.11], fill=(20, 20, 20, 255))
    return im


def finger_icon(s, note):
    """Fingertip resting on the corner of a note."""
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    n = note.resize((int(s * 0.8), int(s * 0.8 * note.height / note.width)), Image.LANCZOS)
    im.alpha_composite(n, (0, s - n.height - 10))
    d = ImageDraw.Draw(im)
    skin = (226, 176, 134, 255)
    d.line([(s * 0.95, s * 0.05), (s * 0.62, s * 0.55)], fill=skin, width=int(s * 0.16))
    d.ellipse([s * 0.62 - s * 0.08, s * 0.55 - s * 0.08, s * 0.62 + s * 0.08, s * 0.55 + s * 0.08], fill=skin)
    return im


def light_icon(s, note):
    """A note held up against a lamp."""
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = s / 2
    for k in range(10):
        a = k * math.pi / 5
        d.line([c + s * 0.3 * math.cos(a), c * 0.8 + s * 0.3 * math.sin(a), c + s * 0.46 * math.cos(a), c * 0.8 + s * 0.46 * math.sin(a)],
               fill=(240, 180, 40, 255), width=8)
    d.ellipse([c - s * 0.22, c * 0.8 - s * 0.22, c + s * 0.22, c * 0.8 + s * 0.22], fill=(255, 225, 120, 255))
    n = note.resize((int(s * 0.7), int(s * 0.7 * note.height / note.width)), Image.LANCZOS)
    n.putalpha(n.getchannel('A').point(lambda v: v * 3 // 4))
    im.alpha_composite(n, (int(c - n.width / 2), int(s * 0.62)))
    return im


def warung(h):
    red, white, wood = (205, 60, 50, 255), (250, 248, 240, 255), (170, 120, 70, 255)

    def fn(u):
        u.L([(8, 22), (8, 98)], 3, wood)
        u.L([(132, 22), (132, 98)], 3, wood)
        u.L([(14, 42), (126, 42)], 2.4, wood)                       # shelf
        for k, x in enumerate(range(22, 120, 16)):                    # jars on the shelf
            u.R(x, 30, x + 10, 42, (200, 225, 235, 255) if k % 2 else (240, 210, 120, 255), 2)
        for k in range(7):
            u.R(2 + 20 * k, 12, 22 + 20 * k, 28, red if k % 2 == 0 else white)
            u.E(2 + 20 * k, 22, 22 + 20 * k, 34, red if k % 2 == 0 else white)
        u.R(40, 0, 100, 12, white, 2)                                 # name board
        u.R(14, 62, 126, 98, (200, 150, 90, 255), 2)                  # counter
        u.L([(14, 76), (126, 76)], 1.6, wood)
        u.R(86, 50, 104, 62, (255, 255, 255, 255), 1.5)               # QRIS standee on the counter
    return usprite(h, fn, wmul=1.4)


def qr_like(s, seed=3):
    """A generic QR-style pattern (decorative, encodes nothing)."""
    n = 21
    r = random.Random(seed)
    im = Image.new('RGBA', (s, s), (255, 255, 255, 255))
    d = ImageDraw.Draw(im)
    c = s / n
    for y in range(n):
        for x in range(n):
            if r.random() < 0.45:
                d.rectangle([x * c, y * c, (x + 1) * c, (y + 1) * c], fill=(20, 20, 20, 255))
    for fx, fy in ((0, 0), (n - 7, 0), (0, n - 7)):
        d.rectangle([fx * c, fy * c, (fx + 7) * c, (fy + 7) * c], fill=(255, 255, 255, 255))
        d.rectangle([fx * c, fy * c, (fx + 7) * c - 1, (fy + 7) * c - 1], outline=(20, 20, 20, 255), width=int(c))
        d.rectangle([(fx + 2) * c, (fy + 2) * c, (fx + 5) * c, (fy + 5) * c], fill=(20, 20, 20, 255))
    return im


def phone_frame(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=70, fill=(35, 38, 48, 255))
    d.rounded_rectangle([22, 22, w - 23, h - 23], radius=52, fill=(250, 251, 255, 255))
    d.rounded_rectangle([w / 2 - 70, 40, w / 2 + 70, 74], radius=17, fill=(35, 38, 48, 255))
    return im


def notif_card(w, title, body, icol, stamp=''):
    f1, f2, f3 = F(DMB, 38), F(DMB, 33), F(DMB, 28)
    lines = _wrap(body, f2, w - 150)
    h = 100 + 44 * len(lines)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=26, fill=(238, 240, 246, 255), outline=(120, 125, 140, 255), width=3)
    d.rounded_rectangle([22, 24, 82, 84], radius=14, fill=tuple(icol) + (255,))
    d.text((104, 22), title, font=f1, fill=(25, 28, 40, 255))
    if stamp:
        d.text((w - 24, 26), stamp, font=f3, fill=(200, 50, 50, 255), anchor='ra')
    for i, l in enumerate(lines):
        d.text((104, 74 + 44 * i), l, font=f2, fill=(70, 74, 90, 255))
    return im


def cross(img, box, p, col=RED, width=9):
    x0, y0, x1, y1 = box
    pen_line(img, [(x0, y0), (x1, y1)], prog(p, 0, 0.5), col, width)
    pen_line(img, [(x1, y0), (x0, y1)], prog(p, 0.5, 1.0), col, width)


def tick(img, x, y, s, p, col=GREEN_OK, width=9):
    pen_line(img, [(x, y), (x + s * 0.35, y + s * 0.4), (x + s, y - s * 0.5)], p, col, width)


def fade_in(t, t0, d=0.35):
    return eout(prog(t, t0, t0 + d))


# ---------------------------------------------------------------- scene 3: uang pertama republik
class Scene3:
    dur = 27.0
    SUBS = [(0.5, 3.4, 'Tahun itu juga, tanggal tiga puluh Oktober,'),
            (3.5, 6.6, 'republik untuk pertama kali memakai uangnya sendiri:'),
            (6.7, 8.8, 'Oeang Republik Indonesia.'),
            (9.3, 13.9, 'Dengan uang itu, kita tidak lagi bergantung pada uang peninggalan penjajah.'),
            (17.4, 20.4, 'Uang itu sekarang namanya Rupiah.')]

    def __init__(self, prev_last):
        self.prev = prev_last
        self.page = notebook()
        self.date = Words('30 Oktober 1946', 104, RED)
        self.ori = Ink(inked(note_sketch(760, 'ORI', 'OEANG REPUBLIK INDONESIA', (230, 220, 190)), INKB, seed=41), seed=41)
        self.own = Words('uang republik sendiri', 70)
        self.old = [Ink(inked(note_sketch(360, '', '', (205, 205, 200)), PENCIL, seed=42), seed=42),
                    Ink(inked(note_sketch(360, '', '', (205, 205, 200)), PENCIL, seed=43), seed=43)]
        self.oldl = [Words('uang Jepang', 50, PENCIL), Words('uang De Javasche Bank', 44, PENCIL)]
        self.gone = Words('tidak berlaku lagi', 66, RED)
        # signature shot: 1946 and 2026 hands meet across a torn page
        self.split = split_page()
        ori = note_sketch(380, 'ORI', 'OEANG REPUBLIK INDONESIA', (230, 220, 190))
        rp = note_sketch(380, 'Rp', 'RUPIAH', (200, 220, 245))
        self.left = inked(grip_group(ori, hand_grip(400, (236, 228, 205, 255), (210, 160, 120, 255))), PENCIL, 1.0, seed=44)
        self.right = inked(grip_group(rp, hand_grip(400, (248, 248, 244, 255), (226, 176, 134, 255)), flip=True), INKB, 1.0, seed=45)
        self.y1946, self.y2026 = Words('1946', 130, PENCIL), Words('2026', 130)
        self.big = Words('Rupiah', 170)

    def page_a(self, t):
        img = self.page.copy()
        if t > 2.6:
            stabilo(img, (165, 250, 175 + self.date.w, 360), prog(t, 2.6, 3.0))
        self.date.put(img, 170, 240, prog(t, 1.0, 2.6), anchor='tl', pen='pen')
        self.ori.put(img, 540, 690, prog(t, 3.2, 5.0), anchor='c', pen='pen')
        if t > 5.2:
            pen_line(img, [(540, 1010), (540, 920)], prog(t, 5.2, 5.4), INKB, 5)
            pen_line(img, [(515, 950), (540, 920), (565, 950)], prog(t, 5.35, 5.5), INKB, 5)
        self.own.put(img, 540, 1060, prog(t, 5.4, 6.8), anchor='c', pen='pen')
        for i, n in enumerate(self.old):
            x, t0 = 300 + 480 * i, 9.6 + 0.6 * i
            n.put(img, x, 1210, prog(t, t0, t0 + 0.8), anchor='c')
            self.oldl[i].put(img, x, 1330, prog(t, t0 + 0.4, t0 + 1.1), anchor='c')
        for i in range(2):
            if t > 11.8 + 0.4 * i:
                cross(img, (150 + 480 * i, 1130, 450 + 480 * i, 1290), prog(t, 11.8 + 0.4 * i, 12.3 + 0.4 * i))
        self.gone.put(img, 540, 1440, prog(t, 12.6, 13.6), anchor='c', pen='pen')
        return camera(img, 1 + 0.05 * eio(prog(t, 0.8, 14.0)), 540, 900)

    def page_b(self, t):
        img = self.split.copy()
        self.y1946.put(img, 270, 380, prog(t, 14.9, 15.5), anchor='c')
        if t > 16.3:
            stabilo(img, (810 - self.y2026.w / 2, 340, 810 + self.y2026.w / 2, 440), prog(t, 16.3, 16.6))
        self.y2026.put(img, 810, 380, prog(t, 15.6, 16.2), anchor='c', pen='pen')
        # the hands slide in slowly through the silence and meet at the tear
        m = eio(prog(t, 14.8, 17.6))
        ov = 0                                     # the notes meet edge to edge
        put(img, self.left, lerp(-560, 0, m) + 540 + ov - self.left.width, 960 - self.left.height / 2, anchor='tl')
        put(img, self.right, lerp(560, 0, m) + 540 - ov, 960 - self.right.height / 2, anchor='tl')
        if t > 19.6:
            stabilo(img, (540 - self.big.w / 2, 1250, 540 + self.big.w / 2, 1400), prog(t, 19.6, 20.0))
        self.big.put(img, 540, 1320, prog(t, 18.6, 19.6), anchor='c', pen='pen')
        return img

    def frame(self, t):
        if t < 0.9:
            img = page_turn(self.prev, self.page_a(t), eio(prog(t, 0.0, 0.8)))
        elif t < 14.0:
            img = self.page_a(t)
        else:
            pb = camera(self.page_b(t), 1 + 0.1 * eio(prog(t, 14.8, 19.0)), 540, 900)
            img = page_turn(self.page_a(14.0), pb, eio(prog(t, 14.0, 14.8)))
        subtitle(img, t, self.SUBS)
        return img.convert('RGB')


# ---------------------------------------------------------------- scene 4: caraku menjaganya
class Scene4:
    dur = 23.0
    SUBS = [(0.5, 2.6, 'Jadi ini caraku menjaganya, Mas.'),
            (2.8, 6.6, 'Uang kertas di dompetku nggak aku lipat-lipat atau remas.'),
            (6.8, 9.4, 'Kalau terima kembalian, aku cek dulu:'),
            (9.4, 12.8, 'dilihat, diraba, diterawang.'),
            (13.4, 16.6, 'Di warung dekat sekolah, aku bayar pakai Rupiah,'),
            (16.7, 20.0, 'kadang tunai, kadang scan QRIS.')]

    def __init__(self, prev_last):
        self.prev = prev_last
        self.page = notebook()
        self.head = Words('Caraku menjaganya:', 92)
        back, front = wallet(700)
        self.wb, self.wf = Ink(inked(back, INKB, 0.45, seed=51), seed=51), inked(front, INKB, 0.6, seed=52)
        self.note = inked(note_sketch(560, 'Rp', 'RUPIAH', (200, 220, 245)), INKB, 0.5, seed=53)
        self.no = [Words('dilipat-lipat', 76, PENCIL), Words('diremas', 76, PENCIL)]
        # 3D check
        self.head2 = Words('Kembalian? cek 3D:', 88)
        small = note_sketch(300, 'Rp', 'RUPIAH', (200, 220, 245))
        self.icons = [Ink(inked(eye_icon(260), INKB, 0.5, seed=54), seed=54),
                      Ink(inked(finger_icon(260, small), INKB, 0.5, seed=55), seed=55),
                      Ink(inked(light_icon(260, small), INKB, 0.5, seed=56), seed=56)]
        self.d3 = [Words(w_, 96) for w_ in ('dilihat', 'diraba', 'diterawang')]
        # warung
        self.war = Ink(inked(warung(560), INKB, 0.45, seed=57), seed=57)
        self.war_name = text_sprite('WARUNG', 44, (60, 60, 70), DMB)
        self.rara = Ink(penline(rara(680, phone=True), INKB, w=7, seed=58), seed=58)
        self.pay = Words('bayar pakai Rupiah', 84)
        self.bub = [Words('kadang tunai', 58), Words('kadang scan QRIS', 58)]
        self.cash = inked(note_sketch(380, 'Rp', 'RUPIAH', (200, 220, 245)), INKB, 0.5, seed=59)
        ph = phone_frame(200, 360)
        ph.alpha_composite(qr_like(130), (35, 100))
        self.ph = inked(ph, INKB, 0.6, seed=60)
        self.qr_lbl = text_sprite('QRIS', 30, (60, 60, 70), DMB)

    def page_a(self, t):
        img = self.page.copy()
        self.head.put(img, 170, 240, prog(t, 0.9, 2.4), anchor='tl', pen='pen')
        self.wb.put(img, 540, 760, prog(t, 2.4, 3.2), anchor='c')
        # the note slides flat into the pocket
        if t > 3.0:
            ny = lerp(330, 640, eio(prog(t, 3.4, 4.6)))
            put(img, self.note, 540, ny, alpha=fade_in(t, 3.0))
        put(img, self.wf, 540, 760, alpha=eout(prog(t, 2.6, 3.2)))
        if t > 4.6:
            tick(img, 900, 560, 90, prog(t, 4.6, 5.0))
        for i, w_ in enumerate(self.no):
            x, y = (200, 720)[i], 1150
            w_.put(img, x, y, prog(t, 4.8 + 0.6 * i, 5.4 + 0.6 * i), anchor='tl')
            if t > 5.8 + 0.4 * i:
                pen_line(img, [(x - 10, y + 60), (x + w_.w + 10, y + 50)], prog(t, 5.8 + 0.4 * i, 6.2 + 0.4 * i), RED, 9)
        return img

    def page_b(self, t):
        img = self.page.copy()
        self.head2.put(img, 170, 240, prog(t, 7.4, 8.8), anchor='tl', pen='pen')
        for i, (ic, wd) in enumerate(zip(self.icons, self.d3)):
            t0 = 9.3 + 1.1 * i
            y = 560 + 400 * i
            ic.put(img, 300, y, prog(t, t0, t0 + 0.6), anchor='c')
            wd.put(img, 460, y, prog(t, t0 + 0.2, t0 + 0.8), anchor='l', pen='pen')
            if t > t0 + 0.8:
                tick(img, 480 + wd.w, y + 20, 80, prog(t, t0 + 0.8, t0 + 1.1))
        return img

    def page_c(self, t):
        img = self.page.copy()
        if t > 15.8:
            stabilo(img, (170 + self.pay.w - 230, 260, 175 + self.pay.w, 350), prog(t, 15.8, 16.2))
        self.pay.put(img, 170, 240, prog(t, 15.0, 15.9), anchor='tl', pen='pen')
        self.war.put(img, 680, 1530, prog(t, 13.8, 15.0), anchor='b')
        put(img, self.war_name, 680, 1530 - 560 + 22, alpha=fade_in(t, 14.8))
        self.rara.put(img, 250, 1580, prog(t, 14.2, 15.2), anchor='b')
        pen_line(img, [(140, 1580), (1080, 1580)], prog(t, 13.9, 14.5), (60, 60, 70), 6)
        # two ways to pay
        a1, a2 = fade_in(t, 16.8, 0.4), fade_in(t, 18.0, 0.4)
        put(img, self.cash, 300, lerp(620, 580, a1), alpha=a1, rot=4)
        self.bub[0].put(img, 300, 820, prog(t, 16.9, 17.8), anchor='c')
        put(img, self.ph, 800, lerp(600, 560, a2), alpha=a2, rot=-5)
        self.bub[1].put(img, 790, 820, prog(t, 18.1, 19.2), anchor='c')
        if t > 19.4:
            tick(img, 920, 450, 80, prog(t, 19.4, 19.7))
        return img

    def frame(self, t):
        if t < 0.9:
            img = page_turn(self.prev, self.page_a(t), eio(prog(t, 0.0, 0.8)))
        elif t < 6.6:
            img = self.page_a(t)
        elif t < 7.5:
            img = page_turn(self.page_a(6.6), self.page_b(t), eio(prog(t, 6.6, 7.4)))
        elif t < 13.0:
            img = self.page_b(t)
        else:
            img = page_turn(self.page_b(13.0), self.page_c(t), eio(prog(t, 13.0, 13.8)))
        subtitle(img, t, self.SUBS)
        return img.convert('RGB')


# ---------------------------------------------------------------- scene 5: medan perangku
PX0, PY0, PW, PH = 250, 330, 580, 1000      # phone on the page


class Scene5:
    dur = 23.0
    SUBS = [(0.5, 2.4, 'Medan perangku beda sama Mas.'),
            (2.6, 4.6, 'Ancamannya datang lewat HP.'),
            (5.0, 8.4, 'Ada link hadiah dari undian yang nggak pernah aku ikuti.'),
            (8.5, 10.0, 'Ada yang minta kode OTP.'),
            (10.1, 12.4, 'Ada diskon yang muncul jam dua pagi.'),
            (13.0, 15.2, 'Kode OTP nggak aku kasih ke siapa pun.'),
            (15.3, 17.6, 'Sebelum scan, aku cek nama merchant-nya.'),
            (17.7, 20.0, 'Sebelum checkout, aku tanya diri sendiri:'),
            (20.2, 22.6, 'butuh, atau cuma pengin?')]

    def __init__(self, prev_last):
        self.prev = prev_last
        self.page = notebook()
        self.head = Words('Medan perangku:', 92)
        self.phone = Ink(inked(phone_frame(PW, PH), INKB, 0.75, seed=61), seed=61)
        cw = PW - 70
        self.cards = [notif_card(cw, 'Selamat!', 'Kamu menang undian. Klaim hadiahmu lewat link ini.', (240, 170, 40)),
                      notif_card(cw, 'Pesan baru', 'Kirim kode OTP yang barusan masuk ya, buat verifikasi.', (90, 160, 90)),
                      notif_card(cw, 'Diskon 90%!', 'Cuma malam ini. Checkout sekarang sebelum habis.', (220, 70, 90), '02.00')]
        self.cy = [PY0 + 130, PY0 + 130 + self.cards[0].height + 24,
                   PY0 + 130 + self.cards[0].height + self.cards[1].height + 48]
        self.rules = [Words('OTP: rahasia', 64), Words('cek nama merchant', 64), Words('butuh, atau cuma pengin?', 64)]

    def page_(self, t):
        img = self.page.copy()
        self.head.put(img, 170, 200, prog(t, 0.8, 2.2), anchor='tl', pen='pen')
        self.phone.put(img, PX0, PY0, prog(t, 2.6, 3.6), anchor='tl')
        # notifications drop in smoothly, one per threat
        for i, (c, t0) in enumerate(zip(self.cards, (5.0, 8.5, 10.1))):
            a = fade_in(t, t0, 0.4)
            put(img, c, PX0 + 35, self.cy[i] - 40 * (1 - a), alpha=a, anchor='tl')
        # each one gets crossed out
        for i, t0 in ((0, 12.5), (1, 13.2), (2, 17.9)):
            if t > t0:
                c = self.cards[i]
                cross(img, (PX0 + 60, self.cy[i] + 10, PX0 + 35 + c.width - 25, self.cy[i] + c.height - 10), prog(t, t0, t0 + 0.5))
        for i, (r, t0) in enumerate(zip(self.rules, (13.4, 15.5, 20.2))):
            y = 1380 + 100 * i
            tick(img, 170, y + 10, 60, prog(t, t0, t0 + 0.3), INKB, 7)
            r.put(img, 260, y, prog(t, t0 + 0.2, t0 + 1.2), anchor='l', pen='pen')
        if t > 21.6:
            r = self.rules[2]
            stabilo(img, (255, 1550, 255 + r.w * 0.27, 1630), prog(t, 21.6, 22.0))
        return img

    def frame(self, t):
        if t < 0.9:
            img = page_turn(self.prev, self.page_(t), eio(prog(t, 0.0, 0.8)))
        else:
            img = self.page_(t)
        subtitle(img, t, self.SUBS)
        return img.convert('RGB')


# ---------------------------------------------------------------- scene 6: penutup surat
class Scene6:
    dur = 14.0
    SUBS = [(0.5, 2.8, 'Mas, aku nggak perlu angkat senjata.'),
            (3.0, 4.4, 'Yang aku jaga lebih kecil:'),
            (4.5, 8.2, 'uang di saku sendiri, dan kepercayaan orang pada uang itu.'),
            (8.6, 10.7, 'Surat ini aku tulis di Jalan Mastrip.'),
            (10.9, 13.4, 'Hormat dari pelajar tahun 2026.')]

    def __init__(self, prev_last):
        self.prev = prev_last
        self.page = notebook()
        self.lines = [Words('aku nggak perlu angkat senjata.', 60),
                      Words('yang aku jaga lebih kecil:', 66),
                      Words('uang di saku sendiri,', 66),
                      Words('dan kepercayaan orang', 66),
                      Words('pada uang itu.', 66)]
        self.sign = penline(street_sign(400, (40, 150, 90), (255, 255, 255), (60, 60, 60)).crop((0, 0, 400, 128 + 560)), INKB, seed=1, hatch=False)
        self.bike = penline(bike(500), INKB, seed=2, hatch=False)
        self.rara = penline(rara(820), INKB, w=7, seed=4)
        self.salute = penline(rara(820, salute=True), INKB, w=7, seed=4)
        self.ghost = Ink(penline(trip(860), PENCIL, w=7, seed=3), seed=3)
        self.sig = Words('Hormat, Rara (2026)', 64)

    def page_(self, t):
        img = self.page.copy()
        for i, (w_, t0, t1) in enumerate(zip(self.lines, (0.9, 3.0, 4.6, 6.0, 7.1), (2.6, 4.2, 5.8, 7.1, 7.9))):
            w_.put(img, 170, 230 + 100 * i, prog(t, t0, t1), anchor='tl', pen='pen')
        if t > 7.9:
            for i in (3, 4):
                y = 230 + 100 * i
                stabilo(img, (165, y + 18, 175 + self.lines[i].w, y + 88), prog(t, 7.9 + 0.2 * (i - 3), 8.2 + 0.2 * (i - 3)))
        pen_line(img, [(0, ROAD), (W, ROAD)], 1.0, (60, 60, 70), 7)
        pen_line(img, [(0, ROAD + 60), (W, ROAD + 60)], 1.0, (60, 60, 70), 4, dash=30)
        put(img, self.sign, 640, ROAD - self.sign.height, anchor='tl')
        self.ghost.put(img, 850, ROAD, prog(t, 8.8, 10.2), anchor='b', alpha=0.6)
        put(img, self.bike, 340, ROAD + 12, anchor='b')
        s = eio(prog(t, 10.9, 11.4))
        put(img, self.rara, 290, ROAD, anchor='b', alpha=1 - s)
        put(img, self.salute, 290, ROAD, anchor='b', alpha=s)
        self.sig.put(img, 1040 - self.sig.w, ROAD + 70, prog(t, 11.2, 12.6), anchor='tl', pen='pen')
        return img

    def frame(self, t):
        # slow crane up: starts close on the street, ends on the whole letter
        img = camera(self.page_(t), lerp(1.06, 1.0, eio(prog(t, 0.9, 9.0))), 540, 960)
        if t < 0.9:
            img = page_turn(self.prev, img, eio(prog(t, 0.0, 0.8)))
        subtitle(img, t, self.SUBS)
        return img.convert('RGB')


# ---------------------------------------------------------------- scene 7: end card
class Scene7:
    dur = 7.0

    def __init__(self, prev_last):
        self.prev = prev_last
        self.page = notebook()
        self.w = [Words('Cinta, Bangga,', 120, RED), Words('Paham Rupiah', 120, RED)]
        self.tags = [text_sprite('#CintaBanggaPahamRupiah', 52, INKB, DMB),
                     text_sprite('#MASTRIP   #ASRFest2026', 52, INKB, DMB),
                     text_sprite('@cbp.jatim   @bank_indonesia_jatim', 40, (60, 60, 70), DMB)]
        self.logos = [logo_cbp(330), logo_bi(440)]

    def page_(self, t):
        img = self.page.copy()
        self.w[0].put(img, 540, 640, prog(t, 0.9, 1.9), anchor='c', pen='pen')
        self.w[1].put(img, 540, 790, prog(t, 1.8, 2.8), anchor='c', pen='pen')
        if t > 2.8:
            stabilo(img, (540 - self.w[1].w / 2, 740, 540 + self.w[1].w / 2, 860), prog(t, 2.8, 3.2))
        for i, (tg, y) in enumerate(zip(self.tags, (1040, 1130, 1220))):
            put(img, tg, 540, y, alpha=fade_in(t, 3.0 + 0.25 * i, 0.4))
        a = fade_in(t, 3.8, 0.5)
        put(img, self.logos[0], 300, 1480, alpha=a)
        put(img, self.logos[1], 770, 1480, alpha=a)
        return img

    def frame(self, t):
        img = self.page_(t)
        if t < 0.9:
            img = page_turn(self.prev, img, eio(prog(t, 0.0, 0.8)))
        return img.convert('RGB')
