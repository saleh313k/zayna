// ============================================
// src/services/salonService.js
// ============================================
import api from './api';

export const salonService = {
  getAllSalons: async (page = 1, pageSize = 20) => {
    const response = await api.get('/salon', { params: { page, pageSize } });
    return response.data;
  },

  getSalonById: async (id) => {
    const response = await api.get(`/salon/${id}`);
    return response.data;
  },

  getSalonServices: async (id) => {
    const response = await api.get(`/salon/${id}/services`);
    return response.data;
  },

  getSalonStylists: async (id) => {
    const response = await api.get(`/salon/${id}/stylists`);
    return response.data;
  },

  getSalonBookings: async (id, date = null) => {
    const params = date ? { date } : {};
    const response = await api.get(`/salon/${id}/bookings`, { params });
    return response.data;
  }
};

export const getAllSalons = async (city = null) => {
  const url = city ? `/Salon?city=${city}` : '/Salon';
  const response = await api.get(url);
  return response.data;
};

export const getSalonById = async (salonId) => {
  const response = await api.get(`/Salon/${salonId}`);
  return response.data;
};

export const getSalonServices = async (salonId) => {
  const response = await api.get(`/Service/salon/${salonId}`);
  return response.data;
};

export const getSalonStylists = async (salonId) => {
  const response = await api.get(`/Salon/${salonId}/stylists`);
  return response.data;
};