using System;
using ROSCA.Application.DTOs.FundMembers;
using ROSCA.Application.DTOs.Payouts;
using ROSCA.Domain.Enums.Funds;

namespace ROSCA.Application.DTOs.Funds
{
    public class FundDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal ShareValue { get; set; }
        public PeriodType PeriodType { get; set; }
        public DateTime StartDate { get; set; }
        public FundStatus Status { get; set; } = FundStatus.Active;
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // TODO: مطلوب كائن نقل بيانات لكل من المستخدم و المحفظة
        // public User Admin { get; set; } = new User();
        // public Wallet Wallet { get; set; } = new Wallet();

        public ICollection<FundMemberDTO> Members { get; set; } = new List<FundMemberDTO>();
        public ICollection<PayoutDTO> Payouts { get; set; } = new List<PayoutDTO>();
    }
}
