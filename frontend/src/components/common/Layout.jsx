// ============================================
// src/components/common/Layout.jsx
// ============================================
import React from 'react';
import Navbar from './Navbar';
import { useLanguage } from '../../contexts/LanguageContext';

const Layout = ({ children }) => {
  const { direction } = useLanguage();

  return (
    <div dir={direction} className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        {children}
      </main>
    </div>
  );
};

export default Layout;