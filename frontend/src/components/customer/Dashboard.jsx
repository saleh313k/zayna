// ============================================
// src/components/customer/Dashboard.jsx
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiClock, FiMapPin, FiStar } from 'react-icons/fi';
import Layout from '../common/Layout';
import { bookingService } from '../../services/bookingService';
import { ACTIVE_STATUSES, BOOKING_STATUS, formatBookingDate, formatMoney, localized, toIsoDate } from '../../utils/bookingFormat';

const CustomerDashboard = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const data = await bookingService.getMyBookings();
      setBookings(data.bookings || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Upcoming = still-active bookings from today on (dates are salon-local "yyyy-MM-dd" strings).
  const today = toIsoDate(new Date());
  const upcoming = bookings
    .filter((b) => ACTIVE_STATUSES.includes(b.status) && b.bookingDate >= today)
    .sort((a, b) => `${a.bookingDate} ${a.startTime}`.localeCompare(`${b.bookingDate} ${b.startTime}`));
  const upcomingIds = new Set(upcoming.map((b) => b.id));
  const past = bookings.filter((b) => !upcomingIds.has(b.id));

  const badge = (status) => {
    const s = BOOKING_STATUS[status];
    return <span className={`badge ${s?.badge || ''}`}>{s ? t(`admin.status_${s.key}`, s.label) : status}</span>;
  };

  if (loading) {
    return <Layout><div className="flex justify-center items-center h-64"><div className="spinner"></div></div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">{t('customer.dashboard')}</h1>
          <Link to="/book" className="btn-primary">{t('customer.newBooking')}</Link>
        </div>

        {error && (
          <div className="card text-center py-8 mb-8">
            <p className="text-red-600 mb-3">{t('admin.loadError', 'Could not load data. Please try again.')}</p>
            <button className="btn-outline" onClick={() => { setLoading(true); load(); }}>{t('admin.retry', 'Retry')}</button>
          </div>
        )}

        {/* Upcoming */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t('customer.upcomingBookings')}</h2>
          {upcoming.length === 0 ? (
            <div className="card text-center py-12">
              <FiCalendar className="mx-auto text-5xl text-gray-300 mb-4" />
              <p className="text-gray-500">{t('customer.noUpcoming', 'You have no upcoming bookings.')}</p>
              <Link to="/book" className="btn-primary mt-4 inline-block">{t('customer.newBooking')}</Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((b) => (
                <div key={b.id} className="card hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <h3 className="font-semibold text-lg">{localized(lang, b.salon.name, b.salon.nameAr)}</h3>
                    {badge(b.status)}
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center"><FiCalendar className="mr-2 rtl:mr-0 rtl:ml-2" />{formatBookingDate(b.bookingDate, lang)}</div>
                    <div className="flex items-center"><FiClock className="mr-2 rtl:mr-0 rtl:ml-2" />{b.startTime} - {b.endTime}</div>
                    <div className="flex items-center"><FiMapPin className="mr-2 rtl:mr-0 rtl:ml-2" />{localized(lang, b.branch.name, b.branch.nameAr)}</div>
                    <div className="flex items-center"><FiStar className="mr-2 rtl:mr-0 rtl:ml-2" />{localized(lang, b.stylist.name, b.stylist.nameAr)} - {localized(lang, b.service.name, b.service.nameAr)}</div>
                  </div>
                  <div className="border-t pt-4 flex justify-between items-center">
                    <span className="font-semibold text-primary text-lg">{formatMoney(b.totalAmount)}</span>
                    <Link to={`/booking/${b.id}`} className="text-primary hover:underline text-sm">{t('common.viewDetails')}</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">{t('customer.pastBookings')}</h2>
          {past.length === 0 ? (
            <div className="card text-center py-8"><p className="text-gray-500">{t('customer.noPast', 'No past bookings yet.')}</p></div>
          ) : (
            <div className="card space-y-4">
              {past.slice(0, 10).map((b) => (
                <Link key={b.id} to={`/booking/${b.id}`} className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0 hover:bg-gray-50 -mx-2 px-2 rounded">
                  <div className="flex-1">
                    <h4 className="font-semibold">{localized(lang, b.salon.name, b.salon.nameAr)}</h4>
                    <p className="text-sm text-gray-600">{formatBookingDate(b.bookingDate, lang)} - {b.startTime}</p>
                  </div>
                  <div className="text-right rtl:text-left space-y-1">
                    <p className="font-semibold text-primary">{formatMoney(b.totalAmount)}</p>
                    {badge(b.status)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CustomerDashboard;
