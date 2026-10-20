// ZAYNA.API/Controllers/BookingController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ZAYNA.Core.Entities;
using ZAYNA.Core.Enums;
using ZAYNA.Core.Interfaces;

namespace Zayna.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _bookingService;
        private readonly IRepository<Service> _serviceRepository;
        private readonly IRepository<Customer> _customerRepository;
        private readonly IRepository<Salon> _salonRepository;
        private readonly IRepository<Branch> _branchRepository;
        private readonly IRepository<Stylist> _stylistRepository;
        private readonly IPaymentService _paymentService;
        private readonly INotificationService _notificationService;
        private readonly ILoyaltyService _loyaltyService;

        public BookingController(
            IBookingService bookingService,
            IRepository<Service> serviceRepository,
            IRepository<Customer> customerRepository,
            IRepository<Salon> salonRepository,
            IRepository<Branch> branchRepository,
            IRepository<Stylist> stylistRepository,
            IPaymentService paymentService,
            INotificationService notificationService,
            ILoyaltyService loyaltyService)
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
        }

        [HttpGet("available-slots")]
        public async Task<IActionResult> GetAvailableSlots(
            [FromQuery] Guid stylistId,
            [FromQuery] Guid serviceId,
            [FromQuery] DateTime date)
        {
            var slots = await _bookingService.GetAvailableTimeSlotsAsync(stylistId, serviceId, date);
            return Ok(new { success = true, slots });
        }

        /// <summary>
        /// Create a booking for the authenticated customer. CustomerId from the body is never trusted.
        /// </summary>
        [Authorize(Roles = "Customer")]
        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var customer = await _customerRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Customer profile not found for the authenticated user."
                });
            }

            var service = await _serviceRepository.GetByIdAsync(request.ServiceId);
            if (service == null || !service.IsActive || service.SalonId != request.SalonId)
                return BadRequest(new { success = false, message = "Invalid or unavailable service for this salon." });

            var branch = await _branchRepository.GetByIdAsync(request.BranchId);
            if (branch == null || !branch.IsActive || branch.SalonId != request.SalonId)
                return BadRequest(new { success = false, message = "Invalid or unavailable branch for this salon." });

            var stylist = await _stylistRepository.GetByIdAsync(request.StylistId);
            if (stylist == null ||
                !stylist.IsActive ||
                stylist.SalonId != request.SalonId ||
                (stylist.BranchId.HasValue && stylist.BranchId.Value != request.BranchId))
            {
                return BadRequest(new { success = false, message = "Invalid or unavailable stylist for this salon and branch." });
            }

            if (request.BookingDate.Date < DateTime.UtcNow.Date ||
                request.StartTime < TimeSpan.Zero ||
                request.StartTime >= TimeSpan.FromDays(1) ||
                service.DurationMinutes <= 0 ||
                request.StartTime.Add(TimeSpan.FromMinutes(service.DurationMinutes)) > TimeSpan.FromDays(1))
            {
                return BadRequest(new { success = false, message = "Invalid booking date, time, or service duration." });
            }

            var availableSlots = await _bookingService.GetAvailableTimeSlotsAsync(
                request.StylistId, request.ServiceId, request.BookingDate);
            if (!availableSlots.Contains(request.StartTime))
            {
                return Conflict(new { success = false, message = "The selected time slot is unavailable. Please choose another time." });
            }

            if (!Enum.IsDefined(typeof(PaymentType), request.PaymentType))
                return BadRequest(new { success = false, message = "Invalid payment type." });

            var booking = new Booking
            {
                CustomerId = customer.Id,
                SalonId = request.SalonId,
                BranchId = request.BranchId,
                StylistId = request.StylistId,
                ServiceId = request.ServiceId,
                BookingDate = request.BookingDate,
                StartTime = request.StartTime,
                EndTime = request.StartTime.Add(TimeSpan.FromMinutes(service.DurationMinutes)),
                TotalAmount = service.Price,
                PaymentType = request.PaymentType,
                Notes = request.Notes
            };

            var createdBooking = await _bookingService.CreateBookingAsync(booking);

            if (request.PaymentType == PaymentType.Online)
            {
                var (success, transactionId, checkoutUrl) = await _paymentService.CreatePaymentAsync(createdBooking);
                if (success)
                {
                    return Ok(new
                    {
                        success = true,
                        booking = createdBooking,
                        checkoutUrl,
                        transactionId
                    });
                }

                await _bookingService.CancelBookingAsync(
                    createdBooking.Id,
                    "Online payment initialization failed.");

                return StatusCode(StatusCodes.Status502BadGateway, new
                {
                    success = false,
                    message = "Unable to initialize online payment. Please try booking again."
                });
            }

            await _notificationService.SendBookingConfirmationAsync(createdBooking);
            await _loyaltyService.AddPointsAsync(
                customer.Id,
                10,
                $"Booking #{createdBooking.BookingNumber}");

            return Ok(new { success = true, booking = createdBooking });
        }

        [Authorize(Roles = "Customer")]
        [HttpGet("my-bookings")]
        public async Task<IActionResult> GetMyBookings()
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var customer = await _customerRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null)
                return Ok(new { success = true, bookings = Array.Empty<Booking>() });

            var bookings = await _bookingService.GetCustomerBookingsAsync(customer.Id);
            return Ok(new { success = true, bookings });
        }

        [Authorize(Roles = "Salon,Admin")]
        [HttpGet("salon/{salonId}")]
        public async Task<IActionResult> GetSalonBookings(Guid salonId, [FromQuery] DateTime? date)
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

            var bookings = await _bookingService.GetSalonBookingsAsync(salonId, date);
            return Ok(new { success = true, bookings });
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelBooking(Guid id, [FromBody] CancelBookingRequest request)
        {
            var booking = await _bookingService.GetBookingByIdAsync(id);
            if (booking == null)
                return NotFound(new { success = false, message = "Booking not found" });

            if (!await CanManageBookingAsync(booking))
                return Forbid();

            var result = await _bookingService.CancelBookingAsync(id, request.Reason);
            if (!result)
                return NotFound(new { success = false, message = "Booking not found" });

            return Ok(new { success = true, message = "Booking cancelled successfully" });
        }

        [Authorize(Roles = "Salon,Stylist,Admin")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateBookingStatus(Guid id, [FromBody] UpdateBookingStatusRequest request)
        {
            if (!Enum.IsDefined(typeof(BookingStatus), request.Status))
                return BadRequest(new { success = false, message = "Invalid booking status." });

            var booking = await _bookingService.GetBookingByIdAsync(id);
            if (booking == null)
                return NotFound(new { success = false, message = "Booking not found" });

            if (!await CanManageBookingAsync(booking, allowCustomer: false))
                return Forbid();

            var result = await _bookingService.UpdateBookingStatusAsync(id, request.Status);
            if (!result)
                return NotFound(new { success = false, message = "Booking not found" });

            return Ok(new { success = true, message = "Booking status updated" });
        }

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

    // CustomerId remains for backward compatibility but is ignored by the API.
    public record CreateBookingRequest(
        Guid CustomerId,
        Guid SalonId,
        Guid BranchId,
        Guid StylistId,
        Guid ServiceId,
        DateTime BookingDate,
        TimeSpan StartTime,
        PaymentType PaymentType,
        string Notes);

    public record CancelBookingRequest(string Reason);
    public record UpdateBookingStatusRequest(BookingStatus Status);
}
