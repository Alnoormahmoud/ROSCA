using System;
using Microsoft.EntityFrameworkCore;
using ROSCA.Domain.Entities.FundMembers;
using ROSCA.Domain.Entities.Funds;
using ROSCA.Domain.Entities.Payouts;
using ROSCA.Domain.Entities.Users;
using ROSCA.Domain.Entities.Wallets;
using ROSCA.Domain.Entities.WalletTransactions;

namespace ROSCA.Infrastructure.Persistence
{
    public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Fund> Funds { get; set; }
        public DbSet<FundMember> FundMembers { get; set; }
        public DbSet<Payout> Payouts { get; set; }
        public DbSet<Wallet> Wallets { get; set; }
        public DbSet<Currency> Currencies { get; set; }
        public DbSet<WalletTransaction> WalletTransactions { get; set; }
    }
}
