namespace ZAYNA.Core.Entities
{
    public class Branch
    {
        public Guid Id { get; set; }
        public Guid SalonId { get; set; }

        public string? BranchName { get; set; }
        public string? BranchNameAr { get; set; }
        public string? AddressLine { get; set; }
        public string? City { get; set; }
        public string? Region { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        // If code sets UpdatedAt explicitly in initializer
        public DateTime? UpdatedAt { get; set; }

        public ICollection<Stylist> Stylists { get; set; } = new List<Stylist>();
    }
}
