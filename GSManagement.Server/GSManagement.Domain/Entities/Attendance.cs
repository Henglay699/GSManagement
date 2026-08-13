using System.ComponentModel.DataAnnotations.Schema;

namespace GSManagement.Domain.Entities;

public enum AttendanceStatus
{
    OnTime,
    Late,
    Leave,
    Absent
}

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

    public User? User { get; set; }
}
