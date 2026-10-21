// ============================================
// src/components/auth/WizardRegistration.jsx
// Salon-owner onboarding: Google sign-in -> salon details -> pending admin approval.
// (Customers do not register; they just sign in with Google.)
// ============================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Logo from '@/assets/img/logo.png';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../constants/roles';
import GoogleSignIn from './GoogleSignIn';

const emptyForm = { salonName: '', salonNameAr: '', contactPhone: '', city: '', addressLine: '' };

const WizardRegistration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading, registerSalon } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerSalon(form);
      setSubmitted(true);
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div>
      <label className="block text-sm font-medium mb-1" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={form[name]}
        onChange={handleChange}
        className="input w-full border rounded px-3 py-2"
        {...props}
      />
    </div>
  );

  let body;
  if (loading) {
    body = null;
  } else if (submitted) {
    body = (
      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold">{t('salonRegistration.submittedTitle', 'Thank you! Your salon was submitted.')}</h3>
        <p className="text-gray-600">
          {t('salonRegistration.submittedBody', 'Our team will review your salon. It will appear publicly and accept bookings once approved.')}
        </p>
        <button className="btn-primary" onClick={() => navigate('/salon/dashboard')}>
          {t('salonRegistration.goDashboard', 'Go to my dashboard')}
        </button>
      </div>
    );
  } else if (!user) {
    body = (
      <div className="space-y-4">
        <p className="text-gray-600 text-center">
          {t('salonRegistration.signInFirst', 'First, sign in with Google. Then you will enter your salon details.')}
        </p>
        <GoogleSignIn />
      </div>
    );
  } else if (user.role === ROLES.SALON) {
    body = (
      <div className="text-center space-y-4">
        <p>{t('salonRegistration.already', 'You already have a salon account.')}</p>
        <Link to="/salon/dashboard" className="btn-primary inline-block">
          {t('salonRegistration.goDashboard', 'Go to my dashboard')}
        </Link>
      </div>
    );
  } else if (user.role !== ROLES.CUSTOMER) {
    body = <p className="text-center">{t('salonRegistration.notAllowed', 'This account type cannot register a salon.')}</p>;
  } else {
    body = (
      <form onSubmit={handleSubmit} className="space-y-4">
        {field('salonName', t('salonRegistration.salonName', 'Salon name'), { required: true, minLength: 2, maxLength: 100 })}
        {field('salonNameAr', t('salonRegistration.salonNameAr', 'Salon name (Arabic, optional)'), { maxLength: 100, dir: 'rtl' })}
        {field('contactPhone', t('salonRegistration.contactPhone', 'Contact phone'), { required: true, minLength: 6, maxLength: 20, type: 'tel' })}
        {field('city', t('salonRegistration.city', 'City'), { required: true, minLength: 2, maxLength: 100 })}
        {field('addressLine', t('salonRegistration.address', 'Address'), { required: true, minLength: 2, maxLength: 200 })}
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? t('common.loading', 'Loading...') : t('salonRegistration.submit', 'Submit salon for approval')}
        </button>
      </form>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 py-12">
      <div className="card max-w-lg w-full">
        <div className="text-center mb-6 flex items-center justify-center">
          <Link to="/"><img src={Logo} alt="ZAYNA" className="h-20 w-auto object-contain" /></Link>
        </div>
        <h2 className="text-2xl font-semibold text-center mb-6">
          {t('salonRegistration.title', 'Register your salon')}
        </h2>
        {body}
      </div>
    </div>
  );
};

export default WizardRegistration;
