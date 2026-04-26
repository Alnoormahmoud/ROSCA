using System;

namespace ROSCA.Domain.Enums.Payouts
{
    public enum PayoutStatus : byte
    {
        Pending = 1,
        Collected = 2,
        Disbursed = 3
    }
}
