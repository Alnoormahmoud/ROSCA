using System;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ROSCA.Application.Interfaces.FundMembers;
using ROSCA.Application.Interfaces.Funds;
using ROSCA.Application.Interfaces.Payouts;
using ROSCA.Application.Interfaces.Users;
using ROSCA.Application.Interfaces.Wallets;
using ROSCA.Application.Interfaces.WalletTransactions;
using ROSCA.Application.Services.BackgroundServices;
using ROSCA.Application.Services.FundMembers;
using ROSCA.Application.Services.Funds;
using ROSCA.Application.Services.Payouts;
using ROSCA.Application.Services.Wallets;
using ROSCA.Application.Services.WalletTransactions;

namespace ROSCA.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IFundService, FundService>();
            services.AddScoped<IFundMemberService, FundMemberService>();
            services.AddScoped<IPayoutService, PayoutService>();
            services.AddScoped<IWalletService, WalletService>();
            services.AddScoped<IWalletTransactionService, WalletTransactionService>();
            services.AddHostedService<PayoutBackgroundService>();
          
            return services;
        }
    }
}
