using System.Security.Claims;
using GSManagement.Api.Features.LeaveFeature.DTOs;
using GSManagement.Domain.Entities.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.LeaveFeature;

[ApiController]
// [Authorize]
[Route("api/leave-requests")]
public class LeaveRequestController(ILeaveRequestService leaveRequestService) : ControllerBase
{
    private readonly ILeaveRequestService _leaveRequestService = leaveRequestService;

    [HttpGet]
    public async Task<ActionResult<PagedResult<LeaveRequestDto>>> GetAll([FromQuery] LeaveRequestFilterDto filter)
    {
        var result = await _leaveRequestService.GetAllAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LeaveRequestDto>> GetById(int id)
    {
        var result = await _leaveRequestService.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<LeaveRequestDto>> Create([FromBody] CreateLeaveRequestDto dto)
    {
        try
        {
            var approvedByUserId = GetCurrentUserId();
            var result = await _leaveRequestService.CreateAsync(dto, approvedByUserId);
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
    public async Task<ActionResult<LeaveRequestDto>> UpdateStatus(int id, [FromBody] UpdateLeaveRequestStatusDto dto)
    {
        if (dto.Status is not (LeaveStatus.Approved or LeaveStatus.Reject))
            return BadRequest(new { message = "Status must be Approved or Reject." });

        try
        {
            var actionedByUserId = GetCurrentUserId();
            var result = await _leaveRequestService.UpdateStatusAsync(id, dto, actionedByUserId);
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
    public async Task<ActionResult<LeaveRequestDto>> Update(int id, [FromBody] UpdateLeaveRequestDto dto)
    {
        try
        {
            var actionedByUserId = GetCurrentUserId();
            var result = await _leaveRequestService.UpdateAsync(id, dto, actionedByUserId);
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
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _leaveRequestService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    private static int GetCurrentUserId()
    {
        // Adjust the claim type to whatever you put in the JWT at login
        // (commonly ClaimTypes.NameIdentifier or a custom "uid" claim).
        // var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
        //     ?? throw new UnauthorizedAccessException("No user id claim on the current principal.");

        const int a = 1;
        return a;
    }
}