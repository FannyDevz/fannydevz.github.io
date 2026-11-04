"""Redesain gaya kerajinan kertas (tahap 1: Bandi, Lela, Kayla, latar Tugu).
Mengganti markup tokoh & generator latar di animasi/index.html. ID dan titik putar tetap sama,
jadi semua animasi/dialog/waktu tidak berubah. Jalankan sekali:  python3 animasi/alat/redesain_kertas.py <folder-proyek>"""
import re, sys
from pathlib import Path
p = Path(sys.argv[1]) / 'animasi' / 'index.html'
s = p.read_text(encoding='utf-8')

def between(a, b, new):
    global s
    i = s.index(a); j = s.index(b, i)
    s = s[:i] + new + s[j:]

def scales(x0, x1, ys, step, col, w=3.5):
    d = ' '.join(f'M{x} {y} q{step/2:g} {step/2:g} {step} 0' for y in ys for x in range(x0, x1, step))
    return f'<path fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" d="{d}"/>'

# ======================= BANDI (bandeng) =======================
BANDI = f'''  <!-- BANDI si bandeng: kerajinan kertas berlapis -->
  <g id="bandi"><g>
    <g id="bandiTail">
      <path class="pc" fill="#7D96A9" d="M-134 2 L-228 -68 Q-206 -22 -212 2 Q-206 26 -228 70 Z"/>
      <path class="pc" fill="#B4C6D3" d="M-138 0 L-214 -54 Q-196 -18 -200 0 Q-196 18 -214 54 Z"/>
      <path fill="none" stroke="#8FA7B9" stroke-width="3" stroke-linecap="round" d="M-148 -6 L-198 -36 M-148 6 L-198 36 M-150 0 L-194 0"/>
    </g>
    <path class="pc" fill="#7D96A9" d="M-50 -56 Q-6 -114 48 -62 Z"/>
    <path class="pc" fill="#A6BACA" d="M-38 -58 Q-4 -100 36 -62 Z"/>
    <path fill="#5F7789" d="M-146 6 C-106 -64 64 -78 146 -14 C168 6 168 20 146 36 C64 94 -106 78 -146 6 Z"/>
    <path class="pc" fill="#C6D3DE" d="M-150 0 C-110 -72 60 -86 142 -22 C164 -2 164 12 142 28 C60 86 -110 72 -150 0 Z"/>
    <path class="pc" fill="#93AABD" d="M-140 -8 C-100 -64 56 -80 138 -24 C70 -46 -50 -44 -140 -8 Z"/>
    <path class="pc" fill="#EEF2F1" d="M-126 20 C-60 58 60 66 134 30 C70 72 -60 68 -126 20 Z"/>
    {scales(-112, 76, [-30, -8, 14], 24, '#AEC0CE')}
    <path fill="#A6BACA" d="M86 -44 Q66 0 86 44 Q78 0 86 -44 Z"/>
    <g id="bandiFin"><path class="pc" fill="#7D96A9" d="M0 18 Q-22 64 -60 56 Q-36 30 0 18 Z"/><path fill="none" stroke="#B4C6D3" stroke-width="2.5" stroke-linecap="round" d="M-6 26 L-42 50 M-2 22 L-30 38"/></g>
    <g id="bandiE1"><circle class="pc" cx="62" cy="-20" r="21" fill="#FFFDF6"/><circle cx="68" cy="-18" r="10" fill="#1E2A33"/><circle cx="71" cy="-22" r="3.5" fill="#FFFFFF"/></g>
    <g id="bandiE2"><circle class="pc" cx="112" cy="-16" r="18" fill="#FFFDF6"/><circle cx="117" cy="-15" r="9" fill="#1E2A33"/><circle cx="120" cy="-19" r="3" fill="#FFFFFF"/></g>
    <g id="bandiGlasses" fill="none" stroke="#2A2622" stroke-width="6">
      <circle cx="62" cy="-20" r="27"/><circle cx="112" cy="-16" r="23"/><path d="M35 -22 L4 -30"/>
      <path stroke="#FFFFFF" stroke-width="3" stroke-opacity=".7" d="M46 -38 Q52 -44 60 -45 M100 -32 Q106 -37 112 -37"/>
    </g>
    <path id="bandiMC" fill="none" stroke="#5E2230" stroke-width="5" stroke-linecap="round" d="M136 14 Q148 22 158 10"/>
    <path id="bandiMO" class="pc" fill="#7A2633" d="M134 8 Q148 36 160 6 Z"/>
    <g id="bandiBow">
      <path class="pc" fill="#A51E1E" d="M64 50 L36 30 L36 70 Z"/><path class="pc" fill="#A51E1E" d="M64 50 L92 30 L92 70 Z"/>
      <path fill="#D62828" d="M64 50 L40 36 L40 64 Z"/><path fill="#D62828" d="M64 50 L88 36 L88 64 Z"/>
      <path fill="none" stroke="#A51E1E" stroke-width="2.5" d="M44 44 L58 50 M44 56 L58 50 M84 44 L70 50 M84 56 L70 50"/>
      <circle class="pc" cx="64" cy="50" r="9" fill="#C42323"/>
    </g>
    <g id="bandiFinUp"><path class="pc" fill="#7D96A9" d="M8 24 Q4 -14 30 -44 Q46 -36 36 -26 Q22 -4 26 22 Z"/></g>
  </g></g>

'''
between('  <!-- BANDI si bandeng -->', '  <!-- LELA si lele -->', BANDI)

# ======================= LELA (lele) =======================
LELA = f'''  <!-- LELA si lele: kerajinan kertas berlapis -->
  <g id="lela"><g>
    <g id="lelaTail">
      <path class="pc" fill="#3E584C" d="M-128 12 C-186 -60 -244 -28 -234 12 C-244 54 -186 82 -128 12 Z"/>
      <path class="pc" fill="#5D7F70" d="M-132 10 C-182 -48 -228 -22 -220 12 C-228 46 -182 68 -132 10 Z"/>
      <path fill="none" stroke="#4A6A5C" stroke-width="3" stroke-linecap="round" d="M-140 8 L-208 -16 M-140 10 L-214 12 M-140 12 L-208 38"/>
    </g>
    <path class="pc" fill="#3E584C" d="M-98 -42 Q-22 -110 58 -68 Q-20 -66 -98 -42 Z"/>
    <path class="pc" fill="#557567" d="M-86 -46 Q-20 -96 46 -66 Q-20 -64 -86 -46 Z"/>
    <path fill="#40594C" d="M-136 16 C-128 -56 44 -92 136 -36 C176 -10 176 52 130 72 C44 108 -126 88 -136 16 Z"/>
    <path class="pc" fill="#6E9181" d="M-140 10 C-132 -62 40 -98 132 -42 C172 -16 172 46 126 66 C40 102 -130 82 -140 10 Z"/>
    <path class="pc" fill="#BFD2C5" d="M-118 36 C-60 78 60 88 132 54 C60 72 -60 68 -118 36 Z"/>
    <g fill="#587A6B"><circle class="pc" cx="-70" cy="-20" r="10"/><circle class="pc" cx="-40" cy="-36" r="7"/><circle class="pc" cx="-92" cy="10" r="7"/><circle class="pc" cx="-20" cy="-8" r="8"/><circle class="pc" cx="10" cy="-30" r="6"/></g>
    <g id="lelaFin"><path class="pc" fill="#3E584C" d="M10 34 Q-12 80 -54 72 Q-30 44 10 34 Z"/><path fill="none" stroke="#6E9181" stroke-width="2.5" d="M4 42 L-34 64 M8 38 L-18 52"/></g>
    <circle class="pc" cx="106" cy="18" r="15" fill="#F29CA3"/>
    <g id="lelaE1"><circle class="pc" cx="66" cy="-28" r="25" fill="#FFFDF6"/><circle cx="72" cy="-26" r="14" fill="#1E2A33"/><circle cx="77" cy="-32" r="5" fill="#FFFFFF"/><circle cx="68" cy="-20" r="2.5" fill="#FFFFFF"/></g>
    <g id="lelaE2"><circle class="pc" cx="120" cy="-24" r="22" fill="#FFFDF6"/><circle cx="125" cy="-22" r="12" fill="#1E2A33"/><circle cx="129" cy="-27" r="4.5" fill="#FFFFFF"/><circle cx="121" cy="-17" r="2.2" fill="#FFFFFF"/></g>
    <path id="lelaMC" fill="none" stroke="#5E2230" stroke-width="5" stroke-linecap="round" d="M128 32 Q148 50 164 28"/>
    <g id="lelaMO"><path class="pc" fill="#7A2633" d="M124 26 Q148 74 166 22 Z"/><path fill="#F07C86" d="M136 44 Q148 62 158 42 Q148 48 136 44 Z"/></g>
    <g id="lelaWhisk" fill="none" stroke-linecap="round">
      <g stroke="#2E443A" stroke-width="8"><path d="M158 22 C185 6 200 -24 222 -14"/><path d="M160 30 C200 30 214 52 236 42"/><path d="M150 40 C170 70 162 94 182 106"/></g>
      <g stroke="#6E9181" stroke-width="2.5"><path d="M160 20 C185 4 200 -26 220 -17"/><path d="M162 28 C200 28 214 50 234 39"/></g>
    </g>
  </g></g>

'''
between('  <!-- LELA si lele -->', '  <ellipse id="lnet6"', LELA)

# ======================= KAYLA (badan, kepala) =======================
KAYLA = '''  <!-- Kayla: bagian belakang meja (boneka kertas) -->
  <g id="kaylaA">
    <g>
      <path class="pc" fill="#A51E1E" d="M-80 -4 L80 -4 L102 116 L-102 116 Z"/>
      <path class="pc" fill="#D62828" d="M-78 -4 L78 -4 L98 112 L-98 112 Z"/>
      <path fill="none" stroke="#B01F1F" stroke-width="3" d="M-46 2 L-58 110 M-16 2 L-20 110 M16 2 L20 110 M46 2 L58 110"/>
      <rect class="pc" x="-52" y="112" width="28" height="72" rx="6" fill="#E9B48A"/><rect class="pc" x="24" y="112" width="28" height="72" rx="6" fill="#E9B48A"/>
      <rect class="pc" x="-54" y="160" width="32" height="26" rx="4" fill="#FBF7EE"/><rect class="pc" x="22" y="160" width="32" height="26" rx="4" fill="#FBF7EE"/>
      <path class="pc" fill="#2A2622" d="M-70 196 Q-70 182 -46 182 L-18 182 Q-12 196 -18 204 L-66 204 Q-72 202 -70 196 Z"/>
      <path class="pc" fill="#2A2622" d="M70 196 Q70 182 46 182 L18 182 Q12 196 18 204 L66 204 Q72 202 70 196 Z"/>
    </g>
    <path class="pc" fill="#1C8474" d="M-98 -136 Q-98 -170 -64 -170 L64 -170 Q98 -170 98 -136 L102 -16 L-102 -16 Z"/>
    <path class="pc" fill="#2BB5A0" d="M-94 -138 Q-94 -166 -62 -166 L62 -166 Q94 -166 94 -138 L98 -20 L-98 -20 Z"/>
    <g id="kPony">
      <path class="pc" fill="#2B2118" d="M50 -276 C126 -286 146 -200 112 -146 C104 -190 82 -224 46 -244 Z"/>
      <path fill="none" stroke="#4A3A2C" stroke-width="3" stroke-linecap="round" d="M70 -266 C108 -262 122 -212 112 -170 M62 -252 C92 -246 100 -214 98 -188"/>
      <path class="pc" fill="#D62828" d="M58 -268 L36 -284 L38 -254 Z"/><path class="pc" fill="#D62828" d="M58 -268 L80 -286 L80 -254 Z"/><circle class="pc" cx="58" cy="-268" r="8" fill="#B51F1F"/>
    </g>
    <path class="pc" fill="#FBF7EE" d="M-82 0 L-80 -100 C-78 -140 -45 -152 0 -152 C45 -152 78 -140 80 -100 L82 0 Z"/>
    <path fill="#E8E0CF" d="M-82 0 L-80 -100 C-78 -134 -60 -146 -36 -150 C-58 -130 -62 -90 -60 0 Z"/>
    <path class="pc" fill="#1C8474" d="M-66 -146 L-48 -150 L-46 -2 L-64 -2 Z"/><path class="pc" fill="#1C8474" d="M66 -146 L48 -150 L46 -2 L64 -2 Z"/>
    <rect x="-16" y="-172" width="32" height="28" fill="#D9A07A"/>
    <path class="pc" fill="#FBF7EE" d="M-36 -152 L-2 -122 L-4 -158 Z"/><path class="pc" fill="#FBF7EE" d="M36 -152 L2 -122 L4 -158 Z"/>
    <path class="pc" fill="#D62828" d="M-11 -134 L11 -134 L15 -72 L0 -56 L-15 -72 Z"/><path fill="#A51E1E" d="M0 -134 L11 -134 L15 -72 L0 -56 Z"/>
    <g id="kHead">
      <circle class="pc" cx="0" cy="-232" r="76" fill="#2B2118"/>
      <ellipse class="pc" cx="-64" cy="-212" rx="12" ry="16" fill="#E9B48A"/><ellipse class="pc" cx="64" cy="-212" rx="12" ry="16" fill="#E9B48A"/>
      <ellipse cx="-64" cy="-212" rx="5" ry="8" fill="#D39570"/><ellipse cx="64" cy="-212" rx="5" ry="8" fill="#D39570"/>
      <ellipse class="pc" cx="0" cy="-218" rx="64" ry="62" fill="#F0C29C"/>
      <path class="pc" fill="#2B2118" d="M-70 -228 C-66 -300 66 -304 72 -232 L60 -246 L52 -232 L40 -250 L30 -236 L18 -254 L8 -240 L-4 -256 L-14 -240 L-26 -254 L-36 -238 L-48 -252 L-56 -236 Z"/>
      <circle cx="-40" cy="-190" r="12" fill="#F4A3A0"/><circle cx="40" cy="-190" r="12" fill="#F4A3A0"/>
      <g id="kEyes">
        <ellipse cx="-24" cy="-212" rx="9" ry="12" fill="#2B2118"/><ellipse cx="24" cy="-212" rx="9" ry="12" fill="#2B2118"/>
        <circle cx="-21" cy="-217" r="3.5" fill="#fff"/><circle cx="27" cy="-217" r="3.5" fill="#fff"/>
      </g>
      <g fill="none" stroke="#2B2118" stroke-width="6" stroke-linecap="round">
        <path id="kBrowN" d="M-36 -238 Q-24 -244 -12 -238 M12 -238 Q24 -244 36 -238"/>
        <path id="kBrowW" d="M-36 -234 L-12 -244 M12 -244 L36 -234"/>
        <path id="kBrowS" d="M-36 -250 Q-24 -258 -12 -250 M12 -250 Q24 -258 36 -250"/>
      </g>
      <path id="kMN" fill="none" stroke="#5E2230" stroke-width="5" stroke-linecap="round" d="M-10 -184 Q0 -178 10 -184"/>
      <path id="kMS" fill="none" stroke="#5E2230" stroke-width="5" stroke-linecap="round" d="M-12 -178 Q0 -188 12 -178"/>
      <ellipse id="kMO" class="pc" cx="0" cy="-180" rx="10" ry="13" fill="#7A2633"/>
      <path id="kMH" class="pc" fill="#7A2633" d="M-20 -190 Q0 -164 20 -190 Z"/>
      <ellipse id="kMT" class="pc" cx="0" cy="-182" rx="12" ry="8" fill="#7A2633"/>
    </g>
  </g>

'''
between('  <!-- Kayla: bagian belakang meja -->', '  <!-- meja Kayla -->', KAYLA)

# lengan Kayla: garis luar gelap -> pinggiran kertas terang; lengan baju & tangan jadi potongan kertas
i = s.index('  <!-- Kayla: lengan (di depan meja) -->'); j = s.index('  <g id="kBub"', i)
arms = s[i:j]
arms = arms.replace('stroke="#16324F" stroke-width="34"', 'stroke="#F1E6CF" stroke-width="30"')
arms = arms.replace('stroke="#F2C29B" stroke-width="22"', 'stroke="#E9B48A" stroke-width="23"')
arms = arms.replace('class="ol"', 'class="pc"').replace('fill="#FFFFFF"', 'fill="#FBF7EE"').replace('fill="#F2C29B"', 'fill="#E9B48A"')
arms = arms.replace('fill="#FFFBEF" d="M-104 -178', 'fill="#FFF8E6" d="M-104 -178')
s = s[:i] + arms + s[j:]

# ======================= LATAR TUGU =======================
TUGU = '''  <!-- ===== ADEGAN 4: TUGU (dunia 1920x1800, kamera naik) — kerajinan kertas ===== -->
  <g id="sc4">
    <rect width="1920" height="1800" fill="#86C3E2"/>
    <path fill="#9ACFE8" d="M0 420 Q240 380 480 416 T960 410 T1440 418 T1920 404 L1920 1800 L0 1800 Z"/>
    <path fill="#AEDAEE" d="M0 820 Q260 780 520 818 T1040 808 T1560 820 T1920 800 L1920 1800 L0 1800 Z"/>
    <path fill="#C4E4F2" d="M0 1160 Q300 1120 600 1156 T1200 1150 T1920 1140 L1920 1800 L0 1800 Z"/>
    <path fill="#DAEEF5" d="M0 1400 Q320 1370 640 1398 T1280 1390 T1920 1384 L1920 1800 L0 1800 Z"/>
    <g id="clouds4"></g>
    <g id="city4"></g>
    <g id="trees4"></g>
    <path fill="#C9A874" d="M0 1556 Q480 1540 960 1556 T1920 1550 L1920 1800 L0 1800 Z"/>
    <path fill="#DCC08E" d="M0 1576 Q480 1562 960 1578 T1920 1570 L1920 1800 L0 1800 Z"/>
    <g fill="none" stroke="#C4A472" stroke-width="5"><path d="M0 1650 Q480 1638 960 1652 T1920 1646"/><path d="M0 1730 Q480 1718 960 1732 T1920 1726"/></g>
    <!-- Tugu Bandeng Lele: patung kertas di atas tiang karton berlipat -->
    <g id="tugu">
      <ellipse cx="860" cy="1572" rx="420" ry="50" fill="#3E7A4E"/>
      <ellipse cx="860" cy="1562" rx="400" ry="44" fill="#5E9E5E"/>
      <g id="flowers4"></g>
      <path fill="#B9B2A2" d="M600 1500 L1120 1500 L1120 1562 L600 1562 Z"/><path fill="#D9D3C6" d="M600 1500 L860 1500 L860 1562 L600 1562 Z"/>
      <path fill="#C6BFAF" d="M660 1450 L1060 1450 L1060 1504 L660 1504 Z"/><path fill="#E4DFD3" d="M660 1450 L860 1450 L860 1504 L660 1504 Z"/>
      <path fill="#CFC8B8" d="M740 940 L980 940 L980 1452 L740 1452 Z"/><path fill="#ECE7DC" d="M740 940 L860 940 L860 1452 L740 1452 Z"/>
      <path fill="none" stroke="#BDB5A3" stroke-width="4" d="M800 960 L800 1430 M920 960 L920 1430"/>
      <rect x="776" y="1146" width="168" height="118" rx="6" fill="#8A6A32"/><rect x="784" y="1154" width="152" height="102" rx="4" fill="#C29A55"/>
      <rect x="800" y="1170" width="120" height="70" rx="3" fill="none" stroke="#9C7A3C" stroke-width="4"/>
      <path fill="#BDB5A3" d="M710 900 L1010 900 L1010 944 L710 944 Z"/><path fill="#DDD7CB" d="M710 900 L860 900 L860 944 L710 944 Z"/>
      <path fill="#C6BFAF" d="M750 870 L970 870 L970 904 L750 904 Z"/><path fill="#E9E4DA" d="M750 870 L860 870 L860 904 L750 904 Z"/>
      <g transform="translate(735 620) rotate(-110) scale(1.25)">
        <path fill="#7D96A9" d="M-134 2 L-228 -68 Q-206 -22 -212 2 Q-206 26 -228 70 Z"/>
        <path fill="#B4C6D3" d="M-138 0 L-214 -54 Q-196 -18 -200 0 Q-196 18 -214 54 Z"/>
        <path fill="#7D96A9" d="M-50 -56 Q-6 -114 48 -62 Z"/>
        <path fill="#5F7789" d="M-146 6 C-106 -64 64 -78 146 -14 C168 6 168 20 146 36 C64 94 -106 78 -146 6 Z"/>
        <path fill="#C6D3DE" d="M-150 0 C-110 -72 60 -86 142 -22 C164 -2 164 12 142 28 C60 86 -110 72 -150 0 Z"/>
        <path fill="#93AABD" d="M-140 -8 C-100 -64 56 -80 138 -24 C70 -46 -50 -44 -140 -8 Z"/>
        <path fill="#EEF2F1" d="M-126 20 C-60 58 60 66 134 30 C70 72 -60 68 -126 20 Z"/>
        ''' + scales(-112, 76, [-30, -8, 14], 24, '#AEC0CE') + '''
        <circle cx="104" cy="-14" r="11" fill="#2A2622"/>
      </g>
      <g transform="translate(990 604) rotate(-70) scale(1.25 -1.25)">
        <path fill="#3E584C" d="M-128 12 C-186 -60 -244 -28 -234 12 C-244 54 -186 82 -128 12 Z"/>
        <path fill="#5D7F70" d="M-132 10 C-182 -48 -228 -22 -220 12 C-228 46 -182 68 -132 10 Z"/>
        <path fill="#3E584C" d="M-98 -42 Q-22 -110 58 -68 Q-20 -66 -98 -42 Z"/>
        <path fill="#40594C" d="M-136 16 C-128 -56 44 -92 136 -36 C176 -10 176 52 130 72 C44 108 -126 88 -136 16 Z"/>
        <path fill="#6E9181" d="M-140 10 C-132 -62 40 -98 132 -42 C172 -16 172 46 126 66 C40 102 -130 82 -140 10 Z"/>
        <path fill="#BFD2C5" d="M-118 36 C-60 78 60 88 132 54 C60 72 -60 68 -118 36 Z"/>
        <g fill="#587A6B"><circle cx="-70" cy="-20" r="10"/><circle cx="-40" cy="-36" r="7"/><circle cx="-20" cy="-8" r="8"/></g>
        <circle cx="98" cy="-20" r="12" fill="#2A2622"/>
        <path fill="none" stroke="#2E443A" stroke-width="8" stroke-linecap="round" d="M158 22 C185 6 200 -24 222 -14 M160 30 C200 30 214 52 236 42"/>
      </g>
      <path fill="#2E7FB0" d="M726 884 Q758 830 792 872 Q826 818 860 864 Q894 818 928 872 Q962 830 994 884 Z"/>
      <path fill="#7CC0E2" d="M740 880 Q762 846 788 876 Q824 836 858 872 Q892 836 926 876 Q954 846 980 880 Z"/>
      <path fill="none" stroke="#FBF7EE" stroke-width="5" stroke-linecap="round" d="M770 860 q10 -10 20 0 M840 852 q10 -10 20 0 M906 860 q10 -10 20 0"/>
    </g>
  </g>

'''
between('  <!-- ===== ADEGAN 4: TUGU', '  <!-- ===== ADEGAN 5: TAMBAK', TUGU)

# ======================= generator latar (awan, kota, pohon, bunga) =======================
OLD_CLOUD = re.search(r"function cloud\(g,s,c='#FFFFFF'\)\{.*?return G;\}\n", s, re.S).group(0)
NEW_CLOUD = r"""function cloud(g,s,c='#FFFFFF'){const G=el('g',{},g),I=el('g',{transform:`scale(${s})`},G);   // awan kertas: 3 lapis bergerigi
  const blob=(dx,dy,col,k)=>{let d='';const pts=[[0,0,60],[60,-26,70],[130,0,56],[64,22,62]];
    pts.forEach(([cx,cy,r])=>{r*=k;d+=`M${cx+dx-r} ${cy+dy} a${r} ${r} 0 1 0 ${2*r} 0 a${r} ${r} 0 1 0 ${-2*r} 0 Z `;});el('path',{d,fill:col},I);};
  blob(6,10,'#D9CDB4',1);blob(0,0,c==='#FFFFFF'?'#FBF8F0':c,1);blob(-6,-8,'#FFFFFF',.72);return G;}
"""
s = s.replace(OLD_CLOUD, NEW_CLOUD, 1)
OLD_CITY = re.search(r"\{const g=\$\('city4'\);.*?k\+\+;\}\}\n", s, re.S).group(0)
NEW_CITY = r"""{const g=$('city4');let x=-20,k=0;const C=[['#C9B48E','#A99368'],['#A8C4CF','#88A6B2'],['#D8C7A4','#B8A57F'],['#B9CFB0','#97AF8E']];   // gedung karton
  while(x<1960){const w=110+rnd()*120,h=160+rnd()*260,[c,d]=C[k%4];
  el('rect',{x:x+6,y:1560-h+8,width:w,height:h,fill:d},g);el('rect',{x,y:1560-h,width:w,height:h,fill:c},g);
  el('rect',{x:x+w*.62,y:1560-h,width:w*.38,height:h,fill:d,opacity:.45},g);
  for(let wy=1560-h+24;wy<1520;wy+=44)for(let wx=x+18;wx<x+w-26;wx+=36)el('rect',{x:wx,y:wy,width:18,height:22,rx:2,fill:'#6E5A3C',opacity:.55},g);
  x+=w+10+rnd()*30;k++;}}
"""
s = s.replace(OLD_CITY, NEW_CITY, 1)
OLD_TREE = re.search(r"\[\[140,1\.1\],\[340,\.9\],\[1480,1\],\[1700,1\.2\],\[1880,\.85\]\]\.forEach.*?\n.*?\n.*?\}\);\n", s, re.S).group(0)
NEW_TREE = r"""[[140,1.1],[340,.9],[1480,1],[1700,1.2],[1880,.85]].forEach(([x,sc])=>{const G=el('g',{transform:`translate(${x} 1580) scale(${sc})`},$('trees4'));   // pohon daun berlapis
  el('path',{d:'M-14 0 L-10 -130 L10 -130 L14 0 Z',fill:'#7A5530'},G);el('path',{d:'M-2 0 L0 -130 L10 -130 L14 0 Z',fill:'#5E3F22'},G);
  [[0,-176,74,'#3E7A4E'],[-52,-136,56,'#3E7A4E'],[52,-136,56,'#3E7A4E'],[0,-182,62,'#5E9E5E'],[-46,-140,46,'#5E9E5E'],[46,-140,46,'#5E9E5E'],[-14,-196,36,'#8FBF6E'],[30,-150,26,'#8FBF6E']]
    .forEach(([cx,cy,r,f])=>el('circle',{cx,cy,r,fill:f},G));});
"""
s = s.replace(OLD_TREE, NEW_TREE, 1)
OLD_FLOW = re.search(r"for\(let i=0;i<26;i\+\+\)\{const a=i/26\*Math\.PI\*2;el\('circle'.*?\$\('flowers4'\)\);\}\n", s, re.S).group(0)
NEW_FLOW = r"""for(let i=0;i<26;i++){const a=i/26*Math.PI*2,x=860+Math.cos(a)*360,y=1562+Math.sin(a)*34,c=i%3?'#F2B632':'#D9442E',G=el('g',{transform:`translate(${x} ${y})`},$('flowers4'));   // bunga kertas 5 kelopak
  for(let k=0;k<5;k++){const b=k*Math.PI*2/5;el('circle',{cx:Math.cos(b)*8,cy:Math.sin(b)*8,r:7,fill:c},G);}el('circle',{cx:0,cy:0,r:5,fill:'#FBF2D0'},G);}
"""
s = s.replace(OLD_FLOW, NEW_FLOW, 1)

# ======================= filter bayangan antar-potongan =======================
if 'id="pc"' not in s:
    s = s.replace('  <filter id="ptex"', '''  <filter id="pc" x="-10%" y="-10%" width="130%" height="135%" color-interpolation-filters="sRGB">
    <feDropShadow dx="1.6" dy="2.6" stdDeviation="1.2" flood-color="#2A1A0A" flood-opacity=".38"/>
  </filter>
  <filter id="ptex"''', 1)
    s = s.replace('.brad{display:none}', '.brad{display:none}\nbody.paper .pc{filter:url(#pc)}   /* bayangan kecil antar-potongan kertas */', 1)
p.write_text(s, encoding='utf-8')
print('ok')
