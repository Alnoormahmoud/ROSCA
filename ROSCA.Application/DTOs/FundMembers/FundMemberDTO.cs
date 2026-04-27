using System;
using ROSCA.Application.DTOs.Funds;
using ROSCA.Domain.Entities.Funds;
using ROSCA.Domain.Entities.Users;

namespace ROSCA.Application.DTOs.FundMembers
{
    public class FundMemberDTO
    {
        public int Id { get; set; }
        public int PayoutOrder { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public FundDTO Fund { get; set; } = new FundDTO();

        // TODO: مطلوب كائن نقل بيانات المستخدم
        // public User User { get; set; } = new User();
    }
}
