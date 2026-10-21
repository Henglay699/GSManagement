using System.Security.Claims;
using GSManagement.Api.Features.AttendanceFeature.Employee.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.AttendanceFeature.Employee;

[Authorize]
[ApiController]
[Route("api/employee/attendance")]
public class AttendancesController(IEmployeeAttendanceService attendanceService) : ControllerBase
{
    private readonly IEmployeeAttendanceService _attendanceService = attendanceService;

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("clock-in")]
    public async Task<ActionResult<ClockResultDto>> ClockIn()
    {
        try
        {
            var result = await _attendanceService.ClockInAsync(CurrentUserId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("clock-out")]
    public async Task<ActionResult<ClockResultDto>> ClockOut()
    {
        try
        {
            var result = await _attendanceService.ClockOutAsync(CurrentUserId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("today")]
    public async Task<ActionResult<EmployeeTodayStatusDto>> GetTodayStatus()
    {
        var result = await _attendanceService.GetTodayStatusAsync(CurrentUserId);
        return Ok(result);
    }

    [HttpGet("monthly")]
    public async Task<ActionResult<EmployeeMonthlySummaryDto>> GetMonthlySummary(
        [FromQuery] int? year,
        [FromQuery] int? month)
    {
        var targetYear = year ?? DateTime.Today.Year;
        var targetMonth = month ?? DateTime.Today.Month;

        var result = await _attendanceService.GetMonthlySummaryAsync(CurrentUserId, targetYear, targetMonth);
        return Ok(result);
    }
}
