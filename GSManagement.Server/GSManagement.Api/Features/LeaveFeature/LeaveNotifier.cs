using GSManagement.Api.Features.LeaveFeature.DTOs;
using GSManagement.Api.Hubs;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.LeaveFeature;

// Pushes leave changes to the people who review leave (anyone with
// ViewLeave, i.e. HR/Admin) over UserHub. Recipients are looked up per
// call, so a permission change takes effect without reconnecting.
public class LeaveNotifier(GSDbContext context, IHubContext<UserHub> hubContext, ILogger<LeaveNotifier> logger)
{
    // Payload: the new LeaveRequestDto. Used for the "new request" toast.
    public const string LeaveRequestedEvent = "LeaveRequested";

    // Payload: the current number of pending requests, for the sidebar badge.
    public const string PendingLeaveCountEvent = "PendingLeaveCount";

    public Task<int> GetPendingCountAsync() =>
        context.LeaveRequests.CountAsync(lr => lr.Status == LeaveStatus.Pending);

    /// <summary>
    /// Call after anything that can change the pending count. Pass the
    /// request when an employee has just submitted one.
    /// </summary>
    public async Task NotifyAsync(LeaveRequestDto? newRequest = null)
    {
        // A failed push must never fail the request that triggered it.
        try
        {
            var reviewerIds = await context.Users
                .Where(u => u.IsActive && u.Roles
                    .SelectMany(r => r.Permissions)
                    .Any(p => p.PermissionName == AppPermission.ViewLeave))
                .Select(u => u.Id.ToString())
                .ToListAsync();

            if (reviewerIds.Count == 0)
                return;

            var reviewers = hubContext.Clients.Users(reviewerIds);
            await reviewers.SendAsync(PendingLeaveCountEvent, await GetPendingCountAsync());

            if (newRequest is not null)
                await reviewers.SendAsync(LeaveRequestedEvent, newRequest);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to push leave notification");
        }
    }
}
