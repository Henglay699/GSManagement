using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.Enums;

namespace GSManagement.Api.Features.AttendanceFeature;

/// <summary>
/// The one place that decides a record's status and its late / left-early /
/// overtime minutes from the clock times. Clock-in/out, HR edits and leave
/// approval all go through <see cref="Apply"/>, so the same times always give
/// the same result.
///
/// A record belongs to the date its shift starts. An overnight shift (end at or
/// before start, e.g. 20:00–05:00) finishes the next morning, so times are
/// compared on the shift's timeline: minutes from the shift date's midnight,
/// where 05:00 the next morning is 29:00.
/// </summary>
public static class AttendanceRules
{
    public static readonly TimeOnly DefaultStart = new(8, 0);
    public static readonly TimeOnly DefaultEnd = new(17, 0);
    public const int DefaultGraceMinutes = 15;

    // Self clock-in opens this long before the shift starts (07:00 for an 08:00 shift).
    public const int ClockInOpensMinutesBefore = 60;

    // Lunch break splits the day for half-day leave.
    public static readonly TimeOnly MorningEnd = new(12, 0);
    public static readonly TimeOnly AfternoonStart = new(13, 0);

    private const int Day = 24 * 60;
    private static readonly int LunchFrom = Minutes(MorningEnd);
    private static readonly int LunchTo = Minutes(AfternoonStart);

    private static int Minutes(TimeOnly t) => t.Hour * 60 + t.Minute;
    private static TimeOnly ToTime(int minutes) => new TimeOnly(0, 0).AddMinutes(minutes % Day);
    private static bool IsHalfDay(Attendance a) => a.Status == AttendanceStatus.HalfDay || a.IsHalfDay;

    /// <summary>True when the shift ends the next morning (end at or before start).</summary>
    public static bool IsOvernight(Shift? shift) => shift is not null && shift.EndTime <= shift.StartTime;

    private static int ShiftStart(Shift? shift) => Minutes(shift?.StartTime ?? DefaultStart);
    private static int ShiftEnd(Shift? shift) => Minutes(shift?.EndTime ?? DefaultEnd) + (IsOvernight(shift) ? Day : 0);

    // Earliest self clock-in of the full shift; on an overnight shift, earlier
    // times of day are the morning after.
    private static int Pivot(Shift? shift) => Math.Max(0, ShiftStart(shift) - ClockInOpensMinutesBefore);

    /// <summary>A clock time as minutes on the shift's timeline.</summary>
    private static int OnLine(TimeOnly t, Shift? shift) =>
        Minutes(t) + (IsOvernight(shift) && Minutes(t) < Pivot(shift) ? Day : 0);

    /// <summary>
    /// True when a time of day is the morning after an overnight shift started:
    /// a clock-in or clock-out then belongs to yesterday's record.
    /// </summary>
    public static bool IsPreviousShiftDay(TimeOnly time, Shift? shift) =>
        IsOvernight(shift) && Minutes(time) < Pivot(shift);

    /// <summary>When the shift that starts on <paramref name="date"/> ends.</summary>
    public static DateTime ShiftEndsAt(DateOnly date, Shift? shift) =>
        date.ToDateTime(TimeOnly.MinValue).AddMinutes(ShiftEnd(shift));

    /// <summary>Whether a check-out comes after the check-in on the shift's timeline.</summary>
    public static bool IsAfter(TimeOnly checkOut, TimeOnly checkIn, Shift? shift) =>
        OnLine(checkOut, shift) > OnLine(checkIn, shift);

    /// <summary>
    /// Earliest self clock-in for the day: an hour before the shift starts, or
    /// the start of the afternoon when the morning is on approved half-day leave
    /// (they only work the afternoon).
    /// </summary>
    public static TimeOnly ClockInOpensAt(Shift? shift, Attendance? a)
    {
        var (start, _, _) = Window(shift, a is not null && IsHalfDay(a), a?.HalfDayPeriod);
        if (a is not null && IsHalfDay(a) && a.HalfDayPeriod == HalfDayPeriod.Morning)
            return ToTime(start);
        return ToTime(Math.Max(0, start - ClockInOpensMinutesBefore));
    }

    /// <summary>
    /// Self clock-in closes when the working window ends: past that the day is
    /// over, and only HR can add the record.
    /// </summary>
    public static TimeOnly ClockInClosesAt(Shift? shift, Attendance? a) =>
        ToTime(Window(shift, a is not null && IsHalfDay(a), a?.HalfDayPeriod).End);

    /// <summary>
    /// Whether a self clock-in at <paramref name="time"/> comes before the window
    /// opens. <paramref name="nextDay"/>: the time is on the morning after the
    /// shift's date (the small hours of an overnight shift).
    /// </summary>
    public static bool BeforeClockInOpens(TimeOnly time, bool nextDay, Shift? shift, Attendance? a)
    {
        var (start, _, _) = Window(shift, a is not null && IsHalfDay(a), a?.HalfDayPeriod);
        var opens = a is not null && IsHalfDay(a) && a.HalfDayPeriod == HalfDayPeriod.Morning
            ? start
            : Math.Max(0, start - ClockInOpensMinutesBefore);
        return Minutes(time) + (nextDay ? Day : 0) < opens;
    }

    /// <inheritdoc cref="BeforeClockInOpens"/>
    public static bool AfterClockInCloses(TimeOnly time, bool nextDay, Shift? shift, Attendance? a) =>
        Minutes(time) + (nextDay ? Day : 0) >= Window(shift, a is not null && IsHalfDay(a), a?.HalfDayPeriod).End;

    /// <summary>
    /// Where a shift splits into its first and second halves: the lunch hour
    /// when the shift spans it, otherwise the middle of the shift.
    /// </summary>
    private static (int FirstEnd, int SecondStart) HalfDaySplit(int start, int end)
    {
        if (start < LunchFrom && end > LunchTo) return (LunchFrom, LunchTo);
        var middle = start + (end - start) / 2;
        return (middle, middle);
    }

    /// <summary>
    /// Minutes actually worked between clock-in and clock-out, leaving out the
    /// lunch hour (12:00–13:00) for whatever part of it the span covers.
    /// </summary>
    public static int WorkedMinutes(TimeOnly? checkIn, TimeOnly? checkOut, Shift? shift)
    {
        if (checkIn is not { } inTime || checkOut is not { } outTime) return 0;
        int i = OnLine(inTime, shift), o = OnLine(outTime, shift);
        if (o <= i) return 0;
        var lunch = Math.Max(0, Math.Min(o, LunchTo) - Math.Max(i, LunchFrom));
        return o - i - lunch;
    }

    /// <summary>
    /// Overtime is time after the shift end that goes beyond the day's expected
    /// span, so arriving late and staying late only makes up the lost time:
    /// 08:00–18:00 = 60 min, 08:30–18:00 = 30 min, 11:00–18:00 = 0.
    /// </summary>
    public static int OvertimeMinutes(TimeOnly? checkIn, TimeOnly? checkOut, Shift? shift, bool halfDay, HalfDayPeriod? period)
    {
        if (checkIn is not { } inTime || checkOut is not { } outTime) return 0;
        int i = OnLine(inTime, shift), o = OnLine(outTime, shift), shiftEnd = ShiftEnd(shift);
        if (o <= shiftEnd) return 0;
        var (start, end, _) = Window(shift, halfDay, period);
        return Math.Max(0, Math.Min(o - shiftEnd, (o - i) - (end - start)));
    }

    /// <summary>When the employee is expected to start and finish that day.</summary>
    public static (TimeOnly Start, TimeOnly End, int Grace) ExpectedWindow(Shift? shift, Attendance a) =>
        ExpectedWindow(shift, IsHalfDay(a), a.HalfDayPeriod);

    /// <inheritdoc cref="ExpectedWindow(Shift?, Attendance)"/>
    public static (TimeOnly Start, TimeOnly End, int Grace) ExpectedWindow(Shift? shift, bool halfDay, HalfDayPeriod? period)
    {
        var (start, end, grace) = Window(shift, halfDay, period);
        return (ToTime(start), ToTime(end), grace);
    }

    // The expected window on the shift's timeline.
    private static (int Start, int End, int Grace) Window(Shift? shift, bool halfDay, HalfDayPeriod? period)
    {
        int start = ShiftStart(shift), end = ShiftEnd(shift);
        var grace = shift?.GraceMinutes ?? DefaultGraceMinutes;

        if (halfDay)
        {
            // Morning off: work the second half. Afternoon off: work the first half.
            var (firstEnd, secondStart) = HalfDaySplit(start, end);
            if (period == HalfDayPeriod.Morning) start = secondStart;
            else end = firstEnd;
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

        var (start, end, grace) = Window(shift, IsHalfDay(a), a.HalfDayPeriod);

        a.LateMinutes = a.CheckInTime is { } inTime && OnLine(inTime, shift) > start + grace
            ? OnLine(inTime, shift) - start
            : 0;

        a.EarlyLeaveMinutes = a.CheckOutTime is { } outTime && OnLine(outTime, shift) < end
            ? end - OnLine(outTime, shift)
            : 0;

        a.OvertimeMinutes = OvertimeMinutes(a.CheckInTime, a.CheckOutTime, shift, IsHalfDay(a), a.HalfDayPeriod);

        if (a.CheckOutTime is not null) a.MissedClockOut = false;

        // Half-day keeps its status; the late/early minutes still show.
        if (a.Status != AttendanceStatus.HalfDay)
            a.Status = a.LateMinutes > 0 ? AttendanceStatus.Late : AttendanceStatus.Present;
    }
}
