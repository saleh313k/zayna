using Zayna.Core.Interfaces;
using ZAYNA.Core.Enums;
namespace ZAYNA.Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IRepository<Notification> _notificationRepository;
        private readonly ISmsService _smsService;
        private readonly IEmailService _emailService;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            IRepository<Notification> notificationRepository,
            ISmsService smsService,
            IEmailService emailService,
            ILogger<NotificationService> logger)
        {
            _notificationRepository = notificationRepository;
            _smsService = smsService;
            _emailService = emailService;
            _logger = logger;
        }

        // SMS is an optional channel: skipped when the customer has no phone number (Google / email sign-ups).
        // The provider returns false when it is not configured, so a missing provider never breaks a booking.
        private async Task TrySendSmsAsync(Booking booking, string message)
        {
            var phone = booking.Customer?.User?.PhoneNumber;
            if (string.IsNullOrWhiteSpace(phone)) return;
            try
            {
                await _smsService.SendAsync(phone, message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SMS for booking {BookingId} failed.", booking.Id);
            }
        }

        // Email is best-effort too: no address (e.g. phone-only sign-up) means skip; a failure is logged, never thrown.
        private async Task TrySendEmailAsync(Booking booking, EmailTemplates.EmailContent content)
        {
            var to = booking.Customer?.User?.Email;
            if (string.IsNullOrWhiteSpace(to)) return;
            try
            {
                var sent = await _emailService.SendEmailAsync(to, content.Subject, content.Html);
                if (!sent)
                    _logger.LogWarning("Email for booking {BookingId} was not sent.", booking.Id);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Email for booking {BookingId} failed.", booking.Id);
            }
        }

        public async Task SendBookingConfirmationAsync(Booking booking)
        {
            var notification = new Notification
            {
                BookingId = booking.Id,
                UserId = booking.Customer.UserId,
                Title = "Booking Confirmed",
                TitleAr = "تم تأكيد الحجز",
                Message = $"Your booking #{booking.BookingNumber} has been confirmed for {booking.BookingDate:dd/MM/yyyy} at {booking.StartTime.ToString(@"hh\:mm")}",
                MessageAr = $"تم تأكيد حجزك #{booking.BookingNumber} بتاريخ {booking.BookingDate:dd/MM/yyyy} في الساعة {booking.StartTime.ToString(@"hh\:mm")}",
                Type = NotificationType.BookingConfirmation
            };

            await _notificationRepository.AddAsync(notification);

            await TrySendSmsAsync(booking, notification.Message);
            await TrySendEmailAsync(booking, EmailTemplates.BookingConfirmed(BookingEmailModel.FromBooking(booking)));
        }

        public async Task SendBookingReminderAsync(Booking booking)
        {
            var salonName = booking.Salon?.SalonName ?? "your salon";
            var salonNameAr = booking.Salon?.SalonNameAr ?? salonName;
            var time = booking.StartTime.ToString(@"hh\:mm");

            var notification = new Notification
            {
                BookingId = booking.Id,
                UserId = booking.Customer.UserId,
                Title = "Booking Reminder",
                TitleAr = "تذكير بالحجز",
                Message = $"Reminder: your appointment at {salonName} is at {time} on {booking.BookingDate:dd/MM/yyyy}",
                MessageAr = $"تذكير: موعدك في {salonNameAr} الساعة {time} بتاريخ {booking.BookingDate:dd/MM/yyyy}",
                Type = NotificationType.BookingReminder
            };

            // Saved first: this record is what stops the scheduler from reminding the same booking twice.
            await _notificationRepository.AddAsync(notification);

            await TrySendSmsAsync(booking, notification.Message);
            await TrySendEmailAsync(booking, EmailTemplates.BookingReminder(BookingEmailModel.FromBooking(booking)));
        }

        public async Task SendBookingCancellationAsync(Booking booking)
        {
            var notification = new Notification
            {
                BookingId = booking.Id,
                UserId = booking.Customer.UserId,
                Title = "Booking Cancelled",
                TitleAr = "تم إلغاء الحجز",
                Message = $"Your booking #{booking.BookingNumber} has been cancelled.",
                MessageAr = $"تم إلغاء حجزك #{booking.BookingNumber}",
                Type = NotificationType.BookingCancellation
            };

            await _notificationRepository.AddAsync(notification);

            await TrySendSmsAsync(booking, notification.Message);
            await TrySendEmailAsync(booking, EmailTemplates.BookingCancelled(BookingEmailModel.FromBooking(booking)));
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
