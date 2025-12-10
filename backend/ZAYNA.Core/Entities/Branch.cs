namespace ZAYNA.Core.Entities
{

    public class Branch
    {
        public Guid Id { get; set; }
        public Guid SalonId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? NameAr { get; set; }
        public string Address { get; set; } = string.Empty;
        public string? AddressAr { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? PhoneNumber { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Salon Salon { get; set; } = null!;
        public ICollection<BranchWorkingHours> WorkingHours { get; set; } = new List<BranchWorkingHours>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}