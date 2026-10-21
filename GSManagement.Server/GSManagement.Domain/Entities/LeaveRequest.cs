using GSManagement.Domain.Entities.Enums;

namespace GSManagement.Domain.Entities;

public class LeaveRequest
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public LeaveType LeaveType { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public required LeaveStatus Status { get; set; }
    public string? Remark { get; set; }
    public DateOnly CreatedAt { get; set; }
    public int? ApproverId { get; set; }

    /// <summary>
    /// When true, this leave covers only half a working day.
    /// StartDate and EndDate must be the same date.
    /// </summary>
    public bool IsHalfDay { get; set; }

    /// <summary>
    /// Which half of the day the employee is taking off.
    /// Only meaningful when IsHalfDay is true.
    /// </summary>
    public HalfDayPeriod? HalfDayPeriod { get; set; }

    public User? User { get; set; }
    public User? Approver { get; set; }

}
