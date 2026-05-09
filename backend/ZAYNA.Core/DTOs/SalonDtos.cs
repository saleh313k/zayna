// ============================================
// Zayna.Core/DTOs/SalonDtos.cs
// ============================================


namespace Zayna.Core.DTOs
{
    public class CreateSalonDto
    {
        public required string Name { get; set; }
        public required string NameAr { get; set; }
        public required string Description { get; set; }
        public required string DescriptionAr { get; set; }
        public required string PhoneNumber { get; set; }
        public required string Email { get; set; }
    }

    public class SalonDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public required string Name { get; set; }
        public required string NameAr { get; set; }
        public required string Description { get; set; }
        public required string DescriptionAr { get; set; }
        public required string LogoUrl { get; set; }
        public required string PhoneNumber { get; set; }
        public required string Email { get; set; }
        public bool IsActive { get; set; }
        public List<BranchDto>? Branches { get; set; }
    }

    public class BranchDto
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public required string NameAr { get; set; }
        public required string Address { get; set; }
        public required string AddressAr { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}