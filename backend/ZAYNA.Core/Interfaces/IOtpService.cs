using ZAYNA.Core.Enums;

namespace Zayna.Core.Interfaces
{
    public interface IOtpService
    {
        Task<bool> SendOtpAsync(string phoneNumber, OTPPurpose purpose, UserLanguage userLanguage);
        Task<bool> VerifyOtpAsync(string phoneNumber, string code, OTPPurpose purpose, UserLanguage userLanguage);
    }
}
