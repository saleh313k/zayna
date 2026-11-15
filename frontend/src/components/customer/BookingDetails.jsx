// ============================================
// src/components/customer/BookingDetails.jsx
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FiCalendar, FiClock, FiMapPin, FiPhone, FiUser, FiScissors, FiCheckCircle } from 'react-icons/fi';
import Layout from '../common/Layout';
import ReviewForm from '../reviews/ReviewForm';
import { bookingService } from '../../services/bookingService';
import { BOOKING_STATUS, formatBookingDate, formatMoney, localized } from '../../utils/bookingFormat';

const BookingDetails = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const location = useLocation();
  const justBooked = Boolean(location.state?.justBooked);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setError(false);
    try {
      const data = await bookingService.getBookingById(id);
      setBooking(data.booking);
    } catch (e) {
      if (e.response?.status === 404) setNotFound(true);
      else setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const cancel = async () => {
    setCancelling(true);
    try {
      await bookingService.cancelBooking(id, reason.trim());
      toast.success(t('bookingDetails.cancelled', 'Your booking was cancelled.'));
      setShowCancel(false);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || t('common.error'));
      await load(); // the booking may have changed (e.g. the cancellation window just closed)
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <Layout><div className="flex justify-center items-center h-64"><div className="spinner"></div></div></Layout>;
  }

  if (notFound || error || !booking) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto card text-center py-12">
          <p className="text-gray-700 mb-4">
            {notFound
              ? t('bookingDetails.notFound', 'Booking not found.')
              : t('bookingDetails.loadError', 'Could not load this booking. Please try again.')}
          </p>
          <Link to="/dashboard" className="btn-primary">{t('bookingDetails.backToBookings', 'Back to my bookings')}</Link>
        </div>
      </Layout>
    );
  }

  const status = BOOKING_STATUS[booking.status];
  const isActive = booking.status === 0 || booking.status === 1;
  const mapQuery = encodeURIComponent([booking.branch.address, booking.branch.city].filter(Boolean).join(', '));

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {justBooked && (
          <div className="card bg-green-50 border border-green-200 mb-6 flex items-start gap-3">
            <FiCheckCircle className="text-green-600 text-2xl mt-0.5" />
            <div>
              <p className="font-semibold text-green-800">
                {booking.status === 1
                  ? t('bookingDetails.justBookedConfirmed', 'Your booking is confirmed!')
                  : t('bookingDetails.justBookedPending', 'Your booking was received and is waiting for the salon to confirm.')}
              </p>
              <p className="text-sm text-green-700">{t('bookingDetails.keepNumber', 'Keep your booking number for reference.')}</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-start mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">{t('bookingDetails.title', 'Booking details')}</h1>
            <p className="text-gray-600 font-mono">{booking.bookingNumber}</p>
          </div>
          <span className={`badge ${status?.badge || ''}`}>{status ? t(`admin.status_${status.key}`, status.label) : booking.status}</span>
        </div>

        <div className="card space-y-4 mb-6">
          <h2 className="text-xl font-semibold">{localized(lang, booking.salon.name, booking.salon.nameAr)}</h2>

          <Detail icon={FiScissors} label={t('bookingFlow.stepService', 'Service')}
            value={`${localized(lang, booking.service.name, booking.service.nameAr)} (${booking.service.durationMinutes} ${t('bookingFlow.min', 'min')})`} />
          <Detail icon={FiUser} label={t('bookingFlow.stepStylist', 'Stylist')} value={localized(lang, booking.stylist.name, booking.stylist.nameAr)} />
          <Detail icon={FiCalendar} label={t('bookingFlow.date', 'Date')} value={formatBookingDate(booking.bookingDate, lang)} />
          <Detail icon={FiClock} label={t('bookingDetails.time', 'Time')} value={`${booking.startTime} - ${booking.endTime}`} />
          <Detail
            icon={FiMapPin}
            label={t('bookingFlow.branch', 'Branch')}
            value={[localized(lang, booking.branch.name, booking.branch.nameAr), booking.branch.address, booking.branch.city].filter(Boolean).join(', ')}
          />
          {mapQuery && (
            <a className="text-primary text-sm hover:underline inline-block"
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noreferrer">
              {t('salon.getDirections', 'Get Directions')}
            </a>
          )}
          {booking.salon.phone && (
            <Detail icon={FiPhone} label={t('bookingDetails.salonPhone', 'Salon phone')}
              value={<a className="text-primary hover:underline" href={`tel:${booking.salon.phone}`}>{booking.salon.phone}</a>} />
          )}

          {booking.notes && (
            <div className="border-t pt-3">
              <p className="text-sm text-gray-600">{t('bookingFlow.notes', 'Notes for the salon (optional)')}</p>
              <p>{booking.notes}</p>
            </div>
          )}

          <div className="border-t pt-4 flex justify-between items-center">
            <span className="text-gray-600">
              {booking.paymentType === 0 ? t('admin.paymentOnline', 'Online') : t('bookingFlow.payAtSalon', 'Pay at the salon')}
            </span>
            <span className="font-bold text-primary text-xl">{formatMoney(booking.totalAmount)}</span>
          </div>
        </div>

        {booking.status === 4 && booking.cancellationReason && (
          <div className="card mb-6">
            <p className="text-sm text-gray-600">{t('bookingDetails.cancelReason', 'Cancellation reason')}</p>
            <p>{booking.cancellationReason}</p>
          </div>
        )}

        {/* Review: only for completed appointments (the server enforces this too) */}
        {booking.status === 3 && <ReviewForm bookingId={booking.id} />}

        {/* Cancel */}
        {isActive && booking.canCancel && !showCancel && (
          <button className="text-red-600 hover:underline" onClick={() => setShowCancel(true)}>
            {t('customer.cancelBooking', 'Cancel booking')}
          </button>
        )}
        {isActive && !booking.canCancel && (
          <p className="text-sm text-gray-600">
            {t('bookingDetails.cannotCancel', 'This booking can no longer be cancelled online. Please contact the salon.')}
          </p>
        )}
        {showCancel && (
          <div className="card space-y-3">
            <label className="block font-semibold" htmlFor="cancel-reason">
              {t('bookingDetails.reasonLabel', 'Reason (optional)')}
            </label>
            <textarea id="cancel-reason" rows={3} maxLength={500} value={reason}
              onChange={(e) => setReason(e.target.value)} className="input-field" />
            <div className="flex gap-3">
              <button className="btn-outline" disabled={cancelling} onClick={() => setShowCancel(false)}>
                {t('bookingDetails.keepBooking', 'Keep booking')}
              </button>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50" disabled={cancelling} onClick={cancel}>
                {cancelling ? t('common.loading', 'Loading...') : t('bookingDetails.confirmCancel', 'Yes, cancel booking')}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link to="/dashboard" className="text-primary hover:underline">{t('bookingDetails.backToBookings', 'Back to my bookings')}</Link>
        </div>
      </div>
    </Layout>
  );
};

const Detail = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="text-primary mt-1" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

export default BookingDetails;
