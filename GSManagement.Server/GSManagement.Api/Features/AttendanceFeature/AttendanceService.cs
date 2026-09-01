using GSManagement.Api.Features.AttendanceFeature.DTOs;
using GSManagement.Api.Shared.Utils;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.AttendanceFeature;

public class AttendanceService(GSDbContext context) : IAttendanceService
{
    private readonly GSDbContext _context = context;

    public async Task<AttendanceGridResponseDto> GetWeeklyAttendanceGridAsync(DateOnly selectedDate, AttendanceStatus? statusFilter)
    {
        int dayOfWeekOffset = ((int)selectedDate.DayOfWeek + 6) % 7;
        DateOnly monday = selectedDate.AddDays(-dayOfWeekOffset);
        DateOnly sunday = monday.AddDays(6);


        var holidays = await PublicHolidaysHelper.GetHolidaysAsync(monday.Year);
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
        var existing = await _context.Attendances
            .FirstOrDefaultAsync(a => a.UserId == dto.UserId && a.Date == dto.Date);

        if (existing != null)
            throw new InvalidOperationException($"Attendance already recorded for this employee on {dto.Date}.");

        var attendance = new Attendance
        {
            UserId = dto.UserId,
            Date = dto.Date,
            CheckInTime = dto.CheckInTime,
            CheckOutTime = dto.CheckOutTime,
            Status = dto.Status,
            Remark = dto.Remark,
            LeaveRequestId = dto.LeaveRequestId
        };

        _context.Attendances.Add(attendance);
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
            Status = attendance.Status,
            Remark = attendance.Remark
        };
    }

    public async Task<AttendanceRecordDto?> GetByIdAsync(int id)
    {
        var attendance = await _context.Attendances
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
            Status = attendance.Status,
            Remark = attendance.Remark
        };
    }
}