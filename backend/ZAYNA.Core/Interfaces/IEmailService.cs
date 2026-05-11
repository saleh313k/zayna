// ============================================
// Zayna.Core/Interfaces/IEmailService.cs
// ============================================
using System.Threading.Tasks;

namespace Zayna.Core.Interfaces
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string to, string subject, string htmlContent);
        Task<bool> SendOtpEmailAsync(string to, string otpCode);
        Task<bool> SendBookingConfirmationAsync(string to, string bookingDetails);
    }
}
