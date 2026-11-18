
Website pemesanan tiket bioskop online dengan tema mewah **hitam, merah (kursi teater), dan emas**.
Dibuat dengan HTML, CSS, JavaScript murni + Bootstrap 5 + jQuery (tanpa Tailwind, tanpa backend).

## Cara menjalankan

1. Ekstrak file ZIP.
2. Buka `index.html` di browser (klik dua kali).

> Perlu koneksi internet saat pertama dibuka, karena Bootstrap, jQuery, jQuery Validation, Bootstrap Icons, dan Google Fonts dimuat lewat CDN.

## Struktur folder

```
velvet-cinema/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   └── style.css          # seluruh gaya (tema hitam-merah-emas, responsive)
    ├── js/
    │   ├── utils.js           # format Rupiah/tanggal, escape HTML, toast, pindah modal
    │   ├── data.js            # data Film, Jadwal, Kursi (+ konfigurasi)
    │   ├── storage.js         # baca/tulis pemesanan di localStorage
    │   ├── movies.js          # Bootstrap Card, filter genre, modal jadwal tayang
    │   ├── seats.js           # jQuery Seat Selection + jQuery Calculation
    │   ├── booking.js         # jQuery Validation, struk, riwayat pesanan
    │   └── main.js            # inisialisasi aplikasi
    └── img/
        ├── favicon.svg
        └── posters/           # 8 poster film (SVG, desain orisinal)
```

## Data yang dikelola

| Data   | Isi |
|--------|-----|
| Film   | judul, genre, durasi, rating, poster (+ sinopsis, batas usia) |
| Jadwal | film, studio, tanggal, jam, harga (dibuat otomatis untuk 3 hari mulai hari ini) |
| Kursi  | baris (A–H), nomor (1–10), status (`tersedia` / `terisi`) |

Data ada di `assets/js/data.js`. Untuk menambah film, tambahkan objek baru ke array `movies` dan letakkan posternya di `assets/img/posters/`.

## Fitur

- Daftar film dalam **Bootstrap Card** lengkap dengan poster, genre, durasi, dan **rating**.
- **Filter genre** (Semua, Thriller, Aksi, Horor, Romantis, Sci-Fi, Komedi, Animasi, Drama).
- Klik film membuka **Bootstrap Modal** berisi detail dan **jadwal tayang** (per tanggal, studio, jam, harga, sisa kursi).
- Pilih jadwal membuka **grid kursi 8 baris × 10 kolom**.
- Klik kursi untuk memilih atau membatalkan (berubah warna emas). Kursi terisi berwarna abu-abu dan tidak bisa diklik.
- **Maksimal 6 kursi** per pemesanan.
- **Total harga otomatis** (jumlah kursi × harga jadwal) dengan animasi hitung.
- **Form pemesan** (Bootstrap Form) dengan **jQuery Validation**: nama, email, nomor HP Indonesia.
- Setelah submit tampil **struk pemesanan** (film, jadwal, kursi, total harga, data pemesan) yang bisa dicetak.
- Semua pemesanan disimpan di **localStorage** (kunci `velvetCinema.bookings.v1`).
  Kursi yang sudah dipesan otomatis berstatus terisi pada jadwal yang sama.
- Tombol **Pesanan Saya** untuk melihat ulang struk atau membatalkan pesanan (kursi kembali tersedia).

## Catatan

- Karena tidak ada server, kursi terisi bawaan dibuat otomatis dan stabil per jadwal. Kursi yang kamu pesan disimpan di browser yang sama.
- Untuk mengosongkan semua pesanan: buka DevTools → Application → Local Storage → hapus `velvetCinema.bookings.v1`.
- Judul film, sinopsis, dan poster adalah fiksi buatan sendiri.
