using ZAYNA.Core.Enums;

namespace ZAYNA.Core.Entities
{
    public class Salon
    {
        public Guid Id { get; set; }

        public string? SalonName { get; set; }
        public string? SalonNameAr { get; set; }
        public string? AboutText { get; set; }
        public string? AboutTextAr { get; set; }
        //public string? LogoUrl { get; set; }
        public string? ContactPhone { get; set; }
        public string? ContactEmail { get; set; }
        public string? FacebookUrl { get; set; }
        public string? InstagramUrl { get; set; }
        public string? TwitterUrl { get; set; }
        public bool IsVerified { get; set; }
        public decimal Rating { get; set; } = 0.0m;
        public int TotalReviews { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public ICollection<Branch> Branches { get; set; } = new List<Branch>();
        public ICollection<Stylist> Stylists { get; set; } = new List<Stylist>();
        public ICollection<Service> Services { get; set; } = new List<Service>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
