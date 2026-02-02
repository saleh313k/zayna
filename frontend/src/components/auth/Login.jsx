// ============================================
// src/components/auth/Login.jsx
// ============================================
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { toast } from 'react-toastify';
import { FiPhone, FiKey } from 'react-icons/fi';
import Logo from "@/assets/img/logo.png";


const Login = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await authService.sendOtp(phoneNumber, 'Login');
      setOtpSent(true);
      toast.success(t('auth.otpSent'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(phoneNumber, otpCode);
      toast.success(t('auth.loginSuccess'));
      
      // Redirect based on role
      if (response.role === 3) {
        navigate('/dashboard');
      } else if (response.role === 1) {
        navigate('/salon/dashboard');
      } else if (response.role === 0) {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8 flex items-center justify-center">
          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
            <img
              src={Logo}
              alt="ZAYNA - Your Time to Shine"
              className="h-20 w-auto object-contain"
            />
          </Link>
        </div>

        <h2 className="text-2xl font-semibold text-center mb-6">{t('auth.loginBtn')}</h2>

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('auth.phoneNumber')}
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+968 91234567"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? t('common.loading') : t('auth.sendOtp')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('auth.enterOtp')}
              </label>
              <div className="relative">
                <FiKey className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  maxLength="6"
                  className="input-field pl-10 text-center text-2xl tracking-widest"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? t('common.loading') : t('auth.loginBtn')}
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="text-sm text-primary hover:underline w-full text-center"
            >
              {t('auth.sendOtp')}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              {t('auth.registerBtn')}
            </Link>
          </p>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {t('auth.orContinueWith')}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-3">
            <button className="btn-outline p-2">
              <img src="/icons/google.svg" alt="Google" className="h-6 w-6 mx-auto" />
            </button>
            <button className="btn-outline p-2">
              <img src="/icons/apple.svg" alt="Apple" className="h-6 w-6 mx-auto" />
            </button>
            <button className="btn-outline p-2">
              <img src="/icons/facebook.svg" alt="Facebook" className="h-6 w-6 mx-auto" />
            </button>
            <button className="btn-outline p-2">
              <img src="/icons/twitter.svg" alt="Twitter" className="h-6 w-6 mx-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;