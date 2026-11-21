using ZAYNA.Infrastructure.Data;

namespace ZAYNA.Infrastructure.Services
{
    /// <summary>
    /// Recomputes the stored salon / stylist rating from the reviews in the database (aggregates are computed by SQL,
    /// no review is loaded into memory). Call AFTER the change to the reviews has been saved, then SaveChanges again.
    /// Shared by adding a review and by admin moderation, so both always produce the same numbers.
    /// </summary>
    public static class ReviewRatings
    {
        // A stylist with no reviews keeps the database default (5.0); the UI shows a rating only when TotalReviews > 0.
        public const decimal DefaultStylistRating = 5.0m;

        public static async Task RecalculateSalonAsync(ApplicationDbContext context, Guid salonId)
        {
            var salon = await context.Salons.FindAsync(salonId);
            if (salon == null) return;

            var reviews = context.Reviews.Where(r => r.SalonId == salonId);
            var count = await reviews.CountAsync();
            salon.TotalReviews = count;
            salon.Rating = count == 0 ? 0m : Math.Round((decimal)await reviews.AverageAsync(r => (double)r.Rating), 2);
            salon.UpdatedAt = DateTime.UtcNow;
        }

        public static async Task RecalculateStylistAsync(ApplicationDbContext context, Guid? stylistId)
        {
            if (stylistId == null) return;
            var stylist = await context.Stylists.FindAsync(stylistId.Value);
            if (stylist == null) return;

            var reviews = context.Reviews.Where(r => r.StylistId == stylistId);
            var count = await reviews.CountAsync();
            stylist.TotalReviews = count;
            stylist.Rating = count == 0 ? DefaultStylistRating : Math.Round((decimal)await reviews.AverageAsync(r => (double)r.Rating), 2);
            stylist.UpdatedAt = DateTime.UtcNow;
        }
    }
}
