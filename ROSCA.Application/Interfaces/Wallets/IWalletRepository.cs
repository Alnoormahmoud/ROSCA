using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ROSCA.Domain.Entities.Wallets;

namespace ROSCA.Application.Interfaces.Wallets
{
    public interface IWalletRepository
    {
        public Task<int?> AddAsync(Wallet wallet);
        public Task<Wallet?> GetByIdAsync(int Id);

        public Task<Wallet?> GetByFundIdAsync (int FundId );
        public Task<IEnumerable<Wallet>> GetAllAsync();

        public Task<bool> UpdateBalanceAsync(int WalletId, decimal NewBalance);

        public Task<IEnumerable<Currency>> GetAllCurrenciesAsync();


    }
}
