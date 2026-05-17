// ============================================
// src/components/common/Navbar.jsx
// ============================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import { FiUser, FiLogOut, FiCalendar, FiMenu, FiX } from 'react-icons/fi';
import Logo from '@/assets/img/logo.png';

const Navbar = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
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
            {/* <div className="hidden md:flex items-center space-x-6">
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
          </div> */}

            {/* Mobile Button */}
            <div className="flex flex-row justify-center md:flex items-center">
              <LanguageSwitcher />
              {!user && (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="ltr:ml-4 rtl:mr-4 block text-text">
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="block ltr:ml-4 rtl:mr-4 btn-primary text-center"
                  >
                    {t('nav.register')}
                  </Link>
                </>
              )}
              {user && (
                <>
                <div className='flex justify-center relative group inline-block  ltr:ml-4 rtl:mr-4'>
                <button
                  className="text-2xl text-text"
                  onMouseEnter={() => setOpen(true)}
                  onMouseLeave={() => setOpen(false)}
                >
                  {/* <img
              alt=""
              src={Logo}
              className="inline-block size-10 rounded-full ring-1 ring-gray-200 outline -outline-offset-1 outline-white/10"
              /> */}
                  <FiUser />
                  {/* {open ? <FiX /> : <FiMenu />} */}
                </button>
                      <div
                      className={`absolute top-full ltr:-mr-8 rtl:-ml-8 ltr:-translate-x-1/2 rtl:translate-x-1/2 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl 
                        invisible opacity-0 group-hover:visible group-hover:opacity-100 
                        transition-all duration-300 ease-out z-50`}
        // className={`transition-all absolute duration-300 overflow-hidden ${
        //   open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        // } rtl:left-28  ltr:right-28 fixed shadow-md z-50 top-16 `}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="bg-white px-6 py-5 space-y-4 shadow-lg">
          <Link
            to="/salons"
            onClick={() => setOpen(false)}
            className="block text-text hover:text-primary"
          >
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
            </>
          )}

          <div className="pt-4 border-t">
            <button onClick={logout} className="block text-text text-red-400">
              {t('nav.logout')}
            </button>
          </div>
        </div>
        </div>
      </div>
      </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}

    </>
  );
};

export default Navbar;
