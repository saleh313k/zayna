<<<<<<< HEAD
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
        public required string Currency { get; set; }
        public DateTime? PaidAt { get; set; }
    }

    public class PaymentResponseDto
    {
        public bool Success { get; set; }
        public required string TransactionId { get; set; }
        public required string ClientSecret { get; set; }
        public required string Message { get; set; }
    }
}
=======
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
        public required string Currency { get; set; }
        public DateTime? PaidAt { get; set; }
    }

    public class PaymentResponseDto
    {
        public bool Success { get; set; }
        public required string TransactionId { get; set; }
        public required string ClientSecret { get; set; }
        public required string Message { get; set; }
    }
}
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
