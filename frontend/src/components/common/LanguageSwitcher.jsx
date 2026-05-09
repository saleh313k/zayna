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
      className="flex items-center space-x-2 text-text hover:text-primary transition-colors"
      aria-label="Toggle Language"
    >
      <FiGlobe />
      <span className={`font-medium ${
    language === 'en' ? 'font-arabic' : 'font-sans'
  }`}>{language === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
};

export default LanguageSwitcher;