using GSManagement.Api.Features.AttendanceFeature.Employee.DTOs;
using GSManagement.Api.Features.ShiftFeature.DTOs;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.AttendanceFeature.Employee;

public class EmployeeAttendanceService(GSDbContext context) : IEmployeeAttendanceService
{
    private readonly GSDbContext _context = context;

    public async Task<ClockResultDto> ClockInAsync(int userId)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var now = TimeOnly.FromDateTime(DateTime.Now);

        // Fetch default shift
        var shift = await _context.Shifts
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.IsDefault)
            ?? await _context.Shifts.AsNoTracking().FirstOrDefaultAsync();

        var shiftStart = shift?.StartTime ?? new TimeOnly(8, 0);
        var graceMinutes = shift?.GraceMinutes ?? 15;
        var lateThreshold = shiftStart.AddMinutes(graceMinutes);

        var existing = await _context.Attendances
            .Include(a => a.Shift)
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Date == today);

        if (existing is not null)
        {
            if (existing.Status == AttendanceStatus.Leave && !existing.IsHalfDay)
            {
                throw new InvalidOperationException("You have an approved full-day leave today.");
            }

            if (existing.CheckInTime.HasValue)
            {
                throw new InvalidOperationException("You have already clocked in today at " + existing.CheckInTime.Value.ToString("HH:mm") + ".");
            }

            // Existing record without check-in (e.g. half-day morning leave or admin placeholder)
            existing.CheckInTime = now;
            existing.ShiftId ??= shift?.Id;

            if (existing.IsHalfDay && existing.HalfDayPeriod == HalfDayPeriod.Morning)
            {
                // Working afternoon half: shift starts around 13:00
                var afternoonStart = new TimeOnly(13, 0);
                if (now > afternoonStart.AddMinutes(graceMinutes))
                {
                    existing.Remark = $"Afternoon check-in late at {now:HH:mm}";
                }
                else
                {
                    existing.Remark = $"Afternoon check-in on time at {now:HH:mm}";
                }
            }
            else
            {
                if (now > lateThreshold)
                {
                    var lateMinutes = (int)(now - shiftStart).TotalMinutes;
                    existing.Status = AttendanceStatus.Late;
                    existing.Remark = $"Late by {lateMinutes} minutes";
                }
                else
                {
                    existing.Status = AttendanceStatus.OnTime;
                    existing.Remark = "Clocked in on time";
                }
            }

            await _context.SaveChangesAsync();

            return new ClockResultDto(
                existing.Id,
                existing.Date,
                existing.CheckInTime,
                existing.CheckOutTime,
                existing.TotalHour,
                existing.OvertimeMinutes,
                existing.Status,
                existing.Remark,
                existing.Shift?.Name ?? shift?.Name,
                "Clocked in successfully at " + now.ToString("HH:mm")
            );
        }

        // New attendance record
        var status = now > lateThreshold ? AttendanceStatus.Late : AttendanceStatus.OnTime;
        var remark = status == AttendanceStatus.Late
            ? $"Late by {(int)(now - shiftStart).TotalMinutes} minutes"
            : "Clocked in on time";

        var attendance = new Attendance
        {
            UserId = userId,
            Date = today,
            CheckInTime = now,
            Status = status,
            Remark = remark,
            ShiftId = shift?.Id,
            IsHalfDay = false
        };

        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync();

        return new ClockResultDto(
            attendance.Id,
            attendance.Date,
            attendance.CheckInTime,
            attendance.CheckOutTime,
            attendance.TotalHour,
            attendance.OvertimeMinutes,
            attendance.Status,
            attendance.Remark,
            shift?.Name,
            "Clocked in successfully at " + now.ToString("HH:mm")
        );
    }

    public async Task<ClockResultDto> ClockOutAsync(int userId)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var now = TimeOnly.FromDateTime(DateTime.Now);

        var attendance = await _context.Attendances
            .Include(a => a.Shift)
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Date == today);

        if (attendance is null || !attendance.CheckInTime.HasValue)
        {
            throw new InvalidOperationException("You have not clocked in today yet.");
        }

        if (attendance.CheckOutTime.HasValue)
        {
            throw new InvalidOperationException("You have already clocked out today at " + attendance.CheckOutTime.Value.ToString("HH:mm") + ".");
        }

        attendance.CheckOutTime = now;

        // Fetch shift details for overtime calculation
        var shift = attendance.Shift
            ?? await _context.Shifts.AsNoTracking().FirstOrDefaultAsync(s => s.IsDefault)
            ?? await _context.Shifts.AsNoTracking().FirstOrDefaultAsync();

        var shiftEnd = shift?.EndTime ?? new TimeOnly(17, 0);

        // If clocked out after regular shift end time, calculate overtime
        if (now > shiftEnd)
        {
            var otMinutes = Math.Round((now - shiftEnd).TotalMinutes, 0);
            attendance.OvertimeMinutes = otMinutes;

            var overtimeRecord = await _context.OvertimeRecords
                .FirstOrDefaultAsync(o => o.AttendanceId == attendance.Id);

            if (overtimeRecord is null)
            {
                _context.OvertimeRecords.Add(new OvertimeRecord
                {
                    AttendanceId = attendance.Id,
                    OvertimeMinutes = otMinutes,
                    Reason = $"Clocked out after shift end ({shiftEnd:HH:mm})"
                });
            }
            else
            {
                overtimeRecord.OvertimeMinutes = otMinutes;
            }
        }
        else
        {
            attendance.OvertimeMinutes = 0;
        }

        await _context.SaveChangesAsync();

        return new ClockResultDto(
            attendance.Id,
            attendance.Date,
            attendance.CheckInTime,
            attendance.CheckOutTime,
            attendance.TotalHour,
            attendance.OvertimeMinutes,
            attendance.Status,
            attendance.Remark,
            shift?.Name,
            "Clocked out successfully at " + now.ToString("HH:mm")
        );
    }

    public async Task<EmployeeTodayStatusDto> GetTodayStatusAsync(int userId)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);

        var attendance = await _context.Attendances
            .Include(a => a.Shift)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Date == today);

        var shift = attendance?.Shift
            ?? await _context.Shifts.AsNoTracking().FirstOrDefaultAsync(s => s.IsDefault)
            ?? await _context.Shifts.AsNoTracking().FirstOrDefaultAsync();

        ShiftDto? shiftDto = shift is null ? null : new ShiftDto(
            shift.Id,
            shift.Name,
            shift.StartTime,
            shift.EndTime,
            shift.GraceMinutes,
            shift.IsDefault
        );

        return new EmployeeTodayStatusDto(
            Date: today,
            IsClockedIn: attendance?.CheckInTime.HasValue ?? false,
            IsClockedOut: attendance?.CheckOutTime.HasValue ?? false,
            CheckInTime: attendance?.CheckInTime,
            CheckOutTime: attendance?.CheckOutTime,
            TotalHours: attendance?.TotalHour,
            OvertimeMinutes: attendance?.OvertimeMinutes,
            Status: attendance?.Status,
            Shift: shiftDto,
            IsHalfDay: attendance?.IsHalfDay ?? false,
            HalfDayPeriod: attendance?.HalfDayPeriod
        );
    }

    public async Task<EmployeeMonthlySummaryDto> GetMonthlySummaryAsync(int userId, int year, int month)
    {
        var records = await _context.Attendances
            .Include(a => a.Shift)
            .AsNoTracking()
            .Where(a => a.UserId == userId && a.Date.Year == year && a.Date.Month == month)
            .OrderBy(a => a.Date)
            .ToListAsync();

        var recordDtos = records.Select(r => new EmployeeAttendanceRecordDto(
            r.Id,
            r.Date,
            r.CheckInTime,
            r.CheckOutTime,
            r.TotalHour,
            r.OvertimeMinutes,
            r.Status,
            r.Remark,
            r.IsHalfDay,
            r.HalfDayPeriod,
            r.Shift?.Name
        )).ToList();

        var totalDaysWorked = records.Count(r => r.CheckInTime.HasValue);
        var totalHours = Math.Round(records.Where(r => r.TotalHour.HasValue).Sum(r => r.TotalHour!.Value), 2);
        var totalOtHours = Math.Round(records.Where(r => r.OvertimeMinutes.HasValue).Sum(r => r.OvertimeMinutes!.Value) / 60.0, 2);

        return new EmployeeMonthlySummaryDto(
            Year: year,
            Month: month,
            TotalDaysWorked: totalDaysWorked,
            TotalHoursWorked: totalHours,
            TotalOvertimeHours: totalOtHours,
            TotalOnTime: records.Count(r => r.Status == AttendanceStatus.OnTime),
            TotalLate: records.Count(r => r.Status == AttendanceStatus.Late),
            TotalLeave: records.Count(r => r.Status == AttendanceStatus.Leave),
            TotalAbsent: records.Count(r => r.Status == AttendanceStatus.Absent),
            TotalHalfDayLeave: records.Count(r => r.Status == AttendanceStatus.HalfDayLeave),
            Records: recordDtos
        );
    }
}
