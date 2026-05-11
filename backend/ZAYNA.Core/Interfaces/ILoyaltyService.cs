namespace ZAYNA.Core.Interfaces
{

    public interface ILoyaltyService
    {
        Task<int> GetCustomerPointsAsync(Guid customerId);
        Task AddPointsAsync(Guid customerId, int points, string reason);
        Task DeductPointsAsync(Guid customerId, int points, string reason);
        Task<bool> CanRedeemPointsAsync(Guid customerId, int points);
    }
}