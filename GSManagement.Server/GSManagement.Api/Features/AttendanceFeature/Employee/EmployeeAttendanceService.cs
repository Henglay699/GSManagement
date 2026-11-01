using GSManagement.Api.Features.AttendanceFeature.Employee.DTOs;
using GSManagement.Api.Features.AttendanceFeature.Summary;
using GSManagement.Api.Features.ShiftFeature.DTOs;
using GSManagement.Api.Shared.Utils;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.AttendanceFeature.Employee;

public class EmployeeAttendanceService(GSDbContext context) : IEmployeeAttendanceService
{
    private readonly GSDbContext _context = context;

    private static DateOnly Today => AppClock.Today;

    public async Task<ClockResultDto> ClockInAsync(int userId)
    {
        var now = AppClock.TimeOfDay;
        var (date, shift) = await CurrentShiftDayAsync(userId);
        var holiday = await HolidayOnAsync(date);
        if (date.DayOfWeek == DayOfWeek.Sunday)
            throw new InvalidOperationException("Today is a day off (Sunday).");
        if (holiday is not null)
            throw new InvalidOperationException($"Today is a public holiday ({holiday}).");
        var attendance = await _context.Attendances
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Date == date);

        if (attendance?.Status == AttendanceStatus.OnLeave)
            throw new InvalidOperationException("You have approved full-day leave today.");
        if (attendance?.CheckInTime is { } already)
            throw new InvalidOperationException($"You already clocked in for this shift at {already:HH:mm}.");

        if (AttendanceRules.BeforeClockInOpens(now, date < Today, shift, attendance))
        {
            var opensAt = AttendanceRules.ClockInOpensAt(shift, attendance);
            throw new InvalidOperationException(attendance?.HalfDayPeriod == HalfDayPeriod.Morning
                ? $"You're on half-day leave for the first half. Clock-in opens at {opensAt:HH:mm}."
                : $"Clock-in for your shift opens at {opensAt:HH:mm}.");
        }
        if (AttendanceRules.AfterClockInCloses(now, date < Today, shift, attendance))
            throw new InvalidOperationException(
                $"Your shift ended at {AttendanceRules.ClockInClosesAt(shift, attendance):HH:mm}, so clock-in is closed. Ask HR to add the record.");

        if (attendance is null)
        {
            attendance = new Attendance { UserId = userId, Date = date, Status = AttendanceStatus.Present };
            _context.Attendances.Add(attendance);
        }
        else if (attendance.Status == AttendanceStatus.Absent)
        {
            // Marked absent earlier in the day: clocking in makes it a worked day.
            attendance.Status = AttendanceStatus.Present;
        }

        attendance.CheckInTime = now;
        // The day is scored against the shift the employee works now.
        attendance.ShiftId = shift?.Id;
        AttendanceRules.Apply(attendance, shift);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException) when (_context.Entry(attendance).State == EntityState.Added)
        {
            // A second clock-in (e.g. a double click) raced this one; the unique
            // (UserId, Date) index kept only the first.
            throw new InvalidOperationException("You already clocked in for this shift.");
        }

        var today = await GetTodayAsync(userId);
        var message = today.LateMinutes > 0
            ? $"Clocked in at {now:HH:mm}, {today.LateMinutes} min late."
            : $"Clocked in at {now:HH:mm}. Have a good shift!";
        return new ClockResultDto(today, message);
    }

    public async Task<ClockResultDto> ClockOutAsync(int userId)
    {
        var now = AppClock.TimeOfDay;
        var (date, _) = await CurrentShiftDayAsync(userId);
        var attendance = await _context.Attendances
            .Include(a => a.Shift)
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Date == date);

        if (attendance?.CheckInTime is null)
            throw new InvalidOperationException("You have not clocked in for this shift.");
        if (attendance.CheckOutTime is { } done)
            throw new InvalidOperationException($"You already clocked out at {done:HH:mm}.");

        attendance.CheckOutTime = now;
        AttendanceRules.Apply(attendance, attendance.Shift ?? await EmployeeShifts.ForUserAsync(_context, userId));
        await _context.SaveChangesAsync();

        var today = await GetTodayAsync(userId);
        var message = today.OvertimeMinutes > 0
            ? $"Clocked out at {now:HH:mm}, with {today.OvertimeMinutes} min overtime."
            : today.EarlyLeaveMinutes > 0
                ? $"Clocked out at {now:HH:mm}, {today.EarlyLeaveMinutes} min before the end of your shift."
                : $"Clocked out at {now:HH:mm}. See you next shift!";
        return new ClockResultDto(today, message);
    }

    public async Task<EmployeeTodayDto> GetTodayAsync(int userId)
    {
        var (date, currentShift) = await CurrentShiftDayAsync(userId);
        var holiday = await HolidayOnAsync(date);
        var a = await _context.Attendances
            .AsNoTracking()
            .Include(x => x.Shift)
            .Include(x => x.LeaveRequest)
            .FirstOrDefaultAsync(x => x.UserId == userId && x.Date == date);

        // Once clocked in the day keeps the shift it was scored against;
        // before that it follows the employee's current shift.
        var shift = a?.CheckInTime is not null && a.Shift is not null ? a.Shift : currentShift;
        var window = a is null
            ? AttendanceRules.ExpectedWindow(shift, false, null)
            : AttendanceRules.ExpectedWindow(shift, a);

        var isDayOff = date.DayOfWeek == DayOfWeek.Sunday;
        var clockedInOnly = a?.CheckInTime is not null && a.CheckOutTime is null;
        var status = a?.Status switch
        {
            AttendanceStatus.OnLeave => DayStatus.OnLeave,
            AttendanceStatus.Absent => DayStatus.Absent,
            _ when clockedInOnly => DayStatus.InProgress,
            AttendanceStatus.HalfDay => DayStatus.HalfDay,
            AttendanceStatus.Late => DayStatus.Late,
            AttendanceStatus.Present => DayStatus.Present,
            _ => isDayOff ? DayStatus.DayOff : holiday is not null ? DayStatus.Holiday : DayStatus.NotClockedIn
        };

        var workday = !isDayOff && holiday is null && a?.Status != AttendanceStatus.OnLeave;

        return new EmployeeTodayDto(
            date,
            status,
            CanClockIn: workday && a?.CheckInTime is null,
            CanClockOut: clockedInOnly,
            AttendanceRules.ClockInOpensAt(shift, a),
            AttendanceRules.ClockInClosesAt(shift, a),
            a?.CheckInTime,
            a?.CheckOutTime,
            window.Start,
            window.End,
            window.Grace,
            a?.LateMinutes ?? 0,
            a?.EarlyLeaveMinutes ?? 0,
            (int)(a?.OvertimeMinutes ?? 0),
            holiday,
            a?.LeaveRequest?.LeaveType,
            a?.HalfDayPeriod,
            shift is null
                ? null
                : new ShiftDto(shift.Id, shift.Name, shift.StartTime, shift.EndTime, shift.GraceMinutes, shift.IsDefault),
            AttendanceRules.IsOvernight(shift));
    }

    /// <summary>
    /// The date of the shift the employee is on right now. On an overnight shift
    /// the small hours belong to the shift that started yesterday: until it ends,
    /// or until its clock-out while it's still clocked in. Otherwise today.
    /// </summary>
    private async Task<(DateOnly Date, Shift? Shift)> CurrentShiftDayAsync(int userId)
    {
        var now = AppClock.TimeOfDay;
        var yesterday = Today.AddDays(-1);
        var shift = await EmployeeShifts.ForUserAsync(_context, userId);

        var open = await _context.Attendances
            .AsNoTracking()
            .Include(a => a.Shift)
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Date == yesterday
                && a.CheckInTime != null && a.CheckOutTime == null);
        if (open is not null && AttendanceRules.IsPreviousShiftDay(now, open.Shift ?? shift))
            return (yesterday, open.Shift ?? shift);

        if (AttendanceRules.IsPreviousShiftDay(now, shift) && AppClock.Now < AttendanceRules.ShiftEndsAt(yesterday, shift))
            return (yesterday, shift);

        return (Today, shift);
    }

    private static async Task<string?> HolidayOnAsync(DateOnly date)
    {
        var holidays = await PublicHolidaysHelper.GetHolidaysAsync(date.Year);
        var holiday = holidays.FirstOrDefault(h => DateOnly.FromDateTime(h.Date) == date);
        return holiday?.EnglishName ?? holiday?.KhmerName;
    }
}
