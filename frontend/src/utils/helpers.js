// frontend/src/utils/helpers.js
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const formatCurrency = (amount) => {
  return `${amount.toFixed(2)} OMR`;
};

export const getStatusColor = (status) => {
  const colors = {
    Pending: 'yellow',
    Confirmed: 'blue',
    InProgress: 'purple',
    Completed: 'green',
    Cancelled: 'red',
    NoShow: 'gray'
  };
  return colors[status] || 'gray';
};