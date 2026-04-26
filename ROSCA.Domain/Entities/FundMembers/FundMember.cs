using System;
using ROSCA.Domain.Entities.Bases;
using ROSCA.Domain.Entities.Funds;
using ROSCA.Domain.Entities.Users;

namespace ROSCA.Domain.Entities.FundMembers
{
    public class FundMember : BaseEntity
    {
        public int UserId { get; set; }
        public int FundId { get; set; }
        public int PayoutOrder { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public virtual User User { get; set; } = new User();
        public virtual Fund Fund { get; set; } = new Fund();
    }
}
