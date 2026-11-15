using Zayna.Core.Interfaces;

namespace ZAYNA.Infrastructure.Services
{
    /// <summary>
    /// Used when no email provider is configured (typical for local development). Logs that email is disabled
    /// and reports failure; callers already treat email as best-effort.
    /// </summary>
    public class NoopEmailService : IEmailService
    {
        private readonly ILogger<NoopEmailService> _logger;

        public NoopEmailService(ILogger<NoopEmailService> logger) => _logger = logger;

        public Task<bool> SendEmailAsync(string to, string subject, string htmlContent)
        {
            _logger.LogInformation("Email disabled (no provider configured): skipped message \"{Subject}\".", subject);
            return Task.FromResult(false);
        }

        public Task<bool> SendOtpEmailAsync(string to, string otpCode) =>
            SendEmailAsync(to, "verification code", string.Empty);

        public Task<bool> SendBookingConfirmationAsync(string to, string bookingDetails) =>
            SendEmailAsync(to, "booking confirmation", string.Empty);
    }
}
