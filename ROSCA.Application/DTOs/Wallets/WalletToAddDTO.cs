using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ROSCA.Application.DTOs.Wallets
{
    public class WalletToAddDTO
    {
        public int FundId { get; set; }
        public decimal Balance { get; set; } = 0;
        public int CurrencyId { get; set; }
    }
}
