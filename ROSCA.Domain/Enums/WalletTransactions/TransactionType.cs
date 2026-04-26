using System;

namespace ROSCA.Domain.Enums.WalletTransactions
{
    public enum TransactionType : byte
    {
        Contribution = 1, // In
        Payout = 2        // Out
    }
}
