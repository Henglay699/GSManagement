using GSManagement.Api.Features.AttendanceFeature.Admin.DTOs;
using GSManagement.Api.Shared.Utils;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using static GSManagement.Api.Shared.Utils.DateParser;
using static GSManagement.Api.Shared.Utils.PublicHolidaysHelper;

namespace GSManagement.Api.Features.AttendanceFeature.Admin;

public class AttendanceService(GSDbContext context) : IAttendanceService
{
    private readonly GSDbContext _context = context;

    public async Task<AttendanceGridResponseDto> GetWeeklyAttendanceGridAsync(DateOnly selectedDate,
    AttendanceStatus? statusFilter)
    {
        int dayOfWeekOffset = ((int)selectedDate.DayOfWeek + 6) % 7;
        DateOnly monday = selectedDate.AddDays(-dayOfWeekOffset);
        DateOnly sunday = monday.AddDays(6);

        // Fetch primary year holidays as a mutable List
        var holidays = await PublicHolidaysHelper.GetHolidaysAsync(monday.Year);

        // If week crosses into a new year, fetch and append next year's holidays safely
        if (sunday.Year != monday.Year)
        {
            var nextYearHolidays = await PublicHolidaysHelper.GetHolidaysAsync(sunday.Year);
            holidays.AddRange(nextYearHolidays);
        }

        // 2. Build 7-day week info starting from Monday
        var weekDates = new List<WeekDayInfoDto>();
        for (int i = 0; i < 7; i++)
        {
            var currentDate = monday.AddDays(i);
            var holiday = holidays.FirstOrDefault(h => DateOnly.FromDateTime(h.Date) == currentDate);
            weekDates.Add(new WeekDayInfoDto
            {
                DayName = currentDate.DayOfWeek.ToString(),
                DayNumber = currentDate.Day,
                Date = currentDate,
                IsHoliday = holiday != null,
                HolidayName = holiday?.KhmerName ?? holiday?.EnglishName
            });
        }

        // 3. Fetch active users
        var users = await _context.Users.Include(u => u.Roles).AsNoTracking().ToListAsync();

        // 4. Fetch attendance records within week range (filtered by status if provided)
        var attendanceQuery = _context.Attendances
            .Include(a => a.Shift)
            .AsNoTracking()
            .Where(a => a.Date >= monday && a.Date <= sunday);

        if (statusFilter.HasValue)
        {
            attendanceQuery = attendanceQuery.Where(a => a.Status == statusFilter.Value);
        }

        var attendanceList = await attendanceQuery.ToListAsync();

        // 5. Map to response structure
        var employees = users.ConvertAll(user => new EmployeeAttendanceDto
        {
            Id = user.Id,
            Name = user.UserName ?? string.Empty,
            Role = string.Join(",", user.Roles.Select(r => r.RoleName)) ?? string.Empty,
            Avatar = user?.ImageUrl,
            Attendance = attendanceList
                .Where(a => a.UserId == user?.Id)
                .Select(a => new AttendanceRecordDto
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    Date = a.Date,
                    CheckInTime = a.CheckInTime,
                    CheckOutTime = a.CheckOutTime,
                    TotalHour = a.TotalHour.HasValue
                        ? $"{(int)a.TotalHour.Value}h {(int)((a.TotalHour.Value % 1) * 60)}m"
                        : null,
                    OvertimeMinutes = a.OvertimeMinutes,
                    IsHalfDay = a.IsHalfDay,
                    HalfDayPeriod = a.HalfDayPeriod,
                    ShiftId = a.ShiftId,
                    ShiftName = a.Shift?.Name,
                    Status = a.Status,
                    Remark = a.Remark
                })
                .ToList()
        });

        return new AttendanceGridResponseDto
        {
            WeekDates = weekDates,
            Employees = employees
        };
    }

    public async Task<AttendanceRecordDto> CreateAsync(CreateAttendanceDto dto)
    {
        if (dto.CheckInTime.HasValue && dto.CheckOutTime.HasValue && dto.CheckInTime > dto.CheckOutTime)
        {
            throw new InvalidOperationException("Check-in time cannot be later than check-out time.");
        }

        var shift = (dto.ShiftId.HasValue ? await _context.Shifts.FindAsync(dto.ShiftId.Value) : null)
            ?? await _context.Shifts.FirstOrDefaultAsync(s => s.IsDefault)
            ?? await _context.Shifts.FirstOrDefaultAsync();

        var shiftStart = shift?.StartTime ?? new TimeOnly(8, 0);
        var shiftEnd = shift?.EndTime ?? new TimeOnly(17, 0);
        var graceMinutes = shift?.GraceMinutes ?? 15;
        var checkInTimeGracePeriod = shiftStart.AddMinutes(graceMinutes);

        if (dto.CheckInTime.HasValue && dto.CheckInTime > checkInTimeGracePeriod && dto.Status == AttendanceStatus.OnTime)
        {
            throw new InvalidOperationException($"Check-in time is later than {checkInTimeGracePeriod:HH:mm}. Please mark the status as 'Late' instead of 'OnTime'.");
        }

        if (dto.CheckInTime.HasValue && dto.CheckInTime <= checkInTimeGracePeriod && dto.Status == AttendanceStatus.Late)
        {
            throw new InvalidOperationException($"Check-in time is within the grace period (before {checkInTimeGracePeriod:HH:mm}). Please mark the status as 'OnTime' instead of 'Late'.");
        }

        var existing = await _context.Attendances
            .FirstOrDefaultAsync(a => a.UserId == dto.UserId && a.Date == dto.Date);

        if (existing != null)
            throw new InvalidOperationException($"Attendance already recorded for this employee on {dto.Date}.");

        var holidays = await GetHolidaysAsync(dto.Date.Year);
        var holidayInfo = holidays.FirstOrDefault(h => DateOnly.FromDateTime(h.Date) == dto.Date);

        if (holidayInfo != null)
        {
            var holidayName = holidayInfo.KhmerName ?? holidayInfo.EnglishName ?? "Public Holiday";
            throw new InvalidOperationException($"Cannot create attendance record. {dto.Date} is a public holiday ({holidayName}).");
        }

        if (dto.Date.DayOfWeek == DayOfWeek.Sunday)
            throw new InvalidOperationException($"Cannot create attendance record on Dayoff Sunday ({dto.Date}).");

        double? overtimeMinutes = dto.OvertimeMinutes;
        if (!overtimeMinutes.HasValue && dto.CheckOutTime.HasValue && dto.CheckOutTime.Value > shiftEnd)
        {
            overtimeMinutes = Math.Round((dto.CheckOutTime.Value - shiftEnd).TotalMinutes, 0);
        }

        var attendance = new Attendance
        {
            UserId = dto.UserId,
            Date = dto.Date,
            CheckInTime = dto.CheckInTime,
            CheckOutTime = dto.CheckOutTime,
            Status = dto.Status,
            Remark = dto.Remark,
            LeaveRequestId = dto.LeaveRequestId,
            ShiftId = shift?.Id,
            OvertimeMinutes = overtimeMinutes,
            IsHalfDay = dto.IsHalfDay,
            HalfDayPeriod = dto.HalfDayPeriod
        };

        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync();

        if (overtimeMinutes.HasValue && overtimeMinutes.Value > 0)
        {
            _context.OvertimeRecords.Add(new OvertimeRecord
            {
                AttendanceId = attendance.Id,
                OvertimeMinutes = overtimeMinutes.Value,
                Reason = "Admin attendance record overtime"
            });
            await _context.SaveChangesAsync();
        }

        return new AttendanceRecordDto
        {
            Id = attendance.Id,
            UserId = attendance.UserId,
            Date = attendance.Date,
            CheckInTime = attendance.CheckInTime,
            CheckOutTime = attendance.CheckOutTime,
            TotalHour = attendance.TotalHour.HasValue
                ? $"{(int)attendance.TotalHour.Value}h {(int)((attendance.TotalHour.Value % 1) * 60)}m"
                : null,
            OvertimeMinutes = attendance.OvertimeMinutes,
            IsHalfDay = attendance.IsHalfDay,
            HalfDayPeriod = attendance.HalfDayPeriod,
            ShiftId = attendance.ShiftId,
            ShiftName = shift?.Name,
            Status = attendance.Status,
            Remark = attendance.Remark
        };
    }

    public async Task<AttendanceRecordDto?> GetByIdAsync(int id)
    {
        var attendance = await _context.Attendances
            .Include(a => a.Shift)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attendance == null) return null;

        return new AttendanceRecordDto
        {
            Id = attendance.Id,
            UserId = attendance.UserId,
            Date = attendance.Date,
            CheckInTime = attendance.CheckInTime,
            CheckOutTime = attendance.CheckOutTime,
            TotalHour = attendance.TotalHour.HasValue
                ? $"{(int)attendance.TotalHour.Value}h {(int)((attendance.TotalHour.Value % 1) * 60)}m"
                : null,
            OvertimeMinutes = attendance.OvertimeMinutes,
            IsHalfDay = attendance.IsHalfDay,
            HalfDayPeriod = attendance.HalfDayPeriod,
            ShiftId = attendance.ShiftId,
            ShiftName = attendance.Shift?.Name,
            Status = attendance.Status,
            Remark = attendance.Remark
        };
    }

    public async Task<UserAttendanceDetailDto?> GetUserAttendanceDetailAsync(int userId, int year, int month)
    {
        var user = await _context.Users
            .Include(u => u.Roles)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return null;
        }

        var firstDayOfMonth = new DateOnly(year, month, 1);
        var lastDayOfMonth = firstDayOfMonth.AddMonths(1).AddDays(-1);

        var monthAttendance = await _context.Attendances
            .Include(a => a.Shift)
            .AsNoTracking()
            .Where(a =>
                a.UserId == userId &&
                a.Date >= firstDayOfMonth &&
                a.Date <= lastDayOfMonth)
            .OrderBy(a => a.Date)
            .ToListAsync();

        var summary = new MonthlyAttendanceSummaryDto
        {
            Present = monthAttendance.Count(a => a.Status == AttendanceStatus.OnTime),
            Late = monthAttendance.Count(a => a.Status == AttendanceStatus.Late),
            Absent = monthAttendance.Count(a => a.Status == AttendanceStatus.Absent),
            Leave = monthAttendance.Count(a => a.Status == AttendanceStatus.Leave),
            HalfDayLeave = monthAttendance.Count(a => a.Status == AttendanceStatus.HalfDayLeave),
            TotalOvertimeHours = Math.Round(monthAttendance.Where(a => a.OvertimeMinutes.HasValue).Sum(a => a.OvertimeMinutes!.Value) / 60.0, 2)
        };

        var records = monthAttendance.ConvertAll(a => new DayAttendanceRecordDto
        {
            Id = a.Id,
            Date = a.Date,
            CheckInTime = DateParser.FormatTime(a.CheckInTime),
            CheckOutTime = DateParser.FormatTime(a.CheckOutTime),
            TotalHour = a.TotalHour.HasValue
                ? $"{(int)a.TotalHour.Value}h {(int)((a.TotalHour.Value % 1) * 60)}m"
                : null,
            OvertimeMinutes = a.OvertimeMinutes,
            IsHalfDay = a.IsHalfDay,
            HalfDayPeriod = a.HalfDayPeriod,
            ShiftName = a.Shift?.Name,
            Status = a.Status,
            Remark = a.Remark,
            LeaveRequestId = a.LeaveRequestId
        });

        var department = user.Roles is { Count: > 0 }
            ? string.Join(", ", user.Roles.Select(r => r.RoleName))
            : null;

        var yearHolidays = await PublicHolidaysHelper.GetHolidaysAsync(year);
        var monthHolidays = yearHolidays
            .Where(h =>
            {
                var holidayDate = DateOnly.FromDateTime(h.Date);
                return holidayDate >= firstDayOfMonth && holidayDate <= lastDayOfMonth;
            })
            .Select(h => new HolidayInfoDto
            {
                Date = DateOnly.FromDateTime(h.Date),
                Name = h.KhmerName ?? h.EnglishName ?? "Public Holiday",
            })
            .ToList();

        return new UserAttendanceDetailDto
        {
            User = new AttendanceUserSummaryDto
            {
                Id = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                Department = department,
                AvatarUrl = user.ImageUrl,
            },
            Summary = summary,
            Records = records,
            Holidays = monthHolidays,
        };
    }

    public async Task<AttendanceRecordDto?> UpdateAsync(int id, CreateAttendanceDto dto)
    {
        if (dto.CheckInTime.HasValue && dto.CheckOutTime.HasValue && dto.CheckInTime > dto.CheckOutTime)
        {
            throw new InvalidOperationException("Check-in time cannot be later than check-out time.");
        }

        var attendance = await _context.Attendances.Include(a => a.Shift).FirstOrDefaultAsync(a => a.Id == id);
        if (attendance == null) return null;

        if (attendance.Status == AttendanceStatus.Leave && !attendance.IsHalfDay)
        {
            throw new InvalidOperationException("Attendance records associated with approved full-day leave cannot be edited manually.");
        }

        var shift = (dto.ShiftId.HasValue ? await _context.Shifts.FindAsync(dto.ShiftId.Value) : null)
            ?? attendance.Shift
            ?? await _context.Shifts.FirstOrDefaultAsync(s => s.IsDefault)
            ?? await _context.Shifts.FirstOrDefaultAsync();

        var shiftStart = shift?.StartTime ?? new TimeOnly(8, 0);
        var shiftEnd = shift?.EndTime ?? new TimeOnly(17, 0);
        var graceMinutes = shift?.GraceMinutes ?? 15;
        var checkInTimeGracePeriod = shiftStart.AddMinutes(graceMinutes);

        if (dto.CheckInTime.HasValue && dto.CheckInTime > checkInTimeGracePeriod && dto.Status == AttendanceStatus.OnTime)
        {
            throw new InvalidOperationException($"Check-in time is later than {checkInTimeGracePeriod:HH:mm}. Please mark the status as 'Late' instead of 'OnTime'.");
        }

        if (dto.CheckInTime.HasValue && dto.CheckInTime <= checkInTimeGracePeriod && dto.Status == AttendanceStatus.Late)
        {
            throw new InvalidOperationException($"Check-in time is within the grace period (before {checkInTimeGracePeriod:HH:mm}). Please mark the status as 'OnTime' instead of 'Late'.");
        }

        TimeOnly? checkIn = dto.CheckInTime.HasValue ? dto.CheckInTime : null;
        TimeOnly? checkOut = dto.CheckOutTime.HasValue ? dto.CheckOutTime : null;

        attendance.CheckInTime = dto.Status == AttendanceStatus.Absent ? null : checkIn;
        attendance.CheckOutTime = dto.Status == AttendanceStatus.Absent ? null : checkOut;
        attendance.Status = dto.Status;
        attendance.Remark = dto.Remark;
        attendance.ShiftId = shift?.Id;
        attendance.IsHalfDay = dto.IsHalfDay;
        attendance.HalfDayPeriod = dto.HalfDayPeriod;

        double? overtimeMinutes = dto.OvertimeMinutes;
        if (!overtimeMinutes.HasValue && attendance.CheckOutTime.HasValue && attendance.CheckOutTime.Value > shiftEnd)
        {
            overtimeMinutes = Math.Round((attendance.CheckOutTime.Value - shiftEnd).TotalMinutes, 0);
        }
        attendance.OvertimeMinutes = overtimeMinutes;

        if (overtimeMinutes.HasValue && overtimeMinutes.Value > 0)
        {
            var otRecord = await _context.OvertimeRecords.FirstOrDefaultAsync(o => o.AttendanceId == attendance.Id);
            if (otRecord is null)
            {
                _context.OvertimeRecords.Add(new OvertimeRecord
                {
                    AttendanceId = attendance.Id,
                    OvertimeMinutes = overtimeMinutes.Value,
                    Reason = "Admin attendance record overtime"
                });
            }
            else
            {
                otRecord.OvertimeMinutes = overtimeMinutes.Value;
            }
        }

        _context.Attendances.Update(attendance);
        await _context.SaveChangesAsync();

        return new AttendanceRecordDto
        {
            Id = attendance.Id,
            UserId = attendance.UserId,
            Date = attendance.Date,
            CheckInTime = attendance.CheckInTime,
            CheckOutTime = attendance.CheckOutTime,
            TotalHour = attendance.TotalHour.HasValue
                ? $"{(int)attendance.TotalHour.Value}h {(int)((attendance.TotalHour.Value % 1) * 60)}m"
                : null,
            OvertimeMinutes = attendance.OvertimeMinutes,
            IsHalfDay = attendance.IsHalfDay,
            HalfDayPeriod = attendance.HalfDayPeriod,
            ShiftId = attendance.ShiftId,
            ShiftName = shift?.Name,
            Status = attendance.Status,
            Remark = attendance.Remark
        };
    }
}