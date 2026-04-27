using ROSCA.Application.DTOs.FundMembers;
using ROSCA.Application.DTOs.Payouts;
using ROSCA.Application.DTOs.Users;
using ROSCA.Application.DTOs.WalletTransactions;
using ROSCA.Application.Interfaces.Users;
using ROSCA.Domain.Entities.Users;
using static ROSCA.Domain.Entities.Users.User;

public class UserService : IUserService
{
    private readonly IUserRepository _repo;

    public UserService(IUserRepository repo)
    {
        _repo = repo;
    }

 

    public async Task<UserDTO?> GetByIdAsync(int id)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return null;

        return MapToDetailsDTO(user);
    }

    public async Task<List<UserSummaryDTO>> GetAllAsync()
    {
        var users = await _repo.GetAllAsync();

        return users.Select(u => new UserSummaryDTO
        {
            Id = u.Id,
            FullName = u.FullName,
            Username = u.Username,
            Level = u.Profile.Level
        }).ToList();
    }

    public async Task<UserDTO?> GetByUsernameAsync(string username)
    {
        var user = await _repo.GetByUsernameAsync(username);
        if (user == null) return null;

        return MapToDetailsDTO(user);
    }

    public async Task<UserDTO?> GetUserWithFinancialDataAsync(int userId)
    {
        var user = await _repo.GetUserWithFinancialDataAsync(userId);
        if (user == null) return null;

        return new UserDTO 
        {
            Id = user.Id,
            FullName = user.FullName,
            Username = user.Username,
            NationalId = user.NationalId,
            BankAccount = user.BankAccount,
            CreatedAt = user.CreatedAt,

            Profile = MapProfile(user.Profile),

            //this will be used in the future when we want to show the user their financial data on the dashboard, for now we will just return the profile data

            //Memberships = user.Memberships.Select(m => new FundMemberDTO
            //{
            //    UserId = m.UserId,
            //    FullName = user.FullName,
            //    HasPaid = m.HasPaid
            //}).ToList(),

            //Transactions = user.Transactions.Select(t => new WalletTransactionDTO
            //{
            //    Id = t.Id,
            //    Amount = t.Amount,
            //    Type = t.Type,
            //    Date = t.Date
            //}).ToList(),

            //Payouts = user.Payouts.Select(p => new PayoutDTO
            //{
            //    Id = p.Id,
            //    Amount = p.Amount,
            //    PayoutDate = p.PayoutDate
            //}).ToList()
        };
    }

 
    public async Task<int> AddAsync(UserToAddDTO dto)
    {
        var exists = await _repo.ExistsAsync(dto.Username, dto.NationalId);

        if (exists)
            throw new Exception("User already exists");

        var user = new User
        {
            FullName = dto.FullName,
            Username = dto.Username,
            Password = dto.Password, // ⚠️ hash later
            NationalId = dto.NationalId,
            BankAccount = dto.BankAccount,
            CreatedAt = DateTime.Now
        };

        return await _repo.AddAsync(user);
    }

 

    public async Task<bool> UpdateAsync(int id, UserToUpdateDTO dto)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return false;

        user.FullName = dto.FullName;
        user.BankAccount = dto.BankAccount;

        return await _repo.UpdateAsync(user);
    }

 

    public async Task<bool> DeleteAsync(int id)
    {
        return await _repo.DeleteAsync(id);
    }

  

    public async Task<bool> ExistsAsync(string username, string nationalId)
    {
        return await _repo.ExistsAsync(username, nationalId);
    }

 

    private UserDTO MapToDetailsDTO(User user)
    {
        return new UserDTO
        {
            Id = user.Id,
            FullName = user.FullName,
            Username = user.Username,
            NationalId = user.NationalId,
            BankAccount = user.BankAccount,
            CreatedAt = user.CreatedAt,
            Profile = MapProfile(user.Profile)
        };
    }

    private IntegrityProfileDTO MapProfile(IntegrityProfile profile)
    {
        return new IntegrityProfileDTO
        {
            TotalRequired = profile.TotalRequired,
            TotalPaid = profile.TotalPaid,
            OnTimePayments = profile.OnTimePayments,
            LatePaymentsCount = profile.LatePaymentsCount,
            MissingPayments = profile.MissingPayments,
            CommitmentRate = profile.CommitmentRate,
            RawScore = profile.RawScore,
            Level = profile.Level
        };
    }
}