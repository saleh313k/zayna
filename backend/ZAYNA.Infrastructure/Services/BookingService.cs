using ZAYNA.Infrastructure.Data;
using ZAYNA.Core.Enums;


namespace ZAYNA.Infrastructure.Services
{
    public class BookingService : IBookingService
    {
        private readonly ApplicationDbContext _context;
        private readonly IRepository<Booking> _bookingRepository;
        private readonly IRepository<StylistOffDay> _offDayRepository;
        private readonly IRepository<BranchWorkingHours> _workingHoursRepository;

        public BookingService(
            ApplicationDbContext context,
            IRepository<Booking> bookingRepository,
            IRepository<StylistOffDay> offDayRepository,
            IRepository<BranchWorkingHours> workingHoursRepository)
        {
            _context = context;
            _bookingRepository = bookingRepository;
            _offDayRepository = offDayRepository;
            _workingHoursRepository = workingHoursRepository;
        }

        // -------------------------
        // IBookingService Methods
        // -------------------------

        public async Task<Booking> CreateBookingAsync(
            Booking booking)
        {
            booking.Status = BookingStatus.Pending;
            booking.CreatedAt = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;


            return await _bookingRepository.AddAsync(booking);
        }

        public async Task<Booking?> GetBookingByIdAsync(Guid id)
        {
            return await _context.Bookings
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
                .Include(b => b.Customer)
                .Include(b => b.Branch)
                .Include(b => b.Stylist)
                .Include(b => b.Service)
                .Include(b => b.Payment)
                .Where(b => b.SalonId == salonId);

            if (date.HasValue)
                query = query.Where(b => b.BookingDate == date.Value.Date);

            return await query
                .OrderByDescending(b => b.BookingDate)
                .ThenByDescending(b => b.StartTime)
                .ToListAsync();
        }

        public async Task<bool> CancelBookingAsync(Guid bookingId, string reason)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId);
            if (booking == null) return false;

            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = reason;
            booking.CancelledAt = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;

            await _bookingRepository.UpdateAsync(booking);
            return true;
        }

        public async Task<bool> UpdateBookingStatusAsync(Guid bookingId, BookingStatus status)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId);
            if (booking == null) return false;

            booking.Status = status;
            booking.UpdatedAt = DateTime.UtcNow;

            await _bookingRepository.UpdateAsync(booking);
            return true;
        }

        public async Task<IEnumerable<TimeSpan>> GetAvailableTimeSlotsAsync(Guid stylistId, Guid serviceId, DateTime date)
        {
            var availableSlots = new List<TimeSpan>();
            var requestedDate = date.Date;

            var service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == serviceId && s.IsActive);
            if (service == null || service.DurationMinutes <= 0)
                return availableSlots;

            var stylist = await _context.Stylists
                .Include(s => s.Branch)
                .ThenInclude(b => b.WorkingHours)
                .FirstOrDefaultAsync(s => s.Id == stylistId && s.IsActive);
            if (stylist?.Branch == null || stylist.SalonId != service.SalonId)
                return availableSlots;

            var canPerformService = await _context.StylistServices.AnyAsync(ss =>
                ss.StylistId == stylistId && ss.ServiceId == serviceId);
            if (!canPerformService)
                return availableSlots;

            var offDays = await _offDayRepository.FindAsync(o =>
                o.StylistId == stylistId &&
                o.OffDate.Date == requestedDate);
            if (offDays.Any())
                return availableSlots;

            var workingHours = stylist.Branch.WorkingHours
                .FirstOrDefault(w => (int)w.DayOfWeek == (int)requestedDate.DayOfWeek);
            if (workingHours == null || workingHours.IsClosed || workingHours.CloseTime <= workingHours.OpenTime)
                return availableSlots;

            var duration = TimeSpan.FromMinutes(service.DurationMinutes);
            var existingBookings = await _context.Bookings
                .Where(b => b.StylistId == stylistId &&
                            b.BookingDate.Date == requestedDate &&
                            b.Status != BookingStatus.Cancelled)
                .Select(b => new { b.StartTime, b.EndTime })
                .ToListAsync();

            var now = DateTime.UtcNow;
            var currentTime = workingHours.OpenTime;
            var slotInterval = TimeSpan.FromMinutes(30);

            while (currentTime.Add(duration) <= workingHours.CloseTime)
            {
                var proposedEnd = currentTime.Add(duration);
                var overlaps = existingBookings.Any(b =>
                    currentTime < b.EndTime && proposedEnd > b.StartTime);

                var isFutureSlot = requestedDate > now.Date ||
                    (requestedDate == now.Date && currentTime > now.TimeOfDay);

                if (!overlaps && isFutureSlot)
                    availableSlots.Add(currentTime);

                currentTime = currentTime.Add(slotInterval);
            }

            return availableSlots;
        }
    }
}
