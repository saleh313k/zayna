// ============================================
// src/components/auth/WizardRegistration.jsx
// ============================================
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { toast } from 'react-toastify';
import { FiPhone, FiUser, FiMail, FiKey } from 'react-icons/fi';
import Logo from "@/assets/img/logo.png";


const WizardRegistration = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: '',
    phoneNumber: '',
    otpCode: '',
    email: '',
    fullName: '',
    fullNameAr: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async () => {
    if (!formData.phoneNumber) {
      toast.error('Please enter phone number');
      return;
    }

    setLoading(true);
    try {
      await authService.sendOtp(formData.phoneNumber, 'Registration');
      toast.success(t('auth.otpSent'));
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData);
      toast.success(t('auth.registerSuccess'));
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 py-12">
      <div className="card max-w-2xl w-full">
        <div className="text-center mb-8 flex items-center justify-center">
          <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
            <img
              src={Logo}
              alt="ZAYNA - Your Time to Shine"
              className="h-20 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1">
              <div className={`h-2 rounded ${step >= s ? 'bg-primary' : 'bg-gray-200'}`}></div>
              <p className={`text-sm mt-2 text-center ${step >= s ? 'text-primary font-medium' : 'text-gray-400'}`}>
                {t(`wizard.step${s}`)}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select User Type */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-center mb-6">
                {t('wizard.step1')}
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'Customer' })}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    formData.role === 'Customer'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  <div className="text-4xl mb-2">👤</div>
                  <div className="font-semibold">{t('auth.customer')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'Salon' })}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    formData.role === 'Salon'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  <div className="text-4xl mb-2">💈</div>
                  <div className="font-semibold">{t('auth.salon')}</div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.role}
                className="btn-primary w-full"
              >
                {t('wizard.next')}
              </button>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-center mb-6">
                {t('wizard.step2')}
              </h2>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('auth.phoneNumber')} *
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+968 91234567"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('auth.fullName')} *
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-outline flex-1"
                >
                  {t('wizard.previous')}
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? t('common.loading') : t('wizard.next')}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Verify OTP */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-center mb-6">
                {t('auth.verifyOtp')}
              </h2>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('auth.enterOtp')}
                </label>
                <div className="relative">
                  <FiKey className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="otpCode"
                    value={formData.otpCode}
                    onChange={handleChange}
                    placeholder="123456"
                    maxLength="6"
                    className="input-field pl-10 text-center text-2xl tracking-widest"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-outline flex-1"
                >
                  {t('wizard.previous')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? t('common.loading') : t('wizard.finish')}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSendOtp}
                className="text-sm text-primary hover:underline w-full text-center"
              >
                Resend OTP
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default WizardRegistration;