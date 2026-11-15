namespace ZAYNA.Infrastructure.Services
{
    /// <summary>
    /// How trustworthy is a reviewer? Pure rules, no database.
    ///
    /// Every review in ZAYNA is already a VERIFIED VISIT: a review can only be written for the customer's own completed
    /// booking. On top of that, the number of appointments a customer has actually completed (the same events that earn
    /// loyalty points) tells readers how experienced the reviewer is. It is shown as a badge only; it is deliberately NOT
    /// used to re-weight the star average, so the headline rating stays a simple, auditable number.
    /// </summary>
    public static class ReviewerCredibility
    {
        public const string Verified = "verified";   // 1-2 completed visits
        public const string Regular = "regular";     // 3-9
        public const string Trusted = "trusted";     // 10+

        public const int RegularFrom = 3;
        public const int TrustedFrom = 10;

        public static string TierFor(int completedVisits) =>
            completedVisits >= TrustedFrom ? Trusted :
            completedVisits >= RegularFrom ? Regular :
            Verified;

        /// <summary>
        /// Public display name: first name + initial of the last name ("Aisha Al Balushi" -> "Aisha B."),
        /// so full names of customers are not published next to their reviews.
        /// </summary>
        public static string MaskName(string? fullName)
        {
            var parts = (fullName ?? string.Empty).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0) return "Customer";
            if (parts.Length == 1) return parts[0];

            var last = parts[^1];
            var initial = char.IsSurrogate(last[0]) && last.Length > 1 ? last[..2] : last[..1];
            return parts[0] + " " + initial + ".";
        }
    }
}
