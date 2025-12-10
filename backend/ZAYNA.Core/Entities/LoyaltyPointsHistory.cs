namespace ZAYNA.Core.Entities { 

public class LoyaltyPointsHistory
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public int Points { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Customer Customer { get; set; } = null!;
}
}