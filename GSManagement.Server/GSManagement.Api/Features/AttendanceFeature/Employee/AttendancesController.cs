using System.Security.Claims;
using GSManagement.Api.Features.AttendanceFeature.Employee.DTOs;
using GSManagement.Api.Features.AttendanceFeature.Summary;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.AttendanceFeature.Employee;

// Self-service attendance for any logged-in employee, scoped to the caller.
[Authorize]
[ApiController]
[Route("api/employee/attendance")]
public class AttendancesController(
    IEmployeeAttendanceService attendanceService,
    AttendanceSummaryService summaryService) : ControllerBase
{
    private readonly IEmployeeAttendanceService _attendanceService = attendanceService;
    private readonly AttendanceSummaryService _summaryService = summaryService;

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("clock-in")]
    public async Task<ActionResult<ClockResultDto>> ClockIn()
    {
        try
        {
            return Ok(await _attendanceService.ClockInAsync(CurrentUserId));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("clock-out")]
    public async Task<ActionResult<ClockResultDto>> ClockOut()
    {
        try
        {
            return Ok(await _attendanceService.ClockOutAsync(CurrentUserId));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpGet("today")]
    public async Task<ActionResult<EmployeeTodayDto>> GetToday()
    {
        return Ok(await _attendanceService.GetTodayAsync(CurrentUserId));
    }

    // The employee's own month: the same view and numbers HR sees for them.
    [HttpGet("summary")]
    public async Task<ActionResult<MonthSummaryDto>> GetSummary([FromQuery] int? year, [FromQuery] int? month)
    {
        var y = year ?? DateTime.Today.Year;
        var m = month ?? DateTime.Today.Month;
        if (m is < 1 or > 12)
            return BadRequest(new { message = "Month must be between 1 and 12." });
        var result = await _summaryService.GetForUserAsync(CurrentUserId, y, m);
        return result is null ? NotFound() : Ok(result);
    }
}
