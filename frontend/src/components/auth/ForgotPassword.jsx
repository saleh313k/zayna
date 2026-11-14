// ============================================
// src/components/auth/ForgotPassword.jsx
// Step 1 of password recovery: ask for a reset link by email.
// The server answers the same way whether or not the address has an account, and so does this page.
// ============================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Logo from '@/assets/img/logo.png';
import { authService } from '../../services/authService';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error(t('auth.tooManyRequests', 'Too many attempts. Please wait a minute and try again.'));
      } else {
        toast.error(error.response?.data?.message || t('common.error'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="card max-w-md w-full">
        <div className="text-center mb-6 flex items-center justify-center">
          <Link to="/" className="flex items-center">
            <img src={Logo} alt="ZAYNA - Your Time to Shine" className="h-16 w-auto object-contain" />
          </Link>
        </div>

        <h2 className="text-2xl font-semibold text-center mb-2">{t('auth.forgotTitle', 'Forgot your password?')}</h2>

        {sent ? (
          <p className="text-center text-gray-700 my-6" role="status">
            {t('auth.resetEmailSent')}
          </p>
        ) : (
          <>
            <p className="text-center text-gray-600 mb-6">
              {t('auth.forgotIntro', 'Enter your email and we will send you a link to choose a new password.')}
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                className="w-full border rounded px-3 py-2"
                type="email"
                autoComplete="email"
                required
                maxLength={256}
                placeholder={t('auth.email', 'Email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? t('common.loading', 'Loading...') : t('auth.sendResetLink', 'Send reset link')}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm mt-6">
          <Link to="/login" className="text-primary font-medium">
            {t('auth.backToLogin', 'Back to sign in')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
