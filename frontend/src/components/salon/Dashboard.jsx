// ============================================
// src/components/salon/Dashboard.jsx
// Real numbers for the owner's salon + a setup checklist until the salon can take bookings.
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiClock, FiDollarSign, FiUsers, FiCheckCircle, FiCircle } from 'react-icons/fi';
import Layout from '../common/Layout';
import { ownerService } from '../../services/ownerService';
import { ErrorState, Spinner } from '../admin/adminUi';
import { BOOKING_STATUS, formatBookingDate, formatMoney } from '../../utils/bookingFormat';
import { useOwner } from './OwnerContext';
import { PageHeader, localName } from './ownerUi';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card hover:shadow-xl transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-600 text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold text-primary">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}><Icon className="text-2xl text-white" /></div>
    </div>
  </div>
);

const SalonDashboard = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const owner = useOwner();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      setStats(await ownerService.getStats());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const data = owner.data;
  const readiness = data?.readiness;

  const steps = readiness && [
    { done: readiness.hasBranch, label: t('owner.stepBranch', 'Add a branch'), to: '/salon/branches' },
    { done: readiness.hasWorkingHours, label: t('owner.stepHours', 'Set working hours'), to: '/salon/branches' },
    { done: readiness.hasService, label: t('owner.stepService', 'Add at least one service'), to: '/salon/services' },
    { done: readiness.hasStylist, label: t('owner.stepStylist', 'Add a stylist and choose their services'), to: '/salon/stylists' },
    { done: readiness.isApproved, label: t('owner.stepApproval', 'Wait for Zayna to approve your salon'), to: null },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title={data ? localName(lang, data.salon.name, data.salon.nameAr) : t('salon.dashboard', 'Salon Dashboard')}
          subtitle={t('owner.dashboardSubtitle', 'Your salon at a glance')}
        />

        {owner.loading || loading ? (
          <Spinner />
        ) : owner.error || !data ? (
          <div className="card"><ErrorState onRetry={owner.reload} /></div>
        ) : (
          <>
            {/* Setup checklist until the salon can take bookings */}
            {!readiness.canTakeBookings && (
              <div className="card mb-8 border border-yellow-200 bg-yellow-50">
                <h2 className="text-xl font-semibold mb-1">{t('owner.setupTitle', 'Finish setting up your salon')}</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {readiness.isApproved
                    ? t('owner.setupHint', 'Customers can book you once every step below is done.')
                    : t('owner.setupPendingHint', 'Your salon will appear to customers once you finish these steps and Zayna approves it.')}
                </p>
                <ul className="space-y-2">
                  {steps.map((s) => (
                    <li key={s.label} className="flex items-center gap-2">
                      {s.done ? <FiCheckCircle className="text-green-600" /> : <FiCircle className="text-gray-400" />}
                      {s.done || !s.to ? <span className={s.done ? 'text-gray-500' : ''}>{s.label}</span> : <Link to={s.to} className="text-primary underline">{s.label}</Link>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error || !stats ? (
              <div className="card"><ErrorState onRetry={() => { setLoading(true); load(); }} /></div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard icon={FiCalendar} label={t('owner.statToday', "Today's bookings")} value={stats.today} color="bg-primary" />
                  <StatCard icon={FiClock} label={t('owner.statUpcoming', 'Upcoming bookings')} value={stats.upcoming} color="bg-accent" />
                  <StatCard icon={FiUsers} label={t('owner.statCustomers', 'Customers')} value={stats.customers} color="bg-blue-500" />
                  <StatCard icon={FiDollarSign} label={t('owner.statRevenue', 'Revenue this month')} value={formatMoney(stats.revenue.thisMonth)} color="bg-green-500" />
                </div>

                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{t('owner.nextAppointments', 'Next appointments')}</h2>
                    <Link to="/salon/appointments" className="text-primary hover:underline text-sm">{t('admin.viewAll', 'View all')}</Link>
                  </div>
                  {stats.nextAppointments.length === 0 ? (
                    <p className="text-gray-600 py-6 text-center">{t('owner.noNext', 'No upcoming appointments.')}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">{t('admin.customer', 'Customer')}</th>
                            <th className="text-left py-3 px-4">{t('admin.service', 'Service')}</th>
                            <th className="text-left py-3 px-4">{t('admin.dateTime', 'Date & Time')}</th>
                            <th className="text-left py-3 px-4">{t('admin.status', 'Status')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.nextAppointments.map((b) => {
                            const s = BOOKING_STATUS[b.status];
                            return (
                              <tr key={b.id} className="border-b hover:bg-gray-50">
                                <td className="py-4 px-4 font-semibold">{b.customer?.name || '-'}</td>
                                <td className="py-4 px-4">
                                  <p>{localName(lang, b.service.name, b.service.nameAr)}</p>
                                  <p className="text-sm text-gray-600">{localName(lang, b.stylist.name, b.stylist.nameAr)}</p>
                                </td>
                                <td className="py-4 px-4">
                                  <p>{formatBookingDate(b.bookingDate, lang)}</p>
                                  <p className="text-sm text-gray-600">{b.startTime} - {b.endTime}</p>
                                </td>
                                <td className="py-4 px-4"><span className={`badge ${s?.badge || ''}`}>{s ? t(`admin.status_${s.key}`, s.label) : b.status}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default SalonDashboard;
