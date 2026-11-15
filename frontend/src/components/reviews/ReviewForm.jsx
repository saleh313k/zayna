// ============================================
// src/components/reviews/ReviewForm.jsx
// Shown on a COMPLETED booking. One review per booking (the server enforces it).
// ============================================
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { reviewService } from '../../services/reviewService';
import { StarDisplay, StarInput } from './StarRating';

const MAX_COMMENT = 1000;

const ReviewForm = ({ bookingId }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await reviewService.getMyReviewForBooking(bookingId);
        if (alive && data.reviewed) setExisting(data.review);
      } catch {
        // If this check fails we still show the form; the server rejects a duplicate anyway.
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [bookingId]);

  const submit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error(t('reviews.ratingRequired', 'Please choose a star rating.'));
      return;
    }
    setBusy(true);
    try {
      const data = await reviewService.addReview({ bookingId, rating, comment: comment.trim() });
      setExisting(data.review);
      toast.success(t('reviews.thanks', 'Thank you! Your review was published.'));
    } catch (error) {
      if (error.response?.data?.code === 'REVIEW_EXISTS') {
        toast.info(t('reviews.alreadyReviewed', 'You have already reviewed this booking.'));
        try {
          const data = await reviewService.getMyReviewForBooking(bookingId);
          if (data.reviewed) setExisting(data.review);
        } catch { /* keep the form */ }
      } else {
        toast.error(error.response?.data?.message || t('common.error'));
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  if (existing) {
    return (
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-2">{t('reviews.yourReview', 'Your review')}</h2>
        <StarDisplay value={existing.rating} className="text-xl" />
        {existing.comment && <p className="mt-3 text-gray-700 whitespace-pre-wrap break-words">{existing.comment}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card mb-6 space-y-3">
      <h2 className="text-xl font-semibold">{t('reviews.leaveReview', 'Leave a review')}</h2>
      <StarInput value={rating} onChange={setRating} disabled={busy} />
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="review-comment">
          {t('reviews.commentLabel', 'Your experience (optional)')}
        </label>
        <textarea
          id="review-comment"
          rows={4}
          maxLength={MAX_COMMENT}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('reviews.commentPlaceholder', 'Tell others about your visit...')}
          className="input-field"
        />
        <p className="text-xs text-gray-500 mt-1">{comment.length}/{MAX_COMMENT}</p>
      </div>
      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? t('common.loading', 'Loading...') : t('reviews.submit', 'Submit review')}
      </button>
    </form>
  );
};

export default ReviewForm;
