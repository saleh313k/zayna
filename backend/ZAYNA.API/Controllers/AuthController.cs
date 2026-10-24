// ZAYNA.API/Controllers/AuthController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using Zayna.Core.DTOs;
using Zayna.Core.Interfaces;
using ZAYNA.Core.Enums;

namespace Zayna.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IOtpService _otpService;

        public AuthController(
            IAuthService authService,
            IOtpService otpService)
        {
            _authService = authService;
            _otpService = otpService;
        }

        /// <summary>
        /// Send a one-time verification code to the supplied phone number.
        /// </summary>
        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.PhoneNumber) ||
                !Enum.IsDefined(typeof(OTPPurpose), dto.Purpose) ||
                !Enum.IsDefined(typeof(UserLanguage), dto.UserLanguage))
            {
                return BadRequest(new { message = "A valid phone number, purpose, and language are required." });
            }

            var sent = await _otpService.SendOtpAsync(
                dto.PhoneNumber,
                dto.Purpose,
                dto.UserLanguage);

            if (!sent)
            {
                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    new { message = "Unable to send verification code. Please try again later." });
            }

            return Ok(new { message = "OTP sent successfully" });
        }

        /// <summary>
        /// Verify and consume a one-time code for its specified purpose.
        /// Registration and login endpoints verify their own codes as part of the operation.
        /// </summary>
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.PhoneNumber) ||
                string.IsNullOrWhiteSpace(dto.Code) ||
                !Enum.IsDefined(typeof(OTPPurpose), dto.Purpose))
            {
                return BadRequest(new { message = "A valid phone number, code, and purpose are required." });
            }

            var valid = await _otpService.VerifyOtpAsync(
                dto.PhoneNumber,
                dto.Code,
                dto.Purpose,
                UserLanguage.English);

            if (!valid)
            {
                return BadRequest(new { message = "Invalid or expired OTP" });
            }

            return Ok(new { message = "OTP verified successfully" });
        }

        /// <summary>
        /// Register a new user. AuthService verifies and consumes the registration OTP.
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var response = await _authService.RegisterAsync(dto);
            return Ok(response);
        }

        /// <summary>
        /// Log in with phone number and OTP. AuthService verifies and consumes the login OTP.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var response = await _authService.LoginWithPhoneAsync(
                dto.PhoneNumber,
                dto.OtpCode,
                dto.UserLanguage);

            return Ok(response);
        }

        /// <summary>
        /// Sign in (or sign up as a Customer) with a Google ID token. The token is verified server-side.
        /// </summary>
        [EnableRateLimiting("auth")]
        [HttpPost("google")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.IdToken))
                return BadRequest(new { success = false, message = "A Google ID token is required." });

            var response = await _authService.LoginWithGoogleAsync(dto.IdToken);
            return Ok(response);
        }

        /// <summary>Create a Customer account with email and password.</summary>
        [EnableRateLimiting("auth")]
        [HttpPost("register-email")]
        public async Task<IActionResult> RegisterWithEmail([FromBody] EmailRegisterDto dto)
        {
            var response = await _authService.RegisterWithEmailAsync(dto);
            return Ok(response);
        }

        /// <summary>Sign in with email and password.</summary>
        [EnableRateLimiting("auth")]
        [HttpPost("login-email")]
        public async Task<IActionResult> LoginWithEmail([FromBody] EmailLoginDto dto)
        {
            var response = await _authService.LoginWithEmailAsync(dto);
            return Ok(response);
        }

        /// <summary>
        /// Upgrade the signed-in Customer to a Salon owner. The salon stays hidden from the public
        /// until an admin approves it. Returns a fresh token carrying the Salon role.
        /// </summary>
        [Authorize(Roles = "Customer")]
        [HttpPost("register-salon")]
        public async Task<IActionResult> RegisterSalon([FromBody] RegisterSalonDto dto)
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (!Guid.TryParse(value, out var userId))
                return Unauthorized();

            var response = await _authService.RegisterSalonAsync(userId, dto);
            return Ok(response);
        }
    }
}
