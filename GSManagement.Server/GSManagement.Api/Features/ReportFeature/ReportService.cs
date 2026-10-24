using GSManagement.Api.Features.AttendanceFeature.Summary;
using GSManagement.Api.Features.ReportFeature.DTOs;

namespace GSManagement.Api.Features.ReportFeature;

// Monthly HR report: every active employee's month summary side by side.
public class ReportService(AttendanceSummaryService summaryService)
{
    private readonly AttendanceSummaryService _summaryService = summaryService;

    public async Task<MonthlyReportDto> GetMonthlyAsync(int year, int month)
    {
        var summaries = await _summaryService.GetAsync(year, month);
        var rows = summaries.Select(s => new MonthlyReportRowDto(s.Employee, s.Totals)).ToList();
        var t = rows.Select(r => r.Totals).ToList();

        var totals = new MonthlyReportTotalsDto(
            rows.Count,
            t.Sum(x => x.PresentDays),
            t.Sum(x => x.LateDays),
            t.Sum(x => x.AbsentDays),
            t.Sum(x => x.LeaveDays),
            t.Sum(x => x.EarlyLeaveDays),
            t.Sum(x => x.MissedClockOuts),
            Math.Round(t.Sum(x => x.WorkedHours), 2),
            Math.Round(t.Sum(x => x.OvertimeHours), 2),
            t.Count > 0 ? Math.Round(t.Average(x => x.AttendanceRate), 1) : 0,
            t.Count > 0 ? Math.Round(t.Average(x => x.PunctualityRate), 1) : 0);

        var first = summaries.FirstOrDefault();
        var periodEnd = first?.PeriodEnd ?? new DateOnly(year, month, 1).AddMonths(1).AddDays(-1);
        return new MonthlyReportDto(year, month, first?.Totals.WorkingDays ?? 0, periodEnd, totals, rows);
    }

    /// <summary>The same report as a formatted Excel workbook.</summary>
    public async Task<byte[]> ExportMonthlyExcelAsync(int year, int month) =>
        ReportExcelBuilder.Monthly(await GetMonthlyAsync(year, month));

    /// <summary>One employee's month as a formatted Excel workbook; null if the employee doesn't exist.</summary>
    public async Task<byte[]?> ExportEmployeeExcelAsync(int userId, int year, int month)
    {
        var summary = await _summaryService.GetForUserAsync(userId, year, month);
        return summary is null ? null : ReportExcelBuilder.Employee(summary);
    }
}
