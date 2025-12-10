// ============================================
// src/components/common/Navbar.jsx
// ============================================
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import { FiUser, FiLogOut, FiCalendar } from 'react-icons/fi';

const Navbar = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-primary">
              {t('brand.name')}
            </div>
            <div className="text-sm text-accent hidden md:block">
              {t('brand.slogan')}
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link to="/salons" className="text-text hover:text-primary transition-colors">
              {t('nav.salons')}
            </Link>

            {user && (
              <>
                <Link to="/bookings" className="flex items-center space-x-2 text-text hover:text-primary transition-colors">
                  <FiCalendar />
                  <span>{t('nav.bookings')}</span>
                </Link>

                <Link to="/dashboard" className="flex items-center space-x-2 text-text hover:text-primary transition-colors">
                  <FiUser />
                  <span>{t('nav.dashboard')}</span>
                </Link>

                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-text hover:text-primary transition-colors"
                >
                  <FiLogOut />
                  <span>{t('nav.logout')}</span>
                </button>
              </>
            )}

            {!user && (
              <>
                <Link to="/login" className="text-text hover:text-primary transition-colors">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn-primary">
                  {t('nav.register')}
                </Link>
              </>
            )}

            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;