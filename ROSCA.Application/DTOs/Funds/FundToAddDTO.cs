using System;
using ROSCA.Application.DTOs.FundMembers;
using ROSCA.Domain.Enums.Funds;

namespace ROSCA.Application.DTOs.Funds
{
    public class FundToAddDTO
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int AdminId { get; set; }
        public int CurrencyId { get; set; }
        public decimal ShareValue { get; set; }
        public PeriodType PeriodType { get; set; }
        public DateTime StartDate { get; set; }

        public ICollection<FundMemberToAddDTO> Members { get; set; } = new List<FundMemberToAddDTO>();
    }
}
