using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZAYNA.Infrastructure.Data;

namespace Zayna.API.Controllers
{
    /// <summary>Platform administration. Every endpoint requires the Admin role.</summary>
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>Salons awaiting approval (and, with ?status=all, every salon).</summary>
        [HttpGet("salons")]
        public async Task<IActionResult> GetSalons([FromQuery] string status = "pending")
        {
            var query = _context.Salons.AsNoTracking().AsQueryable();
            if (!string.Equals(status, "all", StringComparison.OrdinalIgnoreCase))
                query = query.Where(s => !s.IsVerified);

            var salons = await query
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    s.Id,
                    Name = s.SalonName,
                    s.ContactPhone,
                    s.ContactEmail,
                    City = s.Branches.Select(b => b.City).FirstOrDefault(),
                    Address = s.Branches.Select(b => b.AddressLine).FirstOrDefault(),
                    s.IsVerified,
                    s.CreatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, salons });
        }

        /// <summary>Approve (true) or suspend (false) a salon. Approved salons appear publicly and can take bookings.</summary>
        [HttpPut("salons/{id:guid}/verification")]
        public async Task<IActionResult> SetVerification(Guid id, [FromBody] SetVerificationRequest request)
        {
            var salon = await _context.Salons.FirstOrDefaultAsync(s => s.Id == id);
            if (salon == null)
                return NotFound(new { success = false, message = "Salon not found." });

            salon.IsVerified = request.IsVerified;
            salon.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, salon.Id, salon.IsVerified });
        }
    }

    public record SetVerificationRequest(bool IsVerified);
}
