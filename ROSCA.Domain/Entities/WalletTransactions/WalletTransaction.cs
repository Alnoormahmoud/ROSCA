using System;
using ROSCA.Domain.Entities.Bases;
using ROSCA.Domain.Entities.Payouts;
using ROSCA.Domain.Entities.Users;
using ROSCA.Domain.Entities.Wallets;
using ROSCA.Domain.Enums.WalletTransactions;

namespace ROSCA.Domain.Entities.WalletTransactions
{
    public class WalletTransaction : BaseEntity
    {
        public int WalletId { get; set; }
        public int? UserId { get; set; }
        public int PayoutId { get; set; }
        public decimal Amount { get; set; }
        public TransactionType Type { get; set; }
        public DateTime PaymentDate { get; set; } = DateTime.Now;

        public virtual Wallet Wallet { get; set; } = null!;
        public virtual User User { get; set; } = null!;
        public virtual Payout Payout { get; set; } = null!;
    }
}
