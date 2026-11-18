/**
 * movies.js — daftar film (Bootstrap Card), filter genre,
 *             modal detail film & jadwal tayang (Bootstrap Modal)
 */
window.Cinema = window.Cinema || {};

Cinema.Movies = (function ($, U, D) {
  'use strict';

  var ALL = 'Semua';
  var activeGenre = ALL;
  var activeDate = null;
  var currentMovie = null;

  /* ---------- Filter genre ---------- */
  function renderGenres() {
    var genres = [ALL].concat(D.getGenres());
    var html = genres.map(function (g) {
      var active = g === ALL;
      return '<button type="button" class="genre-btn' + (active ? ' active' : '') + '" ' +
             'data-genre="' + U.escapeHtml(g) + '" aria-pressed="' + active + '">' + U.escapeHtml(g) + '</button>';
    }).join('');
    $('#genreFilter').html(html);
  }

  /* ---------- Kartu film ---------- */
  function movieCardHTML(m, index) {
    var title = U.escapeHtml(m.title);
    return '' +
      '<div class="col-6 col-md-4 col-xl-3 movie-col">' +
        '<article class="card movie-card h-100" tabindex="0" role="button" data-id="' + m.id + '" ' +
                 'style="animation-delay:' + (index * 60) + 'ms" aria-label="Lihat jadwal film ' + title + '">' +
          '<div class="poster-wrap">' +
            '<img src="' + m.poster + '" class="card-img-top" alt="Poster film ' + title + '" loading="lazy">' +
            '<span class="age-badge">' + U.escapeHtml(m.age) + '</span>' +
            '<span class="rating-badge" title="Rating ' + m.rating.toFixed(1) + ' dari 10"><i class="bi bi-star-fill"></i> ' + m.rating.toFixed(1) + '</span>' +
            '<div class="poster-overlay"><span class="btn btn-gold btn-sm"><i class="bi bi-calendar-event"></i> Lihat Jadwal</span></div>' +
          '</div>' +
          '<div class="card-body">' +
            '<span class="genre-tag">' + U.escapeHtml(m.genre) + '</span>' +
            '<h3 class="card-title">' + title + '</h3>' +
            '<p class="card-meta"><i class="bi bi-clock"></i>' + U.formatDuration(m.duration) + '</p>' +
          '</div>' +
        '</article>' +
      '</div>';
  }

  function renderMovies() {
    var list = D.movies.filter(function (m) {
      return activeGenre === ALL || m.genre === activeGenre;
    });

    $('#movieGrid').html(list.map(movieCardHTML).join(''));
    $('#emptyState').prop('hidden', list.length > 0);
    $('#resultInfo').text(
      'Menampilkan ' + list.length + ' film' + (activeGenre === ALL ? '' : ' genre ' + activeGenre)
    );
  }

  /* ---------- Modal detail & jadwal ---------- */
  function groupDates(schedules) {
    var dates = [];
    schedules.forEach(function (s) { if (dates.indexOf(s.date) === -1) dates.push(s.date); });
    return dates.sort();
  }

  function datePillsHTML(dates) {
    return dates.map(function (iso, i) {
      var d = U.parseISODate(iso);
      var day = d.toLocaleDateString('id-ID', { weekday: 'short' });
      var label = i === 0 ? 'Hari ini' : day;
      var month = d.toLocaleDateString('id-ID', { month: 'short' });
      return '<button type="button" class="date-pill' + (iso === activeDate ? ' active' : '') + '" data-date="' + iso + '">' +
               '<small>' + label + '</small><strong>' + d.getDate() + '</strong><small>' + month + '</small>' +
             '</button>';
    }).join('');
  }

  function scheduleItemHTML(s) {
    var available = D.countAvailable(s.id, Cinema.Storage.getBookedSeats(s.id));
    var soldOut = available === 0;
    var low = available <= 12;
    return '' +
      '<button type="button" class="schedule-item" data-id="' + s.id + '"' + (soldOut ? ' disabled' : '') + '>' +
        '<span class="sch-time">' + s.time + '</span>' +
        '<span class="sch-studio"><strong>' + U.escapeHtml(s.studio) + '</strong><small>' + U.escapeHtml(s.studioType) + '</small></span>' +
        '<span class="sch-avail' + (low ? ' low' : '') + '">' + (soldOut ? 'Habis' : available + ' kursi tersisa') + '</span>' +
        '<span class="sch-price">' + U.formatRupiah(s.price) + '<small>per kursi</small></span>' +
      '</button>';
  }

  function renderScheduleList() {
    var list = D.getSchedulesByMovie(currentMovie.id)
      .filter(function (s) { return s.date === activeDate; })
      .sort(function (a, b) { return a.time < b.time ? -1 : 1; });

    $('#scheduleList').html(list.map(scheduleItemHTML).join(''));
  }

  function openMovie(id) {
    var m = D.getMovieById(id);
    if (!m) return;
    currentMovie = m;

    var dates = groupDates(D.getSchedulesByMovie(m.id));
    activeDate = dates[0];

    var title = U.escapeHtml(m.title);
    var html = '' +
      '<div class="row g-4">' +
        '<div class="col-sm-4 col-md-4">' +
          '<img class="detail-poster" src="' + m.poster + '" alt="Poster film ' + title + '">' +
        '</div>' +
        '<div class="col-sm-8 col-md-8">' +
          '<span class="genre-tag">' + U.escapeHtml(m.genre) + '</span>' +
          '<h2 class="detail-title" id="movieModalTitle">' + title + '</h2>' +
          '<div class="detail-meta">' +
            '<span><i class="bi bi-clock"></i>' + U.formatDuration(m.duration) + '</span>' +
            '<span class="stars" aria-label="Rating ' + m.rating.toFixed(1) + ' dari 10">' + U.starsHTML(m.rating) + '<strong>' + m.rating.toFixed(1) + '</strong></span>' +
            '<span class="age-chip">' + U.escapeHtml(m.age) + '</span>' +
          '</div>' +
          '<p class="detail-synopsis">' + U.escapeHtml(m.synopsis) + '</p>' +
        '</div>' +
      '</div>' +
      '<h6 class="section-label">Pilih Tanggal</h6>' +
      '<div class="date-pills" id="datePills">' + datePillsHTML(dates) + '</div>' +
      '<h6 class="section-label">Jadwal Tayang</h6>' +
      '<div class="schedule-list" id="scheduleList"></div>';

    $('#movieModalBody').html(html);
    renderScheduleList();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('movieModal')).show();
  }

  /* ---------- Event ---------- */
  function bind() {
    // filter genre
    $('#genreFilter').on('click', '.genre-btn', function () {
      activeGenre = $(this).data('genre');
      $('#genreFilter .genre-btn').removeClass('active').attr('aria-pressed', 'false');
      $(this).addClass('active').attr('aria-pressed', 'true');
      renderMovies();
    });

    // klik kartu film -> buka modal jadwal
    $('#movieGrid').on('click', '.movie-card', function () {
      openMovie($(this).data('id'));
    });
    $('#movieGrid').on('keydown', '.movie-card', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMovie($(this).data('id'));
      }
    });

    // ganti tanggal
    $('#movieModal').on('click', '.date-pill', function () {
      activeDate = $(this).data('date');
      $('#datePills .date-pill').removeClass('active');
      $(this).addClass('active');
      renderScheduleList();
    });

    // pilih jadwal -> buka grid kursi
    $('#movieModal').on('click', '.schedule-item:not(:disabled)', function () {
      var scheduleId = $(this).data('id');
      Cinema.Seats.open(scheduleId); // dipanggil saat klik, jadi seats.js sudah termuat
      U.switchModal('#movieModal', '#seatModal');
    });
  }

  function init() {
    $('#statMovies').text(D.movies.length);
    renderGenres();
    renderMovies();
    bind();
  }

  return { init: init, openMovie: openMovie };
})(jQuery, Cinema.Utils, Cinema.Data);
