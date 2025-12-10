// ============================================
// src/components/customer/BookingDetails.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookingService } from '../../services/bookingService';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Layout from '../common/Layout';
import { FiCalendar, FiClock, FiMapPin, FiUser, FiDollarSign, FiX } from 'react-icons/fi';

const BookingDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const data = await bookingService.getBookingById(id);
      setBooking(data);
    } catch (error) {
      toast.error(t('common.error'));
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setCancelling(true);
    try {
      await bookingService.cancelBooking(id, cancelReason);
      toast.success('Booking cancelled successfully');
      setCancelModal(false);
      fetchBooking();
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Confirmed: 'bg-green-100 text-green-800',
      Completed: 'bg-blue-100 text-blue-800',
      Cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Paid: 'bg-green-100 text-green-800',
      Failed: 'bg-red-100 text-red-800',
      Refunded: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  if (!booking) return null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              {t('common.viewDetails')}
            </h1>
            <p className="text-gray-600">Booking ID: {booking.id.substring(0, 8)}</p>
          </div>
          <span className={`badge ${getStatusColor(booking.status)}`}>
            {t(`status.${booking.status.toLowerCase()}`)}
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Salon & Service Info */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Service Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Salon</label>
                  <p className="font-semibold text-lg">{booking.salon?.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Service</label>
                  <p className="font-semibold">{booking.service?.name}</p>
                  <p className="text-sm text-gray-600">{booking.service?.durationMinutes} minutes</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Stylist</label>
                  <p className="font-semibold">{booking.stylist?.user?.fullName}</p>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Appointment Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <FiCalendar className="text-primary text-xl mt-1" />
                  <div>
                    <label className="text-sm text-gray-600">Date</label>
                    <p className="font-semibold">
                      {format(new Date(booking.bookingDate), 'EEEE, dd MMMM yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FiClock className="text-primary text-xl mt-1" />
                  <div>
                    <label className="text-sm text-gray-600">Time</label>
                    <p className="font-semibold">
                      {booking.startTime} - {booking.endTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FiMapPin className="text-primary text-xl mt-1" />
                  <div>
                    <label className="text-sm text-gray-600">Location</label>
                    <p className="font-semibold">{booking.branch?.name}</p>
                    <p className="text-sm text-gray-600">{booking.branch?.address}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FiDollarSign className="text-primary text-xl mt-1" />
                  <div>
                    <label className="text-sm text-gray-600">Total Price</label>
                    <p className="font-semibold text-primary text-xl">
                      {booking.totalPrice} OMR
                    </p>
                  </div>
                </div>
              </div>

              {booking.notes && (
                <div className="mt-4 pt-4 border-t">
                  <label className="text-sm text-gray-600">Notes</label>
                  <p className="text-gray-800">{booking.notes}</p>
                </div>
              )}
            </div>

            {/* Payment Details */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-semibold">
                    {booking.payment?.method === 'Cash' ? 'Pay In Person' : 'Online Payment'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className={`badge ${getPaymentStatusColor(booking.payment?.status)}`}>
                    {booking.payment?.status}
                  </span>
                </div>
                {booking.payment?.paidAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Paid At</span>
                    <span className="font-semibold">
                      {format(new Date(booking.payment.paidAt), 'dd MMM yyyy HH:mm')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            {/* Actions */}
            {booking.status !== 'Cancelled' && booking.status !== 'Completed' && (
              <div className="card space-y-3">
                <h3 className="font-semibold mb-4">Actions</h3>
                <button
                  onClick={() => setCancelModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <FiX />
                  <span>{t('customer.cancelBooking')}</span>
                </button>
              </div>
            )}

            {/* Booking Timeline */}
            <div className="card mt-6">
              <h3 className="font-semibold mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Booking Created</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(booking.createdAt), 'dd MMM yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                {booking.status === 'Confirmed' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Confirmed</p>
                    </div>
                  </div>
                )}
                {booking.cancelledAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Cancelled</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(booking.cancelledAt), 'dd MMM yyyy HH:mm')}
                      </p>
                      {booking.cancellationReason && (
                        <p className="text-sm text-gray-600 mt-1">
                          Reason: {booking.cancellationReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Modal */}
        {cancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold mb-4">
                {t('customer.confirmCancel')}
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t('customer.cancellationReason')}
                className="input-field mb-4"
                rows="3"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setCancelModal(false)}
                  className="flex-1 btn-outline"
                  disabled={cancelling}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                  disabled={cancelling}
                >
                  {cancelling ? t('common.loading') : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BookingDetails;