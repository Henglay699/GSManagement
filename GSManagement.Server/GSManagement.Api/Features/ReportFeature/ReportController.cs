using GSManagement.Api.Features.AttendanceFeature.Summary;
using GSManagement.Api.Features.ReportFeature.DTOs;
using GSManagement.Domain.Entities.Enums;
using JwtTest.Middlewares.CheckPermission;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.ReportFeature;

[Authorize]
[ApiController]
[Route("api/reports")]
public class ReportController(ReportService reportService, AttendanceSummaryService summaryService) : ControllerBase
{
    private readonly ReportService _reportService = reportService;
    private readonly AttendanceSummaryService _summaryService = summaryService;

    private const string XlsxType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    [HttpGet("monthly")]
    [HasPermission(AppPermission.ViewAttendance)]
    public async Task<ActionResult<MonthlyReportDto>> GetMonthly([FromQuery] int? year, [FromQuery] int? month)
    {
        if (!TryResolve(year, month, out var y, out var m))
            return BadRequest(new { message = "Month must be between 1 and 12." });
        return Ok(await _reportService.GetMonthlyAsync(y, m));
    }

    [HttpGet("monthly/export")]
    [HasPermission(AppPermission.ViewAttendance)]
    public async Task<IActionResult> ExportMonthly([FromQuery] int? year, [FromQuery] int? month)
    {
        if (!TryResolve(year, month, out var y, out var m))
            return BadRequest(new { message = "Month must be between 1 and 12." });
        var file = await _reportService.ExportMonthlyExcelAsync(y, m);
        return File(file, XlsxType, $"attendance-report-{y}-{m:D2}.xlsx");
    }

    // One employee's month: the same view they see on their own page.
    [HttpGet("employees/{userId:int}")]
    [HasPermission(AppPermission.ViewAttendance)]
    public async Task<ActionResult<MonthSummaryDto>> GetEmployeeMonth(int userId, [FromQuery] int? year, [FromQuery] int? month)
    {
        if (!TryResolve(year, month, out var y, out var m))
            return BadRequest(new { message = "Month must be between 1 and 12." });
        var result = await _summaryService.GetForUserAsync(userId, y, m);
        return result is null ? NotFound(new { message = $"Employee {userId} was not found." }) : Ok(result);
    }

    [HttpGet("employees/{userId:int}/export")]
    [HasPermission(AppPermission.ViewAttendance)]
    public async Task<IActionResult> ExportEmployeeMonth(int userId, [FromQuery] int? year, [FromQuery] int? month)
    {
        if (!TryResolve(year, month, out var y, out var m))
            return BadRequest(new { message = "Month must be between 1 and 12." });
        var file = await _reportService.ExportEmployeeExcelAsync(userId, y, m);
        return file is null
            ? NotFound(new { message = $"Employee {userId} was not found." })
            : File(file, XlsxType, $"attendance-{userId}-{y}-{m:D2}.xlsx");
    }

    private static bool TryResolve(int? year, int? month, out int y, out int m)
    {
        y = year ?? DateTime.Today.Year;
        m = month ?? DateTime.Today.Month;
        return m is >= 1 and <= 12 && y is >= 2000 and <= 2100;
    }
}
