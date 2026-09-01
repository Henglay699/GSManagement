
using GSManagement.Api.Features.LeaveFeature.DTOs;

namespace GSManagement.Api.Features.LeaveFeature;

public interface ILeaveRequestService
{
    /// <summary>
    /// Admin/HR creates a leave request for an employee.
    /// </summary>
    /// <param name="dto">The request details, including which employee it is for.</param>
    /// <param name="createdByUserId">Id of the authenticated admin/HR user (from the JWT, not the body).</param>
    Task<LeaveRequestDto> CreateAsync(CreateLeaveRequestDto dto, int createdByUserId);

    Task<PagedResult<LeaveRequestDto>> GetAllAsync(LeaveRequestFilterDto filter);

    Task<LeaveRequestDto?> GetByIdAsync(int id);

    /// <summary>
    /// Approve or reject a pending request. Throws if the request is not in a
    /// state that can transition (e.g. already Approved/Cancelled).
    /// </summary>
    Task<LeaveRequestDto> UpdateStatusAsync(int id, UpdateLeaveRequestStatusDto dto, int actionedByUserId);

    Task DeleteAsync(int id);
}