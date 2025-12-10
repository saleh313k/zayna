// ============================================
// src/services/authService.js
// ============================================
import api from './api';

export const authService = {
  sendOtp: async (phoneNumber, purpose = 'Login') => {
    const response = await api.post('/auth/send-otp', { phoneNumber, purpose });
    return response.data;
  },

  verifyOtp: async (phoneNumber, code, purpose = 'Login') => {
    const response = await api.post('/auth/verify-otp', { phoneNumber, code, purpose });
    return response.data;
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (phoneNumber, otpCode) => {
    const response = await api.post('/auth/login', { phoneNumber, otpCode });
    return response.data;
  },

  socialLogin: async (provider, accessToken, email, fullName, externalId) => {
    const response = await api.post('/auth/social-login', {
      provider,
      accessToken,
      email,
      fullName,
      externalId
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
