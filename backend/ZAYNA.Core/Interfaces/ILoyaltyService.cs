<<<<<<< HEAD
namespace ZAYNA.Core.Interfaces
{

    public interface ILoyaltyService
    {
        Task<int> GetCustomerPointsAsync(Guid customerId);
        Task AddPointsAsync(Guid customerId, int points, string reason);
        Task DeductPointsAsync(Guid customerId, int points, string reason);
        Task<bool> CanRedeemPointsAsync(Guid customerId, int points);
    }
=======
namespace ZAYNA.Core.Interfaces
{

    public interface ILoyaltyService
    {
        Task<int> GetCustomerPointsAsync(Guid customerId);
        Task AddPointsAsync(Guid customerId, int points, string reason);
        Task DeductPointsAsync(Guid customerId, int points, string reason);
        Task<bool> CanRedeemPointsAsync(Guid customerId, int points);
    }
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
}