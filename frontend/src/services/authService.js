<<<<<<< HEAD
// ============================================
// src/services/authService.js
// ============================================
import api from './api';

export const authService = {
  sendOtp: async (phoneNumber, OTPPurpose = 'Login') => {
    const response = await api.post('/Auth/send-otp', { phoneNumber, OTPPurpose });
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

  login: async (phoneNumber, code) => {
    const response = await api.post('/auth/login', { phoneNumber, code });
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
=======
// ============================================
// src/services/authService.js
// ============================================
import api from './api';

export const authService = {
  sendOtp: async (phoneNumber, OTPPurpose = 'Login') => {
    const response = await api.post('/Auth/send-otp', { phoneNumber, OTPPurpose });
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

  login: async (phoneNumber, code) => {
    const response = await api.post('/auth/login', { phoneNumber, code });
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
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
