// ============================================
// src/components/salon/SalonSettings.jsx
// Public profile of the salon.
// ============================================
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { ownerService } from '../../services/ownerService';
import { useOwner } from './OwnerContext';
import { Field, OwnerPage, PageHeader } from './ownerUi';

const toForm = (s) => ({
  name: s.name || '', nameAr: s.nameAr || '', about: s.about || '', aboutAr: s.aboutAr || '', phone: s.phone || '', email: s.email || '',
});

const ProfileForm = ({ salon }) => {
  const { t } = useTranslation();
  const { reload } = useOwner();
  const [form, setForm] = useState(toForm(salon));
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(toForm(salon)); }, [salon]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await ownerService.updateProfile(form);
      toast.success(t('owner.saved', 'Saved'));
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="card max-w-2xl space-y-4">
      <Field label={t('owner.salonName', 'Salon name')} htmlFor="p-name">
        <input id="p-name" name="name" value={form.name} onChange={change} required minLength={2} maxLength={100} className="input-field" />
      </Field>
      <Field label={t('owner.nameAr', 'Name (Arabic, optional)')} htmlFor="p-nameAr">
        <input id="p-nameAr" name="nameAr" value={form.nameAr} onChange={change} maxLength={100} dir="rtl" className="input-field" />
      </Field>
      <Field label={t('owner.about', 'About your salon')} htmlFor="p-about">
        <textarea id="p-about" name="about" value={form.about} onChange={change} maxLength={2000} rows={3} className="input-field" />
      </Field>
      <Field label={t('owner.aboutAr', 'About (Arabic, optional)')} htmlFor="p-aboutAr">
        <textarea id="p-aboutAr" name="aboutAr" value={form.aboutAr} onChange={change} maxLength={2000} rows={3} dir="rtl" className="input-field" />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={t('owner.contactPhone', 'Contact phone')} htmlFor="p-phone">
          <input id="p-phone" name="phone" value={form.phone} onChange={change} required minLength={6} maxLength={20} type="tel" className="input-field" />
        </Field>
        <Field label={t('owner.contactEmail', 'Contact email (optional)')} htmlFor="p-email">
          <input id="p-email" name="email" value={form.email} onChange={change} maxLength={256} type="email" className="input-field" />
        </Field>
      </div>
      <button type="submit" className="btn-primary" disabled={saving}>{saving ? t('common.loading', 'Loading...') : t('owner.save', 'Save')}</button>
    </form>
  );
};

const SalonSettings = () => {
  const { t } = useTranslation();
  return (
    <OwnerPage>
      {(data) => (
        <>
          <PageHeader
            title={t('owner.settingsTitle', 'Salon profile')}
            subtitle={data.salon.isVerified
              ? t('owner.statusApproved', 'Your salon is approved and visible to customers.')
              : t('owner.statusPending', 'Your salon is waiting for approval.')}
          />
          <ProfileForm salon={data.salon} />
        </>
      )}
    </OwnerPage>
  );
};

export default SalonSettings;
