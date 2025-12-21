namespace ZAYNA.Core.Entities
{
    public class StylistOffDay
    {
        public Guid Id { get; set; }
        public Guid StylistId { get; set; }

        // Infrastructure references OffDate
        public DateTime OffDate { get; set; }

        public string? Reason { get; set; }
    }
}
