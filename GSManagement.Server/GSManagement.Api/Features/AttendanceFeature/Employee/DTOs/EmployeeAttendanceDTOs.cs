using GSManagement.Api.Features.ShiftFeature.DTOs;
using GSManagement.Domain.Entities.Enums;

namespace GSManagement.Api.Features.AttendanceFeature.Employee.DTOs;

public record ClockResultDto(
    int Id,
    DateOnly Date,
    TimeOnly? CheckInTime,
    TimeOnly? CheckOutTime,
    double? TotalHours,
    double? OvertimeMinutes,
    AttendanceStatus Status,
    string? Remark,
    string? ShiftName,
    string Message
);

public record EmployeeTodayStatusDto(
    DateOnly Date,
    bool IsClockedIn,
    bool IsClockedOut,
    TimeOnly? CheckInTime,
    TimeOnly? CheckOutTime,
    double? TotalHours,
    double? OvertimeMinutes,
    AttendanceStatus? Status,
    ShiftDto? Shift,
    bool IsHalfDay,
    HalfDayPeriod? HalfDayPeriod
);

public record EmployeeAttendanceRecordDto(
    int Id,
    DateOnly Date,
    TimeOnly? CheckInTime,
    TimeOnly? CheckOutTime,
    double? TotalHours,
    double? OvertimeMinutes,
    AttendanceStatus Status,
    string? Remark,
    bool IsHalfDay,
    HalfDayPeriod? HalfDayPeriod,
    string? ShiftName
);

public record EmployeeMonthlySummaryDto(
    int Year,
    int Month,
    int TotalDaysWorked,
    double TotalHoursWorked,
    double TotalOvertimeHours,
    int TotalOnTime,
    int TotalLate,
    int TotalLeave,
    int TotalAbsent,
    int TotalHalfDayLeave,
    List<EmployeeAttendanceRecordDto> Records
);
