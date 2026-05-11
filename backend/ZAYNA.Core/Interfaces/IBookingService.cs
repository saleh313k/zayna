    using ZAYNA.Core.Entities;
    using ZAYNA.Core.Enums;

    namespace ZAYNA.Core.Interfaces
    {

        public interface IBookingService
        {
            Task<Booking> CreateBookingAsync(Booking booking);
            Task<Booking?> GetBookingByIdAsync(Guid id);
            Task<IEnumerable<Booking>> GetCustomerBookingsAsync(Guid customerId);
            Task<IEnumerable<Booking>> GetSalonBookingsAsync(Guid salonId, DateTime? date = null);
            Task<bool> CancelBookingAsync(Guid bookingId, string reason);
            Task<bool> UpdateBookingStatusAsync(Guid bookingId, BookingStatus status);
            Task<IEnumerable<TimeSpan>> GetAvailableTimeSlotsAsync(Guid stylistId, Guid serviceId, DateTime date);
        }
    }