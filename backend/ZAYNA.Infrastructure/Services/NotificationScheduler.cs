// ZAYNA.Infrastructure/Services/NotificationScheduler.cs
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Threading;
using Zayna.Core.Interfaces;
using ZAYNA.Core.Enums;
using ZAYNA.Infrastructure.Data;
namespace ZAYNA.Infrastructure.Services
{
    /// <summary>
    /// Sends one reminder per confirmed booking shortly before it starts (Notifications:ReminderLeadMinutes, default 120).
    /// All comparisons use the salon-local clock (booking dates/times are local wall-clock values).
    /// Assumes ONE running API instance: the "already reminded" check is a saved Notification row, not a lock.
    /// A reminder whose email fails is not retried (its in-app record is already saved); failures are logged.
    /// </summary>
    public class NotificationScheduler : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);
        private static readonly TimeSpan StartupDelay = TimeSpan.FromSeconds(30);

        private readonly IServiceProvider _serviceProvider;
        private readonly ISalonClock _clock;
        private readonly IConfiguration _configuration;
        private readonly ILogger<NotificationScheduler> _logger;

        public NotificationScheduler(
            IServiceProvider serviceProvider,
            ISalonClock clock,
            IConfiguration configuration,
            ILogger<NotificationScheduler> logger)
        {
            _serviceProvider = serviceProvider;
            _clock = clock;
            _configuration = configuration;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (bool.TryParse(_configuration["Notifications:RemindersEnabled"], out var enabled) && !enabled)
            {
                _logger.LogInformation("Notification scheduler disabled (Notifications:RemindersEnabled=false).");
                return;
            }

            if (!int.TryParse(_configuration["Notifications:ReminderLeadMinutes"], out var leadMinutes)) leadMinutes = 120;
            leadMinutes = Math.Clamp(leadMinutes, 15, 24 * 60);
            var lead = TimeSpan.FromMinutes(leadMinutes);

            _logger.LogInformation("Notification scheduler started (reminder lead {LeadMinutes} min).", leadMinutes);

            try { await Task.Delay(StartupDelay, stoppingToken); }
            catch (OperationCanceledException) { return; }

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SendBookingRemindersAsync(lead, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in notification scheduler");
                }

                // The delay is outside the try block on purpose: a failing cycle must never become a busy loop.
                try { await Task.Delay(Interval, stoppingToken); }
                catch (OperationCanceledException) { break; }
            }
        }

        private async Task SendBookingRemindersAsync(TimeSpan lead, CancellationToken ct)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var nowLocal = _clock.LocalNow;
            // Booking.CreatedAt is UTC; shift it into salon-local time to compare with the (local) start time.
            var utcOffset = TimeSpan.FromMinutes(Math.Round((nowLocal - DateTime.UtcNow).TotalMinutes));
            var today = nowLocal.Date;

            // Only today and tomorrow can be inside the window (lead is capped at 24h); exact timing is checked in memory.
            var candidates = await context.Bookings
                .Include(b => b.Customer).ThenInclude(c => c.User)
                .Include(b => b.Salon)
                .Include(b => b.Branch)
                .Include(b => b.Stylist)
                .Include(b => b.Service)
                .Where(b => b.Status == BookingStatus.Confirmed
                            && b.BookingDate >= today
                            && b.BookingDate < today.AddDays(2)
                            && !context.Notifications.Any(n =>
                                n.BookingId == b.Id && n.Type == NotificationType.BookingReminder))
                .ToListAsync(ct);

            foreach (var booking in candidates)
            {
                var startLocal = booking.BookingDate.Date + booking.StartTime;
                var createdLocal = booking.CreatedAt + utcOffset;
                if (!ReminderPolicy.IsDue(nowLocal, startLocal, createdLocal, lead)) continue;

                try
                {
                    await notificationService.SendBookingReminderAsync(booking);
                    _logger.LogInformation("Sent reminder for booking {BookingNumber}", booking.BookingNumber);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send reminder for booking {BookingNumber}", booking.BookingNumber);
                }
            }
        }
    }
}
