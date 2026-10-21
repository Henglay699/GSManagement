using GSManagement.Api.Hubs;
using GSManagement.Domain.DB;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace JwtTest.Middlewares.CheckPermission;

public record UserAccess(bool IsActive, IReadOnlyList<string> Permissions);

// Caches each user's active flag and permissions so authorization doesn't hit
// the database on every request. Call InvalidateAsync whenever a user's roles,
// a role's permissions, or a user's active flag changes.
public class UserAccessCache(IMemoryCache cache, IHubContext<UserHub> hubContext)
{
    public const string PermissionClaimType = "permission";

    // Tells the affected users' browsers to reload their permissions (GET /api/Auth/me).
    public const string AccessChangedEvent = "AccessChanged";

    // Safety net in case an invalidation is missed somewhere.
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);

    private static string Key(int userId) => $"user-access:{userId}";

    public async Task<UserAccess?> GetAsync(int userId, GSDbContext db, CancellationToken ct)
    {
        return await cache.GetOrCreateAsync(Key(userId), async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = Lifetime;
            var row = await db.Users
                .AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => new
                {
                    u.IsActive,
                    Permissions = u.Roles.SelectMany(r => r.Permissions).Select(p => p.PermissionName).ToList()
                })
                .FirstOrDefaultAsync(ct);

            // Distinct/ToString in memory: EF can't translate them inside this subquery.
            return row is null
                ? null
                : new UserAccess(row.IsActive, row.Permissions.Distinct().Select(p => p.ToString()).ToList());
        });
    }

    public Task InvalidateAsync(int userId, CancellationToken ct) => InvalidateAsync([userId], ct);

    public async Task InvalidateAsync(IReadOnlyCollection<int> userIds, CancellationToken ct)
    {
        if (userIds.Count == 0)
            return;

        foreach (var userId in userIds)
            cache.Remove(Key(userId));

        // SignalR identifies users by their NameIdentifier claim, so only the
        // affected users (on any of their open tabs/devices) get this.
        await hubContext.Clients
            .Users(userIds.Select(id => id.ToString()).ToList())
            .SendAsync(AccessChangedEvent, ct);
    }
}
