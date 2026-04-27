using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ROSCA.Domain.Enums.WalletTransactions;

namespace ROSCA.Application.DTOs.WalletTransactions
{
    public class ContributionToAddDTO
    {
        public int WalletId { get; set; }
        public int UserId { get; set; }
        public int PayoutId { get; set; }

        public decimal Amount { get; set; }
        
    }
}
