/**
 * seats.js — jQuery Seat Selection + jQuery Calculation
 *
 *  - Grid kursi 8 baris x 10 kolom
 *  - Klik kursi: pilih / batalkan (berubah warna)
 *  - Kursi terisi: disabled & abu-abu
 *  - Maksimal 6 kursi per pemesanan
 *  - Total harga dihitung otomatis dari jumlah kursi
 */
window.Cinema = window.Cinema || {};

Cinema.Seats = (function ($, U, D, ST) {
  'use strict';

  var cfg = Cinema.Config;

  var state = {
    schedule: null,
    movie: null,
    selected: []
  };

  // Objek penampung angka untuk animasi hitung total
  var counter = { value: 0 };

  /* ---------- Render ---------- */
  function seatHTML(seat) {
    var taken = seat.status === 'terisi';
    return '<button type="button" class="seat ' + (taken ? 'occupied' : 'available') + '" ' +
           'data-seat="' + seat.id + '" ' +
           (taken ? 'disabled ' : '') +
           'aria-label="Kursi ' + seat.id + ', ' + (taken ? 'terisi' : 'tersedia') + '" ' +
           'aria-pressed="false">' + seat.num + '</button>';
  }

  function renderGrid() {
    var booked = ST.getBookedSeats(state.schedule.id);
    var map = D.getSeatMap(state.schedule.id, booked);

    var html = map.map(function (rowData) {
      var cells = '';
      rowData.seats.forEach(function (seat) {
        cells += seatHTML(seat);
        if (seat.num === cfg.AISLE_AFTER) cells += '<span class="aisle" aria-hidden="true"></span>';
      });
      return '<div class="seat-row">' +
               '<span class="row-label" aria-hidden="true">' + rowData.row + '</span>' +
               cells +
               '<span class="row-label" aria-hidden="true">' + rowData.row + '</span>' +
             '</div>';
    }).join('');

    $('#seatGrid').html(html);
  }

  function renderHeader() {
    var m = state.movie;
    var s = state.schedule;

    $('#seatModalTitle').text(m.title);
    $('#sumPoster').attr({ src: m.poster, alt: 'Poster film ' + m.title });
    $('#sumGenre').text(m.genre);
    $('#sumTitle').text(m.title);
    $('#sumDuration').text(U.formatDuration(m.duration) + ' · ' + m.age);
    $('#sumDate').text(U.formatDateLong(s.date));
    $('#sumTime').text(s.time + ' WIB');
    $('#sumStudio').text(s.studio + ' (' + s.studioType + ')');
    $('#sumPrice').text(U.formatRupiah(s.price));
    $('#maxSeatsLabel, #seatMax').text(cfg.MAX_SEATS);
  }

  /* ---------- Kalkulasi ---------- */
  function calculateTotal() {
    return state.selected.length * (state.schedule ? state.schedule.price : 0);
  }

  function animateTotal(target) {
    $(counter).stop(true).animate({ value: target }, {
      duration: 350,
      step: function (now) { $('#totalPrice').text(U.formatRupiah(Math.round(now))); },
      complete: function () { counter.value = target; $('#totalPrice').text(U.formatRupiah(target)); }
    });
  }

  function updateSummary() {
    var count = state.selected.length;
    var price = state.schedule ? state.schedule.price : 0;

    // chip kursi terpilih
    var sorted = U.sortSeats(state.selected);
    $('#sumSeats').html(
      count
        ? sorted.map(function (id) { return '<span class="seat-chip">' + id + '</span>'; }).join('')
        : '<span class="none">Belum dipilih</span>'
    );

    $('#seatCount').text(count);
    $('#sumFormula').text(count + ' kursi × ' + U.formatRupiah(price));
    animateTotal(calculateTotal());
  }

  /* ---------- Interaksi kursi ---------- */
  function toggleSeat($seat) {
    if ($seat.hasClass('occupied') || $seat.prop('disabled')) return;

    var id = $seat.data('seat');
    var index = state.selected.indexOf(id);

    if (index > -1) {
      // batalkan pilihan
      state.selected.splice(index, 1);
      $seat.removeClass('selected').addClass('available').attr('aria-pressed', 'false');
    } else {
      // batas maksimal kursi
      if (state.selected.length >= cfg.MAX_SEATS) {
        $seat.addClass('shake');
        setTimeout(function () { $seat.removeClass('shake'); }, 400);
        U.toast('Maksimal ' + cfg.MAX_SEATS + ' kursi per pemesanan.', 'warning');
        return;
      }
      state.selected.push(id);
      $seat.removeClass('available').addClass('selected').attr('aria-pressed', 'true');
    }

    updateSummary();
  }

  /* ---------- Public API ---------- */
  function open(scheduleId) {
    var schedule = D.getScheduleById(scheduleId);
    if (!schedule) return;

    state.schedule = schedule;
    state.movie = D.getMovieById(schedule.movieId);
    state.selected = [];

    // reset form pemesan
    if (Cinema.Booking) Cinema.Booking.resetForm();

    renderHeader();
    renderGrid();

    $(counter).stop(true);
    counter.value = 0;
    $('#totalPrice').text(U.formatRupiah(0));
    updateSummary();
  }

  function getState() {
    return {
      schedule: state.schedule,
      movie: state.movie,
      selected: U.sortSeats(state.selected),
      total: calculateTotal()
    };
  }

  function init() {
    $('#seatGrid').on('click', '.seat', function () {
      toggleSeat($(this));
    });

    $('#btnBackToSchedule').on('click', function () {
      U.switchModal('#seatModal', '#movieModal');
    });
  }

  return { init: init, open: open, getState: getState, calculateTotal: calculateTotal };
})(jQuery, Cinema.Utils, Cinema.Data, Cinema.Storage);
