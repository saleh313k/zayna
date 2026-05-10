<<<<<<< HEAD
using Microsoft.Extensions.Configuration;
using SendGrid;
using SendGrid.Helpers.Mail;
using Zayna.Core.Interfaces;

namespace Zayna.Infrastructure.Services
{
    public class SendGridEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly string _apiKey; 
        private readonly EmailAddress _from;

        public SendGridEmailService(IConfiguration configuration)
        {
            _configuration = configuration;
            _apiKey = _configuration["SendGridSettings:ApiKey"]!;
            _from = new EmailAddress(
                _configuration["SendGridSettings:FromEmail"],
                _configuration["SendGridSettings:FromName"]
            );
        }

        // ------------------------------------
        // Generic Email
        // ------------------------------------
        public async Task<bool> SendEmailAsync(string to, string subject, string htmlContent)
        {
            var client = new SendGridClient(_apiKey);
            var msg = new SendGridMessage
            {
                From = _from,
                Subject = subject,
                HtmlContent = htmlContent
            };

            msg.AddTo(new EmailAddress(to));

            var response = await client.SendEmailAsync(msg);
            return response.IsSuccessStatusCode;
        }

        // ------------------------------------
        // OTP Email
        // ------------------------------------
        public async Task<bool> SendOtpEmailAsync(string to, string otpCode)
        {
            var subject = "Your ZAYNA Verification Code";

            var body = $@"
                <h2>ZAYNA Verification Code</h2>
                <p>Your OTP code is:</p>
                <h1 style='letter-spacing:3px'>{otpCode}</h1>
                <p>This code will expire in 5 minutes.</p>
            ";

            return await SendEmailAsync(to, subject, body);
        }

        // ------------------------------------
        // Booking Confirmation
        // ------------------------------------
        public async Task<bool> SendBookingConfirmationAsync(string to, string bookingDetails)
        {
            var subject = "Your Booking is Confirmed";

            var body = $@"
                <h2>Booking Confirmed</h2>
                <p>Thank you for booking with ZAYNA.</p>
                <p><strong>Details:</strong></p>
                <p>{bookingDetails}</p>
            ";

            return await SendEmailAsync(to, subject, body);
        }
    }
}
=======
using Microsoft.Extensions.Configuration;
using SendGrid;
using SendGrid.Helpers.Mail;
using Zayna.Core.Interfaces;

namespace Zayna.Infrastructure.Services
{
    public class SendGridEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly string _apiKey; 
        private readonly EmailAddress _from;

        public SendGridEmailService(IConfiguration configuration)
        {
            _configuration = configuration;
            _apiKey = _configuration["SendGridSettings:ApiKey"]!;
            _from = new EmailAddress(
                _configuration["SendGridSettings:FromEmail"],
                _configuration["SendGridSettings:FromName"]
            );
        }

        // ------------------------------------
        // Generic Email
        // ------------------------------------
        public async Task<bool> SendEmailAsync(string to, string subject, string htmlContent)
        {
            var client = new SendGridClient(_apiKey);
            var msg = new SendGridMessage
            {
                From = _from,
                Subject = subject,
                HtmlContent = htmlContent
            };

            msg.AddTo(new EmailAddress(to));

            var response = await client.SendEmailAsync(msg);
            return response.IsSuccessStatusCode;
        }

        // ------------------------------------
        // OTP Email
        // ------------------------------------
        public async Task<bool> SendOtpEmailAsync(string to, string otpCode)
        {
            var subject = "Your ZAYNA Verification Code";

            var body = $@"
                <h2>ZAYNA Verification Code</h2>
                <p>Your OTP code is:</p>
                <h1 style='letter-spacing:3px'>{otpCode}</h1>
                <p>This code will expire in 5 minutes.</p>
            ";

            return await SendEmailAsync(to, subject, body);
        }

        // ------------------------------------
        // Booking Confirmation
        // ------------------------------------
        public async Task<bool> SendBookingConfirmationAsync(string to, string bookingDetails)
        {
            var subject = "Your Booking is Confirmed";

            var body = $@"
                <h2>Booking Confirmed</h2>
                <p>Thank you for booking with ZAYNA.</p>
                <p><strong>Details:</strong></p>
                <p>{bookingDetails}</p>
            ";

            return await SendEmailAsync(to, subject, body);
        }
    }
}
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
