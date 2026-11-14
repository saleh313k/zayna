// ============================================
// src/components/auth/ChangePassword.jsx
// Signed-in users change their password (requires the current one).
// ============================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Layout from '../common/Layout';
import { authService } from '../../services/authService';

const ChangePassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(t('auth.passwordsDontMatch', 'The two passwords do not match.'));
      return;
    }
    setBusy(true);
    try {
      await authService.changePassword(current, password);
      toast.success(t('auth.passwordChanged', 'Your password has been changed.'));
      navigate('/profile', { replace: true });
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error(t('auth.tooManyRequests', 'Too many attempts. Please wait a minute and try again.'));
      } else {
        // Server messages are specific and safe to show: wrong current password, weak password, Google-only account...
        toast.error(error.response?.data?.message || t('common.error'));
      }
    } finally {
      setBusy(false);
    }
  };

  const inputClass = 'w-full border rounded px-3 py-2';

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8">{t('auth.changePasswordTitle', 'Change password')}</h1>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className={inputClass}
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              placeholder={t('auth.currentPassword', 'Current password')}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
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
              {busy ? t('common.loading', 'Loading...') : t('auth.changePasswordTitle', 'Change password')}
            </button>
          </form>
          <p className="text-center text-sm mt-4">
            <Link to="/profile" className="text-primary font-medium">{t('common.back', 'Back')}</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ChangePassword;
