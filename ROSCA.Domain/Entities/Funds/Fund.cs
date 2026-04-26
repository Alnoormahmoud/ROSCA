using System;
using ROSCA.Domain.Entities.Bases;
using ROSCA.Domain.Entities.FundMembers;
using ROSCA.Domain.Entities.Payouts;
using ROSCA.Domain.Entities.Users;
using ROSCA.Domain.Entities.Wallets;
using ROSCA.Domain.Enums.Funds;

namespace ROSCA.Domain.Entities.Funds
{
    public class Fund : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public int AdminId { get; set; }
        public decimal ShareValue { get; set; }
        public PeriodType PeriodType { get; set; }
        public DateTime StartDate { get; set; }
        public FundStatus Status { get; set; } = FundStatus.Active;
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public virtual User Admin { get; set; } = new User();
        public virtual Wallet Wallet { get; set; } = new Wallet();
        public virtual ICollection<FundMember> Members { get; set; } = new List<FundMember>();
        public virtual ICollection<Payout> Payouts { get; set; } = new List<Payout>();
    }
}
