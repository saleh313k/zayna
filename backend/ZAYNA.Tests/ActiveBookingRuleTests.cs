using Xunit;
using ZAYNA.Core.Entities;
using ZAYNA.Core.Enums;
using ZAYNA.Infrastructure.Services;

namespace ZAYNA.Tests;

public class ActiveBookingRuleTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly DateTime Today = new(2030, 3, 10);

    private static bool Blocks(BookingStatus status, int dayOffset, Guid? customer = null)
    {
        var booking = new Booking { CustomerId = customer ?? Me, BookingDate = Today.AddDays(dayOffset), Status = status };
        return new[] { booking }.AsQueryable().Any(ActiveBookingRule.For(Me, Today));
    }

    [Theory]
    [InlineData(BookingStatus.Pending, 0)]
    [InlineData(BookingStatus.Pending, 5)]
    [InlineData(BookingStatus.Confirmed, 0)]
    [InlineData(BookingStatus.Confirmed, 30)]
    [InlineData(BookingStatus.InProgress, 0)]
    public void Upcoming_open_bookings_block_deletion(BookingStatus status, int dayOffset)
    {
        Assert.True(Blocks(status, dayOffset));
    }

    [Theory]
    [InlineData(BookingStatus.Completed, 0)]
    [InlineData(BookingStatus.Cancelled, 5)]
    [InlineData(BookingStatus.NoShow, 0)]
    public void Finished_bookings_never_block(BookingStatus status, int dayOffset)
    {
        Assert.False(Blocks(status, dayOffset));
    }

    [Theory]
    [InlineData(BookingStatus.Pending)]
    [InlineData(BookingStatus.Confirmed)]
    public void Old_unclosed_bookings_do_not_block(BookingStatus status)
    {
        Assert.False(Blocks(status, -1));
        Assert.False(Blocks(status, -90));
    }

    [Fact]
    public void Another_customers_bookings_do_not_block()
    {
        Assert.False(Blocks(BookingStatus.Confirmed, 5, customer: Guid.NewGuid()));
    }
}
