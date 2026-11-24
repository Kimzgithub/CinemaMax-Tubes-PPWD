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
      id: 1, title: '3726 MDPL', genre: 'Petualangan', duration: 118, rating: 9.0, age: '17+',
      poster: 'assets/img/posters/3726MDPL.jpg',
      synopsis: 'mengisahkan perjalanan cinta, luka batin, dan pendewasaan diri antara Rangga Raja dan Andini Hangura dengan latar ketinggian puncak Gunung Rinjani (3.726 meter di atas permukaan laut)'
    },
    {
      id: 2, title: 'Gak Ada Matinya', genre: 'komedi', duration: 132, rating: 8.1, age: '13+',
      poster: 'assets/img/posters/gakadamatinya.jpg',
      synopsis: 'Film ini menawarkan alur cerita tentang dinamika keluarga yang unik dengan balutan komedi gelap yang segar dan penuh kejutan.'
    },
    {
      id: 3, title: 'People Pleaser', genre: 'komedi', duration: 104, rating: 7.6, age: '17+',
      poster: 'assets/img/posters/peoplepleaser.jpg',
      synopsis: 'Karina, seorang pegawai kantoran yang dikenal sulit menolak permintaan orang lain, harus belajar berkata "tidak" agar bisa hidup lebih bahagia dan tidak selalu mengesampingkan kebutuhan pribadinya.'
    },
    {
      id: 4, title: 'Hamka: Awal Mula Vol. 3', genre: 'Biografi', duration: 109, rating: 8.0, age: 'SU',
      poster: 'assets/img/posters/hamkavol3.jpg',
      synopsis: 'Menyoroti perjalanan hidup ulama sekaligus sastrawan besar Indonesia, Buya Hamka, sejak masa mudanya di Maninjau hingga merantau ke Mekkah untuk mencari jati diri.'
    },
    {
      id: 5, title: 'Piye To Kih?', genre: 'komedi', duration: 141, rating: 8.7, age: '18+',
      poster: 'assets/img/posters/piyeiki.jpg',
      synopsis: 'Mukidi ingin membuktikan dirinya pantas menikahi perempuan impiannya, namun ia malah bertemu dengan Sukma, perempuan misterius dari alam berbeda di rumah murah yang baru dibelinya.'
    },
    {
      id: 6, title: 'Menang untuk Kalah', genre: 'Keluarga', duration: 98, rating: 7.4, age: '13+',
      poster: 'assets/img/posters/menanguntukkalah.jpg',
      synopsis: 'Sebuah drama keluarga emosional yang mengangkat persoalan serius mengenai adiksi judi online dan dampaknya yang mengancam kerukunan serta masa depan sebuah keluarga.'
    },
    {
      id: 7, title: 'Sumpah Darah', genre: 'Horor', duration: 95, rating: 8.2, age: '21+',
      poster: 'assets/img/posters/sumpahdarah.jpg',
      synopsis: 'Mengisahkan tentang sebuah sumpah terlarang di masa lalu yang kini menuntut balas dan meneror kehidupan keturunan mereka yang masih hidup di masa kini.'
    },
    {
      id: 8, title: 'Focker In-Law', genre: 'komedi', duration: 126, rating: 8.5, age: '21+',
      poster: 'assets/img/posters/fockerinlaw.jpg',
      synopsis: 'Pertemuan dua keluarga besar dengan latar belakang dan budaya yang sangat berbeda memicu berbagai kejadian kocak saat mereka berusaha menyatukan perbedaan demi anak-anak mereka.'
    },
  ];

  /* ---------- STUDIO ---------- */
  var studios = [
    { name: 'Studio 1', type: 'Regular',     price: 45000 },
    { name: 'Studio 2', type: 'Premiere',    price: 60000 },
    { name: 'Studio 3', type: 'Gold', price: 90000 }
  ];

  var SHOWTIMES = ['10:30', '13:00', '15:45', '18:30', '21:15'];
  var WEEKEND_SURCHARGE = 10000;

  /* ---------- JADWAL (dibuat otomatis mulai hari ini) ---------- */
  var schedules = [];

  (function buildSchedules() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    // var IsWeekend
    movies.forEach(function (movie, i) {
      for (var d = 0; d < cfg.DAYS_AHEAD; d++) {
        var date = new Date(today);
        date.setDate(today.getDate() + d);
        var iso = U.toISODate(date);
        var isWeekend = date.getDay() === 0 || date.getDay() === 6;

        var times = [0, 1, 2].map(function (k) {
          return SHOWTIMES[(i + d + k * 2) % SHOWTIMES.length];
        }).sort();

        // schedules.push sebenarnya
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

  // akan dipanggil dari seats.js 
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
