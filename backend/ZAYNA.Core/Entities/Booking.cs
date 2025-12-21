using ZAYNA.Core.Enums;

namespace ZAYNA.Core.Entities
{
    public class Booking
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public Guid SalonId { get; set; }
        public Guid BranchId { get; set; }
        public Guid StylistId { get; set; }
        public Guid ServiceId { get; set; }
        public DateTime BookingDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public BookingStatus Status { get; set; } = BookingStatus.Pending;

        // Infrastructure expects TotalAmount and BookingNumber.
        // Keep existing TotalPrice for backward compatibility and sync with TotalAmount.
        public decimal TotalPrice { get; set; }

        // New property expected by Infrastructure
        public decimal TotalAmount
        {
            get => TotalPrice;
            set => TotalPrice = value;
        }

        // New property expected by Infrastructure
        public string? BookingNumber { get; set; }

        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? CancellationReason { get; set; }

        // Navigation properties
        public Customer Customer { get; set; } = null!;
        public Salon Salon { get; set; } = null!;
        public Branch Branch { get; set; } = null!;
        public Stylist Stylist { get; set; } = null!;
        public Service Service { get; set; } = null!;
        public Payment? Payment { get; set; }
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}
