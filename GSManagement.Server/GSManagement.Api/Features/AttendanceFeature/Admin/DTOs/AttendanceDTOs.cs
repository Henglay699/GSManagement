using GSManagement.Api.Features.AttendanceFeature.Summary;
using GSManagement.Domain.Entities.Enums;

namespace GSManagement.Api.Features.AttendanceFeature.Admin.DTOs;

/// <summary>GET /api/admin/attendances/daily: every active employee for one date.</summary>
public record DailyAttendanceDto(
    DateOnly Date,
    string? HolidayName,
    bool IsDayOff,
    Dictionary<DayStatus, int> Counts,
    List<DailyAttendanceRowDto> Rows
);

public record DailyAttendanceRowDto(SummaryEmployeeDto Employee, SummaryDayDto Day);

/// <summary>GET /api/admin/attendances/weekly: every active employee, Monday to Sunday.</summary>
public record WeeklyAttendanceDto(
    DateOnly WeekStart,
    DateOnly WeekEnd,
    List<WeekDayDto> Days,
    List<WeeklyAttendanceRowDto> Rows
);

public record WeekDayDto(DateOnly Date, string? HolidayName, bool IsDayOff);

/// <summary>One employee's seven days, in the same order as WeeklyAttendanceDto.Days.</summary>
public record WeeklyAttendanceRowDto(SummaryEmployeeDto Employee, List<SummaryDayDto> Days);

/// <summary>
/// HR creates or corrects a record. The status is worked out from the times
/// (on time / late); set MarkAbsent for a working day the employee missed.
/// Leave days are managed through leave requests, not here.
/// </summary>
public class SaveAttendanceDto
{
    public int UserId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly? CheckInTime { get; set; }
    public TimeOnly? CheckOutTime { get; set; }
    public bool MarkAbsent { get; set; }
    public string? Remark { get; set; }
    public int? ShiftId { get; set; }
}

public record AttendanceRecordDto(
    int Id,
    int UserId,
    DateOnly Date,
    TimeOnly? CheckInTime,
    TimeOnly? CheckOutTime,
    AttendanceStatus Status,
    int LateMinutes,
    int EarlyLeaveMinutes,
    double? OvertimeMinutes,
    bool MissedClockOut,
    bool IsHalfDay,
    HalfDayPeriod? HalfDayPeriod,
    int? ShiftId,
    string? Remark
);
