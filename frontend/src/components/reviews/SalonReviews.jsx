// ============================================
// src/components/reviews/SalonReviews.jsx
// Public rating summary + paged review list for a bookable salon.
// Every review is a verified visit (the server only accepts a review for the customer's own completed booking).
// The reviewer tier is a badge only; the star average is a plain average.
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle } from 'react-icons/fi';
import { reviewService } from '../../services/reviewService';
import { StarDisplay } from './StarRating';

const PAGE_SIZE = 5;

const SalonReviews = ({ salonId }) => {
  const { t, i18n } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async (pageToLoad, append) => {
    try {
      const data = await reviewService.getSalonReviews(salonId, pageToLoad, PAGE_SIZE);
      setSummary({ avg: data.avgRating, total: data.totalReviews, distribution: data.distribution || [] });
      setReviews((current) => (append ? [...current, ...data.reviews] : data.reviews));
      setPage(pageToLoad);
      setTotalPages(data.pagination?.totalPages || 1);
      setError(false);
    } catch {
      setError(true);
    }
  }, [salonId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load(1, false).finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [load]);

  const showMore = async () => {
    setLoadingMore(true);
    await load(page + 1, true);
    setLoadingMore(false);
  };

  const date = (value) =>
    new Date(value).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' });

  const tierLabel = (r) => {
    if (r.reviewerTier === 'trusted') return t('reviews.tierTrusted', 'Trusted reviewer');
    if (r.reviewerTier === 'regular') return t('reviews.tierRegular', 'Regular customer');
    return null;
  };

  return (
    <section className="mt-12" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="text-2xl font-semibold text-primary mb-4">{t('reviews.title', 'Reviews')}</h2>

      {loading ? (
        <div className="flex justify-center py-8"><div className="spinner"></div></div>
      ) : error && !summary ? (
        <p className="text-gray-600">{t('reviews.loadError', 'Could not load reviews.')}</p>
      ) : summary && summary.total === 0 ? (
        <div className="card">
          <p className="text-gray-700">{t('reviews.noReviews', 'No reviews yet.')}</p>
          <p className="text-sm text-gray-500 mt-1">
            {t('reviews.onlyVerified', 'Reviews come only from customers who completed an appointment.')}
          </p>
        </div>
      ) : (
        <>
          <div className="card mb-4 flex flex-col sm:flex-row gap-6">
            <div className="text-center sm:min-w-[8rem]">
              <p className="text-5xl font-bold">{Number(summary.avg).toFixed(1)}</p>
              <StarDisplay value={summary.avg} className="text-xl mt-1" />
              <p className="text-sm text-gray-600 mt-1">{t('reviews.basedOn', 'Based on {{n}} reviews', { n: summary.total })}</p>
            </div>
            <div className="flex-1 space-y-1" aria-hidden="true">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.distribution.find((d) => d.rating === star)?.count || 0;
                const pct = summary.total ? Math.round((count / summary.total) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-gray-600">{star}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded">
                      <div className="h-2 bg-yellow-400 rounded" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-gray-600 text-end">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <ul className="space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="card">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <StarDisplay value={r.rating} />
                  <span className="text-sm text-gray-500">{date(r.createdAt)}</span>
                </div>
                <p className="font-medium">{r.customerName}</p>
                <p className="text-xs text-green-700 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  {r.verifiedVisit && (
                    <span className="inline-flex items-center gap-1">
                      <FiCheckCircle aria-hidden="true" />{t('reviews.verifiedVisit', 'Verified visit')}
                    </span>
                  )}
                  {tierLabel(r) && (
                    <span>{tierLabel(r)} · {t('reviews.visits', '{{n}} completed visits', { n: r.reviewerVisits })}</span>
                  )}
                </p>
                {r.comment && <p className="mt-2 text-gray-700 whitespace-pre-wrap break-words">{r.comment}</p>}
              </li>
            ))}
          </ul>

          {page < totalPages && (
            <div className="text-center mt-4">
              <button className="btn-outline" onClick={showMore} disabled={loadingMore}>
                {loadingMore ? t('common.loading', 'Loading...') : t('reviews.showMore', 'Show more reviews')}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default SalonReviews;
