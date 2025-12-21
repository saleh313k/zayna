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
        public string? ContactPhone { get; set; }
        public string? ContactEmail { get; set; }
        public bool IsVerified { get; set; }
        public double Rating { get; set; } = 0.0;
        public int TotalReviews { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public ICollection<Branch> Branches { get; set; } = new List<Branch>();
    }
}
