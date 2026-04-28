using System;
using System.ComponentModel;
using System.Threading.Tasks;
using System.Transactions;
using ROSCA.Application.DTOs.FundMembers;
using ROSCA.Application.DTOs.Funds;
using ROSCA.Application.DTOs.Wallets;
using ROSCA.Application.DTOs.WalletTransactions;
using ROSCA.Application.Interfaces.FundMembers;
using ROSCA.Application.Interfaces.Funds;
using ROSCA.Application.Interfaces.Payouts;
using ROSCA.Application.Interfaces.Wallets;
using ROSCA.Domain.Entities.FundMembers;
using ROSCA.Domain.Entities.Funds;
using ROSCA.Domain.Entities.Payouts;
using ROSCA.Domain.Enums.Funds;
using ROSCA.Domain.Enums.Payouts;

namespace ROSCA.Application.Services.Funds
{
    public class FundService : IFundService
    {
        private readonly IFundRepository _repo;
        private readonly IPayoutRepository _payoutRepo;
        private readonly IFundMemberRepository _memberRepo;
        private readonly IFundMemberService _memberService;
        private readonly IPayoutService _payoutService;
        private readonly IWalletService _walletService;

        public async Task<FundDTO?> GetByIdAsync(int id)
        {
            var fund = await _repo
                .GetByIdAsync(id);

            return fund is null
                ? null
                : MapToDTO(fund);
        }

        public FundService(IFundRepository repo, IPayoutRepository payoutRepo, IFundMemberRepository memberRepo, IFundMemberService memberService, IPayoutService payoutService, IWalletService walletService)
        {
            _repo = repo;
            _payoutRepo = payoutRepo;
            _memberRepo = memberRepo;
            _memberService = memberService;
            _payoutService = payoutService;
            _walletService = walletService;

            _payoutService.LastPayoutCollected += PayoutService_LastPayoutCollected;
        }

        public async Task<int> CreateFundAsync(FundToAddDTO dto)
        {
            if (dto is null || dto.Members is null || dto.Members.Count == 0)
            {
                return -1;
            }

            using (var transaction = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
            {
                try
                {
                    var fund = new Fund
                    {
                        Title = dto.Title,
                        AdminId = dto.AdminId,
                        ShareValue = dto.ShareValue,
                        PeriodType = dto.PeriodType,
                        TotalMembers = dto.Members.Count,
                        StartDate = dto.StartDate.Date,
                        Status = FundStatus.Active,
                        CurrentRoundNumber = 1,
                        CreatedAt = DateTime.UtcNow
                    };

                    await _repo.AddAsync(fund);

                    if (fund.Id == -1)
                    {
                        return -1;
                    }

                    foreach (FundMemberToAddDTO member in dto.Members)
                    {
                        var fundMember = new FundMember
                        {
                            FundId = fund.Id,
                            UserId = member.UserId,
                            PayoutOrder = member.PayoutOrder,
                            CreatedAt = DateTime.UtcNow
                        };

                        await _memberRepo.AddAsync(fundMember);

                        if (fundMember.Id == -1)
                        {
                            return -1;
                        }

                        var payout = new Payout
                        {
                            FundMemberId = fundMember.Id,
                            RoundNumber = 1,
                            PayoutOrderInRound = fundMember.PayoutOrder,
                            Amount = fund.ShareValue * (dto.Members.Count - 1),
                            DueDate = GetDueDate(fund, fundMember.PayoutOrder).Date,
                            CollectionDate = null,
                            Status = PayoutStatus.Disbursed
                        };

                        await _payoutRepo.AddAsync(payout);

                        if (payout.Id == -1)
                        {
                            return -1;
                        }
                    }

                    var walletId = await _walletService
                        .AddAsync(
                            new WalletToAddDTO
                            {
                                FundId = fund.Id,
                                CurrencyId = dto.CurrencyId,
                                Balance = 0
                            }
                        );

                    if (walletId is null)
                    {
                        return -1;
                    }

                    transaction.Complete();

                    return fund.Id;
                }
                catch
                {
                    return -1;
                }
            }
        }

        public async Task<bool> CompleteFundAsync(int fundId)
        {
            var fund = await _repo.GetByIdAsync(fundId);

            if (fund is null)
            {
                return false;
            }

            fund.Status = FundStatus.Completed;

            return await _repo
                .UpdateAsync(fund);
        }

        public bool CompleteFund(int fundId)
        {
            var fund = _repo
                .GetById(fundId);

            if (fund is null)
            {
                return false;
            }

            fund.Status = FundStatus.Completed;

            return _repo
                .Update(fund);
        }

        public async Task<bool> GenerateNewRoundAsync(FundToUpdateDTO dto)
        {
            var fund = await _repo
                .GetByIdAsync(dto.Id);

            if (fund is null || fund.Status != FundStatus.Completed)
            {
                return false;
            }

            var originalMemberIds = fund.Members
                .Select(m => m.Id)
                .ToHashSet();

            var commingMemberIds = dto.Members
                .Select(m => m.Id)
                .ToHashSet();

            if (!originalMemberIds.SetEquals(commingMemberIds))
            {
                return false;
            }

            using (var transaction = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
            {
                try
                {
                    fund.Title = dto.Title;
                    fund.ShareValue = dto.ShareValue;
                    fund.PeriodType = dto.PeriodType;
                    fund.StartDate = dto.StartDate.Date;
                    fund.CurrentRoundNumber++;

                    if (!await _repo.UpdateAsync(fund))
                    {
                        return false;
                    }

                    foreach (var member in dto.Members)
                    {
                        if (!await _memberService.UpdatePayoutOrderAsync(member))
                        {
                            return false;
                        }

                        var payout = new Payout
                        {
                            FundMemberId = member.Id,
                            RoundNumber = fund.CurrentRoundNumber,
                            PayoutOrderInRound = member.NewPayoutOrder,
                            Amount = fund.ShareValue * (dto.Members.Count - 1),
                            DueDate = GetDueDate(fund, member.NewPayoutOrder).Date,
                            CollectionDate = null,
                            Status = PayoutStatus.Disbursed
                        };

                        await _payoutRepo.AddAsync(payout);

                        if (payout.Id == -1)
                        {
                            return false;
                        }
                    }

                    return true;
                }
                catch
                {
                    return false;
                }
            }
        }

        private static DateTime GetDueDate(Fund fund, int memberPayoutOrder)
        {
            int offset = memberPayoutOrder - 1;

            return fund.PeriodType switch
            {
                PeriodType.Daily => fund.StartDate.AddDays(offset),
                PeriodType.Weekly => fund.StartDate.AddDays(offset * 7),
                PeriodType.Monthly => fund.StartDate.AddMonths(offset),
                _ => throw new InvalidEnumArgumentException()
            };
        }

        private void PayoutService_LastPayoutCollected(object? sender, Payouts.LastPayoutCollectedEventArgs e)
        {
            if (!CompleteFund(e.FundId))
            {
                throw new InvalidOperationException("فشلت عملية تغيير حالة الصندوق لمكتمل");
            }
        }

        public FundDTO MapToDTO(Fund fund)
        {
            if (fund == null) return null!;

            return new FundDTO
            {
                Id = fund.Id,
                Title = fund.Title,
                ShareValue = fund.ShareValue,
                PeriodType = fund.PeriodType,
                StartDate = fund.StartDate.Date,
                Status = fund.Status,
                CurrentRoundNumber = fund.CurrentRoundNumber,
                Wallet = new WalletDTO
                {
                    Id = fund.Wallet.Id,
                    Balance = fund.Wallet.Balance,
                    FundId = fund.Wallet.Id,
                    CurrencyCode = fund.Wallet.Currency.Code,
                    Transactions = fund.Wallet.Transactions
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
                },
                Members = fund.Members
                    .Select(m => _memberService.MapToDTO(m))
                    .ToList(),
                Payouts = fund.Payouts
                    .Select(p => _payoutService.MapToDTO(p))
                    .ToList(),
                CreatedAt = fund.CreatedAt
            };
        }

    }
}
