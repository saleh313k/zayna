using System.Security.Cryptography;
using System.Text;
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

    public async Task<bool> SendOtpAsync(
        string phoneNumber,
        OTPPurpose purpose,
        UserLanguage userLanguage)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber) ||
            !Enum.IsDefined(typeof(OTPPurpose), purpose))
        {
            return false;
        }

        var code = GenerateSecureOtp();

        // Invalidate any previously issued, unused OTPs for this phone and purpose.
        var oldOtps = await _otpRepository.FindAsync(x =>
            x.PhoneNumber == phoneNumber &&
            x.Purpose == purpose &&
            !x.IsUsed);

        foreach (var old in oldOtps)
        {
            old.IsUsed = true;
        }

        if (oldOtps.Any())
        {
            await _otpRepository.UpdateRangeAsync(oldOtps);
        }

        // Store only a SHA-256 hash; the plaintext code is sent only to the user.
        var otp = new OTPVerification
        {
            PhoneNumber = phoneNumber,
            Code = HashOtp(code),
            Purpose = purpose,
            ExpiresAt = DateTime.UtcNow.AddMinutes(OtpExpireMinutes),
            AttemptCount = 0,
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        await _otpRepository.AddAsync(otp);

        var message = userLanguage == UserLanguage.Arabic
            ? $"Zayna.om - رمز التحقق الخاص بك هو: {code}"
            : $"Zayna.om - Your verification code is: {code}";

        try
        {
            var sent = await _smsService.SendAsync(phoneNumber, message);
            if (sent)
            {
                return true;
            }
        }
        catch
        {
            // Do not leave a usable OTP behind if the SMS provider fails.
        }

        otp.IsUsed = true;
        await _otpRepository.UpdateAsync(otp);
        return false;
    }

    public async Task<bool> VerifyOtpAsync(
        string phoneNumber,
        string code,
        OTPPurpose purpose,
        UserLanguage userLanguage)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber) ||
            string.IsNullOrWhiteSpace(code) ||
            !Enum.IsDefined(typeof(OTPPurpose), purpose))
        {
            return false;
        }

        var candidates = await _otpRepository.FindAsync(x =>
            x.PhoneNumber == phoneNumber &&
            x.Purpose == purpose &&
            !x.IsUsed);

        var otp = candidates
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefault();

        if (otp == null)
        {
            return false;
        }

        if (otp.ExpiresAt <= DateTime.UtcNow)
        {
            otp.IsUsed = true;
            await _otpRepository.UpdateAsync(otp);
            return false;
        }

        if (otp.AttemptCount >= MaxVerifyAttempts)
        {
            otp.IsUsed = true;
            await _otpRepository.UpdateAsync(otp);
            return false;
        }

        otp.AttemptCount++;

        var suppliedHash = HashOtp(code);
        var isMatch = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(otp.Code),
            Encoding.UTF8.GetBytes(suppliedHash));

        if (!isMatch)
        {
            if (otp.AttemptCount >= MaxVerifyAttempts)
            {
                otp.IsUsed = true;
            }

            await _otpRepository.UpdateAsync(otp);
            return false;
        }

        otp.IsUsed = true;
        await _otpRepository.UpdateAsync(otp);
        return true;
    }

    private static string GenerateSecureOtp()
    {
        return RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
    }

    private static string HashOtp(string code)
    {
        return Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(code)));
    }
}
