'use strict';

/* ==========================================================
   Generator Alasan Tidak Produktif
   Setiap alasan ditulis sebagai klausa, jadi bisa berdiri sendiri
   atau disambung dengan kegiatan yang diketik pengguna.
   ========================================================== */

const CATEGORIES = {
  sekolah: 'Sekolah', kerja: 'Kerja', tugas: 'Tugas',
  sosial: 'Sosial', rumah: 'Rumah', kosmik: 'Kosmik'
};
const LEVELS = { 1: 'Normal', 2: 'Aneh', 3: 'Absurd', 4: 'Tidak masuk akal' };
const THEMES = { poster: 'Poster', resmi: 'Surat resmi', nota: 'Catatan tempel', kosmik: 'Kosmik' };

const BANK = {
  sekolah: {
    1: [
      'buku saya tertinggal di rumah, dan rumah saya tertinggal di suasana hati yang kurang baik',
      'jadwal pelajaran hari ini terasa terlalu padat untuk dibayangkan',
      'pulpen saya habis tepat ketika semangat saya juga habis',
      'saya masih menunggu teman yang biasanya saya contek untuk mulai duluan'
    ],
    2: [
      'seragam saya belum siap menghadapi kenyataan',
      'kursi saya tadi menatap saya dengan cara yang tidak profesional',
      'papan tulis itu sepertinya punya masalah pribadi dengan saya',
      'tas saya menolak dibuka sebelum kami menyelesaikan pembicaraan kemarin'
    ],
    3: [
      'rumus matematika tadi malam mengirim pesan bahwa kami perlu jaga jarak',
      'bel sekolah berbunyi dalam nada yang menyinggung perasaan saya',
      'buku paket saya sedang cuti melahirkan catatan kaki',
      'guru saya ada di mimpi saya semalam, dan nilai saya sudah dibahas di sana'
    ],
    4: [
      'Pythagoras meminta saya menunggu sampai segitiganya berdamai',
      'seluruh abjad setelah huruf K sedang mogok dan saya tidak mau melewati garis piket',
      'tabel periodik saya kehilangan satu unsur, dan unsur itu adalah niat',
      'kapur tulis terakhir di dunia sedang dalam perjalanan pulang ke kampung halamannya'
    ]
  },
  kerja: {
    1: [
      'laptop saya sedang memasang pembaruan yang katanya penting',
      'saya masih menunggu balasan dari orang yang juga sedang menunggu balasan saya',
      'kopi saya belum mulai bekerja, jadi saya pun belum',
      'rapat tadi membutuhkan rapat lanjutan untuk memulihkan diri'
    ],
    2: [
      'laptop saya sedang menjalani masa introspeksi',
      'spreadsheet saya butuh ruang untuk tumbuh tanpa campur tangan saya',
      'email itu masih terlalu muda untuk dibalas',
      'kursor saya berkedip dengan nada yang meragukan kemampuan saya'
    ],
    3: [
      'kalender kantor sedang tidak mendukung secara emosional',
      'printer di kantor mengetahui sesuatu tentang saya, dan saya perlu bersiap',
      'tenggat waktu saya sedang berlibur dan saya menghormati masa cutinya',
      'saya sedang menunggu tanda tangan digital dari leluhur saya'
    ],
    4: [
      'kolom F di Excel menyatakan kemerdekaannya dan meminta pengakuan internasional',
      'atasan saya ternyata tiga ekor kucing dalam satu kemeja, dan mereka sedang tidur',
      'seluruh folder saya berimigrasi ke folder lain demi kehidupan yang lebih baik',
      'tombol Enter saya sedang mengikuti retret keheningan di dalam laci'
    ]
  },
  tugas: {
    1: [
      'saya perlu mencari inspirasi dulu, dan inspirasinya ada di video kucing',
      'tenggatnya masih besok, dan besok adalah hari yang sangat jauh',
      'saya kerja lebih baik di bawah tekanan, dan tekanannya belum datang',
      'saya harus merapikan meja dulu, lalu merapikan cara saya merapikan meja'
    ],
    2: [
      'saya menunggu inspirasi turun dari satelit',
      'dokumen kosong itu menatap saya terlalu dalam',
      'tugas ini belum memperkenalkan dirinya dengan sopan',
      'daftar pustaka saya masih dalam tahap mengenal diri sendiri'
    ],
    3: [
      'kucing saya menatap saya dengan ekspresi kecewa, dan saya perlu memprosesnya',
      'huruf pertama tugas ini adalah keputusan besar yang tidak bisa diambil tanpa wali',
      'dosen saya hadir sebagai bayangan di tembok, dan kami belum sepakat soal halaman',
      'Word saya memberi garis merah pada seluruh kepribadian saya'
    ],
    4: [
      'tugas saya sudah selesai di semesta sebelah, dan saya sedang mengurus izin pengirimannya',
      'semua kalimat saya bersatu dan menuntut penulis yang lebih kompeten',
      'kertas A4 sedang bernegosiasi menjadi A5 dan hasilnya belum keluar',
      'seekor koma telah masuk ke dalam rumah dan belum mau keluar sampai paragraf berakhir'
    ]
  },
  sosial: {
    1: [
      'baterai sosial saya tinggal dua persen',
      'saya baru sadar acaranya hari ini, dan saya belum siap menjadi orang yang datang',
      'saya sudah bilang "otw" dan itu sudah sangat melelahkan',
      'semua baju saya sedang berada di tempat yang bukan lemari'
    ],
    2: [
      'wajah saya belum selesai dimuat',
      'saya kehabisan kuota basa-basi untuk bulan ini',
      'grup keluarga sedang membicarakan sesuatu dan saya butuh perlindungan saksi',
      'senyum saya masih dalam proses servis'
    ],
    3: [
      'tanaman saya butuh didengarkan malam ini, dan dia sudah menyiapkan pidato',
      'saya sudah menghadiri acara itu dalam pikiran dan pulang lebih awal',
      'nama panggilan saya sedang dipakai orang lain sampai hari Kamis',
      'bayangan saya tidak mau keluar rumah, dan kami selalu berangkat bersama'
    ],
    4: [
      'saya sudah mengirim versi kertas diri saya, dan dia sangat menikmati acaranya',
      'ketua RT dari dimensi lain memanggil saya untuk kerja bakti lintas waktu',
      'seluruh teman saya ternyata saya, dan kami sepakat tidak datang',
      'percakapan ringan telah dilarang di tubuh saya oleh hukum setempat'
    ]
  },
  rumah: {
    1: [
      'saya baru akan mencuci piring setelah piringnya cukup banyak supaya efisien',
      'lantainya akan kotor lagi besok, jadi saya menghemat tenaga',
      'kasur saya baru saja menjadi sangat nyaman dan sayang kalau disia-siakan',
      'sapu saya entah di mana, dan mencarinya butuh istirahat dulu'
    ],
    2: [
      'cucian saya sedang menyusun tumpukan yang secara artistik belum selesai',
      'kulkas saya butuh dibuka beberapa kali lagi sebelum saya bisa mengambil keputusan',
      'debu di rak itu sudah membangun komunitas, dan saya tidak mau menggusur',
      'kipas angin dan saya sedang berdebat, dan dia masih berputar-putar'
    ],
    3: [
      'piring di wastafel sudah membentuk pemerintahan dan saya harus menunggu pemilu',
      'sendok terakhir saya sedang menjalani masa berkabung atas garpu',
      'mesin cuci saya melihat isi kantong saya dan meminta waktu untuk berpikir',
      'kaus kaki yang hilang mengirim surat tebusan dan saya menunggu petunjuk'
    ],
    4: [
      'kamar saya sudah bersih di garis waktu yang seharusnya, dan saya tidak mau merusak sejarah',
      'gagang pintu mengaku sebagai pemilik sah rumah ini, dan saya sedang menunggu pengacara',
      'semua ubin saya sedang dihitung ulang oleh badan sensus ubin',
      'galon air saya berkata ia adalah samudra, dan saya tidak punya izin melaut'
    ]
  },
  kosmik: {
    1: [
      'hari ini gravitasi terasa terlalu kuat untuk produktif',
      'mataharinya terlalu terang untuk memulai sesuatu yang baru',
      'langit mendung, dan saya orang yang sangat menghormati cuaca',
      'ini hari Senin, dan hal itu sudah menjelaskan semuanya'
    ],
    2: [
      'Merkurius sedang mundur dan membawa motivasi saya bersamanya',
      'bulan sedang berada di fase yang secara pribadi menyudutkan saya',
      'kalender sedang tidak mendukung secara emosional',
      'rotasi Bumi hari ini terlalu cepat, dan saya masih ada di hari Minggu'
    ],
    3: [
      'alam semesta sedang mengembang, dan saya tidak mau mendahului',
      'Pluto belum menjawab permintaan maaf saya',
      'sebuah lubang hitam kecil terbentuk di tengah motivasi saya',
      'bintang saya meredup demi menghemat listrik, dan saya mengikuti imbauannya'
    ],
    4: [
      'saya baru menerima kabar bahwa waktu hanyalah konsep, dan tenggat saya juga',
      'konstelasi Sapu Tangan sedang sejajar dengan cucian saya dan saya dilarang bergerak',
      'matahari mengirim surat resmi yang meminta saya tidak bersinar hari ini',
      'alien menahan kemauan saya di perbatasan galaksi karena tidak punya visa'
    ]
  }
};

const COPY_LINES = [
  'Tersalin. Semoga atasanmu tidak membaca situs ini.',
  'Tersalin. Ucapkan dengan wajah yakin.',
  'Tersalin. Kantor kami tidak bertanggung jawab atas akibatnya.'
];

/* ---------- Simpanan ---------- */

const SAVE_KEY = 'generator-alasan-v1';
const blank = () => ({ cat: 'semua', level: 2, theme: 'poster', count: 0, favorites: [], history: [] });
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (raw && Array.isArray(raw.favorites) && Array.isArray(raw.history)) {
      const d = { ...blank(), ...raw };
      if (d.cat !== 'semua' && !CATEGORIES[d.cat]) d.cat = 'semua';
      if (!LEVELS[d.level]) d.level = 2;
      if (!THEMES[d.theme]) d.theme = 'poster';
      return d;
    }
  } catch (e) { /* mulai baru */ }
  return blank();
}
let S = load();
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* tetap bisa dipakai */ }
}

const $ = (sel) => document.querySelector(sel);

/* ---------- Pembuat alasan ---------- */

let current = null;
const bags = new Map();

function capitalize(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

function compose(clause, activity) {
  const act = activity.trim().replace(/[.!?]+$/, '');
  return act ? `Saya belum bisa ${act} karena ${clause}.` : `${capitalize(clause)}.`;
}

function clausesFor(cat, level) {
  const cats = cat === 'semua' ? Object.keys(BANK) : [cat];
  return cats.flatMap((c) => BANK[c][level].map((text) => ({ text, cat: c, level })));
}

/* Kantong acak: semua alasan keluar sekali sebelum ada yang terulang. */
function draw(cat, level) {
  const key = `${cat}:${level}`;
  let bag = bags.get(key);
  if (!bag || !bag.length) {
    bag = clausesFor(cat, level);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    if (current && bag.length > 1 && bag[bag.length - 1].text === current.clause) bag.unshift(bag.pop());
    bags.set(key, bag);
  }
  return bag.pop();
}

function makeEntry(item, activity, kind) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    text: compose(item.text, activity),
    clause: item.text, cat: item.cat, level: item.level, kind, t: Date.now()
  };
}

function generate() {
  const item = draw(S.cat, S.level);
  const entry = makeEntry(item, $('#activity').value, 'biasa');
  S.count++;
  entry.no = S.count;
  S.history.unshift(entry);
  if (S.history.length > 50) S.history.length = 50;
  show(entry, true);
  renderTally();
  renderHistory();
  save();
}

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* Alasan harian ditentukan tanggal, jadi sama sepanjang hari di semua perangkat. */
function dailyItem(key = dayKey()) {
  let hash = 2166136261;
  for (const ch of key) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  const all = Object.keys(BANK).flatMap((c) => [1, 2, 3, 4].flatMap((l) => BANK[c][l].map((text) => ({ text, cat: c, level: l }))));
  return all[(hash >>> 0) % all.length];
}

function showDaily() {
  const entry = makeEntry(dailyItem(), '', 'harian');
  const d = new Date();
  entry.dateLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  show(entry, true);
  notify('Alasan ini berlaku sampai tengah malam.');
}

/* ---------- Tampilan ---------- */

function show(entry, animate) {
  current = entry;
  const el = $('#excuse');
  el.textContent = entry.text;
  el.classList.toggle('long', entry.text.length > 92);
  $('#cardLabel').textContent = entry.kind === 'harian' ? `Alasan hari ini, ${entry.dateLabel}` : `Alasan No. ${String(entry.no || 0).padStart(3, '0')}`;
  $('#cardMeta').textContent = `${CATEGORIES[entry.cat]} / ${LEVELS[entry.level]}`;
  syncFav();
  if (animate) {
    const stamp = $('#stamp');
    [el, stamp].forEach((n) => n.classList.remove('fresh', 'slam'));
    void el.offsetWidth;
    el.classList.add('fresh');
    stamp.classList.add('slam');
  }
}

function notify(text) { $('#notice').textContent = text; }

function isFav(text) { return S.favorites.some((f) => f.text === text); }
function syncFav() {
  const on = current && isFav(current.text);
  const btn = $('#favBtn');
  btn.setAttribute('aria-pressed', String(!!on));
  btn.textContent = on ? 'Tersimpan di favorit' : 'Simpan ke favorit';
}

function toggleFavorite(entry) {
  if (isFav(entry.text)) {
    S.favorites = S.favorites.filter((f) => f.text !== entry.text);
    notify('Dihapus dari favorit. Alasan ini tidak akan melupakanmu.');
  } else {
    S.favorites.unshift({ id: entry.id, no: entry.no, text: entry.text, cat: entry.cat, level: entry.level, t: Date.now() });
    notify('Disimpan untuk keadaan darurat.');
  }
  syncFav();
  renderFavorites();
  renderHistory();
  save();
}

function entryRow(entry, extra) {
  const li = document.createElement('li');
  li.append(entry.text);
  const tags = document.createElement('span');
  tags.className = 'tags';
  tags.textContent = `${CATEGORIES[entry.cat]} / ${LEVELS[entry.level]}`;
  li.appendChild(tags);
  const row = document.createElement('div');
  row.className = 'row-actions';
  const addBtn = (label, fn) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mini';
    b.textContent = label;
    b.addEventListener('click', fn);
    row.appendChild(b);
  };
  addBtn('Tampilkan', () => {
    show(entry, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  addBtn('Salin', () => copyText(entry.text));
  extra(addBtn);
  li.appendChild(row);
  return li;
}

function renderFavorites() {
  const pane = $('#pane-fav');
  pane.textContent = '';
  $('#favCount').textContent = S.favorites.length ? `(${S.favorites.length})` : '';
  if (!S.favorites.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'Belum ada favorit. Alasan terbaik selalu datang saat dibutuhkan.';
    pane.appendChild(p);
    return;
  }
  const ul = document.createElement('ul');
  S.favorites.forEach((f) => ul.appendChild(entryRow(f, (add) => add('Hapus', () => toggleFavorite(f)))));
  pane.appendChild(ul);
}

function renderHistory() {
  const pane = $('#pane-his');
  pane.textContent = '';
  if (!S.history.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'Riwayatmu masih bersih. Tidak akan lama.';
    pane.appendChild(p);
    return;
  }
  const ul = document.createElement('ul');
  S.history.forEach((h) => ul.appendChild(entryRow(h, (add) => add(isFav(h.text) ? 'Lepas favorit' : 'Favorit', () => toggleFavorite(h)))));
  pane.appendChild(ul);
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'mini clear';
  clear.textContent = 'Hapus riwayat';
  clear.addEventListener('click', () => {
    S.history = [];
    renderHistory();
    save();
    notify('Riwayat dihapus. Tidak ada bukti.');
  });
  pane.appendChild(clear);
}

function renderTally() {
  $('#statCount').textContent = S.count.toLocaleString('id-ID');
  const mins = S.count * 15;
  $('#statSaved').textContent = mins < 60 ? `${mins} menit` : `${Math.floor(mins / 60).toLocaleString('id-ID')} jam ${mins % 60 ? `${mins % 60} menit` : ''}`.trim();
}

function renderChips(boxSel, options, currentKey, onPick) {
  const box = $(boxSel);
  box.textContent = '';
  box.setAttribute('role', 'radiogroup');
  options.forEach(([key, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(key === currentKey));
    b.textContent = label;
    b.addEventListener('click', () => onPick(key));
    box.appendChild(b);
  });
}
function renderControls() {
  renderChips('#catChips', [['semua', 'Semua'], ...Object.entries(CATEGORIES)], S.cat, (k) => {
    S.cat = k;
    renderControls();
    save();
  });
  renderChips('#themeChips', Object.entries(THEMES), S.theme, (k) => {
    S.theme = k;
    $('#card').dataset.theme = k;
    renderControls();
    save();
  });
  $('#level').value = S.level;
  $('#level').setAttribute('aria-valuetext', LEVELS[S.level]);
  $('#levelName').textContent = LEVELS[S.level];
  $('#card').dataset.theme = S.theme;
}

/* ---------- Salin dan bagikan ---------- */

async function copyText(text) {
  try {
    if (!navigator.clipboard) throw new Error('tidak ada clipboard');
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    area.remove();
    if (!ok) { notify('Gagal menyalin. Browser ini lebih jujur dari kamu.'); return; }
  }
  notify(COPY_LINES[Math.floor(Math.random() * COPY_LINES.length)]);
}

const CARD_STYLES = {
  poster: { bg: '#ff4b2b', ink: '#ffffff', sub: '#ffe2d6', stamp: '#ffd23f', font: '900 F "Arial Black", Arial, sans-serif' },
  resmi:  { bg: '#fff7e3', ink: '#161514', sub: '#5c5548', stamp: '#c6281a', font: 'F Georgia, "Times New Roman", serif' },
  nota:   { bg: '#fff27a', ink: '#2b2507', sub: '#6d6216', stamp: '#2340e8', font: 'F "Comic Sans MS", "Marker Felt", cursive' },
  kosmik: { bg: '#10124a', ink: '#b7ff5e', sub: '#a3a8ff', stamp: '#ff6bd3', font: '900 F "Arial Black", Arial, sans-serif' }
};

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  text.split(' ').forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

/* Kartu 1080x1080 digambar di canvas agar bisa diunduh sebagai PNG. */
function renderShareCard(entry) {
  const size = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const st = CARD_STYLES[S.theme];
  const pad = 84;
  ctx.fillStyle = st.bg;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = st.sub;
  ctx.font = '700 30px Helvetica, Arial, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${CATEGORIES[entry.cat]} / ${LEVELS[entry.level]}`, pad, 110);

  // Ukuran huruf diturunkan sampai seluruh alasan muat.
  let fontSize = 92, lines = [];
  const available = size - 110 - 250;
  do {
    ctx.font = st.font.replace('F', `${fontSize}px`);
    lines = wrapText(ctx, entry.text, size - pad * 2);
    if (lines.length * fontSize * 1.14 <= available) break;
    fontSize -= 4;
  } while (fontSize > 34);
  ctx.fillStyle = st.ink;
  const blockH = lines.length * fontSize * 1.14;
  let y = 150 + (available - blockH) / 2 + fontSize;
  lines.forEach((l) => {
    ctx.fillText(l, pad, y);
    y += fontSize * 1.14;
  });

  ctx.fillStyle = st.sub;
  ctx.font = '700 28px Helvetica, Arial, sans-serif';
  ctx.fillText('Dikeluarkan oleh Kantor Alasan Nasional', pad, size - 84);

  ctx.save();
  ctx.translate(size - 170, size - 118);
  ctx.rotate(-11 * Math.PI / 180);
  ctx.strokeStyle = st.stamp;
  ctx.lineWidth = 9;
  ctx.strokeRect(-92, -48, 184, 96);
  ctx.fillStyle = st.stamp;
  ctx.font = '900 62px "Arial Black", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SAH', 0, 2);
  ctx.restore();
  return canvas;
}

function shareCard() {
  if (!current) return;
  const canvas = renderShareCard(current);
  canvas.toBlob(async (blob) => {
    if (!blob) { notify('Kartu gagal dibuat. Alasan yang bagus, sebenarnya.'); return; }
    const file = new File([blob], 'alasan-tidak-produktif.png', { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: current.text });
        notify('Terkirim. Alasanmu kini menjadi urusan orang lain.');
        return;
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Kartu diunduh. Gunakan dengan tanggung jawab yang wajar.');
  }, 'image/png');
}

/* ---------- Penyalaan ---------- */

function selectTab(name) {
  ['fav', 'his'].forEach((k) => {
    $(`#tab-${k}`).setAttribute('aria-selected', String(k === name));
    $(`#pane-${k}`).hidden = k !== name;
  });
}

function setup() {
  renderControls();
  renderFavorites();
  renderHistory();
  renderTally();

  $('#generateBtn').addEventListener('click', generate);
  $('#copyBtn').addEventListener('click', () => { if (current) copyText(current.text); });
  $('#favBtn').addEventListener('click', () => { if (current) toggleFavorite(current); });
  $('#shareBtn').addEventListener('click', shareCard);
  $('#dailyBtn').addEventListener('click', showDaily);
  $('#tab-fav').addEventListener('click', () => selectTab('fav'));
  $('#tab-his').addEventListener('click', () => selectTab('his'));
  $('#level').addEventListener('input', (ev) => {
    S.level = Number(ev.target.value);
    renderControls();
    save();
  });
  $('#activity').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); generate(); }
  });

  // Kartu pembuka memakai alasan harian dan tidak menambah hitungan.
  const entry = makeEntry(dailyItem(), '', 'harian');
  entry.dateLabel = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  show(entry, false);
}

setup();
