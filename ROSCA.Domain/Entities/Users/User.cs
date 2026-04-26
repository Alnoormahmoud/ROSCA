using System;
using ROSCA.Domain.Entities.Bases;
using ROSCA.Domain.Entities.FundMembers;
using ROSCA.Domain.Entities.Funds;
using ROSCA.Domain.Entities.Payouts;
using ROSCA.Domain.Entities.WalletTransactions;

namespace ROSCA.Domain.Entities.Users
{
    public class User : BaseEntity
    {
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string NationalId { get; set; } = string.Empty;
        public string BankAccount { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public IntegrityProfile Profile { get; set; }

        public virtual ICollection<Fund> ManagedFunds { get; set; } = new List<Fund>();
        public virtual ICollection<FundMember> Memberships { get; set; } = new List<FundMember>();
        public virtual ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
        public virtual ICollection<Payout> Payouts { get; set; } = new List<Payout>();

        public struct IntegrityProfile
        {
            public int TotalRequired { get; set; }
            public int TotalPaid { get; set; }
            public int OnTimePayments { get; set; }
            public int LatePaymentsCount { get; set; }
            public int MissingPayments { get; set; }
            public decimal CommitmentRate { get; set; }
            public decimal RawScore { get; set; }
            public string Level { get; set; }
        }

    }
}
