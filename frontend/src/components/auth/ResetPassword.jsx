// ============================================
// src/components/auth/ResetPassword.jsx
// Step 2 of password recovery. The emailed link looks like /reset-password#token=...
// The token lives in the URL fragment (never sent to a server or in a Referer header); it is read once and then
// removed from the address bar and browser history.
// ============================================
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Logo from '@/assets/img/logo.png';
import { authService } from '../../services/authService';

const readToken = (hash) => new URLSearchParams((hash || '').replace(/^#/, '')).get('token') || '';

const ResetPassword = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [token] = useState(() => readToken(location.hash));
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(!token);

  // Keep the secret out of the address bar / history once it has been captured.
  useEffect(() => {
    if (location.hash) {
      window.history.replaceState(null, '', location.pathname);
    }
  }, [location.hash, location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(t('auth.passwordsDontMatch', 'The two passwords do not match.'));
      return;
    }
    setBusy(true);
    try {
      await authService.resetPassword(token, password);
      toast.success(t('auth.resetSuccess', 'Your password has been changed. You can now sign in.'));
      navigate('/login', { replace: true });
    } catch (error) {
      const code = error.response?.data?.code;
      if (code === 'RESET_TOKEN_INVALID') {
        setLinkInvalid(true);
      } else if (error.response?.status === 429) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="card max-w-md w-full">
        <div className="text-center mb-6 flex items-center justify-center">
          <Link to="/" className="flex items-center">
            <img src={Logo} alt="ZAYNA - Your Time to Shine" className="h-16 w-auto object-contain" />
          </Link>
        </div>

        {linkInvalid ? (
          <div className="text-center">
            <p className="text-gray-700 mb-4" role="alert">
              {t('auth.resetLinkInvalid', 'This reset link is invalid or has expired.')}
            </p>
            <Link to="/forgot-password" className="btn-primary inline-block">
              {t('auth.requestNewLink', 'Request a new link')}
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-center mb-6">{t('auth.resetTitle', 'Choose a new password')}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                className={inputClass}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                placeholder={t('auth.newPassword', 'New password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                className={inputClass}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                placeholder={t('auth.confirmPassword', 'Confirm new password')}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <p className="text-xs text-gray-500">{t('auth.passwordHint', 'At least 8 characters.')}</p>
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? t('common.loading', 'Loading...') : t('auth.resetPasswordButton', 'Change password')}
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

export default ResetPassword;
