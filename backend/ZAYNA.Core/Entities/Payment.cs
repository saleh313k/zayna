using System.ComponentModel.DataAnnotations;
using ZAYNA.Core.Enums;
namespace ZAYNA.Core.Entities { 

public class Payment
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "OMR";
    public string? TransactionId { get; set; }
    public string? PaymentIntentId { get; set; }
    public string? PaymentResponse { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }
    public DateTime? RefundedAt { get; set; }

    // Navigation properties
    public Booking Booking { get; set; } = null!;
}



}