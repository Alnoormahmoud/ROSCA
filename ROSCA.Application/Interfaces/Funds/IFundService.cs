using System;
using ROSCA.Application.DTOs.Funds;

namespace ROSCA.Application.Interfaces.Funds
{
    public interface IFundService
    {
        Task<int> CreateFundAsync(FundToAddDTO dto);
        Task<bool> GenerateNewRoundAsync(int fundId);
        Task<bool> CompleteFundAsync(int fundId);
    }
}
