using System;
using System.Collections.Generic;
using System.ComponentModel.Design;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ROSCA.Application.DTOs.WalletTransactions;
using ROSCA.Application.Interfaces.Payouts;
using ROSCA.Application.Interfaces.WalletTransactions;
using ROSCA.Domain.Entities.Payouts;

namespace ROSCA.Application.Services.BackgroundServices
{
    public class PayoutBackgroundService : BackgroundService
    {
      
        private readonly IServiceScopeFactory _ScopeFactory;
        private IPayoutService _PayoutService;
        private IWalletTransactionService _TransactionService;
        public PayoutBackgroundService(IServiceScopeFactory ScopeFactory)
        {
            _ScopeFactory = ScopeFactory;
        }

      
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {

                    using var Scope = _ScopeFactory.CreateScope();
                    _PayoutService = Scope.ServiceProvider.GetRequiredService<IPayoutService>();


                    var Payouts = await _PayoutService.GetDuePayouts();


                    foreach (var payout in Payouts)
                    {
                       await _PayoutService.CollectPayoutAsync(payout.Id);

                        var TransactionDTO = new PayoutTransactionToAddDTO()
                        {
                            WalletId = payout.Member.Fund.Wallet.Id,
                            UserId = payout.Member.UserId,
                            PayoutId = payout.Id,
                        };

                        _TransactionService = Scope.ServiceProvider.GetRequiredService<IWalletTransactionService>();

                        await _TransactionService.AddPayoutTransactionAsync(TransactionDTO);


                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                }
                
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);   
            }
            
        }

    }
}
