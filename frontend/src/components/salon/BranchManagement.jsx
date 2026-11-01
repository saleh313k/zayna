// ============================================
// src/components/salon/BranchManagement.jsx
// Branches and their weekly working hours.
// ============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { ownerService } from '../../services/ownerService';
import { useOwner } from './OwnerContext';
import { Field, Modal, OwnerPage, PageHeader, localName } from './ownerUi';

const emptyBranch = { name: '', nameAr: '', addressLine: '', city: '', phoneNumber: '' };
const hhmm = (t) => String(t || '').slice(0, 5);

// 0 = Sunday ... 6 = Saturday (matches the server). 2024-01-07 was a Sunday.
const dayName = (day, lang) => new Date(2024, 0, 7 + day).toLocaleDateString(lang, { weekday: 'long' });

const hoursFromBranch = (branch) =>
  Array.from({ length: 7 }, (_, day) => {
    const row = branch.workingHours.find((w) => w.day === day);
    return row && !row.isClosed
      ? { day, isClosed: false, open: hhmm(row.openTime), close: hhmm(row.closeTime) }
      : { day, isClosed: row ? row.isClosed : true, open: '09:00', close: '21:00' };
  });

const BranchManagement = () => {
  const { t, i18n } = useTranslation();
  const { reload } = useOwner();
  const lang = i18n.language;

  const [editing, setEditing] = useState(null); // null | 'new' | branch
  const [form, setForm] = useState(emptyBranch);
  const [hoursFor, setHoursFor] = useState(null); // branch whose hours are being edited
  const [hours, setHours] = useState([]);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const openNew = () => { setForm(emptyBranch); setEditing('new'); };
  const openEdit = (b) => {
    setForm({ name: b.name || '', nameAr: b.nameAr || '', addressLine: b.address || '', city: b.city || '', phoneNumber: b.phone || '' });
    setEditing(b);
  };
  const openHours = (b) => { setHours(hoursFromBranch(b)); setHoursFor(b); };

  const saveBranch = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing === 'new') await ownerService.addBranch(form);
      else await ownerService.updateBranch(editing.id, { ...form, isActive: editing.isActive });
      toast.success(t('owner.saved', 'Saved'));
      setEditing(null);
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b) => {
    if (b.isActive && !window.confirm(t('owner.confirmDeactivateBranch', 'Deactivate this branch? Customers will no longer be able to book it.'))) return;
    setBusyId(b.id);
    try {
      const res = await ownerService.updateBranch(b.id, {
        name: b.name, nameAr: b.nameAr || '', addressLine: b.address || '', city: b.city || '', phoneNumber: b.phone || '', isActive: !b.isActive,
      });
      toast.success(t('owner.saved', 'Saved'));
      if (res?.upcomingBookings > 0) {
        toast.warn(t('owner.upcomingWarning', '{{n}} upcoming booking(s) are not affected; please handle them manually if needed.', { n: res.upcomingBookings }));
      }
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const setRow = (day, patch) => setHours(hours.map((h) => (h.day === day ? { ...h, ...patch } : h)));

  const saveHours = async (e) => {
    e.preventDefault();
    const bad = hours.find((h) => !h.isClosed && h.close <= h.open);
    if (bad) {
      toast.error(t('owner.hoursInvalid', 'Opening time must be before closing time.'));
      return;
    }
    setSaving(true);
    try {
      await ownerService.updateWorkingHours(hoursFor.id, hours.map((h) => ({
        day: h.day,
        isClosed: h.isClosed,
        openTime: `${h.open}:00`,
        closeTime: `${h.close}:00`,
      })));
      toast.success(t('owner.saved', 'Saved'));
      setHoursFor(null);
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <OwnerPage>
      {(data) => (
        <>
          <PageHeader
            title={t('owner.branchesTitle', 'Branches & working hours')}
            subtitle={t('owner.branchesSubtitle', 'Where and when customers can book')}
            action={<button className="btn-primary" onClick={openNew}>{t('owner.addBranch', 'Add branch')}</button>}
          />

          {data.branches.length === 0 ? (
            <div className="card text-center py-10 text-gray-600">{t('owner.noBranches', 'No branches yet.')}</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {data.branches.map((b) => (
                <div key={b.id} className="card">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div>
                      <h3 className="text-lg font-semibold">{localName(lang, b.name, b.nameAr)}</h3>
                      <p className="text-sm text-gray-600">{[b.address, b.city].filter(Boolean).join(', ')}</p>
                      {b.phone && <p className="text-sm text-gray-600">{b.phone}</p>}
                    </div>
                    <span className={`badge ${b.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>
                      {b.isActive ? t('admin.active', 'Active') : t('owner.inactive', 'Inactive')}
                    </span>
                  </div>
                  <div className="space-x-4 rtl:space-x-reverse text-sm">
                    <button className="text-primary hover:underline" onClick={() => openHours(b)}>{t('owner.workingHours', 'Working hours')}</button>
                    <button className="text-primary hover:underline" onClick={() => openEdit(b)}>{t('owner.edit', 'Edit')}</button>
                    <button
                      className={`${b.isActive ? 'text-red-600' : 'text-primary'} hover:underline disabled:opacity-50`}
                      disabled={busyId === b.id}
                      onClick={() => toggleActive(b)}
                    >
                      {b.isActive ? t('owner.deactivate', 'Deactivate') : t('owner.activate', 'Activate')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {editing && (
            <Modal title={editing === 'new' ? t('owner.addBranch', 'Add branch') : t('owner.editBranch', 'Edit branch')} onClose={() => setEditing(null)}>
              <form onSubmit={saveBranch} className="space-y-4">
                <Field label={t('owner.name', 'Name')} htmlFor="br-name">
                  <input id="br-name" name="name" value={form.name} onChange={change} required minLength={2} maxLength={100} className="input-field" />
                </Field>
                <Field label={t('owner.nameAr', 'Name (Arabic, optional)')} htmlFor="br-nameAr">
                  <input id="br-nameAr" name="nameAr" value={form.nameAr} onChange={change} maxLength={100} dir="rtl" className="input-field" />
                </Field>
                <Field label={t('owner.address', 'Address')} htmlFor="br-address">
                  <input id="br-address" name="addressLine" value={form.addressLine} onChange={change} required minLength={2} maxLength={200} className="input-field" />
                </Field>
                <Field label={t('owner.city', 'City')} htmlFor="br-city">
                  <input id="br-city" name="city" value={form.city} onChange={change} required minLength={2} maxLength={100} className="input-field" />
                </Field>
                <Field label={t('owner.phone', 'Phone (optional)')} htmlFor="br-phone">
                  <input id="br-phone" name="phoneNumber" value={form.phoneNumber} onChange={change} maxLength={20} type="tel" className="input-field" />
                </Field>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" className="btn-outline" onClick={() => setEditing(null)}>{t('owner.cancel', 'Cancel')}</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? t('common.loading', 'Loading...') : t('owner.save', 'Save')}</button>
                </div>
              </form>
            </Modal>
          )}

          {hoursFor && (
            <Modal title={`${t('owner.workingHours', 'Working hours')} - ${localName(lang, hoursFor.name, hoursFor.nameAr)}`} onClose={() => setHoursFor(null)} wide>
              <form onSubmit={saveHours} className="space-y-3">
                {hours.map((h) => (
                  <div key={h.day} className="flex flex-wrap items-center gap-3">
                    <span className="w-28 font-medium">{dayName(h.day, lang)}</span>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={h.isClosed} onChange={(e) => setRow(h.day, { isClosed: e.target.checked })} aria-label={`${dayName(h.day, lang)} ${t('owner.closed', 'Closed')}`} />
                      {t('owner.closed', 'Closed')}
                    </label>
                    {!h.isClosed && (
                      <>
                        <input type="time" value={h.open} onChange={(e) => setRow(h.day, { open: e.target.value })} required className="input-field w-auto" aria-label={`${dayName(h.day, lang)} ${t('owner.opens', 'Opens')}`} />
                        <span>-</span>
                        <input type="time" value={h.close} onChange={(e) => setRow(h.day, { close: e.target.value })} required className="input-field w-auto" aria-label={`${dayName(h.day, lang)} ${t('owner.closes', 'Closes')}`} />
                      </>
                    )}
                  </div>
                ))}
                <p className="text-xs text-gray-500">{t('owner.hoursHint', 'Changing hours does not affect bookings that already exist.')}</p>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" className="btn-outline" onClick={() => setHoursFor(null)}>{t('owner.cancel', 'Cancel')}</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? t('common.loading', 'Loading...') : t('owner.save', 'Save')}</button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}
    </OwnerPage>
  );
};

export default BranchManagement;
