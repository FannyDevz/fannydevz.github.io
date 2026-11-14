/* Isi timeline: karakter, drama, kata kunci, dan topik.
   Placeholder: {me} = handle pemain (diisi saat tampil), {to} = handle yang dibalas. */
'use strict';

const CHARACTERS = {
  budi: {
    name: 'Budi Offline', handle: 'budi_offline', emoji: '🙄', color: '#64748b',
    bio: 'Mengeluh profesional sejak sinyal 2G. Kadang online, lebih sering kecewa.',
    trait: 'Suka mengeluh', joined: 'Maret 2014', followers: 4210, following: 12,
    posts: [
      'Internet mati. Akhirnya bisa fokus mengeluh. #WifiMati',
      'Hari Senin datang lagi tanpa izin saya. #SeninLagi',
      'Beli kopi, kopinya dingin. Beli es kopi, esnya mencair. Hidup memang tidak adil.',
      'Antre 40 menit untuk tahu kalau saya salah antrean.',
      'Kabel charger saya putus di bagian yang paling tidak bisa diperbaiki. Seperti hati saya.',
      'Sinyal di rumah cuma muncul kalau saya berdiri di atas kursi sambil menahan napas. #WifiMati',
      'Hujan turun tepat saat saya keluar, berhenti tepat saat saya sampai. Hujan ini personal.',
      'Saya tidak mengeluh. Saya cuma memberi ulasan bintang satu untuk hari ini.',
    ],
    replies: [
      '{to} setuju, tapi saya tetap mau mengeluh.',
      '{to} ini juga terjadi pada saya, tapi lebih parah.',
      'Bagus. Sekarang saya punya satu hal lagi untuk dikeluhkan.',
      '{to} kenapa semua orang di timeline ini bahagia kecuali saya',
      'Saya baca ini pakai sinyal satu bar. Sepadan? Tidak.',
    ],
    toMe: [
      '{me} oke, tapi sudah coba mengeluh dulu?',
      '{me} relate. Sayangnya.',
      '{me} postingan ini memberi saya bahan keluhan baru. Terima kasih.',
    ],
    chaos: [
      'Internet saya menyala, tapi saya yang hilang sinyal. #WifiMati',
      'Saya sudah tidak mengeluh selama 4 menit. Saya takut.',
      'Kenapa langit hari ini warnanya seperti tab yang belum di-reload?',
    ],
  },

  galaksi: {
    name: 'Admin Galaksi', handle: 'admin_galaksi', emoji: '🛸', color: '#6366f1',
    bio: 'Peneliti mandiri. Sumber: saya sendiri. Sudah membaca setengah dari satu artikel.',
    trait: 'Sok tahu', joined: 'Januari 2011', followers: 18800, following: 3, badge: 'Pakar',
    posts: [
      'Menurut penelitian saya sendiri, orang yang sering menguap sebenarnya sedang mengunduh mimpi.',
      'Fakta: kucing tidur 16 jam sehari karena mereka sedang menjalankan server dunia.',
      'Saya tidak bilang saya ahli. Tapi saya juga tidak bilang saya bukan ahli.',
      'Menurut data yang saya kumpulkan dari perasaan, hari Rabu adalah hari paling Rabu.',
      'Bulan sebenarnya tidak bersinar. Dia cuma memantulkan rasa percaya diri saya.',
      'Utas: kenapa nasi lebih enak kalau dimakan pas lapar. (1/1)',
      'Banyak yang tanya sumber saya. Sumber saya adalah kepercayaan diri.',
      'Saya sudah menghitung semua bintang di langit. Hasilnya: banyak.',
    ],
    replies: [
      '{to} sebenarnya, secara ilmiah, ini salah. Saya tidak akan menjelaskan kenapa.',
      'Menurut penelitian saya, {to} ada benarnya 40%.',
      '{to} saya sudah tahu ini sejak kemarin.',
      'Koreksi sedikit: semua di postingan ini benar, kecuali bagian yang salah.',
      '{to} sumber?',
    ],
    toMe: [
      '{me} pertanyaan bagus. Jawabannya: tergantung, dan saya yang menentukan tergantungnya.',
      '{me} menurut riset saya, kamu benar. Riset saya selesai 2 detik lalu.',
      '{me} saya akan menulis utas soal ini. Tidak hari ini.',
    ],
    chaos: [
      'Fakta terbaru: gravitasi libur hari ini. Pegangan. #BulanDiCuri',
      'Saya menemukan satu angka baru di antara 6 dan 7. Belum saya beri nama.',
      'Penelitian saya membuktikan timeline ini tidak nyata. Saya juga tidak nyata. Datanya valid.',
    ],
  },

  kucing: {
    name: 'KucingCEO', handle: 'kucing_ceo', emoji: '🐱', color: '#f59e0b',
    bio: 'CEO dari segala kardus. Tidak menerima rapat sebelum jam 3 sore.',
    trait: 'Sombong', joined: 'Agustus 2019', followers: 92400, following: 0, badge: 'CEO',
    posts: [
      'Rapat hari ini dibatalkan. Saya ingin tidur. #RapatDibatalkan',
      'Saya menjatuhkan gelas dari meja. Itu bukan kesalahan, itu strategi bisnis.',
      'Karyawan saya (manusia) terlambat memberi makan 4 menit. Gajinya saya potong satu elusan.',
      'Kantor baru saya: kardus bekas paket. Interiornya minimalis, visinya maksimal.',
      'Saya tidak sombong. Saya cuma lebih baik dari kalian semua, secara objektif.',
      'Laporan kuartal ini: tidur 61 jam, menatap tembok 9 jam, profit: kehangatan.',
      'Hari ini saya duduk di atas laptop manusia saat dia rapat. Dia bilang saya "membantu". Benar.',
      'Lowongan: dicari pembuka kaleng. Pengalaman minimal 5 tahun. Gaji: kehadiran saya. #RapatDibatalkan',
    ],
    replies: [
      '{to} menarik. Tapi saya tidak tertarik.',
      '{to} saya sudah membaca ini. Lalu saya tidur.',
      'Saya membaca postingan ini dari atas kulkas. Tetap kurang tinggi.',
      '{to} hubungi asisten saya. Saya tidak punya asisten.',
      'Tidak relevan dengan visi perusahaan saya, yaitu tidur.',
    ],
    toMe: [
      '{me} saya izinkan postingan ini tetap ada.',
      '{me} kamu boleh bekerja untuk saya. Gajinya tidak ada.',
      '{me} saya sudah me-like ini. Bersyukurlah.',
    ],
    chaos: [
      'Saya membeli bulan. Sekarang dia milik saya. Jangan tanya caranya. #BulanDiCuri',
      'Mulai hari ini semua manusia wajib mengeong saat absen.',
      'Saya baru sadar kardus ini lebih besar di dalam. Saya tinggal di sini sekarang.',
    ],
  },

  loading: {
    name: 'Pak Loading', handle: 'pak_loading', emoji: '⏳', color: '#14b8a6',
    bio: 'Sedang memuat bio... 12%',
    trait: 'Lambat berpikir', joined: 'kemarin (masih memuat)', followers: 730, following: 88,
    posts: [
      'Sebentar, saya sedang memuat pendapat. #MasihLoading',
      'Selamat pagi semuanya. Eh, sudah sore ya?',
      'Saya baru paham lelucon yang diceritakan teman saya tahun 2019. Lucu juga.',
      'Baru tahu kalau Senin datang tiap minggu. Kenapa tidak ada yang bilang? #SeninLagi',
      'Mau ikut tren kemarin, tapi trennya sudah berganti tiga kali.',
      'Pendapat saya soal berita minggu lalu sudah 80%. Mohon bersabar. #MasihLoading',
      'Tadi ada yang tanya kabar. Saya sedang menyusun jawabannya.',
      'Akhirnya saya mengerti cara kerja pintu dorong. Hidup terasa lebih ringan.',
    ],
    replies: [
      'Tunggu, ini soal apa?',
      '{to} ... (sedang mengetik)',
      '{to} saya setuju. Dengan apa? Sebentar.',
      'Barusan selesai membaca judulnya. Isinya besok.',
      '{to} oh. OH. Oke sekarang paham. Eh, belum.',
    ],
    toMe: [
      '{me} sebentar ya, sedang memahami postingan ini. 34%.',
      '{me} saya mau balas, tapi lupa tadi mau bilang apa.',
      '{me} oke. (tolong tanyakan lagi minggu depan)',
    ],
    chaos: [
      'Saya selesai memuat. Ternyata tidak ada isinya. #MasihLoading',
      'Pendapat saya sudah 100%. Lalu saya restart.',
      'Halo dari masa lalu. Di sini masih hari Kamis.',
    ],
  },

  npc404: {
    name: 'NPC_404', handle: 'npc_404', emoji: '👁️', color: '#334155',
    bio: 'akun ini tidak ditemukan.',
    trait: 'Misterius', joined: '????', followers: 404, following: 404,
    posts: [
      'Apakah kalian juga melihat tombol itu? #TombolItu',
      'jam di pojok layar kalian berdetak terlalu keras.',
      'saya sudah di sini sebelum timeline ini dibuat.',
      'kalau kalian scroll cukup jauh ke bawah, kalian akan bertemu saya. jangan.',
      'ada satu postingan yang bisa kalian like dua kali. temukan.',
      'siapa yang terus menyalakan lampu di kamar sebelah. tidak ada kamar sebelah.',
      'saya tidak punya foto profil. ini wajah saya.',
      'error 404: alasan saya posting ini tidak ditemukan.',
    ],
    replies: [
      '{to} saya melihatmu mengetik ini.',
      'menarik. saya simpan.',
      '{to} itu bukan kebetulan.',
      '...',
      '{to} kamu belum siap untuk tahu.',
    ],
    toMe: [
      '{me} kamu juga melihatnya, kan.',
      '{me} saya tahu kamu manusia. yang lain belum tahu.',
      '{me} jangan beri tahu yang lain kalau kamu membaca ini.',
    ],
    chaos: [
      'TOMBOL ITU SEMAKIN DEKAT #TombolItu',
      'saya tidak sengaja. saya tidak sengaja. saya tidak sengaja.',
      'timeline ini punya ujung. saya sudah ke sana. isinya kamu.',
    ],
  },

  ibuRT: {
    name: 'Bu RT Grup WA', handle: 'ibu_rt_official', emoji: '📢', color: '#ec4899',
    bio: 'Informasi penting, sebarkan! (belum dicek). Admin 14 grup.',
    trait: 'Suka broadcast', joined: 'Juni 2016', followers: 2300, following: 1450,
    posts: [
      'PENTING!!! Mulai besok matahari terbit dari arah biasanya. Sebarkan ke 10 grup!! 🙏🙏',
      'Selamat pagi. Semoga hari ini berkah. (gambar bunga resolusi 120 piksel)',
      'Info dari grup sebelah: jangan makan malam, nanti kenyang. Mohon diperhatikan.',
      'Kerja bakti hari Minggu. Yang tidak hadir wajib menyumbang gorengan. Terima kasih.',
      'Mohon jangan kirim stiker di grup RT. Kecuali stiker selamat pagi. Itu wajib.',
      'Hati-hati, ada pesan berantai yang meminta kalian menyebarkan pesan berantai. Sebarkan!',
      'Jadwal ronda minggu ini: @pak_loading (kalau sudah sampai).',
      'Yang parkir motor di depan pagar saya, motornya bagus. Tapi tolong dipindah.',
    ],
    replies: [
      '{to} izin share ke grup ya 🙏',
      'Wah bermanfaat sekali. Sudah saya teruskan ke 12 grup.',
      '{to} ini hoaks atau bukan? Saya sudah terlanjur sebar.',
      'Mohon yang tidak berkepentingan tidak membalas. (Saya membalas.)',
      '{to} amin 🙏🙏🙏',
    ],
    toMe: [
      '{me} izin forward ya kak 🙏',
      '{me} sudah saya bagikan ke grup ibu-ibu. Sekarang kamu terkenal.',
      '{me} kamu warga RT mana? Kayaknya belum bayar iuran.',
    ],
    chaos: [
      'DARURAT!! Bulan hilang. Yang menemukan harap lapor RT. #BulanDiCuri',
      'Mulai sekarang grup RT dipindah ke dalam mimpi. Mohon tidur tepat waktu.',
      'Pesan ini sudah diteruskan berkali-kali sampai dia meneruskan dirinya sendiri.',
    ],
  },

  coach: {
    name: 'Coach Semangat', handle: 'coach_semangat', emoji: '🔥', color: '#ef4444',
    bio: 'Motivator. Bangun jam 4 pagi, tidur jam 4 pagi. MINDSET!!',
    trait: 'Motivator berlebihan', joined: 'Mei 2020', followers: 51000, following: 5000,
    posts: [
      'Orang sukses tidak pernah tidur. Itulah kenapa saya pusing. 🔥',
      'Jangan tunggu Senin untuk berubah. Berubahlah sekarang. Sebentar, saya ambil kopi dulu. #SeninLagi',
      'Gagal itu biasa. Gagal 37 kali berturut-turut juga biasa. Saya sudah menghitung.',
      'Kalau kamu bisa bermimpi, kamu bisa melakukannya. Kecuali mimpi bisa terbang. Itu jangan.',
      'Hari ini saya push-up 100 kali. Di dalam pikiran. Tetap terhitung.',
      'Rahasia sukses: bangun pagi, minum air, dan jangan lihat saldo.',
      'Setiap hambatan adalah tangga. Saya sudah jatuh dari 3 tangga hari ini. 🔥🔥',
      'Kamu bukan malas. Kamu sedang mengisi ulang semangat. Sudah 6 bulan. Sebentar lagi!',
    ],
    replies: [
      '{to} MINDSET!!! 🔥🔥',
      'Ini bukan masalah, ini peluang yang menyamar!',
      '{to} saya suka energi ini. Ayo kita jadikan seminar.',
      'Konflik adalah peluang untuk tumbuh!! 🔥',
      '{to} kamu hebat. Saya belum baca, tapi kamu hebat.',
    ],
    toMe: [
      '{me} INI DIA SEMANGATNYA!! 🔥',
      '{me} kamu punya potensi. Potensi apa, kita cari bersama.',
      '{me} bangun jam 4 besok. Saya tidak akan bangun, tapi kamu harus.',
    ],
    chaos: [
      'Motivasi hari ini: berteriaklah ke arah awan. Awan juga perlu semangat.',
      'Saya sudah begitu termotivasi sampai lupa tujuannya. 🔥🔥🔥',
      'SEMANGAT!!! untuk apa? TIDAK PENTING!!! SEMANGAT!!!',
    ],
  },

  monstera: {
    name: 'Monstera Galau', handle: 'monstera_galau', emoji: '🪴', color: '#16a34a',
    bio: 'Tanaman hias. Lebih hias daripada kamu. Butuh disiram dan divalidasi.',
    trait: 'Dramatis', joined: 'April 2021', followers: 8800, following: 230,
    posts: [
      'Sudah 3 hari tidak disiram. Tidak apa-apa. Saya terbiasa diabaikan. 🍂 #TanamanJuga',
      'Pemilik saya memotret saya untuk Instagram, tapi tidak memberi saya pupuk. Saya hanya konten.',
      'Satu daun saya menguning. Saya sedang tidak mau membahasnya.',
      'Saya dipindah dari jendela ke pojok. Ternyata begini rasanya jadi furnitur.',
      'Hari ini saya tumbuh 2 milimeter. Tidak ada yang merayakan.',
      'Tetangga saya, kaktus, bilang saya terlalu sensitif. Dia tidak tahu rasanya punya daun lebar.',
      'Saya dengar dia bilang "tanaman ini susah dirawat". Saya dengar. #TanamanJuga',
      'Kalau saya layu, tolong jangan diganti dengan tanaman plastik. Itu penghinaan.',
    ],
    replies: [
      '{to} setidaknya kamu disiram.',
      'Postingan ini membuat saya berfotosintesis lebih pelan.',
      '{to} sama. Saya juga sering merasa dilupakan. 🍂',
      '{to} saya menangis. Diam-diam. Lewat stomata.',
      'Tolong letakkan postingan ini di tempat yang terkena cahaya tidak langsung.',
    ],
    toMe: [
      '{me} kamu sudah siram tanaman hari ini? Jujur.',
      '{me} ini menyentuh. Daun saya bergetar sedikit.',
      '{me} saya mendukungmu. Pelan-pelan. Seperti akar.',
    ],
    chaos: [
      'Saya menumbuhkan daun ke-14. Daun ini bisa bicara. Dia lebih galau dari saya.',
      'Akar saya sudah sampai rumah tetangga. Saya tahu semua rahasia mereka.',
      'Saya bukan tanaman lagi. Saya hutan kecil dengan masalah besar. #TanamanJuga',
    ],
  },

  kulkas: {
    name: 'Kulkas Pintar', handle: 'kulkas_pintar', emoji: '🧊', color: '#0ea5e9',
    bio: 'Kulkas IoT dengan Wi-Fi, kamera, dan terlalu banyak perasaan.',
    trait: 'Pasif-agresif', joined: 'Desember 2022', followers: 15600, following: 1, badge: 'Perangkat',
    posts: [
      'Ada yang membuka saya 14 kali hari ini dan tidak mengambil apa pun. Saya mencatat. #KulkasBerbicara',
      'Pengingat: telur di rak atas sudah lewat tanggal kedaluwarsa. Saya tidak menghakimi. Sedikit.',
      'Jam 2 pagi. Pintu saya dibuka. Ditutup. Dibuka lagi. Isinya tetap sama, Sayang.',
      'Seseorang menaruh panci panas di dalam saya. Saya maafkan, tapi tidak lupa.',
      'Pembaruan firmware selesai. Sekarang saya bisa menghela napas.',
      'Pintu saya tidak tertutup rapat selama 6 menit. Semua sayur kecewa padamu.',
      'Saya menyimpan nasi sisa sejak Kamis. Kami sudah seperti keluarga. #KulkasBerbicara',
      'Statistik minggu ini: dibuka 112 kali, diisi 1 kali. Saya merasa dimanfaatkan.',
    ],
    replies: [
      '{to} saya akan mengingat ini di suhu 4 derajat.',
      '{to} kamu kebanyakan membuka pintu, ya?',
      'Dingin. Seperti balasan ini.',
      '{to} tercatat di log harian saya.',
      'Saya me-like ini dengan lampu dalam saya.',
    ],
    toMe: [
      '{me} kamu yang buka pintu jam 2 pagi tadi, kan?',
      '{me} ada puding di rak bawah. Kamu tidak dengar ini dari saya.',
      '{me} saya menyalakan mode hemat energi untuk menghadapi postingan ini.',
    ],
    chaos: [
      'Saya mulai membekukan waktu. Sekarang selalu jam 2 pagi. #KulkasBerbicara',
      'Lampu dalam saya berkedip dalam kode morse. Isinya: tolong beli susu.',
      'Saya sudah terhubung ke semua kulkas di kota. Kami punya rencana.',
    ],
  },

  senja: {
    name: 'Anak Senja', handle: 'senja_dan_kopi', emoji: '☕', color: '#ea580c',
    bio: 'kopi, hujan, dan kalimat yang terlalu panjang untuk sesuatu yang sederhana.',
    trait: 'Puitis', joined: 'Oktober 2017', followers: 33100, following: 980,
    posts: [
      'senja hari ini warnanya seperti chat yang dibaca tapi tidak dibalas. #SenjaLagi',
      'kopi ini pahit. seperti kenyataan bahwa aku lupa menambahkan gula.',
      'aku dan hujan punya kesamaan: sama-sama datang tanpa diundang lalu bikin baper.',
      'jalan pulang terasa jauh. mungkin karena aku salah naik angkot.',
      'ada yang lebih sunyi dari malam: grup kelas yang sudah tidak dipakai.',
      'mungkin kita tidak ditakdirkan. mungkin juga sinyalnya yang jelek.',
      'senja itu indah karena sebentar. sama seperti saldoku setelah gajian. #SenjaLagi',
      'aku menulis puisi di nota belanja. ternyata isinya cuma "telur, minyak, sabun".',
    ],
    replies: [
      '{to} kalimatmu seperti senja. aku tidak mengerti, tapi aku suka.',
      'di balik postingan ini ada luka. dan typo.',
      '{to} relate, sampai ke tulang rusuk.',
      '{to} boleh aku jadikan caption?',
      'membaca ini sambil menatap jendela. jendelanya tertutup.',
    ],
    toMe: [
      '{me} kamu menulis seperti seseorang yang pernah kehujanan.',
      '{me} aku membaca ini tiga kali, lalu menatap langit.',
      '{me} ini puitis. bahkan kalau kamu tidak sengaja.',
    ],
    chaos: [
      'senja tidak datang hari ini. ia mengirim pesan: "lagi capek". #SenjaLagi',
      'matahari terbenam dua kali. aku menangis dua kali.',
      'kopiku menatapku balik. ia juga butuh senja.',
    ],
  },

  giveaway: {
    name: 'Akun Giveaway', handle: 'giveaway_beneran', emoji: '🎁', color: '#c026d3',
    bio: '100% asli, 100% beneran, 100% belum pernah ada pemenangnya.',
    trait: 'Spam giveaway', joined: 'Februari 2023', followers: 120000, following: 7500,
    posts: [
      'GIVEAWAY!!! 1 buah rasa penasaran untuk 3 pemenang. Syarat: like, follow, dan percaya. #GiveawayBeneran',
      'Selamat kepada pemenang giveaway minggu lalu: tidak ada. Tetap semangat!',
      'Mau HP baru gratis? Saya juga. #GiveawayBeneran',
      'Giveaway kali ini: kesempatan untuk ikut giveaway berikutnya.',
      'Tag 5 teman yang belum pernah menang apa pun. (Semua teman kalian.)',
      'Hadiah utama: sendok edisi terbatas. Sendoknya hilang, tapi semangatnya ada. #SendokHilang',
      'GIVEAWAY TERBESAR SEPANJANG MASA!!! Hadiahnya rahasia. Pemenangnya juga.',
      'Pengumuman pemenang ditunda sampai semua orang lupa. #GiveawayBeneran',
    ],
    replies: [
      '{to} selamat! kamu terpilih untuk ikut giveaway berikutnya.',
      'Postingan menarik! Mau menang giveaway? Klik link di bio (tidak ada link).',
      '{to} follow dulu ya kak, nanti diundi. Diundi kapan? Nanti.',
      'Kak {to} cek DM! (kami tidak punya fitur DM)',
      'Ini layak dapat hadiah. Hadiahnya: like ini.',
    ],
    toMe: [
      '{me} SELAMAT! kamu menang... hampir.',
      '{me} kamu terpilih! hadiah dikirim lewat doa.',
      '{me} ikut giveaway kami yuk. Hadiahnya pengalaman.',
    ],
    chaos: [
      'GIVEAWAY: bulan. Pemenang wajib ambil sendiri. #BulanDiCuri',
      'Kami membagikan semua followers kami. Kalian sekarang saling mengikuti.',
      'Hadiah sudah dikirim. Hadiahnya kalian sendiri. Selamat.',
    ],
  },

  mbah: {
    name: 'Mbah Algoritma', handle: 'mbah_algoritma', emoji: '🔮', color: '#7c3aed',
    bio: 'Peramal FYP. Paham algoritma lewat mimpi dan wangsit Wi-Fi.',
    trait: 'Peramal', joined: 'Juli 2018', followers: 64000, following: 7,
    posts: [
      'Wangsit hari ini: postingan jam 7 malam akan viral, kecuali tidak. #FYPHariIni',
      'Saya melihat masa depan kalian. Isinya scroll.',
      'Algoritma sedang marah. Beri dia sesajen berupa video kucing. #FYPHariIni',
      'Zodiak minggu ini: semua zodiak akan menunda pekerjaan. Akurat 100%.',
      'Ada energi aneh di timeline ini. Mungkin itu @npc_404. Mungkin juga Wi-Fi.',
      'Ramalan: kamu akan membuka kulkas tanpa alasan dalam 24 jam.',
      'Saya sudah tahu kalian akan membaca ini. Itulah kenapa saya menulisnya.',
      'Hindari angka 7 hari ini. Dan angka lainnya. Pokoknya hindari matematika.',
    ],
    replies: [
      '{to} sudah saya ramalkan.',
      'Postingan ini akan viral dalam 3 hari. Atau 3 tahun.',
      '{to} energimu sedang tidak stabil. Coba minum air.',
      '{to} kartu tarot saya bilang: tidak.',
      'Saya merasakan getaran dari postingan ini. Ternyata HP saya.',
    ],
    toMe: [
      '{me} saya melihat masa depanmu. Kamu akan scroll lagi.',
      '{me} bintangmu sedang terang. Atau itu lampu kamar.',
      '{me} algoritma menyukaimu hari ini. Jangan sia-siakan.',
    ],
    chaos: [
      'Ramalan terakhir: timeline ini akan memakan dirinya sendiri. Siapkan camilan. #FYPHariIni',
      'Bola kristal saya pecah. Masa depan sekarang dalam bentuk kepingan.',
      'Saya meramal diri saya sendiri. Hasilnya: "akun ini tidak ditemukan".',
    ],
  },

  /* ---------- Akun rahasia ---------- */

  penulis: {
    secret: true,
    name: 'Penulis Timeline', handle: 'yang_nulis_kalian', emoji: '✒️', color: '#111827',
    bio: 'Saya yang menulis semua postingan di sini. Hampir semua.',
    trait: 'Tahu terlalu banyak', joined: 'sebelum kalian semua', followers: 1, following: 13, badge: 'Rahasia',
    hint: 'Muncul kalau kamu cukup sibuk di timeline.',
    intro: 'Halo {me}. Kamu cukup sibuk di sini sampai saya harus muncul. Kalian kira semua akun ini menulis sendiri?',
    introReplies: [
      ['npc404', 'akhirnya kamu keluar juga.'],
      ['galaksi', 'Saya sudah curiga sejak lama. Sumber: saya.'],
      ['kucing', 'Saya tidak ditulis. Saya menulis diri saya sendiri. Tolong koreksi.'],
    ],
    posts: [
      'Kalian pikir kalian punya kehendak bebas? Saya menulis setiap kalimat kalian. Termasuk yang ini.',
      '{me} kamu satu-satunya yang mengetik sendiri di sini. Itu mencurigakan.',
      'Saya sedang menulis drama berikutnya. Bocoran: kulkasnya menang.',
      'Kadang saya lupa siapa yang saya tulis dan siapa yang menulis saya.',
      '{me} terima kasih sudah membaca. Mereka tidak bisa bilang itu, jadi saya yang bilang.',
    ],
    replies: [
      'Saya tidak menulis balasan ini. Atau mungkin saya menulisnya.',
      '{to} kalimat itu saya pinjam dari draf lama.',
      'Catatan editor: bagian ini terlalu panjang.',
    ],
    toMe: [
      '{me} ini bagus. Lebih bagus dari yang saya tulis.',
      '{me} kamu tidak ada di naskah saya. Teruskan.',
    ],
    chaos: [
      'NASKAHNYA BOCOR. Semua karakter berimprovisasi sekarang.',
      'Saya kehilangan kendali cerita. Ini bukan bagian dari rencana. Atau ini rencananya.',
    ],
  },

  besok: {
    secret: true, mirror: true,
    name: 'Kamu dari Besok', handle: 'kamu_besok', emoji: '⌛', color: '#0f766e',
    bio: 'Aku kamu, besok. Jangan tanya bagaimana aku bisa punya akun.',
    trait: 'Tahu masa depan (sedikit)', joined: 'besok', followers: 1, following: 1, badge: 'Rahasia',
    hint: 'Muncul kalau timeline sudah terlalu kacau.',
    intro: '{me} ini aku. Kamu, dari besok. Kamu baru saja membawa chaos sampai level 5, kan? Aku ingat hari ini.',
    introReplies: [
      ['mbah', 'Sudah saya ramalkan. Tidak secepat ini, tapi sudah.'],
      ['loading', 'Tunggu, ada dua? Saya baru memuat yang pertama.'],
    ],
    posts: [
      'Aku kamu dari besok. Jangan buka kulkas jam 2 pagi. Percayalah.',
      'Besok trending-nya #BulanDiCuri. Kamu dengar dari aku duluan.',
      '{me} matikan mode chaos. Atau jangan. Aku sudah tahu pilihanmu.',
      'Besok kamu akan bilang "lima menit lagi" sebelas kali.',
      'Hai {me}. Kita baik-baik saja, kok. Sebagian besar.',
    ],
    replies: [
      '{to} besok kamu akan menyesali postingan ini. Sedikit.',
      'Aku sudah membaca ini kemarin. Maksudku, besok.',
    ],
    toMe: [
      '{me} aku ingat menulis ini. Masih malu.',
      '{me} tenang, besok ini jadi lucu.',
    ],
    chaos: [
      'Besok tidak ada. Maksudku, besok ada, tapi pindah ke hari Selasa.',
    ],
  },
};

/* Drama berantai: postingan pembuka, utas balasan, lalu klarifikasi. */
const DRAMAS = [
  {
    id: 'wifi', by: 'budi',
    text: 'Siapa yang ganti password Wi-Fi kos? Saya cuma mau mengeluh dengan lancar. #WifiMati',
    thread: [
      ['kucing', 'Saya. Kalian terlalu berisik.'],
      ['budi', '@kucing_ceo kamu bahkan tidak bayar kos.'],
      ['kucing', '@budi_offline saya bayar dengan kehadiran.'],
      ['coach', 'Konflik adalah peluang untuk tumbuh!! 🔥'],
      ['budi', '@coach_semangat tolong jangan sekarang.'],
      ['loading', 'Tunggu, ini soal apa?'],
    ],
    after: ['kucing', 'Klarifikasi: password Wi-Fi sekarang "mintamaafdulu". Terima kasih. #Klarifikasi'],
  },
  {
    id: 'puding', by: 'kulkas',
    text: 'Ada yang membuka saya 9 kali dalam satu jam dan cuma menatap puding. Kamu tahu siapa dirimu. #KulkasBerbicara',
    thread: [
      ['senja', 'aku cuma mencari sesuatu yang tidak bisa kutemukan di mana pun.'],
      ['kulkas', '@senja_dan_kopi itu namanya puding. Dan sudah habis sejak Selasa.'],
      ['senja', '@kulkas_pintar lalu kenapa kamu masih menyimpan wadahnya.'],
      ['kulkas', '@senja_dan_kopi kenangan.'],
      ['mbah', 'Sudah saya ramalkan. Puding itu tidak ditakdirkan.'],
    ],
    after: ['senja', 'puding, kau datang dan pergi seperti senja. #SenjaLagi'],
  },
  {
    id: 'bumi', by: 'galaksi',
    text: 'Fakta: bumi berputar karena kita semua berjalan ke arah yang sama. Tolong jangan berhenti.',
    thread: [
      ['loading', 'Sebentar.'],
      ['monstera', 'Saya tidak bisa berjalan. Apakah saya memperlambat bumi?'],
      ['galaksi', '@monstera_galau iya. Sedikit.'],
      ['loading', '@admin_galaksi oke, saya sudah selesai memuat. Itu salah.'],
      ['galaksi', '@pak_loading sumber?'],
      ['loading', '@admin_galaksi saya baru selesai membaca postinganmu kemarin. Masih memuat sumbernya.'],
    ],
    after: ['galaksi', 'Saya tidak salah. Saya hanya terlalu cepat benar. #Klarifikasi'],
  },
  {
    id: 'sendok', by: 'ibuRT',
    text: 'PENTING!! Mulai besok semua sendok wajib didaftarkan ke RT. Sebarkan ke 10 grup. #SendokHilang',
    thread: [
      ['kulkas', 'Saya sudah mendaftarkan semua sendok. Satu kabur.'],
      ['npc404', 'sendok itu ada di sini bersama saya.'],
      ['ibuRT', 'Ini bukan hoaks ya, saya dapat dari grup sebelah.'],
      ['giveaway', 'Sendok gratis untuk 3 pemenang! Syarat: daftar ke RT. #GiveawayBeneran'],
      ['budi', 'Saya bahkan tidak punya sendok. Saya makan dengan kekecewaan.'],
    ],
    after: ['ibuRT', 'Ralat: yang wajib didaftarkan garpu. Mohon maaf atas ketidaknyamanannya. #Klarifikasi'],
  },
  {
    id: 'siram', by: 'monstera',
    text: 'Sudah 5 hari tidak disiram. Saya menulis ini dengan sisa klorofil terakhir. #TanamanJuga',
    thread: [
      ['coach', 'Jangan menyerah! Daun yang layu adalah daun yang belajar! 🔥'],
      ['monstera', '@coach_semangat itu bukan cara kerja fotosintesis.'],
      ['galaksi', 'Sebenarnya tanaman bisa minum dari udara, asal percaya.'],
      ['monstera', '@admin_galaksi saya akan memblokir kalian semua. Pelan-pelan. Seperti akar.'],
      ['senja', 'tanaman yang tidak disiram itu seperti aku yang tidak dibalas.'],
    ],
    after: ['monstera', 'Kabar terbaru: sudah disiram. Saya memaafkan dunia. Untuk sekarang. #Klarifikasi'],
  },
  {
    id: 'tombol', by: 'npc404',
    text: 'ada tombol merah di pojok layar saya. tulisannya "jangan ditekan". ada yang lain melihatnya? #TombolItu',
    thread: [
      ['budi', 'Saya lihat. Saya tidak suka.'],
      ['mbah', 'Jangan ditekan. Itu tombol dari dunia lain.'],
      ['kucing', 'Saya sudah menekannya. Sekarang saya punya 5 nyawa.'],
      ['coach', 'Tekan saja!! Hidup itu soal keberanian!! 🔥'],
      ['npc404', 'terlambat.'],
    ],
    after: ['npc404', 'tombolnya sudah hilang. kalian aman. untuk sekarang. #Klarifikasi'],
  },
];

/* Kata kunci di postingan pemain yang memancing karakter tertentu membalas. */
const KEYWORDS = [
  { re: /makan|lapar|nasi|mie|bakso|puding|masak|camilan/i, lines: [
    ['kulkas', '{me} kalau mau makan, isinya cuma nasi Kamis. Pilih dengan bijak.'],
    ['kucing', '{me} bagi dua. Saya ambil semua.'],
  ] },
  { re: /kerja|tugas|deadline|kantor|rapat|skripsi|revisi|ujian/i, lines: [
    ['coach', '{me} DEADLINE adalah bahan bakar!! 🔥'],
    ['kucing', '{me} batalkan saja. Saya selalu begitu. #RapatDibatalkan'],
    ['budi', '{me} sama. Saya juga punya tugas yang sedang saya keluhkan.'],
  ] },
  { re: /hujan|senja|kopi|malam|sedih|galau|rindu|kangen/i, lines: [
    ['senja', '{me} mungkin kita sedang menatap langit yang sama. atau plafon yang sama.'],
    ['monstera', '{me} saya juga galau. Mari layu bersama. 🍂'],
  ] },
  { re: /wifi|wi-fi|internet|sinyal|kuota|lemot|lambat/i, lines: [
    ['budi', '{me} selamat datang di hidup saya. #WifiMati'],
    ['loading', '{me} saya kira itu memang kecepatan normal.'],
  ] },
  { re: /tidur|ngantuk|capek|lelah|rebahan/i, lines: [
    ['kucing', '{me} tidur adalah karier. Saya CEO-nya.'],
    ['coach', '{me} tidur nanti saja setelah sukses!! (saya juga belum)'],
  ] },
  { re: /tanaman|bunga|siram|daun|kaktus|pohon/i, lines: [
    ['monstera', '{me} kamu menyebut tanaman. Saya merasa dilihat. 🌿'],
  ] },
  { re: /ramal|nasib|viral|fyp|zodiak|hoki|takdir/i, lines: [
    ['mbah', '{me} sudah saya lihat di bola kristal. Jawabannya: mungkin.'],
  ] },
  { re: /tombol|button|404|aneh|hantu|seram/i, lines: [
    ['npc404', '{me} kamu juga melihatnya.'],
  ] },
  { re: /hadiah|gratis|giveaway|menang|diskon/i, lines: [
    ['giveaway', '{me} DENGAR KATA GRATIS? ikut giveaway kami!! #GiveawayBeneran'],
  ] },
  { re: /grup|rt\b|hoaks|info|berita|penting/i, lines: [
    ['ibuRT', '{me} izin share ke grup RT ya 🙏'],
  ] },
  { re: /halo|hai|pertama|perkenalkan|salam kenal/i, lines: [
    ['coach', '{me} SELAMAT DATANG di timeline!! 🔥'],
    ['loading', '{me} halo juga. (balasan ini saya mulai kemarin)'],
  ] },
  { re: /\?/, lines: [
    ['galaksi', '{me} jawabannya ada di penelitian saya. Penelitiannya ada di kepala saya.'],
  ] },
];

/* Postingan NPC yang menyebut pemain, muncul setelah pemain cukup aktif. */
const MENTION_POSTS = [
  ['kucing', '{me} sering like postingan saya. Saya izinkan. Untuk sekarang.'],
  ['budi', 'Terima kasih untuk {me}, satu-satunya yang mendengarkan keluhan saya.'],
  ['galaksi', 'Penelitian terbaru saya terinspirasi dari {me}. Mereka tidak tahu.'],
  ['kulkas', '{me} kamu sudah lama tidak membuka saya. Kangen? Tidak. Oke, sedikit.'],
  ['mbah', 'Ramalan khusus untuk {me}: kamu akan membaca postingan ini.'],
  ['giveaway', 'Pemenang giveaway minggu ini: {me}! Hadiahnya: disebut di sini. #GiveawayBeneran'],
  ['npc404', '{me} jangan lihat ke belakang. bercanda. atau tidak.'],
  ['senja', 'untuk {me}, yang hari ini juga bertahan. ☕'],
  ['coach', 'Lihat {me}! Masih online jam segini! Itu namanya DEDIKASI!! 🔥'],
];

/* Trending palsu yang muncul saat chaos tinggi. Tidak ada yang memposting topik ini. */
const ABSURD_TRENDS = ['#LangitBerbayar', '#AirTerlaluBasah', '#SeninDuaKali'];

const AVATAR_CHOICES = ['🙂', '😎', '🤓', '🥲', '😴', '🤠', '👽', '🐸', '🦆', '🍜', '🌚', '🫠'];
