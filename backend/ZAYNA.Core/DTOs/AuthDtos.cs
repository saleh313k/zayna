// ============================================
// Zayna.Core/DTOs/AuthDtos.cs
// ============================================
using ZAYNA.Core.Enums;

namespace Zayna.Core.DTOs
{
    public class LoginDto
    {
        public string PhoneNumber { get; set; }
        public string OtpCode { get; set; }
    }

    public class RegisterDto
    {
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string FullNameAr { get; set; }
        public UserRole Role { get; set; }
        public string OtpCode { get; set; }
    }

    public class SocialLoginDto
    {
        public SocialProvider Provider { get; set; }
        public string AccessToken { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string ExternalId { get; set; }
    }

    public class AuthResponseDto
    {
        public string Token { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; }
        public UserRole Role { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
    }

    public class SendOtpDto
    {
        public string PhoneNumber { get; set; }
        public OTPPurpose Purpose { get; set; }
    }

    public class VerifyOtpDto
    {
        public string PhoneNumber { get; set; }
        public string Code { get; set; }
        public OTPPurpose Purpose { get; set; }
    }
}