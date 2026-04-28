using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace ROSCA.Application.DTOs.FundMembers
{
    public class FundMemberDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int FundId { get; set; }
        public int PayoutOrder { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
