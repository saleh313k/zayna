// ============================================
// src/components/customer/AccountData.jsx
// "Your data": download everything we hold, or delete (anonymise) the account.
// The server re-checks everything: password (or typed email for Google-only accounts), no upcoming bookings.
// ============================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FiDownload, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { customerService } from '../../services/customerService';

const AccountData = ({ hasPassword }) => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [secret, setSecret] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [problem, setProblem] = useState('');

  const download = async () => {
    setDownloading(true);
    try {
      await customerService.exportData();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDownloading(false);
    }
  };

  const remove = async (e) => {
    e.preventDefault();
    setProblem('');
    setDeleting(true);
    try {
      await customerService.deleteAccount(hasPassword ? { currentPassword: secret } : { confirmEmail: secret });
      toast.success(t('customer.accountDeleted', 'Your account has been deleted.'));
      logout();
      navigate('/', { replace: true });
    } catch (error) {
      setProblem(error.response?.data?.message || t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="card mt-6">
      <h2 className="text-xl font-semibold mb-4">{t('customer.yourData', 'Your data')}</h2>

      <div className="mb-6">
        <button type="button" onClick={download} disabled={downloading} className="btn-outline inline-flex items-center gap-2">
          <FiDownload aria-hidden="true" />
          {downloading ? t('common.loading', 'Loading...') : t('customer.downloadData', 'Download my data')}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          {t('customer.downloadDataHint', 'A JSON file with your profile, bookings, reviews, points and notifications.')}
        </p>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold text-red-700 mb-2">{t('customer.deleteAccount', 'Delete my account')}</h3>
        {!confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className="text-red-600 hover:underline inline-flex items-center gap-2">
            <FiTrash2 aria-hidden="true" />
            {t('customer.deleteAccount', 'Delete my account')}
          </button>
        ) : (
          <form onSubmit={remove} className="space-y-3">
            <p className="text-sm text-gray-700">
              {t('customer.deleteRemoves', 'This removes your name, email, phone, password, notes, loyalty points, notifications and the text of your reviews. Your star ratings stay as anonymous statistics. This cannot be undone, and you must cancel upcoming bookings first.')}
            </p>
            <input
              className="input-field"
              type={hasPassword ? 'password' : 'email'}
              autoComplete={hasPassword ? 'current-password' : 'off'}
              required
              maxLength={256}
              placeholder={hasPassword
                ? t('auth.currentPassword', 'Current password')
                : t('customer.typeEmail', 'Type your email address to confirm')}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            {problem && <p className="text-sm text-red-600" role="alert">{problem}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={deleting} className="btn-primary bg-red-600 hover:bg-red-700">
                {deleting ? t('common.loading', 'Loading...') : t('customer.deleteForever', 'Delete permanently')}
              </button>
              <button type="button" onClick={() => { setConfirming(false); setSecret(''); setProblem(''); }} className="text-gray-600 hover:underline">
                {t('customer.cancelEdit', 'Cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AccountData;
