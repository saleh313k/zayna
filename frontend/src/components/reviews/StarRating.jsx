// ============================================
// src/components/reviews/StarRating.jsx
// StarDisplay: read-only stars. StarInput: accessible 1-5 picker (radio group).
// ============================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaStar } from 'react-icons/fa';

export const StarDisplay = ({ value = 0, className = '' }) => {
  const { t } = useTranslation();
  const rounded = Math.round(Number(value) || 0);
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`${Number(value || 0).toFixed(1)} ${t('reviews.outOf5', 'out of 5')}`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <FaStar key={n} aria-hidden="true" className={n <= rounded ? 'text-yellow-400' : 'text-gray-300'} />
      ))}
    </span>
  );
};

export const StarInput = ({ value, onChange, disabled = false }) => {
  const { t } = useTranslation();
  return (
    <div role="radiogroup" aria-label={t('reviews.yourRating', 'Your rating')} className="inline-flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={t('reviews.starLabel', '{{n}} out of 5 stars', { n })}
          disabled={disabled}
          onClick={() => onChange(n)}
          className="text-3xl p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <FaStar aria-hidden="true" className={n <= value ? 'text-yellow-400' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  );
};
