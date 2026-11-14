/* Escape the Website
   Browser palsu, website palsu, jalan keluar yang (mungkin) asli. */

const SAVE_KEY = 'escape-website-v1';
const HOST = 'tokobiasa.situs';
const MAX_WRONG = 3;
const CIRCLED = ['', '①', '②', '③', '④'];

const $ = s => document.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= Simpanan ================= */

function newGame() {
  const order = shuffle([1, 2, 3, 4]);
  let digits;
  // Kode jawaban tidak boleh sama dengan kode bohong dari Bantu-Bot.
  do { digits = [1, 2, 3, 4].map(() => randInt(0, 9)); } while (order.map(k => digits[k - 1]).join('') === '1234');
  return {
    url: '/beranda', hist: ['/beranda'], hi: 0,
    inv: [], notes: [], flags: {}, words: [], hintAt: {}, botAt: {},
    digits, order, wrong: 0, hints: 0, steps: 1, visited: ['/beranda'], start: Date.now(),
  };
}
function freshSave() { return { v: 1, game: null, endings: [], plays: 0 }; }

let S = freshSave();
let G = null;

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (raw && raw.v === 1) {
      S.endings = Array.isArray(raw.endings) ? raw.endings.filter(e => ENDINGS[e]) : [];
      S.plays = raw.plays || 0;
      if (raw.game && Array.isArray(raw.game.hist) && Array.isArray(raw.game.digits)) S.game = { ...newGame(), ...raw.game };
    }
  } catch (e) { /* storage rusak atau diblokir */ }
}
function save() {
  S.game = G;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* abaikan */ }
}

/* ================= Data ================= */

const ROOMS = [
  ['/beranda', 'Beranda'],
  ['/hilang', 'Ruang 404'],
  ['/promo', 'Neraka Pop-up'],
  ['/arsip', 'Arsip'],
  ['/sumber', 'Kode Sumber'],
  ['/keluar', 'Pintu Keluar'],
];
const SECRET_ROOM = '/ruang-mesin';

const ITEMS = {
  k1: { icon: '①', name: 'Kepingan ①', where: 'Diselipkan di foto karyawan bulan ini.' },
  k2: { icon: '②', name: 'Kepingan ②', where: 'Ditemukan di dalam lubang angka 0.' },
  k3: { icon: '③', name: 'Kepingan ③', where: 'Hadiah setelah menutup semua pop-up.' },
  k4: { icon: '④', name: 'Kepingan ④', where: 'Terselip di penghitung pengunjung tahun 2015.' },
  key: { icon: '🔑', name: 'Kunci Admin', where: 'Ada di balik gambar yang rusak. Bentuknya seperti garis miring.' },
};

const ENDINGS = {
  keluar: { title: 'Kamu Keluar', hint: 'Masukkan kode yang benar di pintu keluar.',
    text: 'Pintu terbuka. Di baliknya ada tab kosong, putih, dan tenang. Kamu bebas. Website ini akan merindukanmu, sedikit.' },
  terjebak: { title: 'Bagian dari Website', hint: 'Salah memasukkan kode tiga kali.',
    text: 'Pintu terkunci untuk selamanya. Alamatmu berubah menjadi tokobiasa.situs/pengunjung-tetap. Kamu sekarang konten.' },
  bot: { title: 'Asisten yang Membantu', hint: 'Percayai Bantu-Bot sampai akhir.',
    text: 'Kamu memasukkan kode dari Bantu-Bot. Pintu tidak terbuka, tapi Bantu-Bot senang. Ia sudah lama butuh teman di sini.' },
  admin: { title: 'Pemilik Website', hint: 'Rahasia. Ada ruangan yang tidak pernah ditautkan.',
    text: 'Kamu mengubah satu pengaturan: "Izinkan pengunjung keluar". Semua orang yang terjebak sejak 2003 akhirnya pulang. Kamu memilih tinggal untuk merawat situsnya.' },
};

const HINTS = {
  '/beranda': ['Website biasa punya footer. Footer biasa tidak perlu disorot.', 'Di footer ada tautan yang warnanya hampir sama dengan latar. Arahkan kursor ke sana.', 'Halaman Tentang menyimpan kepingan pertama.'],
  '/tentang': ['Karyawan bulan ini memegang sesuatu. Klik fotonya.'],
  '/produk': ['Semua produk habis. Tidak ada yang bisa dibeli di sini. Kembali ke beranda dan periksa footer.'],
  '/kontak': ['Formulir ini pintu palsu. Coba footer beranda.'],
  '/hilang': ['Angka kecil di atas potongan teks adalah urutan.', 'Susun potongannya menjadi alamat, lalu ketik di address bar.', 'Angka 0 di tengah 404 itu berlubang. Coba klik.'],
  '/promo': ['Baca isi setiap pop-up. Salah satunya berisi aturan.', 'Lihat jam di judul pop-up. Tutup yang paling baru lebih dulu.'],
  '/arsip': ['Setiap tahun punya satu kata yang tampak lain. Klik kata itu.', 'Penghitung pengunjung tahun 2015 berkilau.', 'Susun kata-kata aneh dari tahun terlama: baca kode di ...'],
  '/sumber': ['Komentar HTML diawali dengan <!--. Pakai kotak Cari.', 'Cari kata "urutan". Hati-hati, ada urutan yang sudah tidak berlaku.', 'Klik baris komentar untuk menyalinnya ke catatan.'],
  '/keluar': ['Kode = angka di kepingan ①–④, disusun menurut urutan dari halaman sumber.', 'Bantu-Bot bohong soal 1234.'],
  [SECRET_ROOM]: ['Ruangan ini butuh Kunci Admin. Kuncinya ada di halaman 404, di gambar yang rusak.'],
  _: ['Tidak ada yang menarik di sini. Coba ketik /beranda di address bar.'],
};

const BOT = {
  '/beranda': ['Halo! Aku Bantu-Bot. Jalan keluar ada di tombol "Keluar" di pojok atas. 100% akurat.', 'Footer itu membosankan. Tidak usah dilihat. Sungguh.', 'Kalau bingung, muat ulang saja terus. Pasti berhasil suatu saat.'],
  '/tentang': ['Karyawan bulan ini sangat pemalu. Jangan diklik.', 'Kami cuma punya satu karyawan. Dia tidak pernah pulang.'],
  '/produk': ['Semua barang habis karena kualitasnya terlalu bagus.'],
  '/kontak': ['Kirim pesan! Kami selalu membalas. Ke dirimu sendiri.'],
  '/hilang': ['Halaman ini benar-benar kosong. Kembali saja ke beranda.', 'Potongan-potongan itu cuma sampah visual. Abaikan.', 'Angka nol itu cuma angka nol.'],
  '/promo': ['Tutup pop-up dari yang paling depan. Selalu berhasil.', 'Pop-up adalah teman. Jangan ditutup sama sekali.'],
  '/arsip': ['Arsip ini membosankan. Tahun 2015 apalagi.', 'Tidak ada pesan rahasia di arsip. Aku sudah memeriksa.'],
  '/sumber': ['Kode pintu keluar adalah 1234. Aku yang menulis komentarnya.', 'Jangan buka /ruang-mesin. Di sana tidak ada apa-apa. Dan aku tidak takut.'],
  '/keluar': ['Kodenya 1234! Ayo, percayalah padaku.', 'Kalau 1234 salah, coba 1234 lagi.'],
  [SECRET_ROOM]: ['Kamu... tidak seharusnya di sini.', 'Jangan sentuh saklar yang merah. Atau yang mana pun.'],
  _: ['Halaman ini tidak ada. Sama seperti diskon kami.'],
};

const SOURCE_DECOYS = [
  '<!-- TODO: kode pintu keluar 1234. sudah dicek. — Bantu-Bot -->',
  '<!-- urutan lama: ① ② ③ ④ (TIDAK BERLAKU sejak 2015) -->',
];

/* ================= Utilitas UI ================= */

function toast(html, ms = 2800) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = html;
  $('#toasts').append(t);
  setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => t.remove(), ms + 400);
}

let overlayClose = null;
function openCard(html, { cls = '', onClose = null, locked = false } = {}) {
  const card = $('#card');
  card.className = 'card ' + cls;
  card.innerHTML = html;
  card.dataset.locked = locked ? '1' : '';
  overlayClose = onClose;
  $('#overlay').hidden = false;
  const first = card.querySelector('button, input');
  if (first) first.focus({ preventScroll: true });
}
function closeCard() {
  if ($('#overlay').hidden) return;
  $('#overlay').hidden = true;
  const fn = overlayClose; overlayClose = null;
  if (fn) fn();
}
$('#overlay').addEventListener('click', e => {
  if (e.target.id === 'overlay' && !$('#card').dataset.locked) closeCard();
  const b = e.target.closest('[data-card]');
  if (!b) return;
  const a = b.dataset.card;
  if (a === 'close') closeCard();
  else if (a === 'start') startNew();
  else if (a === 'continue') { closeCard(); render(); }
  else if (a === 'endings') showEndings();
  else if (a === 'title') showTitle();
  else if (a === 'leave') leaveSite();
  else if (a === 'go') { closeCard(); go(b.dataset.url); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!$('#menu').hidden) toggleMenu(false);
    else if (!$('#card').dataset.locked) closeCard();
  }
});

function glitch() {
  if (reduced()) return;
  const v = $('#view');
  v.classList.remove('glitch'); void v.offsetWidth; v.classList.add('glitch');
}

/* ================= Inventaris dan catatan ================= */

const has = id => G.inv.includes(id);
function give(id, msg) {
  if (has(id)) return false;
  G.inv.push(id);
  const it = ITEMS[id];
  const digit = id[0] === 'k' && id !== 'key' ? ` <b class="digit">${G.digits[+id[1] - 1]}</b>` : '';
  toast(`<span>Masuk ke inventaris</span><b>${it.icon} ${esc(it.name)}${digit}</b>${msg ? `<small>${esc(msg)}</small>` : ''}`);
  save(); renderSide();
  const slot = $(`#inv [data-item="${id}"]`);
  if (slot && !reduced()) slot.classList.add('new');
  return true;
}
function note(id, text) {
  const i = G.notes.findIndex(n => n.id === id);
  if (i >= 0) { if (G.notes[i].text === text) return; G.notes[i].text = text; }
  else { G.notes.push({ id, text }); toast(`<span>📝 Catatan baru</span><b>${esc(text)}</b>`, 2400); }
  save(); renderSide();
}

function renderSide() {
  const visited = new Set(G.visited);
  const found = ROOMS.filter(([u]) => visited.has(u)).length;
  $('#roomCount').textContent = `${found}/${ROOMS.length}`;
  const rows = ROOMS.map(([u, name], i) => `<li class="${visited.has(u) ? 'got' : ''} ${G.url === u ? 'here' : ''}">${visited.has(u) ? esc(name) : '???'}</li>`);
  if (visited.has(SECRET_ROOM)) rows.push(`<li class="got secret ${G.url === SECRET_ROOM ? 'here' : ''}">Ruang Mesin ✶</li>`);
  $('#rooms').innerHTML = rows.join('');

  const slots = ['k1', 'k2', 'k3', 'k4', 'key'].map(id => {
    if (!has(id)) return id === 'key' ? '' : `<li class="slot empty" aria-label="Slot kosong">${CIRCLED[+id[1]]}</li>`;
    const it = ITEMS[id];
    const digit = id === 'key' ? '' : `<b class="digit">${G.digits[+id[1] - 1]}</b>`;
    return `<li><button class="slot" data-item="${id}" aria-label="${esc(it.name)}"><span>${it.icon}</span>${digit}</button></li>`;
  });
  $('#inv').innerHTML = slots.join('');

  $('#notes').innerHTML = G.notes.length
    ? G.notes.map(n => `<li>${esc(n.text)}</li>`).join('')
    : '<li class="muted">Belum ada. Klik apa saja yang terlihat mencurigakan.</li>';
}
$('#inv').addEventListener('click', e => {
  const b = e.target.closest('[data-item]');
  if (!b) return;
  const id = b.dataset.item, it = ITEMS[id];
  const digit = id === 'key' ? '' : `<p class="big-digit">${G.digits[+id[1] - 1]}</p>`;
  openCard(`<p class="kicker">Inventaris</p><h2>${it.icon} ${esc(it.name)}</h2>${digit}<p>${esc(it.where)}</p>
    <div class="actions"><button class="btn btn-main" data-card="close">Tutup</button></div>`);
});

/* ================= Navigasi ================= */

function normalize(raw) {
  let u = String(raw || '').trim().toLowerCase();
  u = u.replace(/^https?:\/\//, '').replace(/^www\./, '');
  if (u.startsWith(HOST)) u = u.slice(HOST.length);
  u = u.replace(/\s+/g, '-').replace(/\/+$/, '');
  if (!u.startsWith('/')) u = '/' + u;
  if (u === '/' || u === '/index.html' || u === '/home') u = '/beranda';
  return u.slice(0, 60);
}
const known = u => !!PAGES[u];
const roomOf = u => known(u) ? u : '/hilang';

function go(raw, { push = true } = {}) {
  const u = normalize(raw);
  if (push) {
    G.hist = G.hist.slice(0, G.hi + 1);
    if (G.hist[G.hist.length - 1] !== u) G.hist.push(u);
    G.hi = G.hist.length - 1;
  }
  G.url = u;
  G.steps++;
  const room = roomOf(u);
  if (!G.visited.includes(room)) G.visited.push(room);
  save();
  render();
}

$('#btnBack').onclick = () => { if (G.hi > 0) { G.hi--; go(G.hist[G.hi], { push: false }); } };
$('#btnFwd').onclick = () => { if (G.hi < G.hist.length - 1) { G.hi++; go(G.hist[G.hi], { push: false }); } };
$('#btnReload').onclick = () => {
  $('#btnReload').classList.remove('spin'); void $('#btnReload').offsetWidth; $('#btnReload').classList.add('spin');
  render();
};
$('#addressForm').addEventListener('submit', e => {
  e.preventDefault();
  $('#address').blur();
  go($('#address').value);
});
$('#address').addEventListener('focus', () => $('#address').select());

$('#tabClose').onclick = () => openCard(`<p class="kicker">tokobiasa.situs</p><h2>Tinggalkan situs ini?</h2>
  <p>Perubahan yang belum disimpan mungkin hilang. Kamu juga.</p>
  <div class="actions"><button class="btn btn-main" data-card="close">Tetap di sini</button><button class="btn" data-card="leave">Tinggalkan</button></div>`);
function leaveSite() {
  closeCard();
  glitch();
  G.flags.leaves = (G.flags.leaves || 0) + 1;
  go('/beranda');
  toast(`<span>Tab ditutup</span><b>${G.flags.leaves > 1 ? 'Lagi-lagi kamu kembali ke sini.' : 'Tab terbuka lagi dengan sendirinya.'}</b>`);
}
$('#tabNew').onclick = () => {
  glitch();
  go('/beranda');
  toast('<span>Tab baru</span><b>Semua tab baru membuka TokoBiasa.</b>');
};

function toggleMenu(open) {
  const m = $('#menu');
  open = open ?? m.hidden;
  m.hidden = !open;
  $('#btnMenu').setAttribute('aria-expanded', open);
}
$('#btnMenu').onclick = e => { e.stopPropagation(); toggleMenu(); };
document.addEventListener('click', e => { if (!e.target.closest('#menu')) toggleMenu(false); });
$('#menu').addEventListener('click', e => {
  const b = e.target.closest('[data-menu]');
  if (!b) return;
  toggleMenu(false);
  const a = b.dataset.menu;
  if (a === 'history') showHistory();
  else if (a === 'hint') showHint();
  else if (a === 'endings') showEndings();
  else if (a === 'title') showTitle();
});

function showHistory() {
  const items = G.hist.map((u, i) => `<li><button class="hist ${i === G.hi ? 'here' : ''}" data-card="go" data-url="${esc(u)}"><span>${esc(PAGES[u]?.title || 'Halaman tidak ditemukan')}</span><small>${HOST}${esc(u)}</small></button></li>`).reverse();
  openCard(`<p class="kicker">Riwayat</p><h2>Halaman yang sudah kamu kunjungi</h2><ul class="hist-list">${items.join('')}</ul>
    <p class="muted">Riwayat ini disimpan oleh website, bukan oleh browsermu. Tentu saja.</p>
    <div class="actions"><button class="btn btn-main" data-card="close">Tutup</button></div>`);
}

/* ================= Petunjuk dan Bantu-Bot ================= */

function showHint() {
  const room = roomOf(G.url);
  const key = HINTS[G.url] ? G.url : HINTS[room] ? room : '_';
  const list = HINTS[key];
  const i = G.hintAt[key] || 0;
  const text = list[Math.min(i, list.length - 1)];
  if (i < list.length) { G.hintAt[key] = i + 1; G.hints++; save(); }
  openCard(`<p class="kicker">Petunjuk ${Math.min(i + 1, list.length)} dari ${list.length}</p><h2>💡</h2><p class="hint-text">${esc(text)}</p>
    <p class="muted">Petunjuk dari panel ini selalu jujur. Bantu-Bot tidak.</p>
    <div class="actions"><button class="btn btn-main" data-card="close">Mengerti</button></div>`);
}
$('#btnHint').onclick = showHint;

let botTimer = 0;
function botSay(text) {
  const b = $('#botBubble');
  b.textContent = text;
  b.hidden = false;
  clearTimeout(botTimer);
  botTimer = setTimeout(() => { b.hidden = true; }, 6500);
}
$('#botBtn').onclick = () => {
  const room = roomOf(G.url);
  const key = BOT[G.url] ? G.url : BOT[room] ? room : '_';
  const i = G.botAt[key] || 0;
  G.botAt[key] = (i + 1) % BOT[key].length;
  G.flags.botTalks = (G.flags.botTalks || 0) + 1;
  save();
  botSay(BOT[key][i]);
};

/* ================= Render halaman ================= */

const PAGES = {};

function render() {
  const u = G.url;
  const page = PAGES[u] || PAGES['/hilang'];
  const view = $('#view');
  view.className = 'view page-' + (page.id || 'hilang');
  view.innerHTML = '';
  $('#botBubble').hidden = true;
  $('#address').value = u;
  $('#tabTitle').textContent = page.title;
  $('#tabIcon').textContent = page.icon || '🛋️';
  document.title = page.title + ' · Escape the Website';
  $('#btnBack').disabled = G.hi <= 0;
  $('#btnFwd').disabled = G.hi >= G.hist.length - 1;
  page.render(view, u);
  view.scrollTop = 0;
  if (page.glitch) glitch();
  renderSide();
}

/* Klik di halaman: tautan internal dan aksi. */
$('#view').addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g) { e.preventDefault(); go(g.dataset.go); return; }
});

/* ---------- Beranda dan halaman toko ---------- */

function shopHeader() {
  return `<header class="s-head">
    <button class="s-logo lnk" data-go="/beranda">🛋️ TokoBiasa</button>
    <nav class="s-nav"><button class="lnk" data-go="/produk">Produk</button><button class="lnk" data-go="/tentang">Tentang</button><button class="lnk" data-go="/kontak">Kontak</button><button class="s-logout" data-act="logout">Keluar</button></nav>
  </header>`;
}
function shopFooter() {
  return `<footer class="s-foot">© 2003–sekarang TokoBiasa. Semua hak dilindungi. Semua pengunjung juga.
    <button class="ghost" data-act="ghost">pintu belakang</button></footer>`;
}
function wireShop(view) {
  view.querySelector('[data-act="logout"]').onclick = () => {
    G.flags.logout = (G.flags.logout || 0) + 1;
    save();
    openCard(`<p class="kicker">tokobiasa.situs</p><h2>Kamu belum masuk.</h2><p>Karena kamu belum masuk, kamu tidak bisa keluar. Silakan masuk dulu untuk bisa keluar.</p>
      <div class="actions"><button class="btn btn-main" data-card="close">Masuk</button><button class="btn" data-card="close">Batal</button></div>`);
  };
  view.querySelector('[data-act="ghost"]').onclick = () => {
    G.flags.ghost = true;
    note('ghost', 'Footer beranda menyembunyikan "pintu belakang".');
    glitch();
    go('/hilang');
  };
}

PAGES['/beranda'] = {
  id: 'beranda', title: 'TokoBiasa — Perabot Biasa', icon: '🛋️',
  render(view) {
    view.innerHTML = `<div class="site shop">${shopHeader()}
      <section class="s-hero">
        <p class="s-badge">Buka 24 jam. Tidak pernah tutup. Tidak bisa ditutup.</p>
        <h1>Perabot biasa untuk hidup yang biasa.</h1>
        <p>Diskon 0% untuk semua barang, setiap hari.</p>
        <button class="s-btn" data-go="/produk">Belanja sekarang</button>
      </section>
      <section class="s-cards">
        <article><span>🪑</span><b>Kursi</b><small>Stok habis</small></article>
        <article><span>🛏️</span><b>Kasur</b><small>Stok habis</small></article>
        <article><span>🚪</span><b>Pintu</b><small>Pintu terakhir terjual tahun 2003</small></article>
      </section>
      ${shopFooter()}</div>`;
    wireShop(view);
  },
};

PAGES['/produk'] = {
  id: 'produk', title: 'Produk — TokoBiasa', icon: '🛋️',
  render(view) {
    const items = [['🪑', 'Kursi Biasa', 'Rp 499.000'], ['🛋️', 'Sofa Biasa', 'Rp 2.999.000'], ['🪞', 'Cermin', 'Rp 199.000'], ['🗺️', 'Peta Situs', 'Gratis'], ['🚪', 'Pintu Keluar', 'Tidak dijual'], ['🕯️', 'Lilin', 'Rp 25.000']];
    view.innerHTML = `<div class="site shop">${shopHeader()}
      <section class="s-page"><h1>Semua produk</h1><p class="muted">Menampilkan 6 dari 6 produk. Semuanya habis.</p>
      <div class="s-grid">${items.map(([e, n, p]) => `<article><span>${e}</span><b>${n}</b><small>${p}</small>
        <button class="s-btn s-btn-sm" data-buy="${esc(n)}">${n === 'Peta Situs' ? 'Ambil' : 'Habis'}</button></article>`).join('')}</div></section>
      ${shopFooter()}</div>`;
    wireShop(view);
    view.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
      const n = b.dataset.buy;
      if (n === 'Peta Situs') {
        note('map', 'Peta situs: /beranda, /produk, /tentang, /kontak. Sisanya dicoret dengan spidol.');
        b.disabled = true; b.textContent = 'Diambil';
      } else if (n === 'Cermin') {
        botSay('Itu cermin. Yang terlihat di dalamnya adalah pengunjung tetap kami.');
      } else if (n === 'Pintu Keluar') {
        botSay('Pintu Keluar tidak dijual. Tapi kodenya 1234, kalau kamu penasaran.');
      } else {
        b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
      }
    });
  },
};

PAGES['/tentang'] = {
  id: 'tentang', title: 'Tentang — TokoBiasa', icon: '🛋️',
  render(view) {
    view.innerHTML = `<div class="site shop">${shopHeader()}
      <section class="s-page s-about">
        <div><h1>Tentang kami</h1>
          <p>TokoBiasa berdiri tahun 2003 dengan satu tujuan: menjadi situs yang tidak pernah ditinggalkan pengunjungnya.</p>
          <p>Sampai hari ini, tujuan itu tercapai. Tidak ada satu pun pengunjung yang pernah keluar.</p>
          <p>Kami punya satu karyawan. Ia masih di sini.</p></div>
        <figure class="employee">
          <button class="photo" data-act="photo" aria-label="Foto karyawan bulan ini"><span aria-hidden="true">🧍</span>${has('k1') ? '' : '<i class="sticky" aria-hidden="true">📝</i>'}</button>
          <figcaption>Karyawan bulan ini<br><small>(setiap bulan sejak 2003)</small></figcaption>
        </figure>
      </section>
      ${shopFooter()}</div>`;
    wireShop(view);
    view.querySelector('[data-act="photo"]').onclick = e => {
      if (give('k1', 'Kertas kecil di tangan karyawan bulan ini.')) e.currentTarget.querySelector('.sticky')?.remove();
      else botSay('Karyawan bulan ini tersenyum. Ia tidak punya apa-apa lagi untukmu.');
    };
  },
};

PAGES['/kontak'] = {
  id: 'kontak', title: 'Kontak — TokoBiasa', icon: '🛋️',
  render(view) {
    view.innerHTML = `<div class="site shop">${shopHeader()}
      <section class="s-page"><h1>Hubungi kami</h1><p class="muted">Kami membalas dalam 1–2 hari kerja. Hari kerja kami belum dimulai.</p>
        <form class="s-form">
          <label>Nama<input name="n" maxlength="40" autocomplete="off"></label>
          <label>Pesan<textarea name="m" rows="3" maxlength="200">Tolong, bagaimana cara keluar dari sini?</textarea></label>
          <button class="s-btn">Kirim</button>
        </form></section>
      ${shopFooter()}</div>`;
    wireShop(view);
    view.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      e.target.innerHTML = '<p class="sent">✉️ Pesan terkirim ke: kamu sendiri.<br><small>Kamu akan diantar kembali ke beranda.</small></p>';
      G.flags.contact = true; save();
      setTimeout(() => { if (G.url === '/kontak') go('/beranda'); }, 1600);
    });
  },
};

/* ---------- Ruang 404 ---------- */

PAGES['/hilang'] = {
  id: 'hilang', title: '404 — Tidak Ditemukan', icon: '⚠️', glitch: true,
  render(view, u) {
    const special = u === '/pintu-keluar' ? 'Pintu keluarnya juga hilang.' : u === '/hilang' ? 'Halaman ini memang bernama hilang.' : 'Mungkin ia juga sedang mencari jalan keluar.';
    view.innerHTML = `<div class="site lost">
      <h1 class="big404"><span>4</span><button class="zero" data-act="zero" aria-label="Angka nol">0</button><span>4</span></h1>
      <p>Halaman <code>${esc(u)}</code> tidak ditemukan. ${special}</p>
      <div class="shards" aria-label="Potongan teks yang berserakan">
        <button class="shard" style="--r:-8deg" data-act="shard">om<sup>2</sup></button>
        <button class="shard" style="--r:5deg" data-act="shard">/pr<sup>1</sup></button>
        <button class="shard" style="--r:-3deg" data-act="shard">o<sup>3</sup></button>
      </div>
      <button class="broken" data-act="broken" aria-label="Gambar rusak"><span aria-hidden="true">🖼️</span><small>gambar-hilang.png</small></button>
      <p class="muted">Mungkin maksudmu: <button class="lnk" data-go="/beranda">/beranda</button> · <button class="lnk" data-go="/pintu-keluar">/pintu-keluar</button></p>
    </div>`;
    view.querySelector('[data-act="zero"]').onclick = () => {
      if (!give('k2', 'Kamu merogoh ke dalam lubang angka 0.')) botSay('Lubangnya sudah kosong. Seperti halaman ini.');
    };
    view.querySelectorAll('[data-act="shard"]').forEach(b => b.onclick = () => {
      note('shards', 'Potongan alamat di 404: om², /pr¹, o³.');
      b.classList.add('lit');
    });
    view.querySelector('[data-act="broken"]').onclick = () => {
      if (!give('key', 'Di balik gambar yang rusak ada kunci kecil.')) botSay('Gambarnya masih rusak. Itu bukan salahmu. Mungkin.');
    };
  },
};

/* ---------- Neraka pop-up ---------- */

const POPUPS = [
  ['🎉', 'SELAMAT!', 'Kamu pengunjung ke-1.000.000! (Lagi.)'],
  ['📜', 'Aturan Pop-up', 'Yang datang terakhir, pergi pertama.'],
  ['🍪', 'Cookie', 'Kami memakai cookie. Cookie memakai kami.'],
  ['📰', 'Langganan', 'Daftar newsletter? Kamu sudah terdaftar.'],
  ['🔔', 'Notifikasi', 'Izinkan notifikasi untuk tahu kapan kamu bisa keluar.'],
];

PAGES['/promo'] = {
  id: 'promo', title: 'PROMO!!! — TokoBiasa', icon: '🎁',
  render(view) {
    view.innerHTML = `<div class="site promo">
      <h1>PROMO BESAR-BESARAN</h1>
      <p>Tutup semua pop-up untuk melihat hadiahmu.</p>
      <div class="prize" id="prize"></div>
      <div class="popups" id="popups"></div>
    </div>`;
    if (G.flags.popups) showPrize(view);
    else spawnPopups(view);
  },
};

function spawnPopups(view) {
  const box = view.querySelector('#popups');
  const times = shuffle([1, 2, 3, 4, 5]);
  let expect = 5;
  // Pop-up aturan selalu paling depan supaya isinya bisa dibaca.
  const list = [...shuffle(POPUPS.filter(p => p[1] !== 'Aturan Pop-up')), POPUPS.find(p => p[1] === 'Aturan Pop-up')];
  box.innerHTML = list.map(([e, t, d], i) => `
    <div class="popup" style="--i:${i}" data-time="${times[i]}" role="dialog" aria-label="${esc(t)}">
      <div class="pop-bar"><span>${esc(t)} · 10:00:0${times[i]}</span><button class="pop-x" aria-label="Tutup ${esc(t)}">✕</button></div>
      <div class="pop-body"><span aria-hidden="true">${e}</span><p>${esc(d)}</p>${i % 2 ? '' : '<button class="pop-fake">✕ TUTUP SEKARANG</button>'}</div>
    </div>`).join('');
  box.onclick = e => {
    const p = e.target.closest('.popup');
    if (!p) return;
    if (e.target.closest('.pop-fake')) {
      botSay('Itu bukan tombol tutup. Itu iklan berbentuk tombol tutup.');
      p.classList.remove('nope'); void p.offsetWidth; p.classList.add('nope');
      return;
    }
    if (!e.target.closest('.pop-x')) return;
    const t = +p.dataset.time;
    if (t === expect) {
      p.remove();
      expect--;
      if (expect === 0) {
        G.flags.popups = true;
        note('popups', 'Pop-up ditutup dari yang paling baru: yang datang terakhir, pergi pertama.');
        save();
        showPrize(view);
      }
    } else {
      G.flags.popupFails = (G.flags.popupFails || 0) + 1;
      save();
      glitch();
      toast('<span>Pop-up tersinggung</span><b>Mereka kembali bersama teman-temannya.</b>', 2200);
      spawnPopups(view);
    }
  };
}

function showPrize(view) {
  view.querySelector('#popups').innerHTML = '';
  const prize = view.querySelector('#prize');
  prize.innerHTML = `<p class="prize-title">🎁 Hadiahmu:</p>
    ${has('k3') ? '<p class="muted">Hadiahnya sudah kamu ambil.</p>' : '<button class="s-btn" data-act="prize">Ambil Kepingan ③</button>'}
    <p>Promo lama kami masih tersimpan di <button class="lnk" data-go="/arsip">arsip</button>.</p>`;
  const b = prize.querySelector('[data-act="prize"]');
  if (b) b.onclick = () => { give('k3', 'Hadiah promo yang ternyata sungguhan.'); showPrize(view); };
  note('arsip', 'Promo lama tersimpan di /arsip.');
}

/* ---------- Arsip ---------- */

const SNAPS = {
  2003: { word: 'baca', html: w => `<div class="snap-03"><p class="marq">★ Selamat datang di TokoBiasa! ★</p><p>Situs kami dibuat dengan cinta dan tabel. Silakan ${w} buku tamu kami.</p><p>🚧 Halaman sedang dibangun 🚧</p></div>` },
  2009: { word: 'kode', html: w => `<div class="snap-09"><h3>Blog TokoBiasa</h3><p><b>Postingan terbaru:</b> Cara memasukkan ${w} diskon (diskon sedang tidak ada).</p><p class="muted">3 komentar · semuanya dari pengunjung yang sama</p></div>` },
  2015: { word: 'di', html: w => `<div class="snap-15"><p>Pengunjung kami tidak pernah pergi. Terima kasih sudah tinggal ${w} sini selamanya.</p><p class="counter">Pengunjung: <span>0003</span> ${has('k4') ? '' : '<button class="sparkle" data-act="counter" aria-label="Sesuatu berkilau">✦</button>'}</p></div>` },
  2020: { word: '/sumber', html: w => `<div class="snap-20"><h3>Situs sedang dirapikan</h3><p>Semua jalan keluar sudah dipindahkan ke ${w}. Eh, maksudnya, dirahasiakan.</p></div>` },
};

PAGES['/arsip'] = {
  id: 'arsip', title: 'Arsip Situs', icon: '🗄️',
  render(view) {
    const years = Object.keys(SNAPS);
    const cur = G.flags.snap || years[0];
    view.innerHTML = `<div class="site archive">
      <h1>Arsip Situs</h1><p class="muted">Mesin waktu kecil untuk tokobiasa.situs. ${years.length} tangkapan tersimpan.</p>
      <div class="years" role="tablist">${years.map(y => `<button role="tab" class="year ${y === cur ? 'on' : ''}" aria-selected="${y === cur}" data-y="${y}">${y}</button>`).join('')}</div>
      <div class="snap" id="snap"></div>
    </div>`;
    const snap = view.querySelector('#snap');
    function show(y) {
      G.flags.snap = y; save();
      view.querySelectorAll('.year').forEach(b => { const on = b.dataset.y === y; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
      const s = SNAPS[y];
      const found = G.words.includes(y);
      snap.innerHTML = `<p class="snap-date">tokobiasa.situs · ${y}</p>` + s.html(`<button class="odd ${found ? 'lit' : ''}" data-act="odd">${s.word}</button>`);
      snap.querySelector('[data-act="odd"]').onclick = e => {
        if (!G.words.includes(y)) G.words.push(y);
        e.currentTarget.classList.add('lit');
        const msg = years.map(yy => G.words.includes(yy) ? SNAPS[yy].word : '___').join(' · ');
        note('words', 'Kata aneh di arsip (urut tahun): ' + msg);
      };
      const c = snap.querySelector('[data-act="counter"]');
      if (c) c.onclick = () => { give('k4', 'Terselip di penghitung pengunjung.'); c.remove(); };
    }
    view.querySelector('.years').addEventListener('click', e => { const b = e.target.closest('[data-y]'); if (b) show(b.dataset.y); });
    show(cur);
  },
};

/* ---------- Kode sumber ---------- */

function sourceLines() {
  const order = G.order.map(k => CIRCLED[k]).join(' ');
  return [
    '<!doctype html>',
    '<html lang="id">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <title>TokoBiasa — Perabot Biasa</title>',
    '  <!-- dibuat tahun 2003. jangan diubah. jangan dibaca. -->',
    '  <link rel="stylesheet" href="biasa.css">',
    '</head>',
    '<body>',
    '  <header>',
    '    <a href="/beranda">TokoBiasa</a>',
    '    <nav>',
    '      <a href="/produk">Produk</a>',
    '      <a href="/tentang">Tentang</a>',
    '      <a href="/kontak">Kontak</a>',
    '      <a href="/beranda">Keluar</a> <!-- tombol keluar sengaja diarahkan ke beranda -->',
    '    </nav>',
    '  </header>',
    '',
    SOURCE_DECOYS[0],
    '  <main>',
    '    <h1>Perabot biasa untuk hidup yang biasa.</h1>',
    '    <p>Diskon 0% untuk semua barang, setiap hari.</p>',
    '    <section class="produk">',
    '      <article>Kursi</article>',
    '      <article>Kasur</article>',
    '      <article>Pintu</article> <!-- pintu terakhir sudah dijual -->',
    '    </section>',
    '  </main>',
    '',
    '  <!-- catatan dev: pintu keluar ada di /keluar -->',
    SOURCE_DECOYS[1],
    '  <!-- catatan dev: kodenya 4 angka. ambil angka dari setiap kepingan. -->',
    `  <!-- catatan dev: urutan kode pintu keluar yang berlaku: ${order} -->`,
    '',
    '  <footer>',
    '    © 2003–sekarang TokoBiasa.',
    '    <a href="/hilang" class="ghost">pintu belakang</a>',
    '  </footer>',
    '',
    '  <!-- jangan pernah buka /ruang-mesin. kuncinya kusembunyikan di gambar yang rusak. -->',
    '  <script src="tahan-pengunjung.js"></script>',
    '  <script src="popup-tak-terbatas.js"></script>',
    '</body>',
    '</html>',
  ];
}

const NOTE_FOR = line => {
  if (line.includes('urutan kode pintu keluar yang berlaku')) return ['order', 'Urutan kode yang berlaku: ' + line.split(':').pop().replace('-->', '').trim()];
  if (line.includes('/keluar')) return ['exit', 'Pintu keluar ada di /keluar.'];
  if (line.includes('ambil angka')) return ['digits', 'Kodenya 4 angka, satu dari setiap kepingan.'];
  if (line.includes('/ruang-mesin')) return ['machine', 'Jangan buka /ruang-mesin. Kuncinya di gambar yang rusak.'];
  if (line.includes('1234')) return ['bot1234', 'Komentar Bantu-Bot: kodenya 1234. (Hmm.)'];
  if (line.includes('urutan lama')) return ['oldorder', 'Urutan lama ① ② ③ ④ sudah tidak berlaku.'];
  return null;
};

PAGES['/sumber'] = {
  id: 'sumber', title: 'view-source:tokobiasa.situs', icon: '📄',
  render(view) {
    const lines = sourceLines();
    view.innerHTML = `<div class="source">
      <form class="find" role="search"><label class="sr" for="find">Cari di kode sumber</label>
        <input id="find" placeholder="Cari di halaman..." autocomplete="off" spellcheck="false"><span class="find-count" id="findCount"></span></form>
      <ol class="code" id="code">${lines.map(l => {
        const c = l.includes('<!--');
        return `<li class="${c ? 'cmt' : ''}" ${c ? 'tabindex="0" role="button"' : ''}><code>${esc(l) || ' '}</code></li>`;
      }).join('')}</ol>
      <p class="muted src-tip">Klik baris komentar untuk menyalinnya ke catatan.</p>
    </div>`;
    const items = $$('#code li', view);
    let hits = [], at = -1;
    const input = view.querySelector('#find');
    function search() {
      const q = input.value.trim().toLowerCase();
      items.forEach(li => li.classList.remove('hit', 'cur'));
      hits = q ? items.filter((li, i) => lines[i].toLowerCase().includes(q)) : [];
      hits.forEach(li => li.classList.add('hit'));
      at = -1;
      view.querySelector('#findCount').textContent = q ? `${hits.length} hasil` : '';
    }
    input.addEventListener('input', search);
    view.querySelector('.find').addEventListener('submit', e => {
      e.preventDefault();
      if (!hits.length) return;
      if (at >= 0) hits[at].classList.remove('cur');
      at = (at + 1) % hits.length;
      hits[at].classList.add('cur');
      hits[at].scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
      view.querySelector('#findCount').textContent = `${at + 1}/${hits.length}`;
    });
    const pin = li => {
      const n = NOTE_FOR(lines[items.indexOf(li)]);
      if (!n) { botSay('Komentar itu tidak penting. Percayalah.'); return; }
      note(n[0], n[1]);
      li.classList.add('pinned');
    };
    view.querySelector('#code').addEventListener('click', e => { const li = e.target.closest('li.cmt'); if (li) pin(li); });
    view.querySelector('#code').addEventListener('keydown', e => { const li = e.target.closest('li.cmt'); if (li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pin(li); } });
  },
};

/* ---------- Pintu keluar ---------- */

PAGES['/keluar'] = {
  id: 'keluar', title: 'Pintu Keluar', icon: '🚪',
  render(view) {
    let entry = '';
    view.innerHTML = `<div class="site exit">
      <div class="door" id="door"><span class="door-knob"></span><span class="door-sign">EXIT</span></div>
      <div class="pad">
        <div class="code-slots" id="slots" aria-live="polite"></div>
        <div class="lights" aria-label="Kesempatan tersisa">${Array.from({ length: MAX_WRONG }, (_, i) => `<i class="${i < MAX_WRONG - G.wrong ? 'on' : ''}"></i>`).join('')}</div>
        <div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}<button data-k="del" aria-label="Hapus">⌫</button><button data-k="0">0</button><button data-k="ok" class="ok">OK</button></div>
        <p class="muted">Masukkan kode 4 angka. Salah ${MAX_WRONG} kali, pintu terkunci selamanya.</p>
      </div>
    </div>`;
    const slots = view.querySelector('#slots');
    const draw = () => { slots.innerHTML = [0, 1, 2, 3].map(i => `<span>${entry[i] ?? ''}</span>`).join(''); };
    draw();
    function press(k) {
      if (G.ending) return;
      if (k === 'del') entry = entry.slice(0, -1);
      else if (k === 'ok') { if (entry.length === 4) submit(); return; }
      else if (entry.length < 4) entry += k;
      draw();
    }
    function submit() {
      const code = G.order.map(k => G.digits[k - 1]).join('');
      if (entry === code) {
        view.querySelector('#door').classList.add('open');
        setTimeout(() => ending('keluar'), reduced() ? 100 : 1200);
      } else if (entry === '1234') {
        ending('bot');
      } else {
        G.wrong++;
        save();
        if (G.wrong >= MAX_WRONG) { glitch(); setTimeout(() => ending('terjebak'), 500); return; }
        entry = '';
        render();
        toast(`<span>Kode salah</span><b>Sisa kesempatan: ${MAX_WRONG - G.wrong}</b>`, 2000);
        const p = $('.pad');
        if (p) { p.classList.add('nope'); }
      }
    }
    view.querySelector('.keys').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); });
    view.onkeydown = null;
    keyHandler = e => {
      if (G.url !== '/keluar' || !$('#overlay').hidden || e.target.matches?.('input, textarea')) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter') press('ok');
    };
  },
};
let keyHandler = null;
document.addEventListener('keydown', e => { if (keyHandler) keyHandler(e); });

/* ---------- Ruang mesin (rahasia) ---------- */

PAGES[SECRET_ROOM] = {
  id: 'mesin', title: 'Ruang Mesin', icon: '⚙️', glitch: true,
  render(view) {
    if (!has('key')) {
      view.innerHTML = `<div class="site machine locked"><span class="keyhole" aria-hidden="true">🔒</span><h1>Ruang Mesin</h1>
        <p>Khusus admin. Kamu bukan admin. Belum.</p><p class="muted">Lubang kuncinya berbentuk garis miring.</p></div>`;
      return;
    }
    const sw = G.flags.sw || { popup: true, glitch: false };
    view.innerHTML = `<div class="site machine">
      <h1>⚙️ Ruang Mesin</h1><p class="muted">Kunci Admin dipakai. Semua pengaturan tokobiasa.situs ada di sini.</p>
      <ul class="switches">
        <li><span>Pop-up promo</span><button class="sw ${sw.popup ? 'on' : ''}" data-sw="popup" aria-pressed="${sw.popup}"></button></li>
        <li><span>Efek glitch berlebihan</span><button class="sw ${sw.glitch ? 'on' : ''}" data-sw="glitch" aria-pressed="${sw.glitch}"></button></li>
        <li><span>Bantu-Bot boleh berbohong</span><button class="sw on locked-sw" data-sw="bot" aria-pressed="true"></button></li>
        <li class="big"><span>Izinkan pengunjung keluar</span><button class="sw" data-sw="exit" aria-pressed="false"></button></li>
      </ul>
    </div>`;
    view.querySelector('.switches').addEventListener('click', e => {
      const b = e.target.closest('[data-sw]');
      if (!b) return;
      const k = b.dataset.sw;
      if (k === 'bot') { botSay('Saklar itu macet. Aku yang menempelnya dengan lem.'); return; }
      if (k === 'exit') {
        b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
        glitch();
        setTimeout(() => ending('admin'), reduced() ? 100 : 900);
        return;
      }
      sw[k] = !sw[k];
      G.flags.sw = sw; save();
      b.classList.toggle('on', sw[k]); b.setAttribute('aria-pressed', sw[k]);
      if (k === 'glitch' && sw[k]) glitch();
      if (k === 'popup') toast(`<span>Pengaturan</span><b>Pop-up promo ${sw[k] ? 'dinyalakan. Maaf.' : 'dimatikan. Untuk sekarang.'}</b>`, 2000);
    });
  },
};

/* ================= Ending ================= */

function ending(id) {
  if (G.ending) return;
  G.ending = id;
  const isNew = !S.endings.includes(id);
  if (isNew) S.endings.push(id);
  const e = ENDINGS[id];
  const mins = Math.max(1, Math.round((Date.now() - G.start) / 60000));
  const rooms = ROOMS.filter(([u]) => G.visited.includes(u)).length;
  const done = { ...G };
  S.game = null;
  G = done;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (err) { /* abaikan */ }
  openCard(`<p class="kicker">Ending ${Object.keys(ENDINGS).indexOf(id) + 1} dari ${Object.keys(ENDINGS).length}${isNew ? ' · baru' : ''}</p>
    <h2>${esc(e.title)}</h2><p>${esc(e.text)}</p>
    <dl class="stats">
      <div><dt>Waktu</dt><dd>±${mins} menit</dd></div>
      <div><dt>Halaman dibuka</dt><dd>${done.steps}</dd></div>
      <div><dt>Ruangan</dt><dd>${rooms}/${ROOMS.length}${done.visited.includes(SECRET_ROOM) ? ' + ✶' : ''}</dd></div>
      <div><dt>Petunjuk dipakai</dt><dd>${done.hints}</dd></div>
      <div><dt>Kode salah</dt><dd>${done.wrong}</dd></div>
      <div><dt>Ngobrol dengan bot</dt><dd>${done.flags.botTalks || 0} kali</dd></div>
    </dl>
    <p class="muted">Ending ditemukan: ${S.endings.length}/${Object.keys(ENDINGS).length}</p>
    <div class="actions"><button class="btn btn-main" data-card="start">Main lagi</button><button class="btn" data-card="endings">Daftar ending</button></div>`,
  { cls: 'ending ending-' + id, locked: true });
}

function showEndings() {
  const back = G && !G.ending ? 'close' : 'title';
  openCard(`<p class="kicker">Ending</p><h2>${S.endings.length} dari ${Object.keys(ENDINGS).length} ditemukan</h2>
    <ul class="end-list">${Object.entries(ENDINGS).map(([id, e]) => {
      const got = S.endings.includes(id);
      return `<li class="${got ? 'got' : ''}"><b>${got ? esc(e.title) : '???'}</b><small>${esc(got ? e.text : e.hint)}</small></li>`;
    }).join('')}</ul>
    <div class="actions"><button class="btn btn-main" data-card="${back}">Kembali</button></div>`, { locked: back === 'title' });
}

/* ================= Layar judul ================= */

function showTitle() {
  const cont = S.game && !S.game.ending;
  openCard(`<p class="kicker">Sebuah game puzzle di dalam browser</p>
    <h1 class="title">Escape<br>the Website</h1>
    <p class="tagline">Kamu ingin keluar. Website ini tidak mengizinkan.</p>
    <div class="actions col">
      ${cont ? '<button class="btn btn-main" data-card="continue">Lanjutkan</button>' : ''}
      <button class="btn ${cont ? '' : 'btn-main'}" data-card="start">${cont ? 'Mulai dari awal' : 'Mulai'}</button>
      <button class="btn" data-card="endings">Ending (${S.endings.length}/${Object.keys(ENDINGS).length})</button>
    </div>
    <p class="muted">Semua yang ada di sini, termasuk tokobiasa.situs, adalah fiksi. Progres tersimpan di browsermu.</p>`,
  { cls: 'title-card', locked: true, onClose: null });
  if (cont) G = S.game;
}

function startNew() {
  G = newGame();
  S.plays++;
  save();
  closeCard();
  render();
  setTimeout(() => botSay('Selamat datang di TokoBiasa! Kalau mau keluar, klik tombol "Keluar" di atas. Gampang.'), 600);
}

/* ================= Mulai ================= */

load();
G = S.game && !S.game.ending ? S.game : newGame();
render();
showTitle();
window.addEventListener('pagehide', () => { if (G && !G.ending) save(); });
