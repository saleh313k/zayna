// ============================================
// Zayna.Core/Interfaces/IAuthService.cs
// ============================================
using System;
using System.Threading.Tasks;
using Zayna.Core.DTOs;
using ZAYNA.Core.Enums;

namespace Zayna.Core.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginWithPhoneAsync(string phoneNumber, string otpCode, UserLanguage userLanguage);
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> RegisterWithEmailAsync(EmailRegisterDto dto);
        Task<AuthResponseDto> LoginWithEmailAsync(EmailLoginDto dto);
        Task<AuthResponseDto> LoginWithGoogleAsync(GoogleLoginDto dto);
        Task<AuthResponseDto> RegisterSalonAsync(Guid userId, RegisterSalonDto dto);
        Task<string> GenerateTokenAsync(Guid userId);
        Task<bool> ValidateTokenAsync(string token);
    }
}