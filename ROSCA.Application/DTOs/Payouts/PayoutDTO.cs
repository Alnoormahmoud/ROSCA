using System;
using ROSCA.Domain.Enums.Payouts;

namespace ROSCA.Application.DTOs.Payouts
{
    public class PayoutDTO
    {
        public int Id { get; set; }
        public int FundMemberId { get; set; }
        public int RoundNumber { get; set; }
        public int PayoutOrderInRound { get; set; }
        public decimal Amount { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? CollectionDate { get; set; }
        public PayoutStatus Status { get; set; } = PayoutStatus.Disbursed;
    }
}