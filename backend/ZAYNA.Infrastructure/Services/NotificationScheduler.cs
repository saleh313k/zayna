// ZAYNA.Infrastructure/Services/NotificationScheduler.cs
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ZAYNA.Core.Enums;
using ZAYNA.Infrastructure.Data;
namespace ZAYNA.Infrastructure.Services
{
    public class NotificationScheduler : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<NotificationScheduler> _logger;

        public NotificationScheduler(IServiceProvider serviceProvider, ILogger<NotificationScheduler> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Notification Scheduler started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SendBookingReminders();
                    await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in notification scheduler");
                }
            }
        }

        private async Task SendBookingReminders()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var now = DateTime.UtcNow;
            var reminderTime = now.AddHours(2);

            // Get bookings that need reminders
            var bookingsToRemind = await context.Bookings
                .Include(b => b.Customer)
                    .ThenInclude(c => c.User)
                .Include(b => b.Salon)
                .Include(b => b.Service)
                .Where(b => 
                    b.BookingDate.Date == reminderTime.Date &&
                    b.StartTime >= reminderTime.TimeOfDay &&
                    b.StartTime <= reminderTime.AddMinutes(15).TimeOfDay &&
                    b.Status == BookingStatus.Confirmed &&
                    !context.Notifications.Any(n => 
                        n.Type.Equals("BookingReminder") && 
                        n.Message.Contains(b.BookingNumber)))
                .ToListAsync();

            foreach (var booking in bookingsToRemind)
            {
                try
                {
                    await notificationService.SendBookingReminderAsync(booking);
                    _logger.LogInformation($"Sent reminder for booking {booking.BookingNumber}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to send reminder for booking {booking.BookingNumber}");
                }
            }
        }
    }
}

// Register in Program.cs
// builder.Services.AddHostedService<NotificationScheduler>();

