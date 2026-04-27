using System;
using ROSCA.Domain.Entities.FundMembers;

namespace ROSCA.Application.Interfaces.FundMembers
{
    public interface IFundMemberRepository
    {
        Task<FundMember?> GetByIdAsync(int id);
        Task<FundMember?> GetMemberAsync(int fundId, int userId);
        Task<int> AddAsync(FundMember member);
        Task<IEnumerable<int>> AddRangeAsync(IEnumerable<FundMember> members);
        Task<bool> UpdateAsync(FundMember member);
    }
}
