// ============================================
// src/components/salon/ownerUi.jsx
// Small shared pieces for the salon-owner pages.
// ============================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../common/Layout';
import { ErrorState, Spinner } from '../admin/adminUi';
import { useOwner } from './OwnerContext';

export const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
    <div className={`bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
      </div>
      {children}
    </div>
  </div>
);

export const Field = ({ label, htmlFor, children, hint }) => (
  <div>
    <label className="block text-sm font-medium mb-1" htmlFor={htmlFor}>{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
    <div>
      <h1 className="text-3xl font-bold text-primary">{title}</h1>
      {subtitle && <p className="text-gray-600">{subtitle}</p>}
    </div>
    {action}
  </div>
);

/**
 * Wraps a salon page: shows the shared loading / error / "no salon" states, then renders children with the
 * loaded overview. Keeps every salon page consistent.
 */
export const OwnerPage = ({ children }) => {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useOwner();

  if (loading) return <Layout><Spinner /></Layout>;
  if (error === 'nosalon') {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto card text-center py-12">
          <p>{t('owner.noSalon', 'No salon is registered for this account.')}</p>
        </div>
      </Layout>
    );
  }
  if (error || !data) return <Layout><div className="max-w-2xl mx-auto card"><ErrorState onRetry={reload} /></div></Layout>;

  return <Layout><div className="max-w-7xl mx-auto">{children(data)}</div></Layout>;
};

export const localName = (lang, name, nameAr) => (lang?.startsWith('ar') && nameAr ? nameAr : name);
