
﻿// ZAYNA.API/Controllers/SalonController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Security.Claims;
using Zayna.Core.DTOs;
using ZAYNA.Core.Entities;
using ZAYNA.Core.Enums;
using ZAYNA.Core.Interfaces;
using ZAYNA.Infrastructure.Data;

namespace ZAYNA.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SalonController : ControllerBase
    {
        private readonly IRepository<Salon> _salonRepository;
        private readonly IRepository<Branch> _branchRepository;
        private readonly IRepository<Stylist> _stylistRepository;
        private readonly ApplicationDbContext _context;

        public SalonController(
            IRepository<Salon> salonRepository,
            IRepository<Branch> branchRepository,
            IRepository<Stylist> stylistRepository,
            ApplicationDbContext context)
        {
            _salonRepository = salonRepository;
            _branchRepository = branchRepository;
            _stylistRepository = stylistRepository;
            _context = context;
        }

        /// <summary>
        /// Get all salons (public)
        /// </summary>
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAllSalons([FromQuery] string? city = null)
        {
            var query = _context.Salons
                .Where(s => s.IsVerified);

            if (!string.IsNullOrEmpty(city))
            {
                query = query.Where(s =>
                    s.Branches.Any(b => b.City != null &&
                        b.City.Equals(city, StringComparison.OrdinalIgnoreCase)));
            }

            var salons = await query
                .Select(s => new SalonDto
                {
                    Id = s.Id,
                    Name = s.SalonName ?? "",
                    NameAr = s.SalonNameAr ?? "",
                    Description = s.AboutText ?? "",
                    DescriptionAr = s.AboutTextAr ?? "",
                    LogoUrl = "",
                    PhoneNumber = s.ContactPhone ?? "",
                    Email = s.ContactEmail ?? "",
                    IsActive = s.IsVerified,

                    Branches = s.Branches
                        .Where(b => b.IsActive)
                        .Select(b => new BranchDto
                        {
                            Id = b.Id,
                            Name = b.BranchName ?? "",
                            NameAr = b.BranchNameAr ?? "",
                            Address = b.AddressLine ?? "",
                            AddressAr = b.AddressLine ?? "",
                            Latitude = b.Latitude ?? 0,
                            Longitude = b.Longitude ?? 0
                        })
                        .ToList()
                })
                .ToListAsync();

            return Ok(new { success = true, salons });
        }


        /// <summary>
        /// Get salon by ID
        /// </summary>
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSalonById(Guid id)
        {
            //var salon = await _context.Salons
            //    .Include(s => s.Branches)
            //        .ThenInclude(b => b.WorkingHours)
            //    .Include(s => s.Services)
            //    .Include(s => s.Stylists)
            //    .FirstOrDefaultAsync(s => s.Id == id);
            var salon = await _context.Salons
    .Where(s => s.IsVerified && s.Id == id)
    .Select(s => new SalonDto
    {
        Id = s.Id,
        Name = s.SalonName ?? "",
        NameAr = s.SalonNameAr ?? "",
        Description = s.AboutText ?? "",
        DescriptionAr = s.AboutTextAr ?? "",
        LogoUrl = "", // اگر داری پرش کن
        PhoneNumber = s.ContactPhone ?? "",
        Email = s.ContactEmail ?? "",
        IsActive = s.IsVerified,

        Branches = s.Branches
            .Where(b => b.IsActive)
            .Select(b => new BranchDto
            {
                Id = b.Id,
                Name = b.BranchName ?? "",
                NameAr = b.BranchNameAr ?? "",
                Address = b.AddressLine ?? "",
                AddressAr = b.AddressLine ?? "",
                Latitude = b.Latitude ?? 0,
                Longitude = b.Longitude ?? 0
            })
            .ToList()
    })
    .FirstOrDefaultAsync();

            if (salon == null)
                return NotFound(new { success = false, message = "Salon not found" });

            return Ok(new { success = true, salon });
        }

        /// <summary>
        /// Get salon by User ID
        /// </summary>
        [Authorize(Roles = "Salon,Admin")]
        [HttpGet("getSalonByUserId/{id}")]
        public async Task<IActionResult> GetSalonByUserId(Guid id)
        {
            if (!User.IsInRole("Admin") && !TryGetCurrentUserId(out var currentUserId))
                return Unauthorized();
            if (!User.IsInRole("Admin") && currentUserId != id)
                return Forbid();

            var salon = await _context.Salons
    .Where(s => s.IsVerified && s.UserId == id)
    .Select(s => new SalonDto
    {
        Id = s.Id,
        Name = s.SalonName ?? "",
        NameAr = s.SalonNameAr ?? "",
        Description = s.AboutText ?? "",
        DescriptionAr = s.AboutTextAr ?? "",
        LogoUrl = "", // اگر داری پرش کن
        PhoneNumber = s.ContactPhone ?? "",
        Email = s.ContactEmail ?? "",
        IsActive = s.IsVerified,

        Branches = s.Branches
            .Where(b => b.IsActive)
            .Select(b => new BranchDto
            {
                Id = b.Id,
                Name = b.BranchName ?? "",
                NameAr = b.BranchNameAr ?? "",
                Address = b.AddressLine ?? "",
                AddressAr = b.AddressLine ?? "",
                Latitude = b.Latitude ?? 0,
                Longitude = b.Longitude ?? 0
            })
            .ToList()
    })
    .FirstOrDefaultAsync();

            if (salon == null)
                return NotFound(new { success = false, message = "Salon not found" });

            return Ok(new { success = true, salon });
        }

        /// <summary>
        /// Update salon profile
        /// </summary>
        [Authorize(Roles = "Salon,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSalon(Guid id, [FromBody] UpdateSalonRequest request)
        {
            var salon = await _salonRepository.GetByIdAsync(id);
            if (salon == null)
                return NotFound(new { success = false, message = "Salon not found" });
            if (!await CanManageSalonAsync(id))
                return Forbid();

            salon.SalonName = request.SalonName ?? salon.SalonName;
            salon.SalonNameAr = request.SalonNameAr ?? salon.SalonNameAr;
            salon.AboutText = request.AboutText ?? salon.AboutText;
            salon.AboutTextAr = request.AboutTextAr ?? salon.AboutTextAr;
            salon.ContactPhone = request.ContactPhone ?? salon.ContactPhone;
            salon.ContactEmail = request.ContactEmail ?? salon.ContactEmail;
            salon.FacebookUrl = request.FacebookUrl ?? salon.FacebookUrl;
            salon.InstagramUrl = request.InstagramUrl ?? salon.InstagramUrl;
            salon.TwitterUrl = request.TwitterUrl ?? salon.TwitterUrl;
            salon.UpdatedAt = DateTime.UtcNow;

            await _salonRepository.UpdateAsync(salon);
            return Ok(new { success = true, salon });
        }

        /// <summary>
        /// Get salon branches
        /// </summary>
        [Authorize(Roles = "Salon,Admin")]
        [HttpGet("{salonId}/branches")]
        public async Task<IActionResult> GetSalonBranches(Guid salonId)
        {
            if (!await CanManageSalonAsync(salonId))
                return Forbid();

            var branches = await _context.Branches
                .Include(b => b.WorkingHours)
                .Where(b => b.SalonId == salonId)
                .ToListAsync();

            return Ok(new { success = true, branches });
        }

        /// <summary>
        /// Add branch
        /// </summary>
        [Authorize(Roles = "Salon,Admin")]
        [HttpPost("{salonId}/branches")]
        public async Task<IActionResult> AddBranch(Guid salonId, [FromBody] CreateBranchRequest request)
        {
            if (!await CanManageSalonAsync(salonId))
                return Forbid();

            var branch = new Branch
            {
                SalonId = salonId,
                BranchName = request.BranchName,
                BranchNameAr = request.BranchNameAr,
                AddressLine = request.AddressLine,
                City = request.City,
                Region = request.Region,
                PostalCode = request.PostalCode,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                PhoneNumber = request.PhoneNumber,
                IsActive = true
            };

            await _branchRepository.AddAsync(branch);
            return Ok(new { success = true, branch });
        }

        /// <summary>
        /// Update branch
        /// </summary>
        [Authorize(Roles = "Salon,Admin")]
        [HttpPut("branches/{branchId}")]
        public async Task<IActionResult> UpdateBranch(Guid branchId, [FromBody] UpdateBranchRequest request)
        {
            var branch = await _branchRepository.GetByIdAsync(branchId);
            if (branch == null)
                return NotFound(new { success = false, message = "Branch not found" });
            if (!await CanManageSalonAsync(branch.SalonId))
                return Forbid();

            branch.BranchName = request.BranchName ?? branch.BranchName;
            branch.BranchNameAr = request.BranchNameAr ?? branch.BranchNameAr;
            branch.AddressLine = request.AddressLine ?? branch.AddressLine;
            branch.City = request.City ?? branch.City;
            branch.PhoneNumber = request.PhoneNumber ?? branch.PhoneNumber;
            branch.IsActive = request.IsActive ?? branch.IsActive;
            branch.UpdatedAt = DateTime.UtcNow;

            await _branchRepository.UpdateAsync(branch);
            return Ok(new { success = true, branch });
        }

        /// <summary>
        /// Get salon stylists
        /// </summary>
        [Authorize(Roles = "Salon,Admin")]
        [HttpGet("{salonId}/stylists")]
        public async Task<IActionResult> GetSalonStylists(Guid salonId)
        {
            if (!await CanManageSalonAsync(salonId))
                return Forbid();

            var stylists = await _context.Stylists
                .Include(s => s.StylistServices)
                    .ThenInclude(ss => ss.Service)
                .Where(s => s.SalonId == salonId && s.IsActive)
                .ToListAsync();

            return Ok(new { success = true, stylists });
        }

        /// <summary>
        /// Add stylist
        /// </summary>
        [Authorize(Roles = "Salon,Admin")]
        [HttpPost("{salonId}/stylists")]
        public async Task<IActionResult> AddStylist(Guid salonId, [FromBody] CreateStylistRequest request)
        {
            if (!await CanManageSalonAsync(salonId))
                return Forbid();

            if (request.BranchId.HasValue &&
                !await _context.Branches.AnyAsync(b => b.Id == request.BranchId.Value && b.SalonId == salonId))
                return BadRequest(new { success = false, message = "Branch does not belong to this salon." });

            if (await _context.Users.AnyAsync(u => u.PhoneNumber == request.PhoneNumber))
                return Conflict(new { success = false, message = "A user with this phone number already exists." });

            // Create user account for stylist
            var user = new User
            {
                PhoneNumber = request.PhoneNumber,
                Role = UserRole.Stylist,
                IsActive = true
            };

            // In production, use proper repository
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var stylist = new Stylist
            {
                UserId = user.Id,
                SalonId = salonId,
                BranchId = request.BranchId,
                FullName = request.FullName,
                FullNameAr = request.FullNameAr,
                YearsOfExperience = request.YearsOfExperience,
                IsActive = true
            };

            await _stylistRepository.AddAsync(stylist);
            return Ok(new { success = true, stylist });
        }

        private bool TryGetCurrentUserId(out Guid userId)
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(value, out userId);
        }

        private async Task<bool> CanManageSalonAsync(Guid salonId)
        {
            if (User.IsInRole("Admin"))
                return await _context.Salons.AnyAsync(s => s.Id == salonId);

            return TryGetCurrentUserId(out var userId) &&
                   await _context.Salons.AnyAsync(s => s.Id == salonId && s.UserId == userId);
        }
    }

    // DTOs
    public record UpdateSalonRequest(
        string SalonName,
        string SalonNameAr,
        string AboutText,
        string AboutTextAr,
        string ContactPhone,
        string ContactEmail,
        string FacebookUrl,
        string InstagramUrl,
        string TwitterUrl);

    public record CreateBranchRequest(
        string BranchName,
        string BranchNameAr,
        string AddressLine,
        string City,
        string Region,
        string PostalCode,
        double? Latitude,
        double? Longitude,
        string PhoneNumber);

    public record UpdateBranchRequest(
        string BranchName,
        string BranchNameAr,
        string AddressLine,
        string City,
        string PhoneNumber,
        bool? IsActive);

    public record CreateStylistRequest(
        string PhoneNumber,
        string FullName,
        string FullNameAr,
        Guid? BranchId,
        int YearsOfExperience);
}
