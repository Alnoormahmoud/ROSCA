using System;
using System.Transactions;
using ROSCA.Application.DTOs.Payouts;
using ROSCA.Application.DTOs.WalletTransactions;
using ROSCA.Application.Interfaces.FundMembers;
using ROSCA.Application.Interfaces.Payouts;
using ROSCA.Domain.Entities.Payouts;
using ROSCA.Domain.Enums.Funds;
using ROSCA.Domain.Enums.Payouts;

namespace ROSCA.Application.Services.Payouts
{
    public class LastPayoutCollectedEventArgs : EventArgs
    {
        public int FundId { get; }
        public int PayoutId { get; }

        public LastPayoutCollectedEventArgs(int fundId, int payoutId)
        {
            FundId = fundId;
            PayoutId = payoutId;
        }
    }

    public class PayoutService : IPayoutService
    {
        private readonly IPayoutRepository _repo;
        private readonly IFundMemberService _memberService;

        public PayoutService(IPayoutRepository repo, IFundMemberService memberService)
        {
            _repo = repo;
            _memberService = memberService;
        }

        public event EventHandler<LastPayoutCollectedEventArgs> LastPayoutCollected;

        protected virtual void OnLastPayoutCollected(int fundId, int payoutId)
        {
            LastPayoutCollected?.Invoke(this, new LastPayoutCollectedEventArgs(fundId, payoutId));
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

        public async Task<IEnumerable<Payout>> GetDuePayouts()
        {
            return await _repo
                .GetDuePayouts();
        }

        public PayoutDTO MapToDTO(Payout payout)
        {
            if (payout == null) return null!;

            return new PayoutDTO
            {
                Id = payout.Id,
                RoundNumber = payout.RoundNumber,
                PayoutOrderInRound = payout.PayoutOrderInRound,
                Amount = payout.Amount,
                DueDate = payout.DueDate,
                CollectionDate = payout.CollectionDate,
                Status = payout.Status,
                Member = _memberService
                    .MapToDTO(payout.Member),
                Transactions = payout.Transactions
                    .Select(t => new WalletTransactionDTO
                    {
                        Id = t.Id,
                        WalletId = t.WalletId,
                        UserId = t.UserId,  
                        PayoutId = t.PayoutId,
                        Amount = t.Amount,
                        Type = t.Type,
                        PaymentDate = t.PaymentDate,
                    }).ToList()
            };
        }

        public async Task<bool> CollectPayoutAsync(int payoutId)
        {
            var payout = await _repo.GetByIdAsync(payoutId);

            if (payout?.Member?.Fund is null) return false;

            using (var transaction = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
            {
                try
                {
                    if (!await UpdatePayoutStatusAsync(payoutId, PayoutStatus.Collected)) return false;

                    var fund = payout.Member.Fund;

                    var nextOrder = payout.PayoutOrderInRound + 1;
                    var nextPayout = fund.Payouts
                        .FirstOrDefault(p => p.RoundNumber == fund.CurrentRoundNumber
                                          && p.PayoutOrderInRound == nextOrder);

                    if (nextPayout != null)
                    {
                        await UpdatePayoutStatusAsync(nextPayout.Id, PayoutStatus.Pending);
                    }
                    else
                    {
                        OnLastPayoutCollected(fund.Id, payoutId);
                    }

                    transaction.Complete();
                    return true;
                }
                catch 
                {
                    return false; 
                }
            }
        }

    }
}
