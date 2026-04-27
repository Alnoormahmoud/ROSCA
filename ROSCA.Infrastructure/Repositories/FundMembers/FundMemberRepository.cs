using System;
using Microsoft.EntityFrameworkCore;
using ROSCA.Application.Interfaces.FundMembers;
using ROSCA.Domain.Entities.FundMembers;
using ROSCA.Infrastructure.Persistence;

namespace ROSCA.Infrastructure.Repositories.FundMembers
{
    public class FundMemberRepository : IFundMemberRepository
    {
        private readonly AppDbContext _context;

        public FundMemberRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<FundMember?> GetByIdAsync(int id)
        {
            return await _context.FundMembers
                .Include(m => m.User)
                .Include(m => m.Fund)
                .Include(m => m.Payouts)
                .FirstOrDefaultAsync(f => f.Id == id);
        }

        public async Task<FundMember?> GetMemberAsync(int fundId, int userId)
        {
            return await _context.FundMembers
                .Include(m => m.Fund)
                .Include(m => m.User)
                .Include(m => m.Payouts)
                .FirstOrDefaultAsync(m => m.FundId == fundId && m.UserId == userId);
        }

        public async Task<int> AddAsync(FundMember member)
        {
            if (member is null) return -1;

            await _context.FundMembers
                .AddAsync(member);

            await _context
                .SaveChangesAsync();

            return member.Id;
        }

        public async Task<IEnumerable<int>> AddRangeAsync(IEnumerable<FundMember> members)
        {
            if (members is null || !members.Any()) return new List<int>();

            await _context.FundMembers
                .AddRangeAsync(members);

            await _context
                .SaveChangesAsync();

            return members
                .Select(p => p.Id)
                .ToList();
        }

        public async Task<bool> UpdateAsync(FundMember member)
        {
            _context.FundMembers
                .Update(member);

            return await _context
                .SaveChangesAsync() > 0;
        }

    }
}
