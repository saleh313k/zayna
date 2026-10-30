// ============================================
// src/components/admin/Bookings.jsx
// Real bookings across all salons from GET /api/admin/bookings (read-only overview).
// ============================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../common/Layout';
import { FiSearch } from 'react-icons/fi';
import { adminService } from '../../services/adminService';
import { ErrorState, PaginationBar, Spinner, formatDate, formatMoney } from './adminUi';

const PAGE_SIZE = 10;

// Mirrors the BookingStatus enum on the server.
const STATUSES = [
  { value: 0, key: 'pending', label: 'Pending', badge: 'badge-pending' },
  { value: 1, key: 'confirmed', label: 'Confirmed', badge: 'badge-confirmed' },
  { value: 2, key: 'inProgress', label: 'In progress', badge: 'bg-purple-100 text-purple-800' },
  { value: 3, key: 'completed', label: 'Completed', badge: 'badge-completed' },
  { value: 4, key: 'cancelled', label: 'Cancelled', badge: 'badge-cancelled' },
  { value: 5, key: 'noShow', label: 'No-show', badge: 'bg-gray-100 text-gray-800' },
];

const Bookings = () => {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getBookings({ status, search, from, to, page, pageSize: PAGE_SIZE });
      if (id !== requestId.current) return;
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
      setCounts(data.counts || {});
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [status, search, from, to, page]);

  useEffect(() => { load(); }, [load]);

  const statusInfo = (value) => STATUSES.find((s) => s.value === value);
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const selectStatus = (value) => { setStatus(value); setPage(1); };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">{t('admin.bookingsTitle', 'Bookings')}</h1>
          <p className="text-gray-600">{t('admin.bookingsSubtitle', 'All bookings across every salon')}</p>
        </div>

        {/* Status summary (click to filter) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <button
            onClick={() => selectStatus('')}
            className={`card text-left ${status === '' ? 'ring-2 ring-primary' : ''}`}
          >
            <p className="text-gray-600 text-sm">{t('admin.all', 'All')}</p>
            <p className="text-2xl font-bold text-primary">{allCount}</p>
          </button>
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => selectStatus(s.value)}
              className={`card text-left ${status === s.value ? 'ring-2 ring-primary' : ''}`}
            >
              <p className="text-gray-600 text-sm">{t(`admin.status_${s.key}`, s.label)}</p>
              <p className="text-2xl font-bold text-primary">{counts[String(s.value)] ?? 0}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[260px]">
              <div className="relative">
                <FiSearch className="absolute ltr:left-3 rtl:right-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('admin.searchBookings', 'Search by booking number, customer or salon...')}
                  className="input-field ltr:pl-10 rtl:pr-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('admin.from', 'From')}</label>
              <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('admin.to', 'To')}</label>
              <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="input-field" />
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="card">
          {loading && bookings.length === 0 ? (
            <Spinner />
          ) : error ? (
            <ErrorState onRetry={load} />
          ) : bookings.length === 0 ? (
            <p className="text-gray-600 py-6 text-center">{t('admin.noBookings', 'No bookings match your filters.')}</p>
          ) : (
            <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">{t('admin.bookingNumber', 'Booking #')}</th>
                    <th className="text-left py-3 px-4">{t('admin.customer', 'Customer')}</th>
                    <th className="text-left py-3 px-4">{t('admin.salon', 'Salon')}</th>
                    <th className="text-left py-3 px-4">{t('admin.service', 'Service')}</th>
                    <th className="text-left py-3 px-4">{t('admin.dateTime', 'Date & Time')}</th>
                    <th className="text-left py-3 px-4">{t('admin.payment', 'Payment')}</th>
                    <th className="text-left py-3 px-4">{t('admin.amount', 'Amount')}</th>
                    <th className="text-left py-3 px-4">{t('admin.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const s = statusInfo(b.status);
                    return (
                      <tr key={b.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4 font-mono text-sm">{b.bookingNumber || '-'}</td>
                        <td className="py-4 px-4 font-semibold">{b.customerName}</td>
                        <td className="py-4 px-4">
                          <p className="font-semibold">{b.salonName}</p>
                          <p className="text-sm text-gray-600">{b.branchName}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p>{b.serviceName}</p>
                          <p className="text-sm text-gray-600">{b.stylistName}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p>{formatDate(b.bookingDate)}</p>
                          <p className="text-sm text-gray-600">{b.startTime} - {b.endTime}</p>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          {b.paymentType === 0 ? t('admin.paymentOnline', 'Online') : t('admin.paymentInPerson', 'In person')}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-primary">{formatMoney(b.totalAmount)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`badge ${s?.badge || 'bg-gray-100 text-gray-800'}`}>
                            {s ? t(`admin.status_${s.key}`, s.label) : b.status}
                          </span>
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

export default Bookings;
