namespace ZAYNA.Core.Interfaces
{

    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = true);
        Task<bool> SendBookingConfirmationAsync(string to, string customerName, string bookingDetails);
        Task<bool> SendReminderAsync(string to, string customerName, string message);
        Task<bool> SendCancellationNoticeAsync(string to, string customerName, string message);
    }
}