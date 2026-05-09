// ============================================
// src/utils/dateUtils.js
// ============================================
import { format, parseISO, addDays, isAfter, isBefore } from 'date-fns';

export const formatDate = (date, formatString = 'dd MMM yyyy') => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatString);
};

export const formatTime = (time) => {
  if (!time) return '';
  return time.substring(0, 5); // HH:MM format
};

export const isDateInFuture = (date) => {
  return isAfter(new Date(date), new Date());
};

export const isDateInPast = (date) => {
  return isBefore(new Date(date), new Date());
};

export const getNextDays = (count = 7) => {
  const days = [];
  for (let i = 0; i < count; i++) {
    days.push(addDays(new Date(), i));
  }
  return days;
};
