using System;
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
    }
}
