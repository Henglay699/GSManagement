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
    public async Task<IActionResult> GetGrid(
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

}