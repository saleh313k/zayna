using Moq;
using Xunit;
using Zayna.Core.Interfaces;
using ZAYNA.Core.Entities;
using ZAYNA.Infrastructure.Services;

namespace ZAYNA.Tests;

public class LoyaltyServiceTests
{
    private readonly Mock<IRepository<Customer>> _customers = new();
    private readonly Mock<IRepository<LoyaltyPointsHistory>> _history = new();
    private readonly Guid _id = Guid.NewGuid();

    private LoyaltyService Sut() => new(_customers.Object, _history.Object);

    private Customer WithBalance(int balance)
    {
        var customer = new Customer { Id = _id, User = new User(), LoyaltyPointsBalance = balance };
        _customers.Setup(r => r.GetByIdAsync(_id)).ReturnsAsync(customer);
        return customer;
    }

    [Fact]
    public async Task Points_are_the_balance_not_the_number_of_history_rows()
    {
        WithBalance(40);   // history collection is empty (not loaded) - the old code returned 0 here
        Assert.Equal(40, await Sut().GetCustomerPointsAsync(_id));
    }

    [Fact]
    public async Task Unknown_customer_has_zero_points()
    {
        _customers.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Customer?)null);
        Assert.Equal(0, await Sut().GetCustomerPointsAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task Adding_points_increases_the_balance_and_records_history()
    {
        var customer = WithBalance(10);
        await Sut().AddPointsAsync(_id, 10, "Booking #1");

        Assert.Equal(20, customer.LoyaltyPointsBalance);
        _history.Verify(r => r.AddAsync(It.Is<LoyaltyPointsHistory>(h => h.Points == 10 && h.CustomerId == _id)), Times.Once);
    }

    [Fact]
    public async Task Deducting_more_than_the_balance_never_goes_negative()
    {
        var customer = WithBalance(5);
        await Sut().DeductPointsAsync(_id, 50, "Redeem");

        Assert.Equal(0, customer.LoyaltyPointsBalance);
    }

    [Fact]
    public async Task Redeem_check_compares_against_the_balance()
    {
        WithBalance(30);
        Assert.True(await Sut().CanRedeemPointsAsync(_id, 30));
        Assert.False(await Sut().CanRedeemPointsAsync(_id, 31));
    }
}
