// ZAYNA.API/Controllers/ReviewController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ZAYNA.Core.Entities;
using ZAYNA.Core.Enums;
using ZAYNA.Infrastructure.Data;
using ZAYNA.Infrastructure.Services;

namespace ZAYNA.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private const int MaxCommentLength = 1000;
        private const int MaxPageSize = 50;

        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReviewController> _logger;

        public ReviewController(ApplicationDbContext context, ILogger<ReviewController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Row read from the database; shaped into the public response by Shape().
        private sealed record ReviewRow(
            Guid Id, int Rating, string? Comment, DateTime CreatedAt,
            string? CustomerName, int ReviewerVisits, bool VerifiedVisit);

        private static object Shape(ReviewRow r) => new
        {
            r.Id,
            r.Rating,
            r.Comment,
            r.CreatedAt,
            customerName = ReviewerCredibility.MaskName(r.CustomerName),
            verifiedVisit = r.VerifiedVisit,
            reviewerVisits = r.ReviewerVisits,
            reviewerTier = ReviewerCredibility.TierFor(r.ReviewerVisits)
        };

        /// <summary>
        /// Add a review for one of the signed-in customer's COMPLETED bookings (one review per booking).
        /// </summary>
        [Authorize(Roles = "Customer")]
        [HttpPost]
        public async Task<IActionResult> AddReview([FromBody] AddReviewRequest request)
        {
            // A missing/garbled id claim must be a 401, never an unhandled exception (500).
            if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var userId))
                return Unauthorized();

            if (request == null)
                return BadRequest(new { success = false, code = "INVALID_REQUEST", message = "Review is required." });

            if (request.Rating < 1 || request.Rating > 5)
                return BadRequest(new { success = false, code = "INVALID_RATING", message = "Rating must be between 1 and 5." });

            var comment = (request.Comment ?? string.Empty).Trim();
            if (comment.Length > MaxCommentLength)
                return BadRequest(new { success = false, code = "INVALID_COMMENT", message = $"Comment must be at most {MaxCommentLength} characters." });

            var customer = await _context.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null)
                return NotFound(new { success = false, message = "Customer not found" });

            // Verify the booking exists, is the customer's own, and is completed.
            var booking = await _context.Bookings.AsNoTracking()
                .FirstOrDefaultAsync(b =>
                    b.Id == request.BookingId &&
                    b.CustomerId == customer.Id &&
                    b.Status == BookingStatus.Completed);

            if (booking == null)
                return BadRequest(new { success = false, code = "BOOKING_NOT_REVIEWABLE", message = "Invalid booking or booking not completed" });

            if (await _context.Reviews.AnyAsync(r => r.BookingId == request.BookingId))
                return Conflict(new { success = false, code = "REVIEW_EXISTS", message = "Review already submitted for this booking" });

            var review = new Review
            {
                BookingId = request.BookingId,
                CustomerId = customer.Id,
                SalonId = booking.SalonId,
                StylistId = booking.StylistId,
                Rating = request.Rating,
                Comment = comment.Length == 0 ? null : comment
            };
            _context.Reviews.Add(review);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                // Two simultaneous submissions: the unique index on Reviews.BookingId rejects the second one.
                _logger.LogWarning(ex, "Duplicate review rejected for booking {BookingId}", request.BookingId);
                return Conflict(new { success = false, code = "REVIEW_EXISTS", message = "Review already submitted for this booking" });
            }

            // Ratings are recomputed AFTER the review is saved, so the new review is included. (The previous code
            // recalculated before saving and was therefore always one review behind.)
            await ReviewRatings.RecalculateSalonAsync(_context, booking.SalonId);
            await ReviewRatings.RecalculateStylistAsync(_context, booking.StylistId);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Review submitted successfully",
                review = new { review.Id, review.Rating, review.Comment, review.CreatedAt }
            });
        }

        /// <summary>
        /// Whether the signed-in customer has already reviewed one of their bookings (used to show "Leave a review").
        /// </summary>
        [Authorize(Roles = "Customer")]
        [HttpGet("booking/{bookingId:guid}")]
        public async Task<IActionResult> GetMyReviewForBooking(Guid bookingId)
        {
            if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var userId))
                return Unauthorized();

            var review = await _context.Reviews.AsNoTracking()
                .Where(r => r.BookingId == bookingId && r.Customer.UserId == userId)
                .Select(r => new { r.Id, r.Rating, r.Comment, r.CreatedAt })
                .FirstOrDefaultAsync();

            return Ok(new { success = true, reviewed = review != null, review });
        }

        /// <summary>Reviews of a salon (public). Page size is capped; names are shortened for privacy.</summary>
        [AllowAnonymous]
        [HttpGet("salon/{salonId:guid}")]
        public async Task<IActionResult> GetSalonReviews(Guid salonId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

            var all = _context.Reviews.AsNoTracking().Where(r => r.SalonId == salonId);

            var total = await all.CountAsync();
            var avgRating = total == 0 ? 0 : await all.AverageAsync(r => (double)r.Rating);

            var perStar = await all.GroupBy(r => r.Rating)
                .Select(g => new { Rating = g.Key, Count = g.Count() })
                .ToListAsync();
            var distribution = Enumerable.Range(1, 5)
                .Select(star => new { rating = star, count = perStar.FirstOrDefault(x => x.Rating == star)?.Count ?? 0 })
                .ToList();

            var rows = await all
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new ReviewRow(
                    r.Id, r.Rating, r.Comment, r.CreatedAt,
                    r.Customer.FullName,
                    _context.Bookings.Count(b => b.CustomerId == r.CustomerId && b.Status == BookingStatus.Completed),
                    r.BookingId != null))
                .ToListAsync();

            return Ok(new
            {
                success = true,
                reviews = rows.Select(Shape).ToList(),
                avgRating = Math.Round(avgRating, 1),
                totalReviews = total,
                distribution,
                pagination = new
                {
                    page,
                    pageSize,
                    total,
                    totalPages = (int)Math.Ceiling(total / (double)pageSize)
                }
            });
        }

        /// <summary>Latest reviews of a stylist (public).</summary>
        [AllowAnonymous]
        [HttpGet("stylist/{stylistId:guid}")]
        public async Task<IActionResult> GetStylistReviews(Guid stylistId)
        {
            var all = _context.Reviews.AsNoTracking().Where(r => r.StylistId == stylistId);

            var total = await all.CountAsync();
            var avgRating = total == 0 ? 0 : await all.AverageAsync(r => (double)r.Rating);

            var rows = await all
                .OrderByDescending(r => r.CreatedAt)
                .Take(20)
                .Select(r => new ReviewRow(
                    r.Id, r.Rating, r.Comment, r.CreatedAt,
                    r.Customer.FullName,
                    _context.Bookings.Count(b => b.CustomerId == r.CustomerId && b.Status == BookingStatus.Completed),
                    r.BookingId != null))
                .ToListAsync();

            return Ok(new
            {
                success = true,
                reviews = rows.Select(Shape).ToList(),
                avgRating = Math.Round(avgRating, 1),
                totalReviews = total
            });
        }
    }

    public record AddReviewRequest(Guid BookingId, int Rating, string? Comment);
}
