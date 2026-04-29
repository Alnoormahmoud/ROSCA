using ROSCA.Application.DTOs.FundMembers;
using ROSCA.Application.DTOs.Funds;
using ROSCA.Application.DTOs.Payouts;
using ROSCA.Application.DTOs.WalletTransactions;
using ROSCA.Domain.Entities.Funds;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ROSCA.Application.DTOs.Users
{
    public class UserDTO
    {
        public int Id { get; set; }

        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string NationalId { get; set; } = string.Empty;
        public string BankAccount { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
 
        public IntegrityProfileDTO? Profile { get; set; }

        public List<FundMemberDTO> Memberships { get; set; } = new();
        public List<WalletTransactionDTO> Transactions { get; set; } = new();
     }
}
