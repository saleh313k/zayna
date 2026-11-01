// ============================================
// src/components/salon/Services.jsx
// ============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { ownerService } from '../../services/ownerService';
import { formatMoney } from '../admin/adminUi';
import { useOwner } from './OwnerContext';
import { Field, Modal, OwnerPage, PageHeader, localName } from './ownerUi';

const emptyForm = { name: '', nameAr: '', description: '', descriptionAr: '', category: '', durationMinutes: 30, price: '', isActive: true };

const Services = () => {
  const { t, i18n } = useTranslation();
  const { reload } = useOwner();
  const [editing, setEditing] = useState(null); // null | 'new' | service object
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const openNew = () => { setForm(emptyForm); setEditing('new'); };
  const openEdit = (s) => {
    setForm({
      name: s.name || '', nameAr: s.nameAr || '', description: s.description || '', descriptionAr: s.descriptionAr || '',
      category: s.category || '', durationMinutes: s.durationMinutes, price: String(s.price), isActive: s.isActive,
    });
    setEditing(s);
  };
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const payload = (f) => ({
    name: f.name, nameAr: f.nameAr, description: f.description, descriptionAr: f.descriptionAr, category: f.category,
    durationMinutes: Number(f.durationMinutes), price: Number(f.price), isActive: f.isActive,
  });

  const afterChange = async (res) => {
    if (res?.upcomingBookings > 0) {
      toast.warn(t('owner.upcomingWarning', '{{n}} upcoming booking(s) are not affected; please handle them manually if needed.', { n: res.upcomingBookings }));
    }
    await reload();
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = editing === 'new'
        ? await ownerService.addService(payload(form))
        : await ownerService.updateService(editing.id, payload(form));
      toast.success(t('owner.saved', 'Saved'));
      setEditing(null);
      await afterChange(res);
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s) => {
    if (s.isActive && !window.confirm(t('owner.confirmDeactivateService', 'Deactivate this service? Customers will no longer be able to book it.'))) return;
    setBusyId(s.id);
    try {
      const res = await ownerService.updateService(s.id, payload({
        name: s.name, nameAr: s.nameAr || '', description: s.description || '', descriptionAr: s.descriptionAr || '',
        category: s.category || '', durationMinutes: s.durationMinutes, price: s.price, isActive: !s.isActive,
      }));
      toast.success(t('owner.saved', 'Saved'));
      await afterChange(res);
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <OwnerPage>
      {(data) => (
        <>
          <PageHeader
            title={t('owner.servicesTitle', 'Services')}
            subtitle={t('owner.servicesSubtitle', 'What customers can book at your salon')}
            action={<button className="btn-primary" onClick={openNew}>{t('owner.addService', 'Add service')}</button>}
          />

          <div className="card">
            {data.services.length === 0 ? (
              <p className="text-gray-600 py-8 text-center">{t('owner.noServices', 'No services yet. Add your first service to start receiving bookings.')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">{t('owner.service', 'Service')}</th>
                      <th className="text-left py-3 px-4">{t('owner.category', 'Category')}</th>
                      <th className="text-left py-3 px-4">{t('owner.duration', 'Duration')}</th>
                      <th className="text-left py-3 px-4">{t('owner.price', 'Price')}</th>
                      <th className="text-left py-3 px-4">{t('admin.status', 'Status')}</th>
                      <th className="text-left py-3 px-4">{t('admin.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.services.map((s) => (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <p className="font-semibold">{localName(i18n.language, s.name, s.nameAr)}</p>
                          {s.description && <p className="text-sm text-gray-600">{s.description}</p>}
                        </td>
                        <td className="py-4 px-4 text-sm">{s.category || '-'}</td>
                        <td className="py-4 px-4">{s.durationMinutes} {t('bookingFlow.min', 'min')}</td>
                        <td className="py-4 px-4 font-semibold text-primary">{formatMoney(s.price)}</td>
                        <td className="py-4 px-4">
                          <span className={`badge ${s.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>
                            {s.isActive ? t('admin.active', 'Active') : t('owner.inactive', 'Inactive')}
                          </span>
                        </td>
                        <td className="py-4 px-4 space-x-3 rtl:space-x-reverse whitespace-nowrap">
                          <button className="text-primary hover:underline text-sm" onClick={() => openEdit(s)}>{t('owner.edit', 'Edit')}</button>
                          <button
                            className={`${s.isActive ? 'text-red-600' : 'text-primary'} hover:underline text-sm disabled:opacity-50`}
                            disabled={busyId === s.id}
                            onClick={() => toggleActive(s)}
                          >
                            {s.isActive ? t('owner.deactivate', 'Deactivate') : t('owner.activate', 'Activate')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {editing && (
            <Modal title={editing === 'new' ? t('owner.addService', 'Add service') : t('owner.editService', 'Edit service')} onClose={() => setEditing(null)}>
              <form onSubmit={save} className="space-y-4">
                <Field label={t('owner.name', 'Name')} htmlFor="svc-name">
                  <input id="svc-name" name="name" value={form.name} onChange={change} required minLength={2} maxLength={100} className="input-field" />
                </Field>
                <Field label={t('owner.nameAr', 'Name (Arabic, optional)')} htmlFor="svc-nameAr">
                  <input id="svc-nameAr" name="nameAr" value={form.nameAr} onChange={change} maxLength={100} dir="rtl" className="input-field" />
                </Field>
                <Field label={t('owner.category', 'Category')} htmlFor="svc-category">
                  <input id="svc-category" name="category" value={form.category} onChange={change} maxLength={50} className="input-field" />
                </Field>
                <Field label={t('owner.description', 'Description (optional)')} htmlFor="svc-description">
                  <textarea id="svc-description" name="description" value={form.description} onChange={change} maxLength={500} rows={2} className="input-field" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t('owner.durationMinutes', 'Duration (minutes)')} htmlFor="svc-duration">
                    <input id="svc-duration" name="durationMinutes" type="number" min={5} max={480} step={5} value={form.durationMinutes} onChange={change} required className="input-field" />
                  </Field>
                  <Field label={t('owner.priceOmr', 'Price (OMR)')} htmlFor="svc-price">
                    <input id="svc-price" name="price" type="number" min={0} max={10000} step="0.001" value={form.price} onChange={change} required className="input-field" />
                  </Field>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" className="btn-outline" onClick={() => setEditing(null)}>{t('owner.cancel', 'Cancel')}</button>
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

export default Services;
