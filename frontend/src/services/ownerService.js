// ============================================
// src/services/ownerService.js
// Salon-owner API. Every call works on the signed-in owner's own salon (resolved on the server).
// ============================================
import api from './api';

const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));

export const ownerService = {
  getSalon: async () => (await api.get('/owner/salon')).data,
  updateProfile: async (body) => (await api.put('/owner/salon', body)).data,

  addBranch: async (body) => (await api.post('/owner/branches', body)).data,
  updateBranch: async (id, body) => (await api.put(`/owner/branches/${id}`, body)).data,
  // entries: [{ day: 0-6 (0 = Sunday), openTime: 'HH:mm:ss', closeTime: 'HH:mm:ss', isClosed }]
  updateWorkingHours: async (id, entries) => (await api.put(`/owner/branches/${id}/working-hours`, entries)).data,

  addService: async (body) => (await api.post('/owner/services', body)).data,
  updateService: async (id, body) => (await api.put(`/owner/services/${id}`, body)).data,

  addStylist: async (body) => (await api.post('/owner/stylists', body)).data,
  updateStylist: async (id, body) => (await api.put(`/owner/stylists/${id}`, body)).data,
  addOffDay: async (id, body) => (await api.post(`/owner/stylists/${id}/off-days`, body)).data,
  removeOffDay: async (id, date) => (await api.delete(`/owner/stylists/${id}/off-days/${date}`)).data,

  getStats: async () => (await api.get('/owner/stats')).data,
  getAppointments: async (params) => (await api.get('/owner/appointments', { params: clean(params) })).data,

  // Booking actions share the (tenant-checked) booking endpoints.
  updateBookingStatus: async (id, status) => (await api.put(`/booking/${id}/status`, { status })).data,
  cancelBooking: async (id, reason) => (await api.post(`/booking/${id}/cancel`, { reason: reason || null })).data,
};
