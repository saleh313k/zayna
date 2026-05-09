using ZAYNA.Core.Entities;

namespace ZAYNA.Core.Interfaces
{

    public interface INotificationService
    {
        Task SendBookingConfirmationAsync(Booking booking);
        Task SendBookingReminderAsync(Booking booking);
        Task SendBookingCancellationAsync(Booking booking);
        Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId);
        Task MarkAsReadAsync(Guid notificationId);
    }

}