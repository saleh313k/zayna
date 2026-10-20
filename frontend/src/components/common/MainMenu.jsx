// ============================================
// src/components/common/MainMenu.jsx
// ============================================
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';


const MainMenu = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className='flex items-center gap-7'>

        {/* <Link
        to="/register"
        onClick={() => setOpen(false)}
        className="block ltr:ml-4 rtl:mr-4 btn-primary text-center"
        >
        {t('nav.getStarted')}
        </Link> */}

        <Link to="/" onClick={() => setOpen(false)} className="block text-text hover:text-secondary">
          {t('nav.home')}
        </Link>
        <Link to="/#salons" onClick={() => setOpen(false)} className="block text-text hover:text-secondary">
          {t('nav.findASalon')}
        </Link>
        <Link to="/#how-it-works" onClick={() => setOpen(false)} className="block text-text hover:text-secondary">
          {t('nav.howItWorks')}
        </Link>
        <Link to="/#cta-split" onClick={() => setOpen(false)} className="block text-text hover:text-secondary">
          {t('nav.forSalonOwners')}
        </Link>
        <Link to="/#pricing" onClick={() => setOpen(false)} className="block text-text hover:text-secondary">
          {t('nav.pricing')}
        </Link>
      </div>
    </>
  );
};

export default MainMenu;