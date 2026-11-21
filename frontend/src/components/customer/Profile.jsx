// ============================================
// src/components/customer/Profile.jsx
// Every value on this page comes from the API (GET /api/customer/me). Only the display name is editable:
// email and phone are sign-in identifiers and changing them needs verification (not built yet).
// ============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import Layout from '../common/Layout';
import { Link } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiStar, FiLock, FiBell } from 'react-icons/fi';
import { customerService } from '../../services/customerService';
import AccountData from './AccountData';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await customerService.getProfile();
        if (!cancelled) {
          setProfile(data);
          setFullName(data.fullName || '');
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = fullName.trim();
    if (name.length < 2 || name.length > 100) {
      toast.error(t('customer.nameInvalid', 'Name must be between 2 and 100 characters.'));
      return;
    }
    setSaving(true);
    try {
      await customerService.updateProfile(name);
      setProfile((current) => ({ ...current, fullName: name }));
      updateUser({ fullName: name });
      toast.success(t('customer.profileSaved', 'Profile updated.'));
      setEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setFullName(profile?.fullName || '');
    setEditing(false);
  };

  const dash = t('customer.notAvailable', '-');
  const memberSince = profile?.memberSince
    ? new Date(profile.memberSince).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short' })
    : dash;

  if (loadError) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-700" role="alert">
            {t('customer.profileLoadFailed', 'We could not load your profile. Please try again.')}
          </p>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-500">{t('common.loading', 'Loading...')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8">{t('customer.profile')}</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="md:col-span-2">
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">{t('customer.personalInfo', 'Personal information')}</h2>
                <button
                  type="button"
                  onClick={() => (editing ? cancelEditing() : setEditing(true))}
                  className="text-primary hover:underline"
                >
                  {editing ? t('customer.cancelEdit', 'Cancel') : t('customer.edit', 'Edit')}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="profile-name">
                    <FiUser className="inline me-2" />
                    {t('customer.fullName', 'Full name')}
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    value={fullName}
                    maxLength={100}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!editing}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FiMail className="inline me-2" />
                    {t('customer.email', 'Email')}
                  </label>
                  <input type="email" value={profile.email || ''} disabled className="input-field bg-gray-100" />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('customer.emailLocked', 'Your email is your sign-in and cannot be changed here.')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FiPhone className="inline me-2" />
                    {t('customer.phone', 'Phone number')}
                  </label>
                  <input type="tel" value={profile.phoneNumber || ''} disabled className="input-field bg-gray-100" />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('customer.phoneLocked', 'Phone number cannot be changed.')}
                  </p>
                </div>

                {editing && (
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? t('common.loading', 'Loading...') : t('customer.saveChanges', 'Save changes')}
                  </button>
                )}
              </form>
            </div>

            {/* Notifications: states what really happens (there are no per-user preferences yet). */}
            <div className="card mt-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">{t('customer.notificationsTitle', 'Notifications')}</h2>
                <FiBell className="text-xl text-primary" />
              </div>
              <p className="text-gray-600">
                {t('customer.notificationsBody', 'You receive booking confirmations, cancellations and reminders by email.')}
              </p>
            </div>

            <AccountData hasPassword={profile.hasPassword} />
          </div>

          <div className="md:col-span-1 space-y-6">
            {/* Security: only accounts that have a password can change it (Google-only accounts cannot). */}
            {profile.hasPassword && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{t('auth.security', 'Security')}</h3>
                  <FiLock className="text-xl text-primary" />
                </div>
                <Link to="/account/password" className="text-primary font-medium hover:underline">
                  {t('auth.changePasswordLink', 'Change password')}
                </Link>
              </div>
            )}

            {/* Loyalty Points */}
            <div className="card bg-gradient-to-br from-primary to-accent text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{t('customer.loyaltyPoints')}</h3>
                <FiStar className="text-2xl" />
              </div>
              <p className="text-4xl font-bold mb-2">{profile.loyaltyPoints}</p>
              <p className="text-sm opacity-90">{t('customer.pointsAvailable', 'Points available')}</p>
              <p className="text-xs opacity-80 mt-3">
                {t('customer.pointsHint', 'You earn 10 points for every completed appointment.')}
              </p>
            </div>

            {/* Statistics */}
            <div className="card">
              <h3 className="font-semibold mb-4">{t('customer.yourStatistics', 'Your statistics')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('customer.totalBookings', 'Total bookings')}</span>
                  <span className="font-semibold">{profile.totalBookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('customer.completedBookings', 'Completed')}</span>
                  <span className="font-semibold">{profile.completedBookings}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">{t('customer.favoriteSalon', 'Favorite salon')}</span>
                  <span className="font-semibold text-end">{profile.favoriteSalon || dash}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('customer.memberSince', 'Member since')}</span>
                  <span className="font-semibold">{memberSince}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
