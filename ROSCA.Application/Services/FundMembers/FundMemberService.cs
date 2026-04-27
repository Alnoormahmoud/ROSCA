using System;
using ROSCA.Application.DTOs.FundMembers;
using ROSCA.Application.DTOs.Funds;
using ROSCA.Application.Interfaces.FundMembers;
using ROSCA.Domain.Entities.FundMembers;

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

        public FundMemberDTO MapToDTO(FundMember member)
        {
            if (member == null) return null!;

            return new FundMemberDTO
            {
                Id = member.Id,
                PayoutOrder = member.PayoutOrder,
                CreatedAt = member.CreatedAt,
                FundId = member.FundId,
                UserId = member.UserId
            };
        }

    }
}
