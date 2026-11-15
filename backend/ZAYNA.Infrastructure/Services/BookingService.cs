using Microsoft.Data.SqlClient;
using Zayna.Core.Exceptions;
using Zayna.Core.Interfaces;
using ZAYNA.Infrastructure.Data;
using ZAYNA.Core.Enums;

namespace ZAYNA.Infrastructure.Services
{
    public class BookingService : IBookingService
    {
        private const int AppLockFailedNumber = 51000;

        // Valid status changes. Anything not listed (including every change out of a final state) is rejected.
        private static readonly Dictionary<BookingStatus, BookingStatus[]> AllowedTransitions = new()
        {
            [BookingStatus.Pending] = new[] { BookingStatus.Confirmed, BookingStatus.Cancelled },
            [BookingStatus.Confirmed] = new[] { BookingStatus.InProgress, BookingStatus.Completed, BookingStatus.NoShow, BookingStatus.Cancelled },
            [BookingStatus.InProgress] = new[] { BookingStatus.Completed },
        };

        /// <summary>
        /// The statuses a booking can move to right now: valid transitions only, and InProgress / Completed / NoShow
        /// only once the appointment has started. Cancelled is always allowed from Pending / Confirmed.
        /// </summary>
        public static IReadOnlyList<BookingStatus> GetAllowedTransitions(BookingStatus current, DateTime start, DateTime localNow)
        {
            if (!AllowedTransitions.TryGetValue(current, out var next))
                return Array.Empty<BookingStatus>();

            return next.Where(s => !RequiresStarted(s) || localNow >= start).ToList();
        }

        private static bool RequiresStarted(BookingStatus status) =>
            status == BookingStatus.InProgress || status == BookingStatus.Completed || status == BookingStatus.NoShow;

        private readonly ApplicationDbContext _context;
        private readonly IRepository<StylistOffDay> _offDayRepository;
        private readonly ISalonClock _clock;
        private readonly BookingPolicy _policy;

        public BookingService(
            ApplicationDbContext context,
            IRepository<StylistOffDay> offDayRepository,
            ISalonClock clock,
            BookingPolicy policy)
        {
            _context = context;
            _offDayRepository = offDayRepository;
            _clock = clock;
            _policy = policy;
        }

        // =====================================================================
        // CREATE (atomic)
        // =====================================================================
        public async Task<Booking> CreateBookingAsync(Booking booking)
        {
            var date = booking.BookingDate.Date;
            booking.BookingDate = date;

            await using var tx = await _context.Database.BeginTransactionAsync();

            // One booking at a time per stylist per day: concurrent requests for the same stylist/day queue
            // here, so the availability re-check below sees every booking committed before ours.
            // The lock is transaction-scoped and released automatically on commit/rollback.
            var resource = $"zayna:booking:{booking.StylistId:N}:{date:yyyyMMdd}";
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync($@"
                    DECLARE @r int;
                    EXEC @r = sp_getapplock @Resource = {resource}, @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 10000;
                    IF @r < 0 THROW 51000, 'Could not acquire the booking lock.', 1;");
            }
            catch (SqlException ex) when (ex.Number == AppLockFailedNumber)
            {
                throw new AppException("BOOKING_BUSY",
                    "This stylist is being booked by other customers right now. Please try again in a moment.", 503);
            }

            var slots = await GetAvailableTimeSlotsAsync(booking.StylistId, booking.ServiceId, date);
            if (!slots.Contains(booking.StartTime))
                throw new AppException("SLOT_UNAVAILABLE",
                    "The selected time is no longer available. Please choose another time.", 409);

            var now = DateTime.UtcNow;
            booking.Status = _policy.AutoConfirm ? BookingStatus.Confirmed : BookingStatus.Pending;
            booking.BookingNumber = await GenerateBookingNumberAsync();
            booking.CreatedAt = now;
            booking.UpdatedAt = now;

            _context.Bookings.Add(booking);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
            {
                // Database-level backstop (unique index on stylist + date + start time).
                throw new AppException("SLOT_UNAVAILABLE",
                    "The selected time is no longer available. Please choose another time.", 409);
            }

            await tx.CommitAsync();
            return booking;
        }

        private async Task<string> GenerateBookingNumberAsync()
        {
            // Unambiguous characters only (no 0/O, 1/I).
            const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            var prefix = $"ZN-{_clock.LocalNow:yyMMdd}-";

            for (var attempt = 0; attempt < 10; attempt++)
            {
                var chars = new char[5];
                for (var i = 0; i < chars.Length; i++)
                    chars[i] = alphabet[System.Security.Cryptography.RandomNumberGenerator.GetInt32(alphabet.Length)];

                var number = prefix + new string(chars);
                if (!await _context.Bookings.AnyAsync(b => b.BookingNumber == number))
                    return number;
            }

            throw new InvalidOperationException("Could not generate a unique booking number.");
        }

        // =====================================================================
        // READ
        // =====================================================================
        public async Task<Booking?> GetBookingByIdAsync(Guid id)
        {
            return await _context.Bookings
                .Include(b => b.Customer).ThenInclude(c => c.User)
                .Include(b => b.Salon)
                .Include(b => b.Branch)
                .Include(b => b.Stylist)
                .Include(b => b.Service)
                .Include(b => b.Payment)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<IEnumerable<Booking>> GetCustomerBookingsAsync(Guid customerId)
        {
            return await _context.Bookings
                .AsNoTracking()
                .Include(b => b.Salon)
                .Include(b => b.Branch)
                .Include(b => b.Stylist)
                .Include(b => b.Service)
                .Include(b => b.Payment)
                .Where(b => b.CustomerId == customerId)
                .OrderByDescending(b => b.BookingDate)
                .ThenByDescending(b => b.StartTime)
                .ToListAsync();
        }

        public async Task<IEnumerable<Booking>> GetSalonBookingsAsync(Guid salonId, DateTime? date)
        {
            var query = _context.Bookings
                .AsNoTracking()
                .Include(b => b.Customer).ThenInclude(c => c.User)
                .Include(b => b.Salon)
                .Include(b => b.Branch)
                .Include(b => b.Stylist)
                .Include(b => b.Service)
                .Include(b => b.Payment)
                .Where(b => b.SalonId == salonId);

            if (date.HasValue)
            {
                var day = date.Value.Date;
                query = query.Where(b => b.BookingDate == day);
            }

            return await query
                .OrderByDescending(b => b.BookingDate)
                .ThenByDescending(b => b.StartTime)
                .ToListAsync();
        }

        // =====================================================================
        // CANCEL / STATUS
        // =====================================================================
        public async Task<bool> CancelBookingAsync(Guid bookingId, string? reason, bool applyCustomerCutoff = false)
        {
            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId);
            if (booking == null) return false;

            if (booking.Status != BookingStatus.Pending && booking.Status != BookingStatus.Confirmed)
                throw new AppException("BOOKING_NOT_CANCELLABLE",
                    "Only pending or confirmed bookings can be cancelled.", 409);

            if (applyCustomerCutoff)
            {
                var start = booking.BookingDate.Date + booking.StartTime;
                if (start - _clock.LocalNow < TimeSpan.FromHours(_policy.CancellationCutoffHours))
                    throw new AppException("CANCELLATION_TOO_LATE",
                        $"Bookings can only be cancelled at least {_policy.CancellationCutoffHours} hour(s) before the appointment. Please contact the salon.", 409);
            }

            var cleanReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
            if (cleanReason is { Length: > 500 }) cleanReason = cleanReason[..500];

            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = cleanReason;
            booking.CancelledAt = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateBookingStatusAsync(Guid bookingId, BookingStatus status)
        {
            if (status == BookingStatus.Cancelled)
                return await CancelBookingAsync(bookingId, "Cancelled by the salon.", applyCustomerCutoff: false);

            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId);
            if (booking == null) return false;

            if (!AllowedTransitions.TryGetValue(booking.Status, out var allowed) || !allowed.Contains(status))
                throw new AppException("INVALID_STATUS_TRANSITION",
                    $"A {booking.Status} booking cannot be changed to {status}.", 409);

            // The appointment must have started before it can be in progress, completed or a no-show.
            var start = booking.BookingDate.Date + booking.StartTime;
            if (RequiresStarted(status) && _clock.LocalNow < start)
                throw new AppException("TOO_EARLY",
                    "This status can only be set once the appointment time has started.", 409);

            booking.Status = status;
            booking.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        // =====================================================================
        // AVAILABILITY
        // =====================================================================
        public async Task<IEnumerable<TimeSpan>> GetAvailableTimeSlotsAsync(Guid stylistId, Guid serviceId, DateTime date)
        {
            var slots = new List<TimeSpan>();
            var requestedDate = date.Date;
            var localNow = _clock.LocalNow;
            var today = localNow.Date;

            if (requestedDate < today || requestedDate > today.AddDays(_policy.MaxDaysAhead))
                return slots;

            var service = await _context.Services.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == serviceId && s.IsActive);
            if (service == null || service.DurationMinutes <= 0)
                return slots;

            // Salons that an admin has not approved (or has suspended) cannot take bookings.
            var salonApproved = await _context.Salons.AnyAsync(s => s.Id == service.SalonId && s.IsVerified);
            if (!salonApproved)
                return slots;

            var stylist = await _context.Stylists.AsNoTracking()
                .Include(s => s.Branch)
                .ThenInclude(b => b!.WorkingHours)
                .FirstOrDefaultAsync(s => s.Id == stylistId && s.IsActive);
            if (stylist?.Branch == null || !stylist.Branch.IsActive || stylist.SalonId != service.SalonId)
                return slots;

            var canPerformService = await _context.StylistServices.AnyAsync(ss =>
                ss.StylistId == stylistId && ss.ServiceId == serviceId);
            if (!canPerformService)
                return slots;

            if (await _offDayRepository.ExistsAsync(o => o.StylistId == stylistId && o.OffDate.Date == requestedDate))
                return slots;

            var hours = stylist.Branch.WorkingHours
                .FirstOrDefault(w => (int)w.DayOfWeek == (int)requestedDate.DayOfWeek);
            if (hours == null || hours.IsClosed || hours.CloseTime <= hours.OpenTime)
                return slots;

            var existing = await _context.Bookings.AsNoTracking()
                .Where(b => b.StylistId == stylistId &&
                            b.BookingDate.Date == requestedDate &&
                            b.Status != BookingStatus.Cancelled)
                .Select(b => new { b.StartTime, b.EndTime })
                .ToListAsync();

            var duration = TimeSpan.FromMinutes(service.DurationMinutes);
            var interval = TimeSpan.FromMinutes(_policy.SlotIntervalMinutes);
            var earliest = requestedDate == today
                ? localNow.TimeOfDay.Add(TimeSpan.FromMinutes(_policy.MinLeadMinutes))
                : TimeSpan.Zero;

            for (var start = hours.OpenTime; start.Add(duration) <= hours.CloseTime; start = start.Add(interval))
            {
                if (start < earliest) continue;

                var end = start.Add(duration);
                var overlaps = existing.Any(b => start < b.EndTime && end > b.StartTime);
                if (!overlaps) slots.Add(start);
            }

            return slots;
        }
    }
}
