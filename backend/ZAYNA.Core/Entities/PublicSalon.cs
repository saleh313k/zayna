namespace Core.Entities
{
    public class PublicSalon
    {
        public Guid Id { get; set; }

        public string? PlaceId { get; set; }

        public string? Name { get; set; }
        public string? Address { get; set; }

        public string? Phone { get; set; }
        public string? Website { get; set; }

        public double? Rating { get; set; }
        public double? Reviews { get; set; }
        public double? Lat { get; set; }
        public double? Lng { get; set; }
        public string? PhotoURL { get; set; }
        public string? OpeningHours { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}