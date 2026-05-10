<<<<<<< HEAD
using System;
using System.Collections.Generic;

// ZAYNA.Application/DTOs/BookingDTOs.cs
using System;

namespace ZAYNA.Application.DTOs
{
    public class CreateBookingDTO
    {
        public Guid CustomerId { get; set; }
        public Guid SalonId { get; set; }
        public Guid BranchId { get; set; }
        public Guid StylistId { get; set; }
        public Guid ServiceId { get; set; }
        public DateTime BookingDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public string PaymentType { get; set; }
        public string Notes { get; set; }
    }

    public class BookingResponseDTO
    {
        public Guid Id { get; set; }
        public string BookingNumber { get; set; }
        public DateTime BookingDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string Status { get; set; }
        public decimal TotalAmount { get; set; }
        public string CustomerName { get; set; }
        public string SalonName { get; set; }
        public string ServiceName { get; set; }
    }
=======
using System;
using System.Collections.Generic;

// ZAYNA.Application/DTOs/BookingDTOs.cs
using System;

namespace ZAYNA.Application.DTOs
{
    public class CreateBookingDTO
    {
        public Guid CustomerId { get; set; }
        public Guid SalonId { get; set; }
        public Guid BranchId { get; set; }
        public Guid StylistId { get; set; }
        public Guid ServiceId { get; set; }
        public DateTime BookingDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public string PaymentType { get; set; }
        public string Notes { get; set; }
    }

    public class BookingResponseDTO
    {
        public Guid Id { get; set; }
        public string BookingNumber { get; set; }
        public DateTime BookingDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string Status { get; set; }
        public decimal TotalAmount { get; set; }
        public string CustomerName { get; set; }
        public string SalonName { get; set; }
        public string ServiceName { get; set; }
    }
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
}