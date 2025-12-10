// ============================================
// src/utils/validators.js
// ============================================
export const validatePhone = (phone) => {
  const omanPhoneRegex = /^\+968[0-9]{8}$/;
  return omanPhoneRegex.test(phone);
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};

export const formatPhoneNumber = (phone) => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Add Oman country code if not present
  if (!cleaned.startsWith('968')) {
    return '+968' + cleaned;
  }
  
  return '+' + cleaned;
};