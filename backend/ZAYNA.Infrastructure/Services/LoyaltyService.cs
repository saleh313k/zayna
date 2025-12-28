using ZAYNA.Core.Entities;
using ZAYNA.Core.Interfaces;

namespace ZAYNA.Infrastructure.Services
{
    public class LoyaltyService : ILoyaltyService
    {
        private readonly IRepository<Customer> _customerRepository;
        private readonly IRepository<LoyaltyPointsHistory> _loyaltyHistoryRepository;

        public LoyaltyService(
            IRepository<Customer> customerRepository,
            IRepository<LoyaltyPointsHistory> loyaltyHistoryRepository)
        {
            _customerRepository = customerRepository;
            _loyaltyHistoryRepository = loyaltyHistoryRepository;
        }

        // ================================
        // 1) GetCustomerPointsAsync
        // ================================
        public async Task<int> GetCustomerPointsAsync(Guid customerId)
        {
            var customer = await _customerRepository.GetByIdAsync(customerId);
            return customer?.LoyaltyPointsHistory.Count ?? 0;
        }

        // ================================
        // 2) AddPointsAsync (interface)
        // ================================
        public async Task AddPointsAsync(Guid customerId, int points, string reason)
        {
            var customer = await _customerRepository.GetByIdAsync(customerId);
            if (customer == null) return;

            customer.LoyaltyPointsBalance += points;
            await _customerRepository.UpdateAsync(customer);

            await _loyaltyHistoryRepository.AddAsync(new LoyaltyPointsHistory
            {
                CustomerId = customerId,
                Points = points,
                TransactionType = "Earned",
                Description = reason
            });
        }

        // ================================
        // 3) DeductPointsAsync (interface)
        // ================================
        public async Task DeductPointsAsync(Guid customerId, int points, string reason)
        {
            var customer = await _customerRepository.GetByIdAsync(customerId);
            if (customer == null) return;

            customer.LoyaltyPointsBalance -= points;
            if (customer.LoyaltyPointsBalance < 0)
                customer.LoyaltyPointsBalance = 0;

            await _customerRepository.UpdateAsync(customer);

            await _loyaltyHistoryRepository.AddAsync(new LoyaltyPointsHistory
            {
                CustomerId = customerId,
                Points = -points,
                TransactionType = "Deducted",
                Description = reason
            });
        }

        // ================================
        // 4) CanRedeemPointsAsync (interface)
        // ================================
        public async Task<bool> CanRedeemPointsAsync(Guid customerId, int points)
        {
            var customer = await _customerRepository.GetByIdAsync(customerId);
            if (customer == null) return false;

            return customer.LoyaltyPointsBalance >= points;
        }
    }
}
