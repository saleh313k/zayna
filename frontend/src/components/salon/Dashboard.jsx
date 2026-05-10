// ============================================
// src/components/salon/Dashboard.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { salonService } from '../../services/salonService';
import Layout from '../common/Layout';
import { useAuth } from '../../contexts/AuthContext';

import { 
  FiCalendar, 
  FiUsers, 
  FiDollarSign, 
  FiTrendingUp,
  FiClock,
  FiCheckCircle 
} from 'react-icons/fi';
import { format } from 'date-fns';

const SalonDashboard = () => {
    const { user } = useAuth();

  const { t } = useTranslation();
  const [stats, setStats] = useState({
    todayBookings: 8,
    totalRevenue: 450,
    activeCustomers: 156,
    completionRate: 94
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      
      const salon = await salonService.getSalonByUserId(user?.userId);
      console.log(salon.salon);
      setSalon(salon.salon);
      
      // Fetch salon bookings for today
      const today = format(new Date(), 'yyyy-MM-dd');
      const bookings = await salonService.getSalonBookings(salon.salon.id, today);
      
      // setTodayAppointments(bookings);
      
      // Mock data for demo
      setTodayAppointments([
        {
          id: '1',
          time: '10:00',
          customerName: 'Ahmed Al-Said',
          service: 'Haircut',
          stylist: 'Mohammed',
          status: 'Confirmed'
        },
        {
          id: '2',
          time: '11:00',
          customerName: 'Khalid Al-Balushi',
          service: 'Beard Trim',
          stylist: 'Mohammed',
          status: 'Pending'
        },
        {
          id: '3',
          time: '14:00',
          customerName: 'Saeed Al-Hinai',
          service: 'Full Package',
          stylist: 'Ali',
          status: 'Confirmed'
        }
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, trend, color }) => (
    <div className="card hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-primary mb-2">{value}</p>
          {trend && (
            <div className="flex items-center text-sm text-green-600">
              <FiTrendingUp className="mr-1" />
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

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className='ltr:ml-8 rtl:mr-8'>
            <h1 className="text-3xl font-bold text-primary">
              {t('salon.dashboard')}
            </h1>
            <p className="text-gray-600">{salon.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Today</p>
            <p className="text-lg font-semibold">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FiCalendar}
            label="Today's Bookings"
            value={stats.todayBookings}
            trend="+12% from yesterday"
            color="bg-primary"
          />
          <StatCard
            icon={FiDollarSign}
            label="Today's Revenue"
            value={`${stats.totalRevenue} OMR`}
            trend="+8% from yesterday"
            color="bg-accent"
          />
          <StatCard
            icon={FiUsers}
            label="Active Customers"
            value={stats.activeCustomers}
            trend="+24 this week"
            color="bg-secondary"
          />
          <StatCard
            icon={FiCheckCircle}
            label="Completion Rate"
            value={`${stats.completionRate}%`}
            trend="Excellent!"
            color="bg-green-500"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Today's Appointments</h2>
                <button className="text-primary hover:underline text-sm">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <FiClock className="text-primary mx-auto mb-1" />
                        <p className="text-sm font-semibold">{appointment.time}</p>
                      </div>
                      <div className="h-12 w-px bg-gray-300"></div>
                      <div>
                        <p className="font-semibold">{appointment.customerName}</p>
                        <p className="text-sm text-gray-600">
                          {appointment.service} • {appointment.stylist}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${
                      appointment.status === 'Confirmed' ? 'badge-confirmed' : 'badge-pending'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                ))}

                {todayAppointments.length === 0 && (
                  <div className="text-center py-12">
                    <FiCalendar className="mx-auto text-5xl text-gray-300 mb-4" />
                    <p className="text-gray-500">No appointments scheduled for today</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full btn-primary text-sm py-2">
                  Add New Booking
                </button>
                <button className="w-full btn-outline text-sm py-2">
                  Manage Stylists
                </button>
                <button className="w-full btn-outline text-sm py-2">
                  View Reports
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium">New booking</p>
                  <p className="text-gray-600">Ahmed booked a haircut</p>
                  <p className="text-xs text-gray-500">5 minutes ago</p>
                </div>
                <div className="border-t pt-3 text-sm">
                  <p className="font-medium">Booking completed</p>
                  <p className="text-gray-600">Khalid's beard trim done</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
                <div className="border-t pt-3 text-sm">
                  <p className="font-medium">New review</p>
                  <p className="text-gray-600">5-star rating from Saeed</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
            </div>

            {/* Top Stylist */}
            <div className="card bg-gradient-to-br from-primary to-accent text-white">
              <h3 className="font-semibold mb-2">⭐ Top Stylist</h3>
              <p className="text-2xl font-bold mb-1">Mohammed Al-Hinai</p>
              <p className="text-sm opacity-90">28 bookings this week</p>
            </div>
          </div>
        </div>
      </div>

    </Layout>
  );
};

export default SalonDashboard;