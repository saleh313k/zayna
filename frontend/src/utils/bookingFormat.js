// ============================================
// src/utils/bookingFormat.js
// Shared formatting + status metadata for bookings (mirrors the server's BookingStatus enum).
// ============================================

// value -> { key, label, badge }
export const BOOKING_STATUS = {
  0: { key: 'pending', label: 'Pending', badge: 'badge-pending' },
  1: { key: 'confirmed', label: 'Confirmed', badge: 'badge-confirmed' },
  2: { key: 'inProgress', label: 'In progress', badge: 'bg-purple-100 text-purple-800' },
  3: { key: 'completed', label: 'Completed', badge: 'badge-completed' },
  4: { key: 'cancelled', label: 'Cancelled', badge: 'badge-cancelled' },
  5: { key: 'noShow', label: 'No-show', badge: 'bg-gray-100 text-gray-800' },
};

export const ACTIVE_STATUSES = [0, 1, 2]; // pending, confirmed, in progress

export const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })} OMR`;

// "yyyy-MM-dd" -> local Date at midnight (never goes through UTC, so the day cannot shift).
export const parseLocalDate = (isoDate) => {
  const [y, m, d] = String(isoDate).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const toIsoDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatBookingDate = (isoDate, lang) =>
  parseLocalDate(isoDate).toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

// "10:00:00" | "10:00" -> "10:00"
export const hhmm = (time) => String(time).slice(0, 5);

// Pick the Arabic name when the UI is Arabic and one exists.
export const localized = (lang, name, nameAr) => (lang?.startsWith('ar') && nameAr ? nameAr : name);
