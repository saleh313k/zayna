// ============================================
// src/components/salon/Appointments.jsx
// The salon's real bookings. Action buttons come from the server (allowedStatuses), so the screen can only
// offer changes the server will accept.
// ============================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Layout from '../common/Layout';
import { ownerService } from '../../services/ownerService';
import { ErrorState, PaginationBar, Spinner } from '../admin/adminUi';
import { BOOKING_STATUS, formatBookingDate, formatMoney } from '../../utils/bookingFormat';
import { PageHeader, localName } from './ownerUi';

const PAGE_SIZE = 20;

const ACTIONS = {
  1: { key: 'confirm', label: 'Confirm', cls: 'btn-primary py-1 px-3 text-sm' },
  2: { key: 'start', label: 'Start', cls: 'btn-outline py-1 px-3 text-sm' },
  3: { key: 'complete', label: 'Complete', cls: 'btn-primary py-1 px-3 text-sm' },
  5: { key: 'noShow', label: 'No-show', cls: 'btn-outline py-1 px-3 text-sm' },
  4: { key: 'cancel', label: 'Cancel', cls: 'text-red-600 hover:underline text-sm' },
};
const ACTION_ORDER = [1, 2, 3, 5, 4];

const Appointments = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [scope, setScope] = useState('today');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [counts, setCounts] = useState({ today: 0, upcoming: 0, past: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const data = await ownerService.getAppointments({ scope, status, page, pageSize: PAGE_SIZE });
      if (id !== requestId.current) return;
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
      setCounts(data.counts || { today: 0, upcoming: 0, past: 0 });
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [scope, status, page]);

  useEffect(() => { load(); }, [load]);

  const changeScope = (s) => { setScope(s); setPage(1); };

  const act = async (booking, target) => {
    if (target === 4 && !window.confirm(t('owner.confirmCancelBooking', 'Cancel this booking? The customer will see it as cancelled.'))) return;
    setBusyId(booking.id);
    try {
      if (target === 4) await ownerService.cancelBooking(booking.id);
      else await ownerService.updateBookingStatus(booking.id, target);
      toast.success(t('owner.saved', 'Saved'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setBusyId(null);
      await load(); // always refresh: the booking may have changed in the meantime
    }
  };

  const tabs = [
    { key: 'today', label: t('owner.tabToday', 'Today'), count: counts.today },
    { key: 'upcoming', label: t('owner.tabUpcoming', 'Upcoming'), count: counts.upcoming },
    { key: 'past', label: t('owner.tabPast', 'Past'), count: counts.past },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <PageHeader title={t('salon.appointments', 'Appointments')} subtitle={t('owner.appointmentsSubtitle', 'Manage your bookings')} />

        <div className="card mb-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => changeScope(tab.key)}
                  className={scope === tab.key ? 'px-4 py-2 bg-primary text-white rounded-lg' : 'px-4 py-2 border rounded-lg hover:bg-gray-50'}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            <select
              aria-label={t('admin.status', 'Status')}
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="input-field w-auto min-w-[180px]"
            >
              <option value="">{t('admin.allStatuses', 'All Statuses')}</option>
              {Object.entries(BOOKING_STATUS).map(([value, s]) => (
                <option key={value} value={value}>{t(`admin.status_${s.key}`, s.label)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card">
          {loading && bookings.length === 0 ? (
            <Spinner />
          ) : error ? (
            <ErrorState onRetry={load} />
          ) : bookings.length === 0 ? (
            <p className="text-gray-600 py-8 text-center">{t('owner.noAppointments', 'No bookings here.')}</p>
          ) : (
            <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">{t('admin.customer', 'Customer')}</th>
                    <th className="text-left py-3 px-4">{t('admin.service', 'Service')}</th>
                    <th className="text-left py-3 px-4">{t('admin.dateTime', 'Date & Time')}</th>
                    <th className="text-left py-3 px-4">{t('admin.amount', 'Amount')}</th>
                    <th className="text-left py-3 px-4">{t('admin.status', 'Status')}</th>
                    <th className="text-left py-3 px-4">{t('admin.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const s = BOOKING_STATUS[b.status];
                    const actions = ACTION_ORDER.filter((a) => b.allowedStatuses.includes(a));
                    return (
                      <tr key={b.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <p className="font-semibold">{b.customer?.name || '-'}</p>
                          <p className="text-sm text-gray-600">{b.customer?.phone || b.customer?.email || ''}</p>
                          <p className="text-xs text-gray-400 font-mono">{b.bookingNumber}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p>{localName(lang, b.service.name, b.service.nameAr)}</p>
                          <p className="text-sm text-gray-600">{localName(lang, b.stylist.name, b.stylist.nameAr)} - {localName(lang, b.branch.name, b.branch.nameAr)}</p>
                          {b.notes && <p className="text-xs text-gray-500 mt-1">{b.notes}</p>}
                        </td>
                        <td className="py-4 px-4">
                          <p>{formatBookingDate(b.bookingDate, lang)}</p>
                          <p className="text-sm text-gray-600">{b.startTime} - {b.endTime}</p>
                        </td>
                        <td className="py-4 px-4"><span className="font-semibold text-primary">{formatMoney(b.totalAmount)}</span></td>
                        <td className="py-4 px-4">
                          <span className={`badge ${s?.badge || ''}`}>{s ? t(`admin.status_${s.key}`, s.label) : b.status}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {actions.length === 0 && <span className="text-gray-400 text-sm">-</span>}
                            {actions.map((a) => (
                              <button key={a} className={`${ACTIONS[a].cls} disabled:opacity-50`} disabled={busyId === b.id} onClick={() => act(b, a)}>
                                {t(`owner.action_${ACTIONS[a].key}`, ACTIONS[a].label)}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!error && <PaginationBar page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />}
        </div>
      </div>
    </Layout>
  );
};

export default Appointments;
