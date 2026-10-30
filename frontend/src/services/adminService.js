// ============================================
// src/services/adminService.js
// Admin-only API calls (all endpoints require the Admin role on the server).
// ============================================
import api from './api';

// Drop empty filters so they are not sent as empty query strings.
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));

export const adminService = {
  getStats: async () => (await api.get('/admin/stats')).data,

  getSalons: async (params) => (await api.get('/admin/salons', { params: clean(params) })).data,
  setSalonVerification: async (id, isVerified) =>
    (await api.put(`/admin/salons/${id}/verification`, { isVerified })).data,

  getUsers: async (params) => (await api.get('/admin/users', { params: clean(params) })).data,
  setUserActive: async (id, isActive) => (await api.put(`/admin/users/${id}/status`, { isActive })).data,

  getBookings: async (params) => (await api.get('/admin/bookings', { params: clean(params) })).data,
};
