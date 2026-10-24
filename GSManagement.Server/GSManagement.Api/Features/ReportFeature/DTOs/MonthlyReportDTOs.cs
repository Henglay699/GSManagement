using GSManagement.Api.Features.AttendanceFeature.Summary;

namespace GSManagement.Api.Features.ReportFeature.DTOs;

/// <summary>One employee's line in the monthly report: same totals as their own summary.</summary>
public record MonthlyReportRowDto(SummaryEmployeeDto Employee, SummaryTotalsDto Totals);

public record MonthlyReportTotalsDto(
    int Employees,
    int PresentDays,
    int LateDays,
    int AbsentDays,
    double LeaveDays,
    int EarlyLeaveDays,
    int MissedClockOuts,
    double WorkedHours,
    double OvertimeHours,
    double AverageAttendanceRate,
    double AveragePunctualityRate
);

public record MonthlyReportDto(
    int Year,
    int Month,
    // Working days counted so far: the whole month for past months,
    // up to and including today for the current month.
    int WorkingDays,
    DateOnly PeriodEnd,
    MonthlyReportTotalsDto Totals,
    List<MonthlyReportRowDto> Employees
);
