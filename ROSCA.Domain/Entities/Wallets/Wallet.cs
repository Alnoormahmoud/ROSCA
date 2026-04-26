using System;
using ROSCA.Domain.Entities.Bases;
using ROSCA.Domain.Entities.Funds;
using ROSCA.Domain.Entities.WalletTransactions;

namespace ROSCA.Domain.Entities.Wallets
{
    public class Wallet : BaseEntity
    {
        public int FundId { get; set; }
        public int CurrencyId { get; set; }
        public decimal Balance { get; set; }

        public virtual Fund Fund { get; set; } = new Fund();
        public virtual Currency Currency { get; set; } = new Currency();
        public virtual ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
    }
}
