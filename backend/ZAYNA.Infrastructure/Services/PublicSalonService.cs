using Application.DTOs;
using Core.Entities;


namespace ZAYNA.Infrastructure.Services
{
    public class PublicSalonService
    {
        private readonly IRepository<PublicSalon> _repo;

        public PublicSalonService(IRepository<PublicSalon> repo)
        {
            _repo = repo;
        }

        public async Task<List<PublicSalonDto>> GetAllAsync()
        {
            var data = await _repo.GetAllAsync();

            return data.Select(x => Map(x)).ToList();
        }

        public async Task<PublicSalonDto?> GetByIdAsync(Guid id)
        {
            var x = await _repo.GetByIdAsync(id);
            return x == null ? null : Map(x);
        }

        public async Task<List<PublicSalonDto>> SearchAsync(string? q)
        {
            if (string.IsNullOrWhiteSpace(q))
                return await GetAllAsync();

            var salons = await _repo.FindAsync(x =>
                (x.Name != null && x.Name.Contains(q)) ||
                (x.Address != null && x.Address.Contains(q)) ||
                (x.Phone != null && x.Phone.Contains(q))
            );

            return salons.Select(x => new PublicSalonDto
            {
                Id = x.Id,
                PlaceId = x.PlaceId,
                Name = x.Name,
                Address = x.Address,
                Lat = x.Lat,
                Lng = x.Lng,
                Phone = x.Phone,
                Website = x.Website,
                OpeningHours = x.OpeningHours,
                Rating = x.Rating,
                Reviews = x.Reviews
            }).ToList();
        }

        public async Task<List<PublicSalonDto>> GetNearbyAsync(double lat, double lng, double radiusKm)
        {
            var data = await _repo.FindAsync(x =>
                x.Lat != null &&
                x.Lng != null &&
                (6371 * Math.Acos(
                    Math.Cos(lat * Math.PI / 180) *
                    Math.Cos(x.Lat.Value * Math.PI / 180) *
                    Math.Cos((x.Lng.Value - lng) * Math.PI / 180) +
                    Math.Sin(lat * Math.PI / 180) *
                    Math.Sin(x.Lat.Value * Math.PI / 180)
                )) <= radiusKm
            );

            return data.Select(x => Map(x)).ToList();
        }

        private static PublicSalonDto Map(PublicSalon x)
        {
            return new PublicSalonDto
            {
                Id = x.Id,
                PlaceId = x.PlaceId,
                Name = x.Name,
                Address = x.Address,
                Lat = x.Lat,
                Lng = x.Lng,
                Phone = x.Phone,
                Website = x.Website,
                OpeningHours = x.OpeningHours,
                Rating = x.Rating,
                Reviews = x.Reviews            };
        }
    }
}