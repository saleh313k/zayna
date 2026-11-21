// ============================================
// src/components/admin/AdminReviews.jsx
// Review moderation (Admin only). Real data from GET /api/admin/reviews. Two actions, both confirmed and logged
// on the server: remove the comment text (the star rating stays) or delete the whole review.
// ============================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Layout from '../common/Layout';
import { adminService } from '../../services/adminService';
import { StarDisplay } from '../reviews/StarRating';
import { ErrorState, PaginationBar, Spinner, formatDate } from './adminUi';

const PAGE_SIZE = 10;

const AdminReviews = () => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState('');
  const [hasComment, setHasComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getReviews({ rating, hasComment, page, pageSize: PAGE_SIZE });
      if (id !== requestId.current) return;
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [rating, hasComment, page]);

  useEffect(() => { load(); }, [load]);

  const act = async (review, action) => {
    const confirmText = action === 'delete'
      ? t('admin.confirmDeleteReview', 'Delete this review? The salon rating will be recalculated. This cannot be undone.')
      : t('admin.confirmRemoveComment', 'Remove the comment text? The star rating stays. This cannot be undone.');
    if (!window.confirm(confirmText)) return;

    setBusyId(review.id);
    try {
      if (action === 'delete') await adminService.deleteReview(review.id);
      else await adminService.removeReviewComment(review.id);
      toast.success(action === 'delete'
        ? t('admin.reviewDeleted', 'Review deleted')
        : t('admin.commentRemoved', 'Comment removed'));
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">{t('admin.reviewModeration', 'Review moderation')}</h1>
          <p className="text-gray-600">
            {t('admin.reviewModerationSubtitle', 'Every review comes from a completed booking. Remove abusive text or delete a review.')}
          </p>
        </div>

        <div className="card mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={rating}
              onChange={(e) => { setRating(e.target.value); setPage(1); }}
              className="input-field min-w-[180px] w-auto"
              aria-label={t('admin.rating', 'Rating')}
            >
              <option value="">{t('admin.allRatings', 'All ratings')}</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} ★</option>
              ))}
            </select>
            <select
              value={hasComment}
              onChange={(e) => { setHasComment(e.target.value); setPage(1); }}
              className="input-field min-w-[180px] w-auto"
              aria-label={t('admin.comment', 'Comment')}
            >
              <option value="">{t('admin.withOrWithoutComment', 'With or without comment')}</option>
              <option value="true">{t('admin.withComment', 'With comment')}</option>
              <option value="false">{t('admin.withoutComment', 'Without comment')}</option>
            </select>
          </div>
        </div>

        <div className="card">
          {loading && reviews.length === 0 ? (
            <Spinner />
          ) : error ? (
            <ErrorState onRetry={load} />
          ) : reviews.length === 0 ? (
            <p className="text-gray-600 py-6 text-center">{t('admin.noReviews', 'No reviews match your filters.')}</p>
          ) : (
            <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-start py-3 px-4">{t('admin.date', 'Date')}</th>
                    <th className="text-start py-3 px-4">{t('admin.salon', 'Salon')}</th>
                    <th className="text-start py-3 px-4">{t('admin.customer', 'Customer')}</th>
                    <th className="text-start py-3 px-4">{t('admin.rating', 'Rating')}</th>
                    <th className="text-start py-3 px-4">{t('admin.comment', 'Comment')}</th>
                    <th className="text-start py-3 px-4">{t('admin.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50 align-top">
                      <td className="py-4 px-4 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                      <td className="py-4 px-4">{r.salonName || '-'}</td>
                      <td className="py-4 px-4">
                        <p>{r.customerName || t('admin.deletedUser', 'Deleted user')}</p>
                        {r.bookingNumber && <p className="text-xs text-gray-500">#{r.bookingNumber}</p>}
                      </td>
                      <td className="py-4 px-4"><StarDisplay value={r.rating} /></td>
                      <td className="py-4 px-4 max-w-md">
                        {r.comment
                          ? <p className="whitespace-pre-wrap break-words text-sm">{r.comment}</p>
                          : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-3 text-sm">
                          {r.comment && (
                            <button
                              type="button"
                              className="text-primary hover:underline disabled:opacity-50"
                              disabled={busyId === r.id}
                              onClick={() => act(r, 'comment')}
                            >
                              {t('admin.removeComment', 'Remove comment')}
                            </button>
                          )}
                          <button
                            type="button"
                            className="text-red-600 hover:underline disabled:opacity-50"
                            disabled={busyId === r.id}
                            onClick={() => act(r, 'delete')}
                          >
                            {t('admin.deleteReview', 'Delete review')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <PaginationBar page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      </div>
    </Layout>
  );
};

export default AdminReviews;
