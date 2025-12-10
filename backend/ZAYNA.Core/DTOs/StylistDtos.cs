// ============================================
// Zayna.Core/DTOs/StylistDtos.cs
// ============================================

namespace Zayna.Core.DTOs
{
    public class CreateStylistDto
    {
        public string PhoneNumber { get; set; }
        public string FullName { get; set; }
        public string FullNameAr { get; set; }
        public string Email { get; set; }
        public Guid? BranchId { get; set; }
        public string Bio { get; set; }
        public string BioAr { get; set; }
        public int YearsOfExperience { get; set; }
        public List<Guid> ServiceIds { get; set; }
    }

    public class StylistDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public string FullNameAr { get; set; }
        public string Bio { get; set; }
        public string AvatarUrl { get; set; }
        public int YearsOfExperience { get; set; }
        public List<ServiceDto> Services { get; set; }
    }
}