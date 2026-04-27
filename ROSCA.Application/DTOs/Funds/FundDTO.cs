using System;
using ROSCA.Domain.Enums.Funds;

namespace ROSCA.Application.DTOs.Funds
{
    public class FundDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int AdminId { get; set; }
        public decimal ShareValue { get; set; }
        public PeriodType PeriodType { get; set; }
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public FundStatus Status { get; set; } = FundStatus.Active;
        public int CurrentRoundNumber { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
