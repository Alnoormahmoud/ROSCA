using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ROSCA.Application.DTOs.Wallets;
using ROSCA.Application.Interfaces.Wallets;
using ROSCA.Application.Services.WalletTransactions;
using ROSCA.Domain.Entities.Wallets;

namespace ROSCA.Application.Services.Wallets
{
    public class WalletService : IWalletService
    {
        private readonly IWalletRepository _Repo;
        public WalletService(IWalletRepository repo)
        {
            _Repo = repo;
        }
        public async Task<int?> AddAsync(WalletToAddDTO dto)
        {
            Wallet NewWallet = new Wallet();
            NewWallet.FundId = dto.FundId;
            NewWallet.CurrencyId = dto.CurrencyId;
            NewWallet.Balance = 0;

            return await _Repo.AddAsync(NewWallet);
            
        }

       
        public async Task<IEnumerable<WalletDTO>> GetAllAsync()
        {
            return _MapToDTOs( await _Repo.GetAllAsync());
        }

        public async Task<WalletDTO?> GetByIdAsync(int WalletId)
        {
            var Wallet = await _Repo.GetByIdAsync(WalletId);
           return Wallet is null?
                null
                : _MapToDTO(Wallet);
        }

        public async Task<WalletDTO?> GetByFundIdAsync(int FundId)
        {
            var Wallet = await _Repo.GetByFundIdAsync(FundId);
            return Wallet is null ?
                 null
                 : _MapToDTO(Wallet);
        }

        public async Task<bool> DepositAsync(int WalletId, decimal Amount)
        {
           var Wallet = await _Repo.GetByIdAsync(WalletId);

            if (Wallet is null)
                return false; //wallet is not found

            Wallet.Balance += Amount;

           return await _Repo.UpdateBalanceAsync(WalletId, Wallet.Balance);
        }
  

        public async Task<bool> WithdrawAsync(int WalletId, decimal Amount)
        {
            var Wallet = await _Repo.GetByIdAsync(WalletId);

            if (Wallet is null)
                return false; //wallet is not found

            if (Wallet.Balance < Amount)
                return false; //Failed: Amount is greater than balance

            Wallet.Balance -= Amount;

            return await _Repo.UpdateBalanceAsync(WalletId, Wallet.Balance);
        }

        public async Task<IEnumerable<string>> GetAllCurrenciesCodesAsync()
        {
            List<string> Codes = new List<string>();

            foreach (var Currency in await _Repo.GetAllCurrenciesAsync())
            {
                Codes.Add(Currency.Code);
            }
           
            return Codes;
        }

        private WalletDTO _MapToDTO(Wallet wallet)
        {
            return new WalletDTO()
            {
                Id = wallet.Id,
                FundId = wallet.FundId,
                CurrencyCode = wallet.Currency.Code,
                Balance = wallet.Balance,
                Transactions = WalletTransactionService.MapToDTOs(wallet.Transactions)

            };
        }

        private IEnumerable<WalletDTO> _MapToDTOs(IEnumerable<Wallet> wallets)
        {
            List<WalletDTO> DTOs = new List<WalletDTO>();
            
            foreach (var wallet in wallets)
            {
                DTOs.Add(_MapToDTO(wallet));
            }

            return DTOs;
        }

       
    }
}
