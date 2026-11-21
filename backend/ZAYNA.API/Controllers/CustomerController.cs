// ZAYNA.API/Controllers/CustomerController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using Zayna.Core.Interfaces;
using ZAYNA.Core.Enums;
using ZAYNA.Infrastructure.Data;
using ZAYNA.Infrastructure.Services;

namespace Zayna.API.Controllers
{
    public record UpdateCustomerProfileRequest(string? FullName);

    /// <summary>Password accounts must send CurrentPassword; Google-only accounts (no password) must type their email.</summary>
    public record DeleteAccountRequest(string? CurrentPassword, string? ConfirmEmail);

    /// <summary>The signed-in customer's own profile. Everything here is real data (nothing is mocked).</summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class CustomerController : ControllerBase
    {
        private static readonly JsonSerializerOptions ExportJson = new()
        {
            WriteIndented = true,
            Converters = { new JsonStringEnumConverter() }
        };

        private readonly ApplicationDbContext _context;
        private readonly ISalonClock _clock;
        private readonly ILogger<CustomerController> _logger;

        public CustomerController(ApplicationDbContext context, ISalonClock clock, ILogger<CustomerController> logger)
        {
            _context = context;
            _clock = clock;
            _logger = logger;
        }

        /// <summary>Profile plus real stats: loyalty balance, booking counts, favourite salon.</summary>
        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return Unauthorized();

            var customer = await _context.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.UserId == userId);

            var totalBookings = 0;
            var completedBookings = 0;
            string? favoriteSalon = null;

            if (customer != null)
            {
                var mine = _context.Bookings.AsNoTracking()
                    .Where(b => b.CustomerId == customer.Id && b.Status != BookingStatus.Cancelled);

                totalBookings = await mine.CountAsync();
                completedBookings = await mine.CountAsync(b => b.Status == BookingStatus.Completed);

                // Most-booked salon (ties: whichever the database returns first). Two simple queries translate reliably.
                var topSalonId = await mine
                    .GroupBy(b => b.SalonId)
                    .OrderByDescending(g => g.Count())
                    .Select(g => (Guid?)g.Key)
                    .FirstOrDefaultAsync();

                if (topSalonId != null)
                {
                    favoriteSalon = await _context.Salons.AsNoTracking()
                        .Where(s => s.Id == topSalonId)
                        .Select(s => s.SalonName)
                        .FirstOrDefaultAsync();
                }
            }

            return Ok(new
            {
                success = true,
                profile = new
                {
                    fullName = user.FullName,
                    email = user.Email,
                    phoneNumber = user.PhoneNumber,
                    memberSince = user.CreatedAt,
                    hasPassword = !string.IsNullOrEmpty(user.PasswordHash),
                    loyaltyPoints = customer?.LoyaltyPointsBalance ?? 0,
                    totalBookings,
                    completedBookings,
                    favoriteSalon
                }
            });
        }

        /// <summary>
        /// Updates the display name only. Email and phone are sign-in identifiers: changing them needs verification,
        /// which does not exist yet, so they are intentionally not editable here.
        /// </summary>
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateCustomerProfileRequest request)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var name = (request?.FullName ?? string.Empty).Trim();
            if (name.Length < 2 || name.Length > 100)
                return BadRequest(new { success = false, code = "INVALID_NAME", message = "Name must be between 2 and 100 characters." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return Unauthorized();

            user.FullName = name;
            user.UpdatedAt = DateTime.UtcNow;

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer != null) customer.FullName = name;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, fullName = name });
        }

        /// <summary>Everything we hold about the signed-in customer, as a downloadable JSON file.</summary>
        [HttpGet("me/export")]
        public async Task<IActionResult> ExportMyData()
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return Unauthorized();

            var customer = await _context.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.UserId == userId);
            var customerId = customer?.Id ?? Guid.Empty;

            var bookings = await _context.Bookings.AsNoTracking()
                .Where(b => b.CustomerId == customerId)
                .OrderByDescending(b => b.BookingDate)
                .Select(b => new
                {
                    b.BookingNumber,
                    salon = b.Salon.SalonName,
                    service = b.Service.ServiceName,
                    stylist = b.Stylist.FullName,
                    date = b.BookingDate,
                    startTime = b.StartTime,
                    status = b.Status,
                    totalPriceOMR = b.TotalPrice,
                    b.Notes,
                    b.CancellationReason,
                    b.CreatedAt
                })
                .ToListAsync();

            var reviews = await _context.Reviews.AsNoTracking()
                .Where(r => r.CustomerId == customerId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new { salon = r.Salon.SalonName, r.Rating, r.Comment, r.CreatedAt })
                .ToListAsync();

            var loyalty = await _context.LoyaltyPointsHistory.AsNoTracking()
                .Where(h => h.CustomerId == customerId)
                .OrderByDescending(h => h.CreatedAt)
                .Select(h => new { h.Points, h.TransactionType, h.Description, h.CreatedAt })
                .ToListAsync();

            var notifications = await _context.Notifications.AsNoTracking()
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new { n.Title, n.Message, n.Type, n.IsRead, n.CreatedAt })
                .ToListAsync();

            var export = new
            {
                exportedAt = DateTime.UtcNow,
                account = new
                {
                    user.FullName,
                    user.Email,
                    user.PhoneNumber,
                    memberSince = user.CreatedAt,
                    signsInWithPassword = !string.IsNullOrEmpty(user.PasswordHash)
                },
                loyaltyPointsBalance = customer?.LoyaltyPointsBalance ?? 0,
                bookings,
                reviews,
                loyaltyHistory = loyalty,
                notifications
            };

            var bytes = JsonSerializer.SerializeToUtf8Bytes(export, ExportJson);
            return File(bytes, "application/json", "zayna-my-data.json");
        }

        /// <summary>
        /// Deletes (anonymises) the signed-in customer's account. Requires the password, or the typed email for
        /// Google-only accounts, and refuses while there are upcoming bookings. See <see cref="AccountDeletion"/>.
        /// </summary>
        [EnableRateLimiting("auth")]
        [HttpPost("me/delete")]
        public async Task<IActionResult> DeleteMe([FromBody] DeleteAccountRequest request)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || !user.IsActive)
                return Unauthorized();

            if (!string.IsNullOrEmpty(user.PasswordHash))
            {
                if (!AccountDeletion.VerifyPassword(request?.CurrentPassword ?? string.Empty, user.PasswordHash))
                    return BadRequest(new { success = false, code = "INVALID_CREDENTIALS", message = "Your password is incorrect." });
            }
            else
            {
                var typed = (request?.ConfirmEmail ?? string.Empty).Trim();
                if (string.IsNullOrEmpty(user.Email) || !string.Equals(typed, user.Email, StringComparison.OrdinalIgnoreCase))
                    return BadRequest(new { success = false, code = "CONFIRMATION_MISMATCH", message = "Type your account email address to confirm." });
            }

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer != null && await _context.Bookings.AnyAsync(ActiveBookingRule.For(customer.Id, _clock.LocalNow.Date)))
                return Conflict(new { success = false, code = "ACTIVE_BOOKINGS", message = "You have upcoming bookings. Cancel them first, then delete your account." });

            await AccountDeletion.AnonymizeCustomerAsync(_context, user, customer);
            _logger.LogInformation("Customer account {UserId} was deleted (anonymised) at the owner's request", userId);

            return Ok(new { success = true, message = "Your account has been deleted." });
        }

        private bool TryGetCurrentUserId(out Guid userId)
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(value, out userId);
        }
    }
}
