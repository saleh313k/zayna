using Application.DTOs;
using Microsoft.AspNetCore.Mvc;
using ZAYNA.Infrastructure.Services;

namespace ZAYNA.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PublicSalonsController : ControllerBase
    {
        private readonly PublicSalonService _service;

        public PublicSalonsController(PublicSalonService service)
        {
            _service = service;
        }

        /// <summary>
        /// گرفتن همه سالن‌ها
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<PublicSalonDto>>> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        /// <summary>
        /// گرفتن بر اساس Id
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<PublicSalonDto>> GetById(Guid id)
        {
            var result = await _service.GetByIdAsync(id);

            if (result == null)
                return NotFound();

            return Ok(result);
        }

        /// <summary>
        /// جستجو
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<List<PublicSalonDto>>> Search([FromQuery] string? q)
        {
            var result = await _service.SearchAsync(q);
            return Ok(result);
        }

        /// <summary>
        /// نزدیک‌ترین سالن‌ها
        /// </summary>
        [HttpGet("nearby")]
        public async Task<ActionResult<List<PublicSalonDto>>> GetNearby(
            [FromQuery] double lat,
            [FromQuery] double lng,
            [FromQuery] double radiusKm = 5)
        {
            var result = await _service.GetNearbyAsync(lat, lng, radiusKm);
            return Ok(result);
        }
    }
}