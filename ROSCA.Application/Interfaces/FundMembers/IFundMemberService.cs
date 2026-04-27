using System;
using ROSCA.Application.DTOs.FundMembers;
using ROSCA.Domain.Entities.FundMembers;

namespace ROSCA.Application.Interfaces.FundMembers
{
    public interface IFundMemberService
    {
        Task<bool> UpdatePayoutOrderAsync(FundMemberToUpdatePayoutOrderDTO dto);
        FundMemberDTO MapToDTO(FundMember member);
    }
}
