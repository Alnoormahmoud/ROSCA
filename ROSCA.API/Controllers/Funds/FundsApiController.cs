using Microsoft.AspNetCore.Mvc;
using ROSCA.Application.DTOs.Funds;
using ROSCA.Application.Interfaces.Funds;

namespace ROSCA.API.Controllers.Funds
{
    [Route("api/FundsApi")]
    [ApiController]
    public class FundsApiController : ControllerBase
    {
        private readonly IFundService _fundService;

        public FundsApiController(IFundService fundService)
        {
            _fundService = fundService;
        }

        [HttpPost("CreateFund")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<FundDTO>> CreateFund(FundToAddDTO fundToAdd)
        {
            if (fundToAdd is null)
                return BadRequest("بيانات الصندوق غير مكتملة");

            if (string.IsNullOrWhiteSpace(fundToAdd.Title))
                return BadRequest("يجب تحديد عنوان للصندوق");

            if (fundToAdd.ShareValue <= 0)
                return BadRequest("قيمة السهم يجب أن تكون أكبر من صفر");

            if (fundToAdd.Members == null || fundToAdd.Members.Count < 2)
                return BadRequest("يجب أن يحتوي الصندوق على عضوين على الأقل");

            int memberCount = fundToAdd.Members.Count;
            var memberOrders = fundToAdd.Members
                .Select(m => m.PayoutOrder)
                .ToList();

            if (memberOrders.Distinct().Count() != memberCount)
                return BadRequest("خطأ في توزيع الأدوار: لا يمكن لعضوين الحصول على نفس ترتيب الصرفة");

            if (memberOrders.Any(order => order < 1 || order > memberCount))
                return BadRequest($"خطأ في الترتيب: يجب أن تكون الأرقام بين 1 و {memberCount}");

            for (int i = 1; i <= memberCount; i++)
            {
                if (!memberOrders.Contains(i))
                    return BadRequest($"خطأ في تسلسل الأدوار: الرقم {i} مفقود من الترتيب");
            }

            var newFundId = await _fundService
                .CreateFundAsync(fundToAdd);

            if (newFundId == -1)
                Problem("حدثت مشكلة عند الاتصال بالخادم");

            var createdFund = await _fundService
                .GetByIdAsync(newFundId);

            return createdFund is null
                ? Problem("حدث خطأ أثناء استرجاع بيانات الصندوق بعد الإنشاء")
                : CreatedAtAction(nameof(GetFundById), new { id = newFundId }, createdFund);
        }

        [HttpPut("GenerateNewRound")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult> GenerateNewRound(FundToUpdateDTO fundUpdate)
        {
            if (fundUpdate is null || fundUpdate.Members is null || fundUpdate.Members.Count == 0)
                return BadRequest("البيانات المرسلة لتوليد الدورة الجديدة غير كافية");

            var originalFund = await _fundService
                .GetByIdAsync(fundUpdate.Id);

            if (fundUpdate.Id < 1 || originalFund is null)
                return BadRequest("معرف الصندوق غير صحيح");
            
            if (originalFund.Status != Domain.Enums.Funds.FundStatus.Completed)
                return BadRequest("يجب أن يكون الصندوق قد إكتمل قبل البدأ في جولة جديدة");

            if (fundUpdate.ShareValue <= 0)
                return BadRequest("قيمة السهم الجديدة يجب أن تكون أكبر من صفر");

            var originalMemberIds = originalFund.Members
                .Select(m => m.Id)
                .ToHashSet();

            var commingMemberIds = fundUpdate.Members
                .Select(m => m.Id)
                .ToHashSet();

            if (!originalMemberIds.SetEquals(commingMemberIds))
                return BadRequest("يجب أن يكون أعضاء الجولة الجديدة نفس الأعضاء السابقين");

            int memberCount = fundUpdate.Members.Count;
            var newOrders = fundUpdate.Members
                .Select(m => m.NewPayoutOrder)
                .ToList();

            if (newOrders.Distinct().Count() != memberCount)
                return BadRequest("خطأ في توزيع الأدوار: لا يمكن تكرار ترتيب الصرفة في الدورة الجديدة");

            if (newOrders.Any(order => order < 1 || order > memberCount))
                return BadRequest($"خطأ في الترتيب: يجب أن تكون أرقام الأدوار الجديدة بين 1 و {memberCount}");

            for (int i = 1; i <= memberCount; i++)
            {
                if (!newOrders.Contains(i))
                    return BadRequest($"خطأ في تسلسل الأدوار: الدور رقم {i} مفقود من الترتيب الجديد");
            }

            var result = await _fundService
                .GenerateNewRoundAsync(fundUpdate);

            return result
                ? Ok("تم بدء دورة جديدة وتحديث ترتيب الصرفات بنجاح")
                : BadRequest("فشل بدء دورة جديدة. تأكد من أن الصندوق بحالة 'مكتمل' (Completed) وأن الأعضاء المرسلين هم تماماً أعضاء الصندوق الحاليين");
        }

        [HttpGet("GetFundById/{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<FundDTO>> GetFundById(int id)
        {
            if (id < 1) return BadRequest("معرف الصندوق غير صحيح");

            var fund = await _fundService
                .GetByIdAsync(id);

            return fund is null
                ? NotFound("الصندوق المطلوب غير موجود")
                : Ok(fund);
        }

    }
}
