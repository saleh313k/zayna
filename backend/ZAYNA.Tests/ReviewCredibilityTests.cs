using Xunit;
using ZAYNA.Infrastructure.Services;

namespace ZAYNA.Tests;

public class ReviewCredibilityTests
{
    [Theory]
    [InlineData(0, "verified")]
    [InlineData(1, "verified")]
    [InlineData(2, "verified")]
    [InlineData(3, "regular")]
    [InlineData(9, "regular")]
    [InlineData(10, "trusted")]
    [InlineData(250, "trusted")]
    public void Tier_follows_the_number_of_completed_visits(int visits, string expected)
    {
        Assert.Equal(expected, ReviewerCredibility.TierFor(visits));
    }

    [Theory]
    [InlineData("Aisha Al Balushi", "Aisha B.")]
    [InlineData("  Ali   Hassan  ", "Ali H.")]
    [InlineData("Aisha", "Aisha")]
    [InlineData("عائشة البلوشي", "عائشة ا.")]
    [InlineData(null, "Customer")]
    [InlineData("", "Customer")]
    [InlineData("   ", "Customer")]
    public void Public_names_never_expose_the_full_name(string? input, string expected)
    {
        Assert.Equal(expected, ReviewerCredibility.MaskName(input));
    }

    [Fact]
    public void Masking_keeps_an_emoji_initial_intact()
    {
        Assert.Equal("Sam \U0001F600.", ReviewerCredibility.MaskName("Sam \U0001F600smith"));
    }
}
