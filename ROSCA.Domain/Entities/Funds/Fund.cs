using System;
using ROSCA.Domain.Entities.Bases;
using ROSCA.Domain.Entities.FundMembers;
using ROSCA.Domain.Entities.Users;
using ROSCA.Domain.Entities.Wallets;
using ROSCA.Domain.Enums.Funds;

namespace ROSCA.Domain.Entities.Funds
{
    public class Fund : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public int AdminId { get; set; }
        public string Description { get; set; } = null!;
        public int TotalMembers { get; set; }
        public decimal ShareValue { get; set; }
        public PeriodType PeriodType { get; set; }
        public DateTime StartDate { get; set; }
        public FundStatus Status { get; set; } = FundStatus.Active;
        public int CurrentRoundNumber { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual User Admin { get; set; } = null!;
        public virtual Wallet Wallet { get; set; } = null!;

        public virtual ICollection<FundMember> Members { get; set; } = new List<FundMember>();
    }
}
