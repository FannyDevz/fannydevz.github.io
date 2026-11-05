'use strict';

/* ==========================================================
   Pelihara Batu Virtual
   Isi file:
   1. Data (jenis batu, aksesori, latar, level, pencapaian)
   2. Bank kalimat
   3. Penyimpanan dan state
   4. Gambar: batu, aksesori, latar
   5. Efek dan suara
   6. Aksi pemain
   7. Waktu: peluruhan, kejadian, kunjungan
   8. Tampilan: kartu, panel, modal
   9. Layar adopsi dan penyalaan
   ========================================================== */

/* ---------- 1. Data ---------- */

const TYPES = {
  kali: {
    name: 'Batu Kali', trait: 'Tenang. Sudah melihat banyak hal, semuanya air.',
    R: 132, n: 11, jit: .07, sx: 1.2, sy: .84, smooth: true,
    light: '#b9b2a2', mid: '#8e8779', dark: '#59544a',
    decay: {}
  },
  kerikil: {
    name: 'Kerikil', trait: 'Kecil, tetapi merasa besar. Mudah kesepian.',
    R: 84, n: 9, jit: .12, sx: 1.08, sy: .8, smooth: true,
    light: '#c4b8a3', mid: '#9c907d', dark: '#665c4d',
    decay: { lonely: 1.4 }
  },
  apung: {
    name: 'Batu Apung', trait: 'Ringan, secara harfiah saja. Cepat kotor.',
    R: 124, n: 12, jit: .1, sx: 1.12, sy: .88, smooth: true,
    light: '#dfd8c6', mid: '#c0b8a4', dark: '#8f8875',
    decay: { clean: 1.5 }
  },
  akik: {
    name: 'Batu Akik', trait: 'Merasa mahal. Ingin dielus lebih sering.',
    R: 106, n: 12, jit: .04, sx: 1.24, sy: .8, smooth: true,
    light: '#d4674a', mid: '#9c3b2a', dark: '#561d14',
    decay: { happy: 1.4 }
  },
  meteor: {
    name: 'Meteorit', trait: 'Pendatang dari jauh. Belum punya KTP.',
    R: 122, n: 10, jit: .2, sx: 1.1, sy: .84, smooth: false,
    light: '#6f6a6c', mid: '#454144', dark: '#232023',
    decay: { energy: .7 }
  },
  bata: {
    name: 'Batu Bata', trait: 'Secara teknis bukan batu. Kita tidak membahasnya.',
    light: '#d17a58', mid: '#b5583a', dark: '#7a3620',
    decay: {}
  }
};

const LEVELS = [
  { xp: 0,   name: 'Kenalan Baru' },
  { xp: 15,  name: 'Tetangga Batu' },
  { xp: 40,  name: 'Teman Diam' },
  { xp: 90,  name: 'Sahabat Hening' },
  { xp: 170, name: 'Keluarga Geologis' },
  { xp: 290, name: 'Belahan Batu' },
  { xp: 450, name: 'Satu Lapisan Sedimen' }
];

const STAGES = ['Batu', 'Batu Berpengalaman', 'Batu Bijak', 'Batu Tercerahkan'];
const PATHS = { pet: 'Si Manja', talk: 'Si Pendengar', clean: 'Si Kinclong', sun: 'Si Sawo Matang' };

const ITEMS = {
  kacamata: { slot: 'face', name: 'Kacamata', lvl: 1, line: '{n} kini terlihat membaca. Tidak ada yang dibaca.' },
  pita:     { slot: 'neck', name: 'Pita', lvl: 1, line: 'Pita terpasang. {n} tidak menolak, dan itu sudah cukup.' },
  direktur: { slot: 'head', name: 'Topi Direktur', lvl: 2, line: 'Dia merasa seperti direktur.' },
  googly:   { slot: 'face', name: 'Mata Plastik', lvl: 2, line: '{n} kini mengawasimu. Dia tidak ingin apa-apa. Itu yang mengkhawatirkan.' },
  dasi:     { slot: 'neck', name: 'Dasi', lvl: 3, line: 'Dengan dasi ini, {n} siap untuk rapat yang bisa jadi email.' },
  proyek:   { slot: 'head', name: 'Helm Proyek', lvl: 3, line: 'Keselamatan nomor satu. Bahaya terbesar di sini adalah {n} sendiri.' },
  kumis:    { slot: 'face', name: 'Kumis', lvl: 4, line: '{n} kini tampak punya pendapat soal harga cabai.' },
  peci:     { slot: 'head', name: 'Peci', lvl: 4, line: '{n} terlihat siap menghadiri kondangan, lalu tidak datang.' },
  syal:     { slot: 'neck', name: 'Syal', lvl: 5, line: 'Batu tidak kedinginan. Tetapi sekarang dia estetik.' },
  hitam:    { slot: 'face', name: 'Kacamata Hitam', lvl: 5, line: 'Keren. Akhirnya ada alasan kenapa dia tidak membalas tatapanmu.' },
  pesta:    { slot: 'head', name: 'Topi Pesta', lvl: 6, line: 'Pesta dimulai. Semua tamu hadir. Tamunya satu dan dia diam.' },
  mahkota:  { slot: 'head', name: 'Mahkota', lvl: 7, line: 'Rakyatnya kerikil. Kerajaannya halaman belakang. Dia pantas.' }
};

const SLOT_NAMES = { head: 'Kepala (kira-kira)', face: 'Wajah (diandaikan)', neck: 'Leher (tidak jelas di mana)' };

const SCENES = {
  halaman: { name: 'Halaman', lvl: 1, tint: 1, outdoor: true },
  meja:    { name: 'Meja Kantor', lvl: 2, tint: .35, outdoor: false },
  pantai:  { name: 'Pantai', lvl: 3, tint: 1, outdoor: true },
  direksi: { name: 'Ruang Direksi', lvl: 4, tint: .25, outdoor: false },
  angkasa: { name: 'Luar Angkasa', lvl: 6, tint: 0, outdoor: false }
};

const TINTS = {
  pagi:  { color: '#ffc48a', back: .22, label: 'pagi' },
  siang: { color: '#ffffff', back: 0, label: 'siang' },
  sore:  { color: '#f57c35', back: .34, label: 'sore' },
  malam: { color: '#0c1a44', back: .72, label: 'malam' }
};

const ACHIEVEMENTS = [
  { id: 'firstPet', name: 'Sentuhan Pertama', desc: 'Mengelus batu. Dia tidak membalas.' },
  { id: 'pet50', name: 'Elus Tanpa Pamrih', desc: 'Mengelus 50 kali.' },
  { id: 'talk10', name: 'Monolog Sehat', desc: 'Berbicara 10 kali kepada batu.' },
  { id: 'spotless', name: 'Kinclong', desc: 'Kebersihan mencapai 100.' },
  { id: 'dressed', name: 'Direktur Utama', desc: 'Memakai aksesori di ketiga tempat.' },
  { id: 'lvl3', name: 'Teman Diam', desc: 'Mencapai kedekatan 3.' },
  { id: 'lvl5', name: 'Keluarga Geologis', desc: 'Mencapai kedekatan 5.' },
  { id: 'lvl7', name: 'Satu Lapisan Sedimen', desc: 'Mencapai kedekatan tertinggi.' },
  { id: 'evolved', name: 'Evolusi, Katanya', desc: 'Batu berevolusi. Mohon lihat lebih dekat.' },
  { id: 'days3', name: 'Tiga Hari Diam', desc: 'Berkunjung pada 3 hari berbeda.' },
  { id: 'stay', name: 'Kenapa Masih di Sini?', desc: 'Menatap batu selama 5 menit tanpa pergi.', secret: true },
  { id: 'night', name: 'Begadang Bersama Batu', desc: 'Berkunjung antara tengah malam dan pukul 4.', secret: true },
  { id: 'back', name: 'Kamu Kembali', desc: 'Pulang setelah pergi lebih dari sehari.', secret: true },
  { id: 'askRock', name: 'Pertanyaan Sulit', desc: 'Bertanya kepada batu tentang batu.', secret: true },
  { id: 'witness', name: 'Saksi Mata', desc: 'Berada di sini saat batu bergerak.', secret: true }
];

const NAME_IDEAS = ['Pak Slamet', 'Bambang', 'Bu Tuti', 'Sedimen', 'Mas Basalt', 'Granit Sutrisno', 'Si Diam', 'Dwayne', 'Cadas', 'Kerak Bumi', 'Pak RT', 'Mbak Marmer'];

/* ---------- 2. Bank kalimat ---------- */

const L = {
  pet: [
    'Batu ini merasa sedikit lebih berbatu.',
    'Kamu mengelus {n}. Tekstur tetap.',
    '{n} menerima kasih sayangmu dengan cara yang sama seperti ia menerima hujan.',
    'Telapak tanganmu kini sedikit berdebu. Begitulah cinta.',
    'Para ilmuwan belum tahu apakah {n} menikmatinya. Para ilmuwan juga tidak diundang.',
    'Elusan diterima. Balasan dijadwalkan sekitar 40.000 tahun lagi.',
    '{n} tetap dingin. Ini suhu ruangan, bukan masalah pribadi.'
  ],
  petAkik: ['{n} menerima elusanmu seolah memang sudah seharusnya.'],
  petBata: ['Kamu mengelus sebuah bata. Tidak ada yang perlu tahu.'],
  talkEmpty: ['Kamu diam. {n} juga. Ini percakapan terbaik minggu ini.'],
  talk: [
    '"..."',
    '"..." katanya, dengan nada yang sulit dibantah.',
    '{n} mendengarkan sampai habis. Tidak semua orang begitu.',
    '{n} tidak menyela. Sekali pun tidak.',
    '"..." Kamu merasa ini agak menusuk.'
  ],
  talkLove: ['"..." Dia belum siap bilang balik. Mungkin di zaman Kuarter berikutnya.', '{n} tidak menjawab, tetapi juga tidak pergi. Itu lebih dari yang lain.'],
  talkWork: ['{n} sudah menganggur sejak zaman Kapur dan tidak pernah ditegur.', '"..." Saran karier yang berat, tetapi layak dipertimbangkan.'],
  talkHi: ['{n} membalas salammu dalam hati. Kemungkinan.', '"..." Halo juga, bisa jadi.'],
  talkAsk: ['Pertanyaan bagus. {n} akan menjawab begitu terkikis cukup.', '{n} mempertimbangkan pertanyaanmu. Jangan menunggu.'],
  talkSorry: ['{n} memaafkanmu. Dia juga tidak pernah marah. Dia juga tidak tahu.'],
  talkRock: ['Kamu bertanya soal batu kepada batu. {n} merasa ini pertanyaan pribadi.'],
  talkSad: ['{n} tidak berkata apa-apa. Dia tetap di sini. Kadang itu sudah cukup.', '"..." Dia tidak akan menyuruhmu semangat. Kamu boleh duduk sebentar.'],
  clean: [
    'Sekarang dia berkilau. Kepribadiannya tetap sama.',
    'Debu terangkat. Sebagian dari masa lalu {n} ikut pergi.',
    '{n} dibersihkan. Dia tidak meminta, tetapi juga tidak bisa menolak.',
    'Kamu menggosok sebuah batu sampai bersih, dan itu sah-sah saja.'
  ],
  cleanFull: ['Dia sudah bersih. Yang kamu bersihkan sekarang adalah rasa bersalahmu.', 'Kebersihan sudah penuh. Jangan-jangan kamu mengikisnya.'],
  sun: [
    '{n} dijemur. Dia tampak persis sama, tetapi sedikit lebih hangat.',
    'Fotosintesis gagal, seperti kemarin. {n} tetap berusaha, kalau itu bisa disebut berusaha.',
    'Energi terisi. Akan dipakai untuk diam, seperti biasa.'
  ],
  sunNight: ['Matahari sudah tutup. {n} dijemur di bawah lampu. Sama saja baginya.', 'Berjemur tengah malam. Tetangga mulai bertanya-tanya, tentang kamu.'],
  sunFull: ['Energinya penuh. Dia menyimpannya untuk tidak melakukan apa-apa nanti.'],
  cooldown: [
    '{n} masih memproses yang tadi. Mohon bersabar, ini geologi.',
    'Pelan-pelan. Batu ini baru selesai memahami tindakanmu yang terakhir.',
    'Permintaanmu masuk antrean. Nomor antrean: zaman Holosen.'
  ],
  events: {
    semut: ['Seekor semut lewat. {n} tidak menoleh. Semut tersinggung.', 'Semut melintas membawa remah. Dia lebih produktif dari kalian berdua.'],
    kupu: ['Seekor kupu-kupu hinggap. {n} tidak terbang. Kupu-kupu kalah.', 'Kupu-kupu mendarat di atas {n}. Ini pertama kalinya ada yang mendekat tanpa dipaksa.'],
    hujan: ['Hujan turun. {n} dimandikan gratis.', 'Hujan. {n} tidak berteduh. Prinsip, katanya.'],
    hujanDalam: ['Di luar sedang hujan. {n} tidak tahu, dan tidak akan pernah tahu.'],
    daun: ['Selembar daun jatuh. {n} tidak bertanggung jawab atas ini.', 'Daun gugur di dekat {n}. Musim berganti. {n} tidak.'],
    teks: [
      '{n} memikirkan sesuatu. Sudah selesai. Tidak ada kesimpulan.',
      'Seseorang menelepon. Bukan untuk {n}. Tidak pernah untuk {n}.',
      '{n} sedang sangat sibuk menjadi batu.',
      'Tidak ada yang terjadi. {n} berperan penting dalam hal ini.',
      'Sepanjang menit ini, {n} tidak membuat satu pun kesalahan.',
      '{n} baru saja menyelesaikan satu lagi hari kerja. Tanpa lembur.',
      'Angin berembus. {n} bertahan. Sekali lagi, tanpa usaha.'
    ],
    gerak: ['Tunggu. Apakah {n} barusan bergeser? Rekaman tidak menunjukkan apa pun. Penghitung diulang demi keamanan.']
  },
  morning: ['Selamat pagi. {n} sudah bangun, atau belum tidur, atau keduanya.'],
  noon: ['Selamat siang. {n} sudah makan siang. Menunya tidak ada.'],
  evening: ['Selamat sore. {n} menatap senja. Arahnya kebetulan.'],
  night: ['Sudah malam. {n} tidak bisa dibedakan antara tidur dan tidak.'],
  letter: [
    'Batu ini telah memikirkan banyak hal. Tidak ada yang berubah.',
    'Dia tidak menunggumu. Dia hanya kebetulan masih di tempat yang sama.',
    'Tidak ada yang mencarimu. Tetapi kalau ada, dia tidak akan memberitahu.',
    'Tidak ada pesan. Ini pesannya.'
  ],
  facts: [
    'Batu tertua di Bumi berumur sekitar 4 miliar tahun. Belum ada yang mengajaknya bicara.',
    'Batu apung bisa mengapung di air. Batu lain menganggap ini pamer.',
    'Batu tidak pernah terlambat. Batu tidak pernah berangkat.',
    'Granit terbentuk dari magma yang mendingin perlahan. Saran yang baik untuk siapa saja.',
    'Sebagian besar kerak Bumi adalah batu. Batu lebih banyak dari kamu.',
    'Batu sedimen terbentuk dari lapisan demi lapisan. Mirip tumpukan pekerjaanmu.',
    'Tidak ada batu yang pernah mengeluh soal hari Senin.'
  ]
};

/* ---------- 3. Penyimpanan dan state ---------- */

const SAVE_KEY = 'pelihara-batu-virtual-v1';
const storage = {
  ok: true,
  load() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)); }
    catch (e) { this.ok = false; return null; }
  },
  save(data) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); }
    catch (e) { this.ok = false; }
  },
  clear() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* tidak ada yang perlu dihapus */ }
  }
};

let S = null;
const sessionStart = Date.now();
let nextEventAt = 0;
let passiveClock = 0;
const lastAct = {};
const lastPick = new Map();

const $ = (sel) => document.querySelector(sel);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function newRock(type, seed, name) {
  const now = Date.now();
  return {
    v: 1, type, seed, name,
    adoptedAt: now, lastSeen: now, lastMovedAt: now,
    stats: { happy: 60, clean: 70, energy: 60, lonely: 30 },
    xp: 0, stage: 0, moved: 0,
    counts: { pet: 0, talk: 0, clean: 0, sun: 0 },
    equip: { head: null, face: null, neck: null },
    scene: 'halaman',
    diary: [], ach: {},
    lastDay: dateKey(), visitDays: 1,
    settings: { sound: true, motion: false }
  };
}

function save() { if (S) storage.save(S); }
function tmpl(text) { return text.replace(/\{n\}/g, S ? S.name : 'Batu'); }
function pick(list) {
  if (list.length === 1) return list[0];
  let choice;
  do { choice = list[Math.floor(Math.random() * list.length)]; } while (choice === lastPick.get(list));
  lastPick.set(list, choice);
  return choice;
}
function motionOK() {
  return !(S && S.settings.motion) && !matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function levelIndex(xp = S.xp) {
  let idx = 0;
  LEVELS.forEach((l, i) => { if (xp >= l.xp) idx = i; });
  return idx;
}
function level() { return levelIndex() + 1; }

/* ---------- 4. Gambar ---------- */

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothPath(p) {
  const n = p.length;
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n];
    d += `C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
  }
  return d + 'Z';
}

function rockShape(type, seed) {
  const t = TYPES[type];
  const r = mulberry(seed);
  let pts = [];
  if (type === 'bata') {
    const j = () => (r() - .5) * 5;
    pts = [[-138 + j(), -124 + j()], [-40, -125 + j()], [60, -123 + j()], [138 + j(), -124 + j()], [139 + j(), -60], [138 + j(), 0], [40, 0], [-60, 0], [-138 + j(), 0], [-139 + j(), -60]];
    return { d: 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z', w: 278, h: 125, top: -125, smooth: false };
  }
  const rot = r() * Math.PI * 2;
  for (let i = 0; i < t.n; i++) {
    const a = rot + (i / t.n) * Math.PI * 2;
    const rad = t.R * (1 + (r() * 2 - 1) * t.jit);
    pts.push([Math.cos(a) * rad * t.sx, Math.sin(a) * rad * t.sy]);
  }
  const floor = t.R * t.sy * .7;
  pts = pts.map(([x, y]) => [x, Math.min(y, floor)]);
  const xs = pts.map((p) => p[0]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const cx = (minX + maxX) / 2;
  const minY = Math.min(...pts.map((p) => p[1]));
  pts = pts.map(([x, y]) => [x - cx, y - floor]);
  const w = maxX - minX, h = floor - minY;
  // puncak di sekitar tengah, tempat topi diletakkan
  const nearTop = pts.filter((p) => Math.abs(p[0]) < w * .3).map((p) => p[1]);
  const top = nearTop.length ? Math.min(...nearTop) : -h;
  const d = t.smooth ? smoothPath(pts) : 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z';
  return { d, w, h, top, smooth: t.smooth };
}

function rockDetails(type, seed, shape, stage) {
  const t = TYPES[type];
  const { w, h } = shape;
  const r = mulberry(seed ^ 0x9E3779B9);
  const rx = () => (r() - .5) * w;
  const ry = () => -r() * h;
  let out = '';

  // retakan halus
  for (let i = 0; i < (type === 'bata' ? 2 : 5); i++) {
    const x = rx(), y = ry();
    out += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}q${((r() - .5) * 50).toFixed(1)} ${((r() - .5) * 30).toFixed(1)} ${((r() - .5) * 90).toFixed(1)} ${((r() - .5) * 40).toFixed(1)}" fill="none" stroke="${t.dark}" stroke-width="${(1 + r()).toFixed(1)}" opacity=".35" stroke-linecap="round"/>`;
  }
  // bintik mineral
  for (let i = 0; i < 70; i++) {
    const c = r() > .5 ? t.dark : t.light;
    out += `<circle cx="${rx().toFixed(1)}" cy="${ry().toFixed(1)}" r="${(r() * 1.7 + .4).toFixed(1)}" fill="${c}" opacity="${(r() * .4 + .15).toFixed(2)}"/>`;
  }

  if (type === 'apung') {
    for (let i = 0; i < 46; i++) {
      const rad = r() * 5 + 1.5;
      out += `<ellipse cx="${rx().toFixed(1)}" cy="${ry().toFixed(1)}" rx="${rad.toFixed(1)}" ry="${(rad * .75).toFixed(1)}" fill="${t.dark}" opacity=".6"/>`;
    }
  }
  if (type === 'akik') {
    for (let i = 1; i <= 6; i++) {
      out += `<ellipse cx="${(w * -.05).toFixed(1)}" cy="${(-h * .46).toFixed(1)}" rx="${(i * w * .085).toFixed(1)}" ry="${(i * h * .085).toFixed(1)}" fill="none" stroke="${i % 2 ? '#e7b69c' : t.dark}" stroke-width="${(2 + i * .6).toFixed(1)}" opacity=".3"/>`;
    }
    out += `<ellipse cx="${(-w * .2).toFixed(1)}" cy="${(-h * .72).toFixed(1)}" rx="${(w * .16).toFixed(1)}" ry="${(h * .09).toFixed(1)}" fill="#fff" opacity=".42" transform="rotate(-16 ${(-w * .2).toFixed(1)} ${(-h * .72).toFixed(1)})"/>`;
  }
  if (type === 'meteor') {
    for (let i = 0; i < 9; i++) {
      const x = rx(), y = ry(), rad = r() * 15 + 5;
      out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}" fill="${t.dark}" opacity=".75"/><path d="M${(x - rad * .7).toFixed(1)} ${(y + rad * .6).toFixed(1)}a${rad.toFixed(1)} ${rad.toFixed(1)} 0 0 0 ${(rad * 1.5).toFixed(1)} 0" fill="none" stroke="${t.light}" stroke-width="1.6" opacity=".6"/>`;
    }
    for (let i = 0; i < 16; i++) out += `<circle cx="${rx().toFixed(1)}" cy="${ry().toFixed(1)}" r="1.3" fill="#e9a44f" opacity=".85"/>`;
  }
  if (type === 'bata') {
    for (const x of [-72, 0, 72]) {
      out += `<rect x="${x - 24}" y="-78" width="48" height="30" rx="4" fill="${t.dark}" opacity=".5"/><rect x="${x - 24}" y="-78" width="48" height="5" fill="#2c130a" opacity=".3"/>`;
    }
    out += `<rect x="-142" y="-125" width="284" height="10" fill="${t.light}" opacity=".5"/>`;
    for (let i = 0; i < 40; i++) out += `<rect x="${rx().toFixed(1)}" y="${ry().toFixed(1)}" width="${(r() * 6 + 1).toFixed(1)}" height="1.6" fill="${t.dark}" opacity=".35"/>`;
  }

  // jejak evolusi: urat emas lalu lumut tetap
  if (stage >= 1) {
    const vr = mulberry(seed ^ 0x51ED270B);
    for (let i = 0; i < stage + 1; i++) {
      let x = (vr() - .5) * w * .7, y = -h * (.2 + vr() * .6);
      let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
      for (let k = 0; k < 4; k++) { x += 18 + vr() * 26; y += (vr() - .5) * 26; d += `L${x.toFixed(1)} ${y.toFixed(1)}`; }
      out += `<path d="${d}" fill="none" stroke="#e0b64a" stroke-width="2.1" stroke-linejoin="round" opacity=".85"/>`;
    }
  }
  if (stage >= 2) {
    const m = mulberry(seed ^ 0x2545F491);
    for (let i = 0; i < 16; i++) {
      out += `<circle cx="${(-w * .28 + (m() - .5) * w * .3).toFixed(1)}" cy="${(-h * (.82 + m() * .1)).toFixed(1)}" r="${(m() * 7 + 3).toFixed(1)}" fill="${m() > .5 ? '#6f8a3e' : '#4e6a2c'}"/>`;
    }
  }
  return out;
}

/* Lapisan yang berubah menurut kebersihan: lumut, kotoran, kilau */
function conditionLayers(seed, shape) {
  const { w, h } = shape;
  const r = mulberry(seed ^ 0x1B873593);
  let moss = '', dirt = '';
  for (let i = 0; i < 26; i++) {
    moss += `<circle cx="${((r() - .5) * w).toFixed(1)}" cy="${(-h * (.72 + r() * .28)).toFixed(1)}" r="${(r() * 11 + 4).toFixed(1)}" fill="${r() > .5 ? '#6a8539' : '#47622a'}"/>`;
  }
  for (let i = 0; i < 48; i++) {
    const rad = r() * 9 + 1.5;
    dirt += `<ellipse cx="${((r() - .5) * w).toFixed(1)}" cy="${(-r() * h).toFixed(1)}" rx="${rad.toFixed(1)}" ry="${(rad * (.4 + r() * .5)).toFixed(1)}" fill="${r() > .4 ? '#4a3a23' : '#6b5536'}" opacity="${(r() * .4 + .25).toFixed(2)}"/>`;
  }
  return { moss, dirt };
}

function accessoryMarkup(id) {
  switch (id) {
    case 'direktur': return '<ellipse cy="-5" rx="64" ry="10" fill="#1b1917"/><rect x="-38" y="-82" width="76" height="77" rx="3" fill="#26231f"/><rect x="-38" y="-26" width="76" height="13" fill="#a23b2a"/><rect x="-30" y="-78" width="9" height="50" fill="#fff" opacity=".07"/>';
    case 'proyek': return '<path d="M-62 -6a62 58 0 0 1 124 0z" fill="#e8b324"/><path d="M-44 -30a50 44 0 0 1 30 -22" stroke="#fff" stroke-width="4" opacity=".4" fill="none" stroke-linecap="round"/><rect x="-74" y="-11" width="148" height="11" rx="5" fill="#c9950f"/><rect x="-9" y="-65" width="18" height="56" rx="7" fill="#f2c94c"/>';
    case 'peci': return '<path d="M-50 -2L-45 -46Q0 -58 45 -46L50 -2Q0 -13 -50 -2z" fill="#1d1c21"/><path d="M-48 -13Q0 -24 48 -13" stroke="#3b3a42" stroke-width="2" fill="none"/>';
    case 'pesta': return '<path d="M-38 -2L0 -92L38 -2Q0 8 -38 -2z" fill="#3d7fb5"/><path d="M-24 -35L-13 -60L30 -20L36 -6z" fill="#f4d35e"/><circle cy="-94" r="9" fill="#d8452f"/>';
    case 'mahkota': return '<path d="M-50 -3L-58 -56L-27 -32L0 -66L27 -32L58 -56L50 -3Q0 -11 -50 -3z" fill="#d7a92c" stroke="#8e6a10" stroke-width="2" stroke-linejoin="round"/><circle cy="-22" r="7" fill="#b03327"/><circle cx="-29" cy="-18" r="4.5" fill="#2f6bab"/><circle cx="29" cy="-18" r="4.5" fill="#2f6bab"/>';
    case 'kacamata': return '<g fill="rgba(235,245,250,.35)" stroke="#20201f" stroke-width="5"><circle cx="-31" r="24"/><circle cx="31" r="24"/></g><path d="M-7 -2Q0 -8 7 -2" stroke="#20201f" stroke-width="5" fill="none"/>';
    case 'hitam': return '<path d="M-64 -14H-4Q-3 21 -32 21Q-60 21 -64 -14zM4 -14H64Q60 21 32 21Q3 21 4 -14z" fill="#121214"/><path d="M-4 -9H4" stroke="#121214" stroke-width="5"/><path d="M-54 -7L-38 8M12 -7L28 8" stroke="#fff" stroke-width="3.5" opacity=".28"/>';
    case 'googly': return '<circle cx="-30" r="24" fill="#fff" stroke="#1d1c1a" stroke-width="3"/><circle cx="30" r="24" fill="#fff" stroke="#1d1c1a" stroke-width="3"/><circle class="pupil" data-x="-30" cx="-30" r="11" fill="#111"/><circle class="pupil" data-x="30" cx="30" r="11" fill="#111"/>';
    case 'kumis': return '<path d="M0 -3C-11 -19 -33 -15 -41 -3C-51 5 -60 2 -65 -6C-61 15 -35 21 -20 13C-10 9 -4 5 0 3C4 5 10 9 20 13C35 21 61 15 65 -6C60 2 51 5 41 -3C33 -15 11 -19 0 -3z" fill="#231a12"/>';
    case 'pita': return '<path d="M0 0L-52 -27Q-60 0 -52 27zM0 0L52 -27Q60 0 52 27z" fill="#c93e57"/><path d="M-44 -14L-14 -2M44 -14L14 -2" stroke="#8e1f35" stroke-width="2.5"/><circle r="10.5" fill="#a52a42"/>';
    case 'dasi': return '<path d="M-14 -25H14L10 -7L25 54L0 79L-25 54L-10 -7z" fill="#2f4f7f"/><path d="M-14 22L13 -5M-22 50L20 11M-11 73L25 46" stroke="#d6b96d" stroke-width="4"/><path d="M-14 -25H14L10 -7H-10z" fill="#1f3a60"/>';
    case 'syal': return '<path d="M-90 -14Q0 18 90 -14L94 12Q0 44 -94 12z" fill="#b5442c"/><path d="M42 18L34 86H74L72 12z" fill="#a03822"/><path d="M-70 -7Q-66 14 -72 19M-30 2Q-26 22 -31 30M14 3Q18 22 14 31M58 -6Q62 12 57 19" stroke="#e1c18f" stroke-width="5" fill="none"/>';
    default: return '';
  }
}

function accessoryLayer(shape, equip) {
  const s = clamp(shape.w / 270, .52, 1.1);
  const { top, h } = shape;
  let out = '';
  if (equip.neck) out += `<g transform="translate(0 ${(top + h * .74).toFixed(1)}) scale(${s.toFixed(2)})">${accessoryMarkup(equip.neck)}</g>`;
  if (equip.face) out += `<g transform="translate(0 ${(top + h * .36).toFixed(1)}) scale(${s.toFixed(2)})">${accessoryMarkup(equip.face)}</g>`;
  if (equip.head) out += `<g transform="translate(0 ${(top + 7).toFixed(1)}) scale(${s.toFixed(2)})">${accessoryMarkup(equip.head)}</g>`;
  return out;
}

/* Satu fungsi untuk semua batu: panggung, kartu adopsi, dan modal evolusi. */
function rockMarkup({ type, seed, stage = 0, equip = {}, uid = 'r', live = false, clean = 100 }) {
  const t = TYPES[type];
  const shape = rockShape(type, seed);
  const { w, h } = shape;
  const cond = conditionLayers(seed, shape);
  const mossOpacity = clamp((35 - clean) / 35, 0, 1);
  const dirtOpacity = clamp((70 - clean) / 60, 0, 1);

  let halo = '';
  if (stage >= 3) {
    // Topi tertinggi sekitar 105 satuan, jadi halo naik agar tidak menabraknya.
    const hatLift = equip.head ? 105 * clamp(w / 270, .52, 1.1) : 0;
    halo = `<ellipse cx="0" cy="${(shape.top - 30 - hatLift).toFixed(1)}" rx="${(w * .3).toFixed(1)}" ry="13" fill="none" stroke="#f5d565" stroke-width="7" opacity=".95"/>`
         + `<circle cx="0" cy="${(-h * .5).toFixed(1)}" r="${(Math.max(w, h) * .75).toFixed(1)}" fill="url(#${uid}Glow)"/>`;
  }

  let sparkles = '';
  if (live) {
    const r = mulberry(seed ^ 0xABCDEF);
    for (let i = 0; i < 6; i++) {
      const x = (r() - .5) * w * .85, y = -h * (.15 + r() * .75);
      sparkles += `<path class="sparkle" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" d="M0 -9L2 -2L9 0L2 2L0 9L-2 2L-9 0L-2 -2z" fill="#fff"/>`;
    }
  }

  return `
    <defs>
      <linearGradient id="${uid}Grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${t.light}"/><stop offset=".5" stop-color="${t.mid}"/><stop offset="1" stop-color="${t.dark}"/>
      </linearGradient>
      <radialGradient id="${uid}Glow"><stop offset="0" stop-color="#ffe89a" stop-opacity=".5"/><stop offset="1" stop-color="#ffe89a" stop-opacity="0"/></radialGradient>
      <filter id="${uid}Blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>
      <clipPath id="${uid}Clip"><path d="${shape.d}"/></clipPath>
    </defs>
    ${halo}
    <ellipse cx="6" cy="3" rx="${(w * .54).toFixed(1)}" ry="13" fill="#1a150d" opacity=".38"/>
    <path class="rock-body" d="${shape.d}" fill="url(#${uid}Grad)" stroke="${t.dark}" stroke-width="${shape.smooth ? 1.5 : 4}" stroke-linejoin="round"/>
    <g clip-path="url(#${uid}Clip)">
      <ellipse cx="${(w * .24).toFixed(1)}" cy="${(-h * .12).toFixed(1)}" rx="${(w * .46).toFixed(1)}" ry="${(h * .46).toFixed(1)}" fill="${t.dark}" opacity=".6" filter="url(#${uid}Blur)"/>
      <ellipse cx="${(-w * .22).toFixed(1)}" cy="${(-h * .78).toFixed(1)}" rx="${(w * .3).toFixed(1)}" ry="${(h * .22).toFixed(1)}" fill="${t.light}" opacity=".75" filter="url(#${uid}Blur)"/>
      ${rockDetails(type, seed, shape, stage)}
      <g class="dirt" opacity="${dirtOpacity.toFixed(2)}">${cond.dirt}</g>
      <g class="moss" opacity="${mossOpacity.toFixed(2)}">${cond.moss}</g>
    </g>
    <g class="sparkles" opacity="0">${sparkles}</g>
    ${accessoryLayer(shape, equip)}`;
}

function sceneMarkup(key, uid = 'sc', live = false) {
  const r = mulberry(key.length * 7919 + 13);
  const stars = (n, maxY, cls) => {
    let s = `<g class="${cls}">`;
    for (let i = 0; i < n; i++) s += `<circle cx="${(r() * 800).toFixed(0)}" cy="${(r() * maxY).toFixed(0)}" r="${(r() * 1.3 + .4).toFixed(1)}" fill="#fff" opacity="${(r() * .6 + .3).toFixed(2)}"/>`;
    return s + '</g>';
  };
  const sky = (a, b) => `<linearGradient id="${uid}Sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const orb = live ? '<circle class="sky-sun" cx="620" cy="90" r="36" fill="#fff0b8"/><g class="sky-moon"><circle cx="620" cy="90" r="30" fill="#f2efe0"/><circle cx="609" cy="82" r="27" fill="#2a3560" opacity=".92"/></g>' : '';

  switch (key) {
    case 'meja': {
      return `<defs><linearGradient id="${uid}Desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d623c"/><stop offset="1" stop-color="#5c3d24"/></linearGradient></defs>
        <rect width="800" height="560" fill="#d4c4a2"/>
        <rect y="0" width="800" height="28" fill="#c2b08b"/>
        <g><rect x="110" y="72" width="210" height="190" fill="#b7d6e4" stroke="#6c5b3f" stroke-width="9"/><path d="M215 72V262M110 167H320" stroke="#6c5b3f" stroke-width="6"/></g>
        <g transform="translate(560 96)"><rect width="128" height="96" fill="#f7efd7" stroke="#6c5b3f" stroke-width="4"/><path d="M15 26H112M15 45H112M15 64H70" stroke="#a79a7e" stroke-width="3"/></g>
        <rect y="440" width="800" height="120" fill="url(#${uid}Desk)"/>
        <rect y="440" width="800" height="7" fill="#a67a50"/>
        <g transform="translate(600 378)"><path d="M0 8H50V62Q50 72 40 72H10Q0 72 0 62z" fill="#e7e1d2"/><path d="M50 22Q72 22 72 40T50 56" fill="none" stroke="#e7e1d2" stroke-width="8"/><rect x="4" y="8" width="42" height="7" fill="#4a3421"/></g>
        <g transform="translate(150 366) rotate(-5)"><rect width="88" height="82" fill="#f0d95f"/><text x="44" y="30" font-family="Georgia, serif" font-size="14" fill="#3e3514" text-anchor="middle">RAPAT</text><text x="44" y="50" font-family="Georgia, serif" font-size="14" fill="#3e3514" text-anchor="middle">09.00</text><text x="44" y="68" font-family="Georgia, serif" font-size="11" fill="#3e3514" text-anchor="middle">wajib hadir</text></g>`;
    }
    case 'pantai': {
      return `<defs>${sky('#7fc1e0', '#d8eef0')}<linearGradient id="${uid}Sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d8ca8"/><stop offset="1" stop-color="#6cc3c4"/></linearGradient></defs>
        <rect width="800" height="560" fill="url(#${uid}Sky)"/>
        ${live ? stars(70, 250, 'stars') : ''}${orb}
        <rect y="268" width="800" height="150" fill="url(#${uid}Sea)"/>
        <path d="M60 310q30 -9 60 0M250 345q40 -10 80 0M520 300q30 -9 60 0M650 365q35 -9 70 0M90 380q40 -10 80 0" stroke="#d6f1ee" stroke-width="3" fill="none" opacity=".7"/>
        <path d="M0 402Q200 378 400 400T800 392V560H0z" fill="#e9d6a2"/>
        <path d="M0 422Q200 404 420 424T800 414V560H0z" fill="#dcc488"/>
        <g transform="translate(156 406)"><path d="M0 0L16 -152" stroke="#6c4a2c" stroke-width="7"/><path d="M-70 -128A88 74 0 0 1 104 -160Q78 -150 62 -128Q42 -148 16 -138Q-6 -152 -24 -128Q-46 -142 -70 -128z" fill="#d04a33"/><path d="M16 -196A88 74 0 0 1 104 -160Q78 -150 62 -128Q42 -148 16 -138z" fill="#f2e6c8"/></g>
        <g fill="#c6ab70"><circle cx="620" cy="498" r="5"/><circle cx="280" cy="520" r="4"/><circle cx="688" cy="440" r="3"/></g>`;
    }
    case 'direksi': {
      let panels = '';
      for (let x = 0; x < 800; x += 100) panels += `<rect x="${x + 7}" y="28" width="86" height="370" fill="#6a4228" stroke="#472a18" stroke-width="3"/>`;
      return `<defs><linearGradient id="${uid}Tbl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f2415"/><stop offset="1" stop-color="#22120a"/></linearGradient></defs>
        <rect width="800" height="560" fill="#55331f"/>${panels}
        <g transform="translate(290 62)"><rect width="220" height="146" fill="#f6f1e4" stroke="#c49b42" stroke-width="7"/><text x="110" y="27" font-family="Georgia, serif" font-size="13" fill="#2a2722" text-anchor="middle">Pergerakan Batu, Q1 sampai Q4</text><path d="M24 40V124H200" stroke="#2a2722" stroke-width="2" fill="none"/><path d="M24 118H200" stroke="#a8492a" stroke-width="3.5"/><text x="195" y="111" font-family="Georgia, serif" font-size="12" fill="#a8492a" text-anchor="end">0 cm (stabil)</text></g>
        <g fill="#2a1a10"><path d="M92 240H182V412H92z"/><path d="M618 240H708V412H618z"/></g>
        <rect y="438" width="800" height="122" fill="url(#${uid}Tbl)"/>
        <rect y="438" width="800" height="6" fill="#6b4226"/>
        <g transform="translate(556 484)"><path d="M0 34L10 0H128L138 34z" fill="#c49b42"/><text x="69" y="25" font-family="Georgia, serif" font-weight="700" font-size="16" fill="#2a1a10" text-anchor="middle">DIREKTUR</text></g>`;
    }
    case 'angkasa': {
      return `<defs><linearGradient id="${uid}Sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060f"/><stop offset="1" stop-color="#1a1b35"/></linearGradient><linearGradient id="${uid}Earth" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5ea6d9"/><stop offset="1" stop-color="#143e70"/></linearGradient></defs>
        <rect width="800" height="560" fill="url(#${uid}Sky)"/>
        ${stars(140, 430, 'always')}
        <g transform="translate(190 130)"><circle r="56" fill="url(#${uid}Earth)"/><path d="M-30 -30Q-5 -40 8 -18T-8 16Q-30 18 -38 -6zM22 -8Q42 -6 44 16T22 34Q10 14 22 -8z" fill="#7fae62"/><text y="86" font-family="Georgia, serif" font-size="14" fill="#c9cfe3" text-anchor="middle">rumah</text></g>
        <path d="M0 448Q200 420 420 444T800 432V560H0z" fill="#878593"/>
        <path d="M0 482Q240 462 480 484T800 470V560H0z" fill="#6f6d7b"/>
        <g fill="#54525f"><ellipse cx="124" cy="500" rx="42" ry="11"/><ellipse cx="660" cy="492" rx="56" ry="13"/><ellipse cx="420" cy="538" rx="32" ry="8"/></g>`;
    }
    default: { // halaman
      let tufts = '';
      for (let i = 0; i < 40; i++) {
        const x = r() * 800, y = 440 + r() * 110, c = r() > .5 ? '#47682f' : '#5f8239';
        tufts += `<path d="M${x.toFixed(0)} ${y.toFixed(0)}l-4 -13M${x.toFixed(0)} ${y.toFixed(0)}l1 -16M${x.toFixed(0)} ${y.toFixed(0)}l6 -12" stroke="${c}" stroke-width="2" stroke-linecap="round" fill="none"/>`;
      }
      return `<defs>${sky('#8cc3de', '#e4efe2')}<linearGradient id="${uid}Grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#83a452"/><stop offset="1" stop-color="#587a35"/></linearGradient></defs>
        <rect width="800" height="560" fill="url(#${uid}Sky)"/>
        ${live ? stars(90, 235, 'stars') : ''}${orb}
        <path d="M0 322Q130 248 280 310T560 294T800 316V460H0z" fill="#a4b98f"/>
        <path d="M0 372Q170 322 370 366T800 352V460H0z" fill="#8ba86a"/>
        <g transform="translate(112 410)"><rect x="-9" y="-92" width="18" height="96" fill="#664a2f"/><circle cy="-126" r="50" fill="#4f7234"/><circle cx="-34" cy="-98" r="32" fill="#5d813c"/><circle cx="34" cy="-102" r="34" fill="#456a2e"/></g>
        <g fill="#efe7d3" stroke="#a79a7e" stroke-width="2"><path d="M578 348h12v72h-12zM618 348h12v72h-12zM658 348h12v72h-12zM698 348h12v72h-12zM738 348h12v72h-12z"/><path d="M560 368H780V378H560zM560 398H780V408H560z"/></g>
        <path d="M0 428Q190 410 410 428T800 420V560H0z" fill="url(#${uid}Grass)"/>
        ${tufts}`;
    }
  }
}

/* ---------- 5. Efek dan suara ---------- */

let audioCtx = null;
function tone(freq, dur = .12, type = 'sine', gain = .08, delay = 0, glideTo = 0) {
  if (!S || !S.settings.sound) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    audioCtx = audioCtx || new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    osc.connect(g).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur + .02);
  } catch (e) { /* suara hanya pelengkap */ }
}
const sfx = {
  pet() { tone(120, .1, 'sine', .14, 0, 70); },
  talk() { tone(180, .07, 'triangle', .05); },
  clean() { [0, .07, .15].forEach((d) => tone(620 + Math.random() * 500, .06, 'sine', .05, d)); },
  sun() { tone(330, .35, 'sine', .05, 0, 660); },
  level() { [523, 659, 784].forEach((f, i) => tone(f, .2, 'triangle', .07, i * .12)); },
  ach() { [660, 880].forEach((f, i) => tone(f, .16, 'sine', .06, i * .09)); },
  no() { tone(100, .08, 'square', .025); }
};

const SVG_NS = 'http://www.w3.org/2000/svg';
function fxNode(markup) {
  const g = document.createElementNS(SVG_NS, 'g');
  g.innerHTML = markup;
  $('#fxLayer').appendChild(g);
  return g;
}
function playFx(node, frames, opts) {
  const anim = node.animate(frames, opts);
  anim.onfinish = () => node.remove();
  anim.oncancel = () => node.remove();
  return anim;
}
function rockCenter() {
  const shape = rockShape(S.type, S.seed);
  return { x: 400, y: ROCK_Y - shape.h * .55, w: shape.w, h: shape.h, top: ROCK_Y + shape.top };
}

function particles(kind) {
  if (!motionOK()) return;
  const c = rockCenter();
  const count = { pet: 5, clean: 8, sun: 0, talk: 0 }[kind] || 0;
  for (let i = 0; i < count; i++) {
    const x = c.x + (Math.random() - .5) * c.w * .8;
    const y = c.y + (Math.random() - .5) * c.h * .6;
    if (kind === 'pet') spawnHeart(x, y, i * 70);
    else spawnBubble(x, y, i * 45);
  }
  if (kind === 'sun') {
    const n = fxNode('<circle cx="400" cy="280" r="460" fill="#ffd968"/>');
    playFx(n, [{ opacity: 0 }, { opacity: .42, offset: .3 }, { opacity: 0 }], { duration: 1600, easing: 'ease-in-out' });
  }
}
function spawnHeart(x, y, delay = 0) {
  const n = fxNode(`<path d="M0 8S-11 1 -11 -5A6 6 0 0 1 0 -8A6 6 0 0 1 11 -5C11 1 0 8 0 8z" fill="#c93e57"/>`);
  n.style.opacity = 0;
  playFx(n, [
    { transform: `translate(${x}px, ${y}px) scale(.6)`, opacity: 0 },
    { transform: `translate(${x}px, ${y - 22}px) scale(1)`, opacity: 1, offset: .25 },
    { transform: `translate(${x + 8}px, ${y - 78}px) scale(.9)`, opacity: 0 }
  ], { duration: 1050, delay, easing: 'ease-out' });
}
function spawnBubble(x, y, delay = 0) {
  const rad = 5 + Math.random() * 10;
  const n = fxNode(`<circle r="${rad.toFixed(1)}" fill="rgba(255,255,255,.4)" stroke="#fff" stroke-width="1.5"/><circle cx="${(-rad * .35).toFixed(1)}" cy="${(-rad * .35).toFixed(1)}" r="${(rad * .2).toFixed(1)}" fill="#fff"/>`);
  n.style.opacity = 0;
  playFx(n, [
    { transform: `translate(${x}px, ${y}px) scale(.3)`, opacity: 0 },
    { transform: `translate(${x}px, ${y - 10}px) scale(1)`, opacity: 1, offset: .25 },
    { transform: `translate(${x + (Math.random() - .5) * 30}px, ${y - 58}px) scale(1.15)`, opacity: 0 }
  ], { duration: 850, delay, easing: 'ease-out' });
}
function speechDots() {
  const c = rockCenter();
  const x = Math.min(c.x + c.w * .38, 610), y = Math.max(c.top - 18, 60);
  const n = fxNode(`<path d="M-45 -28Q-45 -44 -29 -44H29Q45 -44 45 -28V-8Q45 8 29 8H-8L-26 27L-20 8H-29Q-45 8 -45 -8z" fill="#fff" stroke="#2a2722" stroke-width="2"/><g fill="#2a2722"><circle cx="-16" cy="-18" r="4"/><circle cy="-18" r="4"/><circle cx="16" cy="-18" r="4"/></g>`);
  n.setAttribute('transform', `translate(${x} ${y})`);
  const anim = n.animate([{ opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .85 }, { opacity: 0 }], { duration: motionOK() ? 2600 : 2200 });
  anim.onfinish = () => n.remove();
}

/* ---------- 6. Aksi pemain ---------- */

const ROCK_Y = 472;
const COOLDOWN = { pet: 1500, talk: 2500, clean: 3000, sun: 3000 };

function changeStat(key, amount) {
  S.stats[key] = clamp(S.stats[key] + amount, 0, 100);
}

function addXP(amount) {
  const before = levelIndex();
  S.xp += amount;
  const after = levelIndex();
  if (after > before) onLevelUp(after);
  checkEvolution();
}

function onLevelUp(idx) {
  const lvl = idx + 1;
  const itemNames = Object.values(ITEMS).filter((i) => i.lvl === lvl).map((i) => i.name);
  const sceneNames = Object.values(SCENES).filter((i) => i.lvl === lvl).map((i) => i.name);
  const unlocked = itemNames.concat(sceneNames);
  toast(`Kedekatan ${lvl}`, LEVELS[idx].name + (unlocked.length ? `. Terbuka: ${unlocked.join(', ')}.` : '.'));
  addDiary(`Hubungan kami kini tercatat sebagai "${LEVELS[idx].name}". {n} tidak mengonfirmasi.`);
  sfx.level();
  renderCloset();
}

function checkEvolution() {
  const lvl = level();
  let stage = 0;
  if (lvl >= 3) stage = 1;
  if (lvl >= 5) stage = 2;
  if (lvl >= 7 && S.visitDays >= 3) stage = 3;
  if (stage <= S.stage) return;
  S.stage = stage;
  renderRock();
  addDiary(`{n} berevolusi menjadi ${STAGES[stage]}. Perubahan terbesar ada di gelarnya.`);
  const copy = {
    1: 'Muncul urat tipis berwarna emas. Dia tidak membicarakannya.',
    2: 'Lumut kecil tumbuh di atasnya. Banyak orang menyebut ini kebijaksanaan.',
    3: 'Ada cahaya di atasnya. Dia tetap tidak melakukan apa-apa, tetapi kini secara suci.'
  }[stage];
  openModal({
    kicker: 'Evolusi',
    title: `${S.name} menjadi ${STAGES[stage]}`,
    rock: true,
    lines: [copy],
    actions: [{ label: 'Saya melihat perbedaannya', primary: true }]
  });
}

function act(kind) {
  const now = Date.now();
  if (kind === 'talk') { openTalk(); return; }

  particles(kind);
  if (now - (lastAct[kind] || 0) < COOLDOWN[kind]) {
    sfx.no();
    say(pick(L.cooldown));
    return;
  }
  lastAct[kind] = now;
  sfx[kind]();

  if (kind === 'pet') {
    const lines = L.pet.concat(S.type === 'akik' ? L.petAkik : S.type === 'bata' ? L.petBata : []);
    say(pick(lines));
    changeStat('happy', 6);
    changeStat('lonely', -5);
    S.counts.pet++;
    addXP(1);
  }
  if (kind === 'clean') {
    if (S.stats.clean >= 100) { say(pick(L.cleanFull)); S.counts.clean++; finishAction(); return; }
    say(pick(L.clean));
    changeStat('clean', 25);
    changeStat('happy', 2);
    changeStat('energy', -2);
    S.counts.clean++;
    addXP(3);
  }
  if (kind === 'sun') {
    if (S.stats.energy >= 100) { say(pick(L.sunFull)); S.counts.sun++; finishAction(); return; }
    say(pick(timeBucket() === 'malam' ? L.sunNight : L.sun));
    changeStat('energy', 20);
    changeStat('clean', -3);
    changeStat('happy', 2);
    S.counts.sun++;
    addXP(2);
  }
  finishAction();
}

function finishAction() {
  checkAchievements();
  renderCard();
  save();
}

function openTalk() {
  $('#talkForm').hidden = false;
  $('#talkInput').placeholder = `Katakan sesuatu kepada ${S.name}...`;
  $('#talkInput').focus();
}
function closeTalk() {
  $('#talkForm').hidden = true;
  $('#talkInput').value = '';
}

function replyFor(text) {
  const q = text.toLowerCase();
  if (!q.trim()) return L.talkEmpty;
  if (/\bbatu\b/.test(q) && (/\?/.test(q) || /\b(apa|kenapa|mengapa|bagaimana|gimana|siapa)\b/.test(q))) {
    unlock('askRock');
    return L.talkRock;
  }
  if (/capek|capai|lelah|sedih|galau|nangis|menangis|sendiri|kesepian/.test(q)) return L.talkSad;
  if (/cinta|sayang|suka kamu|love|rindu|kangen/.test(q)) return L.talkLove;
  if (/kerja|tugas|deadline|kantor|skripsi|bos|gaji|rapat/.test(q)) return L.talkWork;
  if (/maaf/.test(q)) return L.talkSorry;
  if (/\b(halo|hai|hi|hei|pagi|siang|sore|malam)\b/.test(q)) return L.talkHi;
  if (/\?|\b(apa|kenapa|mengapa|bagaimana|gimana|siapa|kapan)\b/.test(q)) return L.talkAsk;
  return L.talk;
}

function submitTalk(text) {
  const trimmed = text.trim();
  const now = Date.now();
  const cooling = now - (lastAct.talk || 0) < COOLDOWN.talk;
  sfx.talk();
  speechDots();
  closeTalk();
  say(pick(replyFor(trimmed)));
  if (trimmed) addDiary(`Aku berkata kepada {n}: "${trimmed}". Dia tidak membantah.`);
  S.counts.talk++;
  if (!cooling) {
    lastAct.talk = now;
    changeStat('lonely', -14);
    changeStat('happy', 3);
    addXP(trimmed ? 3 : 1);
  }
  finishAction();
}

/* Menyeret di atas batu berarti menggosok. Klik biasa berarti mengelus. */
function setupRockPointer() {
  const layer = $('#rockLayer');
  let down = false, last = null, travelled = 0, sinceBubble = 0, gained = 0;

  layer.addEventListener('pointerdown', (ev) => {
    down = true;
    last = { x: ev.clientX, y: ev.clientY };
    travelled = 0; sinceBubble = 0; gained = 0;
    try { layer.setPointerCapture(ev.pointerId); } catch (e) { /* tidak semua perangkat mendukung */ }
  });
  layer.addEventListener('pointermove', (ev) => {
    if (!down) return;
    const dist = Math.hypot(ev.clientX - last.x, ev.clientY - last.y);
    last = { x: ev.clientX, y: ev.clientY };
    travelled += dist;
    sinceBubble += dist;
    if (travelled > 14 && sinceBubble > 28) {
      sinceBubble = 0;
      if (S.stats.clean < 100) { changeStat('clean', .9); gained += .9; }
      const c = rockCenter();
      if (motionOK()) spawnBubble(c.x + (Math.random() - .5) * c.w * .7, c.y + (Math.random() - .5) * c.h * .6);
      if (Math.random() < .25) tone(620 + Math.random() * 500, .05, 'sine', .035);
      paintCondition();
    }
  });
  const finish = () => {
    if (!down) return;
    down = false;
    if (travelled <= 14) { act('pet'); return; }
    if (gained >= 4) {
      S.counts.clean++;
      say(S.stats.clean >= 100 ? pick(L.cleanFull) : pick(L.clean));
      if (Date.now() - (lastAct.clean || 0) >= COOLDOWN.clean) {
        lastAct.clean = Date.now();
        addXP(2);
      }
      finishAction();
    } else if (S.stats.clean >= 100) {
      say(pick(L.cleanFull));
    }
  };
  layer.addEventListener('pointerup', finish);
  layer.addEventListener('pointercancel', () => { down = false; });
  layer.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); act('pet'); }
  });

  // Mata plastik mengikuti penunjuk. Batunya tetap diam.
  window.addEventListener('pointermove', (ev) => {
    const pupils = document.querySelectorAll('#rockLayer .pupil');
    if (!pupils.length) return;
    pupils.forEach((p) => {
      const box = p.getBoundingClientRect();
      const dx = ev.clientX - (box.left + box.width / 2);
      const dy = ev.clientY - (box.top + box.height / 2);
      const mag = Math.hypot(dx, dy) || 1;
      const reach = Math.min(10, mag / 14);
      p.setAttribute('transform', `translate(${(dx / mag * reach).toFixed(1)} ${(dy / mag * reach).toFixed(1)})`);
    });
  });
}

function equipItem(id) {
  const item = ITEMS[id];
  const off = S.equip[item.slot] === id;
  S.equip[item.slot] = off ? null : id;
  if (off) say(`${item.name} dilepas. {n} tidak terlihat berbeda secara batin.`);
  else {
    say(item.line);
    addDiary(`Hari ini {n} memakai ${item.name.toLowerCase()}. Tidak ada komentar.`);
  }
  tone(440, .06, 'triangle', .05);
  renderRock();
  renderCloset();
  finishAction();
}

function setScene(key) {
  S.scene = key;
  say({
    halaman: '{n} kembali ke halaman. Rumput tumbuh di sekitarnya, melebihi semua pencapaiannya.',
    meja: '{n} kini bekerja dari kantor. Kinerjanya tidak berubah.',
    pantai: '{n} sedang liburan. Sulit dibedakan dari hari biasa.',
    direksi: 'Dewan direksi menyambut {n}. Keputusan pertamanya: tidak ada.',
    angkasa: '{n} kini di luar angkasa. Tidak ada yang mendengarnya diam.'
  }[key]);
  renderScene();
  renderCloset();
  applyTime();
  save();
}

/* ---------- 7. Waktu ---------- */

function timeBucket(d = new Date()) {
  const h = d.getHours();
  if (h >= 5 && h < 10) return 'pagi';
  if (h >= 10 && h < 15) return 'siang';
  if (h >= 15 && h < 18) return 'sore';
  return 'malam';
}

function applyTime() {
  const now = new Date();
  const bucket = timeBucket(now);
  const tint = TINTS[bucket];
  const scene = SCENES[S.scene];
  const back = $('#tintBack'), front = $('#tintFront');
  back.setAttribute('fill', tint.color);
  back.setAttribute('opacity', (tint.back * scene.tint).toFixed(2));
  front.setAttribute('fill', tint.color);
  front.setAttribute('opacity', (tint.back * scene.tint * .28).toFixed(2));

  const sky = $('#skyLayer');
  const night = bucket === 'malam';
  sky.querySelectorAll('.stars, .sky-moon').forEach((el) => el.setAttribute('opacity', night ? 1 : 0));
  sky.querySelectorAll('.sky-sun').forEach((el) => el.setAttribute('opacity', night ? 0 : 1));
  $('#clockLabel').textContent = `Pukul ${pad(now.getHours())}.${pad(now.getMinutes())}, ${tint.label}`;
}

function applyDecay(ms) {
  const hours = ms / 3600000;
  const m = TYPES[S.type].decay;
  changeStat('happy', -4 * hours * (m.happy || 1));
  changeStat('clean', -3 * hours * (m.clean || 1));
  changeStat('energy', -2.5 * hours * (m.energy || 1));
  changeStat('lonely', 5 * hours * (m.lonely || 1));
}

function catchUp() {
  const now = Date.now();
  const elapsed = Math.max(0, now - S.lastSeen);
  applyDecay(elapsed);
  S.lastSeen = now;
  return elapsed;
}

function checkDay() {
  const key = dateKey();
  if (key === S.lastDay) return;
  S.lastDay = key;
  S.visitDays++;
  const dayNo = Math.floor((Date.now() - S.adoptedAt) / 86400000) + 1;
  const factIndex = S.visitDays % L.facts.length;
  addDiary(`Hari ke-${dayNo} bersama {n}. ${L.facts[factIndex]}`);
  addXP(8);
}

function durationText(ms) {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} menit`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} jam ${mins % 60} menit`;
  return `${Math.floor(hours / 24)} hari ${hours % 24} jam`;
}

function handleReturn(elapsed) {
  if (elapsed < 2 * 60 * 1000) return false;
  if (elapsed > 24 * 3600 * 1000) unlock('back');
  const thoughts = Math.floor(elapsed / 47000).toLocaleString('id-ID');
  addDiary(`Aku pergi selama ${durationText(elapsed)}. {n} masih di tempat yang sama.`);
  openModal({
    kicker: 'Surat dari batu',
    title: `${S.name} tidak ke mana-mana`,
    rock: false,
    lines: [pick(L.letter)],
    ledger: [
      ['Lama kamu pergi', durationText(elapsed)],
      ['Gerakan', '0'],
      ['Hal yang dipikirkan', thoughts],
      ['Kesimpulan', '0']
    ],
    actions: [{ label: 'Maaf', primary: true, fn: () => say('Permintaan maaf diterima, atau setidaknya tidak ditolak.') }]
  });
  return true;
}

function runEvent() {
  const outdoor = SCENES[S.scene].outdoor;
  const roll = Math.random();
  if (roll < .03) return eventMove();
  if (!motionOK() || roll < .45) return say(pick(L.events.teks));
  if (roll < .62) return eventAnt();
  if (roll < .78) return eventButterfly();
  if (roll < .9) return outdoor ? eventRain() : say(pick(L.events.hujanDalam));
  return outdoor ? eventLeaf() : say(pick(L.events.teks));
}

function eventAnt() {
  say(pick(L.events.semut));
  const ant = fxNode('<g fill="#1a1510"><ellipse cx="-9" rx="6" ry="4"/><ellipse cy="-1" rx="4" ry="3"/><ellipse cx="8" cy="-1" rx="5" ry="4"/><path d="M-6 2L-11 8M0 2V8M5 2L10 8M12 -4L17 -10" stroke="#1a1510" stroke-width="1.5" fill="none"/></g>');
  playFx(ant, [{ transform: 'translate(-30px, 516px)' }, { transform: 'translate(830px, 516px)' }], { duration: 15000 });
}

function eventButterfly() {
  say(pick(L.events.kupu));
  const c = rockCenter();
  const perch = `translate(${c.x + 18}px, ${c.top - 12}px)`;
  const b = fxNode('<g><path class="wing" d="M0 0Q-20 -24 -24 -6Q-22 8 0 2z" fill="#e7883b" stroke="#3b2413"/><path class="wing" d="M0 0Q20 -24 24 -6Q22 8 0 2z" fill="#e7883b" stroke="#3b2413"/><path d="M0 -8V6" stroke="#3b2413" stroke-width="3"/></g>');
  playFx(b, [
    { transform: 'translate(-40px, 120px)' },
    { transform: 'translate(180px, 190px)', offset: .15 },
    { transform: perch, offset: .3 },
    { transform: perch, offset: .75 },
    { transform: 'translate(560px, 150px)', offset: .9 },
    { transform: 'translate(840px, 70px)' }
  ], { duration: 15000, easing: 'ease-in-out' });
  b.querySelectorAll('.wing').forEach((w) => {
    w.style.transformOrigin = '0px 0px';
    w.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(.25)' }, { transform: 'scaleX(1)' }], { duration: 420, iterations: 36 });
  });
}

function eventRain() {
  say(pick(L.events.hujan));
  changeStat('clean', 9);
  let lines = '';
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * 900 - 50, y = Math.random() * 700 - 120;
    lines += `<path d="M${x.toFixed(0)} ${y.toFixed(0)}l-6 22" stroke="#dcecf5" stroke-width="1.6" opacity=".72"/>`;
  }
  const rain = fxNode(lines);
  rain.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(120px)' }], { duration: 300, iterations: 40 });
  playFx(rain, [{ opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .88 }, { opacity: 0 }], { duration: 12000 });
  renderCard();
}

function eventLeaf() {
  say(pick(L.events.daun));
  const x = 180 + Math.random() * 440;
  const leaf = fxNode('<path d="M0 -12Q14 -4 0 12Q-14 -4 0 -12z" fill="#b5812c" stroke="#74501a"/>');
  playFx(leaf, [
    { transform: `translate(${x}px, -20px) rotate(0deg)` },
    { transform: `translate(${x + 44}px, 170px) rotate(160deg)`, offset: .4 },
    { transform: `translate(${x - 34}px, 345px) rotate(310deg)`, offset: .75 },
    { transform: `translate(${x}px, 505px) rotate(400deg)`, offset: .92 },
    { transform: `translate(${x}px, 505px) rotate(400deg)`, opacity: 0 }
  ], { duration: 8500, easing: 'ease-in-out' });
}

function eventMove() {
  S.moved++;
  S.lastMovedAt = Date.now();
  say(pick(L.events.gerak));
  addDiary('{n} bergeser sekitar 0,1 mm. Atau mungkin tidak. Aku tidak bisa membuktikannya.');
  unlock('witness');
  placeRock();
  renderCard();
  save();
}

function tick() {
  if (document.hidden || !S) return;
  const now = Date.now();
  const elapsed = catchUp();
  checkDay();

  passiveClock += Math.min(elapsed, 5000);
  if (passiveClock >= 300000) {
    passiveClock = 0;
    addXP(1);
  }
  if (now >= nextEventAt) {
    nextEventAt = now + 45000 + Math.random() * 65000;
    if (!$('#modal').open && $('#talkForm').hidden) runEvent();
  }
  if (now - sessionStart > 300000) unlock('stay');
  renderCard();
  if (now % 10000 < 1000) save();
  if (new Date().getSeconds() === 0) applyTime();
}

/* ---------- 8. Tampilan ---------- */

function say(text) {
  const p = $('#narr');
  p.textContent = tmpl(text);
  p.classList.remove('fresh');
  void p.offsetWidth;
  p.classList.add('fresh');
}

function toast(title, body) {
  const box = $('#toasts');
  const t = document.createElement('div');
  t.className = 'toast';
  const small = document.createElement('small');
  small.textContent = title;
  t.append(small, document.createTextNode(tmpl(body)));
  box.appendChild(t);
  setTimeout(() => t.classList.add('out'), 4200);
  setTimeout(() => t.remove(), 4600);
}

function addDiary(text) {
  S.diary.unshift({ t: Date.now(), text: tmpl(text) });
  if (S.diary.length > 150) S.diary.length = 150;
  if (document.querySelector('#pane-diary:not([hidden])')) renderDiary();
}

function unlock(id) {
  if (S.ach[id]) return;
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return;
  S.ach[id] = Date.now();
  toast('Pencapaian', a.name);
  addDiary(`Pencapaian tercatat: ${a.name}. {n} tidak memberi selamat.`);
  sfx.ach();
  renderAchievements();
}

function checkAchievements() {
  const c = S.counts;
  if (c.pet >= 1) unlock('firstPet');
  if (c.pet >= 50) unlock('pet50');
  if (c.talk >= 10) unlock('talk10');
  if (S.stats.clean >= 100) unlock('spotless');
  if (S.equip.head && S.equip.face && S.equip.neck) unlock('dressed');
  const lvl = level();
  if (lvl >= 3) unlock('lvl3');
  if (lvl >= 5) unlock('lvl5');
  if (lvl >= 7) unlock('lvl7');
  if (S.stage >= 1) unlock('evolved');
  if (S.visitDays >= 3) unlock('days3');
  const h = new Date().getHours();
  if (h >= 0 && h < 4) unlock('night');
}

function moodText() {
  const s = S.stats;
  if (s.lonely > 75) return 'Merindukan seseorang, atau apa pun';
  if (s.clean < 25) return 'Merasa berdebu';
  if (s.energy < 20) return 'Diam karena lelah (sulit dibedakan)';
  if (s.happy < 30) return 'Murung, kemungkinan';
  if (s.happy > 80) return 'Puas secara mineral';
  return 'Batu';
}

function titleText() {
  const c = S.counts;
  const total = c.pet + c.talk + c.clean + c.sun;
  let title = STAGES[S.stage];
  if (total >= 10) {
    const top = Object.keys(c).reduce((a, b) => (c[b] > c[a] ? b : a));
    title += `, ${PATHS[top]}`;
  }
  return title;
}

function renderCard() {
  const s = S.stats;
  document.querySelectorAll('.meter').forEach((m) => {
    const key = m.dataset.stat;
    const value = Math.round(s[key]);
    m.querySelector('.m-val').textContent = value;
    m.querySelector('i').style.width = `${s[key]}%`;
    m.classList.toggle('warn', key === 'lonely' ? value > 70 : value < 25);
  });
  const idx = levelIndex();
  const cur = LEVELS[idx], next = LEVELS[idx + 1];
  $('#bondLevel').textContent = next ? `${idx + 1} / ${LEVELS.length}` : 'Maksimal';
  $('#bondName').textContent = cur.name;
  $('#bondFill').style.width = next ? `${((S.xp - cur.xp) / (next.xp - cur.xp)) * 100}%` : '100%';

  $('#rockName').textContent = S.name;
  $('#rockTitle').textContent = titleText();
  $('#factMood').textContent = moodText();

  const still = Math.floor((Date.now() - S.lastMovedAt) / 1000);
  const days = Math.floor(still / 86400);
  const clock = `${pad(Math.floor(still / 3600) % 24)}:${pad(Math.floor(still / 60) % 60)}:${pad(still % 60)}`;
  $('#factStill').textContent = days ? `${days} hari ${clock}` : clock;
  $('#factDist').textContent = S.moved ? `${(S.moved / 10).toFixed(1).replace('.', ',')} mm (katanya)` : '0 cm';
  $('#factThoughts').textContent = Math.floor((Date.now() - S.adoptedAt) / 47000).toLocaleString('id-ID');
  paintCondition();
}

function paintCondition() {
  const c = S.stats.clean;
  const layer = $('#rockLayer');
  const moss = layer.querySelector('.moss'), dirt = layer.querySelector('.dirt'), spark = layer.querySelector('.sparkles');
  if (moss) moss.setAttribute('opacity', clamp((35 - c) / 35, 0, 1).toFixed(2));
  if (dirt) dirt.setAttribute('opacity', clamp((70 - c) / 60, 0, 1).toFixed(2));
  if (spark) spark.setAttribute('opacity', c >= 92 ? 1 : 0);
}

function placeRock() {
  $('#rockLayer').setAttribute('transform', `translate(${400 + S.moved} ${ROCK_Y})`);
}

function renderRock() {
  const layer = $('#rockLayer');
  layer.innerHTML = rockMarkup({ type: S.type, seed: S.seed, stage: S.stage, equip: S.equip, uid: 'main', live: true, clean: S.stats.clean });
  placeRock();
  paintCondition();
}

function renderScene() {
  const layer = $('#sceneLayer'), sky = $('#skyLayer');
  layer.innerHTML = sceneMarkup(S.scene, 'main', true);
  // Benda langit dipindah ke atas lapisan warna agar tetap terang saat malam.
  sky.textContent = '';
  sky.append(...layer.querySelectorAll('.stars, .sky-sun, .sky-moon'));
}

function renderCloset() {
  const pane = $('#pane-closet');
  pane.textContent = '';
  const lvl = level();

  for (const slot of ['head', 'face', 'neck']) {
    const group = document.createElement('div');
    group.className = 'closet-group';
    const h = document.createElement('h3');
    h.textContent = SLOT_NAMES[slot];
    const grid = document.createElement('div');
    grid.className = 'item-grid';
    for (const [id, item] of Object.entries(ITEMS)) {
      if (item.slot !== slot) continue;
      const btn = document.createElement('button');
      btn.className = 'item';
      btn.type = 'button';
      const locked = lvl < item.lvl;
      btn.disabled = locked;
      btn.setAttribute('aria-pressed', String(S.equip[slot] === id));
      btn.innerHTML = `<svg viewBox="${slot === 'head' ? '-85 -108 170 116' : slot === 'neck' ? '-100 -32 200 124' : '-76 -32 152 64'}" aria-hidden="true">${accessoryMarkup(id)}</svg>`;
      btn.append(locked ? `Kedekatan ${item.lvl}` : item.name);
      btn.addEventListener('click', () => equipItem(id));
      grid.appendChild(btn);
    }
    group.append(h, grid);
    pane.appendChild(group);
  }

  const group = document.createElement('div');
  group.className = 'closet-group';
  const h = document.createElement('h3');
  h.textContent = 'Latar';
  const grid = document.createElement('div');
  grid.className = 'item-grid';
  for (const [key, sc] of Object.entries(SCENES)) {
    const btn = document.createElement('button');
    btn.className = 'item scene';
    btn.type = 'button';
    const locked = lvl < sc.lvl;
    btn.disabled = locked;
    btn.setAttribute('aria-pressed', String(S.scene === key));
    btn.innerHTML = `<svg viewBox="0 0 800 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${sceneMarkup(key, `th${key}`)}</svg>`;
    btn.append(locked ? `Kedekatan ${sc.lvl}` : sc.name);
    btn.addEventListener('click', () => setScene(key));
    grid.appendChild(btn);
  }
  group.append(h, grid);
  pane.appendChild(group);
}

function renderDiary() {
  const pane = $('#pane-diary');
  pane.textContent = '';
  const list = document.createElement('ol');
  list.className = 'diary';
  for (const entry of S.diary) {
    const li = document.createElement('li');
    const time = document.createElement('time');
    const d = new Date(entry.t);
    time.dateTime = d.toISOString();
    time.textContent = `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, ${pad(d.getHours())}.${pad(d.getMinutes())}`;
    li.append(time, entry.text);
    list.appendChild(li);
  }
  pane.appendChild(list);
}

function renderAchievements() {
  const pane = $('#pane-ach');
  pane.textContent = '';
  const got = ACHIEVEMENTS.filter((a) => S.ach[a.id]).length;
  const count = document.createElement('p');
  count.className = 'ach-count';
  count.textContent = `${got} dari ${ACHIEVEMENTS.length} tercatat`;
  const list = document.createElement('ul');
  list.className = 'ach';
  for (const a of ACHIEVEMENTS) {
    const has = !!S.ach[a.id];
    const li = document.createElement('li');
    if (has) li.className = 'got';
    const mark = document.createElement('i');
    mark.className = 'mark';
    const body = document.createElement('div');
    const b = document.createElement('b');
    b.textContent = !has && a.secret ? 'Rahasia' : a.name;
    const span = document.createElement('span');
    span.textContent = !has && a.secret ? 'Batu tidak mau memberi tahu.' : a.desc;
    body.append(b, span);
    li.append(mark, body);
    list.appendChild(li);
  }
  pane.append(count, list);
}

function renderSettings() {
  $('#renameInput').value = S.name;
  $('#optSound').checked = S.settings.sound;
  $('#optMotion').checked = S.settings.motion;
  document.documentElement.classList.toggle('no-motion', !motionOK());
  $('#storageNote').textContent = storage.ok
    ? 'Data batu tersimpan di peramban ini.'
    : 'Peramban ini tidak mengizinkan penyimpanan. Batu akan hilang saat halaman ditutup. Dia tidak keberatan.';
}

function selectTab(name) {
  document.querySelectorAll('.tabs [role="tab"]').forEach((tab) => {
    tab.setAttribute('aria-selected', String(tab.id === `tab-${name}`));
  });
  document.querySelectorAll('.pane').forEach((pane) => {
    pane.hidden = pane.id !== `pane-${name}`;
  });
  if (name === 'diary') renderDiary();
  if (name === 'ach') renderAchievements();
  if (name === 'set') renderSettings();
}

/* Modal memakai antrean agar surat dan evolusi tidak saling menimpa. */
const modalQueue = [];
function openModal(spec) {
  modalQueue.push(spec);
  if (!$('#modal').open) showNextModal();
}
function showNextModal() {
  const spec = modalQueue.shift();
  const dlg = $('#modal');
  if (!spec) { if (dlg.open) dlg.close(); return; }
  $('#modalKicker').textContent = spec.kicker || '';
  $('#modalTitle').textContent = spec.title;

  const rockBox = $('#modalRock');
  rockBox.innerHTML = spec.rock && S
    ? `<svg viewBox="-200 -240 400 260">${rockMarkup({ type: S.type, seed: S.seed, stage: S.stage, equip: S.equip, uid: 'modal', clean: 100 })}</svg>`
    : '';

  const body = $('#modalBody');
  body.textContent = '';
  (spec.lines || []).forEach((line) => {
    const p = document.createElement('p');
    p.textContent = tmpl(line);
    body.appendChild(p);
  });
  if (spec.ledger) {
    const box = document.createElement('div');
    box.className = 'ledger';
    spec.ledger.forEach(([k, v]) => {
      const a = document.createElement('span'), b = document.createElement('span');
      a.textContent = k; b.textContent = v;
      box.append(a, b);
    });
    body.appendChild(box);
  }

  const actions = $('#modalActions');
  actions.textContent = '';
  spec.actions.forEach((a) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn ${a.primary ? 'btn-primary' : a.danger ? 'btn-danger' : 'btn-quiet'}`;
    btn.textContent = a.label;
    btn.addEventListener('click', () => {
      dlg.close();
      if (a.fn) a.fn();
      showNextModal();
    });
    actions.appendChild(btn);
  });
  dlg.showModal();
}

function startGame(isNew) {
  $('#adopt').hidden = true;
  $('#app').hidden = false;
  document.title = `${S.name} | Pelihara Batu Virtual`;
  $('#specNo').textContent = `Kartu spesimen No. ${String(S.seed % 90000 + 10000)}`;
  $('#rockSpecies').textContent = TYPES[S.type].name;
  const d = new Date(S.adoptedAt);
  $('#factAdopted').textContent = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const elapsed = isNew ? 0 : catchUp();
  renderScene();
  renderRock();
  renderCloset();
  renderSettings();
  applyTime();
  checkDay();
  checkEvolution();
  renderCard();
  checkAchievements();

  if (isNew) {
    addDiary('{n} tiba di rumah. Tidak ada keluhan selama perjalanan.');
    say('{n} telah tiba. Kamu boleh mengelusnya. Dia tidak akan tahu, tetapi kamu akan tahu.');
  } else {
    const greet = { pagi: L.morning, siang: L.noon, sore: L.evening, malam: L.night }[timeBucket()];
    say(pick(greet));
    handleReturn(elapsed);
  }
  nextEventAt = Date.now() + 25000 + Math.random() * 15000;
  save();
  if (!startGame.started) {
    startGame.started = true;
    setInterval(tick, 1000);
  }
}

/* ---------- 9. Layar adopsi dan penyalaan ---------- */

const pending = { type: 'kali', seed: randomSeed() };
function randomSeed() { return Math.floor(Math.random() * 2147483647); }

function renderAdoptPreview() {
  $('#adoptPreview').innerHTML = rockMarkup({ type: pending.type, seed: pending.seed, uid: 'prev' });
  $('#adoptSpecies').textContent = TYPES[pending.type].name;
  $('#adoptTrait').textContent = TYPES[pending.type].trait;
  document.querySelectorAll('.type-card').forEach((card) => {
    const on = card.dataset.type === pending.type;
    card.setAttribute('aria-checked', String(on));
    card.tabIndex = on ? 0 : -1;
  });
}

function setupAdoption() {
  const grid = $('#typeGrid');
  const keys = Object.keys(TYPES);
  grid.textContent = '';
  keys.forEach((key) => {
    const t = TYPES[key];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'type-card';
    card.dataset.type = key;
    card.setAttribute('role', 'radio');
    card.innerHTML = `<svg viewBox="-190 -220 380 240" aria-hidden="true">${rockMarkup({ type: key, seed: 1234 + key.length * 991, uid: `card${key}` })}</svg>`;
    const b = document.createElement('b');
    b.textContent = t.name;
    const span = document.createElement('span');
    span.textContent = t.trait;
    card.append(b, span);
    card.addEventListener('click', () => {
      pending.type = key;
      pending.seed = randomSeed();
      renderAdoptPreview();
    });
    card.addEventListener('keydown', (ev) => {
      const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
      if (!delta) return;
      ev.preventDefault();
      const nextKey = keys[(keys.indexOf(key) + delta + keys.length) % keys.length];
      pending.type = nextKey;
      pending.seed = randomSeed();
      renderAdoptPreview();
      grid.querySelector(`[data-type="${nextKey}"]`).focus();
    });
    grid.appendChild(card);
  });

  $('#rerollBtn').addEventListener('click', () => {
    pending.seed = randomSeed();
    renderAdoptPreview();
  });
  $('#suggestBtn').addEventListener('click', () => {
    $('#nameInput').value = pick(NAME_IDEAS);
    $('#nameError').textContent = '';
  });
  $('#nameInput').addEventListener('input', () => { $('#nameError').textContent = ''; });
  $('#adoptForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = $('#nameInput').value.trim();
    if (!name) {
      $('#nameError').textContent = 'Batu tanpa nama hanyalah kerikil administratif. Isi dulu.';
      $('#nameInput').focus();
      return;
    }
    S = newRock(pending.type, pending.seed, name);
    startGame(true);
  });
  renderAdoptPreview();
}

function setupGameControls() {
  document.querySelectorAll('.act').forEach((btn) => {
    btn.addEventListener('click', () => act(btn.dataset.act));
  });
  $('#talkForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    submitTalk($('#talkInput').value);
  });
  $('#talkCancel').addEventListener('click', closeTalk);
  $('#talkInput').addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeTalk(); });

  document.querySelectorAll('.tabs [role="tab"]').forEach((tab) => {
    tab.addEventListener('click', () => selectTab(tab.id.replace('tab-', '')));
  });

  $('#renameForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = $('#renameInput').value.trim();
    if (!name || name === S.name) return;
    const old = S.name;
    S.name = name;
    document.title = `${name} | Pelihara Batu Virtual`;
    addDiary(`${old} kini bernama ${name}. Dia tidak keberatan. Dia tidak tahu.`);
    say(`${old} kini bernama ${name}. Dia tidak keberatan.`);
    renderCard();
    save();
  });
  $('#optSound').addEventListener('change', (ev) => { S.settings.sound = ev.target.checked; save(); });
  $('#optMotion').addEventListener('change', (ev) => {
    S.settings.motion = ev.target.checked;
    renderSettings();
    save();
  });
  $('#resetBtn').addEventListener('click', () => {
    openModal({
      kicker: 'Keputusan besar',
      title: `Lepaskan ${S.name} ke alam?`,
      lines: ['Semua data, aksesori, dan buku harian akan dihapus dari peramban ini. Batu tidak akan menangis. Itu bagian terberatnya.'],
      actions: [
        { label: 'Jangan', primary: true },
        { label: 'Lepaskan', danger: true, fn: () => {
          // S dikosongkan dulu agar penyimpanan saat pagehide tidak menghidupkannya kembali.
          S = null;
          storage.clear();
          location.reload();
        } }
      ]
    });
  });

  $('#modal').addEventListener('cancel', (ev) => ev.preventDefault());

  document.addEventListener('visibilitychange', () => {
    if (!S) return;
    if (document.hidden) { save(); return; }
    const elapsed = catchUp();
    renderCard();
    handleReturn(elapsed);
    save();
  });
  window.addEventListener('pagehide', save);
  setupRockPointer();
}

function isValidSave(data) {
  return data && data.v === 1 && TYPES[data.type] && typeof data.name === 'string' && data.stats && data.counts && data.equip && SCENES[data.scene] && Array.isArray(data.diary);
}

function boot() {
  setupGameControls();
  const saved = storage.load();
  if (isValidSave(saved)) {
    S = saved;
    startGame(false);
  } else {
    setupAdoption();
    $('#adopt').hidden = false;
  }
}

boot();
