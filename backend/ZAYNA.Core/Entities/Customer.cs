namespace ZAYNA.Core.Entities
{
    public class Customer
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }

        // Infrastructure expects FullName on Customer in some places
        public string? FullName { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
