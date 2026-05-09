// ============================================
// Zayna.Core/DTOs/AuthDtos.cs
// ============================================
using ZAYNA.Core.Enums;

namespace Zayna.Core.DTOs
{
    public class LoginDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
        public UserLanguage UserLanguage { get; set; }
    }

    public class RegisterDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string FullNameAr { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public string OtpCode { get; set; } = string.Empty;

        public UserLanguage UserLanguage { get; set; }
    }

    public class SocialLoginDto
    {
        public SocialProvider Provider { get; set; }
        public string AccessToken { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string ExternalId { get; set; } = string.Empty;
        public string ProviderUserId { get; set; } = string.Empty;

    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class SendOtpDto
    {
        public required string PhoneNumber { get; set; } 
        public OTPPurpose Purpose { get; set; }
        public UserLanguage UserLanguage { get; set; }
    }

    public class VerifyOtpDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;    
        public OTPPurpose Purpose { get; set; }
    }
}