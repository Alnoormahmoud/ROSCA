using ROSCA.Application.DTOs.Users;
using ROSCA.Domain.Entities.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ROSCA.Application.Interfaces.Users
{
    public  interface IUserService
    {
        Task<UserDTO?> GetByIdAsync(int id);
        Task<List<UserSummaryDTO>> GetAllAsync();
        Task<int> AddAsync(UserToAddDTO dto);
        Task<bool> UpdateAsync(int id, UserToUpdateDTO dto);
        Task<bool> DeleteAsync(int id);
        Task<UserDTO?> GetByUsernameAsync(string username);
        Task<bool> ExistsAsync(string username, string nationalId);
        Task<UserDTO?> GetUserWithFinancialDataAsync(int userId);
        Task<UserDTO?> LoginAsync(string username, string password);

    }
}
