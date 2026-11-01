using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Net.Mail;
using System.Security.Claims;
using Zayna.API.Mapping;
using Zayna.Core.Interfaces;
using ZAYNA.Core.Entities;
using ZAYNA.Core.Enums;
using ZAYNA.Infrastructure.Data;
using ZAYNA.Infrastructure.Services;

namespace Zayna.API.Controllers
{
    /// <summary>
    /// Everything a salon owner needs to run their salon. Every endpoint works on the SIGNED-IN OWNER'S OWN salon,
    /// resolved from their identity, so there is no salon id in any URL and no way to touch another salon's data.
    /// Works while the salon is still awaiting admin approval, so owners can finish their setup before going live.
    /// </summary>
    [Authorize(Roles = "Salon")]
    [ApiController]
    [Route("api/owner")]
    public class OwnerController : ControllerBase
    {
        private const int MaxBranches = 20;
        private const int MaxServices = 200;
        private const int MaxStylists = 100;

        private readonly ApplicationDbContext _context;
        private readonly ISalonClock _clock;
        private readonly BookingPolicy _policy;

        public OwnerController(ApplicationDbContext context, ISalonClock clock, BookingPolicy policy)
        {
            _context = context;
            _clock = clock;
            _policy = policy;
        }

        // =====================================================================
        // helpers
        // =====================================================================
        private async Task<Guid?> GetSalonIdAsync()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (!Guid.TryParse(value, out var userId)) return null;

            return await _context.Salons.AsNoTracking()
                .Where(s => s.UserId == userId)
                .Select(s => (Guid?)s.Id)
                .FirstOrDefaultAsync();
        }

        private IActionResult NoSalon() => NotFound(new { success = false, code = "SALON_NOT_FOUND", message = "No salon is registered for this account." });
        private IActionResult Invalid(string message) => BadRequest(new { success = false, code = "VALIDATION_FAILED", message });
        private IActionResult NotFoundItem(string what) => NotFound(new { success = false, code = "NOT_FOUND", message = $"{what} not found." });

        private static string? Clean(string? value)
        {
            var t = value?.Trim();
            return string.IsNullOrEmpty(t) ? null : t;
        }

        private static int Len(string? value) => Clean(value)?.Length ?? 0;

        /// <summary>Number of upcoming (pending / confirmed, from today) bookings matching a filter, to warn about.</summary>
        private async Task<int> CountUpcomingAsync(Expression<Func<Booking, bool>> filter)
        {
            var today = _clock.LocalNow.Date;
            return await _context.Bookings.Where(filter).CountAsync(b =>
                b.BookingDate >= today && (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Confirmed));
        }

        private IQueryable<Booking> BookingsWithDetails() => _context.Bookings.AsNoTracking()
            .Include(b => b.Customer).ThenInclude(c => c.User)
            .Include(b => b.Salon)
            .Include(b => b.Branch)
            .Include(b => b.Stylist)
            .Include(b => b.Service);

        // =====================================================================
        // OVERVIEW (one call powers the management screens)
        // =====================================================================
        [HttpGet("salon")]
        public async Task<IActionResult> GetSalon()
        {
            var salonId = await GetSalonIdAsync();
            if (salonId == null) return NoSalon();
            var id = salonId.Value;

            var salon = await _context.Salons.AsNoTracking().FirstAsync(s => s.Id == id);
            var branches = await _context.Branches.AsNoTracking().Include(b => b.WorkingHours)
                .Where(b => b.SalonId == id).OrderBy(b => b.CreatedAt).ThenBy(b => b.BranchName).ToListAsync();
            var services = await _context.Services.AsNoTracking()
                .Where(s => s.SalonId == id)
                .OrderByDescending(s => s.IsActive).ThenBy(s => s.Category).ThenBy(s => s.ServiceName).ToListAsync();
            var stylists = await _context.Stylists.AsNoTracking().Include(s => s.StylistServices)
                .Where(s => s.SalonId == id).OrderByDescending(s => s.IsActive).ThenBy(s => s.FullName).ToListAsync();

            var today = _clock.LocalNow.Date;
            var offDays = await _context.StylistOffDays.AsNoTracking()
                .Where(o => o.Stylist.SalonId == id && o.OffDate >= today)
                .OrderBy(o => o.OffDate).ToListAsync();

            // What is still missing before customers can book this salon.
            var activeBranches = branches.Where(b => b.IsActive).ToList();
            var activeBranchIds = activeBranches.Select(b => b.Id).ToHashSet();
            var activeServiceIds = services.Where(s => s.IsActive).Select(s => s.Id).ToHashSet();
            var hasHours = activeBranches.Any(b => b.WorkingHours.Any(w => !w.IsClosed && w.CloseTime > w.OpenTime));
            var hasStylist = stylists.Any(s => s.IsActive && s.BranchId.HasValue &&
                                               activeBranchIds.Contains(s.BranchId.Value) &&
                                               s.StylistServices.Any(ss => activeServiceIds.Contains(ss.ServiceId)));

            return Ok(new
            {
                success = true,
                salon = new
                {
                    salon.Id,
                    Name = salon.SalonName,
                    NameAr = salon.SalonNameAr,
                    About = salon.AboutText,
                    AboutAr = salon.AboutTextAr,
                    Phone = salon.ContactPhone,
                    Email = salon.ContactEmail,
                    salon.IsVerified
                },
                branches = branches.Select(b => new
                {
                    b.Id,
                    Name = b.BranchName,
                    NameAr = b.BranchNameAr,
                    Address = b.AddressLine,
                    b.City,
                    Phone = b.PhoneNumber,
                    b.IsActive,
                    WorkingHours = b.WorkingHours.OrderBy(w => w.DayOfWeek).Select(w => new
                    {
                        Day = (int)w.DayOfWeek,
                        OpenTime = w.OpenTime.ToString(@"hh\:mm\:ss"),
                        CloseTime = w.CloseTime.ToString(@"hh\:mm\:ss"),
                        w.IsClosed
                    })
                }),
                services = services.Select(s => new
                {
                    s.Id,
                    Name = s.ServiceName,
                    NameAr = s.ServiceNameAr,
                    s.Description,
                    s.DescriptionAr,
                    s.Category,
                    s.DurationMinutes,
                    s.Price,
                    s.IsActive
                }),
                stylists = stylists.Select(s => new
                {
                    s.Id,
                    Name = s.FullName,
                    NameAr = s.FullNameAr,
                    s.BranchId,
                    s.YearsOfExperience,
                    s.IsActive,
                    ServiceIds = s.StylistServices.Select(ss => ss.ServiceId),
                    OffDays = offDays.Where(o => o.StylistId == s.Id)
                        .Select(o => new { Date = o.OffDate.ToString("yyyy-MM-dd"), o.Reason })
                }),
                readiness = new
                {
                    hasBranch = activeBranches.Count > 0,
                    hasWorkingHours = hasHours,
                    hasService = activeServiceIds.Count > 0,
                    hasStylist,
                    isApproved = salon.IsVerified,
                    canTakeBookings = salon.IsVerified && activeBranches.Count > 0 && hasHours && activeServiceIds.Count > 0 && hasStylist
                },
                policy = new
                {
                    autoConfirm = _policy.AutoConfirm,
                    slotIntervalMinutes = _policy.SlotIntervalMinutes,
                    currency = "OMR"
                }
            });
        }

        // =====================================================================
        // PROFILE
        // =====================================================================
        [HttpPut("salon")]
        public async Task<IActionResult> UpdateProfile([FromBody] SalonProfileRequest r)
        {
            var salonId = await GetSalonIdAsync();
            if (salonId == null) return NoSalon();

            var name = Clean(r.Name);
            var phone = Clean(r.Phone);
            var email = Clean(r.Email)?.ToLowerInvariant();

            if (name == null || name.Length < 2 || name.Length > 100) return Invalid("Salon name must be 2-100 characters.");
            if (Len(r.NameAr) > 100) return Invalid("Arabic salon name must be at most 100 characters.");
            if (Len(r.About) > 2000 || Len(r.AboutAr) > 2000) return Invalid("About text must be at most 2000 characters.");
            if (phone == null || phone.Length < 6 || phone.Length > 20) return Invalid("Contact phone must be 6-20 characters.");
            if (email != null)
            {
                try { if (new MailAddress(email).Address != email || email.Length > 256) return Invalid("Please enter a valid contact email."); }
                catch (FormatException) { return Invalid("Please enter a valid contact email."); }
            }

            var salon = await _context.Salons.FirstAsync(s => s.Id == salonId.Value);
            salon.SalonName = name;
            salon.SalonNameAr = Clean(r.NameAr);
            salon.AboutText = Clean(r.About);
            salon.AboutTextAr = Clean(r.AboutAr);
            salon.ContactPhone = phone;
            salon.ContactEmail = email;
            salon.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        // =====================================================================
        // BRANCHES + WORKING HOURS
        // =====================================================================
        [HttpPost("branches")]
        public async Task<IActionResult> AddBranch([FromBody] BranchRequest r)
        {
            var salonId = await GetSalonIdAsync();
            if (salonId == null) return NoSalon();

            var error = ValidateBranch(r);
            if (error != null) return Invalid(error);

            if (await _context.Branches.CountAsync(b => b.SalonId == salonId.Value) >= MaxBranches)
                return Invalid($"A salon can have at most {MaxBranches} branches.");

            var now = DateTime.UtcNow;
            var branch = new Branch
            {
                SalonId = salonId.Value,
                BranchName = Clean(r.Name),
                BranchNameAr = Clean(r.NameAr),
                AddressLine = Clean(r.AddressLine),
                City = Clean(r.City),
                PhoneNumber = Clean(r.PhoneNumber),
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            // Sensible defaults so a new branch is usable straight away; the owner edits them next.
            for (var day = 0; day <= 6; day++)
            {
                branch.WorkingHours.Add(new BranchWorkingHours
                {
                    DayOfWeek = (System.DayOfWeek)day,
                    OpenTime = TimeSpan.FromHours(9),
                    CloseTime = TimeSpan.FromHours(21),
                    IsClosed = day == 5 // Friday closed
                });
            }

            _context.Branches.Add(branch);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, id = branch.Id });
        }

        [HttpPut("branches/{id:guid}")]
        public async Task<IActionResult> UpdateBranch(Guid id, [FromBody] BranchRequest r)
        {
            var salonId = await GetSalonIdAsync();
            if (salonId == null) return NoSalon();

            var branch = await _context.Branches.FirstOrDefaultAsync(b => b.Id == id && b.SalonId == salonId.Value);
            if (branch == null) return NotFoundItem("Branch");

            var error = ValidateBranch(r);
            if (error != null) return Invalid(error);

            var deactivating = branch.IsActive && r.IsActive == false;

            branch.BranchName = Clean(r.Name);
            branch.BranchNameAr = Clean(r.NameAr);
            branch.AddressLine = Clean(r.AddressLine);
            branch.City = Clean(r.City);
            branch.PhoneNumber = Clean(r.PhoneNumber);
            if (r.IsActive.HasValue) branch.IsActive = r.IsActive.Value;
            branch.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Existing bookings stay valid; the owner is told how many to handle.
            var upcoming = deactivating ? await CountUpcomingAsync(b => b.BranchId == id) : 0;
            return Ok(new { success = true, upcomingBookings = upcoming });
        }

        [HttpPut("branches/{id:guid}/working-hours")]
        public async Task<IActionResult> UpdateWorkingHours(Guid id, [FromBody] List<WorkingHoursEntry>? entries)
        {
            var salonId = await GetSalonIdAsync();
            if (salonId == null) return NoSalon();

            var branch = await _context.Branches.Include(b => b.WorkingHours)
                .FirstOrDefaultAsync(b => b.Id == id && b.SalonId == salonId.Value);
            if (branch == null) return NotFoundItem("Branch");

            if (entries == null || entries.Count == 0 || entries.Count > 7)
                return Invalid("Provide working hours for up to 7 days.");
            if (entries.Any(e => e.Day < 0 || e.Day > 6) || entries.Select(e => e.Day).Distinct().Count() != entries.Count)
                return Invalid("Each day (0-6) may appear only once.");

            // SQL 'time' cannot hold 24:00, so the latest closing time is 23:59.
            var latest = new TimeSpan(23, 59, 0);
            foreach (var e in entries.Where(e => !e.IsClosed))
            {
                if (e.OpenTime < TimeSpan.Zero || e.CloseTime > latest || e.CloseTime <= e.OpenTime)
                    return Invalid("Opening time must be before closing time (closing no later than 23:59).");
            }

            _context.BranchWorkingHours.RemoveRange(branch.WorkingHours);
            foreach (var e in entries)
            {
                branch.WorkingHours.Add(new BranchWorkingHours
                {
                    BranchId = id,
                    DayOfWeek = (System.DayOfWeek)e.Day,
                    OpenTime = e.IsClosed ? TimeSpan.Zero : e.OpenTime,
                    CloseTime = e.IsClosed ? TimeSpan.Zero : e.CloseTime,
                    IsClosed = e.IsClosed
                });
            }
            branch.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        private static string? ValidateBranch(BranchRequest r)
        {
            var name = Clean(r.Name);
            if (name == null || name.Length < 2 || name.Length > 100) return "Branch name must be 2-100 characters.";
            if (Len(r.NameAr) > 100) return "Arabic branch name must be at most 100 characters.";
            var address = Clean(r.AddressLine);
            if (address == null || address.Length < 2 || address.Length > 200) return "Address must be 2-200 characters.";
            var city = Clean(r.City);
            if (city == null || city.Length < 2 || city.Length > 100) return "City must be 2-100 characters.";
            if (Len(r.PhoneNumber) > 20) return "Phone must be at most 20 characters.";
            return null;
        }

        // =====================================================================
        // SERVICES
        // =====================================================================
        [HttpPost("services")]
        public async Task<IActionResult> AddService([FromBody] ServiceRequest r)
        {
            var salonId = await GetSalonIdAsync();
            if (salonId == null) return NoSalon();

            var error = ValidateService(r);
            if (error != null) return Invalid(error);

            if (await _context.Services.CountAsync(s => s.SalonId == salonId.Value) >= MaxServices)
                return Invalid($"A salon can have at most {MaxServices} services.");

            var now = DateTime.UtcNow;
            var service = new Service
            {
                SalonId = salonId.Value,
                ServiceName = Clean(r.Name),
                ServiceNameAr = Clean(r.NameAr),
                Description = Clean(r.Description),
                DescriptionAr = Clean(r.DescriptionAr),
                Category = Clean(r.Category),
                DurationMinutes = r.DurationMinutes,
                Price = r.Price,
                IsActive = r.IsActive ?? true,
                CreatedAt = now,
                UpdatedAt = now
            };
            _context.Services.Add(service);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, id = service.Id });
        }

        [HttpPut("services/{id:guid}")]
        public async Task<IActionResult> UpdateService(Guid id, [FromBody] ServiceRequest r)
        {
            var salonId = await GetSalonIdAsync();
            if (salonId == null) return NoSalon();

            var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == id && s.SalonId == salonId.Value);
            if (service == null) return NotFoundItem("Service");

            var error = ValidateService(r);
            if (error != null) return Invalid(error);

            var deactivating = service.IsActive && r.IsActive == false;

            service.ServiceName = Clean(r.Name);
            service.ServiceNameAr = Clean(r.NameAr);
            service.Description = Clean(r.Description);
            service.DescriptionAr = Clean(r.DescriptionAr);
            service.Category = Clean(r.Category);
            service.DurationMinutes = r.DurationMinutes;
            service.Price = r.Price; // existing bookings keep the price they were booked at
            if (r.IsActive.HasValue) service.IsActive = r.IsActive.Value;
            service.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var upcoming = deactivating ? await CountUpcomingAsync(b => b.ServiceId == id) : 0;
            return Ok(new { success = true, upcomingBookings = upcoming });
        }

        private static string? ValidateService(ServiceRequest r)
        {
            var name = Clean(r.Name);
            if (name == null || name.Length < 2 || name.Length > 100) return "Service name must be 2-100 characters.";
            if (Len(r.NameAr) > 100) return "Arabic service name must be at most 100 characters.";
            if (Len(r.Description) > 500 || Len(r.DescriptionAr) > 500) return "Description must be at most 500 characters.";
            if (Len(r.Category) > 50) return "Category must be at most 50 characters.";
            if (r.DurationMinutes < 5 || r.DurationMinutes > 480) return "Duration must be between 5 and 480 minutes.";
            if (r.Price < 0 || r.Price > 10000 || decimal.Round(r.Price, 3) != r.Price)
                return "Price must be between 0 and 10000 with at most 3 decimal places.";
            return null;
        }

        // =====================================================================
        // STYLISTS (staff records; they do not sign in yet)
        // =====================================================================
        [HttpPost("stylists")]
        public async Task<IActionResult> AddStylist([FromBody] StylistRequest r)
        {
            var salonId = await GetSalonIdAsync();
            if (salonId == null) return NoSalon();

            var (error, branchId, serviceIds) = await ValidateStylistAsync(salonId.Value, r, existing: null);
            if (error != null) return Invalid(error);

            if (await _context.Stylists.CountAsync(s => s.SalonId == salonId.Value) >= MaxStylists)
                return Invalid($"A salon can have at most {MaxStylists} stylists.");

            var now = DateTime.UtcNow;
            var name = Clean(r.Name)!;

            // Staff accounts have no phone, email or password: they exist so bookings can be assigned, and cannot sign in.
            var user = new User { FullName = name, Role = UserRole.Stylist, IsActive = true, CreatedAt = now, UpdatedAt = now };
            var stylist = new Stylist
            {
                User = user,
                SalonId = salonId.Value,
                BranchId = branchId,
                FullName = name,
                FullNameAr = Clean(r.NameAr) ?? "",
                YearsOfExperience = r.YearsOfExperience,
                IsActive = r.IsActive ?? true,
                CreatedAt = now,
                UpdatedAt = now
            };
            foreach (var serviceId in serviceIds)
                stylist.StylistServices.Add(new StylistService { ServiceId = serviceId });

            _context.Stylists.Add(stylist);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, id = stylist.Id });
        }

        [HttpPut("stylists/{id:guid}")]
        public async Task<IActionResult> UpdateStylist(Guid id, [FromBody] StylistRequest r)
        {
            var salonId = await GetSalonIdAsync();
            if (salonId == null) return NoSalon();

            var stylist = await _context.Stylists
                .Include(s => s.User)
                .Include(s => s.StylistServices)
                .FirstOrDefaultAsync(s => s.Id == id && s.SalonId == salonId.Value);
            if (stylist == null) return NotFoundItem("Stylist");

            var (error, branchId, serviceIds) = await ValidateStylistAsync(salonId.Value, r, existing: stylist);
            if (error != null) return Invalid(error);

            var deactivating = stylist.IsActive && r.IsActive == false;
            var name = Clean(r.Name)!;

            stylist.FullName = name;
            stylist.FullNameAr = Clean(r.NameAr) ?? "";
            stylist.BranchId = branchId;
            stylist.YearsOfExperience = r.YearsOfExperience;
            if (r.IsActive.HasValue) stylist.IsActive = r.IsActive.Value;
            stylist.UpdatedAt = DateTime.UtcNow;
            if (stylist.User != null) { stylist.User.FullName = name; stylist.User.UpdatedAt = DateTime.UtcNow; }

            // Make the stylist's services exactly the requested set.
            var wanted = serviceIds.ToHashSet();
            var toRemove = stylist.StylistServices.Where(ss => !wanted.Contains(ss.ServiceId)).ToList();
            _context.StylistServices.RemoveRange(toRemove);
            var have = stylist.StylistServices.Select(ss => ss.ServiceId).ToHashSet();
            foreach (var serviceId in wanted.Where(w => !have.Contains(w)))
                stylist.StylistServices.Add(new StylistService { StylistId = stylist.Id, ServiceId = serviceId });

            await _context.SaveChangesAsync();

            var upcoming = deactivating ? await CountUpcomingAsync(b => b.StylistId == id) : 0;
            return Ok(new { success = true, upcomingBookings = upcoming });
        }

        private async Task<(string? error, Guid? branchId, List<Guid> serviceIds)> ValidateStylistAsync(
            Guid salonId, StylistRequest r, Stylist? existing)
        {
            var none = new List<Guid>();
            var name = Clean(r.Name);
            if (name == null || name.Length < 2 || name.Length > 100) return ("Stylist name must be 2-100 characters.", null, none);
            if (Len(r.NameAr) > 100) return ("Arabic name must be at most 100 characters.", null, none);
            if (r.YearsOfExperience < 0 || r.YearsOfExperience > 60) return ("Years of experience must be between 0 and 60.", null, none);

            if (r.BranchId == null) return ("Choose the branch where this stylist works.", null, none);
            var branch = await _context.Branches.AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == r.BranchId.Value && b.SalonId == salonId);
            if (branch == null) return ("The selected branch does not belong to your salon.", null, none);

            var willBeActive = r.IsActive ?? existing?.IsActive ?? true;
            if (willBeActive && !branch.IsActive) return ("Choose an active branch for an active stylist.", null, none);

            var serviceIds = (r.ServiceIds ?? new List<Guid>()).Distinct().ToList();
            if (serviceIds.Count > 0)
            {
                var owned = await _context.Services.CountAsync(s => s.SalonId == salonId && serviceIds.Contains(s.Id));
                if (owned != serviceIds.Count) return ("One or more selected services do not belong to your salon.", null, none);
            }

            return (null, branch.Id, serviceIds);
        }

        // ---- days off ----
        [HttpPost("stylists/{id:guid}/off-days")]
        public async Task<IActionResult> AddOffDay(Guid id, [FromBody] OffDayRequest r)
        {
            var salonId = await GetSalonIdAsync();
            if (salonId == null) return NoSalon();

            if (!await _context.Stylists.AnyAsync(s => s.Id == id && s.SalonId == salonId.Value))
                return NotFoundItem("Stylist");

            var date = r.Date.ToDateTime(TimeOnly.MinValue);
            var today = _clock.LocalNow.Date;
            if (date < today || date > today.AddDays(365)) return Invalid("Choose a date from today up to one year ahead.");
            if (Len(r.Reason) > 200) return Invalid("Reason must be at most 200 characters.");

            if (await _context.StylistOffDays.AnyAsync(o => o.StylistId == id && o.OffDate == date))
                return Conflict(new { success = false, code = "OFF_DAY_EXISTS", message = "This day is already marked as a day off." });

            // Never silently strand customers: existing bookings that day must be cancelled or handled first.
            var booked = await _context.Bookings.CountAsync(b =>
                b.StylistId == id && b.BookingDate == date && b.Status != BookingStatus.Cancelled);
            if (booked > 0)
                return Conflict(new
                {
                    success = false,
                    code = "OFF_DAY_HAS_BOOKINGS",
                    message = $"This stylist already has {booked} booking(s) on that day. Cancel or complete them first."
                });

            _context.StylistOffDays.Add(new StylistOffDay { StylistId = id, OffDate = date, Reason = Clean(r.Reason) });
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        [HttpDelete("stylists/{id:guid}/off-days/{date}")]
        public async Task<IActionResult> RemoveOffDay(Guid id, DateOnly date)
        {
            var salonId = await GetSalonIdAsync();
            if (salonId == null) return NoSalon();

            var day = date.ToDateTime(TimeOnly.MinValue);
            var offDay = await _context.StylistOffDays
                .FirstOrDefaultAsync(o => o.StylistId == id && o.OffDate == day && o.Stylist.SalonId == salonId.Value);
            if (offDay == null) return NotFoundItem("Day off");

            _context.StylistOffDays.Remove(offDay);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // =====================================================================
        // DASHBOARD + APPOINTMENTS
        // =====================================================================
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var salonId = await GetSalonIdAsync();
            if (salonId == null) return NoSalon();
            var id = salonId.Value;

            var now = _clock.LocalNow;
            var today = now.Date;
            var monthStart = new DateTime(today.Year, today.Month, 1);
            var nowTime = now.TimeOfDay;

            var bookings = _context.Bookings.AsNoTracking().Where(b => b.SalonId == id);

            var todayCount = await bookings.CountAsync(b => b.BookingDate == today && b.Status != BookingStatus.Cancelled);
            var upcomingCount = await bookings.CountAsync(b => b.BookingDate > today &&
                (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Confirmed));
            var pendingCount = await bookings.CountAsync(b => b.Status == BookingStatus.Pending && b.BookingDate >= today);
            var monthRevenue = await bookings
                .Where(b => b.Status == BookingStatus.Completed && b.BookingDate >= monthStart)
                .SumAsync(b => (decimal?)b.TotalPrice) ?? 0m;
            var totalRevenue = await bookings
                .Where(b => b.Status == BookingStatus.Completed)
                .SumAsync(b => (decimal?)b.TotalPrice) ?? 0m;
            var customers = await bookings
                .Where(b => b.Status != BookingStatus.Cancelled)
                .Select(b => b.CustomerId).Distinct().CountAsync();

            var next = await BookingsWithDetails()
                .Where(b => b.SalonId == id &&
                            (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Confirmed) &&
                            (b.BookingDate > today || (b.BookingDate == today && b.StartTime >= nowTime)))
                .OrderBy(b => b.BookingDate).ThenBy(b => b.StartTime)
                .Take(5)
                .ToListAsync();

            return Ok(new
            {
                success = true,
                currency = "OMR",
                today = todayCount,
                upcoming = upcomingCount,
                pending = pendingCount,
                customers,
                revenue = new { thisMonth = monthRevenue, total = totalRevenue },
                nextAppointments = next.Select(b => BookingMapper.ToDto(b, forCustomer: false, includeCustomer: true, _clock, _policy)).ToList()
            });
        }

        /// <summary>
        /// The salon's bookings. scope: today | upcoming (default) | past | all. Optional status filter, paged.
        /// Each booking lists the status changes currently allowed (allowedStatuses).
        /// </summary>
        [HttpGet("appointments")]
        public async Task<IActionResult> GetAppointments(
            [FromQuery] string scope = "upcoming", [FromQuery] BookingStatus? status = null,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var salonId = await GetSalonIdAsync();
            if (salonId == null) return NoSalon();
            var id = salonId.Value;

            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 50);
            var today = _clock.LocalNow.Date;

            var query = BookingsWithDetails().Where(b => b.SalonId == id);
            var ascending = true;

            switch ((scope ?? "upcoming").ToLowerInvariant())
            {
                case "today":
                    query = query.Where(b => b.BookingDate == today);
                    break;
                case "past":
                    query = query.Where(b => b.BookingDate < today);
                    ascending = false;
                    break;
                case "all":
                    ascending = false;
                    break;
                default:
                    query = query.Where(b => b.BookingDate > today);
                    if (!status.HasValue) query = query.Where(b => b.Status != BookingStatus.Cancelled);
                    break;
            }

            if (status.HasValue) query = query.Where(b => b.Status == status.Value);

            var total = await query.CountAsync();
            var ordered = ascending
                ? query.OrderBy(b => b.BookingDate).ThenBy(b => b.StartTime)
                : query.OrderByDescending(b => b.BookingDate).ThenByDescending(b => b.StartTime);
            var rows = await ordered.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            var all = _context.Bookings.AsNoTracking().Where(b => b.SalonId == id);
            var counts = new
            {
                today = await all.CountAsync(b => b.BookingDate == today),
                upcoming = await all.CountAsync(b => b.BookingDate > today && b.Status != BookingStatus.Cancelled),
                past = await all.CountAsync(b => b.BookingDate < today)
            };

            return Ok(new
            {
                success = true,
                bookings = rows.Select(b => BookingMapper.ToDto(b, forCustomer: false, includeCustomer: true, _clock, _policy)).ToList(),
                total,
                page,
                pageSize,
                counts
            });
        }
    }

    public record SalonProfileRequest(string? Name, string? NameAr, string? About, string? AboutAr, string? Phone, string? Email);
    public record BranchRequest(string? Name, string? NameAr, string? AddressLine, string? City, string? PhoneNumber, bool? IsActive);
    public record WorkingHoursEntry(int Day, TimeSpan OpenTime, TimeSpan CloseTime, bool IsClosed);
    public record ServiceRequest(string? Name, string? NameAr, string? Description, string? DescriptionAr, string? Category,
        int DurationMinutes, decimal Price, bool? IsActive);
    public record StylistRequest(string? Name, string? NameAr, Guid? BranchId, int YearsOfExperience, List<Guid>? ServiceIds, bool? IsActive);
    public record OffDayRequest(DateOnly Date, string? Reason);
}
