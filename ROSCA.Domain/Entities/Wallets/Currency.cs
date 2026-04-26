using System;
using ROSCA.Domain.Entities.Bases;

namespace ROSCA.Domain.Entities.Wallets
{
    public class Currency : BaseEntity
    {
        public string Code { get; set; } = string.Empty;

        public virtual ICollection<Wallet> Wallets { get; set; } = new List<Wallet>();
    }
}
