// ============================================
// Zayna.Core/DTOs/SalonDtos.cs
// ============================================


namespace Zayna.Core.DTOs
{
    public class CreateSalonDto
    {
        public string Name { get; set; }
        public string NameAr { get; set; }
        public string Description { get; set; }
        public string DescriptionAr { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
    }

    public class SalonDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string NameAr { get; set; }
        public string Description { get; set; }
        public string DescriptionAr { get; set; }
        public string LogoUrl { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public bool IsActive { get; set; }
        public List<BranchDto> Branches { get; set; }
    }

    public class BranchDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string NameAr { get; set; }
        public string Address { get; set; }
        public string AddressAr { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}