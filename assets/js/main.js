/**
 * main.js — titik masuk aplikasi
 */
$(function () {
  'use strict';

  Cinema.Movies.init();
  Cinema.Seats.init();
  Cinema.Booking.init();

  // Navbar berubah saat halaman di-scroll
  var $nav = $('#mainNavbar');
  function onScroll() { $nav.toggleClass('scrolled', window.scrollY > 30); }
  $(window).on('scroll', onScroll);
  onScroll();

  // Tutup menu mobile setelah link diklik
  $('#navMenu .nav-link').on('click', function () {
    var el = document.getElementById('navMenu');
    if (el.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(el).hide();
  });

  $('#year').text(new Date().getFullYear());
});
