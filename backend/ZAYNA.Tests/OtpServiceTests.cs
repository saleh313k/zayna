using System.Linq.Expressions;
using Moq;
using Xunit;
using ZAYNA.Core.Entities;
using ZAYNA.Core.Enums;
using Zayna.Core.Interfaces;   // ISmsService
using ZAYNA.Core.Interfaces;   // IRepository<T>

public class OtpServiceTests
{
    private readonly List<OTPVerification> _stored = new();
    private readonly Mock<IRepository<OTPVerification>> _repository = new();
    private readonly Mock<ISmsService> _sms = new();
    private readonly OtpService _sut;

    public OtpServiceTests()
    {
        _repository
            .Setup(r => r.FindAsync(It.IsAny<Expression<Func<OTPVerification, bool>>>()))
            .ReturnsAsync((Expression<Func<OTPVerification, bool>> predicate) =>
                _stored.Where(predicate.Compile()).ToList());

        _repository
            .Setup(r => r.AddAsync(It.IsAny<OTPVerification>()))
            .ReturnsAsync((OTPVerification otp) =>
            {
                _stored.Add(otp);
                return otp;
            });

        _repository
            .Setup(r => r.UpdateAsync(It.IsAny<OTPVerification>()))
            .Returns(Task.CompletedTask);

        _repository
            .Setup(r => r.UpdateRangeAsync(It.IsAny<IEnumerable<OTPVerification>>()))
            .Returns(Task.CompletedTask);

        _sms.Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(true);

        _sut = new OtpService(_repository.Object, _sms.Object);
    }

    [Fact]
    public async Task SendOtpAsync_GeneratesSixDigitCode_AndStoresOnlyHash()
    {
        var sentMessage = string.Empty;
        _sms.Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<string>()))
            .Callback<string, string>((_, message) => sentMessage = message)
            .ReturnsAsync(true);

        var result = await _sut.SendOtpAsync("+96890000000", FirstPurpose(), UserLanguage.English);

        Assert.True(result);
        var match = System.Text.RegularExpressions.Regex.Match(sentMessage, @"\b(\d{6})\b");
        Assert.True(match.Success, "SMS should contain a six-digit OTP.");
        Assert.Single(_stored);
        Assert.NotEqual(match.Groups[1].Value, _stored[0].Code);
        Assert.Equal(64, _stored[0].Code.Length);
    }

    [Fact]
    public async Task VerifyOtpAsync_AcceptsCorrectCode_OnlyOnce()
    {
        var sentMessage = string.Empty;
        _sms.Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<string>()))
            .Callback<string, string>((_, message) => sentMessage = message)
            .ReturnsAsync(true);
        var purpose = FirstPurpose();

        Assert.True(await _sut.SendOtpAsync("+96890000000", purpose, UserLanguage.English));
        var code = System.Text.RegularExpressions.Regex.Match(sentMessage, @"\b(\d{6})\b").Groups[1].Value;

        Assert.True(await _sut.VerifyOtpAsync("+96890000000", code, purpose, UserLanguage.English));
        Assert.False(await _sut.VerifyOtpAsync("+96890000000", code, purpose, UserLanguage.English));
        Assert.True(_stored[0].IsUsed);
    }

    [Fact]
    public async Task VerifyOtpAsync_RejectsWrongCode_AndLocksAfterFiveAttempts()
    {
        var purpose = FirstPurpose();
        await _sut.SendOtpAsync("+96890000000", purpose, UserLanguage.English);

        for (var attempt = 0; attempt < 5; attempt++)
        {
            Assert.False(await _sut.VerifyOtpAsync("+96890000000", "000000", purpose, UserLanguage.English));
        }

        Assert.True(_stored[0].IsUsed);
        Assert.Equal(5, _stored[0].AttemptCount);
    }

    [Fact]
    public async Task SendOtpAsync_WhenSmsFails_InvalidatesOtp()
    {
        _sms.Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(false);

        var result = await _sut.SendOtpAsync("+96890000000", FirstPurpose(), UserLanguage.English);

        Assert.False(result);
        Assert.Single(_stored);
        Assert.True(_stored[0].IsUsed);
    }

    [Fact]
    public async Task VerifyOtpAsync_RejectsExpiredOtp()
    {
        var purpose = FirstPurpose();
        var expired = new OTPVerification
        {
            PhoneNumber = "+96890000000",
            Code = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes("123456"))),
            Purpose = purpose,
            ExpiresAt = DateTime.UtcNow.AddMinutes(-1),
            CreatedAt = DateTime.UtcNow.AddMinutes(-10),
            IsUsed = false
        };
        _stored.Add(expired);

        Assert.False(await _sut.VerifyOtpAsync("+96890000000", "123456", purpose, UserLanguage.English));
        Assert.True(expired.IsUsed);
    }

    private static OTPPurpose FirstPurpose() => Enum.GetValues<OTPPurpose>().First();
}
