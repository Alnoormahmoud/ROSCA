using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ROSCA.Application.Interfaces.Wallets;
using ROSCA.Domain.Entities.Wallets;
using ROSCA.Infrastructure.Persistence;

namespace ROSCA.Infrastructure.Repositories.Wallets
{
    public class WalletRepository : IWalletRepository
    {
        private readonly AppDbContext _Context;
        public WalletRepository(AppDbContext Context)
        {
            _Context = Context;
        }
        public async Task<int?> AddAsync(Wallet wallet)
        {
           await _Context.AddAsync(wallet);
            return await _Context.SaveChangesAsync() != 0 ?
                wallet.Id
                : null;

        }

        public async Task<IEnumerable<Wallet>> GetAllAsync()
        {
            return await _Context.Wallets
                 .Include(x => x.Fund)
                 .Include(x => x.Currency)
                 .ToListAsync();
        }

        public async Task<IEnumerable<Currency>> GetAllCurrenciesAsync()
        {
            return await _Context.Currencies.ToListAsync();
        }

        public async Task<Wallet?> GetByFundIdAsync(int FundId)
        {
            return await _Context.Wallets
                   .Include(x => x.Fund)
                   .Include(x => x.Currency)
                   .FirstOrDefaultAsync(x => x.FundId == FundId);
        }

        public async Task<Wallet?> GetByIdAsync(int Id)
        {
            return await _Context.Wallets
                   .Include(x => x.Fund)
                   .Include(x => x.Currency)
                   .FirstOrDefaultAsync(x => x.Id == Id);
        }

        public async Task<bool> UpdateBalanceAsync(int WalletId, decimal NewBalance)
        {
           var Wallet = await _Context.Wallets.FindAsync(WalletId);

            if (Wallet == null)
                return false; //wallet is not found

            Wallet.Balance = NewBalance;

            return await _Context.SaveChangesAsync() != 0;


        }
    }
}
