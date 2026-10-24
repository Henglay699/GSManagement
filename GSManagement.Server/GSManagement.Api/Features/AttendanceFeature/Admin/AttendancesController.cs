using GSManagement.Api.Features.AttendanceFeature.Admin.DTOs;
using GSManagement.Domain.Entities.Enums;
using JwtTest.Middlewares.CheckPermission;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.AttendanceFeature.Admin;

// HR side of attendance. Per-employee months and the monthly report live in
// ReportController; employees' own clock-in is in Employee/AttendancesController.
[Authorize]
[ApiController]
[Route("api/admin/attendances")]
public class AttendanceController(IAttendanceService attendanceService) : ControllerBase
{
    private readonly IAttendanceService _attendanceService = attendanceService;

    [HttpGet("daily")]
    [HasPermission(AppPermission.ViewAttendance)]
    public async Task<ActionResult<DailyAttendanceDto>> GetDaily([FromQuery] DateOnly? date)
    {
        return Ok(await _attendanceService.GetDailyAsync(date ?? DateOnly.FromDateTime(DateTime.Today)));
    }

    [HttpGet("weekly")]
    [HasPermission(AppPermission.ViewAttendance)]
    public async Task<ActionResult<WeeklyAttendanceDto>> GetWeekly([FromQuery] DateOnly? date)
    {
        return Ok(await _attendanceService.GetWeeklyAsync(date ?? DateOnly.FromDateTime(DateTime.Today)));
    }

    [HttpGet("{id:int}")]
    [HasPermission(AppPermission.ViewAttendance)]
    public async Task<ActionResult<AttendanceRecordDto>> GetById(int id)
    {
        var result = await _attendanceService.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [HasPermission(AppPermission.CreateAttendance)]
    public async Task<ActionResult<AttendanceRecordDto>> Create([FromBody] SaveAttendanceDto dto)
    {
        try
        {
            var result = await _attendanceService.CreateAsync(dto);
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

    [HttpPut("{id:int}")]
    [HasPermission(AppPermission.UpdateAttendance)]
    public async Task<ActionResult<AttendanceRecordDto>> Update(int id, [FromBody] SaveAttendanceDto dto)
    {
        try
        {
            var result = await _attendanceService.UpdateAsync(id, dto);
            return result is null ? NotFound(new { message = $"Attendance record {id} not found." }) : Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    [HasPermission(AppPermission.DeleteAttendance)]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            return await _attendanceService.DeleteAsync(id) ? NoContent() : NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
