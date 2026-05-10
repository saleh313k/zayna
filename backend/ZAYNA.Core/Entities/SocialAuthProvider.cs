<<<<<<< HEAD
using ZAYNA.Core.Enums;


namespace ZAYNA.Core.Entities
{

    public class SocialAuthProvider
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public SocialProvider Provider { get; set; }
        public string ProviderUserId { get; set; } = string.Empty;
        public string? Email { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User User { get; set; } = null!;
    }


=======
using ZAYNA.Core.Enums;


namespace ZAYNA.Core.Entities
{

    public class SocialAuthProvider
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public SocialProvider Provider { get; set; }
        public string ProviderUserId { get; set; } = string.Empty;
        public string? Email { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User User { get; set; } = null!;
    }


>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
}