<<<<<<< HEAD
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

=======
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

>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
}