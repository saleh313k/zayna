// ============================================
// src/components/customer/BookingFlow.jsx
// Service -> stylist (and branch) -> date & time -> confirm.
// Everything comes from the server (catalog + availability); the server re-validates and
// atomically re-checks the slot on submit, so a stale screen can never double-book.
// ============================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FiClock, FiMapPin, FiUser, FiCheck } from 'react-icons/fi';
import Layout from '../common/Layout';
import { bookingService } from '../../services/bookingService';
import { formatBookingDate, formatMoney, hhmm, localized, toIsoDate } from '../../utils/bookingFormat';

const STEPS = ['service', 'stylist', 'time', 'confirm'];

const Spinner = () => (
  <div className="flex justify-center items-center h-64"><div className="spinner"></div></div>
);

const BookingFlow = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const salonId = params.get('salonId');

  // --- salon picker (when no salonId in the URL) ---
  const [salons, setSalons] = useState([]);
  const [salonsLoading, setSalonsLoading] = useState(!salonId);

  // --- booking options for the chosen salon ---
  const [options, setOptions] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(Boolean(salonId));
  const [optionsError, setOptionsError] = useState(null); // 'notfound' | 'error'

  // --- selections ---
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [stylistId, setStylistId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState(1); // 1 = pay at the salon

  // --- slots ---
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const slotRequest = useRef(0);

  const [submitting, setSubmitting] = useState(false);

  // Load the salon picker.
  useEffect(() => {
    if (salonId) return;
    let alive = true;
    bookingService.getBookableSalons()
      .then((d) => alive && setSalons(d.salons || []))
      .catch(() => alive && setSalons([]))
      .finally(() => alive && setSalonsLoading(false));
    return () => { alive = false; };
  }, [salonId]);

  // Load the options for the salon.
  useEffect(() => {
    if (!salonId) return;
    let alive = true;
    setOptionsLoading(true);
    setOptionsError(null);
    bookingService.getBookingOptions(salonId)
      .then((d) => alive && setOptions(d))
      .catch((e) => alive && setOptionsError(e.response?.status === 404 ? 'notfound' : 'error'))
      .finally(() => alive && setOptionsLoading(false));
    return () => { alive = false; };
  }, [salonId]);

  const service = useMemo(() => options?.services.find((s) => s.id === serviceId), [options, serviceId]);
  const stylistsForService = useMemo(
    () => (options?.stylists || []).filter((s) => s.serviceIds.includes(serviceId)),
    [options, serviceId]
  );
  const branchesForService = useMemo(() => {
    const ids = new Set(stylistsForService.map((s) => s.branchId));
    return (options?.branches || []).filter((b) => ids.has(b.id));
  }, [options, stylistsForService]);
  const stylistsForBranch = useMemo(
    () => stylistsForService.filter((s) => s.branchId === branchId),
    [stylistsForService, branchId]
  );
  const stylist = useMemo(() => options?.stylists.find((s) => s.id === stylistId), [options, stylistId]);
  const branch = useMemo(() => options?.branches.find((b) => b.id === branchId), [options, branchId]);
  const policy = options?.policy;

  const today = useMemo(() => toIsoDate(new Date()), []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (policy?.maxDaysAhead ?? 60));
    return toIsoDate(d);
  }, [policy]);

  const loadSlots = useCallback(async () => {
    if (!stylistId || !serviceId || !date) return;
    const id = ++slotRequest.current;
    setSlotsLoading(true);
    setSlotsError(false);
    try {
      const data = await bookingService.getAvailableSlots(stylistId, serviceId, date);
      if (id !== slotRequest.current) return; // a newer request superseded this one
      setSlots(data.slots || []);
    } catch {
      if (id === slotRequest.current) { setSlots([]); setSlotsError(true); }
    } finally {
      if (id === slotRequest.current) setSlotsLoading(false);
    }
  }, [stylistId, serviceId, date]);

  useEffect(() => {
    setStartTime('');
    loadSlots();
  }, [loadSlots]);

  const chooseService = (id) => {
    setServiceId(id);
    setStylistId('');
    setStartTime('');
    // Pre-select the branch when there is only one choice.
    const ids = new Set((options?.stylists || []).filter((s) => s.serviceIds.includes(id)).map((s) => s.branchId));
    const candidates = (options?.branches || []).filter((b) => ids.has(b.id));
    setBranchId(candidates.length === 1 ? candidates[0].id : '');
    setStep(1);
  };

  const chooseBranch = (id) => { setBranchId(id); setStylistId(''); setStartTime(''); };
  const chooseStylist = (id) => { setStylistId(id); setStartTime(''); setStep(2); };

  const submit = async () => {
    setSubmitting(true);
    try {
      const data = await bookingService.createBooking({
        salonId,
        branchId,
        stylistId,
        serviceId,
        bookingDate: date,
        startTime,
        paymentType,
        notes: notes.trim() || null,
      });
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // online payment (only when enabled on the server)
        return;
      }
      toast.success(t('bookingFlow.booked', 'Your booking is confirmed!'));
      navigate(`/booking/${data.booking.id}`, { replace: true, state: { justBooked: true } });
    } catch (e) {
      const code = e.response?.data?.code;
      toast.error(e.response?.data?.message || t('common.error'));
      if (code === 'SLOT_UNAVAILABLE' || code === 'BOOKING_BUSY') {
        setStartTime('');
        setStep(2);
        loadSlots(); // show the fresh list of free times
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------- salon picker
  if (!salonId) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-2">{t('bookingFlow.chooseSalon', 'Choose a salon')}</h1>
          <p className="text-gray-600 mb-8">{t('bookingFlow.chooseSalonHint', 'Salons you can book online with Zayna')}</p>
          {salonsLoading ? <Spinner /> : salons.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-4">{t('bookingFlow.noSalons', 'No salons are accepting online bookings yet.')}</p>
              <Link to="/salons" className="btn-primary">{t('nav.salons', 'Salons')}</Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {salons.map((s) => (
                <div key={s.id} className="card hover:shadow-xl transition-shadow">
                  <h2 className="text-xl font-semibold mb-1">{localized(lang, s.name, s.nameAr)}</h2>
                  <p className="text-sm text-gray-600 flex items-center mb-4">
                    <FiMapPin className="mr-2 rtl:mr-0 rtl:ml-2" />{[s.city, s.address].filter(Boolean).join(' - ') || '-'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {t('bookingFlow.fromPrice', 'From {{price}}', { price: formatMoney(s.fromPrice) })}
                    </span>
                    <Link to={`/book?salonId=${s.id}`} className="btn-primary">{t('bookingFlow.bookNow', 'Book now')}</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ---------------------------------------------------------------- loading / errors
  if (optionsLoading) return <Layout><Spinner /></Layout>;

  if (optionsError || !options) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto card text-center py-12">
          <p className="text-gray-700 mb-4">
            {optionsError === 'notfound'
              ? t('bookingFlow.salonNotFound', 'This salon is not available for online booking.')
              : t('bookingFlow.loadError', 'Could not load the booking options. Please try again.')}
          </p>
          <Link to="/book" className="btn-primary">{t('bookingFlow.chooseAnother', 'Choose another salon')}</Link>
        </div>
      </Layout>
    );
  }

  if (options.services.length === 0 || options.stylists.length === 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto card text-center py-12">
          <h2 className="text-xl font-semibold mb-2">{localized(lang, options.salon.name, options.salon.nameAr)}</h2>
          <p className="text-gray-600 mb-4">{t('bookingFlow.notReady', 'This salon is not accepting online bookings yet.')}</p>
          {options.salon.phone && <a className="text-primary hover:underline" href={`tel:${options.salon.phone}`}>{options.salon.phone}</a>}
        </div>
      </Layout>
    );
  }

  // ---------------------------------------------------------------- the flow
  const stepLabels = [
    t('bookingFlow.stepService', 'Service'),
    t('bookingFlow.stepStylist', 'Stylist'),
    t('bookingFlow.stepTime', 'Date & time'),
    t('bookingFlow.stepConfirm', 'Confirm'),
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-1">{localized(lang, options.salon.name, options.salon.nameAr)}</h1>
        <p className="text-gray-600 mb-6">{t('bookingFlow.title', 'Book an appointment')}</p>

        {/* Progress */}
        <div className="flex justify-between mb-8 gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-2 rounded ${step >= i ? 'bg-primary' : 'bg-gray-200'}`} />
              <p className={`text-xs sm:text-sm mt-2 text-center ${step >= i ? 'text-primary font-medium' : 'text-gray-400'}`}>
                {stepLabels[i]}
              </p>
            </div>
          ))}
        </div>

        {/* 1. Service */}
        {step === 0 && (
          <div className="space-y-3">
            {options.services.map((s) => (
              <button
                key={s.id}
                onClick={() => chooseService(s.id)}
                className="card w-full text-left rtl:text-right hover:shadow-xl transition-shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{localized(lang, s.name, s.nameAr)}</p>
                  {s.description && <p className="text-sm text-gray-600">{s.description}</p>}
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <FiClock className="mr-1 rtl:mr-0 rtl:ml-1" />{s.durationMinutes} {t('bookingFlow.min', 'min')}
                  </p>
                </div>
                <span className="font-semibold text-primary">{formatMoney(s.price)}</span>
              </button>
            ))}
          </div>
        )}

        {/* 2. Stylist (and branch) */}
        {step === 1 && service && (
          <div className="space-y-6">
            {branchesForService.length > 1 && (
              <div>
                <h3 className="font-semibold mb-2">{t('bookingFlow.branch', 'Branch')}</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {branchesForService.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => chooseBranch(b.id)}
                      className={`card text-left rtl:text-right ${branchId === b.id ? 'ring-2 ring-primary' : ''}`}
                    >
                      <p className="font-semibold">{localized(lang, b.name, b.nameAr)}</p>
                      <p className="text-sm text-gray-600">{[b.city, b.address].filter(Boolean).join(' - ')}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {branchId && (
              <div>
                <h3 className="font-semibold mb-2">{t('bookingFlow.chooseStylist', 'Choose a stylist')}</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {stylistsForBranch.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => chooseStylist(s.id)}
                      className="card text-left rtl:text-right hover:shadow-xl transition-shadow flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><FiUser /></div>
                      <div>
                        <p className="font-semibold">{localized(lang, s.name, s.nameAr)}</p>
                        {s.yearsOfExperience > 0 && (
                          <p className="text-xs text-gray-500">{t('bookingFlow.years', '{{n}} years experience', { n: s.yearsOfExperience })}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button className="text-sm text-gray-500 underline" onClick={() => setStep(0)}>{t('wizard.back', 'Back')}</button>
          </div>
        )}

        {/* 3. Date & time */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block font-semibold mb-2" htmlFor="booking-date">{t('bookingFlow.date', 'Date')}</label>
              <input
                id="booking-date"
                type="date"
                min={today}
                max={maxDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field max-w-xs"
              />
            </div>

            {date && (
              <div>
                <h3 className="font-semibold mb-2">{t('bookingFlow.availableTimes', 'Available times')}</h3>
                {slotsLoading ? (
                  <div className="py-6 flex"><div className="spinner"></div></div>
                ) : slotsError ? (
                  <p className="text-red-600">
                    {t('bookingFlow.slotsError', 'Could not load times.')}{' '}
                    <button className="underline" onClick={loadSlots}>{t('admin.retry', 'Retry')}</button>
                  </p>
                ) : slots.length === 0 ? (
                  <p className="text-gray-600">{t('bookingFlow.noSlots', 'No available times on this date. Please try another day.')}</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStartTime(s)}
                        className={`py-2 rounded-lg border ${startTime === s ? 'bg-primary text-white border-primary' : 'hover:border-primary'}`}
                      >
                        {hhmm(s)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button className="btn-outline" onClick={() => setStep(1)}>{t('wizard.back', 'Back')}</button>
              <button className="btn-primary" disabled={!startTime} onClick={() => setStep(3)}>{t('wizard.next', 'Next')}</button>
            </div>
          </div>
        )}

        {/* 4. Confirm */}
        {step === 3 && service && stylist && branch && (
          <div className="space-y-6">
            <div className="card space-y-3">
              <h3 className="font-semibold text-lg">{t('bookingFlow.summary', 'Booking summary')}</h3>
              <Row label={t('bookingFlow.stepService', 'Service')} value={`${localized(lang, service.name, service.nameAr)} (${service.durationMinutes} ${t('bookingFlow.min', 'min')})`} />
              <Row label={t('bookingFlow.stepStylist', 'Stylist')} value={localized(lang, stylist.name, stylist.nameAr)} />
              <Row label={t('bookingFlow.branch', 'Branch')} value={[localized(lang, branch.name, branch.nameAr), branch.address].filter(Boolean).join(' - ')} />
              <Row label={t('bookingFlow.date', 'Date')} value={`${formatBookingDate(date, lang)} - ${hhmm(startTime)}`} />
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold">{t('bookingFlow.total', 'Total')}</span>
                <span className="font-bold text-primary text-xl">{formatMoney(service.price)}</span>
              </div>
            </div>

            <div className="card space-y-3">
              <h3 className="font-semibold">{t('bookingFlow.payment', 'Payment')}</h3>
              <label className="flex items-center gap-2">
                <input type="radio" name="payment" checked={paymentType === 1} onChange={() => setPaymentType(1)} />
                {t('bookingFlow.payAtSalon', 'Pay at the salon')}
              </label>
              {policy?.onlinePaymentEnabled && (
                <label className="flex items-center gap-2">
                  <input type="radio" name="payment" checked={paymentType === 0} onChange={() => setPaymentType(0)} />
                  {t('bookingFlow.payOnline', 'Pay online')}
                </label>
              )}
            </div>

            <div>
              <label className="block font-semibold mb-2" htmlFor="booking-notes">{t('bookingFlow.notes', 'Notes for the salon (optional)')}</label>
              <textarea
                id="booking-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
                className="input-field"
              />
            </div>

            <p className="text-xs text-gray-500">
              {t('bookingFlow.cancelPolicy', 'You can cancel free of charge up to {{h}} hour(s) before your appointment.', { h: policy?.cancellationCutoffHours ?? 2 })}
            </p>

            <div className="flex gap-3">
              <button className="btn-outline" disabled={submitting} onClick={() => setStep(2)}>{t('wizard.back', 'Back')}</button>
              <button className="btn-primary flex items-center gap-2" disabled={submitting} onClick={submit}>
                <FiCheck />
                {submitting ? t('common.loading', 'Loading...') : t('bookingFlow.confirm', 'Confirm booking')}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 text-sm">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium text-right rtl:text-left">{value}</span>
  </div>
);

export default BookingFlow;
