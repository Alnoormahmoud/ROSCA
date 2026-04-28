using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ROSCA.Application.DTOs.WalletTransactions
{
    public class PayoutTransactionToAddDTO
    {
        public int WalletId { get; set; }
        public int UserId { get; set; }
        public int PayoutId { get; set; }
    }
}
