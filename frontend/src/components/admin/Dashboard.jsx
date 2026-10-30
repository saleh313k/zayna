// ============================================
// src/components/admin/Dashboard.jsx
// Real platform statistics from GET /api/admin/stats, plus the pending salon approvals table.
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../common/Layout';
import { FiUsers, FiShoppingBag, FiDollarSign, FiTrendingUp, FiActivity } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { adminService } from '../../services/adminService';
import SalonApprovalsTable from './SalonApprovalsTable';
import { ErrorState, Spinner, formatMoney } from './adminUi';

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
  <div className="card hover:shadow-xl transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-gray-600 text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold text-primary mb-2">{value}</p>
        {trend && (
          <div className="flex items-center text-sm text-green-600">
            <FiTrendingUp className="mr-1 rtl:mr-0 rtl:ml-1" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="text-2xl text-white" />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadStats = useCallback(async () => {
    setError(false);
    try {
      setStats(await adminService.getStats());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const lang = i18n.language;
  const revenueData = (stats?.monthlyRevenue || []).map((m) => ({
    month: new Date(m.year, m.month - 1, 1).toLocaleDateString(lang, { month: 'short' }),
    revenue: m.revenue,
  }));
  const bookingsData = (stats?.dailyBookings || []).map((d) => ({
    day: new Date(`${d.date}T00:00:00`).toLocaleDateString(lang, { weekday: 'short' }),
    bookings: d.bookings,
  }));

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">{t('admin.dashboard', 'Admin Dashboard')}</h1>
          <p className="text-gray-600">{t('admin.dashboardSubtitle', 'Platform overview and analytics')}</p>
        </div>

        {loading ? (
          <Spinner />
        ) : error || !stats ? (
          <div className="card"><ErrorState onRetry={() => { setLoading(true); loadStats(); }} /></div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={FiUsers}
                label={t('admin.totalUsers', 'Total Users')}
                value={stats.users.total.toLocaleString()}
                trend={t('admin.newLast30', '+{{n}} in the last 30 days', { n: stats.users.newLast30Days })}
                color="bg-primary"
              />
              <StatCard
                icon={FiShoppingBag}
                label={t('admin.totalBookings', 'Total Bookings')}
                value={stats.bookings.total.toLocaleString()}
                trend={t('admin.newLast30', '+{{n}} in the last 30 days', { n: stats.bookings.last30Days })}
                color="bg-accent"
              />
              <StatCard
                icon={FiDollarSign}
                label={t('admin.totalRevenue', 'Total Revenue')}
                value={formatMoney(stats.revenue.total)}
                trend={t('admin.newLast30', '+{{n}} in the last 30 days', { n: formatMoney(stats.revenue.last30Days) })}
                color="bg-green-500"
              />
              <StatCard
                icon={FiActivity}
                label={t('admin.activeSalons', 'Active Salons')}
                value={stats.salons.active.toLocaleString()}
                trend={t('admin.pendingCount', '{{n}} pending approval', { n: stats.salons.pending })}
                color="bg-blue-500"
              />
            </div>

            {/* Pending salon approvals: approve right from the dashboard */}
            <div className="mb-8">
              <SalonApprovalsTable
                status="pending"
                pageSize={5}
                paginated={false}
                title={t('admin.pendingSalons', 'Pending salons')}
                headerAction={
                  <Link to="/admin/salons" className="text-primary hover:underline text-sm">
                    {t('admin.viewAll', 'View all')}
                  </Link>
                }
                onChanged={loadStats}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue Chart */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">{t('admin.monthlyRevenue', 'Monthly Revenue')}</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v) => formatMoney(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name={t('admin.revenue', 'Revenue')} stroke="#276351" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bookings Chart */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">{t('admin.dailyBookings', 'Bookings (last 7 days)')}</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bookingsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookings" name={t('admin.bookings', 'Bookings')} fill="#E3B23C" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Salons Table */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">{t('admin.topSalons', 'Top Performing Salons')}</h2>
              {stats.topSalons.length === 0 ? (
                <p className="text-gray-600 py-6 text-center">{t('admin.noBookingsYet', 'No bookings yet.')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">{t('admin.rank', 'Rank')}</th>
                        <th className="text-left py-3 px-4">{t('admin.salonName', 'Salon Name')}</th>
                        <th className="text-left py-3 px-4">{t('admin.bookings', 'Bookings')}</th>
                        <th className="text-left py-3 px-4">{t('admin.revenue', 'Revenue')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topSalons.map((salon, index) => (
                        <tr key={salon.salonId} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="py-4 px-4 font-semibold">{salon.name}</td>
                          <td className="py-4 px-4">{salon.bookings}</td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-primary">{formatMoney(salon.revenue)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
