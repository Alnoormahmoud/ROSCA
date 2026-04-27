using System;
using Microsoft.Extensions.DependencyInjection;
using ROSCA.Application.Interfaces.Wallets;
using ROSCA.Application.Interfaces.WalletTransactions;
using ROSCA.Application.Services.Wallets;
using ROSCA.Application.Services.WalletTransactions;

namespace ROSCA.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            services.AddScoped<IWalletService, WalletService>();
            services.AddScoped<IWalletTransactionService, WalletTransactionService>();
            return services;
        }
    }
}
