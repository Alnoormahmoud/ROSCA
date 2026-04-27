using System;
using ROSCA.Application.DTOs.FundMembers;
using ROSCA.Application.DTOs.Funds;

namespace ROSCA.Application.Interfaces.Funds
{
    public interface IFundService
    {
        Task<int> CreateFundAsync(FundToAddDTO dto);
        Task<bool> GenerateNewRoundAsync(FundToUpdateDTO dto, ICollection<FundMemberToUpdatePayoutOrderDTO> members);
        Task<bool> CompleteFundAsync(int fundId);
    }
}
