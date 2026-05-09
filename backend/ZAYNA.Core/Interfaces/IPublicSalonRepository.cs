using Core.Entities;

namespace ZAYNA.Core.Interfaces
{
    public interface IPublicSalonRepository
    {
        Task<List<PublicSalon>> GetAllAsync();
        Task<PublicSalon?> GetByIdAsync(Guid id);
        Task<List<PublicSalon>> SearchAsync(string? query);
        Task<List<PublicSalon>> GetNearbyAsync(double lat, double lng, double radiusKm);
    }
}