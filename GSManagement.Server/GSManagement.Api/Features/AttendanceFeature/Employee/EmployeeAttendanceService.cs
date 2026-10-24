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

    private static DateOnly Today => DateOnly.FromDateTime(DateTime.Today);

    public async Task<ClockResultDto> ClockInAsync(int userId)
    {
        var now = TimeOnly.FromDateTime(DateTime.Now);
        var (holiday, shift) = await DayContextAsync();
        if (Today.DayOfWeek == DayOfWeek.Sunday)
            throw new InvalidOperationException("Today is a day off (Sunday).");
        if (holiday is not null)
            throw new InvalidOperationException($"Today is a public holiday ({holiday}).");
        var attendance = await _context.Attendances
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Date == Today);

        if (attendance?.Status == AttendanceStatus.OnLeave)
            throw new InvalidOperationException("You have approved full-day leave today.");
        if (attendance?.CheckInTime is { } already)
            throw new InvalidOperationException($"You already clocked in today at {already:HH:mm}.");

        var opensAt = AttendanceRules.ClockInOpensAt(attendance);
        if (now < opensAt)
            throw new InvalidOperationException(opensAt == AttendanceRules.EarliestClockIn
                ? $"Clock-in opens at {opensAt:HH:mm}."
                : $"You're on half-day leave this morning. Clock-in opens at {opensAt:HH:mm}.");

        if (attendance is null)
        {
            attendance = new Attendance { UserId = userId, Date = Today, Status = AttendanceStatus.Present };
            _context.Attendances.Add(attendance);
        }
        else if (attendance.Status == AttendanceStatus.Absent)
        {
            // Marked absent earlier in the day: clocking in makes it a worked day.
            attendance.Status = AttendanceStatus.Present;
        }

        attendance.CheckInTime = now;
        attendance.ShiftId ??= shift?.Id;
        AttendanceRules.Apply(attendance, shift);
        await _context.SaveChangesAsync();

        var today = await GetTodayAsync(userId);
        var message = today.LateMinutes > 0
            ? $"Clocked in at {now:HH:mm}, {today.LateMinutes} min late."
            : $"Clocked in at {now:HH:mm}. Have a good day!";
        return new ClockResultDto(today, message);
    }

    public async Task<ClockResultDto> ClockOutAsync(int userId)
    {
        var now = TimeOnly.FromDateTime(DateTime.Now);
        var (_, defaultShift) = await DayContextAsync();
        var attendance = await _context.Attendances
            .Include(a => a.Shift)
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Date == Today);

        if (attendance?.CheckInTime is null)
            throw new InvalidOperationException("You have not clocked in today.");
        if (attendance.CheckOutTime is { } done)
            throw new InvalidOperationException($"You already clocked out today at {done:HH:mm}.");

        attendance.CheckOutTime = now;
        AttendanceRules.Apply(attendance, attendance.Shift ?? defaultShift);
        await _context.SaveChangesAsync();

        var today = await GetTodayAsync(userId);
        var message = today.OvertimeMinutes > 0
            ? $"Clocked out at {now:HH:mm}, with {today.OvertimeMinutes} min overtime."
            : today.EarlyLeaveMinutes > 0
                ? $"Clocked out at {now:HH:mm}, {today.EarlyLeaveMinutes} min before the end of your shift."
                : $"Clocked out at {now:HH:mm}. See you tomorrow!";
        return new ClockResultDto(today, message);
    }

    public async Task<EmployeeTodayDto> GetTodayAsync(int userId)
    {
        var (holiday, defaultShift) = await DayContextAsync();
        var a = await _context.Attendances
            .AsNoTracking()
            .Include(x => x.Shift)
            .Include(x => x.LeaveRequest)
            .FirstOrDefaultAsync(x => x.UserId == userId && x.Date == Today);

        var shift = a?.Shift ?? defaultShift;
        var window = a is null
            ? (Start: shift?.StartTime ?? AttendanceRules.DefaultStart,
               End: shift?.EndTime ?? AttendanceRules.DefaultEnd,
               Grace: shift?.GraceMinutes ?? AttendanceRules.DefaultGraceMinutes)
            : AttendanceRules.ExpectedWindow(shift, a);

        var isDayOff = Today.DayOfWeek == DayOfWeek.Sunday;
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
            Today,
            status,
            CanClockIn: workday && a?.CheckInTime is null,
            CanClockOut: clockedInOnly,
            AttendanceRules.ClockInOpensAt(a),
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
                : new ShiftDto(shift.Id, shift.Name, shift.StartTime, shift.EndTime, shift.GraceMinutes, shift.IsDefault));
    }

    private async Task<(string? Holiday, Shift? DefaultShift)> DayContextAsync()
    {
        var holidays = await PublicHolidaysHelper.GetHolidaysAsync(Today.Year);
        var holiday = holidays.FirstOrDefault(h => DateOnly.FromDateTime(h.Date) == Today);
        var shift = await _context.Shifts.AsNoTracking().FirstOrDefaultAsync(s => s.IsDefault)
            ?? await _context.Shifts.AsNoTracking().FirstOrDefaultAsync();
        return (holiday?.EnglishName ?? holiday?.KhmerName, shift);
    }
}
