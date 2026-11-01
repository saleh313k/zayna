// ============================================
// src/services/bookingService.js
// Customer booking API. Dates are "yyyy-MM-dd" (salon local date) and times "HH:mm:ss" (salon local time),
// exactly as the server returns them, so no time-zone conversion can move an appointment to another day.
// ============================================
import api from './api';

export const bookingService = {
  // Public catalog: salons that can be booked online, and what one salon offers.
  getBookableSalons: async (search) =>
    (await api.get('/catalog/salons', { params: search ? { search } : {} })).data,
  getBookingOptions: async (salonId) =>
    (await api.get(`/catalog/salons/${salonId}/booking-options`)).data,

  getAvailableSlots: async (stylistId, serviceId, date) =>
    (await api.get('/booking/available-slots', { params: { stylistId, serviceId, date } })).data,

  // payload: { salonId, branchId, stylistId, serviceId, bookingDate, startTime, paymentType, notes }
  createBooking: async (payload) => (await api.post('/booking', payload)).data,

  getMyBookings: async () => (await api.get('/booking/my-bookings')).data,
  getBookingById: async (id) => (await api.get(`/booking/${id}`)).data,
  cancelBooking: async (id, reason) =>
    (await api.post(`/booking/${id}/cancel`, { reason: reason || null })).data,
};
