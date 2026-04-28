using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ROSCA.Domain.Enums.WalletTransactions;

namespace ROSCA.Application.DTOs.WalletTransactions
{
    public class TransactionsFilterDTO
    {
        public int? WalletId { get; set; } = null;
        public required string UserName { get; set; }
        public TransactionType? TransactionType { get; set; } = null;
    }
}
