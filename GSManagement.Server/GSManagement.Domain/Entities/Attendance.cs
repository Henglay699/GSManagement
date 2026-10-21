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
    public string? Remark { get; set; }
    public int? LeaveRequestId { get; set; }

    /// <summary>
    /// Which shift this attendance record is linked to.
    /// Null means the default shift was in effect.
    /// </summary>
    public int? ShiftId { get; set; }

    /// <summary>
    /// Minutes of overtime worked beyond the shift's expected duration.
    /// Calculated automatically on clock-out.
    /// </summary>
    public double? OvertimeMinutes { get; set; }

    /// <summary>
    /// True when this record represents a half-day (e.g. half-day leave).
    /// </summary>
    public bool IsHalfDay { get; set; }

    /// <summary>
    /// If IsHalfDay is true, indicates which half of the day is off/worked.
    /// </summary>
    public HalfDayPeriod? HalfDayPeriod { get; set; }

    public User? User { get; set; }
    public LeaveRequest? LeaveRequest { get; set; }
    public Shift? Shift { get; set; }
    public OvertimeRecord? OvertimeRecord { get; set; }
}
