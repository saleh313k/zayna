// ZAYNA.API/Controllers/BookingController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Zayna.API.Mapping;
using Zayna.Core.DTOs;
using Zayna.Core.Interfaces;
using ZAYNA.Core.Entities;
using ZAYNA.Core.Enums;
using ZAYNA.Core.Interfaces;
using ZAYNA.Infrastructure.Services;

namespace Zayna.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private const int MaxNotesLength = 500;

        private readonly IBookingService _bookingService;
        private readonly IRepository<Service> _serviceRepository;
        private readonly IRepository<Customer> _customerRepository;
        private readonly IRepository<Salon> _salonRepository;
        private readonly IRepository<Branch> _branchRepository;
        private readonly IRepository<Stylist> _stylistRepository;
        private readonly IPaymentService _paymentService;
        private readonly INotificationService _notificationService;
        private readonly ILoyaltyService _loyaltyService;
        private readonly ISalonClock _clock;
        private readonly BookingPolicy _policy;
        private readonly ILogger<BookingController> _logger;

        public BookingController(
            IBookingService bookingService,
            IRepository<Service> serviceRepository,
            IRepository<Customer> customerRepository,
            IRepository<Salon> salonRepository,
            IRepository<Branch> branchRepository,
            IRepository<Stylist> stylistRepository,
            IPaymentService paymentService,
            INotificationService notificationService,
            ILoyaltyService loyaltyService,
            ISalonClock clock,
            BookingPolicy policy,
            ILogger<BookingController> logger)
        {
            _bookingService = bookingService;
            _serviceRepository = serviceRepository;
            _customerRepository = customerRepository;
            _salonRepository = salonRepository;
            _branchRepository = branchRepository;
            _stylistRepository = stylistRepository;
            _paymentService = paymentService;
            _notificationService = notificationService;
            _loyaltyService = loyaltyService;
            _clock = clock;
            _policy = policy;
            _logger = logger;
        }

        // =====================================================================
        // AVAILABILITY
        // =====================================================================

        /// <summary>Free start times (salon local time, "HH:mm:ss") for a stylist + service on a date (yyyy-MM-dd).</summary>
        [HttpGet("available-slots")]
        public async Task<IActionResult> GetAvailableSlots(
            [FromQuery] Guid stylistId,
            [FromQuery] Guid serviceId,
            [FromQuery] DateOnly date)
        {
            var slots = await _bookingService.GetAvailableTimeSlotsAsync(
                stylistId, serviceId, date.ToDateTime(TimeOnly.MinValue));

            return Ok(new
            {
                success = true,
                slots = slots.Select(s => s.ToString(@"hh\:mm\:ss"))
            });
        }

        // =====================================================================
        // CREATE
        // =====================================================================

        /// <summary>
        /// Create a booking for the authenticated customer. The customer, price and end time are always
        /// derived on the server; nothing price- or identity-related is trusted from the request.
        /// </summary>
        [Authorize(Roles = "Customer")]
        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var customer = await _customerRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null)
                return BadRequest(new { success = false, code = "NO_CUSTOMER_PROFILE", message = "Customer profile not found for the authenticated user." });

            var paymentType = request.PaymentType ?? PaymentType.InPerson;
            if (!Enum.IsDefined(typeof(PaymentType), paymentType))
                return BadRequest(new { success = false, code = "INVALID_PAYMENT_TYPE", message = "Invalid payment type." });
            if (paymentType == PaymentType.Online && !_policy.OnlinePaymentEnabled)
                return BadRequest(new { success = false, code = "ONLINE_PAYMENT_UNAVAILABLE", message = "Online payment is not available yet. Please choose to pay at the salon." });

            var notes = request.Notes?.Trim();
            if (notes is { Length: > MaxNotesLength })
                return BadRequest(new { success = false, code = "NOTES_TOO_LONG", message = $"Notes must be at most {MaxNotesLength} characters." });

            if (!await _salonRepository.ExistsAsync(s => s.Id == request.SalonId && s.IsVerified))
                return BadRequest(new { success = false, code = "SALON_UNAVAILABLE", message = "This salon is not available for booking." });

            var service = await _serviceRepository.GetByIdAsync(request.ServiceId);
            if (service == null || !service.IsActive || service.SalonId != request.SalonId)
                return BadRequest(new { success = false, code = "INVALID_SERVICE", message = "Invalid or unavailable service for this salon." });

            var branch = await _branchRepository.GetByIdAsync(request.BranchId);
            if (branch == null || !branch.IsActive || branch.SalonId != request.SalonId)
                return BadRequest(new { success = false, code = "INVALID_BRANCH", message = "Invalid or unavailable branch for this salon." });

            var stylist = await _stylistRepository.GetByIdAsync(request.StylistId);
            if (stylist == null || !stylist.IsActive || stylist.SalonId != request.SalonId || stylist.BranchId != request.BranchId)
                return BadRequest(new { success = false, code = "INVALID_STYLIST", message = "Invalid or unavailable stylist for this salon and branch." });

            if (service.DurationMinutes <= 0 ||
                request.StartTime < TimeSpan.Zero ||
                request.StartTime.Add(TimeSpan.FromMinutes(service.DurationMinutes)) > TimeSpan.FromDays(1))
                return BadRequest(new { success = false, code = "INVALID_TIME", message = "Invalid booking time or service duration." });

            var booking = new Booking
            {
                CustomerId = customer.Id,
                SalonId = request.SalonId,
                BranchId = request.BranchId,
                StylistId = request.StylistId,
                ServiceId = request.ServiceId,
                BookingDate = request.BookingDate.ToDateTime(TimeOnly.MinValue),
                StartTime = request.StartTime,
                EndTime = request.StartTime.Add(TimeSpan.FromMinutes(service.DurationMinutes)),
                TotalAmount = service.Price,
                PaymentType = paymentType,
                Notes = string.IsNullOrWhiteSpace(notes) ? null : notes
            };

            // Atomic: re-checks availability under a per-stylist lock. Throws a 409 AppException if the slot was taken
            // (also covers dates in the past / too far ahead, closed days, off days and non-working hours).
            await _bookingService.CreateBookingAsync(booking);

            var created = await _bookingService.GetBookingByIdAsync(booking.Id) ?? booking;

            if (paymentType == PaymentType.Online)
            {
                var (success, transactionId, checkoutUrl) = await _paymentService.CreatePaymentAsync(created);
                if (success)
                {
                    return Ok(new { success = true, booking = ToDto(created, forCustomer: true, includeCustomer: false), checkoutUrl, transactionId });
                }

                await _bookingService.CancelBookingAsync(created.Id, "Online payment initialization failed.");
                return StatusCode(StatusCodes.Status502BadGateway, new
                {
                    success = false,
                    code = "PAYMENT_INIT_FAILED",
                    message = "Unable to initialize online payment. Please try booking again."
                });
            }

            // Notifications are best-effort: the booking already exists and must never be reported as failed.
            if (created.Status == BookingStatus.Confirmed)
            {
                try
                {
                    await _notificationService.SendBookingConfirmationAsync(created);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Booking confirmation notification failed for booking {BookingId}", created.Id);
                }
            }

            return Ok(new { success = true, booking = ToDto(created, forCustomer: true, includeCustomer: false) });
        }

        // =====================================================================
        // READ
        // =====================================================================

        [Authorize(Roles = "Customer")]
        [HttpGet("my-bookings")]
        public async Task<IActionResult> GetMyBookings()
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var customer = await _customerRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null)
                return Ok(new { success = true, bookings = Array.Empty<BookingResponseDto>() });

            var bookings = await _bookingService.GetCustomerBookingsAsync(customer.Id);
            return Ok(new
            {
                success = true,
                bookings = bookings.Select(b => ToDto(b, forCustomer: true, includeCustomer: false)).ToList()
            });
        }

        /// <summary>A single booking. Visible to its customer, the owning salon (or its stylist) and admins.</summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetBooking(Guid id)
        {
            var booking = await _bookingService.GetBookingByIdAsync(id);
            // Same response for "missing" and "not yours": do not reveal which booking ids exist.
            if (booking == null || !await CanManageBookingAsync(booking))
                return NotFound(new { success = false, code = "BOOKING_NOT_FOUND", message = "Booking not found." });

            var forCustomer = User.IsInRole("Customer");
            return Ok(new { success = true, booking = ToDto(booking, forCustomer, includeCustomer: !forCustomer) });
        }

        [Authorize(Roles = "Salon,Admin")]
        [HttpGet("salon/{salonId:guid}")]
        public async Task<IActionResult> GetSalonBookings(Guid salonId, [FromQuery] DateOnly? date)
        {
            if (!User.IsInRole("Admin"))
            {
                if (!TryGetCurrentUserId(out var userId))
                    return Unauthorized();

                var ownsSalon = await _salonRepository.ExistsAsync(s => s.Id == salonId && s.UserId == userId);
                if (!ownsSalon)
                    return Forbid();
            }
            else if (!await _salonRepository.ExistsAsync(s => s.Id == salonId))
            {
                return NotFound(new { success = false, message = "Salon not found." });
            }

            var bookings = await _bookingService.GetSalonBookingsAsync(salonId, date?.ToDateTime(TimeOnly.MinValue));
            return Ok(new
            {
                success = true,
                bookings = bookings.Select(b => ToDto(b, forCustomer: false, includeCustomer: true)).ToList()
            });
        }

        // =====================================================================
        // CANCEL / STATUS
        // =====================================================================

        [HttpPost("{id:guid}/cancel")]
        public async Task<IActionResult> CancelBooking(Guid id, [FromBody] CancelBookingRequest? request)
        {
            var booking = await _bookingService.GetBookingByIdAsync(id);
            if (booking == null || !await CanManageBookingAsync(booking))
                return NotFound(new { success = false, code = "BOOKING_NOT_FOUND", message = "Booking not found." });

            // Customers are bound by the cancellation notice period; salon staff and admins are not.
            var isCustomer = User.IsInRole("Customer");
            var result = await _bookingService.CancelBookingAsync(id, request?.Reason, applyCustomerCutoff: isCustomer);
            if (!result)
                return NotFound(new { success = false, code = "BOOKING_NOT_FOUND", message = "Booking not found." });

            return Ok(new { success = true, message = "Booking cancelled successfully" });
        }

        [Authorize(Roles = "Salon,Stylist,Admin")]
        [HttpPut("{id:guid}/status")]
        public async Task<IActionResult> UpdateBookingStatus(Guid id, [FromBody] UpdateBookingStatusRequest request)
        {
            if (!Enum.IsDefined(typeof(BookingStatus), request.Status))
                return BadRequest(new { success = false, message = "Invalid booking status." });

            var booking = await _bookingService.GetBookingByIdAsync(id);
            if (booking == null || !await CanManageBookingAsync(booking, allowCustomer: false))
                return NotFound(new { success = false, code = "BOOKING_NOT_FOUND", message = "Booking not found." });

            var customerId = booking.CustomerId;
            var bookingNumber = booking.BookingNumber;

            var result = await _bookingService.UpdateBookingStatusAsync(id, request.Status);
            if (!result)
                return NotFound(new { success = false, code = "BOOKING_NOT_FOUND", message = "Booking not found." });

            // Loyalty points are earned for completed appointments only (not for bookings that may be cancelled).
            if (request.Status == BookingStatus.Completed)
            {
                try
                {
                    await _loyaltyService.AddPointsAsync(customerId, 10, $"Booking #{bookingNumber}");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Awarding loyalty points failed for booking {BookingId}", id);
                }
            }

            return Ok(new { success = true, message = "Booking status updated" });
        }

        // =====================================================================
        // HELPERS
        // =====================================================================

        private BookingResponseDto ToDto(Booking b, bool forCustomer, bool includeCustomer)
            => BookingMapper.ToDto(b, forCustomer, includeCustomer, _clock, _policy);

        private bool TryGetCurrentUserId(out Guid userId)
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(value, out userId);
        }

        private async Task<bool> CanManageBookingAsync(Booking booking, bool allowCustomer = true)
        {
            if (User.IsInRole("Admin"))
                return true;

            if (!TryGetCurrentUserId(out var userId))
                return false;

            if (allowCustomer && User.IsInRole("Customer"))
            {
                var ownsBooking = await _customerRepository.ExistsAsync(
                    c => c.Id == booking.CustomerId && c.UserId == userId);
                if (ownsBooking)
                    return true;
            }

            if (User.IsInRole("Salon"))
            {
                var ownsSalon = await _salonRepository.ExistsAsync(
                    s => s.Id == booking.SalonId && s.UserId == userId);
                if (ownsSalon)
                    return true;
            }

            if (User.IsInRole("Stylist"))
            {
                var assignedStylist = await _stylistRepository.ExistsAsync(
                    s => s.Id == booking.StylistId && s.UserId == userId);
                if (assignedStylist)
                    return true;
            }

            return false;
        }
    }

    /// <summary>
    /// BookingDate is a calendar date ("yyyy-MM-dd", salon local date) and StartTime a local time ("HH:mm:ss"),
    /// so no time-zone conversion can shift the appointment to another day. CustomerId / price are never accepted.
    /// </summary>
    public record CreateBookingRequest(
        Guid SalonId,
        Guid BranchId,
        Guid StylistId,
        Guid ServiceId,
        DateOnly BookingDate,
        TimeSpan StartTime,
        PaymentType? PaymentType,
        string? Notes);

    public record CancelBookingRequest(string? Reason);
    public record UpdateBookingStatusRequest(BookingStatus Status);
}
