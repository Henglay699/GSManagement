using GSManagement.Domain.Entities.Enums;

namespace GSManagement.Api.Features.LeaveFeature.DTOs;

/// <summary>
/// Returned to the client for display (table rows, detail view, etc.)
/// </summary>
public class LeaveRequestDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string? UserImageUrl { get; set; }
    public LeaveType LeaveType { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int TotalDays { get; set; }
    public LeaveStatus Status { get; set; }
    public string? Remark { get; set; }
    public DateOnly CreatedAt { get; set; }

    // Who actioned it last (approved/rejected) - filled in if you add the
    // audit columns suggested at the bottom of the controller file.
    public string? ActionedByUserName { get; set; }
    public DateTime? ActionedAt { get; set; }
}

/// <summary>
/// Used by an Admin/HR user to create a leave request on behalf of an employee.
/// Note there is no "CreatedByUserId" field here - that comes from the
/// authenticated principal in the controller, never trust the client for it.
/// </summary>
public class CreateLeaveRequestDto
{
    public required int UserId { get; set; }
    public required LeaveType LeaveType { get; set; }
    public required DateOnly StartDate { get; set; }
    public required DateOnly EndDate { get; set; }
    public string? Remark { get; set; }

    // When HR creates it on behalf of someone, it usually makes sense to let
    // them immediately mark it Approved instead of forcing a second step.
    // Defaults to Pending so nothing sneaks through un-reviewed by mistake.
    public LeaveStatus InitialStatus { get; set; } = LeaveStatus.Pending;
}

/// <summary>
/// Body for PATCH /api/leave-requests/{id}/status
/// </summary>
public class UpdateLeaveRequestStatusDto
{
    public required LeaveStatus Status { get; set; }

    // Optional note explaining an approval/rejection, appended to Remark.
    public string? Note { get; set; }
}

/// <summary>
/// Query params for the admin list/inbox view.
/// </summary>
public class LeaveRequestFilterDto
{
    public int? UserId { get; set; }
    public LeaveStatus? Status { get; set; }
    public LeaveType? LeaveType { get; set; }
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
    public string? Search { get; set; } // matches against employee name
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}