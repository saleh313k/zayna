<<<<<<< HEAD
namespace ZAYNA.Core.Entities
{
    public class Branch
    {
        public Guid Id { get; set; }
        public Guid SalonId { get; set; }
        public Salon Salon { get; set; } = null!;

        public string? BranchName { get; set; }
        public string? BranchNameAr { get; set; }
        public string? AddressLine { get; set; }
        public string? PhoneNumber { get; set; }
        public string? PostalCode { get; set; }
        public string? City { get; set; }
        public string? Region { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }

        // If code sets UpdatedAt explicitly in initializer
        public DateTime? UpdatedAt { get; set; }

        public ICollection<Stylist> Stylists { get; set; } = new List<Stylist>();
        public ICollection<BranchWorkingHours> WorkingHours { get; set; } = new List<BranchWorkingHours>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
=======
namespace ZAYNA.Core.Entities
{
    public class Branch
    {
        public Guid Id { get; set; }
        public Guid SalonId { get; set; }
        public Salon Salon { get; set; } = null!;

        public string? BranchName { get; set; }
        public string? BranchNameAr { get; set; }
        public string? AddressLine { get; set; }
        public string? PhoneNumber { get; set; }
        public string? PostalCode { get; set; }
        public string? City { get; set; }
        public string? Region { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }

        // If code sets UpdatedAt explicitly in initializer
        public DateTime? UpdatedAt { get; set; }

        public ICollection<Stylist> Stylists { get; set; } = new List<Stylist>();
        public ICollection<BranchWorkingHours> WorkingHours { get; set; } = new List<BranchWorkingHours>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
