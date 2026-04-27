using System;
using ROSCA.Application.DTOs.Funds;
using ROSCA.Domain.Enums.Payouts;

namespace ROSCA.Application.DTOs.Payouts
{
    public class PayoutDTO
    {
        public int Id { get; set; }
        public int RoundNumber { get; set; }
        public int PayoutOrderInRound { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? CollectionDate { get; set; }
        public PayoutStatus Status { get; set; } = PayoutStatus.Disbursed;

        public FundDTO Fund { get; set; } = new FundDTO();

        // TODO: مطلوب كائن نقل بيانات المستخدم
        // public User User { get; set; } = new User();
    }
}
