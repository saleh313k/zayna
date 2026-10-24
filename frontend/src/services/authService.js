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

  // Create a customer account with email + password.
  emailRegister: async ({ fullName, email, password }) => {
    const response = await api.post('/auth/register-email', { fullName, email, password });
    return response.data;
  },

  emailLogin: async ({ email, password }) => {
    const response = await api.post('/auth/login-email', { email, password });
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
