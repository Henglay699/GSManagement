using GSManagement.Api.Features.AttendanceFeature.Admin.DTOs;
using GSManagement.Api.Features.AttendanceFeature.Summary;
using GSManagement.Api.Shared.Utils;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.AttendanceFeature.Admin;

public class AttendanceService(GSDbContext context, AttendanceSummaryService summaryService) : IAttendanceService
{
    private readonly GSDbContext _context = context;
    private readonly AttendanceSummaryService _summaryService = summaryService;

    public async Task<DailyAttendanceDto> GetDailyAsync(DateOnly date)
    {
        // Reuse the month view so a day reads the same here as on the employee's page.
        var month = await _summaryService.GetAsync(date.Year, date.Month);
        var rows = month
            .Select(m => new DailyAttendanceRowDto(m.Employee, m.Days.First(d => d.Date == date)))
            .ToList();

        var counts = Enum.GetValues<DayStatus>()
            .ToDictionary(s => s, s => rows.Count(r => r.Day.Status == s));

        return new DailyAttendanceDto(
            date,
            rows.FirstOrDefault()?.Day.HolidayName,
            date.DayOfWeek == DayOfWeek.Sunday,
            counts,
            rows);
    }

    public async Task<WeeklyAttendanceDto> GetWeeklyAsync(DateOnly anyDayInWeek)
    {
        var start = anyDayInWeek.AddDays(-(((int)anyDayInWeek.DayOfWeek + 6) % 7)); // Monday
        var end = start.AddDays(6);

        // A week can span two months: build both month views and take the seven days.
        var months = new List<MonthSummaryDto>(await _summaryService.GetAsync(start.Year, start.Month));
        if (end.Month != start.Month)
            months.AddRange(await _summaryService.GetAsync(end.Year, end.Month));

        var rows = months
            .GroupBy(m => m.Employee.Id)
            .Select(g => new WeeklyAttendanceRowDto(
                g.First().Employee,
                g.SelectMany(m => m.Days)
                    .Where(d => d.Date >= start && d.Date <= end)
                    .OrderBy(d => d.Date)
                    .ToList()))
            .OrderBy(r => r.Employee.UserName)
            .ToList();

        var days = Enumerable.Range(0, 7)
            .Select(i => start.AddDays(i))
            .Select(d => new WeekDayDto(
                d,
                rows.FirstOrDefault()?.Days.FirstOrDefault(x => x.Date == d)?.HolidayName,
                d.DayOfWeek == DayOfWeek.Sunday))
            .ToList();

        return new WeeklyAttendanceDto(start, end, days, rows);
    }

    public async Task<AttendanceRecordDto?> GetByIdAsync(int id)
    {
        var a = await _context.Attendances.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return a is null ? null : Map(a);
    }

    public async Task<AttendanceRecordDto> CreateAsync(SaveAttendanceDto dto)
    {
        await ValidateDayAsync(dto);

        if (await _context.Attendances.AnyAsync(a => a.UserId == dto.UserId && a.Date == dto.Date))
            throw new InvalidOperationException($"This employee already has a record for {dto.Date:dd MMM yyyy}. Edit it instead.");

        if (!await _context.Users.AnyAsync(u => u.Id == dto.UserId))
            throw new KeyNotFoundException($"Employee {dto.UserId} was not found.");

        var attendance = new Attendance { UserId = dto.UserId, Date = dto.Date };
        var shift = await ResolveShiftAsync(dto.ShiftId);
        Fill(attendance, dto, shift);

        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync();
        return Map(attendance);
    }

    public async Task<AttendanceRecordDto?> UpdateAsync(int id, SaveAttendanceDto dto)
    {
        var attendance = await _context.Attendances.Include(a => a.Shift).FirstOrDefaultAsync(a => a.Id == id);
        if (attendance is null) return null;

        if (attendance.Status == AttendanceStatus.OnLeave)
            throw new InvalidOperationException("This day is approved leave. Change the leave request instead.");

        // The employee and date of a record never change; only its times/notes.
        dto.UserId = attendance.UserId;
        dto.Date = attendance.Date;
        ValidateTimes(dto);

        var shift = await ResolveShiftAsync(dto.ShiftId ?? attendance.ShiftId);
        Fill(attendance, dto, shift);
        await _context.SaveChangesAsync();
        return Map(attendance);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var attendance = await _context.Attendances.FirstOrDefaultAsync(a => a.Id == id);
        if (attendance is null) return false;
        if (attendance.LeaveRequestId is not null)
            throw new InvalidOperationException("This record belongs to a leave request. Cancel or reject the leave instead.");

        _context.Attendances.Remove(attendance);
        await _context.SaveChangesAsync();
        return true;
    }

    private static void Fill(Attendance a, SaveAttendanceDto dto, Shift? shift)
    {
        a.ShiftId = shift?.Id;
        a.Remark = string.IsNullOrWhiteSpace(dto.Remark) ? null : dto.Remark.Trim();

        if (dto.MarkAbsent)
        {
            a.Status = AttendanceStatus.Absent;
            a.CheckInTime = null;
            a.CheckOutTime = null;
        }
        else
        {
            // Half-day leave stays half-day; otherwise Apply sets Present/Late.
            if (a.Status != AttendanceStatus.HalfDay) a.Status = AttendanceStatus.Present;
            a.CheckInTime = dto.CheckInTime;
            a.CheckOutTime = dto.CheckOutTime;
            a.MissedClockOut = false;
        }
        AttendanceRules.Apply(a, shift);
    }

    private async Task ValidateDayAsync(SaveAttendanceDto dto)
    {
        ValidateTimes(dto);
        if (dto.Date > DateOnly.FromDateTime(DateTime.Today))
            throw new InvalidOperationException("Attendance can't be recorded for a future date.");
        if (dto.Date.DayOfWeek == DayOfWeek.Sunday)
            throw new InvalidOperationException("Sunday is a day off.");

        var holidays = await PublicHolidaysHelper.GetHolidaysAsync(dto.Date.Year);
        var holiday = holidays.FirstOrDefault(h => DateOnly.FromDateTime(h.Date) == dto.Date);
        if (holiday is not null)
            throw new InvalidOperationException($"{dto.Date:dd MMM yyyy} is a public holiday ({holiday.EnglishName ?? holiday.KhmerName}).");
    }

    private static void ValidateTimes(SaveAttendanceDto dto)
    {
        if (dto.MarkAbsent) return;
        if (dto.CheckInTime is null)
            throw new InvalidOperationException("Enter a check-in time, or mark the day as absent.");
        if (dto.CheckOutTime is { } o && o <= dto.CheckInTime)
            throw new InvalidOperationException("Check-out must be after check-in.");
    }

    private async Task<Shift?> ResolveShiftAsync(int? shiftId) =>
        (shiftId is { } id ? await _context.Shifts.FindAsync(id) : null)
        ?? await _context.Shifts.FirstOrDefaultAsync(s => s.IsDefault)
        ?? await _context.Shifts.FirstOrDefaultAsync();

    private static AttendanceRecordDto Map(Attendance a) => new(
        a.Id, a.UserId, a.Date, a.CheckInTime, a.CheckOutTime, a.Status, a.LateMinutes,
        a.EarlyLeaveMinutes, a.OvertimeMinutes, a.MissedClockOut, a.IsHalfDay, a.HalfDayPeriod,
        a.ShiftId, a.Remark);
}
