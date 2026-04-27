using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ROSCA.Application.DTOs.Users
{
    public class UserToAddDTO
    {
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string NationalId { get; set; } = string.Empty;
        public string BankAccount { get; set; } = string.Empty;
    }
}
