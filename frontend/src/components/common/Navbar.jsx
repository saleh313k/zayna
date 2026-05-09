<<<<<<< HEAD
// ============================================
// src/components/common/Navbar.jsx
// ============================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import { FiUser, FiLogOut, FiCalendar, FiMenu, FiX } from 'react-icons/fi';
import Logo from "@/assets/img/logo.png";


const Navbar = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
            <img
              src={Logo}
              alt="ZAYNA - Your Time to Shine"
              className="h-14 w-auto object-contain"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/salons" className="text-text hover:text-primary transition-colors">
              {t('nav.salons')}
            </Link>

            {user && (
              <>
                <Link
                  to="/bookings"
                  className="flex items-center space-x-2 text-text hover:text-primary transition-colors"
                >
                  <FiCalendar />
                  <span>{t('nav.bookings')}</span>
                </Link>

                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 text-text hover:text-primary transition-colors"
                >
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

          {/* Mobile Button */}
          <button
            className="md:hidden text-2xl text-text"
            onClick={() => setOpen(!open)}
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white px-6 py-5 space-y-4 shadow-lg">

          <Link to="/salons" onClick={() => setOpen(false)} className="block text-text hover:text-primary">
            {t('nav.salons')}
          </Link>

          {user && (
            <>
              <Link to="/bookings" onClick={() => setOpen(false)} className="block text-text">
                {t('nav.bookings')}
              </Link>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="block text-text">
                {t('nav.dashboard')}
              </Link>
              <button onClick={logout} className="block text-text">
                {t('nav.logout')}
              </button>
            </>
          )}

          {!user && (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block text-text">
                {t('nav.login')}
              </Link>
              <Link to="/register" onClick={() => setOpen(false)} className="block btn-primary text-center">
                {t('nav.register')}
              </Link>
            </>
          )}

          <div className="pt-4 border-t">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
=======
// ============================================
// src/components/common/Navbar.jsx
// ============================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import { FiUser, FiLogOut, FiCalendar, FiMenu, FiX } from 'react-icons/fi';
import Logo from "@/assets/img/logo.png";


const Navbar = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
            <img
              src={Logo}
              alt="ZAYNA - Your Time to Shine"
              className="h-14 w-auto object-contain"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/salons" className="text-text hover:text-primary transition-colors">
              {t('nav.salons')}
            </Link>

            {user && (
              <>
                <Link
                  to="/bookings"
                  className="flex items-center space-x-2 text-text hover:text-primary transition-colors"
                >
                  <FiCalendar />
                  <span>{t('nav.bookings')}</span>
                </Link>

                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 text-text hover:text-primary transition-colors"
                >
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

          {/* Mobile Button */}
          <button
            className="md:hidden text-2xl text-text"
            onClick={() => setOpen(!open)}
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white px-6 py-5 space-y-4 shadow-lg">

          <Link to="/salons" onClick={() => setOpen(false)} className="block text-text hover:text-primary">
            {t('nav.salons')}
          </Link>

          {user && (
            <>
              <Link to="/bookings" onClick={() => setOpen(false)} className="block text-text">
                {t('nav.bookings')}
              </Link>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="block text-text">
                {t('nav.dashboard')}
              </Link>
              <button onClick={logout} className="block text-text">
                {t('nav.logout')}
              </button>
            </>
          )}

          {!user && (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block text-text">
                {t('nav.login')}
              </Link>
              <Link to="/register" onClick={() => setOpen(false)} className="block btn-primary text-center">
                {t('nav.register')}
              </Link>
            </>
          )}

          <div className="pt-4 border-t">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
