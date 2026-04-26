using System;
using ROSCA.Domain.Entities.Bases;
using ROSCA.Domain.Entities.Funds;
using ROSCA.Domain.Entities.Users;
using ROSCA.Domain.Enums.Payouts;

namespace ROSCA.Domain.Entities.Payouts
{
    public class Payout : BaseEntity
    {
        public int FundId { get; set; }
        public int UserId { get; set; }
        public int RoundNumber { get; set; }
        public int PayoutOrderInRound { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? CollectionDate { get; set; }
        public PayoutStatus Status { get; set; } = PayoutStatus.Disbursed;

        public virtual Fund Fund { get; set; } = new Fund();
        public virtual User Beneficiary { get; set; } = new User(); // صاحب الدور
    }
}
