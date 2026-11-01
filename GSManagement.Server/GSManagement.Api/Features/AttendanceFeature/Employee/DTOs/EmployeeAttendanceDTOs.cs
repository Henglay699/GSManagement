using GSManagement.Api.Features.AttendanceFeature.Summary;
using GSManagement.Api.Features.ShiftFeature.DTOs;
using GSManagement.Domain.Entities.Enums;

namespace GSManagement.Api.Features.AttendanceFeature.Employee.DTOs;

/// <summary>Everything the clock-in screen needs about the current shift.</summary>
public record EmployeeTodayDto(
    // The day the current shift started (yesterday in the small hours of an overnight shift).
    DateOnly Date,
    DayStatus Status,
    // Whether the buttons apply today (false on Sundays, holidays and full leave).
    bool CanClockIn,
    bool CanClockOut,
    // Self clock-in is only accepted in this window (from an hour before the shift
    // starts until it ends); the screen keeps the button disabled outside it.
    TimeOnly ClockInOpensAt,
    TimeOnly ClockInClosesAt,
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
    ShiftDto? Shift,
    // The shift ends the next morning; Date is the day it started.
    bool Overnight
);

public record ClockResultDto(EmployeeTodayDto Today, string Message);
