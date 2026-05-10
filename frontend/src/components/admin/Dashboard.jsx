<<<<<<< HEAD
// ============================================
// src/components/admin/Dashboard.jsx
// ============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../common/Layout';
import { 
  FiUsers, 
  FiShoppingBag, 
  FiDollarSign, 
  FiTrendingUp,
  FiActivity 
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const AdminDashboard = () => {
  const { t } = useTranslation();

  // Mock data for charts
  const revenueData = [
    { month: 'Jan', revenue: 4200 },
    { month: 'Feb', revenue: 5100 },
    { month: 'Mar', revenue: 4800 },
    { month: 'Apr', revenue: 6300 },
    { month: 'May', revenue: 7200 },
    { month: 'Jun', revenue: 6800 }
  ];

  const bookingsData = [
    { day: 'Mon', bookings: 45 },
    { day: 'Tue', bookings: 52 },
    { day: 'Wed', bookings: 48 },
    { day: 'Thu', bookings: 61 },
    { day: 'Fri', bookings: 72 },
    { day: 'Sat', bookings: 88 },
    { day: 'Sun', bookings: 35 }
  ];

  const topSalons = [
    { name: 'Elite Salon', bookings: 245, revenue: 3250 },
    { name: 'Royal Cuts', bookings: 198, revenue: 2840 },
    { name: 'Premium Barber', bookings: 176, revenue: 2450 },
    { name: 'Modern Style', bookings: 156, revenue: 2120 },
    { name: 'Classic Cuts', bookings: 142, revenue: 1890 }
  ];

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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Platform overview and analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FiUsers}
            label="Total Users"
            value="2,458"
            trend="+12% this month"
            color="bg-primary"
          />
          <StatCard
            icon={FiShoppingBag}
            label="Total Bookings"
            value="18,432"
            trend="+8% this month"
            color="bg-accent"
          />
          <StatCard
            icon={FiDollarSign}
            label="Total Revenue"
            value="42,850 OMR"
            trend="+15% this month"
            color="bg-green-500"
          />
          <StatCard
            icon={FiActivity}
            label="Active Salons"
            value="156"
            trend="+5 this week"
            color="bg-blue-500"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Monthly Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#276351" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bookings Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Weekly Bookings</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#E3B23C" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Salons Table */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Top Performing Salons</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Rank</th>
                  <th className="text-left py-3 px-4">Salon Name</th>
                  <th className="text-left py-3 px-4">Bookings</th>
                  <th className="text-left py-3 px-4">Revenue</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topSalons.map((salon, index) => (
                  <tr key={salon.name} className="border-b hover:bg-gray-50">
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
                    <td className="py-4 px-4">{salon.bookings} bookings</td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-primary">{salon.revenue} OMR</span>
                    </td>
                    <td className="py-4 px-4">
                      <button className="text-primary hover:underline text-sm">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

=======
// ============================================
// src/components/admin/Dashboard.jsx
// ============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../common/Layout';
import { 
  FiUsers, 
  FiShoppingBag, 
  FiDollarSign, 
  FiTrendingUp,
  FiActivity 
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const AdminDashboard = () => {
  const { t } = useTranslation();

  // Mock data for charts
  const revenueData = [
    { month: 'Jan', revenue: 4200 },
    { month: 'Feb', revenue: 5100 },
    { month: 'Mar', revenue: 4800 },
    { month: 'Apr', revenue: 6300 },
    { month: 'May', revenue: 7200 },
    { month: 'Jun', revenue: 6800 }
  ];

  const bookingsData = [
    { day: 'Mon', bookings: 45 },
    { day: 'Tue', bookings: 52 },
    { day: 'Wed', bookings: 48 },
    { day: 'Thu', bookings: 61 },
    { day: 'Fri', bookings: 72 },
    { day: 'Sat', bookings: 88 },
    { day: 'Sun', bookings: 35 }
  ];

  const topSalons = [
    { name: 'Elite Salon', bookings: 245, revenue: 3250 },
    { name: 'Royal Cuts', bookings: 198, revenue: 2840 },
    { name: 'Premium Barber', bookings: 176, revenue: 2450 },
    { name: 'Modern Style', bookings: 156, revenue: 2120 },
    { name: 'Classic Cuts', bookings: 142, revenue: 1890 }
  ];

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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Platform overview and analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FiUsers}
            label="Total Users"
            value="2,458"
            trend="+12% this month"
            color="bg-primary"
          />
          <StatCard
            icon={FiShoppingBag}
            label="Total Bookings"
            value="18,432"
            trend="+8% this month"
            color="bg-accent"
          />
          <StatCard
            icon={FiDollarSign}
            label="Total Revenue"
            value="42,850 OMR"
            trend="+15% this month"
            color="bg-green-500"
          />
          <StatCard
            icon={FiActivity}
            label="Active Salons"
            value="156"
            trend="+5 this week"
            color="bg-blue-500"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Monthly Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#276351" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bookings Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Weekly Bookings</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#E3B23C" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Salons Table */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Top Performing Salons</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Rank</th>
                  <th className="text-left py-3 px-4">Salon Name</th>
                  <th className="text-left py-3 px-4">Bookings</th>
                  <th className="text-left py-3 px-4">Revenue</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topSalons.map((salon, index) => (
                  <tr key={salon.name} className="border-b hover:bg-gray-50">
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
                    <td className="py-4 px-4">{salon.bookings} bookings</td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-primary">{salon.revenue} OMR</span>
                    </td>
                    <td className="py-4 px-4">
                      <button className="text-primary hover:underline text-sm">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
export default AdminDashboard;