using System;
using System.Collections.Generic;

// ZAYNA.Application/DTOs/SalonDTOs.cs
using System;
using System.Collections.Generic;

namespace ZAYNA.Application.DTOs
{
    public class SalonDTO
    {
        public Guid Id { get; set; }
        public string SalonName { get; set; }
        public string SalonNameAr { get; set; }
        public string Logo { get; set; }
        public string AboutText { get; set; }
        public string AboutTextAr { get; set; }
        public string ContactPhone { get; set; }
        public string ContactEmail { get; set; }
        public bool IsVerified { get; set; }
        public decimal Rating { get; set; }
        public int TotalReviews { get; set; }
        public List<BranchDTO> Branches { get; set; }
    }

    public class BranchDTO
    {
        public Guid Id { get; set; }
        public string BranchName { get; set; }
        public string BranchNameAr { get; set; }
        public string City { get; set; }
        public string AddressLine { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public bool IsActive { get; set; }
    }

    public class ServiceDTO
    {
        public Guid Id { get; set; }
        public string ServiceName { get; set; }
        public string ServiceNameAr { get; set; }
        public string Description { get; set; }
        public string DescriptionAr { get; set; }
        public int DurationMinutes { get; set; }
        public decimal Price { get; set; }
        public string Category { get; set; }
        public bool IsActive { get; set; }
    }
}