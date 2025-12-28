// Zayna.API/Controllers/AuthController.cs
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
        /// Send OTP to phone number
        /// </summary>
        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpDto dto)
        {
            var sent = await _otpService.SendOtpAsync(dto.PhoneNumber, dto.Purpose);

            if (!sent)
                return BadRequest(new { message = "Failed to send OTP" });

            return Ok(new { message = "OTP sent successfully" });
        }

        /// <summary>
        /// Verify OTP code
        /// </summary>
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            var valid = await _otpService.VerifyOtpAsync(
                dto.PhoneNumber,
                dto.Code,
                dto.Purpose);

            if (!valid)
                return BadRequest(new { message = "Invalid or expired OTP" });

            return Ok(new { message = "OTP verified successfully" });
        }

        /// <summary>
        /// Register new user
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var verified = await _otpService.VerifyOtpAsync(
                dto.PhoneNumber,
                dto.OtpCode,
                OTPPurpose.Registration);

            if (!verified)
                return BadRequest(new { message = "Invalid OTP" });

            var response = await _authService.RegisterAsync(dto);
            return Ok(response);
        }

        /// <summary>
        /// Login with phone and OTP
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var response = await _authService.LoginWithPhoneAsync(
                dto.PhoneNumber,
                dto.OtpCode);

            return Ok(response);
        }

        /// <summary>
        /// Login with social provider
        /// </summary>
        [HttpPost("social-login")]
        public async Task<IActionResult> SocialLogin([FromBody] SocialLoginDto dto)
        {
            var response = await _authService.LoginWithSocialAsync(dto);
            return Ok(response);
        }
    }
}
