using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ROSCA.Application.DTOs.WalletTransactions;
using ROSCA.Domain.Entities.WalletTransactions;

namespace ROSCA.Application.Interfaces.WalletTransactions
{
    public interface IWalletTransactionService
    {
        public Task<int?> AddContributionTransactionAsync(ContributionToAddDTO Transaction);
        public Task<WalletTransactionDTO?> GetByIdAsync(int Id);

        public Task<IEnumerable<WalletTransactionDTO>> GetAllAsync();
    }
}
