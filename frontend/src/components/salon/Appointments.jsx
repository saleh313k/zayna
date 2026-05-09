// ============================================
// src/components/salon/Appointments.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../common/Layout';
import { FiCalendar, FiSearch, FiFilter } from 'react-icons/fi';
import { format } from 'date-fns';

const Appointments = () => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filter, setFilter] = useState('all');
  const [appointments, setAppointments] = useState([
    {
      id: '1',
      time: '09:00',
      customerName: 'Ahmed Al-Said',
      customerPhone: '+96891234567',
      service: 'Haircut + Beard',
      stylist: 'Mohammed',
      price: 8.0,
      status: 'Confirmed',
      notes: 'Prefers short hair',
    },
    {
      id: '2',
      time: '10:30',
      customerName: 'Khalid Al-Balushi',
      customerPhone: '+96892345678',
      service: 'Haircut',
      stylist: 'Ali',
      price: 5.0,
      status: 'Pending',
      notes: '',
    },
    {
      id: '3',
      time: '14:00',
      customerName: 'Saeed Al-Hinai',
      customerPhone: '+96893456789',
      service: 'Full Package',
      stylist: 'Mohammed',
      price: 10.0,
      status: 'Confirmed',
      notes: 'Regular customer',
    },
  ]);

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'all') return true;
    return apt.status.toLowerCase() === filter;
  });

  const updateStatus = (id, newStatus) => {
    setAppointments(
      appointments.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="ltr:ml-8 rtl:mr-8">
          <h1 className="text-3xl font-bold text-primary mb-8">{t('salon.appointments')}</h1>
        </div>
        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Appointments</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input type="text" placeholder="Search customer..." className="input-field pl-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Service</th>
                  <th className="text-left py-3 px-4">Stylist</th>
                  <th className="text-left py-3 px-4">Price</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <FiCalendar className="mr-2 text-primary" />
                        <span className="font-semibold">{appointment.time}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold">{appointment.customerName}</p>
                        <p className="text-sm text-gray-600">{appointment.customerPhone}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p>{appointment.service}</p>
                      {appointment.notes && (
                        <p className="text-xs text-gray-600 mt-1">Note: {appointment.notes}</p>
                      )}
                    </td>
                    <td className="py-4 px-4">{appointment.stylist}</td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-primary">{appointment.price} OMR</span>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={appointment.status}
                        onChange={(e) => updateStatus(appointment.id, e.target.value)}
                        className={`badge cursor-pointer ${
                          appointment.status === 'Confirmed'
                            ? 'badge-confirmed'
                            : appointment.status === 'Pending'
                              ? 'badge-pending'
                              : appointment.status === 'Completed'
                                ? 'badge-completed'
                                : 'badge-cancelled'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <button className="text-primary hover:underline text-sm">Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAppointments.length === 0 && (
              <div className="text-center py-12">
                <FiCalendar className="mx-auto text-5xl text-gray-300 mb-4" />
                <p className="text-gray-500">No appointments found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Appointments;
