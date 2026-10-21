using ZAYNA.Core.Enums;

namespace ZAYNA.Core.Entities
{
    public class User
    {
        public Guid Id { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public string? PasswordHash { get; set; }
        public UserRole Role { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? FullNameAr { get; set; }
        public string? ProfileImageUrl { get; set; }
        public bool IsActive { get; set; } = true;

        // New properties used by the DbInitializer / Infrastructure
        public bool IsPhoneVerified { get; set; } = false;
        public bool IsEmailVerified { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Customer? Customer { get; set; }
        public Salon? Salon { get; set; }
        public Stylist? Stylist { get; set; }
        public ICollection<SocialAuthProvider> SocialAuthProviders { get; set; } = new List<SocialAuthProvider>();
    }
}
