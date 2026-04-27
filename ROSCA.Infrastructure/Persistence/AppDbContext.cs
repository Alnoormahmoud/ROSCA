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
        public DbSet<IntegrityProfile> IntegrityProfiles { get; set; }

        override protected void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            base.OnModelCreating(modelBuilder);

            // 1. Configure the View mapping
            modelBuilder.Entity<IntegrityProfile>(entity =>
            {
                entity.ToView("IntegrityProfiles"); // Use your actual SQL View name

                // Define the Primary Key for the entity within EF
                entity.HasKey(e => e.UserId);
            });

            // 2. Explicitly define the One-to-One relationship
            modelBuilder.Entity<User>()
                .HasOne(u => u.Profile)
                .WithOne() // No navigation property back to User inside IntegrityProfile
                .HasForeignKey<IntegrityProfile>(p => p.UserId) // Use the existing UserId
                .IsRequired(false); // Since it's a View, it might be null if no data exists
        }
    }
}
