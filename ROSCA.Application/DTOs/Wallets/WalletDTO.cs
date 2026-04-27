using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ROSCA.Application.DTOs.WalletTransactions;

namespace ROSCA.Application.DTOs.Wallets
{
    public class WalletDTO
    {
        public int Id { get; set; }
        public int FundId { get; set; }
        public decimal Balance { get; set; }
        public string CurrencyCode { get; set; } = string.Empty;

        public IEnumerable<WalletTransactionDTO> Transactions { get; set; } = new List<WalletTransactionDTO>();

    }
}
