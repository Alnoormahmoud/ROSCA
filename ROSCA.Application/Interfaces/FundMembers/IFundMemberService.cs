using System;
using ROSCA.Application.DTOs.FundMembers;

namespace ROSCA.Application.Interfaces.FundMembers
{
    public interface IFundMemberService
    {
        Task<bool> UpdatePayoutOrderAsync(FundMemberToUpdatePayoutOrderDTO dto);
    }
}
