/**
 * storage.js — penyimpanan pemesanan di localStorage
 */
window.Cinema = window.Cinema || {};

Cinema.Storage = (function () {
  'use strict';

  var KEY = 'velvetCinema.bookings.v1';

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function write(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Semua pemesanan, terbaru di atas */
  function getBookings() {
    return read().sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function getBookingById(id) {
    return read().filter(function (b) { return b.id === id; })[0] || null;
  }

  /** @returns {boolean} true bila berhasil disimpan */
  function saveBooking(booking) {
    var list = read();
    list.push(booking);
    return write(list);
  }

  function deleteBooking(id) {
    return write(read().filter(function (b) { return b.id !== id; }));
  }

  /** Kode kursi yang sudah dipesan pada satu jadwal */
  function getBookedSeats(scheduleId) {
    var seats = [];
    read().forEach(function (b) {
      if (b.schedule && b.schedule.id === scheduleId) seats = seats.concat(b.seats);
    });
    return seats;
  }

  function generateBookingCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var code = '';
    do {
      code = 'VC-';
      for (var i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    } while (getBookingById(code));
    return code;
  }

  return {
    getBookings: getBookings,
    getBookingById: getBookingById,
    saveBooking: saveBooking,
    deleteBooking: deleteBooking,
    getBookedSeats: getBookedSeats,
    generateBookingCode: generateBookingCode
  };
})();
