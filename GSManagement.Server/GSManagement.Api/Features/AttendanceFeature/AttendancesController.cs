using GSManagement.Api.Features.AttendanceFeature.DTOs;
using GSManagement.Domain.Entities.Enums;
using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.AttendanceFeature;

[ApiController]
[Route("api/attendance")]
public class AttendanceController(IAttendanceService attendanceService) : ControllerBase
{
    private readonly IAttendanceService _attendanceService = attendanceService;

    [HttpGet("grid")]
    public async Task<ActionResult<AttendanceGridResponseDto>> GetGrid(
        [FromQuery] DateOnly? date,
        [FromQuery] AttendanceStatus? status)
    {
        DateOnly queryDate = date ?? DateOnly.FromDateTime(DateTime.Today);
        var result = await _attendanceService.GetWeeklyAttendanceGridAsync(queryDate, status);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AttendanceRecordDto>> GetById(int id)
    {
        var result = await _attendanceService.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    // [HasPermission(AppPermission.CreateAttendance)]
    public async Task<ActionResult<AttendanceRecordDto>> Create([FromBody] CreateAttendanceDto dto)
    {
        try
        {
            var result = await _attendanceService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
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

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AttendanceRecordDto>> Update(int id, [FromBody] CreateAttendanceDto dto)
    {
        try
        {
            var result = await _attendanceService.UpdateAsync(id, dto);
            return result is null ? NotFound(new { message = $"Attendance record {id} not found." }) : Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET /api/attendance/user/5?month=2026-09
    // Powers UserAttendanceDetailPage.tsx: user profile + full-month summary
    // + day-by-day check-in/check-out records.
    [HttpGet("user/{id:int}")]
    public async Task<ActionResult<UserAttendanceDetailDto>> GetUserAttendanceDetail(int id, [FromQuery] string month)
    {
        if (!TryParseMonth(month, out var year, out var monthNumber))
        {
            return BadRequest(new { message = "Query parameter 'month' must be in 'yyyy-MM' format." });
        }

        var result = await _attendanceService.GetUserAttendanceDetailAsync(id, year, monthNumber);

        return result is null
            ? NotFound(new { message = $"User with id {id} was not found." })
            : Ok(result);
    }

    private static bool TryParseMonth(string? month, out int year, out int monthNumber)
    {
        year = 0;
        monthNumber = 0;

        if (string.IsNullOrWhiteSpace(month))
        {
            return false;
        }

        var parts = month.Split('-');
        if (parts.Length != 2)
        {
            return false;
        }

        return int.TryParse(parts[0], out year)
            && int.TryParse(parts[1], out monthNumber)
            && monthNumber is >= 1 and <= 12;
    }
}