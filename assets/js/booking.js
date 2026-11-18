/**
 * booking.js — jQuery Validation form pemesan, penyimpanan ke localStorage,
 *              struk pemesanan, dan riwayat pesanan
 */
window.Cinema = window.Cinema || {};

Cinema.Booking = (function ($, U, ST) {
  'use strict';

  var cfg = Cinema.Config;
  var validator = null;

  /* ---------- Validasi form (jQuery Validation) ---------- */
  function registerRules() {
    $.validator.addMethod('namaValid', function (value, el) {
      return this.optional(el) || /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'.\-\s]*$/.test(value.trim());
    }, 'Nama hanya boleh berisi huruf, spasi, titik, atau tanda hubung.');

    $.validator.addMethod('emailValid', function (value, el) {
      return this.optional(el) || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    }, 'Format email tidak valid (contoh: nama@email.com).');

    // 08xx..., 628xx..., atau +628xx... dengan total 10–13 digit
    $.validator.addMethod('hpIndonesia', function (value, el) {
      var clean = value.replace(/[\s\-]/g, '');
      return this.optional(el) || /^(\+62|62|0)8[1-9][0-9]{7,10}$/.test(clean);
    }, 'Nomor HP tidak valid. Gunakan format 08xxxxxxxxxx.');
  }

  function setupValidation() {
    registerRules();

    validator = $('#bookingForm').validate({
      errorElement: 'div',
      errorClass: 'is-invalid',
      validClass: 'is-valid',
      rules: {
        customerName:  { required: true, minlength: 3, maxlength: 60, namaValid: true },
        customerEmail: { required: true, emailValid: true },
        customerPhone: { required: true, hpIndonesia: true }
      },
      messages: {
        customerName: {
          required: 'Nama lengkap wajib diisi.',
          minlength: 'Nama minimal 3 karakter.',
          maxlength: 'Nama maksimal 60 karakter.'
        },
        customerEmail: { required: 'Email wajib diisi.' },
        customerPhone: { required: 'Nomor HP wajib diisi.' }
      },
      errorPlacement: function (error, element) {
        error.addClass('invalid-feedback');
        error.insertAfter(element);
      },
      submitHandler: function () {
        submitBooking();
        return false;
      },
      invalidHandler: function () {
        if (!Cinema.Seats.getState().selected.length) {
          U.toast('Pilih minimal 1 kursi terlebih dahulu.', 'warning');
        }
      }
    });
  }

  function resetForm() {
    var form = document.getElementById('bookingForm');
    if (!form) return;
    form.reset();
    if (validator) validator.resetForm();
    $('#bookingForm .form-control').removeClass('is-valid is-invalid');
  }

  /* ---------- Submit pemesanan ---------- */
  function submitBooking() {
    var s = Cinema.Seats.getState();

    if (!s.selected.length) {
      U.toast('Pilih minimal 1 kursi terlebih dahulu.', 'warning');
      return;
    }
    if (s.selected.length > cfg.MAX_SEATS) {
      U.toast('Maksimal ' + cfg.MAX_SEATS + ' kursi per pemesanan.', 'warning');
      return;
    }

    // pastikan kursi belum diambil pemesanan lain (misal dari tab lain)
    var taken = ST.getBookedSeats(s.schedule.id);
    var conflict = s.selected.filter(function (id) { return taken.indexOf(id) !== -1; });
    if (conflict.length) {
      U.toast('Kursi ' + conflict.join(', ') + ' baru saja dipesan. Silakan pilih kursi lain.', 'danger');
      Cinema.Seats.open(s.schedule.id);
      return;
    }

    var booking = {
      id: ST.generateBookingCode(),
      createdAt: new Date().toISOString(),
      movie: {
        id: s.movie.id,
        title: s.movie.title,
        genre: s.movie.genre,
        duration: s.movie.duration,
        poster: s.movie.poster
      },
      schedule: {
        id: s.schedule.id,
        studio: s.schedule.studio,
        studioType: s.schedule.studioType,
        date: s.schedule.date,
        time: s.schedule.time,
        price: s.schedule.price
      },
      seats: s.selected,
      total: s.selected.length * s.schedule.price,
      customer: {
        name: $.trim($('#customerName').val()),
        email: $.trim($('#customerEmail').val()),
        phone: $.trim($('#customerPhone').val())
      }
    };

    if (!ST.saveBooking(booking)) {
      U.toast('Gagal menyimpan pemesanan ke penyimpanan browser.', 'danger');
      return;
    }

    renderReceipt(booking);
    updateBadge();
    resetForm();
    U.switchModal('#seatModal', '#receiptModal');
    U.toast('Pemesanan berhasil! Kode: ' + booking.id, 'success');
  }

  /* ---------- Struk ---------- */
  function receiptHTML(b) {
    var e = U.escapeHtml;
    var seatsHTML = b.seats.map(function (id) { return '<span>' + e(id) + '</span>'; }).join('');
    var created = new Date(b.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

    return '' +
      '<div class="ticket">' +
        '<div class="ticket-head">' +
          '<div class="ticket-brand"><i class="bi bi-film"></i> VELVET CINEMA</div>' +
          '<div class="ticket-code">Kode Pemesanan<strong>' + e(b.id) + '</strong></div>' +
        '</div>' +

        '<div class="ticket-body">' +
          '<div class="ticket-movie">' +
            '<img src="' + e(b.movie.poster) + '" alt="Poster film ' + e(b.movie.title) + '">' +
            '<div>' +
              '<span class="genre-tag">' + e(b.movie.genre) + '</span>' +
              '<h4>' + e(b.movie.title) + '</h4>' +
              '<small>' + U.formatDuration(b.movie.duration) + '</small>' +
            '</div>' +
          '</div>' +
          '<dl class="ticket-grid">' +
            '<div class="full"><dt>Tanggal</dt><dd>' + e(U.formatDateLong(b.schedule.date)) + '</dd></div>' +
            '<div><dt>Jam Tayang</dt><dd>' + e(b.schedule.time) + ' WIB</dd></div>' +
            '<div><dt>Studio</dt><dd>' + e(b.schedule.studio) + ' · ' + e(b.schedule.studioType) + '</dd></div>' +
            '<div class="full"><dt>Kursi</dt><dd><div class="ticket-seats">' + seatsHTML + '</div></dd></div>' +
          '</dl>' +
        '</div>' +

        '<div class="ticket-divider"></div>' +

        '<div class="ticket-body">' +
          '<table class="ticket-price">' +
            '<tr><td>Harga per kursi</td><td>' + U.formatRupiah(b.schedule.price) + '</td></tr>' +
            '<tr><td>Jumlah kursi</td><td>' + b.seats.length + '</td></tr>' +
            '<tr class="total"><td>Total Bayar</td><td>' + U.formatRupiah(b.total) + '</td></tr>' +
          '</table>' +
          '<dl class="ticket-grid">' +
            '<div class="full"><dt>Nama Pemesan</dt><dd>' + e(b.customer.name) + '</dd></div>' +
            '<div><dt>Email</dt><dd>' + e(b.customer.email) + '</dd></div>' +
            '<div><dt>Nomor HP</dt><dd>' + e(b.customer.phone) + '</dd></div>' +
          '</dl>' +
          '<div class="ticket-barcode" aria-hidden="true"></div>' +
          '<p class="ticket-foot">Dipesan pada ' + e(created) + ' &middot; Tunjukkan struk ini di loket</p>' +
        '</div>' +
      '</div>';
  }

  function renderReceipt(booking) {
    $('#receiptBody').html(receiptHTML(booking));
  }

  /* ---------- Riwayat ---------- */
  function updateBadge() {
    var count = ST.getBookings().length;
    $('#historyBadge').text(count).prop('hidden', count === 0);
  }

  function renderHistory() {
    var list = ST.getBookings();
    var e = U.escapeHtml;

    if (!list.length) {
      $('#historyBody').html(
        '<div class="history-empty"><i class="bi bi-ticket-perforated"></i>' +
        '<p class="mb-1">Belum ada pesanan.</p><small>Pesanan yang kamu buat akan tersimpan di sini.</small></div>'
      );
      return;
    }

    var html = list.map(function (b) {
      return '' +
        '<div class="history-item" data-id="' + e(b.id) + '">' +
          '<img src="' + e(b.movie.poster) + '" alt="Poster film ' + e(b.movie.title) + '">' +
          '<div>' +
            '<h6>' + e(b.movie.title) + '</h6>' +
            '<p class="meta">' +
              '<strong>' + e(b.id) + '</strong><br>' +
              e(U.formatDateLong(b.schedule.date)) + ' · ' + e(b.schedule.time) + ' WIB · ' + e(b.schedule.studio) + '<br>' +
              'Kursi: ' + e(b.seats.join(', ')) +
            '</p>' +
            '<span class="h-total">' + U.formatRupiah(b.total) + '</span>' +
          '</div>' +
          '<div class="history-actions">' +
            '<button type="button" class="btn btn-outline-gold btn-view" data-id="' + e(b.id) + '"><i class="bi bi-receipt"></i> Struk</button>' +
            '<button type="button" class="btn btn-cancel btn-delete" data-id="' + e(b.id) + '"><i class="bi bi-x-circle"></i> Batalkan</button>' +
          '</div>' +
        '</div>';
    }).join('');

    $('#historyBody').html('<div class="history-list">' + html + '</div>');
  }

  function bindHistory() {
    $('#historyModal').on('show.bs.modal', renderHistory);

    $('#historyBody').on('click', '.btn-view', function () {
      var booking = ST.getBookingById($(this).data('id'));
      if (!booking) return;
      renderReceipt(booking);
      U.switchModal('#historyModal', '#receiptModal');
    });

    $('#historyBody').on('click', '.btn-delete', function () {
      var id = $(this).data('id');
      if (!window.confirm('Batalkan pesanan ' + id + '? Kursi akan tersedia kembali.')) return;
      ST.deleteBooking(id);
      renderHistory();
      updateBadge();
      U.toast('Pesanan ' + id + ' dibatalkan.', 'info');
    });

    $('#btnPrint').on('click', function () { window.print(); });
  }

  function init() {
    setupValidation();
    bindHistory();
    updateBadge();
  }

  return { init: init, resetForm: resetForm };
})(jQuery, Cinema.Utils, Cinema.Storage);
