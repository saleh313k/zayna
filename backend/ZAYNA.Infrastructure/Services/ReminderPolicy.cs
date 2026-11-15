namespace ZAYNA.Infrastructure.Services
{
    /// <summary>
    /// When should a reminder be sent? Pure function (no clock, no database) so it is easy to test.
    /// All three times must be in the SAME time zone (the salon's local time).
    /// </summary>
    public static class ReminderPolicy
    {
        public static bool IsDue(DateTime nowLocal, DateTime startLocal, DateTime createdLocal, TimeSpan lead)
        {
            // Already started / in the past.
            if (startLocal <= nowLocal) return false;

            // Not inside the reminder window yet.
            if (startLocal - nowLocal > lead) return false;

            // Booked less than `lead` before the start: the customer was just told the time, so a reminder is noise.
            return startLocal - createdLocal > lead;
        }
    }
}
