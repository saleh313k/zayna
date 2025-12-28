// ZAYNA.API/Controllers/BookingController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ZAYNA.Core.Entities;
using ZAYNA.Core.Enums;
using ZAYNA.Core.Interfaces;

namespace ZAYNA.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _bookingService;
        private readonly IRepository<Service> _serviceRepository;
        private readonly IPaymentService _paymentService;
        private readonly INotificationService _notificationService;
        private readonly ILoyaltyService _loyaltyService;

        public BookingController(
            IBookingService bookingService,
            IRepository<Service> serviceRepository,
            IPaymentService paymentService,
            INotificationService notificationService,
            ILoyaltyService loyaltyService)
        {
            _bookingService = bookingService;
            _serviceRepository = serviceRepository;
            _paymentService = paymentService;
            _notificationService = notificationService;
            _loyaltyService = loyaltyService;
        }

        /// <summary>
        /// Get available time slots for a stylist on a specific date
        /// </summary>
        [HttpGet("available-slots")]
        public async Task<IActionResult> GetAvailableSlots([FromQuery] Guid stylistId,[FromQuery] Guid serviceId, [FromQuery] DateTime date)
        {
            var slots = await _bookingService.GetAvailableTimeSlotsAsync(stylistId, serviceId, date);
            return Ok(new { success = true, slots });
        }

        /// <summary>
        /// Create a new booking
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            
            // Get service details for duration and price
            var service = await _serviceRepository.GetByIdAsync(request.ServiceId);
            if (service == null)
                return BadRequest(new { success = false, message = "Service not found" });

            var booking = new Booking
            {
                CustomerId = request.CustomerId,
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

            // Handle online payment
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
            }

            // Send confirmation notification
            await _notificationService.SendBookingConfirmationAsync(createdBooking);

            // Add loyalty points
            await _loyaltyService.AddPointsAsync(
                request.CustomerId,
                10,
                $"Booking #{createdBooking.BookingNumber}");

            return Ok(new { success = true, booking = createdBooking });
        }

        /// <summary>
        /// Get customer bookings
        /// </summary>
        [Authorize(Roles = "Customer")]
        [HttpGet("my-bookings")]
        public async Task<IActionResult> GetMyBookings()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            // In production, fetch customer ID from user context
            var customerId = userId; // Simplified
            
            var bookings = await _bookingService.GetCustomerBookingsAsync(customerId);
            return Ok(new { success = true, bookings });
        }

        /// <summary>
        /// Get salon bookings
        /// </summary>
        [Authorize(Roles = "Salon,Admin")]
        [HttpGet("salon/{salonId}")]
        public async Task<IActionResult> GetSalonBookings(Guid salonId,[FromQuery] DateTime? date)
        {
            var bookings = await _bookingService.GetSalonBookingsAsync(salonId, date);
            return Ok(new { success = true, bookings });
        }

        /// <summary>
        /// Cancel a booking
        /// </summary>
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelBooking(Guid id, [FromBody] CancelBookingRequest request)
        {
            var result = await _bookingService.CancelBookingAsync(id, request.Reason);
            if (!result)
                return NotFound(new { success = false, message = "Booking not found" });

            return Ok(new { success = true, message = "Booking cancelled successfully" });
        }

        /// <summary>
        /// Update booking status (Salon/Stylist only)
        /// </summary>
        [Authorize(Roles = "Salon,Stylist,Admin")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateBookingStatus(Guid id, [FromBody] UpdateBookingStatusRequest request)
        {
            var result = await _bookingService.UpdateBookingStatusAsync(id, request.Status);
            if (!result)
                return NotFound(new { success = false, message = "Booking not found" });

            return Ok(new { success = true, message = "Booking status updated" });
        }
    }

    // DTOs
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