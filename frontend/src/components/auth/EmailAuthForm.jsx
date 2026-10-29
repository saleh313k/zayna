// ============================================
// src/components/auth/EmailAuthForm.jsx
// Email + password sign-in / account creation (alternative to Google sign-in).
// ============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const EmailAuthForm = ({ defaultMode = 'login', role, salon, onSuccess }) => {
  const { t } = useTranslation();
  const { emailLogin, emailRegister } = useAuth();
  const [mode, setMode] = useState(defaultMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const response = isRegister
        ? await emailRegister({ fullName, email, password, role, salon })
        : await emailLogin({ email, password });
      toast.success(t('auth.loginSuccess'));
      onSuccess?.(response);
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

  const inputClass = 'w-full border rounded px-3 py-2';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex rounded overflow-hidden border text-sm">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 py-2 ${!isRegister ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
        >
          {t('auth.signInTab', 'Sign in')}
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 py-2 ${isRegister ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
        >
          {t('auth.createAccountTab', 'Create account')}
        </button>
      </div>

      {isRegister && (
        <input
          className={inputClass}
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
          placeholder={t('auth.fullName', 'Full name')}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      )}
      <input
        className={inputClass}
        type="email"
        autoComplete="email"
        required
        maxLength={256}
        placeholder={t('auth.email', 'Email')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className={inputClass}
        type="password"
        autoComplete={isRegister ? 'new-password' : 'current-password'}
        required
        minLength={isRegister ? 8 : undefined}
        maxLength={128}
        placeholder={t('auth.password', 'Password')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {isRegister && (
        <p className="text-xs text-gray-500">
          {t('auth.passwordHint', 'At least 8 characters.')}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy
          ? t('common.loading', 'Loading...')
          : isRegister
            ? t('auth.createAccount', 'Create account')
            : t('auth.signIn', 'Sign in')}
      </button>

      {!isRegister && (
        <p className="text-xs text-gray-500 text-center">
          {t('auth.forgotHint', 'Forgot your password? Sign in with Google using the same email to recover your account.')}
        </p>
      )}
    </form>
  );
};

export default EmailAuthForm;
