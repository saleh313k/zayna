// ============================================
// src/components/admin/adminUi.jsx
// Small shared helpers for the admin pages (formatting + pagination bar).
// ============================================
import React from 'react';
import { useTranslation } from 'react-i18next';

export const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })} OMR`;

export const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');

export const Spinner = () => (
  <div className="flex justify-center py-12">
    <div className="spinner"></div>
  </div>
);

export const ErrorState = ({ onRetry }) => {
  const { t } = useTranslation();
  return (
    <div className="text-center py-10">
      <p className="text-red-600 mb-4">{t('admin.loadError', 'Could not load data. Please try again.')}</p>
      <button className="btn-outline" onClick={onRetry}>{t('admin.retry', 'Retry')}</button>
    </div>
  );
};

// Pagination bar in the same style as the original admin mock tables.
export const PaginationBar = ({ page, pageSize, total, onPageChange }) => {
  const { t } = useTranslation();
  if (!total) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Window of up to 5 page numbers around the current page.
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);

  return (
    <div className="flex flex-wrap gap-3 justify-between items-center mt-6 pt-6 border-t">
      <p className="text-sm text-gray-600">
        {t('admin.showing', 'Showing {{from}}-{{to}} of {{total}}', { from, to, total })}
      </p>
      {totalPages > 1 && (
        <div className="flex space-x-2 rtl:space-x-reverse">
          <button
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            {t('admin.previous', 'Previous')}
          </button>
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={p === page ? 'px-4 py-2 bg-primary text-white rounded-lg' : 'px-4 py-2 border rounded-lg hover:bg-gray-50'}
            >
              {p}
            </button>
          ))}
          <button
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            {t('admin.next', 'Next')}
          </button>
        </div>
      )}
    </div>
  );
};
