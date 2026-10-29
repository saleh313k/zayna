// ============================================
// src/components/auth/WizardRegistration.jsx
// Registration wizard: choose account type -> (salon details) -> create account.
// Account types that may self-register: Customer and Salon owner. The server enforces this;
// Admin is configured by the operator and Stylists are added by their salon owner.
// ============================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Logo from '@/assets/img/logo.png';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../constants/roles';
import GoogleSignIn from './GoogleSignIn';
import EmailAuthForm from './EmailAuthForm';
import { homeForRole } from './Login';

const emptySalon = { salonName: '', salonNameAr: '', contactPhone: '', city: '', addressLine: '' };

const WizardRegistration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading, registerSalon } = useAuth();

  const [role, setRole] = useState(null); // ROLES.CUSTOMER | ROLES.SALON
  const [step, setStep] = useState(1);
  const [salon, setSalon] = useState(emptySalon);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // null | 'customer' | 'salon'

  const isSalon = role === ROLES.SALON;
  const accountStep = isSalon ? 3 : 2;
  const totalSteps = accountStep;

  const stepLabels = isSalon
    ? [t('registration.stepType', 'Account type'), t('registration.stepSalon', 'Salon details'), t('registration.stepAccount', 'Create account')]
    : [t('registration.stepType', 'Account type'), t('registration.stepAccount', 'Create account')];

  const handleSalonChange = (e) => setSalon({ ...salon, [e.target.name]: e.target.value });

  const submitSalonUpgrade = async () => {
    setSubmitting(true);
    try {
      await registerSalon(salon);
      setDone('salon');
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Called after any successful sign-in / sign-up in the account step.
  const handleAuthenticated = async (response) => {
    if (!isSalon) {
      setDone('customer');
      return;
    }
    if (response.role === ROLES.SALON) {
      setDone('salon'); // registered as a salon in a single call, or an existing salon owner signed in
    } else if (response.role === ROLES.CUSTOMER) {
      await submitSalonUpgrade(); // signed in as a customer (e.g. Google): upgrade with the details entered
    } else {
      navigate(homeForRole(response.role), { replace: true });
    }
  };

  const salonField = (name, label, props = {}) => (
    <div>
      <label className="block text-sm font-medium mb-1" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={salon[name]}
        onChange={handleSalonChange}
        className="w-full border rounded px-3 py-2"
        {...props}
      />
    </div>
  );

  const divider = (
    <div className="flex items-center my-2">
      <div className="flex-1 border-t" />
      <span className="px-3 text-sm text-gray-500">{t('auth.or', 'or')}</span>
      <div className="flex-1 border-t" />
    </div>
  );

  const roleCard = (value, icon, title, desc) => (
    <button
      type="button"
      onClick={() => setRole(value)}
      className={`p-6 rounded-lg border-2 transition-all text-center ${
        role === value ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-primary/50'
      }`}
    >
      <div className="text-4xl mb-2">{icon}</div>
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-gray-500 mt-1">{desc}</div>
    </button>
  );

  let body = null;

  if (loading) {
    body = null;
  } else if (done) {
    body = (
      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold">
          {done === 'salon'
            ? t('registration.salonSubmittedTitle', 'Thank you! Your salon was submitted.')
            : t('registration.customerWelcomeTitle', 'Welcome to Zayna!')}
        </h3>
        <p className="text-gray-600">
          {done === 'salon'
            ? t('registration.salonSubmittedBody', 'Our team will review your salon. It will appear publicly and accept bookings once approved.')
            : t('registration.customerWelcomeBody', 'Your account is ready. You can now book appointments.')}
        </p>
        <button
          className="btn-primary"
          onClick={() => navigate(done === 'salon' ? '/salon/dashboard' : '/dashboard', { replace: true })}
        >
          {t('registration.goDashboard', 'Go to my dashboard')}
        </button>
      </div>
    );
  } else if (step === 1) {
    body = (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">{t('registration.chooseType', 'How will you use Zayna?')}</h3>
        <div className="grid grid-cols-2 gap-4">
          {roleCard(ROLES.CUSTOMER, '👤', t('auth.customer', 'Customer'), t('registration.customerDesc', 'Book salon appointments'))}
          {roleCard(ROLES.SALON, '💈', t('auth.salon', 'Salon owner'), t('registration.salonDesc', 'List and manage my salon'))}
        </div>
        <button type="button" className="btn-primary w-full" disabled={role === null} onClick={() => setStep(2)}>
          {t('wizard.next', 'Next')}
        </button>
      </div>
    );
  } else if (isSalon && step === 2) {
    body = (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setStep(3);
        }}
      >
        {salonField('salonName', t('salonRegistration.salonName', 'Salon name'), { required: true, minLength: 2, maxLength: 100 })}
        {salonField('salonNameAr', t('salonRegistration.salonNameAr', 'Salon name (Arabic, optional)'), { maxLength: 100, dir: 'rtl' })}
        {salonField('contactPhone', t('salonRegistration.contactPhone', 'Contact phone'), { required: true, minLength: 6, maxLength: 20, type: 'tel' })}
        {salonField('city', t('salonRegistration.city', 'City'), { required: true, minLength: 2, maxLength: 100 })}
        {salonField('addressLine', t('salonRegistration.address', 'Address'), { required: true, minLength: 2, maxLength: 200 })}
        <div className="flex gap-3">
          <button type="button" className="btn-outline flex-1" onClick={() => setStep(1)}>{t('wizard.back', 'Back')}</button>
          <button type="submit" className="btn-primary flex-1">{t('wizard.next', 'Next')}</button>
        </div>
      </form>
    );
  } else {
    // Account step
    let accountBody;
    if (user) {
      if (!isSalon) {
        accountBody = (
          <div className="text-center space-y-4">
            <p>{t('registration.alreadySignedIn', 'You are already signed in.')}</p>
            <button className="btn-primary" onClick={() => navigate(homeForRole(user.role))}>
              {t('registration.goDashboard', 'Go to my dashboard')}
            </button>
          </div>
        );
      } else if (user.role === ROLES.SALON) {
        accountBody = (
          <div className="text-center space-y-4">
            <p>{t('salonRegistration.already', 'You already have a salon account.')}</p>
            <button className="btn-primary" onClick={() => navigate('/salon/dashboard')}>
              {t('registration.goDashboard', 'Go to my dashboard')}
            </button>
          </div>
        );
      } else if (user.role === ROLES.CUSTOMER) {
        accountBody = (
          <div className="text-center space-y-4">
            <p>{t('registration.submitAsSignedIn', 'You are signed in. Submit your salon for approval.')}</p>
            <button className="btn-primary" disabled={submitting} onClick={submitSalonUpgrade}>
              {submitting ? t('common.loading', 'Loading...') : t('salonRegistration.submit', 'Submit salon for approval')}
            </button>
          </div>
        );
      } else {
        accountBody = <p className="text-center">{t('salonRegistration.notAllowed', 'This account type cannot register a salon.')}</p>;
      }
    } else {
      accountBody = (
        <div className="space-y-4">
          <GoogleSignIn
            register
            role={isSalon ? ROLES.SALON : ROLES.CUSTOMER}
            salon={isSalon ? salon : undefined}
            onSuccess={handleAuthenticated}
          />
          {divider}
          <EmailAuthForm
            defaultMode="register"
            role={isSalon ? ROLES.SALON : ROLES.CUSTOMER}
            salon={isSalon ? salon : undefined}
            onSuccess={handleAuthenticated}
          />
        </div>
      );
    }

    body = (
      <div className="space-y-4">
        {accountBody}
        {!user && (
          <button type="button" className="text-sm text-gray-500 underline block mx-auto" onClick={() => setStep(isSalon ? 2 : 1)}>
            {t('wizard.back', 'Back')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 py-12">
      <div className="card max-w-2xl w-full">
        <div className="text-center mb-6 flex items-center justify-center">
          <Link to="/"><img src={Logo} alt="ZAYNA" className="h-20 w-auto object-contain" /></Link>
        </div>

        {!done && role !== null && (
          <div className="flex justify-between mb-8 gap-2">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex-1">
                <div className={`h-2 rounded ${step >= i + 1 ? 'bg-primary' : 'bg-gray-200'}`} />
                <p className={`text-xs sm:text-sm mt-2 text-center ${step >= i + 1 ? 'text-primary font-medium' : 'text-gray-400'}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}
        {!done && role === null && step === 1 && <div className="h-2 mb-8" aria-hidden />}

        {body}

        {!done && !user && (
          <p className="text-center text-sm text-gray-600 mt-6">
            {t('registration.haveAccount', 'Already have an account?')}{' '}
            <Link to="/login" className="text-primary font-medium">{t('auth.signIn', 'Sign in')}</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default WizardRegistration;
