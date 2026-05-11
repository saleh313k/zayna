namespace ZAYNA.Core.Entities
{

    public class Stylist
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid SalonId { get; set; }
        public Guid? BranchId { get; set; }
        public string? Bio { get; set; }
        public string? BioAr { get; set; }
        public required string FullName { get; set; }
        public required string FullNameAr { get; set; }
        public int YearsOfExperience { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public int TotalReviews { get; set; } = 0;
        public decimal Rating { get; set; } = 5.0m;

        // Navigation properties
        public User User { get; set; } = null!;
        public Salon Salon { get; set; } = null!;
        public Branch? Branch { get; set; }
        public ICollection<StylistService> StylistServices { get; set; } = new List<StylistService>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public ICollection<StylistOffDay> OffDays { get; set; } = new List<StylistOffDay>();
    }
}