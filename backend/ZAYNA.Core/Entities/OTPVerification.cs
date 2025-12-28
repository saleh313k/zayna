using ZAYNA.Core.Enums;

namespace ZAYNA.Core.Entities
    {

public class OTPVerification
{
    public Guid Id { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public OTPPurpose Purpose { get; set; }
    public bool IsUsed { get; set; } = false;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int AttemptCount { get; set; }
    }


}