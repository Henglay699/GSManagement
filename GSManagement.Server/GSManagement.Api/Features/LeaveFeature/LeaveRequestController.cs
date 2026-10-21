using System.Security.Claims;
using GSManagement.Api.Features.LeaveFeature.DTOs;
using GSManagement.Domain.Entities.Enums;
using JwtTest.Middlewares.CheckPermission;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.LeaveFeature;

[ApiController]
[Route("api/leave-requests")]
public class LeaveRequestController(ILeaveRequestService leaveRequestService, LeaveNotifier notifier) : ControllerBase
{
    private readonly ILeaveRequestService _leaveRequestService = leaveRequestService;

    [HttpGet]
    [HasPermission(AppPermission.ViewLeave)]
    public async Task<ActionResult<PagedResult<LeaveRequestDto>>> GetAll([FromQuery] LeaveRequestFilterDto filter)
    {
        var result = await _leaveRequestService.GetAllAsync(filter);
        return Ok(result);
    }

    [HttpGet("pending-count")]
    [HasPermission(AppPermission.ViewLeave)]
    public async Task<ActionResult<int>> GetPendingCount()
    {
        return Ok(await notifier.GetPendingCountAsync());
    }

    [HttpGet("{id:int}")]
    [HasPermission(AppPermission.ViewLeave)]
    public async Task<ActionResult<LeaveRequestDto>> GetById(int id)
    {
        var result = await _leaveRequestService.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [HasPermission(AppPermission.CreateLeave)]
    public async Task<ActionResult<LeaveRequestDto>> Create([FromBody] CreateLeaveRequestDto dto)
    {
        try
        {
            // Only HR/Admin reach this endpoint (CreateLeave), so leave they
            // add is approved straight away. Employees submit through
            // /api/employee/leaves, which stays Pending.
            dto.InitialStatus = LeaveStatus.Approved;
            var approvedByUserId = GetCurrentUserId();
            var result = await _leaveRequestService.CreateAsync(dto, approvedByUserId);
            await notifier.NotifyAsync();
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
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

    [HttpPut("{id:int}/status")]
    [HasPermission(AppPermission.UpdateLeave)]
    public async Task<ActionResult<LeaveRequestDto>> UpdateStatus(int id, [FromBody] UpdateLeaveRequestStatusDto dto)
    {
        if (dto.Status is not (LeaveStatus.Approved or LeaveStatus.Reject))
            return BadRequest(new { message = "Status must be Approved or Reject." });

        try
        {
            var actionedByUserId = GetCurrentUserId();
            var result = await _leaveRequestService.UpdateStatusAsync(id, dto, actionedByUserId);
            await notifier.NotifyAsync();
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing leave request.
    /// PUT /api/leave-requests/5
    /// </summary>
    [HttpPut("{id:int}")]
    [HasPermission(AppPermission.UpdateLeave)]
    public async Task<ActionResult<LeaveRequestDto>> Update(int id, [FromBody] UpdateLeaveRequestDto dto)
    {
        try
        {
            var actionedByUserId = GetCurrentUserId();
            var result = await _leaveRequestService.UpdateAsync(id, dto, actionedByUserId);
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

    [HttpDelete("{id:int}")]
    [HasPermission(AppPermission.DeleteLeave)]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _leaveRequestService.DeleteAsync(id);
            await notifier.NotifyAsync();
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // The global fallback policy guarantees an authenticated user here, and
    // OnTokenValidated rejects tokens without a numeric NameIdentifier claim.
    private int GetCurrentUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}