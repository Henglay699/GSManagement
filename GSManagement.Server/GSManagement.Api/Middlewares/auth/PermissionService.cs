using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Middlewares.auth;

public class PermissionService : IPermissionService
{
    private readonly GSDbContext db;

    public PermissionService(GSDbContext db)
    {
        this.db = db;
    }


    public async Task<bool> HasPermission(int userId, string requiredPermission)
    {
        // ICollection<Role>[] roles = await db.Users
        //     .Include(u => u.Roles)
        //     .ThenInclude(r => r.Permissions)
        //     .Where(u => u.Id == userId)
        //     .Select(r => r.Roles)
        //     .ToArrayAsync();

        // var permissions = roles.SelectMany(x => x)
        //                .SelectMany(x => x.Permissions)
        //                .Select(x => x.PermissionName)
        //                .ToHashSet();
        // return permissions.Contains(requiredPermission);
        if (!Enum.TryParse<AppPermission>(requiredPermission, out var requiredEnum))
        {
            return false;
        }
        return await db.Users
            .Where(u => u.Id == userId)
            .SelectMany(u => u.Roles)
            .SelectMany(r => r.Permissions)
            .AnyAsync(p => p.PermissionName == requiredEnum);
    }
}
