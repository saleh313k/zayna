// ZAYNA.API/Controllers/CustomerController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ZAYNA.Core.Enums;
using ZAYNA.Infrastructure.Data;

namespace Zayna.API.Controllers
{
    public record UpdateCustomerProfileRequest(string? FullName);

    /// <summary>The signed-in customer's own profile. Everything here is real data (nothing is mocked).</summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class CustomerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CustomerController(ApplicationDbContext context)
        {
            _context = context;
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

        private bool TryGetCurrentUserId(out Guid userId)
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(value, out userId);
        }
    }
}
