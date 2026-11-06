using Zayna.Core.DTOs;
using Zayna.Core.Interfaces;
using ZAYNA.Core.Entities;
using ZAYNA.Core.Enums;
using ZAYNA.Infrastructure.Services;

namespace Zayna.API.Mapping
{
    /// <summary>
    /// The one place that turns a Booking entity into the API shape. Entities are never returned directly
    /// (they contain navigation cycles and internal fields).
    /// </summary>
    public static class BookingMapper
    {
        public static BookingResponseDto ToDto(
            Booking b, bool forCustomer, bool includeCustomer, ISalonClock clock, BookingPolicy policy)
        {
            var start = b.BookingDate.Date + b.StartTime;
            var localNow = clock.LocalNow;
            var cancellableStatus = b.Status == BookingStatus.Pending || b.Status == BookingStatus.Confirmed;
            var enoughNotice = start - localNow >= TimeSpan.FromHours(policy.CancellationCutoffHours);

            return new BookingResponseDto
            {
                Id = b.Id,
                BookingNumber = b.BookingNumber,
                Status = (int)b.Status,
                PaymentType = (int)b.PaymentType,
                TotalAmount = b.TotalPrice,
                Notes = b.Notes,
                BookingDate = b.BookingDate.ToString("yyyy-MM-dd"),
                StartTime = b.StartTime.ToString(@"hh\:mm"),
                EndTime = b.EndTime.ToString(@"hh\:mm"),
                CreatedAt = b.CreatedAt,
                CancelledAt = b.CancelledAt,
                CancellationReason = b.CancellationReason,
                CanCancel = cancellableStatus && (!forCustomer || enoughNotice),
                AllowedStatuses = forCustomer
                    ? Array.Empty<int>()
                    : BookingService.GetAllowedTransitions(b.Status, start, localNow).Select(s => (int)s).ToArray(),
                Salon = new BookingSalonInfo
                {
                    Id = b.SalonId,
                    Name = b.Salon?.SalonName ?? "",
                    NameAr = b.Salon?.SalonNameAr,
                    Phone = b.Salon?.ContactPhone
                },
                Branch = new BookingBranchInfo
                {
                    Id = b.BranchId,
                    Name = b.Branch?.BranchName ?? "",
                    NameAr = b.Branch?.BranchNameAr,
                    Address = b.Branch?.AddressLine,
                    City = b.Branch?.City
                },
                Stylist = new BookingStylistInfo
                {
                    Id = b.StylistId,
                    Name = b.Stylist?.FullName ?? "",
                    NameAr = b.Stylist?.FullNameAr
                },
                Service = new BookingServiceInfo
                {
                    Id = b.ServiceId,
                    Name = b.Service?.ServiceName ?? "",
                    NameAr = b.Service?.ServiceNameAr,
                    DurationMinutes = b.Service?.DurationMinutes ?? 0,
                    Price = b.TotalPrice
                },
                Customer = includeCustomer && b.Customer != null
                    ? new BookingCustomerInfo
                    {
                        Id = b.CustomerId,
                        Name = b.Customer.FullName,
                        Phone = b.Customer.User?.PhoneNumber,
                        Email = b.Customer.User?.Email
                    }
                    : null
            };
        }
    }
}
