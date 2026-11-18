/**
 * utils.js — fungsi bantu umum (format, escape HTML, toast, pindah modal)
 */
window.Cinema = window.Cinema || {};

Cinema.Utils = (function ($) {
  'use strict';

  var rupiahFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  });

  /** 45000 -> "Rp 45.000" */
  function formatRupiah(number) {
    return rupiahFormatter.format(number).replace(/ /g, ' ');
  }

  /** "2026-11-18" -> Date (waktu lokal, bukan UTC) */
  function parseISODate(iso) {
    var p = iso.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }

  /** Date -> "YYYY-MM-DD" (waktu lokal) */
  function toISODate(date) {
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return date.getFullYear() + '-' + m + '-' + d;
  }

  /** "2026-11-18" -> "Rabu, 18 November 2026" */
  function formatDateLong(iso) {
    return parseISODate(iso).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  /** 118 -> "1j 58m" */
  function formatDuration(minutes) {
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    return ((h ? h + 'j ' : '') + (m ? m + 'm' : '')).trim();
  }

  /** Rating skala 10 -> 5 ikon bintang (penuh / setengah / kosong) */
  function starsHTML(rating) {
    var value = rating / 2;
    var html = '';
    for (var i = 1; i <= 5; i++) {
      if (value >= i - 0.25) html += '<i class="bi bi-star-fill"></i>';
      else if (value >= i - 0.75) html += '<i class="bi bi-star-half"></i>';
      else html += '<i class="bi bi-star"></i>';
    }
    return html;
  }

  /** Cegah XSS saat menampilkan input pengguna lewat template HTML */
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Urutkan kode kursi: A1, A2, ... B1, B2 ... */
  function sortSeats(list) {
    return list.slice().sort(function (a, b) {
      if (a.charAt(0) !== b.charAt(0)) return a.charAt(0) < b.charAt(0) ? -1 : 1;
      return parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10);
    });
  }

  /** Tampilkan toast Bootstrap. type: info | success | warning | danger */
  function toast(message, type) {
    type = type || 'info';
    var icons = {
      info: 'bi-info-circle-fill',
      success: 'bi-check-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      danger: 'bi-x-octagon-fill'
    };
    var $el = $(
      '<div class="toast vc-toast vc-toast-' + type + '" role="alert" aria-live="assertive" aria-atomic="true">' +
        '<div class="d-flex">' +
          '<div class="toast-body"><i class="bi ' + icons[type] + ' me-2"></i>' + escapeHtml(message) + '</div>' +
          '<button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Tutup"></button>' +
        '</div>' +
      '</div>'
    );
    $('#toastContainer').append($el);
    $el.on('hidden.bs.toast', function () { $el.remove(); });
    new bootstrap.Toast($el[0], { delay: 3400 }).show();
  }

  /**
   * Tutup satu modal lalu buka modal lain setelah animasi selesai,
   * supaya backdrop & scroll Bootstrap tidak bentrok.
   */
  function switchModal(fromSelector, toSelector) {
    var fromEl = document.querySelector(fromSelector);
    var toEl = document.querySelector(toSelector);
    var showTo = function () { bootstrap.Modal.getOrCreateInstance(toEl).show(); };
    var fromInstance = bootstrap.Modal.getInstance(fromEl);

    if (fromInstance && fromEl.classList.contains('show')) {
      fromEl.addEventListener('hidden.bs.modal', showTo, { once: true });
      fromInstance.hide();
    } else {
      showTo();
    }
  }

  return {
    formatRupiah: formatRupiah,
    parseISODate: parseISODate,
    toISODate: toISODate,
    formatDateLong: formatDateLong,
    formatDuration: formatDuration,
    starsHTML: starsHTML,
    escapeHtml: escapeHtml,
    sortSeats: sortSeats,
    toast: toast,
    switchModal: switchModal
  };
})(jQuery);
