using System;
using Microsoft.EntityFrameworkCore;
using ROSCA.Application.Interfaces.Payouts;
using ROSCA.Domain.Entities.Payouts;
using ROSCA.Infrastructure.Persistence;

namespace ROSCA.Infrastructure.Repositories.Payouts
{
    public class PayoutRepository : IPayoutRepository
    {
        private readonly AppDbContext _context;

        public PayoutRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Payout?> GetByIdAsync(int id)
        {
            return await _context.Payouts
                .Include(p => p.Member)
                .Include(p => p.Transactions)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<int> AddAsync(Payout payout)
        {
            if (payout is null) return -1;

            await _context.Payouts
                .AddAsync(payout);

            await _context
                .SaveChangesAsync();

            return payout.Id;
        }

        public async Task<IEnumerable<int>> AddRangeAsync(IEnumerable<Payout> payouts)
        {
            if (payouts is null || !payouts.Any()) return new List<int>();

            await _context.Payouts
                .AddRangeAsync(payouts);

            await _context
                .SaveChangesAsync();

            return payouts
                .Select(p => p.Id)
                .ToList();
        }

        public async Task<bool> UpdateAsync(Payout payout)
        {
            _context.Payouts
                .Update(payout);

            return await _context
                .SaveChangesAsync() > 0;
        }

    }
}
