namespace GSManagement.Domain.Entities.Enums;

/// <summary>
/// What a stored attendance record says about the day. Exactly one per record.
/// Problems inside a worked day (late, left early, missed clock-out, overtime)
/// are separate fields on <see cref="Attendance"/>, not extra statuses.
/// </summary>
public enum AttendanceStatus
{
    /// <summary>Worked, arrived within the grace period.</summary>
    Present,
    /// <summary>Worked, arrived after the grace period (see LateMinutes).</summary>
    Late,
    /// <summary>Approved half-day leave; the other half may have been worked.</summary>
    HalfDay,
    /// <summary>Approved full-day leave.</summary>
    OnLeave,
    /// <summary>Working day with no clock-in and no leave.</summary>
    Absent
}
