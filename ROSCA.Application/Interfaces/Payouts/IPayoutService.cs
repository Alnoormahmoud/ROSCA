using System;
using ROSCA.Application.DTOs.Payouts;
using ROSCA.Application.Services.Payouts;
using ROSCA.Domain.Entities.Payouts;
using ROSCA.Domain.Enums.Payouts;

namespace ROSCA.Application.Interfaces.Payouts
{
    public interface IPayoutService
    {
        event EventHandler<LastPayoutCollectedEventArgs> LastPayoutCollected;
        Task<bool> UpdatePayoutStatusAsync(int payoutId, PayoutStatus status);
        Task<bool> RecordCollectionDateAsync(int payoutId, DateTime collectionDate);
        Task<IEnumerable<Payout>> GetDuePayouts();
        Task<bool> CollectPayoutAsync(int payoutId);
        public PayoutDTO MapToDTO(Payout payout);
    }
}
