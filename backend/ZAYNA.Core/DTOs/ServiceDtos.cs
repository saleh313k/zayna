// ============================================
// Zayna.Core/DTOs/ServiceDtos.cs
// ============================================

namespace Zayna.Core.DTOs
{
    public class CreateServiceDto
    {
        public required string Name { get; set; }
        public required string NameAr { get; set; }
        public required string Description { get; set; }
        public required string DescriptionAr { get; set; }
        public decimal Price { get; set; }
        public int DurationMinutes { get; set; }
        public required string Category { get; set; }
        public required string CategoryAr { get; set; }
    }

    public class ServiceDto
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public required string NameAr { get; set; }
        public required string Description { get; set; }
        public required string DescriptionAr { get; set; }
        public required decimal Price { get; set; }
        public required int DurationMinutes { get; set; }
        public required string Category { get; set; }
        public required string ImageUrl { get; set; }
    }
}