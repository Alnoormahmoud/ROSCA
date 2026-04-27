using Microsoft.Extensions.DependencyInjection;
using ROSCA.Application.Interfaces.Users;
using System;

namespace ROSCA.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            services.AddScoped<IUserService, UserService>();

            return services;
        }
    }
}
