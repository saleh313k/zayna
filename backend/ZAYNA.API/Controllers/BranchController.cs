// ZAYNA.API/Controllers/BranchController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZAYNA.Core.Entities;
using ZAYNA.Infrastructure.Data;

namespace ZAYNA.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BranchController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BranchController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get branch details with working hours
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBranch(Guid id)
        {
            var branch = await _context.Branches
                .Include(b => b.WorkingHours)
                .Include(b => b.Salon)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (branch == null)
                return NotFound(new { success = false, message = "Branch not found" });

            return Ok(new { success = true, branch });
        }

        /// <summary>
        /// Update branch working hours
        /// </summary>
        [Authorize(Roles = "Salon,Admin")]
        [HttpPut("{branchId}/working-hours")]
        public async Task<IActionResult> UpdateWorkingHours(Guid branchId, [FromBody] List<WorkingHoursRequest> workingHours)
        {
            var branch = await _context.Branches
                .Include(b => b.WorkingHours)
                .FirstOrDefaultAsync(b => b.Id == branchId);

            if (branch == null)
                return NotFound(new { success = false, message = "Branch not found" });

            // Remove existing working hours
            _context.BranchWorkingHours.RemoveRange(branch.WorkingHours);

            // Add new working hours
            foreach (var wh in workingHours)
            {
                branch.WorkingHours.Add(new BranchWorkingHours
                {
                    BranchId = branchId,
                    DayOfWeek = wh.DayOfWeek,
                    OpenTime = wh.OpenTime,
                    CloseTime = wh.CloseTime,
                    IsClosed = wh.IsClosed
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Working hours updated successfully" });
        }

        /// <summary>
        /// Get nearby branches
        /// </summary>
        [AllowAnonymous]
        [HttpGet("nearby")]
        public async Task<IActionResult> GetNearbyBranches([FromQuery] double latitude, [FromQuery] double longitude, [FromQuery] int radiusKm = 10)
        {
            // Simple distance calculation (for production, use proper geospatial queries)
            var branches = await _context.Branches
                .Include(b => b.Salon)
                .Where(b => b.IsActive && b.Latitude.HasValue && b.Longitude.HasValue)
                .ToListAsync();

            var nearbyBranches = branches
                .Select(b => new
                {
                    b.Id,
                    b.BranchName,
                    b.BranchNameAr,
                    b.AddressLine,
                    b.City,
                    b.PhoneNumber,
                    b.Latitude,
                    b.Longitude,
                    Salon = new
                    {
                        b.Salon.SalonName,
                        b.Salon.SalonNameAr,
                        b.Salon.Rating
                    },
                    Distance = CalculateDistance(latitude, longitude, b.Latitude.Value, b.Longitude.Value)
                })
                .Where(b => b.Distance <= radiusKm)
                .OrderBy(b => b.Distance)
                .ToList();

            return Ok(new { success = true, branches = nearbyBranches });
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            // Haversine formula
            var R = 6371; // Radius of the Earth in km
            var dLat = DegreesToRadians((double)(lat2 - lat1));
            var dLon = DegreesToRadians((double)(lon2 - lon1));
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(DegreesToRadians((double)lat1)) * Math.Cos(DegreesToRadians((double)lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        private double DegreesToRadians(double degrees)
        {
            return degrees * Math.PI / 180;
        }
    }

    public record WorkingHoursRequest(DayOfWeek DayOfWeek, TimeSpan OpenTime, TimeSpan CloseTime, bool IsClosed);
}
