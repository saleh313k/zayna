using System.Security.Cryptography;
using Zayna.Core.Interfaces;
using ZAYNA.Core.Enums;
using ZAYNA.Core.Interfaces;

public class OtpService : IOtpService
{
    private readonly IRepository<OTPVerification> _otpRepository;
    private readonly ISmsService _smsService;

    private const int OtpExpireMinutes = 5;
    private const int MaxVerifyAttempts = 5;

    public OtpService(
        IRepository<OTPVerification> otpRepository,
        ISmsService smsService)
    {
        _otpRepository = otpRepository;
        _smsService = smsService;
    }

    // ============================
    // Send OTP
    // ============================
    public async Task<bool> SendOtpAsync(string phoneNumber, OTPPurpose purpose)
    {
        // 1️⃣ تولید OTP امن
        var code = GenerateSecureOtp();

        // 2️⃣ غیرفعال کردن OTPهای قبلی استفاده‌نشده (اختیاری ولی حرفه‌ای)
        var oldOtps = await _otpRepository.FindAsync(x =>
            x.PhoneNumber == phoneNumber &&
            x.Purpose == purpose &&
            !x.IsUsed);

        foreach (var old in oldOtps)
        {
            old.IsUsed = true;
        }

        if (oldOtps.Any())
            await _otpRepository.UpdateRangeAsync(oldOtps);

        // 3️⃣ ذخیره OTP جدید
        var otp = new OTPVerification
        {
            PhoneNumber = phoneNumber,
            Code = code,
            Purpose = purpose,
            ExpiresAt = DateTime.UtcNow.AddMinutes(OtpExpireMinutes),
            AttemptCount = 0,
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        await _otpRepository.AddAsync(otp);

        // 4️⃣ ارسال SMS
        var message = $"Your verification code is: {code}";
        return await _smsService.SendAsync(phoneNumber, message);
    }

    // ============================
    // Verify OTP
    // ============================
    public async Task<bool> VerifyOtpAsync(string phoneNumber, string code, OTPPurpose purpose)
    {
        // 1️⃣ پیدا کردن آخرین OTP معتبر
        var otp = await _otpRepository.FirstOrDefaultAsync(x =>
            x.PhoneNumber == phoneNumber &&
            x.Purpose == purpose &&
            !x.IsUsed);

        if (otp == null)
            return false;

        // 2️⃣ بررسی انقضا
        if (otp.ExpiresAt < DateTime.UtcNow)
            return false;

        // 3️⃣ بررسی تعداد تلاش
        if (otp.AttemptCount >= MaxVerifyAttempts)
            return false;

        // 4️⃣ افزایش شمارنده تلاش
        otp.AttemptCount++;

        // 5️⃣ بررسی کد
        if (otp.Code != code)
        {
            await _otpRepository.UpdateAsync(otp);
            return false;
        }

        // 6️⃣ موفق → مصرف OTP
        otp.IsUsed = true;
        await _otpRepository.UpdateAsync(otp);

        return true;
    }

    // ============================
    // Helper: Secure OTP Generator
    // ============================
    private static string GenerateSecureOtp()
    {
        return RandomNumberGenerator
            .GetInt32(100000, 999999)
            .ToString();
    }
}
