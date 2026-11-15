// ============================================
// src/services/reviewService.js
// ============================================
import api from './api';

export const reviewService = {
  // Public: reviews of a salon (paged), rating summary and star distribution.
  getSalonReviews: async (salonId, page = 1, pageSize = 5) =>
    (await api.get(`/review/salon/${salonId}`, { params: { page, pageSize } })).data,

  // Customer: has this booking been reviewed already?
  getMyReviewForBooking: async (bookingId) => (await api.get(`/review/booking/${bookingId}`)).data,

  // Customer: one review per completed booking.
  addReview: async ({ bookingId, rating, comment }) =>
    (await api.post('/review', { bookingId, rating, comment })).data
};
