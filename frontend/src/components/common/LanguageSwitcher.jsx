// ============================================
// src/components/common/LanguageSwitcher.jsx
// ============================================
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FiGlobe } from 'react-icons/fi';

const LanguageSwitcher = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center text-text hover:text-primary transition-colors`}
      aria-label="Toggle Language"
    >
      <span className={`  ltr:mr-2 rtl:ml-2 font-medium ${
        language === 'en' ? 'font-arabic' : 'font-sans'
      }`}>{language === 'en' ? 'العربية' : 'English'}</span>
      <FiGlobe />
    </button>
  );
};

export default LanguageSwitcher;