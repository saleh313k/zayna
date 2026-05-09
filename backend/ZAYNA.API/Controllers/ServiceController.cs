<<<<<<< HEAD
// ZAYNA.API/Controllers/ServiceController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZAYNA.Core.Entities;
using ZAYNA.Core.Interfaces;
using ZAYNA.Infrastructure.Data;

namespace ZAYNA.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceController : ControllerBase
    {
        private readonly IRepository<Service> _serviceRepository;
        private readonly ApplicationDbContext _context;

        public ServiceController(IRepository<Service> serviceRepository, ApplicationDbContext context)
        {
            _serviceRepository = serviceRepository;
            _context = context;
        }

        /// <summary>
        /// Get all services for a salon
        /// </summary>
        [AllowAnonymous]
        [HttpGet("salon/{salonId}")]
        public async Task<IActionResult> GetSalonServices(Guid salonId)
        {
            var services = await _context.Services
                .Where(s => s.SalonId == salonId && s.IsActive)
                .ToListAsync();

            return Ok(new { success = true, services });
        }

        /// <summary>
        /// Add service
        /// </summary>
        [Authorize(Roles = "Salon,Admin")]
        [HttpPost]
        public async Task<IActionResult> AddService([FromBody] CreateServiceRequest request)
        {
            var service = new Service
            {
                SalonId = request.SalonId,
                ServiceName = request.ServiceName,
                ServiceNameAr = request.ServiceNameAr,
                Description = request.Description,
                DescriptionAr = request.DescriptionAr,
                DurationMinutes = request.DurationMinutes,
                Price = request.Price,
                Category = request.Category,
                IsActive = true
            };

            await _serviceRepository.AddAsync(service);
            return Ok(new { success = true, service });
        }

        /// <summary>
        /// Update service
        /// </summary>
        [Authorize(Roles = "Salon,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateService(Guid id, [FromBody] UpdateServiceRequest request)
        {
            var service = await _serviceRepository.GetByIdAsync(id);
            if (service == null)
                return NotFound(new { success = false, message = "Service not found" });

            service.ServiceName = request.ServiceName ?? service.ServiceName;
            service.ServiceNameAr = request.ServiceNameAr ?? service.ServiceNameAr;
            service.Description = request.Description ?? service.Description;
            service.DescriptionAr = request.DescriptionAr ?? service.DescriptionAr;
            service.DurationMinutes = request.DurationMinutes ?? service.DurationMinutes;
            service.Price = request.Price ?? service.Price;
            service.Category = request.Category ?? service.Category;
            service.IsActive = request.IsActive ?? service.IsActive;
            service.UpdatedAt = DateTime.UtcNow;

            await _serviceRepository.UpdateAsync(service);
            return Ok(new { success = true, service });
        }

        /// <summary>
        /// Delete service
        /// </summary>
        [Authorize(Roles = "Salon,Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteService(Guid id)
        {
            var service = await _serviceRepository.GetByIdAsync(id);
            if (service == null)
                return NotFound(new { success = false, message = "Service not found" });

            service.IsActive = false;
            await _serviceRepository.UpdateAsync(service);
            return Ok(new { success = true, message = "Service deactivated" });
        }
    }

    public record CreateServiceRequest(
        Guid SalonId,
        string ServiceName,
        string ServiceNameAr,
        string Description,
        string DescriptionAr,
        int DurationMinutes,
        decimal Price,
        string Category);

    public record UpdateServiceRequest(
        string ServiceName,
        string ServiceNameAr,
        string Description,
        string DescriptionAr,
        int? DurationMinutes,
        decimal? Price,
        string Category,
        bool? IsActive);
}
=======
// ZAYNA.API/Controllers/ServiceController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZAYNA.Core.Entities;
using ZAYNA.Core.Interfaces;
using ZAYNA.Infrastructure.Data;

namespace ZAYNA.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceController : ControllerBase
    {
        private readonly IRepository<Service> _serviceRepository;
        private readonly ApplicationDbContext _context;

        public ServiceController(IRepository<Service> serviceRepository, ApplicationDbContext context)
        {
            _serviceRepository = serviceRepository;
            _context = context;
        }

        /// <summary>
        /// Get all services for a salon
        /// </summary>
        [AllowAnonymous]
        [HttpGet("salon/{salonId}")]
        public async Task<IActionResult> GetSalonServices(Guid salonId)
        {
            var services = await _context.Services
                .Where(s => s.SalonId == salonId && s.IsActive)
                .ToListAsync();

            return Ok(new { success = true, services });
        }

        /// <summary>
        /// Add service
        /// </summary>
        [Authorize(Roles = "Salon,Admin")]
        [HttpPost]
        public async Task<IActionResult> AddService([FromBody] CreateServiceRequest request)
        {
            var service = new Service
            {
                SalonId = request.SalonId,
                ServiceName = request.ServiceName,
                ServiceNameAr = request.ServiceNameAr,
                Description = request.Description,
                DescriptionAr = request.DescriptionAr,
                DurationMinutes = request.DurationMinutes,
                Price = request.Price,
                Category = request.Category,
                IsActive = true
            };

            await _serviceRepository.AddAsync(service);
            return Ok(new { success = true, service });
        }

        /// <summary>
        /// Update service
        /// </summary>
        [Authorize(Roles = "Salon,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateService(Guid id, [FromBody] UpdateServiceRequest request)
        {
            var service = await _serviceRepository.GetByIdAsync(id);
            if (service == null)
                return NotFound(new { success = false, message = "Service not found" });

            service.ServiceName = request.ServiceName ?? service.ServiceName;
            service.ServiceNameAr = request.ServiceNameAr ?? service.ServiceNameAr;
            service.Description = request.Description ?? service.Description;
            service.DescriptionAr = request.DescriptionAr ?? service.DescriptionAr;
            service.DurationMinutes = request.DurationMinutes ?? service.DurationMinutes;
            service.Price = request.Price ?? service.Price;
            service.Category = request.Category ?? service.Category;
            service.IsActive = request.IsActive ?? service.IsActive;
            service.UpdatedAt = DateTime.UtcNow;

            await _serviceRepository.UpdateAsync(service);
            return Ok(new { success = true, service });
        }

        /// <summary>
        /// Delete service
        /// </summary>
        [Authorize(Roles = "Salon,Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteService(Guid id)
        {
            var service = await _serviceRepository.GetByIdAsync(id);
            if (service == null)
                return NotFound(new { success = false, message = "Service not found" });

            service.IsActive = false;
            await _serviceRepository.UpdateAsync(service);
            return Ok(new { success = true, message = "Service deactivated" });
        }
    }

    public record CreateServiceRequest(
        Guid SalonId,
        string ServiceName,
        string ServiceNameAr,
        string Description,
        string DescriptionAr,
        int DurationMinutes,
        decimal Price,
        string Category);

    public record UpdateServiceRequest(
        string ServiceName,
        string ServiceNameAr,
        string Description,
        string DescriptionAr,
        int? DurationMinutes,
        decimal? Price,
        string Category,
        bool? IsActive);
}
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
