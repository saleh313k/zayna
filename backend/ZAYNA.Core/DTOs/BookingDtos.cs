// ============================================
// Zayna.Core/DTOs/BookingDtos.cs
// ============================================

using ZAYNA.Core.Enums;

namespace Zayna.Core.DTOs
{
    public class CreateBookingDto
    {
        public Guid SalonId { get; set; }
        public Guid BranchId { get; set; }
        public Guid StylistId { get; set; }
        public Guid ServiceId { get; set; }
        public DateTime BookingDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public string Notes { get; set; }
    }

    public class BookingDto
    {
        public Guid Id { get; set; }
        public DateTime BookingDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public BookingStatus Status { get; set; }
        public decimal TotalPrice { get; set; }
        public string SalonName { get; set; }
        public string BranchName { get; set; }
        public string StylistName { get; set; }
        public string ServiceName { get; set; }
        public PaymentDto Payment { get; set; }
    }

    // ---- API response shapes (camelCase JSON). Enums are sent as numbers. ----
    public class BookingResponseDto
    {
        public Guid Id { get; set; }
        public string? BookingNumber { get; set; }
        public int Status { get; set; }                 // BookingStatus
        public int PaymentType { get; set; }            // PaymentType: 0 online, 1 in person
        public decimal TotalAmount { get; set; }
        public string? Notes { get; set; }
        public string BookingDate { get; set; } = "";   // yyyy-MM-dd (salon local date)
        public string StartTime { get; set; } = "";     // HH:mm (salon local time)
        public string EndTime { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? CancellationReason { get; set; }
        public bool CanCancel { get; set; }
        public BookingSalonInfo Salon { get; set; } = new();
        public BookingBranchInfo Branch { get; set; } = new();
        public BookingStylistInfo Stylist { get; set; } = new();
        public BookingServiceInfo Service { get; set; } = new();
        public BookingCustomerInfo? Customer { get; set; } // only for salon/admin views
    }

    public class BookingSalonInfo { public Guid Id { get; set; } public string Name { get; set; } = ""; public string? NameAr { get; set; } public string? Phone { get; set; } }
    public class BookingBranchInfo { public Guid Id { get; set; } public string Name { get; set; } = ""; public string? NameAr { get; set; } public string? Address { get; set; } public string? City { get; set; } }
    public class BookingStylistInfo { public Guid Id { get; set; } public string Name { get; set; } = ""; public string? NameAr { get; set; } }
    public class BookingServiceInfo { public Guid Id { get; set; } public string Name { get; set; } = ""; public string? NameAr { get; set; } public int DurationMinutes { get; set; } public decimal Price { get; set; } }
    public class BookingCustomerInfo { public Guid Id { get; set; } public string Name { get; set; } = ""; public string? Phone { get; set; } public string? Email { get; set; } }

    public class AvailableSlotDto
    {
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public bool IsAvailable { get; set; }
    }
}