using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ROSCA.Application.DTOs.WalletTransactions;
using ROSCA.Domain.Entities.WalletTransactions;

namespace ROSCA.Application.Interfaces.WalletTransactions
{
    public interface IWalletTransactionRepository
    {
        public Task<int?> Add(WalletTransaction Transaction);
        public Task<WalletTransaction?> GetById(int Id);

        public Task<IEnumerable<WalletTransaction>> GetAll(TransactionsFilterDTO dto);


    }
}
