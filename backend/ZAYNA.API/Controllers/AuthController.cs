// ZAYNA.API/Controllers/AuthController.cs
using Microsoft.AspNetCore.Mvc;
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
        /// Log in with a social provider.
        /// </summary>
        [HttpPost("social-login")]
        public async Task<IActionResult> SocialLogin([FromBody] SocialLoginDto dto)
        {
            var response = await _authService.LoginWithSocialAsync(dto);
            return Ok(response);
        }
    }
}
