"""Style 9 — Kolase Arsip. Scenes 3–8."""
import math
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from lib import *  # noqa: F401,F403
from styles import paper, torn, tint, multiply
from collage import (KRAFT, CREAM, INKC, jit, drop, place, shadow_of, sticker, word, tape, archival,
                     halftone_print, card_mask, rip_sheets)
from assets import (idn_map, map_xy, PINS, note, qr_img, phone, screen, icon, badge, rp_sticker, sheet, logo_bi, logo_cbp)

NAVYP = (34, 40, 66)
CHAR = (34, 32, 38)
WARM = (236, 226, 206)
GOLDP = (240, 190, 60)


def board(color, tex=12):
    return multiply(Image.new('RGBA', (W, H), tuple(color) + (255,)), paper(W, H, (255, 255, 255), tex))


def rays(size, color, n=18, alpha=150):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = size / 2
    for i in range(n):
        a0 = i * 2 * math.pi / n
        a1 = a0 + math.pi / n
        d.polygon([(c, c), (c + c * 1.5 * math.cos(a0), c + c * 1.5 * math.sin(a0)),
                   (c + c * 1.5 * math.cos(a1), c + c * 1.5 * math.sin(a1))], fill=tuple(color) + (alpha,))
    return multiply(im, paper(size, size, (255, 255, 255), 10)).convert('RGBA') if False else im


def float_put(img, spr, x, y, t, t0, seed, rot=0.0, amp=4, shadow=True):
    place(img, spr, x, y, t, t0, seed, rot=rot, shadow=shadow, jamp=amp)


def move(t, t0, t1, a, b):
    p = eio(prog(t, t0, t1))
    return lerp(a[0], b[0], p), lerp(a[1], b[1], p), p


def frame_photo(ph, b=22, seed=0):
    fr = Image.new('RGBA', (ph.width + 2 * b, ph.height + 2 * b), (244, 238, 224, 255))
    fr.alpha_composite(ph, (b, b))
    return torn(fr, seed, 8)


# ======================================================================
class Scene3C:
    """RUPIAH — simbol kedaulatan (00:30–00:50).

    Builds up to the word: struggle title → sovereignty map → everyday notes gather into the
    map → "RUPIAH" reveal only on the spoken word.
    """
    dur = 20.0

    def __init__(self):
        self.board = board(NAVYP)
        self.rays = rays(2300, (240, 190, 60), 22, 55)
        self.rp = rp_sticker(380)
        cols = [(170, 40, 50), (40, 90, 160), (40, 130, 90), (110, 60, 140), (200, 120, 40), (40, 140, 150)]
        self.notes = [sticker(note(330, c, i), 8) for i, c in enumerate(cols)]
        self.map = sticker(idn_map(980, (200, 30, 44)), 10)
        self.title = [word('PERJUANGAN', 190, CREAM, INKC, 305), word('TIDAK BERHENTI.', 120, (190, 30, 44), CREAM, 306)]
        self.duty = word('MENJAGA KEDAULATAN BANGSA', 84, GOLDP, INKC, 307)
        self.daily = word('SETIAP HARI KITA GUNAKAN', 78, CREAM, INKC, 308)
        self.words = [word('RUPIAH', 170, GOLDP, INKC, 301), word('SIMBOL KEDAULATAN NEGARA', 82, INKC, CREAM, 302)]
        skins = [(232, 182, 140), (190, 135, 95), (150, 100, 70), (215, 165, 120), (175, 120, 85), (225, 175, 130), (140, 92, 65)]
        tops = [(200, 50, 60), (60, 140, 200), (240, 190, 60), (90, 170, 120), (180, 80, 150), (240, 240, 240), (230, 120, 50)]
        heads = ['peci', 'hijab', 'blangkon', 'hair', 'hijab', 'cap', 'hair']
        hcs = [(25, 25, 25), (60, 130, 160), (110, 70, 40), (30, 22, 20), (200, 120, 160), (40, 90, 160), (30, 22, 20)]
        self.people = [sticker(figure(300, skins[i], tops[i], head=heads[i], headc=hcs[i]), 7) for i in range(7)]
        self.big = note(1000, (176, 30, 44), 9)
        mx0, my0 = 540 - self.map.width / 2, 930 - self.map.height / 2
        self.pins = [(mx0 + map_xy(lo, la, 980)[0] + 14, my0 + map_xy(lo, la, 980)[1] + 14) for lo, la in PINS]

    def frame(self, t):
        img = self.board.copy()
        if t < 0.9:
            p = eio(prog(t, 0.0, 0.8))
            put(img, self.rp, 540, 770 - 120 * p, scale=lerp(1.0, 0.7, p), rot=-4, alpha=1 - p)
        # 1 — "Perjuangan tidak berhenti…"
        out = eio(prog(t, 3.7, 4.3))
        for i, (w_, y) in enumerate(zip(self.title, (860, 1040))):
            s_, a_ = drop(t, 0.2 + 0.5 * i)
            a_ *= 1 - out
            x, y = 540 - out * 60, y - out * 120
            put(img, shadow_of(w_), x + 10, y + 14, scale=s_, rot=(-2, 1.5)[i], alpha=0.45 * a_)
            put(img, w_, x, y, scale=s_, rot=(-2, 1.5)[i], alpha=a_)
        # 2 — sovereignty: rays + map + pins
        ra = eio(prog(t, 4.0, 5.4)) * (1 - eio(prog(t, 18.0, 19.0)))
        if ra > 0:
            put(img, self.rays.rotate(t * 5, Image.BILINEAR), 540, 960, alpha=ra)
        place(img, self.map, 540, 930, t, 4.3, 31, rot=-1)
        if t > 5.4:
            for i, (px, py) in enumerate(self.pins):
                ph = (t * 0.8 + i * 0.37) % 1.0
                r = 8 + 26 * ph
                lay = Image.new('RGBA', (80, 80), (0, 0, 0, 0))
                d = ImageDraw.Draw(lay)
                d.ellipse([40 - r, 40 - r, 40 + r, 40 + r], outline=(255, 230, 150, int(220 * (1 - ph))), width=3)
                d.ellipse([31, 31, 49, 49], fill=(255, 220, 110, 255))
                put(img, lay, px, py, alpha=eio(prog(t, 5.4 + i * 0.12, 6.0 + i * 0.12)))
        da = 1 - eio(prog(t, 9.4, 9.9))
        if da > 0:
            s_, a_ = drop(t, 5.6)
            put(img, shadow_of(self.duty), 550, 1334, scale=s_, rot=1.5, alpha=0.45 * a_ * da)
            put(img, self.duty, 540, 1320, scale=s_, rot=1.5, alpha=a_ * da)
        # 3 — "…sesuatu yang setiap hari kita gunakan": notes orbit the map, then dive into the pins
        ya = 1 - eio(prog(t, 13.4, 13.9))
        if ya > 0:
            s_, a_ = drop(t, 10.6)
            put(img, shadow_of(self.daily), 550, 1594, scale=s_, rot=-1.5, alpha=0.45 * a_ * ya)
            put(img, self.daily, 540, 1580, scale=s_, rot=-1.5, alpha=a_ * ya)
        for i, n in enumerate(self.notes):
            t0 = 9.8 + 0.3 * i
            if t < t0:
                continue
            ang = math.radians(i * 60 + (t - 9.8) * 12)
            ox, oy = 540 + 380 * math.cos(ang), 900 + 560 * math.sin(ang)
            sx, sy = (-500 if i % 2 == 0 else W + 500), 900 + (i - 3) * 220
            p_in = eio(prog(t, t0, t0 + 1.1))
            x, y = lerp(sx, ox, p_in), lerp(sy, oy, p_in)
            p_out = eio(prog(t, 12.6 + i * 0.1, 13.8 + i * 0.1))
            pin = self.pins[i]
            x, y = lerp(x, pin[0], p_out), lerp(y, pin[1], p_out)
            sc = lerp(0.9, 0.15, p_out)
            a = 1 - prog(t, 14.2, 14.6)
            r_ = -15 + i * 7 + math.sin(t * 0.6 + i) * 4
            put(img, shadow_of(n), x + 10, y + 14, scale=sc, rot=r_, alpha=0.4 * a)
            put(img, n, x, y, scale=sc, rot=r_, alpha=a)
        # 4 — "RUPIAH." reveal
        if t >= 14.3:
            jx, jy, jr = jit(t, 3, 3)
            sc = 0.6 * eback(prog(t, 14.3, 14.9)) * (1 - 0.6 * eio(prog(t, 18.0, 18.8)))
            put(img, shadow_of(self.rp, 'rp'), 552 + jx, 316 + jy, scale=sc, rot=-4 + jr, alpha=0.5)
            put(img, self.rp, 540 + jx, 300 + jy, scale=sc, rot=-4 + jr)
        place(img, self.words[0], 540, 1290, t, 14.5, 33, rot=-2)
        place(img, self.words[1], 540, 1445, t, 15.0, 34, rot=1)
        for i, p in enumerate(self.people):
            place(img, p, 100 + 147 * i, 1730 + math.sin(t * 1.4 + i) * 5, t, 15.4 + 0.3 * i, 40 + i, rot=(-1) ** i * 3)
        # zoom into a banknote — fills the screen at the cut
        z = prog(t, 18.0, 20.0)
        if z > 0:
            img = overlay(img, NAVYP, 0.6 * eio(z))
            sc = lerp(0.5, 3.4, eio(z))
            put(img, shadow_of(self.big, 'big', 14), 556, 1000, scale=sc, alpha=0.5 * eout(z * 3))
            put(img, self.big, 540, 980, scale=sc, rot=lerp(-8, 0, eio(z)), alpha=eout(min(1, z * 3)))
        return img.convert('RGB')


# ======================================================================
class Scene4C:
    """CINTA, BANGGA, PAHAM (00:50–01:15)."""
    dur = 25.0

    def __init__(self):
        self.base = board((176, 30, 44))
        self.big = note(1000, (176, 30, 44), 9)
        self.strips = [sheet(W + 60, 690, (190, 30, 44), 401), sheet(W + 60, 690, WARM, 402), sheet(W + 60, 690, NAVYP, 403)]
        self.wallet = sticker(icon('wallet', 280), 8)
        self.n1 = sticker(note(270, (40, 130, 90), 2), 6)
        self.heart = sticker(icon('heartshield', 150), 7)
        self.map = sticker(idn_map(440, (200, 30, 44)), 6)
        self.coin = self._coin(170)
        self.flag = Flag(150, 100, amp=7, waves=1.3)
        self.prod = [badge('bag', 130), badge('cup', 130), badge('shop', 130)]
        self.n3 = note(380, (110, 60, 140), 4)
        self.n3s = sticker(self.n3, 7)
        self.n3big = self.n3.resize((self.n3.width * 3, self.n3.height * 3), Image.BICUBIC)
        self.chips = [word(s, 30, GOLDP, INKC, 410 + i, font=DMK) for i, s in enumerate(['DILIHAT', 'DIRABA', 'DITERAWANG'])]
        self.big_words = [word('CINTA', 200, INKC, CREAM, 420), word('BANGGA', 190, (190, 30, 44), CREAM, 421),
                          word('PAHAM', 200, GOLDP, INKC, 422)]
        self.subs = [word('Kenali dan rawat.', 50, CREAM, INKC, 430, font=DMB),
                     word('Simbol kedaulatan\nbangsa.', 46, INKC, CREAM, 431, font=DMB),
                     word('Kenali dan gunakan\ndengan bijak.', 44, CREAM, INKC, 432, font=DMB)]
        self.rp = rp_sticker(300)

    @staticmethod
    def _coin(size):
        im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.ellipse([0, 0, size - 1, size - 1], fill=(200, 140, 40, 255))
        d.ellipse([10, 10, size - 11, size - 11], fill=(242, 190, 82, 255))
        put(im, tspr('Rp', DMK, int(size * 0.36), (120, 75, 15), shadow=0), size / 2, size / 2)
        return sticker(im, 7)

    def _strip(self, k, t):
        lay = self.strips[k].copy()
        oy = 25  # strip content origin (torn edge padding)
        u = t - (0.3, 4.0, 11.6)[k]
        if k == 0:
            nx, ny, _ = move(u, 1.2, 2.8, (270, 150 + oy), (270, 360 + oy))
            place(lay, self.n1, nx, ny, u, 0.4, 51, rot=-8)
            place(lay, self.wallet, 270, 470 + oy, u, 0.2, 52, rot=3)
            place(lay, self.heart, 455, 170 + oy, u, 3.0, 53, rot=8)
        elif k == 1:
            place(lay, self.map, 270, 330 + oy, u, 0.3, 61, rot=-2)
            place(lay, self.coin, 270, 340 + oy, u, 0.9, 62)
            if u > 0.5:
                d = ImageDraw.Draw(lay)
                d.rectangle([70, 70 + oy, 76, 260 + oy], fill=(60, 40, 30, 255))
                put(lay, self.flag.frame(t), 76, 75 + oy - self.flag.A, anchor='tl', alpha=eio(prog(u, 0.5, 1.0)))
            for i, b in enumerate(self.prod):
                place(lay, b, 120 + 150 * i, 555 + oy, u, 1.5 + 0.3 * i, 63 + i, rot=(-1) ** i * 6)
        else:
            place(lay, self.n3s, 270, 270 + oy, u, 0.3, 71, rot=-3)
            if u > 1.2:
                a = eio(prog(u, 1.2, 1.8))
                mx = 150 + 240 * (0.5 - 0.5 * math.cos((u - 1.2) * 1.1))
                my = 270 + oy + 30 * math.sin((u - 1.2) * 0.8)
                r = 80
                lx, ly = mx - (270 - 190), my - (270 + oy - 91)
                zx, zy = lx * 3, ly * 3
                cr = self.n3big.crop((int(zx - r), int(zy - r), int(zx + r), int(zy + r)))
                m = Image.new('L', (2 * r, 2 * r), 0)
                ImageDraw.Draw(m).ellipse([0, 0, 2 * r - 1, 2 * r - 1], fill=255)
                lens = Image.new('RGBA', (2 * r + 80, 2 * r + 80), (0, 0, 0, 0))
                lens.paste(cr, (0, 0), m)
                d = ImageDraw.Draw(lens)
                d.ellipse([-6, -6, 2 * r + 5, 2 * r + 5], outline=(60, 60, 70, 255), width=12)
                d.line([2 * r - 18, 2 * r - 18, 2 * r + 70, 2 * r + 70], fill=(90, 60, 40, 255), width=22)
                put(lay, lens, mx + 40, my + 40, alpha=a)
            for i, c in enumerate(self.chips):
                place(lay, c, (105, 262, 445)[i], 505 + oy, u, 2.5 + 0.7 * i, 74 + i, rot=(-1) ** i * 3)
        bw = self.big_words[k]
        if t < 22.5:
            place(lay, bw, 790, 250 + oy, u, 0.6, 80 + k, rot=(-3, 2, -2)[k])
        place(lay, self.subs[k], 790, 440 + oy, u, 1.1, 85 + k, rot=(2, -2, 1)[k])
        return lay

    def frame(self, t):
        img = self.base.copy()
        offs = [(0, 0.0, 0.8), (W + 100, 4.0, 4.9), (-W - 100, 11.6, 12.5)]
        for k, (dx, t0, t1) in enumerate(offs):
            if t < t0:
                continue
            x = lerp(dx, 0, eio(prog(t, t0, t1)))
            lay = self._strip(k, t)
            put(img, shadow_of(lay, 'strip%d' % k, 14), x - 30 + 10, k * 625 - 32 + 18, alpha=0.5, anchor='tl')
            put(img, lay, x - 30, k * 625 - 32, anchor='tl')
        # opening: the banknote from scene 3 dissolves into the red board
        a = 1 - eio(prog(t, 0.0, 0.9))
        if a > 0:
            put(img, self.big, 540, 980, scale=3.4, alpha=a)
        # finale: the three words gather into one Rupiah sticker
        if t >= 22.5:
            img = overlay(img, NAVYP, 0.75 * eio(prog(t, 22.5, 23.4)))
            for k, bw in enumerate(self.big_words):
                x, y, p = move(t, 22.5, 23.9, (790, 250 + 625 * k - 7), (540, 960))
                put(img, bw, x, y, scale=lerp(1, 0.3, p), rot=lerp((-3, 2, -2)[k], 0, p), alpha=1 - eio(prog(t, 23.5, 24.0)))
            s, a = drop(t, 23.6, 0.6)
            put(img, self.rp, 540, 960, scale=s * lerp(1, 1.15, prog(t, 24.0, 25)), alpha=a)
            img = overlay(img, WARM, eio(prog(t, 24.3, 25.0)))
        return img.convert('RGB')


# ======================================================================
def market_card(w, h):
    im = vgrad(w, h, [(0, (250, 215, 165)), (0.5, (245, 235, 215)), (1, (200, 185, 160))])
    d = ImageDraw.Draw(im)
    d.rectangle([0, h * 0.62, w, h], fill=(170, 150, 125, 255))
    stripes = [((200, 30, 44), (250, 245, 235)), ((40, 130, 90), (250, 245, 235)), ((240, 170, 40), (250, 245, 235))]
    for k, cx in enumerate([w * 0.18, w * 0.5, w * 0.82]):
        sw = w * 0.34
        x0 = cx - sw / 2
        for i in range(8):
            c = stripes[k][i % 2]
            d.polygon([(x0 + i * sw / 8, h * 0.18), (x0 + (i + 1) * sw / 8, h * 0.18),
                       (x0 + (i + 1) * sw / 8 + 6, h * 0.30), (x0 + i * sw / 8 + 6, h * 0.30)], fill=c + (255,))
        d.rectangle([x0 + 8, h * 0.30, x0 + 18, h * 0.62], fill=(110, 70, 40, 255))
        d.rectangle([x0 + sw - 12, h * 0.30, x0 + sw - 2, h * 0.62], fill=(110, 70, 40, 255))
    put(im, figure(int(h * 0.45), (190, 135, 95), (240, 240, 240), head='hijab', headc=(200, 70, 90)), w * 0.5, h * 0.66, anchor='b')
    r = random.Random(4)
    for k, cx in enumerate([w * 0.18, w * 0.5, w * 0.82]):
        d.rectangle([cx - w * 0.17, h * 0.55, cx + w * 0.17, h * 0.66], fill=(140, 90, 50, 255))
        cols = [(240, 140, 40), (200, 40, 40), (90, 160, 60), (250, 210, 60)]
        for j in range(16):
            x = cx - w * 0.15 + (j % 8) * w * 0.04 + r.uniform(-4, 4)
            y = h * 0.545 - (j // 8) * 26 + r.uniform(-3, 3)
            rr = r.uniform(14, 20)
            d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=cols[(j + k) % 4] + (255,))
    return halftone_print(im, 0.15)


def qr_card(w, h):
    im = Image.new('RGBA', (w, h), (232, 240, 244, 255))
    d = ImageDraw.Draw(im)
    sx0, sy0, sw, shh = w * 0.15, h * 0.12, w * 0.7, h * 0.7
    d.rounded_rectangle([sx0, sy0, sx0 + sw, sy0 + shh], radius=30, fill=(255, 255, 255, 255), outline=(200, 200, 205, 255), width=4)
    d.rounded_rectangle([sx0, sy0, sx0 + sw, sy0 + 150], radius=30, fill=(200, 30, 44, 255))
    d.rectangle([sx0, sy0 + 110, sx0 + sw, sy0 + 150], fill=(200, 30, 44, 255))
    put(im, tspr('QRIS', BEBAS, 110, (255, 255, 255), shadow=0), w / 2, sy0 + 78)
    q = qr_img(int(sw * 0.72))
    put(im, q, w / 2, sy0 + 170 + q.height / 2, anchor='c')
    put(im, tspr('WARUNG BU SARI', DMK, 46, INKC, shadow=0), w / 2, sy0 + 210 + q.height + 30)
    put(im, tspr('Pindai untuk membayar', DMM, 30, (90, 90, 100), shadow=0), w / 2, sy0 + 210 + q.height + 90)
    d.polygon([(w * 0.42, sy0 + shh), (w * 0.58, sy0 + shh), (w * 0.64, h * 0.95), (w * 0.36, h * 0.95)], fill=(170, 170, 180, 255))
    return halftone_print(im, 0.08)


class Scene5C:
    """PERJUANGAN DI ERA DIGITAL (01:15–01:35)."""
    dur = 20.0

    def __init__(self):
        self.board = board(WARM)
        self.rp = rp_sticker(300)
        self.market = frame_photo(market_card(920, 980), 24, 501)
        self.buyer = sticker(figure(560, (225, 175, 130), (60, 140, 200), head='cap', headc=(220, 60, 60)), 8)
        self.cashn = sticker(note(220, (40, 90, 160), 5), 5)
        self.tags = [word('TUNAI', 110, INKC, CREAM, 510), word('QRIS', 110, (200, 30, 44), CREAM, 511)]
        self.qr = frame_photo(qr_card(920, 1180), 24, 502)
        self.sw, self.sh = 300, 590
        self.scr_scan = self._scr_scan()
        self.scr_confirm = self._scr_confirm()
        self.scr_ok = self._scr_ok()
        self.notif = self._notif()
        self.cash_big = sticker(note(420, (40, 130, 90), 6), 8)
        self.phone_big = sticker(phone(300, self._scr_qrpay()), 8)
        self.words = [word('TRANSAKSI MUDAH,', 130, INKC, CREAM, 520), word('TETAP BIJAK.', 190, (200, 30, 44), CREAM, 521)]
        self.plus = tspr('&', BEBAS, 200, INKC, shadow=0)
        self.zoom_phone = phone(300, screen(270, 555, CHAR))

    def _scr_scan(self):
        s = screen(self.sw, self.sh, (60, 64, 72))
        put(s, qr_img(170, 1), self.sw / 2, self.sh / 2)
        return s

    def _scr_confirm(self):
        s = screen(self.sw, self.sh)
        d = ImageDraw.Draw(s)
        put(s, tspr('Bayar ke', DMM, 26, (100, 100, 110), shadow=0), self.sw / 2, 120)
        d.rectangle([22, 160, self.sw - 22, 215], fill=(255, 230, 120, 255))
        put(s, tspr('WARUNG BU SARI', DMK, 28, INKC, shadow=0), self.sw / 2, 188)
        put(s, tspr('Rp25.000', DMK, 52, INKC, shadow=0), self.sw / 2, 290)
        d.rounded_rectangle([40, 470, self.sw - 40, 530], radius=20, fill=(40, 170, 90, 255))
        put(s, tspr('BAYAR', DMK, 30, (255, 255, 255), shadow=0), self.sw / 2, 500)
        return s

    def _scr_ok(self):
        s = screen(self.sw, self.sh)
        put(s, icon('check', 150), self.sw / 2, 230)
        put(s, tspr('Berhasil', DMK, 40, INKC, shadow=0), self.sw / 2, 360)
        put(s, tspr('Rp25.000', DMM, 30, (90, 90, 100), shadow=0), self.sw / 2, 410)
        return s

    def _scr_qrpay(self):
        s = screen(270, 555)
        put(s, tspr('QRIS', BEBAS, 60, (200, 30, 44), shadow=0), 135, 90)
        put(s, qr_img(190, 3), 135, 260)
        return s

    def _notif(self):
        w, h = 820, 170
        im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(im).rounded_rectangle([0, 0, w - 1, h - 1], radius=36, fill=(255, 255, 255, 255))
        put(im, icon('check', 110), 95, h / 2)
        put(im, tspr('Pembayaran Berhasil', DMK, 44, INKC, shadow=0), 180, 28, anchor='tl')
        put(im, tspr('Rp25.000 · Warung Bu Sari', DMM, 30, (90, 90, 100), shadow=0), 180, 88, anchor='tl')
        return sticker(im, 8)

    def frame(self, t):
        img = self.board.copy()
        if t < 0.6:
            put(img, self.rp, 540, 960, scale=1.15, alpha=1 - eio(prog(t, 0.0, 0.6)))
        # --- cash at the market
        mx = lerp(540, -700, eio(prog(t, 7.0, 8.0)))
        if mx > -650:
            place(img, self.market, mx, 720, t, 0.3, 501, rot=-2)
            place(img, self.tags[0], mx - 290, 1320, t, 1.2, 502, rot=-5)
            place(img, self.buyer, mx + 300, 1560, t, 0.8, 503, rot=2)
            if t > 2.3:
                x, y, p = move(t, 2.5, 4.4, (mx + 220, 1420), (mx - 20, 980))
                y -= 160 * math.sin(p * math.pi)
                put(img, shadow_of(self.cashn), x + 8, y + 12, rot=-10 + 20 * p, alpha=0.4)
                put(img, self.cashn, x, y, rot=-10 + 20 * p)
        # --- QRIS payment
        qx = lerp(W + 700, 540, eio(prog(t, 7.0, 8.0)))
        qx = lerp(qx, -800, eio(prog(t, 13.2, 14.2)))
        if 7.0 <= t and qx > -750:
            put(img, shadow_of(self.qr, 'qr', 12), qx + 12, 760 + 16, rot=1.5, alpha=0.45)
            put(img, self.qr, qx, 760, rot=1.5)
            place(img, self.tags[1], qx - 290, 1400, t, 8.3, 512, rot=4)
            scan = self.scr_scan.copy()
            yy = 160 + (math.sin((t - 8) * 3) * 0.5 + 0.5) * 270
            ImageDraw.Draw(scan).rectangle([20, yy, self.sw - 20, yy + 6], fill=(60, 230, 120, 255))
            scr = Image.blend(scan, self.scr_confirm, eio(prog(t, 9.85, 10.15)))
            scr = Image.blend(scr, self.scr_ok, eio(prog(t, 11.05, 11.35)))
            ph = sticker(phone(330, scr), 8)
            px, py = qx + 260, lerp(2300, 1440, eio(prog(t, 7.8, 8.6)))
            put(img, tint(ph, (0, 0, 0)).filter(ImageFilter.GaussianBlur(10)), px + 10, py + 14, rot=-8, alpha=0.45)
            put(img, ph, px, py, rot=-8)
            if 11.2 <= t < 12.6:
                lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
                d = ImageDraw.Draw(lay)
                for k in range(8):
                    p = ((t - 11.2) * 1.4 - k * 0.09)
                    if 0 <= p <= 1:
                        x, y = lerp(px - 40, qx - 120, p), lerp(py - 300, 420, p) - 120 * math.sin(p * math.pi)
                        d.ellipse([x - 12, y - 12, x + 12, y + 12], fill=(240, 190, 60, 255))
                img.alpha_composite(lay)
            if t > 12.2:
                place(img, self.notif, 540, 230 + lerp(-300, 0, eio(prog(t, 12.2, 12.8))), t, 12.2, 530)
        # --- cash & digital side by side
        if t > 13.6:
            a = 1 - eio(prog(t, 18.4, 19.0))
            for spr, x, y, t0, sd, r in [(self.cash_big, 290, 760, 14.0, 540, -8), (self.phone_big, 790, 760, 14.3, 541, 6)]:
                if spr is self.phone_big:
                    continue
                s, aa = drop(t, t0)
                if aa > 0:
                    jx, jy, jr = jit(t, sd, 4)
                    put(img, shadow_of(spr), x + jx + 10, y + jy + 14, scale=s, rot=r + jr, alpha=0.45 * aa * a)
                    put(img, spr, x + jx, y + jy, scale=s, rot=r + jr, alpha=aa * a)
            put(img, self.plus, 540, 760, alpha=eio(prog(t, 14.2, 14.6)) * a)
            place(img, self.words[0], 540, 1260, t, 14.6, 550, rot=-2) if a > 0.99 else None
            place(img, self.words[1], 540, 1440, t, 15.1, 551, rot=2) if a > 0.99 else None
            if 0 < a <= 0.99:
                put(img, self.words[0], 540, 1260, rot=-2, alpha=a)
                put(img, self.words[1], 540, 1440, rot=2, alpha=a)
            # phone: lands, then dives toward the camera
            s, aa = drop(t, 14.3)
            z = eio(prog(t, 18.4, 20.0))
            x, y = lerp(790, 540, eio(prog(t, 18.4, 19.4))), lerp(760, 960, eio(prog(t, 18.4, 19.4)))
            jx, jy, jr = jit(t, 541, 4)
            rot = lerp(6 + jr, 0, eio(prog(t, 18.4, 19.4)))
            if z <= 0:
                put(img, shadow_of(self.phone_big), x + jx + 10, y + jy + 14, scale=s, rot=rot, alpha=0.45 * aa)
                put(img, self.phone_big, x + jx, y + jy, scale=s, rot=rot, alpha=aa)
            else:
                put(img, self.phone_big, x, y, scale=lerp(1, 8.5, z), rot=rot)
                put(img, self.zoom_phone, x, y, scale=lerp(1, 8.5, z), rot=rot, alpha=eio(prog(z, 0.05, 0.7)))
        return img.convert('RGB')


# ======================================================================
def threat_card(kind, w=900, h=430):
    im = Image.new('RGBA', (w, h), (222, 216, 204, 255))
    d = ImageDraw.Draw(im)
    if kind == 0:
        put(im, figure(380, (215, 165, 120), (180, 80, 150), head='hair', headc=(30, 22, 20)), 230, 420, anchor='b')
        for i, (x, y, c) in enumerate([(120, 300, (230, 120, 60)), (330, 320, (60, 140, 200)), (95, 380, (240, 190, 60)),
                                       (350, 390, (200, 30, 44))]):
            put(im, icon('bag', 110), x, y)
        for i, (txt, x, y, r) in enumerate([('SALE 90%', 610, 110, -8), ('DISKON!', 760, 230, 6), ('CHECKOUT', 600, 330, 4)]):
            put(im, word(txt, 52, (215, 30, 40), (255, 255, 255), 600 + i), x, y, rot=r)
    elif kind == 1:
        s = screen(250, 490)
        sd = ImageDraw.Draw(s)
        sd.rounded_rectangle([14, 110, 236, 330], radius=18, fill=(225, 235, 245, 255))
        put(s, tspr('SELAMAT!\nAnda menang\nhadiah.\nKlik link ini:', DMB, 22, INKC, shadow=0), 125, 200)
        put(s, tspr('hadiah-gratis.xyz', DMB, 19, (30, 90, 220), shadow=0), 125, 300)
        put(im, phone(190, s), 200, h / 2)
        put(im, tspr('Pesan dari\nnomor tak dikenal', DMB, 36, (90, 80, 80), shadow=0), 640, 210)
    else:
        s = screen(250, 490)
        sd = ImageDraw.Draw(s)
        put(s, tspr('Transfer ke', DMM, 22, (100, 100, 110), shadow=0), 125, 110)
        put(s, tspr('??? ????', DMK, 36, (200, 30, 44), shadow=0), 125, 160)
        put(s, tspr('Rp2.500.000', DMK, 34, INKC, shadow=0), 125, 250)
        sd.rounded_rectangle([30, 380, 220, 440], radius=20, fill=(40, 170, 90, 255))
        put(s, tspr('KIRIM', DMK, 28, (255, 255, 255), shadow=0), 125, 410)
        put(im, phone(190, s), 200, h / 2)
        put(im, tspr('Belum cek\nnama penerima', DMB, 36, (90, 80, 80), shadow=0), 640, 210)
    im = halftone_print(im, 0.12)
    return torn(im, 700 + kind, 10)


def brush_x(size, p1, p2):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = random.Random(5)
    for (a, b, p) in [((0.1, 0.1), (0.9, 0.9), p1), ((0.9, 0.12), (0.12, 0.88), p2)]:
        if p <= 0:
            continue
        ex, ey = lerp(a[0], b[0], p), lerp(a[1], b[1], p)
        for k in range(6):
            o = r.uniform(-0.02, 0.02)
            d.line([(a[0] + o) * size, (a[1] - o) * size, (ex + o) * size, (ey - o) * size], fill=(215, 25, 35, 230), width=int(size * 0.06))
    return im


class Scene6C:
    """MUSUH YANG TIDAK TERLIHAT (01:35–01:55)."""
    dur = 20.0

    def __init__(self):
        self.board = board(CHAR, 14)
        self.title = [word('MUSUH YANG', 150, CREAM, INKC, 601), word('TIDAK TERLIHAT', 170, (200, 30, 44), CREAM, 602)]
        self.cards = [threat_card(i) for i in range(3)]
        self.labels = [word('KENALI KEBUTUHAN', 70, INKC, CREAM, 611), word('WASPADA PENIPUAN', 70, (200, 30, 44), CREAM, 612),
                       word('PERIKSA SEBELUM MEMBAYAR', 62, GOLDP, INKC, 613)]
        self.warn = sticker(icon('warning', 130), 7)
        self.warn_big = sticker(icon('warning', 420), 12)
        self.shield = sticker(icon('shield', 440), 12)

    def frame(self, t):
        img = self.board.copy()
        fo = 1 - eio(prog(t, 2.9, 3.4))
        if fo > 0:
            for i, w_ in enumerate(self.title):
                s, a = drop(t, 0.3 + 0.4 * i)
                put(img, w_, 540, 860 + 160 * i, scale=s, rot=(-3, 2)[i], alpha=a * fo)
        cf = 1 - eio(prog(t, 16.8, 17.5))
        ys = [430, 960, 1490]
        for i, c in enumerate(self.cards):
            t0 = (3.5, 5.0, 6.4)[i]
            if cf <= 0 or t < t0:
                continue
            s, a = drop(t, t0)
            jx, jy, jr = jit(t, 620 + i, 3)
            rot = (-2, 1.5, -1)[i] + jr
            put(img, shadow_of(c), 540 + jx + 12, ys[i] + jy + 16, scale=s, rot=rot, alpha=0.5 * a * cf)
            put(img, c, 540 + jx, ys[i] + jy, scale=s, rot=rot, alpha=a * cf)
            s2, a2 = drop(t, t0 + 0.35)
            put(img, self.warn, 95, ys[i] - 175, scale=s2 * (1 + 0.06 * math.sin(t * 6)), rot=-8, alpha=a2 * cf)
            s3, a3 = drop(t, t0 + 0.6)
            put(img, self.labels[i], 700, ys[i] + 185, scale=s3, rot=(3, -2, 2)[i], alpha=a3 * cf)
            px = (13.0, 13.6, 14.2)[i]
            if t > px:
                x = brush_x(380, eio(prog(t, px, px + 0.25)), eio(prog(t, px + 0.22, px + 0.47)))
                put(img, x, 260, ys[i], alpha=cf)
        if t > 12.5:
            img = overlay(img, (0, 0, 0), 0.0)
        # warning → shield
        if t > 17.1:
            fl = eio(prog(t, 18.5, 19.4))
            sx = abs(math.cos(fl * math.pi))
            spr = self.warn_big if fl < 0.5 else self.shield
            s, a = drop(t, 17.1, 0.6)
            img = overlay(img, WARM, eio(prog(t, 19.2, 20.0)))
            sp = spr.resize((max(1, int(spr.width * sx)), spr.height)) if sx < 0.999 else spr
            put(img, sp, 540, 960, scale=s, alpha=a)
        return img.convert('RGB')


# ======================================================================
class Scene7C:
    """PAHLAWAN MASA KINI (01:55–02:15)."""
    dur = 20.0

    def __init__(self):
        self.board = board(WARM)
        self.outer = board(KRAFT, 14)
        self.mask = card_mask(W, H, 777, 14)
        self.rays = rays(1800, (240, 190, 60), 22, 70)
        self.shield = sticker(icon('shield', 440), 12)
        self.hero = sticker(youth(860), 12)
        kinds = ['wallet', 'magnifier', 'qrcheck', 'lock', 'shop']
        labels = ['RAWAT\nRUPIAH', 'CEK\nKEASLIAN', 'CEK NAMA\nMERCHANT', 'JAGA\nPIN & OTP', 'DUKUNG\nPRODUK LOKAL']
        self.badges = [badge(k, 190) for k in kinds]
        self.blabels = [word(l, 46, INKC, CREAM, 710 + i) for i, l in enumerate(labels)]
        self.bpos = [(190, 300), (540, 300), (890, 300), (365, 620), (715, 620)]
        self.flag = Flag(720, 470, amp=22, waves=1.3)
        r = random.Random(7)
        self.crowd = []
        for i in range(9):
            hgt = r.randint(520, 640)
            spr = sticker(figure(hgt, (0, 0, 0), (0, 0, 0), head=r.choice(['peci', 'hijab', 'hair', 'cap']), sil=(40, 46, 80)), 6)
            self.crowd.append((spr, 60 + i * 120 + r.uniform(-20, 20), 1880 + r.uniform(-20, 30)))
        self.outer_crowd = []
        for i in range(14):
            hgt = r.randint(260, 340)
            spr = sticker(figure(hgt, (0, 0, 0), (0, 0, 0), head=r.choice(['peci', 'hijab', 'hair', 'cap']), sil=(70, 60, 60)), 5)
            self.outer_crowd.append((spr, -40 + i * 85 + r.uniform(-15, 15), 1900 + r.uniform(-10, 20)))
        self.words = [word('PAHLAWAN MASA KINI', 120, (200, 30, 44), CREAM, 720),
                      word('DIMULAI DARI DIRI SENDIRI.', 76, INKC, CREAM, 721)]
        self.tapes = [tape(seed=730 + i) for i in range(2)]

    def inner(self, t):
        img = self.board.copy()
        ra = eio(prog(t, 0.3, 1.2)) * (1 - eio(prog(t, 12.0, 12.6)))
        if ra > 0:
            put(img, self.rays.rotate(t * 5, Image.BILINEAR), 540, 1150, alpha=ra)
        fa = eio(prog(t, 12.2, 13.0))
        if fa > 0:
            fl = torn(self.flag.frame(t), 740, 8)
            put(img, fl, 540, lerp(200, 380, fa), alpha=fa, rot=-1)
        for i, (spr, x, y) in enumerate(self.crowd):
            s, a = drop(t, 12.6 + i * 0.12)
            put(img, spr, x, y + math.sin(t + i) * 4, scale=s, alpha=a * 0.95, anchor='b')
        s, a = drop(t, 0.6, 0.7)
        bob = math.sin(t * 1.3) * 6
        put(img, shadow_of(self.hero, 'hero', 14), 556, 1855 + bob, scale=s, alpha=0.4 * a, anchor='b')
        put(img, self.hero, 540, 1840 + bob, scale=s, alpha=a, anchor='b')
        bo = 1 - eio(prog(t, 12.0, 12.7))
        for i, (b, (x, y)) in enumerate(zip(self.badges, self.bpos)):
            t0 = 2.8 + 1.4 * i
            s, a = drop(t, t0, 0.6)
            if a <= 0 or bo <= 0:
                continue
            dy = -200 * eio(prog(t, 12.0, 12.7))
            jx, jy, jr = jit(t, 750 + i, 4)
            put(img, shadow_of(b), x + jx + 8, y + jy + dy + 12, scale=s, alpha=0.4 * a * bo)
            put(img, b, x + jx, y + jy + dy, scale=s, rot=jr, alpha=a * bo)
            s2, a2 = drop(t, t0 + 0.3, 0.6)
            put(img, self.blabels[i], x + jx, y + 150 + jy + dy, scale=s2, rot=(-1) ** i * 3, alpha=a2 * bo)
        place(img, self.words[0], 540, 740, t, 13.2, 760, rot=-2)
        place(img, self.words[1], 540, 870, t, 13.7, 761, rot=1.5)
        if t < 1.3:
            p = eio(prog(t, 0.2, 1.2))
            put(img, self.shield, 540, 960, scale=1 + 0.8 * p, alpha=1 - p)
        return img

    def frame(self, t):
        img = self.inner(t)
        z = eio(prog(t, 17.3, 19.8))
        if z <= 0:
            return img.convert('RGB')
        s = lerp(1.0, 0.72, z)
        page = img.copy()
        page.putalpha(self.mask)
        out = self.outer.copy()
        for i, (spr, x, y) in enumerate(self.outer_crowd):
            put(out, spr, x, y, alpha=eio(prog(t, 17.6 + i * 0.05, 18.4 + i * 0.05)), anchor='b')
        cy = lerp(960, 920, z)
        put(out, shadow_of(page.resize((W // 4, H // 4)), 'page7', 6).resize((int(W * s), int(H * s))), 540 + 16 * z, cy + 20 * z, alpha=z)
        put(out, page, 540, cy, scale=s, rot=-1.5 * z)
        for i, (x, y, r) in enumerate([(540 - W * s / 2 + 40, cy - H * s / 2 + 20, -35), (540 + W * s / 2 - 40, cy - H * s / 2 + 20, 35)]):
            put(out, self.tapes[i], x, y, rot=r, alpha=eio(prog(t, 18.6, 19.2)))
        return out.convert('RGB')


# ======================================================================
class Scene8C:
    """ESTAFET PERJUANGAN — penutup (02:15–02:30)."""
    dur = 15.0

    def __init__(self):
        self.board = board(KRAFT, 14)
        src = vgrad(440, 600, [(0, (210, 210, 210)), (1, (90, 90, 90))])
        put(src, fighter(560, (25, 25, 25), 0), 230, 610, anchor='b')
        self.past = frame_photo(archival(src, 8), 22, 801)
        src = vgrad(440, 600, [(0, (90, 160, 230)), (1, (220, 240, 250))])
        put(src, youth(560), 220, 610, anchor='b')
        self.now = frame_photo(halftone_print(src, 0.14), 22, 802)
        self.cap = [word('1945', 80, GOLDP, INKC, 803), word('HARI INI', 70, (40, 90, 160), CREAM, 804)]
        self.flag = Flag(520, 340, amp=20, waves=1.3)
        self.rp = rp_sticker(260)
        self.tapes = [tape(seed=810 + i) for i in range(4)]
        self.w1 = word('CINTA, BANGGA, PAHAM RUPIAH.', 84, INKC, CREAM, 820)
        self.w2 = word('PERJUANGAN BELUM SELESAI.', 106, (200, 30, 44), CREAM, 821)
        self.top, self.bot = rip_sheets(15)
        self.logos = [logo_cbp(390), logo_bi(470)]
        self.end_rp = rp_sticker(230)
        self.end_words = [word('CINTA · BANGGA · PAHAM RUPIAH', 64, (200, 30, 44), CREAM, 830),
                          word('#CintaBanggaPahamRupiah', 46, INKC, CREAM, 831, font=DMB),
                          word('#MASTRIP   #ASRFest2026', 46, INKC, CREAM, 832, font=DMB)]
        self.prev = Scene7C().frame(Scene7C.dur - 1 / FPS).convert('RGBA')

    def frame(self, t):
        img = self.board.copy()
        if t < 0.8:
            put(img, self.prev, 540, 960, alpha=1 - eio(prog(t, 0.0, 0.7)))
        fl = torn(self.flag.frame(t), 850, 8)
        place(img, fl, 540, 330, t, 0.2, 851, rot=-1, shadow=False)
        place(img, self.past, 270, 960, t, 0.5, 852, rot=-5)
        place(img, self.now, 810, 960, t, 1.1, 853, rot=5)
        for i, (x, y, r, t0) in enumerate([(160, 650, -30, 0.9), (380, 640, 25, 1.0), (700, 640, -25, 1.5), (920, 650, 30, 1.6)]):
            place(img, self.tapes[i], x, y, t, t0, 860 + i, rot=r, shadow=False, jamp=1)
        place(img, self.cap[0], 270, 1310, t, 1.6, 870, rot=4)
        place(img, self.cap[1], 810, 1310, t, 2.0, 871, rot=-4)
        # dashed relay line: past → Rupiah → present
        dp = prog(t, 3.0, 5.0)
        if dp > 0:
            lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            d = ImageDraw.Draw(lay)
            pts = [(270 + (810 - 270) * u, 1400 + 120 * math.sin(u * math.pi)) for u in np.linspace(0, 1, 60)]
            n = int(len(pts) * eio(dp))
            for k in range(0, max(0, n - 1), 2):
                d.line([pts[k], pts[k + 1]], fill=(200, 30, 44, 255), width=8)
            img.alpha_composite(lay)
        place(img, self.rp, 540, 1460, t, 3.6, 880, rot=-3)
        place(img, self.w1, 540, 1680, t, 6.4, 881, rot=-1.5)
        place(img, self.w2, 540, 1830, t, 10.2, 882, rot=1.5)
        # end card: the torn flag sheets close in
        p1, p2 = prog(t, 11.9, 12.6), prog(t, 12.1, 12.8)
        if p1 > 0:
            put(img, self.top, W / 2, -self.top.height + eio(p1) * (H / 2 + 70) + self.top.height / 2)
        if p2 > 0:
            put(img, self.bot, W / 2, H + self.bot.height / 2 - eio(p2) * (H / 2 + 70))
        if t > 12.6:
            mtext(img, t, 'PAHLAWAN MASA KINI', BEBAS, 140, 540, 600, 12.7, None, CREAM, din=0.6, shadow=0.3)
            mtext(img, t, 'ADALAH KITA.', BEBAS, 200, 540, 760, 12.9, None, GOLDP, din=0.6, shadow=0.3)
            place(img, self.end_rp, 540, 960, t, 13.0, 890, rot=-4)
            for i, (y, t0) in enumerate([(1180, 13.2), (1310, 13.45), (1405, 13.6)]):
                place(img, self.end_words[i], 540, y, t, t0, 891 + i, rot=(-1.5, 1, -1)[i])
            a = eout(prog(t, 13.7, 14.0))
            put(img, self.logos[0], 285, 1570, alpha=a)
            put(img, self.logos[1], 770, 1570, alpha=a)
        img = overlay(img, (0, 0, 0), eio(prog(t, 14.3, 15.0)))
        return img.convert('RGB')
