namespace ZAYNA.Core.Entities
{
    public class Service
    {
        public Guid Id { get; set; }
        public Guid SalonId { get; set; }
        public Salon Salon { get; set; } = null!;

        // Properties expected by Infrastructure
        public string? ServiceName { get; set; }
        public string? ServiceNameAr { get; set; }
        public string? Category { get; set; }
<<<<<<< HEAD
        public string? Description { get; set; }
        public string? DescriptionAr { get; set; }
        public int DurationMinutes { get; set; }
        public bool IsActive { get; set; }
=======
        public string? Description { get; set; }
        public string? DescriptionAr { get; set; }
        public int DurationMinutes { get; set; }
        public bool IsActive { get; set; }
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7

        // Price as decimal (money) — Infrastructure had decimal/double mismatches; decimal is preferred.
        public decimal Price { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<StylistService> StylistServices { get; set; } = new List<StylistService>();
<<<<<<< HEAD
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
=======
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
    }
}
