// ============================================
// src/components/salon/StylistManagement.jsx
// Staff who can be booked: branch, services they perform, and days off.
// ============================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { ownerService } from '../../services/ownerService';
import { formatDate } from '../admin/adminUi';
import { toIsoDate } from '../../utils/bookingFormat';
import { useOwner } from './OwnerContext';
import { Field, Modal, OwnerPage, PageHeader, localName } from './ownerUi';

const emptyForm = { name: '', nameAr: '', branchId: '', yearsOfExperience: 0, serviceIds: [], isActive: true };

const StylistManagement = () => {
  const { t, i18n } = useTranslation();
  const { reload } = useOwner();
  const lang = i18n.language;

  const [editing, setEditing] = useState(null); // null | 'new' | stylist
  const [form, setForm] = useState(emptyForm);
  const [daysOffFor, setDaysOffFor] = useState(null); // stylist id
  const [offDate, setOffDate] = useState('');
  const [offReason, setOffReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const openNew = (data) => {
    const branches = data.branches.filter((b) => b.isActive);
    setForm({ ...emptyForm, branchId: branches.length === 1 ? branches[0].id : '' });
    setEditing('new');
  };
  const openEdit = (s) => {
    setForm({
      name: s.name || '', nameAr: s.nameAr || '', branchId: s.branchId || '', yearsOfExperience: s.yearsOfExperience,
      serviceIds: [...s.serviceIds], isActive: s.isActive,
    });
    setEditing(s);
  };

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const toggleService = (id) =>
    setForm({ ...form, serviceIds: form.serviceIds.includes(id) ? form.serviceIds.filter((x) => x !== id) : [...form.serviceIds, id] });

  const payload = (f) => ({
    name: f.name, nameAr: f.nameAr, branchId: f.branchId || null,
    yearsOfExperience: Number(f.yearsOfExperience) || 0, serviceIds: f.serviceIds, isActive: f.isActive,
  });

  const warnUpcoming = (res) => {
    if (res?.upcomingBookings > 0) {
      toast.warn(t('owner.upcomingWarning', '{{n}} upcoming booking(s) are not affected; please handle them manually if needed.', { n: res.upcomingBookings }));
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = editing === 'new'
        ? await ownerService.addStylist(payload(form))
        : await ownerService.updateStylist(editing.id, payload(form));
      toast.success(t('owner.saved', 'Saved'));
      setEditing(null);
      warnUpcoming(res);
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s) => {
    if (s.isActive && !window.confirm(t('owner.confirmDeactivateStylist', 'Deactivate this stylist? Customers will no longer be able to book them.'))) return;
    setBusyId(s.id);
    try {
      const res = await ownerService.updateStylist(s.id, payload({
        name: s.name, nameAr: s.nameAr || '', branchId: s.branchId, yearsOfExperience: s.yearsOfExperience,
        serviceIds: s.serviceIds, isActive: !s.isActive,
      }));
      toast.success(t('owner.saved', 'Saved'));
      warnUpcoming(res);
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const addOffDay = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await ownerService.addOffDay(daysOffFor, { date: offDate, reason: offReason || null });
      toast.success(t('owner.saved', 'Saved'));
      setOffDate('');
      setOffReason('');
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const removeOffDay = async (date) => {
    try {
      await ownerService.removeOffDay(daysOffFor, date);
      toast.success(t('owner.saved', 'Saved'));
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    }
  };

  return (
    <OwnerPage>
      {(data) => {
        const activeBranches = data.branches.filter((b) => b.isActive);
        const activeServices = data.services.filter((s) => s.isActive);
        const canAdd = activeBranches.length > 0 && activeServices.length > 0;
        const branchById = Object.fromEntries(data.branches.map((b) => [b.id, b]));
        const serviceById = Object.fromEntries(data.services.map((s) => [s.id, s]));
        const dayOffStylist = data.stylists.find((s) => s.id === daysOffFor);

        return (
          <>
            <PageHeader
              title={t('owner.stylistsTitle', 'Stylists')}
              subtitle={t('owner.stylistsSubtitle', 'The people customers can book')}
              action={<button className="btn-primary disabled:opacity-50" disabled={!canAdd} onClick={() => openNew(data)}>{t('owner.addStylist', 'Add stylist')}</button>}
            />

            {!canAdd && (
              <div className="card mb-6 bg-yellow-50 border border-yellow-200 text-sm">
                {t('owner.stylistPrereq', 'Add at least one active branch and one active service before adding stylists.')}{' '}
                <Link to="/salon/branches" className="text-primary underline">{t('salon.branches', 'Branches')}</Link>
                {' / '}
                <Link to="/salon/services" className="text-primary underline">{t('salon.services', 'Services')}</Link>
              </div>
            )}

            <div className="card">
              {data.stylists.length === 0 ? (
                <p className="text-gray-600 py-8 text-center">{t('owner.noStylists', 'No stylists yet.')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">{t('owner.stylist', 'Stylist')}</th>
                        <th className="text-left py-3 px-4">{t('bookingFlow.branch', 'Branch')}</th>
                        <th className="text-left py-3 px-4">{t('owner.servicesTitle', 'Services')}</th>
                        <th className="text-left py-3 px-4">{t('admin.status', 'Status')}</th>
                        <th className="text-left py-3 px-4">{t('admin.actions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.stylists.map((s) => (
                        <tr key={s.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <p className="font-semibold">{localName(lang, s.name, s.nameAr)}</p>
                            {s.yearsOfExperience > 0 && <p className="text-xs text-gray-500">{t('bookingFlow.years', '{{n}} years experience', { n: s.yearsOfExperience })}</p>}
                          </td>
                          <td className="py-4 px-4 text-sm">{branchById[s.branchId] ? localName(lang, branchById[s.branchId].name, branchById[s.branchId].nameAr) : '-'}</td>
                          <td className="py-4 px-4 text-sm">
                            {s.serviceIds.length === 0
                              ? <span className="text-red-600">{t('owner.noServicesAssigned', 'None (not bookable)')}</span>
                              : s.serviceIds.map((id) => serviceById[id] && localName(lang, serviceById[id].name, serviceById[id].nameAr)).filter(Boolean).join(', ')}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`badge ${s.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>
                              {s.isActive ? t('admin.active', 'Active') : t('owner.inactive', 'Inactive')}
                            </span>
                          </td>
                          <td className="py-4 px-4 space-x-3 rtl:space-x-reverse whitespace-nowrap">
                            <button className="text-primary hover:underline text-sm" onClick={() => openEdit(s)}>{t('owner.edit', 'Edit')}</button>
                            <button className="text-primary hover:underline text-sm" onClick={() => setDaysOffFor(s.id)}>{t('owner.daysOff', 'Days off')}</button>
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
              <Modal title={editing === 'new' ? t('owner.addStylist', 'Add stylist') : t('owner.editStylist', 'Edit stylist')} onClose={() => setEditing(null)}>
                <form onSubmit={save} className="space-y-4">
                  <Field label={t('owner.name', 'Name')} htmlFor="st-name">
                    <input id="st-name" name="name" value={form.name} onChange={change} required minLength={2} maxLength={100} className="input-field" />
                  </Field>
                  <Field label={t('owner.nameAr', 'Name (Arabic, optional)')} htmlFor="st-nameAr">
                    <input id="st-nameAr" name="nameAr" value={form.nameAr} onChange={change} maxLength={100} dir="rtl" className="input-field" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label={t('bookingFlow.branch', 'Branch')} htmlFor="st-branch">
                      <select id="st-branch" name="branchId" value={form.branchId} onChange={change} required className="input-field">
                        <option value="">{t('owner.chooseBranch', 'Choose a branch')}</option>
                        {data.branches.filter((b) => b.isActive || b.id === form.branchId).map((b) => (
                          <option key={b.id} value={b.id}>{localName(lang, b.name, b.nameAr)}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t('owner.years', 'Years of experience')} htmlFor="st-years">
                      <input id="st-years" name="yearsOfExperience" type="number" min={0} max={60} value={form.yearsOfExperience} onChange={change} className="input-field" />
                    </Field>
                  </div>
                  <fieldset>
                    <legend className="block text-sm font-medium mb-2">{t('owner.servicesPerformed', 'Services this stylist performs')}</legend>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {data.services.filter((s) => s.isActive || form.serviceIds.includes(s.id)).map((s) => (
                        <label key={s.id} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={form.serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} />
                          {localName(lang, s.name, s.nameAr)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" className="btn-outline" onClick={() => setEditing(null)}>{t('owner.cancel', 'Cancel')}</button>
                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? t('common.loading', 'Loading...') : t('owner.save', 'Save')}</button>
                  </div>
                </form>
              </Modal>
            )}

            {dayOffStylist && (
              <Modal title={`${t('owner.daysOff', 'Days off')} - ${localName(lang, dayOffStylist.name, dayOffStylist.nameAr)}`} onClose={() => setDaysOffFor(null)}>
                <div className="space-y-4">
                  {dayOffStylist.offDays.length === 0 ? (
                    <p className="text-sm text-gray-600">{t('owner.noDaysOff', 'No upcoming days off.')}</p>
                  ) : (
                    <ul className="divide-y">
                      {dayOffStylist.offDays.map((d) => (
                        <li key={d.date} className="py-2 flex justify-between items-center gap-3">
                          <span>{formatDate(`${d.date}T00:00:00`)}{d.reason ? ` - ${d.reason}` : ''}</span>
                          <button className="text-red-600 hover:underline text-sm" onClick={() => removeOffDay(d.date)}>{t('owner.remove', 'Remove')}</button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form onSubmit={addOffDay} className="space-y-3 border-t pt-4">
                    <Field label={t('bookingFlow.date', 'Date')} htmlFor="off-date">
                      <input id="off-date" type="date" min={toIsoDate(new Date())} value={offDate} onChange={(e) => setOffDate(e.target.value)} required className="input-field" />
                    </Field>
                    <Field label={t('owner.reasonOptional', 'Reason (optional)')} htmlFor="off-reason">
                      <input id="off-reason" value={offReason} onChange={(e) => setOffReason(e.target.value)} maxLength={200} className="input-field" />
                    </Field>
                    <button type="submit" className="btn-primary" disabled={saving}>{t('owner.addDayOff', 'Add day off')}</button>
                  </form>
                </div>
              </Modal>
            )}
          </>
        );
      }}
    </OwnerPage>
  );
};

export default StylistManagement;
