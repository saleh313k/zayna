using ZAYNA.Core.Entities;
using ZAYNA.Core.Enums;

namespace ZAYNA.Core.Interfaces
{
    public interface IBookingService
    {
        /// <summary>
        /// Creates a booking atomically. Throws AppException(SLOT_UNAVAILABLE, 409) if the slot is no longer free.
        /// Assigns the booking number and the initial status.
        /// </summary>
        Task<Booking> CreateBookingAsync(Booking booking);

        /// <summary>Booking with customer, salon, branch, stylist, service and payment loaded.</summary>
        Task<Booking?> GetBookingByIdAsync(Guid id);
        Task<IEnumerable<Booking>> GetCustomerBookingsAsync(Guid customerId);
        Task<IEnumerable<Booking>> GetSalonBookingsAsync(Guid salonId, DateTime? date = null);

        /// <summary>
        /// Cancels a pending or confirmed booking. With applyCustomerCutoff the configured minimum notice applies.
        /// Throws AppException (409) when the booking cannot be cancelled. Returns false if not found.
        /// </summary>
        Task<bool> CancelBookingAsync(Guid bookingId, string? reason, bool applyCustomerCutoff = false);

        /// <summary>Applies a status change if it is a valid transition. Throws AppException (409) otherwise.</summary>
        Task<bool> UpdateBookingStatusAsync(Guid bookingId, BookingStatus status);

        Task<IEnumerable<TimeSpan>> GetAvailableTimeSlotsAsync(Guid stylistId, Guid serviceId, DateTime date);
    }
}
