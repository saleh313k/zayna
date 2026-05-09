using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Zayna.Core.Interfaces;

public class TwilioSmsService : ISmsService
{
    private readonly string _accountSid;
    private readonly string _authToken;
    private readonly string _fromNumber;

    public TwilioSmsService(IConfiguration config)
    {
        _accountSid = config["Twilio:AccountSid"]! ?? "";
        _authToken = config["Twilio:AuthToken"]! ?? "";
        _fromNumber = config["Twilio:FromNumber"]! ?? "";

        TwilioClient.Init(_accountSid, _authToken);
    }

    public async Task<bool> SendAsync(string phoneNumber, string message)
    {
        var result = await MessageResource.CreateAsync(
            body: message,
            from: new Twilio.Types.PhoneNumber(_fromNumber),
            to: new Twilio.Types.PhoneNumber(phoneNumber)
        );

        return result.ErrorCode == null;
    }

    public Task<bool> SendBookingConfirmationAsync(string phoneNumber, string bookingDetails)
        => SendAsync(phoneNumber, bookingDetails);

    public Task<bool> SendReminderAsync(string phoneNumber, string message)
        => SendAsync(phoneNumber, message);
}
