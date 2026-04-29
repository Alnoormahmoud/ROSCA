using System;
using Microsoft.EntityFrameworkCore;
using ROSCA.Application.Interfaces.Funds;
using ROSCA.Domain.Entities.Funds;
using ROSCA.Infrastructure.Persistence;

namespace ROSCA.Infrastructure.Repositories.Funds
{
    public class FundRepository : IFundRepository
    {
        private readonly AppDbContext _context;

        public FundRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Fund?> GetByIdAsync(int id)
        {
            return await _context.Funds
                .Include(f => f.Wallet)
                    .ThenInclude(w => w.Currency)
                .Include(f => f.Wallet)
                    .ThenInclude(w => w.Transactions)
                .Include(f => f.Admin)
                .Include(f => f.Members)
                    .ThenInclude(m => m.Payouts)
                .FirstOrDefaultAsync(f => f.Id == id);
        }

        public Fund? GetById(int id)
        {
            return _context.Funds
                .Include(f => f.Wallet)
                    .ThenInclude(w => w.Currency)
                .Include(f => f.Wallet)
                    .ThenInclude(w => w.Transactions)
                .Include(f => f.Admin)
                .Include(f => f.Members)
                .Include(f => f.Members)
                    .ThenInclude(m => m.Payouts)
                .FirstOrDefault(f => f.Id == id);
        }

        public async Task<int> AddAsync(Fund fund)
        {
            if (fund is null) return -1;

            await _context.Funds
                .AddAsync(fund);

            await _context
                .SaveChangesAsync();

            return fund.Id;
        }

        public async Task<bool> UpdateAsync(Fund fund)
        {
            _context.Funds
                .Update(fund);

            return await _context
                .SaveChangesAsync() > 0;
        }

        public bool Update(Fund fund)
        {
            _context.Funds
                .Update(fund);

            return _context
                .SaveChanges() > 0;
        }

    }
}
