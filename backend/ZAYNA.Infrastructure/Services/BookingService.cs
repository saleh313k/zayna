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

            var offDays = await _offDayRepository.FindAsync(o =>
                o.StylistId == stylistId &&
                o.OffDate.Date == date.Date);

            if (offDays.Any()) return availableSlots;

            var stylist = await _context.Stylists
                .Include(s => s.Branch)
                .ThenInclude(b => b.WorkingHours)
                .FirstOrDefaultAsync(s => s.Id == stylistId);

            if (stylist?.Branch == null) return availableSlots;

            var workingHours = stylist.Branch.WorkingHours
                .FirstOrDefault(w => (int)w.DayOfWeek == (int)date.DayOfWeek);

            if (workingHours == null || workingHours.IsClosed) return availableSlots;

            var existingBookings = await _bookingRepository.FindAsync(b =>
                b.StylistId == stylistId &&
                b.BookingDate.Date == date.Date &&
                b.Status != BookingStatus.Cancelled);

            var currentTime = workingHours.OpenTime;
            var slotDuration = TimeSpan.FromMinutes(30);

            while (currentTime.Add(slotDuration) <= workingHours.CloseTime)
            {
                var isAvailable = !existingBookings.Any(b =>
                    currentTime >= b.StartTime && currentTime < b.EndTime);

                if (isAvailable &&
                    (date.Date > DateTime.UtcNow.Date ||
                    (date.Date == DateTime.UtcNow.Date &&
                     currentTime > DateTime.UtcNow.TimeOfDay)))
                {
                    availableSlots.Add(currentTime);
                }

                currentTime = currentTime.Add(slotDuration);
            }

            return availableSlots;
        }
    }
}
