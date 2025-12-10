namespace ZAYNA.Core.Interfaces
{

    public interface ISMSService
    {
        Task<bool> SendOTPAsync(string phoneNumber, string code);
        Task<bool> SendBookingConfirmationAsync(string phoneNumber, string bookingDetails);
        Task<bool> SendReminderAsync(string phoneNumber, string message);
        Task<bool> SendCancellationNoticeAsync(string phoneNumber, string message);
    }
}