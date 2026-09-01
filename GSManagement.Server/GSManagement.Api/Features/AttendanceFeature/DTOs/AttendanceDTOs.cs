using GSManagement.Domain.Entities.Enums;

namespace GSManagement.Api.Features.AttendanceFeature.DTOs;

public class AttendanceGridResponseDto
{
    public List<WeekDayInfoDto> WeekDates { get; set; } = new();
    public List<EmployeeAttendanceDto> Employees { get; set; } = new();
}

public class WeekDayInfoDto
{
    public string DayName { get; set; } = string.Empty;
    public int DayNumber { get; set; }
    public DateOnly Date { get; set; }
    public bool IsHoliday {get; set;}
    public string? HolidayName {get; set;}
}

public class EmployeeAttendanceDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public List<AttendanceRecordDto> Attendance { get; set; } = new();
}

public class AttendanceRecordDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly? CheckInTime { get; set; }
    public TimeOnly? CheckOutTime { get; set; }
    public string? TotalHour { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Remark { get; set; }
}


public class CreateAttendanceDto
{
    public int UserId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly? CheckInTime { get; set; }
    public TimeOnly? CheckOutTime { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Remark { get; set; }
    public int? LeaveRequestId { get; set; }
}