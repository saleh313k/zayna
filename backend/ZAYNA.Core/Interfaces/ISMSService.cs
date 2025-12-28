// Zayna.Core/Interfaces/ISmsService.cs
using System.Threading.Tasks;

namespace Zayna.Core.Interfaces
{
    public interface ISmsService
    {
        Task<bool> SendAsync(string phoneNumber, string message);
        Task<bool> SendBookingConfirmationAsync(string phoneNumber, string bookingDetails);
        Task<bool> SendReminderAsync(string phoneNumber, string message);
    }
}
