namespace Zayna.Core.Interfaces
{
    /// <summary>
    /// The current time in the salons' local time zone (configurable, default Asia/Muscat, UTC+4).
    /// Booking dates and times are stored as local (wall-clock) values, so every "is this in the past?"
    /// comparison must use this clock and never DateTime.UtcNow.
    /// </summary>
    public interface ISalonClock
    {
        DateTime LocalNow { get; }
    }
}
