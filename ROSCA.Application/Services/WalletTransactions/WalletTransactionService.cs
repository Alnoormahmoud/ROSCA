using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Transactions;
using ROSCA.Application.DTOs.WalletTransactions;
using ROSCA.Application.Interfaces.Wallets;
using ROSCA.Application.Interfaces.WalletTransactions;
using ROSCA.Domain.Entities.WalletTransactions;

namespace ROSCA.Application.Services.WalletTransactions
{
    public class WalletTransactionService : IWalletTransactionService
    {
        private readonly IWalletTransactionRepository _TransactionRepo;
        private IWalletService _WalletService;
        public WalletTransactionService(IWalletTransactionRepository Repo, IWalletService walletService)
        {
            _TransactionRepo = Repo;
            _WalletService = walletService;
        }

        //TODO: Add Payout from wallet logic
        public async Task<int?> AddContributionTransactionAsync(ContributionToAddDTO dto)
        {
            int? NewID = null;
            var WalletTransaction = new WalletTransaction();
            WalletTransaction.WalletId = dto.WalletId;
            WalletTransaction.UserId = dto.UserId;
            WalletTransaction.PayoutId = dto.PayoutId;
            WalletTransaction.Amount = dto.Amount;
            WalletTransaction.Type = Domain.Enums.WalletTransactions.TransactionType.Contribution;
            WalletTransaction.PaymentDate = DateTime.Now;

            using (TransactionScope transactionScope = new TransactionScope())
            {
                try
                {
                    NewID = await _TransactionRepo.Add(WalletTransaction);

                    await _WalletService.DepositAsync(WalletTransaction.WalletId, WalletTransaction.Amount);

                    transactionScope.Complete();
                }
                catch (Exception ex)
                {
                    NewID = null;
                }

            }

            return NewID;
        }

        public async Task<IEnumerable<WalletTransactionDTO>> GetAllAsync()
        {
            return MapToDTOs(await _TransactionRepo.GetAll());
        }

        public async Task<WalletTransactionDTO?> GetByIdAsync(int Id)
        {
            var Transaction = await _TransactionRepo.GetById(Id);
            return Transaction is null?
                null
                : MapToDTO(Transaction);
            
        }

        public static WalletTransactionDTO MapToDTO(WalletTransaction Transaction)
        {
            return new WalletTransactionDTO()
            {
                Id = Transaction.Id,
                WalletId = Transaction.WalletId,
                UserId = Transaction.UserId,
                PayoutId = Transaction.PayoutId,
                Amount = Transaction.Amount,
                Type = Transaction.Type,
                PaymentDate = Transaction.PaymentDate
            };
        }

        public static IEnumerable<WalletTransactionDTO> MapToDTOs(IEnumerable<WalletTransaction> Transactions)
        {
            List<WalletTransactionDTO> DTOs = new List<WalletTransactionDTO>();
            foreach (WalletTransaction Transaction in Transactions)
            {
                DTOs.Add(MapToDTO(Transaction));
            }
            return DTOs;
        }
    
    }
}
