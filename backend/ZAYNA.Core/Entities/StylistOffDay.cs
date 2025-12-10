namespace ZAYNA.Core.Entities
{

    public class StylistOffDay
    {
        public Guid Id { get; set; }
        public Guid StylistId { get; set; }
        public DateTime Date { get; set; }
        public string? Reason { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Stylist Stylist { get; set; } = null!;
    }
}