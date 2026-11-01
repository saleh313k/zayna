using Zayna.Core.Interfaces;

namespace ZAYNA.Infrastructure.Services
{
    public class SalonClock : ISalonClock
    {
        private readonly TimeZoneInfo _zone;

        public SalonClock(IConfiguration configuration)
        {
            var id = configuration["Booking:TimeZone"];
            if (string.IsNullOrWhiteSpace(id)) id = "Asia/Muscat";
            _zone = Resolve(id);
        }

        public DateTime LocalNow => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _zone);

        private static TimeZoneInfo Resolve(string id)
        {
            // IANA ids work on Linux/macOS and on Windows with ICU; Windows ids are the fallback.
            foreach (var candidate in new[] { id, "Asia/Muscat", "Arabian Standard Time" })
            {
                try { return TimeZoneInfo.FindSystemTimeZoneById(candidate); }
                catch (TimeZoneNotFoundException) { }
                catch (InvalidTimeZoneException) { }
            }
            // Oman has no daylight saving: a fixed UTC+4 zone is a correct last resort.
            return TimeZoneInfo.CreateCustomTimeZone("Oman", TimeSpan.FromHours(4), "Oman", "Oman");
        }
    }
}
