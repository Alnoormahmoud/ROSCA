using ROSCA.Domain.Entities.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ROSCA.Application.Interfaces.Users
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(int id);
        Task<List<User>> GetAllAsync();

        Task<int> AddAsync(User user);
        Task<bool> UpdateAsync(User user);
        Task<bool> DeleteAsync(int id);

        Task<User?> GetByUsernameAsync(string username);
        Task<bool> ExistsAsync(string username, string nationalId);

        Task<User?> GetUserWithFinancialDataAsync(int userId);
    }
}
