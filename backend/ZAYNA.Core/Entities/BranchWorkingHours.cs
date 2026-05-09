namespace ZAYNA.Core.Entities
{


    public class BranchWorkingHours
    {
        public Guid Id { get; set; }
        public Guid BranchId { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan OpenTime { get; set; }
        public TimeSpan CloseTime { get; set; }
        public bool IsClosed { get; set; } = false;

        // Navigation properties
        public Branch Branch { get; set; } = null!;
    }
}