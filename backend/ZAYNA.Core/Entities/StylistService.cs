<<<<<<< HEAD
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
=======
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
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
}