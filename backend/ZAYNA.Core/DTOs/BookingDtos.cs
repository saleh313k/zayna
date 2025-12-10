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

    public class AvailableSlotDto
    {
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public bool IsAvailable { get; set; }
    }
}