# Naskah Voice-over — Surat untuk Mas TRIP (Video 2)

Untuk **ElevenLabs Eleven v3** (tag ekspresi dalam kurung siku hanya berfungsi di v3).
Satu narator: **Rara**, pelajar SMA kelas 11 di Surabaya. Seluruh VO adalah surat yang ia tulis untuk "Mas TRIP".

## Pengaturan yang Disarankan

| Pengaturan | Nilai |
| :--- | :--- |
| Model | **Eleven v3** |
| Bahasa | Indonesian |
| Karakter suara | Perempuan muda (16–18 tahun), hangat, santai, tidak dibuat-buat seperti penyiar. Berbeda dari narator dokumenter Video 1. |
| Stability | **Natural** |
| Speed | 1.0 (surat dibaca seperti bicara, bukan pidato) |
| Output | MP3/WAV 44.1 kHz |

**Cara generate:** satu file per scene, lalu taruh di `Video 2/audio/` dengan nama dari tabel di bagian akhir. Kalau satu file melebihi **Target maks**, naikkan Speed sedikit atau hapus satu tag `[pause]`.

**Gaya bahasa:** bahasa sehari-hari anak Surabaya yang sopan ("aku", "nggak", "Mas"). Sengaja tanpa huruf kapital untuk penekanan, tanpa pola "bukan hanya… tetapi juga", dan tanpa angka atau kutipan karangan. Semua fakta ada di `FAKTA.md`.

---

## Scene 1 — Pembuka: Jalan Mastrip
**Timecode:** 00:00–00:22 · **VO mulai:** 00:02 · **Target maks:** 17 dtk
**Di layar (0–3 dtk):** "POV: kamu pelajar SMA, dan tahunnya 1946."
**Arah:** Kalimat pertama seperti bertanya ke penonton. Setelah jeda, berubah hangat karena mulai menulis surat.

```
[curious] Kamu tiap hari lewat Jalan Mastrip. [short pause] Tahu itu nama siapa? [pause] [warmly] Mas, aku Rara. Aku nulis surat ini dari Surabaya, tahun 2026. [short pause] Aku kelas sebelas. Kalau Mas ada di sini, mungkin kita seumuran.
```

## Scene 2 — Siapa Mas TRIP
**Timecode:** 00:22–00:45 · **VO mulai:** 00:22.5 · **Target maks:** 21 dtk
**Arah:** Seperti menceritakan hal yang baru ia ketahui. Pelan di kalimat terakhir.

```
[thoughtful] Di buku sejarah, nama kalian TRIP: Tentara Republik Indonesia Pelajar. [pause] Juli 1946, anak-anak SMP dan SMA di Jawa Timur meninggalkan bangku sekolah untuk menjaga republik yang umurnya belum genap setahun. [short pause] [softly] Tiap pagi aku lewat jalan yang pakai nama kalian, dan baru minggu lalu aku tahu artinya.
```

## Scene 3 — Uang Pertama Republik
**Timecode:** 00:45–01:12 · **VO mulai:** 00:45.5 · **Target maks:** 20 dtk
**Arah:** Kalimat terakhir diucapkan setelah jeda panjang (musik berhenti di sini), pelan dan hangat.

```
[curious] Tahun itu juga, tanggal tiga puluh Oktober, republik untuk pertama kali memakai uangnya sendiri: Oeang Republik Indonesia. [pause] Dengan uang itu, kita tidak lagi bergantung pada uang peninggalan penjajah. [long pause] [warmly] Uang itu sekarang namanya Rupiah.
```

## Scene 4 — Caraku Menjaganya
**Timecode:** 01:12–01:35 · **VO mulai:** 01:12.5 · **Target maks:** 21 dtk
**Arah:** Percaya diri, ringan. Tiga kata "dilihat, diraba, diterawang" diucapkan jelas dengan jeda kecil.

```
[confident] Jadi ini caraku menjaganya, Mas. [short pause] Uang kertas di dompetku nggak aku lipat-lipat atau remas. Kalau terima kembalian, aku cek dulu: dilihat, diraba, diterawang. [pause] [cheerful] Di warung dekat sekolah, aku bayar pakai Rupiah, kadang tunai, kadang scan QRIS.
```

## Scene 5 — Medan Perangku
**Timecode:** 01:35–01:58 · **VO mulai:** 01:35.5 · **Target maks:** 22 dtk
**Arah:** Mulai serius dan waspada, makin tegas di tiga kebiasaan, lalu pertanyaan terakhir diucapkan lembut seperti bicara ke diri sendiri.

```
[serious] Medan perangku beda sama Mas. Ancamannya datang lewat HP. [pause] [cautious] Ada link hadiah dari undian yang nggak pernah aku ikuti. Ada yang minta kode OTP. Ada diskon yang muncul jam dua pagi. [pause] [determined] Kode OTP nggak aku kasih ke siapa pun. Sebelum scan, aku cek nama merchant-nya. Sebelum checkout, aku tanya diri sendiri: [short pause] [softly] butuh, atau cuma pengin?
```

## Scene 6 — Penutup Surat
**Timecode:** 01:58–02:12 · **VO mulai:** 01:58.5 · **Target maks:** 13 dtk
**Arah:** Tenang dan tulus. Kalimat terakhir seperti salam hormat, tidak dramatis.

```
[warmly] Mas, aku nggak perlu angkat senjata. Yang aku jaga lebih kecil: uang di saku sendiri, dan kepercayaan orang pada uang itu. [pause] [softly] Surat ini aku tulis di Jalan Mastrip. [short pause] Hormat dari pelajar tahun 2026.
```

---

## Daftar Tag yang Dipakai

| Tag | Fungsi |
| :--- | :--- |
| `[curious]` `[thoughtful]` | Bertanya, menceritakan hal baru |
| `[warmly]` `[softly]` | Hangat, lembut |
| `[confident]` `[cheerful]` | Yakin, ringan |
| `[serious]` `[cautious]` `[determined]` | Waspada, tegas |
| `[pause]` `[short pause]` `[long pause]` | Jeda |

## Nama File

| Scene | Nama file |
| :-: | :--- |
| 1 | `vo2_s1_pembuka.mp3` |
| 2 | `vo2_s2_mas-trip.mp3` |
| 3 | `vo2_s3_uang-pertama.mp3` |
| 4 | `vo2_s4_caraku-menjaga.mp3` |
| 5 | `vo2_s5_medan-perang.mp3` |
| 6 | `vo2_s6_penutup.mp3` |

## Tips

- Kalau tag terbaca sebagai kata, hapus tag itu.
- "2026" dan "1946" biasanya dibaca benar oleh v3. Kalau salah, tulis "dua ribu dua puluh enam" dan "sembilan belas empat puluh enam".
- "QRIS" dibaca "kyu-ris". Kalau dibaca huruf per huruf, tulis "kiu-ris" di naskah.
