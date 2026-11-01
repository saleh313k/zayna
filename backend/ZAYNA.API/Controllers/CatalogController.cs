using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZAYNA.Infrastructure.Data;
using ZAYNA.Infrastructure.Services;

namespace Zayna.API.Controllers
{
    /// <summary>
    /// Public read-only catalog for the booking flow: which salons can be booked online and what they offer.
    /// Only approved (verified) salons that have at least one active stylist able to perform an active service
    /// are listed, so a customer can never start a booking that cannot be completed.
    /// </summary>
    [AllowAnonymous]
    [ApiController]
    [Route("api/catalog")]
    public class CatalogController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly BookingPolicy _policy;

        public CatalogController(ApplicationDbContext context, BookingPolicy policy)
        {
            _context = context;
            _policy = policy;
        }

        /// <summary>Salons that can be booked online right now.</summary>
        [HttpGet("salons")]
        public async Task<IActionResult> GetBookableSalons([FromQuery] string? search)
        {
            var query = _context.Salons.AsNoTracking()
                .Where(s => s.IsVerified &&
                            s.Stylists.Any(st => st.IsActive &&
                                                 st.BranchId != null &&
                                                 st.StylistServices.Any(ss => ss.Service.IsActive)));

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(s =>
                    (s.SalonName != null && s.SalonName.Contains(term)) ||
                    (s.SalonNameAr != null && s.SalonNameAr.Contains(term)));
            }

            var salons = await query
                .OrderBy(s => s.SalonName)
                .Take(100)
                .Select(s => new
                {
                    s.Id,
                    Name = s.SalonName,
                    NameAr = s.SalonNameAr,
                    Description = s.AboutText,
                    City = s.Branches.Where(b => b.IsActive).Select(b => b.City).FirstOrDefault(),
                    Address = s.Branches.Where(b => b.IsActive).Select(b => b.AddressLine).FirstOrDefault(),
                    ServicesCount = s.Services.Count(sv => sv.IsActive),
                    FromPrice = s.Services.Where(sv => sv.IsActive).Min(sv => (decimal?)sv.Price)
                })
                .ToListAsync();

            return Ok(new { success = true, currency = "OMR", salons });
        }

        /// <summary>
        /// Everything the booking flow needs for one salon: active branches, services and stylists
        /// (with the services each stylist performs), plus the booking rules in force.
        /// </summary>
        [HttpGet("salons/{id:guid}/booking-options")]
        public async Task<IActionResult> GetBookingOptions(Guid id)
        {
            var salon = await _context.Salons.AsNoTracking()
                .Where(s => s.Id == id && s.IsVerified)
                .Select(s => new { s.Id, Name = s.SalonName, NameAr = s.SalonNameAr, Phone = s.ContactPhone })
                .FirstOrDefaultAsync();

            if (salon == null)
                return NotFound(new { success = false, code = "SALON_NOT_FOUND", message = "Salon not found." });

            var stylistRows = await _context.Stylists.AsNoTracking()
                .Where(st => st.SalonId == id && st.IsActive && st.BranchId != null)
                .Select(st => new
                {
                    st.Id,
                    Name = st.FullName,
                    NameAr = st.FullNameAr,
                    st.BranchId,
                    st.YearsOfExperience,
                    ServiceIds = st.StylistServices
                        .Where(ss => ss.Service.IsActive)
                        .Select(ss => ss.ServiceId)
                        .ToList()
                })
                .ToListAsync();

            // A stylist who performs no active service cannot be booked.
            var stylists = stylistRows.Where(x => x.ServiceIds.Count > 0).ToList();

            var serviceIds = stylists.SelectMany(x => x.ServiceIds).Distinct().ToList();
            var branchIds = stylists.Select(x => x.BranchId!.Value).Distinct().ToList();

            var branches = await _context.Branches.AsNoTracking()
                .Where(b => b.SalonId == id && b.IsActive && branchIds.Contains(b.Id))
                .OrderBy(b => b.BranchName)
                .Select(b => new { b.Id, Name = b.BranchName, NameAr = b.BranchNameAr, Address = b.AddressLine, b.City })
                .ToListAsync();

            var services = await _context.Services.AsNoTracking()
                .Where(s => s.SalonId == id && s.IsActive && serviceIds.Contains(s.Id))
                .OrderBy(s => s.Category).ThenBy(s => s.ServiceName)
                .Select(s => new
                {
                    s.Id,
                    Name = s.ServiceName,
                    NameAr = s.ServiceNameAr,
                    s.Description,
                    s.Category,
                    s.DurationMinutes,
                    s.Price
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                salon,
                branches,
                services,
                stylists,
                policy = new
                {
                    currency = "OMR",
                    maxDaysAhead = _policy.MaxDaysAhead,
                    minLeadMinutes = _policy.MinLeadMinutes,
                    cancellationCutoffHours = _policy.CancellationCutoffHours,
                    autoConfirm = _policy.AutoConfirm,
                    onlinePaymentEnabled = _policy.OnlinePaymentEnabled
                }
            });
        }
    }
}
