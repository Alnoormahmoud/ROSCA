using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ROSCA.Application.Interfaces.Wallets;
using ROSCA.Application.Interfaces.WalletTransactions;
using ROSCA.Infrastructure.Persistence;
using ROSCA.Application.Interfaces.FundMembers;
using ROSCA.Application.Interfaces.Funds;
using ROSCA.Application.Interfaces.Payouts;
using ROSCA.Infrastructure.Repositories.FundMembers;
using ROSCA.Infrastructure.Repositories.Funds;
using ROSCA.Infrastructure.Repositories.Payouts;
using ROSCA.Infrastructure.Repositories.Wallets;
using ROSCA.Infrastructure.Repositories.WalletTransactions;

namespace ROSCA.Infrastructure
{
    public static class DependencyInjection 
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connection)
        {
            services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connection));
            services.AddScoped<IUserRepository, UserRepository>();

            services.AddScoped<IFundRepository, FundRepository>();
            services.AddScoped<IFundMemberRepository, FundMemberRepository>();
            services.AddScoped<IPayoutRepository, PayoutRepository>();
            services.AddScoped<IWalletRepository, WalletRepository>();
            services.AddScoped<IWalletTransactionRepository, WalletTransactionRepository>();

            return services;
        }
    }
}
