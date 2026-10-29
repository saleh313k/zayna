// ============================================
// src/components/auth/GoogleSignIn.jsx
// Shared Google button: signs in, then reports the server response to the parent.
// ============================================
import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

export const GOOGLE_CONFIGURED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

// text: Google only allows presets: signin_with | signup_with | continue_with | signin
const GoogleSignIn = ({ onSuccess, register = false, role, salon, text = 'signin_with' }) => {
  const { t } = useTranslation();
  const { googleLogin } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!GOOGLE_CONFIGURED) {
    return (
      <p className="text-sm text-red-600 text-center">
        {t('auth.googleNotConfigured', 'Google sign-in is not configured (missing VITE_GOOGLE_CLIENT_ID).')}
      </p>
    );
  }

  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error(t('auth.googleFailed', 'Google sign-in failed. Please try again.'));
      return;
    }
    setBusy(true);
    try {
      const response = await googleLogin(credentialResponse.credential, { register, role, salon });
      toast.success(t('auth.loginSuccess'));
      onSuccess?.(response);
    } catch (error) {
      if (error.response?.data?.code === 'ACCOUNT_NOT_FOUND') {
        toast.error(t('auth.noAccountRegister', 'No account found for this Google account. Please register first.'));
      } else {
        toast.error(error.response?.data?.message || t('auth.googleFailed', 'Google sign-in failed. Please try again.'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`flex justify-center ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
      <GoogleLogin
        text={text}
        onSuccess={handleSuccess}
        onError={() => toast.error(t('auth.googleFailed', 'Google sign-in failed. Please try again.'))}
      />
    </div>
  );
};

export default GoogleSignIn;
