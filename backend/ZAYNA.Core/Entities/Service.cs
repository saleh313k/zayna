namespace ZAYNA.Core.Entities
{
    public class Service
    {
        public Guid Id { get; set; }
        public Guid SalonId { get; set; }

        // Properties expected by Infrastructure
        public string? ServiceName { get; set; }
        public string? ServiceNameAr { get; set; }
        public string? Category { get; set; }

        // Price as decimal (money) — Infrastructure had decimal/double mismatches; decimal is preferred.
        public decimal Price { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
