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

    public class EmailRegisterDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// Account type chosen at registration. Only Customer (default when omitted) and Salon are allowed.
        /// Nullable on purpose: an omitted value must not silently become 0 (Admin).
        /// </summary>
        public UserRole? Role { get; set; }

        /// <summary>Required when Role is Salon.</summary>
        public RegisterSalonDto? Salon { get; set; }
    }

    public class EmailLoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class GoogleLoginDto
    {
        /// <summary>The Google ID token (JWT credential) returned by Google Sign-In.</summary>
        public string IdToken { get; set; } = string.Empty;

        /// <summary>
        /// True only from the registration wizard. When false (normal sign-in) a Google account that has no
        /// Zayna account yet is rejected (ACCOUNT_NOT_FOUND) instead of being created silently.
        /// </summary>
        public bool Register { get; set; }

        /// <summary>Account type for a NEW account (Customer when omitted; only Customer and Salon allowed).</summary>
        public UserRole? Role { get; set; }

        /// <summary>Required when creating a new Salon account.</summary>
        public RegisterSalonDto? Salon { get; set; }
    }

    public class RegisterSalonDto
    {
        public string SalonName { get; set; } = string.Empty;
        public string? SalonNameAr { get; set; }
        public string ContactPhone { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string AddressLine { get; set; } = string.Empty;
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