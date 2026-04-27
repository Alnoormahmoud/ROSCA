using System;
using ROSCA.Application.DTOs.FundMembers;
using ROSCA.Application.Interfaces.FundMembers;

namespace ROSCA.Application.Services.FundMembers
{
    public class FundMemberService : IFundMemberService
    {
        private readonly IFundMemberRepository _repo;

        public FundMemberService(IFundMemberRepository repo)
        {
            _repo = repo;
        }

        public async Task<bool> UpdatePayoutOrderAsync(FundMemberToUpdatePayoutOrderDTO dto)
        {
            var member = await _repo
                .GetByIdAsync(dto.Id);

            if (member is null)
            {
                return false;
            }

            member.PayoutOrder = dto.NewPayoutOrder;

            return await _repo
                .UpdateAsync(member);
        }

    }
}
