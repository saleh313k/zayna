using Microsoft.Extensions.Configuration;
using Xunit;
using Zayna.Core.Exceptions;
using ZAYNA.Core.Enums;
using ZAYNA.Infrastructure.Services;

namespace ZAYNA.Tests;

/// <summary>
/// Pure-logic tests of the booking rules (no database needed, so they run anywhere, including CI).
/// The concurrency / lock behaviour needs a real SQL Server and is covered by the integration tests.
/// </summary>
public class BookingTransitionTests
{
    private static readonly DateTime Start = new(2030, 1, 5, 10, 0, 0);
    private static readonly DateTime BeforeStart = Start.AddHours(-3);
    private static readonly DateTime AfterStart = Start.AddMinutes(5);

    [Fact]
    public void Pending_can_be_confirmed_or_cancelled_at_any_time()
    {
        var before = BookingService.GetAllowedTransitions(BookingStatus.Pending, Start, BeforeStart);
        var after = BookingService.GetAllowedTransitions(BookingStatus.Pending, Start, AfterStart);

        Assert.Equal(new[] { BookingStatus.Confirmed, BookingStatus.Cancelled }, before);
        Assert.Equal(new[] { BookingStatus.Confirmed, BookingStatus.Cancelled }, after);
    }

    [Fact]
    public void Confirmed_booking_cannot_be_started_completed_or_marked_no_show_before_its_time()
    {
        var allowed = BookingService.GetAllowedTransitions(BookingStatus.Confirmed, Start, BeforeStart);

        Assert.Equal(new[] { BookingStatus.Cancelled }, allowed);
    }

    [Fact]
    public void Confirmed_booking_can_progress_once_its_time_has_started()
    {
        var allowed = BookingService.GetAllowedTransitions(BookingStatus.Confirmed, Start, AfterStart);

        Assert.Contains(BookingStatus.InProgress, allowed);
        Assert.Contains(BookingStatus.Completed, allowed);
        Assert.Contains(BookingStatus.NoShow, allowed);
        Assert.Contains(BookingStatus.Cancelled, allowed);
        Assert.DoesNotContain(BookingStatus.Pending, allowed);
    }

    [Fact]
    public void Exactly_at_start_time_counts_as_started()
    {
        var allowed = BookingService.GetAllowedTransitions(BookingStatus.Confirmed, Start, Start);

        Assert.Contains(BookingStatus.Completed, allowed);
    }

    [Fact]
    public void InProgress_booking_can_only_be_completed()
    {
        var allowed = BookingService.GetAllowedTransitions(BookingStatus.InProgress, Start, AfterStart);

        Assert.Equal(new[] { BookingStatus.Completed }, allowed);
    }

    [Theory]
    [InlineData(BookingStatus.Completed)]
    [InlineData(BookingStatus.Cancelled)]
    [InlineData(BookingStatus.NoShow)]
    public void Final_states_never_change(BookingStatus finalState)
    {
        Assert.Empty(BookingService.GetAllowedTransitions(finalState, Start, BeforeStart));
        Assert.Empty(BookingService.GetAllowedTransitions(finalState, Start, AfterStart));
    }
}

public class BookingPolicyTests
{
    private static BookingPolicy Build(Dictionary<string, string?>? values = null)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(values ?? new Dictionary<string, string?>())
            .Build();
        return new BookingPolicy(configuration);
    }

    [Fact]
    public void Defaults_are_the_documented_ones()
    {
        var policy = Build();

        Assert.Equal(30, policy.MinLeadMinutes);
        Assert.Equal(60, policy.MaxDaysAhead);
        Assert.Equal(2, policy.CancellationCutoffHours);
        Assert.Equal(30, policy.SlotIntervalMinutes);
        Assert.True(policy.AutoConfirm);
        Assert.False(policy.OnlinePaymentEnabled); // online payment must be opt-in
    }

    [Fact]
    public void Values_can_be_overridden_from_configuration()
    {
        var policy = Build(new()
        {
            ["Booking:MinLeadMinutes"] = "60",
            ["Booking:MaxDaysAhead"] = "30",
            ["Booking:CancellationCutoffHours"] = "24",
            ["Booking:SlotIntervalMinutes"] = "15",
            ["Booking:AutoConfirm"] = "false",
            ["Payments:OnlineEnabled"] = "true",
        });

        Assert.Equal(60, policy.MinLeadMinutes);
        Assert.Equal(30, policy.MaxDaysAhead);
        Assert.Equal(24, policy.CancellationCutoffHours);
        Assert.Equal(15, policy.SlotIntervalMinutes);
        Assert.False(policy.AutoConfirm);
        Assert.True(policy.OnlinePaymentEnabled);
    }

    [Fact]
    public void Absurd_values_are_clamped_to_safe_limits()
    {
        var policy = Build(new()
        {
            ["Booking:MinLeadMinutes"] = "-5",
            ["Booking:MaxDaysAhead"] = "99999",
            ["Booking:SlotIntervalMinutes"] = "1",
        });

        Assert.Equal(0, policy.MinLeadMinutes);
        Assert.Equal(365, policy.MaxDaysAhead);
        Assert.Equal(5, policy.SlotIntervalMinutes); // a 1-minute grid would explode the slot list
    }

    [Fact]
    public void Garbage_values_fall_back_to_defaults()
    {
        var policy = Build(new()
        {
            ["Booking:MaxDaysAhead"] = "soon",
            ["Booking:AutoConfirm"] = "maybe",
        });

        Assert.Equal(60, policy.MaxDaysAhead);
        Assert.True(policy.AutoConfirm);
    }
}

public class SalonClockTests
{
    private static SalonClock Build(string? timeZone)
    {
        var values = new Dictionary<string, string?>();
        if (timeZone != null) values["Booking:TimeZone"] = timeZone;
        return new SalonClock(new ConfigurationBuilder().AddInMemoryCollection(values).Build());
    }

    [Theory]
    [InlineData(null)]            // default
    [InlineData("Asia/Muscat")]
    [InlineData("Not/A_Real_Zone")] // unknown id must never crash booking; falls back to Oman time
    public void Salon_time_is_Oman_time_UTC_plus_4(string? zone)
    {
        var clock = Build(zone);

        var expected = DateTime.UtcNow.AddHours(4);
        Assert.True(Math.Abs((clock.LocalNow - expected).TotalSeconds) < 5,
            $"LocalNow {clock.LocalNow:o} is not about UTC+4 ({expected:o})");
    }
}

public class AppExceptionTests
{
    [Fact]
    public void Defaults_to_400_bad_request()
    {
        Assert.Equal(400, new AppException("X", "message").StatusCode);
    }

    [Fact]
    public void Keeps_the_given_status_code_and_code()
    {
        var ex = new AppException("SLOT_UNAVAILABLE", "taken", 409);

        Assert.Equal(409, ex.StatusCode);
        Assert.Equal("SLOT_UNAVAILABLE", ex.Code);
        Assert.Equal("taken", ex.Message);
    }
}
