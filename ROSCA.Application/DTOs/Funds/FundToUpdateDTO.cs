using System;
using ROSCA.Application.DTOs.FundMembers;
using ROSCA.Domain.Enums.Funds;

namespace ROSCA.Application.DTOs.Funds
{
    public class FundToUpdateDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal ShareValue { get; set; }
        public PeriodType PeriodType { get; set; }
        public DateTime StartDate { get; set; }

        public ICollection<FundMemberToUpdatePayoutOrderDTO> Members { get; set; } = new List<FundMemberToUpdatePayoutOrderDTO>();
    }
}
