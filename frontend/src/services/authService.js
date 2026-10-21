// ============================================
// src/services/authService.js
// ============================================
import api from './api';

export const authService = {
  // Exchange a Google ID token (credential) for a Zayna session. Verified server-side.
  googleLogin: async (idToken) => {
    const response = await api.post('/auth/google', { idToken });
    return response.data;
  },

  // Upgrade the signed-in customer to a salon owner (salon stays hidden until an admin approves).
  registerSalon: async ({ salonName, salonNameAr, contactPhone, city, addressLine }) => {
    const response = await api.post('/auth/register-salon', {
      salonName,
      salonNameAr: salonNameAr || null,
      contactPhone,
      city,
      addressLine
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
