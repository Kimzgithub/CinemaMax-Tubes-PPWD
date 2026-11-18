/**
 * data.js — data yang dikelola: Film, Jadwal, Kursi
 *
 *  Film   : judul, genre, durasi, rating, poster
 *  Jadwal : film, studio, tanggal, jam, harga
 *  Kursi  : baris, nomor, status (tersedia / terisi)
 */
window.Cinema = window.Cinema || {};

/* ---------- Konfigurasi ---------- */
Cinema.Config = {
  MAX_SEATS: 6,                                  // batas kursi per pemesanan
  ROWS: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], // 8 baris
  COLS: 10,                                       // 10 kolom
  AISLE_AFTER: 5,                                 // lorong setelah kolom ke-5
  DAYS_AHEAD: 3,                                  // jadwal dibuat untuk 3 hari ke depan
  OCCUPIED_RATIO: 0.28                            // ±28% kursi sudah terisi
};

Cinema.Data = (function (U) {
  'use strict';

  var cfg = Cinema.Config;

  /* ---------- FILM ---------- */
  var movies = [
    {
      id: 1, title: 'Bayangan Terakhir', genre: 'Thriller', duration: 118, rating: 8.4, age: '17+',
      poster: 'assets/img/posters/bayangan-terakhir.svg',
      synopsis: 'Seorang detektif senior menerima surat tanpa nama yang membuka kembali kasus lama. Setiap petunjuk membawanya semakin dekat pada kebenaran yang selama ini terkubur di kotanya sendiri.'
    },
    {
      id: 2, title: 'Langit Merah', genre: 'Aksi', duration: 132, rating: 8.1, age: '13+',
      poster: 'assets/img/posters/langit-merah.svg',
      synopsis: 'Seorang pilot veteran harus menembus badai dan wilayah musuh untuk menyelamatkan ratusan warga sipil. Waktunya hanya sampai matahari terbenam.'
    },
    {
      id: 3, title: 'Rumah di Ujung Kabut', genre: 'Horor', duration: 104, rating: 7.6, age: '17+',
      poster: 'assets/img/posters/rumah-di-ujung-kabut.svg',
      synopsis: 'Sebuah keluarga muda pindah ke rumah tua di lereng gunung. Saat kabut turun setiap senja, mereka mulai menyadari bahwa mereka tidak sendirian.'
    },
    {
      id: 4, title: 'Kopi & Kamu', genre: 'Romantis', duration: 109, rating: 8.0, age: 'SU',
      poster: 'assets/img/posters/kopi-dan-kamu.svg',
      synopsis: 'Barista pemalu bertemu penulis yang selalu memesan kopi yang sama setiap hujan turun. Dari secangkir kopi, tumbuh cerita yang hangat dan tak terduga.'
    },
    {
      id: 5, title: 'Galaksi Nusantara', genre: 'Sci-Fi', duration: 141, rating: 8.7, age: '13+',
      poster: 'assets/img/posters/galaksi-nusantara.svg',
      synopsis: 'Di tahun 2150, awak kapal antariksa dari Nusantara memulai misi melintasi galaksi untuk menemukan rumah baru bagi umat manusia.'
    },
    {
      id: 6, title: 'Tawa Tanpa Henti', genre: 'Komedi', duration: 98, rating: 7.4, age: '13+',
      poster: 'assets/img/posters/tawa-tanpa-henti.svg',
      synopsis: 'Tiga sahabat gagal total mengadakan pernikahan impian di desa terpencil. Satu kesalahan kecil berubah menjadi rentetan kekacauan yang mengundang tawa.'
    },
    {
      id: 7, title: 'Petualangan Si Kancil', genre: 'Animasi', duration: 95, rating: 8.2, age: 'SU',
      poster: 'assets/img/posters/petualangan-si-kancil.svg',
      synopsis: 'Si Kancil yang cerdik harus menyelamatkan hutan dari bendungan raksasa. Dengan akal dan keberanian, ia mengajak seluruh penghuni rimba bersatu.'
    },
    {
      id: 8, title: 'Surat dari Senja', genre: 'Drama', duration: 126, rating: 8.5, age: '13+',
      poster: 'assets/img/posters/surat-dari-senja.svg',
      synopsis: 'Seorang anak menemukan kumpulan surat yang tak pernah terkirim milik ayahnya. Perjalanan menyusuri pesisir mengungkap cinta, penyesalan, dan pengampunan.'
    }
  ];

  /* ---------- STUDIO ---------- */
  var studios = [
    { name: 'Studio 1', type: 'Regular',     price: 45000 },
    { name: 'Studio 2', type: 'Premiere',    price: 60000 },
    { name: 'Studio 3', type: 'Velvet Gold', price: 90000 }
  ];

  var SHOWTIMES = ['10:30', '13:00', '15:45', '18:30', '21:15'];
  var WEEKEND_SURCHARGE = 10000;

  /* ---------- JADWAL (dibuat otomatis mulai hari ini) ---------- */
  var schedules = [];

  (function buildSchedules() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    movies.forEach(function (movie, i) {
      for (var d = 0; d < cfg.DAYS_AHEAD; d++) {
        var date = new Date(today);
        date.setDate(today.getDate() + d);
        var iso = U.toISODate(date);
        var isWeekend = date.getDay() === 0 || date.getDay() === 6;

        var times = [0, 1, 2].map(function (k) {
          return SHOWTIMES[(i + d + k * 2) % SHOWTIMES.length];
        }).sort();

        times.forEach(function (time, k) {
          var studio = studios[(i + d + k) % studios.length];
          schedules.push({
            id: 's' + movie.id + '-' + iso.replace(/-/g, '') + '-' + time.replace(':', ''),
            movieId: movie.id,
            studio: studio.name,
            studioType: studio.type,
            date: iso,
            time: time,
            price: studio.price + (isWeekend ? WEEKEND_SURCHARGE : 0)
          });
        });
      }
    });
  })();

  /* ---------- KURSI ---------- */
  function hashString(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Pseudo-random yang stabil: jadwal yang sama selalu menghasilkan kursi terisi yang sama
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Membuat peta kursi 8 x 10 untuk satu jadwal.
   * @param {string}   scheduleId
   * @param {string[]} extraOccupied kode kursi yang sudah dipesan (dari localStorage)
   * @returns {Array<{row:string, seats:Array<{id,row,num,status}>}>}
   */
  function getSeatMap(scheduleId, extraOccupied) {
    var rand = mulberry32(hashString(scheduleId));
    var extra = extraOccupied || [];

    return cfg.ROWS.map(function (row) {
      var seats = [];
      for (var num = 1; num <= cfg.COLS; num++) {
        var id = row + num;
        var taken = rand() < cfg.OCCUPIED_RATIO || extra.indexOf(id) !== -1;
        seats.push({ id: id, row: row, num: num, status: taken ? 'terisi' : 'tersedia' });
      }
      return { row: row, seats: seats };
    });
  }

  function countAvailable(scheduleId, extraOccupied) {
    var total = 0;
    getSeatMap(scheduleId, extraOccupied).forEach(function (r) {
      r.seats.forEach(function (s) { if (s.status === 'tersedia') total++; });
    });
    return total;
  }

  /* ---------- Query ---------- */
  function getMovieById(id) {
    id = Number(id);
    return movies.filter(function (m) { return m.id === id; })[0] || null;
  }

  function getScheduleById(id) {
    return schedules.filter(function (s) { return s.id === id; })[0] || null;
  }

  function getSchedulesByMovie(movieId) {
    return schedules.filter(function (s) { return s.movieId === Number(movieId); });
  }

  function getGenres() {
    var list = [];
    movies.forEach(function (m) { if (list.indexOf(m.genre) === -1) list.push(m.genre); });
    return list;
  }

  return {
    movies: movies,
    schedules: schedules,
    studios: studios,
    getSeatMap: getSeatMap,
    countAvailable: countAvailable,
    getMovieById: getMovieById,
    getScheduleById: getScheduleById,
    getSchedulesByMovie: getSchedulesByMovie,
    getGenres: getGenres
  };
})(Cinema.Utils);
