using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ROSCA.Domain.Enums.WalletTransactions;

namespace ROSCA.Application.DTOs.WalletTransactions
{
    public class WalletTransactionDTO
    {
        public int TransactionId {  get; set; }
        public int WalletId { get; set; }
        public int? UserId { get; set; }
        public int PayoutId { get; set; }

        public decimal Amount { get; set; }
        public TransactionType Type { get; set; }
        public DateTime PaymentDate { get; set; }


    }
}
