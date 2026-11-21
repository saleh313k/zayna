using System.Linq.Expressions;
using ZAYNA.Core.Enums;

namespace ZAYNA.Infrastructure.Services
{
    /// <summary>
    /// A booking that still lies ahead of the customer: pending, confirmed or in progress, on or after today (salon time).
    /// A customer with such a booking cannot delete their account yet. Past bookings that were never closed by the salon
    /// do not block deletion. Expressed as a predicate so the database evaluates it (and tests can run it in memory).
    /// </summary>
    public static class ActiveBookingRule
    {
        public static Expression<Func<Booking, bool>> For(Guid customerId, DateTime todayLocal) =>
            b => b.CustomerId == customerId
                 && b.BookingDate >= todayLocal
                 && (b.Status == BookingStatus.Pending
                     || b.Status == BookingStatus.Confirmed
                     || b.Status == BookingStatus.InProgress);
    }
}
