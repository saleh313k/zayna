<<<<<<< HEAD
namespace ZAYNA.Core.Entities
{

    public class Review
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public Guid SalonId { get; set; }
        public Guid? StylistId { get; set; }
        public Guid? BookingId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Customer Customer { get; set; } = null!;
        public Salon Salon { get; set; } = null!;
        public Booking? Booking { get; set; }

    }

=======
namespace ZAYNA.Core.Entities
{

    public class Review
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public Guid SalonId { get; set; }
        public Guid? StylistId { get; set; }
        public Guid? BookingId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Customer Customer { get; set; } = null!;
        public Salon Salon { get; set; } = null!;
        public Booking? Booking { get; set; }

    }

>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
}