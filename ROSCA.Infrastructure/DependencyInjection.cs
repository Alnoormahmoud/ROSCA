using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ROSCA.Application.Interfaces.Wallets;
using ROSCA.Application.Interfaces.WalletTransactions;
using ROSCA.Infrastructure.Persistence;
using ROSCA.Infrastructure.Repositories.Wallets;
using ROSCA.Infrastructure.Repositories.WalletTransactions;

namespace ROSCA.Infrastructure
{
    public static class DependencyInjection 
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connection)
        {
            services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connection));
            services.AddScoped<IWalletTransactionRepository, WalletTransactionRepository>();
            services.AddScoped<IWalletRepository, WalletRepository>();

            return services;
        }
    }
}
