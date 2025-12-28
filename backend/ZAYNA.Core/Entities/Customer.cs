namespace ZAYNA.Core.Entities
{
    public class Customer
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public required User User { get; set; }  
        // Infrastructure expects FullName on Customer in some places
        public string FullName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int LoyaltyPointsBalance { get; set; }
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<LoyaltyPointsHistory> LoyaltyPointsHistory { get; set; } = new List<LoyaltyPointsHistory>();


    }
}
