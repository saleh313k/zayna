using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Zayna.Core.Interfaces;

/// <summary>
/// SMS delivery via Twilio. Safe to register without credentials: when Twilio is not configured
/// every send returns false (and logs once per call) instead of throwing, so the rest of the
/// application keeps working. Config keys: TwilioSettings:AccountSid / AuthToken / PhoneNumber.
/// </summary>
public class TwilioSmsService : ISmsService
{
    private readonly string _fromNumber;
    private readonly bool _configured;
    private readonly ILogger<TwilioSmsService> _logger;

    public TwilioSmsService(IConfiguration config, ILogger<TwilioSmsService> logger)
    {
        _logger = logger;

        var accountSid = config["TwilioSettings:AccountSid"] ?? "";
        var authToken = config["TwilioSettings:AuthToken"] ?? "";
        _fromNumber = config["TwilioSettings:PhoneNumber"] ?? "";

        _configured =
            accountSid.StartsWith("AC", StringComparison.Ordinal) &&
            !string.IsNullOrWhiteSpace(authToken) &&
            !authToken.StartsWith("your_", StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(_fromNumber);

        if (_configured)
            TwilioClient.Init(accountSid, authToken);
    }

    public async Task<bool> SendAsync(string phoneNumber, string message)
    {
        if (!_configured)
        {
            _logger.LogWarning("SMS not sent: Twilio is not configured.");
            return false;
        }

        if (string.IsNullOrWhiteSpace(phoneNumber))
            return false;

        var result = await MessageResource.CreateAsync(
            body: message,
            from: new Twilio.Types.PhoneNumber(_fromNumber),
            to: new Twilio.Types.PhoneNumber(phoneNumber));

        return result.ErrorCode == null;
    }

    public Task<bool> SendBookingConfirmationAsync(string phoneNumber, string bookingDetails)
        => SendAsync(phoneNumber, bookingDetails);

    public Task<bool> SendReminderAsync(string phoneNumber, string message)
        => SendAsync(phoneNumber, message);
}
