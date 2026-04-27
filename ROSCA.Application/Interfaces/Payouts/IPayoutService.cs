using System;
using ROSCA.Domain.Enums.Payouts;

namespace ROSCA.Application.Interfaces.Payouts
{
    public interface IPayoutService
    {
        Task<bool> UpdatePayoutStatusAsync(int payoutId, PayoutStatus status);
        Task<bool> RecordCollectionDateAsync(int payoutId, DateTime collectionDate);
    }
}
