using System;
using ROSCA.Domain.Entities.Payouts;

namespace ROSCA.Application.Interfaces.Payouts
{
    public interface IPayoutRepository
    {
        Task<Payout?> GetByIdAsync(int id);
        Task<int> AddAsync(Payout payout);
        Task<IEnumerable<int>> AddRangeAsync(IEnumerable<Payout> payouts);
        Task<bool> UpdateAsync(Payout payout);
    }
}
