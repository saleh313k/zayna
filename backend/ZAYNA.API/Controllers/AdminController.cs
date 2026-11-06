using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ZAYNA.Core.Enums;
using ZAYNA.Infrastructure.Data;

namespace Zayna.API.Controllers
{
    /// <summary>Platform administration. Every endpoint requires the Admin role.</summary>
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private const int MaxPageSize = 50;
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        private static (int page, int pageSize) NormalizePaging(int page, int pageSize)
            => (Math.Max(page, 1), Math.Clamp(pageSize, 1, MaxPageSize));

        // =====================================================================
        // DASHBOARD STATS
        // =====================================================================

        /// <summary>
        /// Platform statistics for the admin dashboard. "Revenue" is the total value of COMPLETED bookings.
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var now = DateTime.UtcNow;
            var today = now.Date;
            var since30 = now.AddDays(-30);

            // Users
            var totalUsers = await _context.Users.CountAsync();
            var newUsers30 = await _context.Users.CountAsync(u => u.CreatedAt >= since30);

            // Salons
            var totalSalons = await _context.Salons.CountAsync();
            var activeSalons = await _context.Salons.CountAsync(s => s.IsVerified);
            var pendingSalons = totalSalons - activeSalons;
            var newSalons30 = await _context.Salons.CountAsync(s => s.CreatedAt >= since30);

            // Bookings
            var totalBookings = await _context.Bookings.CountAsync();
            var bookings30 = await _context.Bookings.CountAsync(b => b.CreatedAt >= since30);

            // Revenue = sum of completed bookings
            var totalRevenue = await _context.Bookings
                .Where(b => b.Status == BookingStatus.Completed)
                .SumAsync(b => (decimal?)b.TotalPrice) ?? 0m;
            var revenue30 = await _context.Bookings
                .Where(b => b.Status == BookingStatus.Completed && b.BookingDate >= since30.Date)
                .SumAsync(b => (decimal?)b.TotalPrice) ?? 0m;

            // Monthly revenue: last 6 calendar months (including the current one)
            var firstMonth = new DateTime(now.Year, now.Month, 1).AddMonths(-5);
            var monthlyRaw = await _context.Bookings
                .Where(b => b.Status == BookingStatus.Completed && b.BookingDate >= firstMonth)
                .GroupBy(b => new { b.BookingDate.Year, b.BookingDate.Month })
                .Select(g => new { g.Key.Year, g.Key.Month, Revenue = g.Sum(b => b.TotalPrice) })
                .ToListAsync();

            var monthlyRevenue = Enumerable.Range(0, 6)
                .Select(i => firstMonth.AddMonths(i))
                .Select(m => new
                {
                    year = m.Year,
                    month = m.Month,
                    revenue = monthlyRaw.FirstOrDefault(x => x.Year == m.Year && x.Month == m.Month)?.Revenue ?? 0m
                })
                .ToList();

            // Bookings per day: last 7 days (cancelled bookings excluded)
            var weekStart = today.AddDays(-6);
            var dailyRaw = await _context.Bookings
                .Where(b => b.BookingDate >= weekStart && b.BookingDate <= today && b.Status != BookingStatus.Cancelled)
                .GroupBy(b => b.BookingDate.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            var dailyBookings = Enumerable.Range(0, 7)
                .Select(i => weekStart.AddDays(i))
                .Select(d => new
                {
                    date = d.ToString("yyyy-MM-dd"),
                    bookings = dailyRaw.FirstOrDefault(x => x.Date == d)?.Count ?? 0
                })
                .ToList();

            // Top 5 salons by (non-cancelled) bookings
            var topSalons = await _context.Bookings
                .Where(b => b.Status != BookingStatus.Cancelled)
                .GroupBy(b => new { b.SalonId, b.Salon.SalonName })
                .Select(g => new
                {
                    salonId = g.Key.SalonId,
                    name = g.Key.SalonName,
                    bookings = g.Count(),
                    revenue = g.Sum(b => b.Status == BookingStatus.Completed ? b.TotalPrice : 0m)
                })
                .OrderByDescending(x => x.bookings)
                .ThenByDescending(x => x.revenue)
                .Take(5)
                .ToListAsync();

            return Ok(new
            {
                success = true,
                currency = "OMR",
                users = new { total = totalUsers, newLast30Days = newUsers30 },
                salons = new { total = totalSalons, active = activeSalons, pending = pendingSalons, newLast30Days = newSalons30 },
                bookings = new { total = totalBookings, last30Days = bookings30 },
                revenue = new { total = totalRevenue, last30Days = revenue30 },
                monthlyRevenue,
                dailyBookings,
                topSalons
            });
        }

        // =====================================================================
        // SALONS (approval)
        // =====================================================================

        /// <summary>Salons awaiting approval by default; ?status=all lists every salon. Paged.</summary>
        [HttpGet("salons")]
        public async Task<IActionResult> GetSalons(
            [FromQuery] string status = "pending", [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            (page, pageSize) = NormalizePaging(page, pageSize);

            var query = _context.Salons.AsNoTracking().AsQueryable();
            if (!string.Equals(status, "all", StringComparison.OrdinalIgnoreCase))
                query = query.Where(s => !s.IsVerified);

            var total = await query.CountAsync();

            var salons = await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new
                {
                    s.Id,
                    Name = s.SalonName,
                    OwnerName = s.User.FullName,
                    s.ContactPhone,
                    s.ContactEmail,
                    City = s.Branches.Select(b => b.City).FirstOrDefault(),
                    Address = s.Branches.Select(b => b.AddressLine).FirstOrDefault(),
                    s.IsVerified,
                    s.CreatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, salons, total, page, pageSize });
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

        // =====================================================================
        // USERS
        // =====================================================================

        /// <summary>Paged user list. Filters: search (name/email/phone), role (0-3), status (active|disabled).</summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? search, [FromQuery] UserRole? role, [FromQuery] string? status,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            (page, pageSize) = NormalizePaging(page, pageSize);

            var query = _context.Users.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(u =>
                    u.FullName.Contains(term) ||
                    (u.Email != null && u.Email.Contains(term)) ||
                    (u.PhoneNumber != null && u.PhoneNumber.Contains(term)));
            }

            if (role.HasValue)
                query = query.Where(u => u.Role == role.Value);

            if (string.Equals(status, "active", StringComparison.OrdinalIgnoreCase))
                query = query.Where(u => u.IsActive);
            else if (string.Equals(status, "disabled", StringComparison.OrdinalIgnoreCase))
                query = query.Where(u => !u.IsActive);

            var total = await query.CountAsync();

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.PhoneNumber,
                    Role = (int)u.Role,
                    u.IsActive,
                    u.CreatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, users, total, page, pageSize });
        }

        /// <summary>
        /// Enable or disable a user. Disabled users cannot sign in and their existing sessions stop working.
        /// Admin accounts cannot be disabled, and nobody can disable their own account.
        /// </summary>
        [HttpPut("users/{id:guid}/status")]
        public async Task<IActionResult> SetUserStatus(Guid id, [FromBody] SetUserStatusRequest request)
        {
            var currentId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (Guid.TryParse(currentId, out var me) && me == id)
                return BadRequest(new { success = false, message = "You cannot change the status of your own account." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
                return NotFound(new { success = false, message = "User not found." });

            if (user.Role == UserRole.Admin && !request.IsActive)
                return BadRequest(new { success = false, message = "Admin accounts cannot be disabled." });

            user.IsActive = request.IsActive;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, user.Id, user.IsActive });
        }

        // =====================================================================
        // BOOKINGS (read-only overview)
        // =====================================================================

        /// <summary>
        /// Paged bookings across all salons. Filters: status, search (booking number / customer / salon),
        /// from / to (booking date, inclusive). Also returns per-status counts for the whole platform.
        /// </summary>
        [HttpGet("bookings")]
        public async Task<IActionResult> GetBookings(
            [FromQuery] BookingStatus? status, [FromQuery] string? search,
            [FromQuery] DateTime? from, [FromQuery] DateTime? to,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            (page, pageSize) = NormalizePaging(page, pageSize);

            var query = _context.Bookings.AsNoTracking().AsQueryable();

            if (status.HasValue)
                query = query.Where(b => b.Status == status.Value);

            if (from.HasValue)
                query = query.Where(b => b.BookingDate >= from.Value.Date);
            if (to.HasValue)
                query = query.Where(b => b.BookingDate <= to.Value.Date);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(b =>
                    (b.BookingNumber != null && b.BookingNumber.Contains(term)) ||
                    b.Customer.FullName.Contains(term) ||
                    (b.Salon.SalonName != null && b.Salon.SalonName.Contains(term)));
            }

            var total = await query.CountAsync();

            var bookings = await query
                .OrderByDescending(b => b.BookingDate)
                .ThenByDescending(b => b.StartTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new
                {
                    b.Id,
                    b.BookingNumber,
                    CustomerName = b.Customer.FullName,
                    SalonName = b.Salon.SalonName,
                    BranchName = b.Branch.BranchName,
                    StylistName = b.Stylist.FullName,
                    ServiceName = b.Service.ServiceName,
                    b.BookingDate,
                    StartTime = b.StartTime.ToString(@"hh\:mm"),
                    EndTime = b.EndTime.ToString(@"hh\:mm"),
                    Status = (int)b.Status,
                    PaymentType = (int)b.PaymentType,
                    TotalAmount = b.TotalPrice,
                    b.CreatedAt
                })
                .ToListAsync();

            var countsRaw = await _context.Bookings
                .GroupBy(b => b.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var counts = Enum.GetValues<BookingStatus>()
                .ToDictionary(
                    s => ((int)s).ToString(),
                    s => countsRaw.FirstOrDefault(c => c.Status == s)?.Count ?? 0);

            return Ok(new { success = true, bookings, total, page, pageSize, counts });
        }
    }

    public record SetVerificationRequest(bool IsVerified);
    public record SetUserStatusRequest(bool IsActive);
}
