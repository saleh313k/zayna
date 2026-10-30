// ============================================
// src/components/auth/Login.jsx
// ============================================
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '@/assets/img/logo.png';
import GoogleSignIn from './GoogleSignIn';
import EmailAuthForm from './EmailAuthForm';
import { ROLES } from '../../constants/roles';

export const homeForRole = (role) => {
  switch (role) {
    case ROLES.ADMIN:
      return '/admin/dashboard';
    case ROLES.SALON:
      return '/salon/dashboard';
    default:
      return '/dashboard';
  }
};

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8 flex items-center justify-center">
          <Link to="/" className="flex items-center">
            <img src={Logo} alt="ZAYNA - Your Time to Shine" className="h-20 w-auto object-contain" />
          </Link>
        </div>

        <h2 className="text-2xl font-semibold text-center mb-2">{t('auth.welcome')}</h2>
        <p className="text-center text-gray-600 mb-6">
          {t('auth.googleHint', 'Sign in with your Google account to book appointments or manage your salon.')}
        </p>

        <GoogleSignIn onSuccess={(res) => navigate(homeForRole(res.role), { replace: true })} />

        <div className="flex items-center my-5">
          <div className="flex-1 border-t" />
          <span className="px-3 text-sm text-gray-500">{t('auth.or', 'or')}</span>
          <div className="flex-1 border-t" />
        </div>

        <EmailAuthForm forcedMode="login" onSuccess={(res) => navigate(homeForRole(res.role), { replace: true })} />

        <p className="text-center text-sm text-gray-600 mt-6">
          {t('auth.newHere', 'New to Zayna?')}{' '}
          <Link to="/register" className="text-primary font-medium">
            {t('auth.createAccountLink', 'Create an account')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
