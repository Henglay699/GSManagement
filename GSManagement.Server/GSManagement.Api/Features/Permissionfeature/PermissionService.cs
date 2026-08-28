using GSManagement.Api.Shared.Models;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.Permissionfeature;

public class PermissionService(GSDbContext db)
{
    public async Task<Result<List<PermissionResponse>>> GetPermissions(CancellationToken ct)
    {
        var permissions = await db.Permissions
                .Select(p => new PermissionResponse(
                    p.Id,
                    p.PermissionName.ToString(),
                    p.Description!,
                    p.CreatedAt,
                    p.Module.ToString()
                ))
                .ToListAsync(ct);


        return Result<List<PermissionResponse>>.Success(permissions);
    }

    public async Task<Result<PermissionResponse>> GetPermissionsById(int Id, CancellationToken ct)
    {
        var permissions = await db.Permissions
                .Where(p => p.Id == Id)
                .Select(p => new PermissionResponse(
                    p.Id,
                    p.PermissionName.ToString(),
                    p.Description!,
                    p.CreatedAt,
                    p.Module.ToString()
                ))
                .FirstOrDefaultAsync(ct);
        if (permissions == null)
        {
            return Result<PermissionResponse>.Fail($"Permission with Id {Id} is not found", ErrorType.NotFound);
        }

        return Result<PermissionResponse>.Success(permissions);
    }

    public Task<List<Attendance>> GetAttendanceAsync(CancellationToken ct)
    {
        return db.Attendances.ToListAsync(ct);
    }
}
