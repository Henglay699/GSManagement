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

    public User? User { get; set; }
}
