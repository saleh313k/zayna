// ============================================
// src/components/customer/BookingFlow.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { salonService } from '../../services/salonService';
import { bookingService } from '../../services/bookingService';
import { toast } from 'react-toastify';
import Layout from '../common/Layout';
import { format } from 'date-fns';

const BookingFlow = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [salons, setSalons] = useState([]);
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const [bookingData, setBookingData] = useState({
    salonId: searchParams.get('salon') || '',
    branchId: '',
    serviceId: '',
    stylistId: '',
    bookingDate: '',
    startTime: '',
    paymentMethod: 'Cash',
    notes: ''
  });

  useEffect(() => {
    fetchSalons();
  }, []);

  useEffect(() => {
    if (bookingData.salonId) {
      fetchSalonData(bookingData.salonId);
    }
  }, [bookingData.salonId]);

  useEffect(() => {
    if (bookingData.stylistId && bookingData.serviceId && bookingData.bookingDate) {
      fetchTimeSlots();
    }
  }, [bookingData.stylistId, bookingData.serviceId, bookingData.bookingDate]);

  const fetchSalons = async () => {
    try {
      const data = await salonService.getAllSalons();
      setSalons(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSalonData = async (salonId) => {
    try {
      const [salonData, servicesData, stylistsData] = await Promise.all([
        salonService.getSalonById(salonId),
        salonService.getSalonServices(salonId),
        salonService.getSalonStylists(salonId)
      ]);

      setBranches(salonData.branches || []);
      setServices(servicesData);
      setStylists(stylistsData);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const slots = await bookingService.getAvailableSlots(
        bookingData.stylistId,
        bookingData.serviceId,
        bookingData.bookingDate
      );
      setTimeSlots(slots);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const booking = await bookingService.createBooking(bookingData);
      toast.success(t('booking.bookingConfirmed'));
      navigate(`/booking/${booking.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const selectedService = services.find(s => s.id === bookingData.serviceId);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8">{t('customer.newBooking')}</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Step 1: Select Salon & Branch */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">{t('booking.selectSalon')}</h3>
              <select
                value={bookingData.salonId}
                onChange={(e) => setBookingData({ ...bookingData, salonId: e.target.value, branchId: '' })}
                className="input-field mb-4"
              >
                <option value="">{t('booking.selectSalon')}</option>
                {salons.map(salon => (
                  <option key={salon.id} value={salon.id}>{salon.name}</option>
                ))}
              </select>

              {branches.length > 0 && (
                <select
                  value={bookingData.branchId}
                  onChange={(e) => setBookingData({ ...bookingData, branchId: e.target.value })}
                  className="input-field"
                >
                  <option value="">{t('booking.selectBranch')}</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Step 2: Select Service */}
            {bookingData.branchId && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">{t('booking.selectService')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {services.map(service => (
                    <button
                      key={service.id}
                      onClick={() => setBookingData({ ...bookingData, serviceId: service.id })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        bookingData.serviceId === service.id
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <div className="font-semibold mb-1">{service.name}</div>
                      <div className="text-sm text-gray-600 mb-2">{service.durationMinutes} min</div>
                      <div className="text-primary font-semibold">{service.price} OMR</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Select Stylist & Date & Time */}
            {bookingData.serviceId && (
              <>
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">{t('booking.selectStylist')}</h3>
                  <div className="space-y-2">
                    {stylists.filter(s => s.services.some(srv => srv.id === bookingData.serviceId)).map(stylist => (
                      <button
                        key={stylist.id}
                        onClick={() => setBookingData({ ...bookingData, stylistId: stylist.id })}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          bookingData.stylistId === stylist.id
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        <div className="font-semibold">{stylist.fullName}</div>
                        <div className="text-sm text-gray-600">{stylist.yearsOfExperience} years experience</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">{t('booking.selectDate')}</h3>
                  <input
                    type="date"
                    value={bookingData.bookingDate}
                    onChange={(e) => setBookingData({ ...bookingData, bookingDate: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="input-field"
                  />
                </div>

                {timeSlots.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-4">{t('booking.selectTime')}</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.filter(slot => slot.isAvailable).map((slot, idx) => (
                        <button
                          key={idx}
                          onClick={() => setBookingData({ ...bookingData, startTime: slot.startTime })}
                          className={`py-2 rounded-lg border-2 transition-all ${
                            bookingData.startTime === slot.startTime
                              ? 'border-primary bg-primary text-white'
                              : 'border-gray-200 hover:border-primary/50'
                          }`}
                        >
                          {slot.startTime}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Payment & Notes */}
            {bookingData.startTime && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">{t('booking.paymentMethod')}</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <button
                    onClick={() => setBookingData({ ...bookingData, paymentMethod: 'Cash' })}
                    className={`p-4 rounded-lg border-2 ${
                      bookingData.paymentMethod === 'Cash'
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200'
                    }`}
                  >
                    {t('booking.payInPerson')}
                  </button>
                  <button
                    onClick={() => setBookingData({ ...bookingData, paymentMethod: 'Online' })}
                    className={`p-4 rounded-lg border-2 ${
                      bookingData.paymentMethod === 'Online'
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200'
                    }`}
                  >
                    {t('booking.payOnline')}
                  </button>
                </div>

                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  placeholder={t('booking.notes')}
                  className="input-field"
                  rows="3"
                />

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary w-full mt-4"
                >
                  {loading ? t('common.loading') : t('booking.bookNow')}
                </button>
              </div>
            )}
          </div>

          {/* Booking Summary */}
          <div className="md:col-span-1">
            <div className="card sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
              <div className="space-y-3 text-sm">
                {selectedService && (
                  <>
                    <div>
                      <span className="text-gray-600">Service:</span>
                      <p className="font-semibold">{selectedService.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Price:</span>
                      <p className="font-semibold text-primary">{selectedService.price} OMR</p>
                    </div>
                  </>
                )}
                {bookingData.bookingDate && (
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="font-semibold">{format(new Date(bookingData.bookingDate), 'dd MMM yyyy')}</p>
                  </div>
                )}
                {bookingData.startTime && (
                  <div>
                    <span className="text-gray-600">Time:</span>
                    <p className="font-semibold">{bookingData.startTime}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookingFlow;