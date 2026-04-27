using System;

namespace ROSCA.Application.DTOs.FundMembers
{
    public class FundMemberToUpdatePayoutOrderDTO
    {
        public int FundId { get; set; }
        public int UserId { get; set; }
        public int NewPayoutOrder { get; set; }
    }
}
