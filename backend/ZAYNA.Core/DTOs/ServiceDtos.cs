// ============================================
// Zayna.Core/DTOs/ServiceDtos.cs
// ============================================

namespace Zayna.Core.DTOs
{
    public class CreateServiceDto
    {
        public string Name { get; set; }
        public string NameAr { get; set; }
        public string Description { get; set; }
        public string DescriptionAr { get; set; }
        public decimal Price { get; set; }
        public int DurationMinutes { get; set; }
        public string Category { get; set; }
        public string CategoryAr { get; set; }
    }

    public class ServiceDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string NameAr { get; set; }
        public string Description { get; set; }
        public string DescriptionAr { get; set; }
        public decimal Price { get; set; }
        public int DurationMinutes { get; set; }
        public string Category { get; set; }
        public string ImageUrl { get; set; }
    }
}