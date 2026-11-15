// ============================================
// src/services/customerService.js
// The signed-in customer's own profile (real data from the API).
// ============================================
import api from './api';

export const customerService = {
  getProfile: async () => {
    const response = await api.get('/customer/me');
    return response.data.profile;
  },

  // Only the display name can be changed (email/phone are sign-in identifiers).
  updateProfile: async (fullName) => {
    const response = await api.put('/customer/me', { fullName });
    return response.data;
  }
};
