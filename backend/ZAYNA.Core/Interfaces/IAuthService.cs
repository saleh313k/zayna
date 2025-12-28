// ============================================
// Zayna.Core/Interfaces/IAuthService.cs
// ============================================
using System;
using System.Threading.Tasks;
using Zayna.Core.DTOs;

namespace Zayna.Core.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginWithPhoneAsync(string phoneNumber, string otpCode);
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> LoginWithSocialAsync(SocialLoginDto dto);
        Task<string> GenerateTokenAsync(Guid userId);
        Task<bool> ValidateTokenAsync(string token);
    }
}