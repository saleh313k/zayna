<<<<<<< HEAD
// ============================================
// Zayna.Core/DTOs/StylistDtos.cs
// ============================================

namespace Zayna.Core.DTOs
{
    public class CreateStylistDto
    {
        public required string PhoneNumber { get; set; }
        public required string FullName { get; set; }
        public required string FullNameAr { get; set; }
        public required string Email { get; set; }
        public Guid? BranchId { get; set; }
        public required string Bio { get; set; }
        public required string BioAr { get; set; }
        public required int YearsOfExperience { get; set; }
        public required List<Guid> ServiceIds { get; set; }
    }

    public class StylistDto
    {
        public Guid Id { get; set; }
        public required string FullName { get; set; }
        public required string FullNameAr { get; set; }
        public required string Bio { get; set; }
        public required string AvatarUrl { get; set; }
        public required int YearsOfExperience { get; set; }
        public required List<ServiceDto> Services { get; set; }
    }
=======
// ============================================
// Zayna.Core/DTOs/StylistDtos.cs
// ============================================

namespace Zayna.Core.DTOs
{
    public class CreateStylistDto
    {
        public required string PhoneNumber { get; set; }
        public required string FullName { get; set; }
        public required string FullNameAr { get; set; }
        public required string Email { get; set; }
        public Guid? BranchId { get; set; }
        public required string Bio { get; set; }
        public required string BioAr { get; set; }
        public required int YearsOfExperience { get; set; }
        public required List<Guid> ServiceIds { get; set; }
    }

    public class StylistDto
    {
        public Guid Id { get; set; }
        public required string FullName { get; set; }
        public required string FullNameAr { get; set; }
        public required string Bio { get; set; }
        public required string AvatarUrl { get; set; }
        public required int YearsOfExperience { get; set; }
        public required List<ServiceDto> Services { get; set; }
    }
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
}