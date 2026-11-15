using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.Threading;
using Zayna.Core.Interfaces;

namespace ZAYNA.Infrastructure.Services
{
    /// <summary>
    /// Sends email through any SMTP server (config section "Smtp"). Sending is best-effort: failures are logged and
    /// reported as <c>false</c>, never thrown, so an unreachable mail server cannot break a booking.
    /// Credentials are never logged.
    /// </summary>
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SmtpEmailService> _logger;

        public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> SendEmailAsync(string to, string subject, string htmlContent)
        {
            if (!MailboxAddress.TryParse(to, out var recipient))
            {
                _logger.LogWarning("Email not sent: recipient address is not valid.");
                return false;
            }

            var host = _configuration["Smtp:Host"];
            var fromEmail = _configuration["Smtp:FromEmail"];
            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(fromEmail))
            {
                _logger.LogWarning("Email not sent: Smtp:Host and Smtp:FromEmail must be configured.");
                return false;
            }

            if (!int.TryParse(_configuration["Smtp:Port"], out var port) || port <= 0) port = 587;
            var fromName = _configuration["Smtp:FromName"];
            var username = _configuration["Smtp:Username"];
            var password = _configuration["Smtp:Password"];

            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(string.IsNullOrWhiteSpace(fromName) ? "ZAYNA" : fromName, fromEmail));
                message.To.Add(recipient);
                message.Subject = subject.Replace('\r', ' ').Replace('\n', ' ').Trim();

                var body = new BodyBuilder
                {
                    HtmlBody = htmlContent,
                    TextBody = EmailTemplates.ToPlainText(htmlContent)
                };
                message.Body = body.ToMessageBody();

                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
                using var client = new SmtpClient { Timeout = 15000 };
                await client.ConnectAsync(host, port, ParseSecurity(_configuration["Smtp:Security"]), cts.Token);
                if (!string.IsNullOrEmpty(username))
                    await client.AuthenticateAsync(username, password ?? string.Empty, cts.Token);
                await client.SendAsync(message, cts.Token);
                await client.DisconnectAsync(true, cts.Token);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Sending email to {Recipient} failed.", Mask(to));
                return false;
            }
        }

        public Task<bool> SendOtpEmailAsync(string to, string otpCode)
        {
            var content = EmailTemplates.Otp(otpCode);
            return SendEmailAsync(to, content.Subject, content.Html);
        }

        public Task<bool> SendBookingConfirmationAsync(string to, string bookingDetails)
        {
            var content = EmailTemplates.PlainDetails(bookingDetails);
            return SendEmailAsync(to, content.Subject, content.Html);
        }

        private static SecureSocketOptions ParseSecurity(string? value) =>
            (value ?? string.Empty).Trim().ToLowerInvariant() switch
            {
                "none" => SecureSocketOptions.None,
                "ssl" or "sslonconnect" or "implicit" => SecureSocketOptions.SslOnConnect,
                "auto" => SecureSocketOptions.Auto,
                _ => SecureSocketOptions.StartTls   // port 587 (default)
            };

        // "jane.doe@example.com" -> "j***@example.com" (keeps personal data out of logs)
        private static string Mask(string email)
        {
            var at = email.IndexOf('@');
            return at <= 1 ? "***" : email[0] + "***" + email[at..];
        }
    }
}
