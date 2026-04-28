using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ROSCA.Application.DTOs.WalletTransactions;
using ROSCA.Application.Interfaces.WalletTransactions;
using ROSCA.Domain.Entities.WalletTransactions;
using ROSCA.Infrastructure.Persistence;

namespace ROSCA.Infrastructure.Repositories.WalletTransactions
{
    public class WalletTransactionRepository : IWalletTransactionRepository
    {
        private  AppDbContext _Context ;

        public WalletTransactionRepository(AppDbContext context)
        {
            _Context = context;
        }
      
        public async Task<int?> Add(Domain.Entities.WalletTransactions.WalletTransaction Transaction)
        {
           await _Context.WalletTransactions.AddAsync(Transaction);
            return await _Context.SaveChangesAsync() != 0 ?
                 Transaction.Id
                 : null;
       
        }

        public async Task<IEnumerable<Domain.Entities.WalletTransactions.WalletTransaction>> GetAll(TransactionsFilterDTO dto)
        {
            var Query = _Context.WalletTransactions.Where(x => x.User.Username == dto.UserName);
            if (dto.WalletId != null)
            {
                Query.Where(x => x.WalletId == dto.WalletId);
            }

            if (dto.TransactionType != null)
            {
                Query.Where(x => x.Type == dto.TransactionType);
            }
               
            return await Query
                  .Include(x => x.User)
                  .Include(x => x.Wallet)
                  .Include(x => x.Payout)
                  .ToListAsync();
        }

        public async Task<Domain.Entities.WalletTransactions.WalletTransaction?> GetById(int Id)
        {
            return await _Context.WalletTransactions
                 .Include(x => x.User)
                 .Include(x => x.Wallet)
                 .Include(x => x.Payout)
                 .FirstOrDefaultAsync(x => x.Id == Id);
        }
    }
}
