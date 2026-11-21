using ZAYNA.Infrastructure.Data;

namespace ZAYNA.Infrastructure.Services
{
    /// <summary>
    /// "Delete my account" for customers. The account is ANONYMISED rather than removed, because bookings and review
    /// ratings are also part of the salons' records and the salon statistics:
    ///   removed:   email, phone, password hash, Google link, profile picture, notifications, loyalty history, OTP records,
    ///              booking notes, the text of the customer's reviews, the customer's name;
    ///   kept:      the booking rows (without notes or name) and the star ratings (anonymous, shown as "Customer").
    /// The user row stays but is disabled with no sign-in identifiers, so the same email/Google account can register again.
    /// </summary>
    public static class AccountDeletion
    {
        public const string DeletedDisplayName = "Deleted user";

        public static bool VerifyPassword(string password, string passwordHash) =>
            !string.IsNullOrEmpty(password) && password.Length <= 128 &&
            BCrypt.Net.BCrypt.EnhancedVerify(password, passwordHash);

        public static async Task AnonymizeCustomerAsync(ApplicationDbContext context, User user, Customer? customer)
        {
            var phone = user.PhoneNumber;

            await using var transaction = await context.Database.BeginTransactionAsync();

            context.Notifications.RemoveRange(await context.Notifications.Where(n => n.UserId == user.Id).ToListAsync());
            context.SocialAuthProviders.RemoveRange(await context.SocialAuthProviders.Where(p => p.UserId == user.Id).ToListAsync());
            if (!string.IsNullOrWhiteSpace(phone))
            {
                context.OTPVerifications.RemoveRange(await context.OTPVerifications.Where(o => o.PhoneNumber == phone).ToListAsync());
            }

            if (customer != null)
            {
                context.LoyaltyPointsHistory.RemoveRange(
                    await context.LoyaltyPointsHistory.Where(h => h.CustomerId == customer.Id).ToListAsync());
                customer.LoyaltyPointsBalance = 0;
                customer.FullName = string.Empty;

                foreach (var booking in await context.Bookings.Where(b => b.CustomerId == customer.Id && b.Notes != null).ToListAsync())
                    booking.Notes = null;

                foreach (var review in await context.Reviews.Where(r => r.CustomerId == customer.Id && r.Comment != null).ToListAsync())
                    review.Comment = null;
            }

            user.FullName = DeletedDisplayName;
            user.FullNameAr = null;
            user.Email = null;
            user.PhoneNumber = null;
            user.PasswordHash = null;
            user.ProfileImageUrl = null;
            user.IsEmailVerified = false;
            user.IsPhoneVerified = false;
            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
    }
}
