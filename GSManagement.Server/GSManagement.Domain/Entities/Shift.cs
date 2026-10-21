namespace GSManagement.Domain.Entities;

public class Shift
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    /// <summary>
    /// Number of minutes after StartTime before an employee is considered late.
    /// </summary>
    public int GraceMinutes { get; set; } = 15;

    /// <summary>
    /// When true this shift is automatically assigned to new attendance records
    /// unless the employee has a different shift assigned.
    /// </summary>
    public bool IsDefault { get; set; }

    /// <summary>
    /// Expected working minutes per day (computed from StartTime/EndTime minus
    /// a standard 1-hour lunch break).
    /// </summary>
    public int ExpectedWorkMinutes => (int)(EndTime - StartTime).TotalMinutes - 60;
}
