using System;
using ROSCA.Domain.Entities.Funds;

namespace ROSCA.Application.Interfaces.Funds
{
    public interface IFundRepository
    {
        Task<Fund?> GetByIdAsync(int id);
        Task<int> AddAsync(Fund fund);
        Task<bool> UpdateAsync(Fund fund);
    }
}
