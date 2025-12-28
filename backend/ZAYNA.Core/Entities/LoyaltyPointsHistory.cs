namespace ZAYNA.Core.Entities
{
    public class LoyaltyPointsHistory
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public Customer Customer { get; set; } = null!;

        public int Points { get; set; }

        // Infrastructure expects TransactionType and Description
        public string? TransactionType { get; set; }
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
