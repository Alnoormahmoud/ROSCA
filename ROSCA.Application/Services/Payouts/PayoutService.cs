using System;
using ROSCA.Application.DTOs.Payouts;
using ROSCA.Application.DTOs.WalletTransactions;
using ROSCA.Application.Interfaces.FundMembers;
using ROSCA.Application.Interfaces.Payouts;
using ROSCA.Domain.Entities.Payouts;
using ROSCA.Domain.Enums.Payouts;

namespace ROSCA.Application.Services.Payouts
{
    public class PayoutService : IPayoutService
    {
        private readonly IPayoutRepository _repo;
        private readonly IFundMemberService _memberService;

        public PayoutService(IPayoutRepository repo, IFundMemberService memberService)
        {
            _repo = repo;
            _memberService = memberService;
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

    }
}
