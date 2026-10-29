// ============================================
// src/services/authService.js
// ============================================
import api from './api';

export const authService = {
  // Exchange a Google ID token (credential) for a Zayna session. Verified server-side.
  // Plain sign-in: { idToken }. From the registration wizard pass { register: true, role, salon } so a NEW
  // account is created with the chosen type. Without register: true an unknown Google account is rejected.
  googleLogin: async (idToken, { register = false, role, salon } = {}) => {
    const payload = { idToken };
    if (register) {
      payload.register = true;
      if (role !== undefined && role !== null) payload.role = role;
      if (salon) payload.salon = salon;
    }
    const response = await api.post('/auth/google', payload);
    return response.data;
  },

  // Create a customer account with email + password.
  // role (optional): ROLES.CUSTOMER (default) or ROLES.SALON; for SALON also pass salon details.
  // The server enforces which roles may self-register.
  emailRegister: async ({ fullName, email, password, role, salon }) => {
    const payload = { fullName, email, password };
    if (role !== undefined && role !== null) payload.role = role;
    if (salon) payload.salon = salon;
    const response = await api.post('/auth/register-email', payload);
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
