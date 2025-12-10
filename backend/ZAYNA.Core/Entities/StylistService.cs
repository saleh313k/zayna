namespace ZAYNA.Core.Entities
{

    public class StylistService
    {
        public Guid StylistId { get; set; }
        public Guid ServiceId { get; set; }

        // Navigation properties
        public Stylist Stylist { get; set; } = null!;
        public Service Service { get; set; } = null!;
    }
}