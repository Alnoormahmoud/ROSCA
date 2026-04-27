using System;
using ROSCA.Domain.Entities.Bases;
using ROSCA.Domain.Entities.Funds;
using ROSCA.Domain.Entities.Payouts;
using ROSCA.Domain.Entities.Users;

namespace ROSCA.Domain.Entities.FundMembers
{
    public class FundMember : BaseEntity
    {
        public int UserId { get; set; }
        public int FundId { get; set; }
        public int PayoutOrder { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; } = new User();
        public virtual Fund Fund { get; set; } = new Fund();

        public virtual ICollection<Payout> Payouts { get; set; } = new List<Payout>();
    }
}
