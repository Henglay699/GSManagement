using GSManagement.Domain.Entities.Enums;

namespace GSManagement.Api.Features.AttendanceFeature.Summary;

/// <summary>
/// What a calendar day shows, exactly one per day. Stored records give the
/// first five; the rest come from the calendar.
/// </summary>
public enum DayStatus
{
    Present,       // worked, on time
    Late,          // worked, arrived late
    HalfDay,       // approved half-day leave
    OnLeave,       // approved full-day leave
    Absent,        // working day, no clock-in, no leave
    InProgress,    // today: clocked in, not out yet
    NotClockedIn,  // today: working day, no clock-in yet
    Holiday,       // public holiday
    DayOff,        // Sunday
    Upcoming,      // later this month
    NoRecord       // past working day with nothing recorded (e.g. before the employee started)
}

public record SummaryEmployeeDto(
    int Id,
    string UserName,
    string Email,
    string? ImageUrl,
    string Roles
);

public record SummaryDayDto(
    DateOnly Date,
    DayStatus Status,
    int? AttendanceId,
    string? HolidayName,
    TimeOnly? CheckInTime,
    TimeOnly? CheckOutTime,
    int WorkedMinutes,
    int LateMinutes,
    int EarlyLeaveMinutes,
    int OvertimeMinutes,
    bool MissedClockOut,
    LeaveType? LeaveType,
    HalfDayPeriod? HalfDayPeriod,
    string? ShiftName,
    string? Remark,
    // When work was expected that day (null on days off and holidays).
    TimeOnly? ExpectedStart,
    TimeOnly? ExpectedEnd
);

public record SummaryTotalsDto(
    int WorkingDays,
    // Days the employee showed up, including the worked half of a half day.
    int PresentDays,
    int OnTimeDays,
    int LateDays,
    int LateMinutes,
    int AbsentDays,
    double LeaveDays,
    int HalfDays,
    int EarlyLeaveDays,
    int MissedClockOuts,
    double WorkedHours,
    double OvertimeHours,
    double AverageHoursPerDay,
    // Days attended ÷ (working days − leave days), 0-100; a worked half day counts 0.5.
    double AttendanceRate,
    // On-time ÷ present, 0-100 (half days are on time or late against the shorter window).
    double PunctualityRate,
    Dictionary<LeaveType, double> LeaveByType
);

public record MonthSummaryDto(
    int Year,
    int Month,
    DateOnly PeriodEnd,
    SummaryEmployeeDto Employee,
    SummaryTotalsDto Totals,
    List<SummaryDayDto> Days
);
