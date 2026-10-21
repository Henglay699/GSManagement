namespace GSManagement.Domain.Entities;

public class OvertimeRecord
{
    public int Id { get; set; }
    public int AttendanceId { get; set; }

    /// <summary>
    /// Minutes worked beyond the shift's expected duration.
    /// </summary>
    public double OvertimeMinutes { get; set; }

    public string? Reason { get; set; }

    public Attendance Attendance { get; set; } = null!;
}
