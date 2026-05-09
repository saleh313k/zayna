<<<<<<< HEAD
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
=======
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
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
