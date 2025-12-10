// ============================================
// src/services/bookingService.js
// ============================================
import api from './api';

export const bookingService = {
  getAvailableSlots: async (stylistId, serviceId, date) => {
    const response = await api.get('/booking/available-slots', {
      params: { stylistId, serviceId, date }
    });
    return response.data;
  },

  createBooking: async (bookingData) => {
    const response = await api.post('/booking', bookingData);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await api.get('/booking/my-bookings');
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await api.get(`/booking/${id}`);
    return response.data;
  },

  cancelBooking: async (id, reason) => {
    const response = await api.post(`/booking/${id}/cancel`, reason);
    return response.data;
  }
};

export const getAvailableSlots = async (stylistId, date) => {
  const response = await api.get(`/Booking/available-slots?stylistId=${stylistId}&date=${date}`);
  return response.data;
};

export const createBooking = async (bookingData) => {
  const response = await api.post('/Booking', bookingData);
  return response.data;
};

export const getMyBookings = async () => {
  const response = await api.get('/Booking/my-bookings');
  return response.data;
};

export const cancelBooking = async (bookingId, reason) => {
  const response = await api.post(`/Booking/${bookingId}/cancel`, { reason });
  return response.data;
};