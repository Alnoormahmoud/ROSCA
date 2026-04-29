using System;
using ROSCA.Domain.Entities.Bases;
using ROSCA.Domain.Entities.FundMembers;
using ROSCA.Domain.Entities.WalletTransactions;
using ROSCA.Domain.Enums.Payouts;

namespace ROSCA.Domain.Entities.Payouts
{
    public class Payout : BaseEntity
    {
        public int FundMemberId { get; set; }
        public int RoundNumber { get; set; }
        public int PayoutOrderInRound { get; set; }
        public decimal Amount { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? CollectionDate { get; set; }
        public PayoutStatus Status { get; set; } = PayoutStatus.Disbursed;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual FundMember Member { get; set; } = null!;

        public virtual ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
    }
}
