namespace ZAYNA.Core.Entities
{

    public class Customer
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public int LoyaltyPoints { get; set; } = 0;
        public bool NotificationsEnabled { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User User { get; set; } = null!;
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<LoyaltyPointsHistory> LoyaltyPointsHistory { get; set; } = new List<LoyaltyPointsHistory>();
    }
}