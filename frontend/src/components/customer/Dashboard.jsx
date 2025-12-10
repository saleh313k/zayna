// ============================================
// src/components/customer/Dashboard.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookingService } from '../../services/bookingService';
import { format } from 'date-fns';
import { FiCalendar, FiClock, FiMapPin, FiStar } from 'react-icons/fi';
import Layout from '../common/Layout';

const CustomerDashboard = () => {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await bookingService.getMyBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingBookings = bookings.filter(
    b => new Date(b.bookingDate) >= new Date() && b.status !== 'Cancelled'
  );

  const pastBookings = bookings.filter(
    b => new Date(b.bookingDate) < new Date() || b.status === 'Completed'
  );

  const getStatusBadge = (status) => {
    const badges = {
      Pending: 'badge-pending',
      Confirmed: 'badge-confirmed',
      Completed: 'badge-completed',
      Cancelled: 'badge-cancelled'
    };
    return `badge ${badges[status] || ''}`;
  };

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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">{t('customer.dashboard')}</h1>
          <Link to="/book" className="btn-primary">
            {t('customer.newBooking')}
          </Link>
        </div>

        {/* Upcoming Bookings */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t('customer.upcomingBookings')}</h2>
          {upcomingBookings.length === 0 ? (
            <div className="card text-center py-12">
              <FiCalendar className="mx-auto text-5xl text-gray-300 mb-4" />
              <p className="text-gray-500">{t('common.noData')}</p>
              <Link to="/book" className="btn-primary mt-4 inline-block">
                {t('customer.newBooking')}
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="card hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg">{booking.salonName}</h3>
                    <span className={getStatusBadge(booking.status)}>
                      {t(`status.${booking.status.toLowerCase()}`)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <FiCalendar className="mr-2" />
                      {format(new Date(booking.bookingDate), 'dd MMM yyyy')}
                    </div>
                    <div className="flex items-center">
                      <FiClock className="mr-2" />
                      {booking.startTime}
                    </div>
                    <div className="flex items-center">
                      <FiMapPin className="mr-2" />
                      {booking.branchName}
                    </div>
                    <div className="flex items-center">
                      <FiStar className="mr-2" />
                      {booking.stylistName}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-primary text-lg">
                        {booking.totalPrice} OMR
                      </span>
                      <Link
                        to={`/booking/${booking.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        {t('common.viewDetails')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Bookings */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">{t('customer.pastBookings')}</h2>
          {pastBookings.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">{t('common.noData')}</p>
            </div>
          ) : (
            <div className="card">
              <div className="space-y-4">
                {pastBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                    <div className="flex-1">
                      <h4 className="font-semibold">{booking.salonName}</h4>
                      <p className="text-sm text-gray-600">
                        {format(new Date(booking.bookingDate), 'dd MMM yyyy')} at {booking.startTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{booking.totalPrice} OMR</p>
                      <span className={getStatusBadge(booking.status)}>
                        {t(`status.${booking.status.toLowerCase()}`)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CustomerDashboard;