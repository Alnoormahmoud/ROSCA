using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ROSCA.Application.DTOs.Wallets;
using ROSCA.Domain.Entities.Wallets;

namespace ROSCA.Application.Interfaces.Wallets
{
    public interface IWalletService
    {
        public Task<int?> AddAsync(WalletToAddDTO wallet);
        public Task<WalletDTO?> GetByIdAsync(int Id);

        public Task<WalletDTO?> GetByFundIdAsync(int FundId);

        public Task<IEnumerable<WalletDTO>> GetAllAsync();

        public Task<bool> DepositAsync(int WalletId, decimal Amount);

        public Task<bool> WithdrawAsync(int WalletId, decimal Amount);

        public Task<IEnumerable<string>> GetAllCurrenciesCodesAsync();
    }
}
