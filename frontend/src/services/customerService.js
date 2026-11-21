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
  },

  // Downloads everything we hold about the customer as a JSON file.
  exportData: async () => {
    const response = await api.get('/customer/me/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zayna-my-data.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Password accounts send currentPassword; Google-only accounts send confirmEmail (their email, typed).
  deleteAccount: async ({ currentPassword, confirmEmail }) => {
    const response = await api.post('/customer/me/delete', { currentPassword, confirmEmail });
    return response.data;
  }
};
