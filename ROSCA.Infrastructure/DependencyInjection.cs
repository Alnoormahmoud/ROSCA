using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ROSCA.Application.Interfaces.Users;
using ROSCA.Infrastructure.Persistence;
using System;

namespace ROSCA.Infrastructure
{
    public static class DependencyInjection 
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connection)
        {
            services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connection));
            services.AddScoped<IUserRepository, UserRepository>();

            return services;
        }
    }
}
