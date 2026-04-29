using System;
using ROSCA.Domain.Entities.Bases;
using ROSCA.Domain.Entities.FundMembers;
using ROSCA.Domain.Entities.Funds;
using ROSCA.Domain.Entities.Payouts;
using ROSCA.Domain.Entities.WalletTransactions;

namespace ROSCA.Domain.Entities.Users
{
    public class User
    {
        public int Id { get; set; } // Ensure you have your Primary Key
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string NationalId { get; set; } = string.Empty;
        public string BankAccount { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation Property to the View
        public virtual IntegrityProfile Profile { get; set; }

       
        public virtual ICollection<FundMember> Memberships { get; set; } = new List<FundMember>();
        public virtual ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
     }

}
