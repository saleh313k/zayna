
// ZAYNA.API/Controllers/ReviewController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ZAYNA.Core.Entities;
using ZAYNA.Infrastructure.Data;

namespace ZAYNA.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReviewController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Add a review for a completed booking
        /// </summary>
        [Authorize(Roles = "Customer")]
        [HttpPost]
        public async Task<IActionResult> AddReview([FromBody] AddReviewRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);

            if (customer == null)
                return NotFound(new { success = false, message = "Customer not found" });

            // Verify booking exists and is completed
            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => 
                    b.Id == request.BookingId && 
                    b.CustomerId == customer.Id && 
                    b.Status == BookingStatus.Completed);

            if (booking == null)
                return BadRequest(new { success = false, message = "Invalid booking or booking not completed" });

            // Check if review already exists
            var existingReview = await _context.Reviews.FirstOrDefaultAsync(r => r.BookingId == request.BookingId);
            if (existingReview != null)
                return BadRequest(new { success = false, message = "Review already submitted for this booking" });

            var review = new Review
            {
                BookingId = request.BookingId,
                CustomerId = customer.Id,
                SalonId = booking.SalonId,
                StylistId = booking.StylistId,
                Rating = request.Rating,
                Comment = request.Comment
            };

            _context.Reviews.Add(review);

            // Update salon rating
            await UpdateSalonRating(booking.SalonId);

            // Update stylist rating
            await UpdateStylistRating(booking.StylistId);

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Review submitted successfully", review });
        }

        /// <summary>
        /// Get reviews for a salon
        /// </summary>
        [AllowAnonymous]
        [HttpGet("salon/{salonId}")]
        public async Task<IActionResult> GetSalonReviews(Guid salonId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.Reviews
                .Include(r => r.Customer)
                .Where(r => r.SalonId == salonId)
                .OrderByDescending(r => r.CreatedAt);

            var total = await query.CountAsync();
            var reviews = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.Rating,
                    r.Comment,
                    CustomerName = r.Customer.FullName,
                    r.CreatedAt
                })
                .ToListAsync();

            var avgRating = await _context.Reviews
                .Where(r => r.SalonId == salonId)
                .AverageAsync(r => (double?)r.Rating) ?? 0;

            return Ok(new
            {
                success = true,
                reviews,
                avgRating = Math.Round(avgRating, 1),
                totalReviews = total,
                pagination = new
                {
                    page,
                    pageSize,
                    total,
                    totalPages = (int)Math.Ceiling(total / (double)pageSize)
                }
            });
        }

        /// <summary>
        /// Get reviews for a stylist
        /// </summary>
        [AllowAnonymous]
        [HttpGet("stylist/{stylistId}")]
        public async Task<IActionResult> GetStylistReviews(Guid stylistId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.Customer)
                .Where(r => r.StylistId == stylistId)
                .OrderByDescending(r => r.CreatedAt)
                .Take(20)
                .Select(r => new
                {
                    r.Id,
                    r.Rating,
                    r.Comment,
                    CustomerName = r.Customer.FullName,
                    r.CreatedAt
                })
                .ToListAsync();

            var avgRating = await _context.Reviews
                .Where(r => r.StylistId == stylistId)
                .AverageAsync(r => (double?)r.Rating) ?? 0;

            return Ok(new
            {
                success = true,
                reviews,
                avgRating = Math.Round(avgRating, 1),
                totalReviews = reviews.Count
            });
        }

        private async Task UpdateSalonRating(Guid salonId)
        {
            var salon = await _context.Salons.FindAsync(salonId);
            if (salon == null) return;

            var reviews = await _context.Reviews.Where(r => r.SalonId == salonId).ToListAsync();
            if (reviews.Any())
            {
                salon.Rating = (decimal)reviews.Average(r => r.Rating);
                salon.TotalReviews = reviews.Count;
                salon.UpdatedAt = DateTime.UtcNow;
            }
        }

        private async Task UpdateStylistRating(Guid stylistId)
        {
            var stylist = await _context.Stylists.FindAsync(stylistId);
            if (stylist == null) return;

            var reviews = await _context.Reviews.Where(r => r.StylistId == stylistId).ToListAsync();
            if (reviews.Any())
            {
                stylist.Rating = (decimal)reviews.Average(r => r.Rating);
                stylist.TotalReviews = reviews.Count;
                stylist.UpdatedAt = DateTime.UtcNow;
            }
        }
    }

    public record AddReviewRequest(Guid BookingId, int Rating, string Comment);
}