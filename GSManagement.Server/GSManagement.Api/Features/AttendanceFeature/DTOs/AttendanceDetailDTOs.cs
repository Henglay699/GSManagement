using GSManagement.Domain.Entities.Enums;

namespace GSManagement.Api.Features.AttendanceFeature.DTOs;

public class AttendanceUserSummaryDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? AvatarUrl { get; set; }
}

// Always reflects the FULL month regardless of which single date the
// frontend has selected on the calendar.
public class MonthlyAttendanceSummaryDto
{
    public int Present { get; set; }
    public int Late { get; set; }
    public int Absent { get; set; }
    public int Leave { get; set; }
}

public class DayAttendanceRecordDto
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }          // serializes to "yyyy-MM-dd"
    public string? CheckInTime { get; set; }     // "08:12 AM"
    public string? CheckOutTime { get; set; }    // "05:30 PM"
    public string? TotalHour { get; set; }       // "8h 18m"
    public AttendanceStatus Status { get; set; }
    public string? Remark { get; set; }
    public int? LeaveRequestId { get; set; }  // e.g. reason for absence/leave
}

public class HolidayInfoDto
{
    public DateOnly Date { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class UserAttendanceDetailDto
{
    public AttendanceUserSummaryDto User { get; set; } = null!;
    public MonthlyAttendanceSummaryDto Summary { get; set; } = null!;
    public List<DayAttendanceRecordDto> Records { get; set; } = new();
    public List<HolidayInfoDto> Holidays { get; set; } = new();
}