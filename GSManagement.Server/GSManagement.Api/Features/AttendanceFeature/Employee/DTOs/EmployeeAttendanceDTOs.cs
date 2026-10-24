using GSManagement.Api.Features.AttendanceFeature.Summary;
using GSManagement.Api.Features.ShiftFeature.DTOs;
using GSManagement.Domain.Entities.Enums;

namespace GSManagement.Api.Features.AttendanceFeature.Employee.DTOs;

/// <summary>Everything the clock-in screen needs about today.</summary>
public record EmployeeTodayDto(
    DateOnly Date,
    DayStatus Status,
    // Whether the buttons apply today (false on Sundays, holidays and full leave).
    bool CanClockIn,
    bool CanClockOut,
    // Clock-in is refused before this time; the screen keeps the button disabled until then.
    TimeOnly ClockInOpensAt,
    TimeOnly? CheckInTime,
    TimeOnly? CheckOutTime,
    // Expected start/end today (half-day leave shortens the window).
    TimeOnly ExpectedStart,
    TimeOnly ExpectedEnd,
    int GraceMinutes,
    int LateMinutes,
    int EarlyLeaveMinutes,
    int OvertimeMinutes,
    string? HolidayName,
    LeaveType? LeaveType,
    HalfDayPeriod? HalfDayPeriod,
    ShiftDto? Shift
);

public record ClockResultDto(EmployeeTodayDto Today, string Message);
