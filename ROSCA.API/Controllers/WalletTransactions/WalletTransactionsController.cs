using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ROSCA.Application.DTOs.Wallets;
using ROSCA.Application.DTOs.WalletTransactions;
using ROSCA.Application.Interfaces.Wallets;
using ROSCA.Application.Interfaces.WalletTransactions;
using ROSCA.Application.Services.Wallets;
using ROSCA.Domain.Entities.Wallets;

namespace ROSCA.API.Controllers.WalletTransactions
{
    [Route("api/WalletTransactions")]
    [ApiController]
    public class WalletTransactionsController : ControllerBase
    {
        IWalletTransactionService _TransactionService;

        public WalletTransactionsController(IWalletTransactionService transactionService)
        {
            _TransactionService = transactionService;
        }

        [HttpGet("GetById/{Id}", Name = "GetTransactionById")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<WalletDTO>> GetTransactionById(int Id)
        {
            var result = await _TransactionService.GetByIdAsync(Id);

            return result is null ?
                 NotFound("لم يتم العثور على العملية")
                 : Ok(result);
        }

        [HttpGet("GetAllFiltered")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<WalletDTO>>> GetAllTransactions([FromQuery]TransactionsFilterDTO dto)
        {
            //add filter
            var result = await _TransactionService.GetAllAsync(dto);
            return Ok(result);
        }


        [HttpPost("AddContribution")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<WalletDTO>> AddContribution(ContributionToAddDTO dto)
        {
          
           var NewId = await _TransactionService.AddContributionTransactionAsync(dto);
            if (NewId is null)
            {
                return BadRequest("البيانات المدخلة غير صحيحة");
            }


            var Created = await _TransactionService.GetByIdAsync((int)NewId);

            return NewId is null? 
                Problem("حدثت مشكلة عند الاتصال بالخادم")
                : CreatedAtRoute("GetTransactionById", new { id = NewId }, Created);


        }
    }
}
