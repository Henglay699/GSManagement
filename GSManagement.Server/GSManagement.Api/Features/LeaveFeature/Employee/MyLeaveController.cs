using System.Security.Claims;
using GSManagement.Api.Features.LeaveFeature.DTOs;
using GSManagement.Domain.Entities.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.LeaveFeature.Employee;

// Self-service leave for any logged-in employee. Everything is scoped to the
// caller's own id from the JWT, so no permission is needed here; the HR
// endpoints in LeaveRequestController stay behind the Leave permissions.
[Authorize]
[ApiController]
[Route("api/employee/leaves")]
public class MyLeaveController(ILeaveRequestService leaveRequestService, LeaveNotifier notifier) : ControllerBase
{
    private readonly ILeaveRequestService _leaveRequestService = leaveRequestService;

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<PagedResult<LeaveRequestDto>>> GetMine([FromQuery] LeaveRequestFilterDto filter)
    {
        filter.UserId = CurrentUserId;
        filter.Search = null;
        return Ok(await _leaveRequestService.GetAllAsync(filter));
    }

    [HttpPost]
    public async Task<ActionResult<LeaveRequestDto>> Create([FromBody] CreateMyLeaveRequestDto dto)
    {
        try
        {
            var result = await _leaveRequestService.CreateAsync(new CreateLeaveRequestDto
            {
                UserId = CurrentUserId,
                LeaveType = dto.LeaveType,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Remark = dto.Remark,
                IsHalfDay = dto.IsHalfDay,
                HalfDayPeriod = dto.HalfDayPeriod,
                // Employees can only submit; HR approves.
                InitialStatus = LeaveStatus.Pending
            }, CurrentUserId);
            await notifier.NotifyAsync(result);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}/cancel")]
    public async Task<ActionResult<LeaveRequestDto>> Cancel(int id)
    {
        try
        {
            var result = await _leaveRequestService.CancelOwnAsync(id, CurrentUserId);
            await notifier.NotifyAsync();
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
