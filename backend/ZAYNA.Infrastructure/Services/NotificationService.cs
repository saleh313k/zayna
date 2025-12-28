using Zayna.Core.Interfaces;
using ZAYNA.Core.Enums;
namespace ZAYNA.Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IRepository<Notification> _notificationRepository;
        private readonly ISmsService _smsService;
        private readonly IEmailService _emailService;

        public NotificationService(
            IRepository<Notification> notificationRepository,
            ISmsService smsService,
            IEmailService emailService)
        {
            _notificationRepository = notificationRepository;
            _smsService = smsService;
            _emailService = emailService;
        }

        public async Task SendBookingConfirmationAsync(Booking booking)
        {
            var notification = new Notification
            {
                UserId = booking.Customer.UserId,
                Title = "Booking Confirmed",
                TitleAr = "تم تأكيد الحجز",
                Message = $"Your booking #{booking.BookingNumber} has been confirmed for {booking.BookingDate:dd/MM/yyyy} at {booking.StartTime}",
                MessageAr = $"تم تأكيد حجزك #{booking.BookingNumber} بتاريخ {booking.BookingDate:dd/MM/yyyy} في الساعة {booking.StartTime}",
                Type = Core.Enums.NotificationType.BookingConfirmation 
            };

            await _notificationRepository.AddAsync(notification);

            // Send SMS
            await _smsService.SendAsync(booking.Customer.User.PhoneNumber, notification.Message);

            // Send Email if available
            if (!string.IsNullOrEmpty(booking.Customer.User.Email))
            {
                await _emailService.SendBookingConfirmationAsync(
                    booking.Customer.User.Email,
                    notification.Message);
            }
        }

        public async Task SendBookingReminderAsync(Booking booking)
        {
            var notification = new Notification
            {
                UserId = booking.Customer.UserId,
                Title = "Booking Reminder",
                TitleAr = "تذكير بالحجز",
                Message = $"Reminder: Your appointment is in 2 hours at {booking.Salon.SalonName}",
                MessageAr = $"تذكير: موعدك بعد ساعتين في {booking.Salon.SalonNameAr ?? booking.Salon.SalonName}",
                Type = NotificationType.BookingReminder
            };

            await _notificationRepository.AddAsync(notification);
            await _smsService.SendAsync(booking.Customer.User.PhoneNumber, notification.Message);
        }

        public async Task SendBookingCancellationAsync(Booking booking)
        {
            var notification = new Notification
            {
                UserId = booking.Customer.UserId,
                Title = "Booking Cancelled",
                TitleAr = "تم إلغاء الحجز",
                Message = $"Your booking #{booking.BookingNumber} has been cancelled.",
                MessageAr = $"تم إلغاء حجزك #{booking.BookingNumber}",
                Type = NotificationType.BookingCancellation
            };

            await _notificationRepository.AddAsync(notification);
            await _smsService.SendAsync(booking.Customer.User.PhoneNumber, notification.Message);
        }

        public async Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId)
        {
            return await _notificationRepository.FindAsync(n => n.UserId == userId);
        }

        public async Task MarkAsReadAsync(Guid notificationId)
        {
            var notification = await _notificationRepository.GetByIdAsync(notificationId);
            if (notification != null)
            {
                notification.IsRead = true;
                await _notificationRepository.UpdateAsync(notification);
            }
        }
    }
}

