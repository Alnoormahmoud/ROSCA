using Microsoft.EntityFrameworkCore;
using ROSCA.Application.Interfaces.Users;
using ROSCA.Domain.Entities.Users;
using ROSCA.Infrastructure.Persistence;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }
 
    public async Task<User?> GetByIdAsync(int id)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<List<User>> GetAllAsync()
    {
        return await _context.Users.ToListAsync();
    }

    public async Task<int> AddAsync(User user)
    {
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
        return user.Id;
    }

    public async Task<bool> UpdateAsync(User user)
    {
        _context.Users.Update(user);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        _context.Users.Remove(user);
        return await _context.SaveChangesAsync() > 0;
    }

 
    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<bool> ExistsAsync(string username, string nationalId)
    {
        return await _context.Users
            .AnyAsync(u => u.Username == username || u.NationalId == nationalId);
    }

 
    public async Task<User?> GetUserWithFinancialDataAsync(int userId)
    {
        return await _context.Users
            .Include(u => u.Memberships)
                .ThenInclude(fm => fm.Fund)

            .Include(u => u.Transactions)

            .Include(u => u.Payouts)

            .FirstOrDefaultAsync(u => u.Id == userId);
    }
}