namespace ZAYNA.Core.Entities
{

    public class Service
    {
        public Guid Id { get; set; }
        public Guid SalonId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? NameAr { get; set; }
        public string? Description { get; set; }
        public string? DescriptionAr { get; set; }
        public decimal Price { get; set; }
        public int DurationMinutes { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Salon Salon { get; set; } = null!;
        public ICollection<StylistService> StylistServices { get; set; } = new List<StylistService>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
