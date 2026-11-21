// ZAYNA.API/Controllers/AdminReviewController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ZAYNA.Infrastructure.Data;
using ZAYNA.Infrastructure.Services;

namespace ZAYNA.API.Controllers
{
    /// <summary>
    /// Review moderation (Admin only). Two actions, deliberately limited and logged:
    ///   * remove the comment text, keeping the star rating (the abuse is almost always in the text);
    ///   * delete the whole review (ratings are recalculated).
    /// There is no database audit table yet; every action is written to the application log with the admin's id.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/admin/reviews")]
    public class AdminReviewController : ControllerBase
    {
        private const int MaxPageSize = 50;

        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminReviewController> _logger;

        public AdminReviewController(ApplicationDbContext context, ILogger<AdminReviewController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetReviews(
            [FromQuery] Guid? salonId,
            [FromQuery] int? rating,
            [FromQuery] bool? hasComment,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

            var query = _context.Reviews.AsNoTracking().AsQueryable();
            if (salonId.HasValue) query = query.Where(r => r.SalonId == salonId.Value);
            if (rating is >= 1 and <= 5) query = query.Where(r => r.Rating == rating.Value);
            if (hasComment == true) query = query.Where(r => r.Comment != null && r.Comment != "");
            if (hasComment == false) query = query.Where(r => r.Comment == null || r.Comment == "");

            var total = await query.CountAsync();

            var reviews = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.Rating,
                    r.Comment,
                    r.CreatedAt,
                    r.SalonId,
                    salonName = r.Salon.SalonName,
                    customerName = r.Customer.FullName,
                    bookingNumber = r.Booking != null ? r.Booking.BookingNumber : null
                })
                .ToListAsync();

            return Ok(new { success = true, reviews, total, page, pageSize });
        }

        /// <summary>Removes the comment text only; the star rating stays. Safe to repeat.</summary>
        [HttpPost("{id:guid}/remove-comment")]
        public async Task<IActionResult> RemoveComment(Guid id)
        {
            var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == id);
            if (review == null)
                return NotFound(new { success = false, code = "REVIEW_NOT_FOUND", message = "Review not found." });

            if (!string.IsNullOrEmpty(review.Comment))
            {
                review.Comment = null;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Admin {AdminId} removed the comment of review {ReviewId}", AdminId(), id);
            }

            return Ok(new { success = true });
        }

        /// <summary>Deletes the review and recalculates the salon and stylist ratings.</summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteReview(Guid id)
        {
            var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == id);
            if (review == null)
                return NotFound(new { success = false, code = "REVIEW_NOT_FOUND", message = "Review not found." });

            var salonId = review.SalonId;
            var stylistId = review.StylistId;

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            await ReviewRatings.RecalculateSalonAsync(_context, salonId);
            await ReviewRatings.RecalculateStylistAsync(_context, stylistId);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Admin {AdminId} deleted review {ReviewId} of salon {SalonId}", AdminId(), id, salonId);
            return Ok(new { success = true });
        }

        private string AdminId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "unknown";
    }
}
