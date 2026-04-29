using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ROSCA.Application.DTOs.Wallets;
using ROSCA.Application.Interfaces.Wallets;

namespace ROSCA.API.Controllers.Wallets
{
    [Route("api/WalletAPI")]
    [ApiController]
    public class WalletController : ControllerBase
    {
        IWalletService _WalletService;

        public WalletController(IWalletService WalletService)
        {
            _WalletService = WalletService;
        }
        [HttpGet("GetAll")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<WalletDTO>>> GetAllWallets()
        {
            var result = await _WalletService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("GetByWalletId/{WalletId}", Name ="GetWalletById")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<WalletDTO>> GetByWalletId(int WalletId)
        {
            var result = await _WalletService.GetByIdAsync(WalletId);

           return result is null ?
                NotFound("لم يتم العثور على المحفظة")
                : Ok(result);
        }

        [HttpGet("GetByFundId/{FundId}", Name = "GetByFundId")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<WalletDTO>> GetByFundId(int FundId)
        {
            var result = await _WalletService.GetByFundIdAsync(FundId);

            return result is null ?
                 NotFound("لم يتم العثور على المحفظة")
                 : Ok(result);
        }

        [HttpGet("AllCurrencies")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<string>>> GetAllCurrencies()
        {
            var result = await _WalletService.GetAllCurrenciesCodesAsync();
            return Ok(result);
        }
    }
}
