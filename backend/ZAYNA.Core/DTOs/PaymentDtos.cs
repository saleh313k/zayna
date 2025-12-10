// ============================================
// Zayna.Core/DTOs/PaymentDtos.cs
// ============================================
using ZAYNA.Core.Enums;

namespace Zayna.Core.DTOs
{
    public class PaymentDto
    {
        public Guid Id { get; set; }
        public PaymentMethod Method { get; set; }
        public PaymentStatus Status { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public DateTime? PaidAt { get; set; }
    }

    public class PaymentResponseDto
    {
        public bool Success { get; set; }
        public string TransactionId { get; set; }
        public string ClientSecret { get; set; }
        public string Message { get; set; }
    }
}
