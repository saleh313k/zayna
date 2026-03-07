using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Twilio.Exceptions;
using Zayna.Core.DTOs;
using Zayna.Core.Exceptions;
using Zayna.Core.Interfaces;
using ZAYNA.Core.Enums;

namespace Zayna.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly IRepository<User> _userRepository;
        private readonly IOtpService _otpService;
        private readonly IConfiguration _configuration;

        public AuthService(
            IRepository<User> userRepository,
            IOtpService otpService,
            IConfiguration configuration)
        {
            _userRepository = userRepository;
            _otpService = otpService;
            _configuration = configuration;
        }

        // =========================================================
        // LOGIN (Phone + OTP)
        // =========================================================
        public async Task<AuthResponseDto> LoginWithPhoneAsync(string phoneNumber, string otpCode)
        {
            // 1. Verify OTP for LOGIN purpose
            var otpValid = await _otpService.VerifyOtpAsync(
                phoneNumber,
                otpCode,
                OTPPurpose.Login
            );

            if (!otpValid)
                throw new AppException("OTP_INVALID", "Invalid or expired OTP");

            // 2. Check user existence
            var user = await _userRepository.FirstOrDefaultAsync(
                u => u.PhoneNumber == phoneNumber
            );

            // 3. If not exists → BLOCK LOGIN
            if (user == null)
                throw new AppException("USER_NOT_FOUND", "User not found");

            // 4. Ensure phone verified flag
            if (!user.IsPhoneVerified)
            {
                user.IsPhoneVerified = true;
                await _userRepository.UpdateAsync(user);
            }

            // 5. Generate token
            var token = await GenerateTokenAsync(user.Id);

            return new AuthResponseDto
            {
                UserId = user.Id,
                Token = token,
                Role = user.Role
            };
        }

        // =========================================================
        // REGISTER
        // =========================================================
        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            // 1. Verify OTP for REGISTRATION purpose
            var otpValid = await _otpService.VerifyOtpAsync(
                dto.PhoneNumber,
                dto.OtpCode,
                OTPPurpose.Registration
            );

            if (!otpValid)
                throw new AppException("OTP_INVALID", "Invalid or expired OTP");

            // 2. Check if user already exists
            var exists = await _userRepository.FirstOrDefaultAsync(
                u => u.PhoneNumber == dto.PhoneNumber
            );

            if (exists != null)
                throw new AppException("USER_EXISTS", "User already exists");

            // 3. Create user
            var user = new User
            {
                PhoneNumber = dto.PhoneNumber,
                FullName = dto.FullName,
                Email = dto.Email,
                Role = UserRole.Customer,
                IsPhoneVerified = true,
                CreatedAt = DateTime.UtcNow
            };

            await _userRepository.AddAsync(user);

            // 4. Generate token
            var token = await GenerateTokenAsync(user.Id);

            return new AuthResponseDto
            {
                UserId = user.Id,
                Token = token,
                Role = user.Role
            };
        }

        // =========================================================
        // SOCIAL LOGIN (Google / Apple)
        // =========================================================
        public async Task<AuthResponseDto> LoginWithSocialAsync(SocialLoginDto dto)
        {
            var user = await _userRepository
                .FirstOrDefaultAsync(u =>
                    u.SocialAuthProviders.Any(p =>
                        p.Provider == dto.Provider &&
                        p.ProviderUserId == dto.ProviderUserId));

            // Social login CAN auto-register (this is correct behavior)
            if (user == null)
            {
                user = new User
                {
                    Email = dto.Email,
                    FullName = dto.FullName ?? "",
                    Role = UserRole.Customer,
                    IsEmailVerified = true,
                    CreatedAt = DateTime.UtcNow,
                    SocialAuthProviders = new List<SocialAuthProvider>
                    {
                        new SocialAuthProvider
                        {
                            Provider = dto.Provider,
                            ProviderUserId = dto.ProviderUserId
                        }
                    }
                };

                await _userRepository.AddAsync(user);
            }

            var token = await GenerateTokenAsync(user.Id);

            return new AuthResponseDto
            {
                UserId = user.Id,
                Token = token,
                Role = user.Role
            };
        }

        // =========================================================
        // JWT
        // =========================================================
        public async Task<string> GenerateTokenAsync(Guid userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new AppException("USER_NOT_FOUND", "User not found");

            var jwtSettings = _configuration.GetSection("JwtSettings");

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(int.Parse(jwtSettings["ExpiryHours"]!)),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public Task<bool> ValidateTokenAsync(string token)
        {
            var handler = new JwtSecurityTokenHandler();
            return Task.FromResult(handler.CanReadToken(token));
        }
    }
}
