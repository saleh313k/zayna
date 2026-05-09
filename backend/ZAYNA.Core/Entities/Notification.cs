using ZAYNA.Core.Enums;

namespace ZAYNA.Core.Entities
{
    public class Notification
    {
        public Guid Id { get; set; }
        public Guid? BookingId { get; set; }
        public Booking Booking { get; set; } = null!;
        public Guid? UserId { get; set; }

        public string? Title { get; set; }
        public string? TitleAr { get; set; }    // expected by Infrastructure
        public string? Message { get; set; }
        public string? MessageAr { get; set; }  // expected by Infrastructure

        public NotificationType Type { get; set; }

<<<<<<< HEAD
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; }
=======
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; }
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
    }
}
