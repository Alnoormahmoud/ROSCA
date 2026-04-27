using System;
using ROSCA.Application.Interfaces.Payouts;
using ROSCA.Domain.Enums.Payouts;

namespace ROSCA.Application.Services.Payouts
{
    public class PayoutService : IPayoutService
    {
        private readonly IPayoutRepository _repo;

        public PayoutService(IPayoutRepository repo)
        {
            _repo = repo;
        }

        public async Task<bool> RecordCollectionDateAsync(int payoutId, DateTime collectionDate)
        {
            var payout = await _repo
                .GetByIdAsync(payoutId);

            if (payout is null || collectionDate < payout.DueDate)
            {
                return false;
            }

            payout.CollectionDate = collectionDate;

            return await _repo
                .UpdateAsync(payout);
        }

        public async Task<bool> UpdatePayoutStatusAsync(int payoutId, PayoutStatus status)
        {
            var payout = await _repo
                .GetByIdAsync(payoutId);

            if (payout is null 
                || (status == PayoutStatus.Pending && (payout.Status == PayoutStatus.Collected))
                || (status == PayoutStatus.Collected && (payout.Status == PayoutStatus.Disbursed))
                || (status == PayoutStatus.Disbursed && (payout.Status == PayoutStatus.Pending || payout.Status == PayoutStatus.Collected)))
            {
                return false;
            }

            payout.Status = status;

            return await _repo
                .UpdateAsync(payout);
        }

    }
}
