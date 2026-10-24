using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.Enums;

namespace GSManagement.Api.Features.AttendanceFeature;

/// <summary>
/// The one place that decides a record's status and its late / left-early /
/// overtime minutes from the clock times. Clock-in/out, HR edits and leave
/// approval all go through <see cref="Apply"/>, so the same times always give
/// the same result.
/// </summary>
public static class AttendanceRules
{
    public static readonly TimeOnly DefaultStart = new(8, 0);
    public static readonly TimeOnly DefaultEnd = new(17, 0);
    public const int DefaultGraceMinutes = 15;

    // Employees can't clock in before this time.
    public static readonly TimeOnly EarliestClockIn = new(7, 0);

    // Lunch break splits the day for half-day leave.
    public static readonly TimeOnly MorningEnd = new(12, 0);
    public static readonly TimeOnly AfternoonStart = new(13, 0);

    /// <summary>
    /// Earliest self clock-in for the day: 07:00, or 13:00 when the morning is
    /// on approved half-day leave (they only work the afternoon).
    /// </summary>
    public static TimeOnly ClockInOpensAt(Attendance? a) =>
        a is not null && (a.Status == AttendanceStatus.HalfDay || a.IsHalfDay) && a.HalfDayPeriod == HalfDayPeriod.Morning
            ? AfternoonStart
            : EarliestClockIn;

    /// <summary>When the employee is expected to start and finish that day.</summary>
    public static (TimeOnly Start, TimeOnly End, int Grace) ExpectedWindow(Shift? shift, Attendance a) =>
        ExpectedWindow(shift, a.Status == AttendanceStatus.HalfDay || a.IsHalfDay, a.HalfDayPeriod);

    /// <inheritdoc cref="ExpectedWindow(Shift?, Attendance)"/>
    public static (TimeOnly Start, TimeOnly End, int Grace) ExpectedWindow(Shift? shift, bool halfDay, HalfDayPeriod? period)
    {
        var start = shift?.StartTime ?? DefaultStart;
        var end = shift?.EndTime ?? DefaultEnd;
        var grace = shift?.GraceMinutes ?? DefaultGraceMinutes;

        if (halfDay)
        {
            // Morning off: work the afternoon. Afternoon off: work the morning.
            if (period == HalfDayPeriod.Morning) start = AfternoonStart;
            else end = MorningEnd;
        }
        return (start, end, grace);
    }

    /// <summary>
    /// Recomputes Status (for worked days), LateMinutes, EarlyLeaveMinutes and
    /// OvertimeMinutes from the clock times. Leave and Absent records keep their
    /// status; leave days carry no late/early minutes.
    /// </summary>
    public static void Apply(Attendance a, Shift? shift)
    {
        if (a.Status == AttendanceStatus.OnLeave || a.Status == AttendanceStatus.Absent)
        {
            a.LateMinutes = 0;
            a.EarlyLeaveMinutes = 0;
            a.OvertimeMinutes = null;
            if (a.Status == AttendanceStatus.OnLeave)
            {
                a.CheckInTime = null;
                a.CheckOutTime = null;
            }
            a.MissedClockOut = false;
            return;
        }

        var (start, end, grace) = ExpectedWindow(shift, a);
        var shiftEnd = shift?.EndTime ?? DefaultEnd;

        a.LateMinutes = a.CheckInTime is { } inTime && inTime > start.AddMinutes(grace)
            ? (int)(inTime - start).TotalMinutes
            : 0;

        a.EarlyLeaveMinutes = a.CheckOutTime is { } outTime && outTime < end
            ? (int)(end - outTime).TotalMinutes
            : 0;

        a.OvertimeMinutes = a.CheckOutTime is { } o && o > shiftEnd
            ? Math.Round((o - shiftEnd).TotalMinutes, 0)
            : 0;

        if (a.CheckOutTime is not null) a.MissedClockOut = false;

        // Half-day keeps its status; the late/early minutes still show.
        if (a.Status != AttendanceStatus.HalfDay)
            a.Status = a.LateMinutes > 0 ? AttendanceStatus.Late : AttendanceStatus.Present;
    }
}
