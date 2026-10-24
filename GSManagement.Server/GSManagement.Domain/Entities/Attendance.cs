using System.ComponentModel.DataAnnotations.Schema;
using GSManagement.Domain.Entities.Enums;

namespace GSManagement.Domain.Entities;

public class Attendance
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly? CheckInTime { get; set; }
    public TimeOnly? CheckOutTime { get; set; }

    [NotMapped]
    public double? TotalHour =>
        (CheckOutTime.HasValue && CheckInTime.HasValue)
        ? (CheckOutTime.Value - CheckInTime.Value).TotalHours : null;

    public AttendanceStatus Status { get; set; }

    /// <summary>Minutes after the expected start, when the arrival was late.</summary>
    public int LateMinutes { get; set; }

    /// <summary>Minutes before the expected end, when the employee left early.</summary>
    public int EarlyLeaveMinutes { get; set; }

    /// <summary>Minutes worked after the shift end.</summary>
    public double? OvertimeMinutes { get; set; }

    /// <summary>Clocked in but never clocked out; set by the nightly close-out job.</summary>
    public bool MissedClockOut { get; set; }

    /// <summary>A note written by a person (HR or the system for leave), not a status.</summary>
    public string? Remark { get; set; }

    public int? LeaveRequestId { get; set; }

    /// <summary>The shift in effect that day. Null means the default shift.</summary>
    public int? ShiftId { get; set; }

    /// <summary>True when the record covers half-day leave.</summary>
    public bool IsHalfDay { get; set; }

    /// <summary>Which half is on leave, when IsHalfDay is true.</summary>
    public HalfDayPeriod? HalfDayPeriod { get; set; }

    public User? User { get; set; }
    public LeaveRequest? LeaveRequest { get; set; }
    public Shift? Shift { get; set; }
}
