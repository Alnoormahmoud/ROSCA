using System;
using ROSCA.Application.DTOs.Funds;
using ROSCA.Domain.Entities.Funds;

namespace ROSCA.Application.Interfaces.Funds
{
    public interface IFundService
    {
        Task<FundDTO?> GetByIdAsync(int id);
        Task<int> CreateFundAsync(FundToAddDTO dto);
        Task<bool> GenerateNewRoundAsync(FundToUpdateDTO dto);
        Task<bool> CompleteFundAsync(int fundId);
        public FundDTO MapToDTO(Fund fund);
    }
}
