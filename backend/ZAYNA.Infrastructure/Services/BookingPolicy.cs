namespace ZAYNA.Infrastructure.Services
{
    /// <summary>
    /// Booking rules, read once from configuration (section "Booking" / "Payments") with safe defaults.
    /// </summary>
    public class BookingPolicy
    {
        /// <summary>Earliest bookable start, in minutes from now (today only).</summary>
        public int MinLeadMinutes { get; }
        /// <summary>How many days ahead a booking may be made.</summary>
        public int MaxDaysAhead { get; }
        /// <summary>Customers may cancel only if the appointment is at least this many hours away.</summary>
        public int CancellationCutoffHours { get; }
        /// <summary>Start times are offered on this grid, in minutes.</summary>
        public int SlotIntervalMinutes { get; }
        /// <summary>true: new bookings are Confirmed immediately; false: they start as Pending for the salon to confirm.</summary>
        public bool AutoConfirm { get; }
        /// <summary>Online payment is off until a payment provider is configured and this is enabled.</summary>
        public bool OnlinePaymentEnabled { get; }

        public BookingPolicy(IConfiguration configuration)
        {
            MinLeadMinutes = Int(configuration["Booking:MinLeadMinutes"], 30, 0, 24 * 60);
            MaxDaysAhead = Int(configuration["Booking:MaxDaysAhead"], 60, 1, 365);
            CancellationCutoffHours = Int(configuration["Booking:CancellationCutoffHours"], 2, 0, 24 * 14);
            SlotIntervalMinutes = Int(configuration["Booking:SlotIntervalMinutes"], 30, 5, 240);
            AutoConfirm = Bool(configuration["Booking:AutoConfirm"], true);
            OnlinePaymentEnabled = Bool(configuration["Payments:OnlineEnabled"], false);
        }

        private static int Int(string? raw, int fallback, int min, int max)
            => int.TryParse(raw, out var v) ? Math.Clamp(v, min, max) : fallback;

        private static bool Bool(string? raw, bool fallback)
            => bool.TryParse(raw, out var v) ? v : fallback;
    }
}
