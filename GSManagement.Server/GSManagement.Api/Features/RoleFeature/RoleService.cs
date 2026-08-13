using GSManagement.Api.Features.RoleFeature.DTOs;
using GSManagement.Api.Shared.Models;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.RoleFeature;

public class RoleService(GSDbContext context) : IRoleService
{
    public async Task<Result<RoleResponse>> GetRoleByIdAsync(int Id, CancellationToken cancellationToken)
    {
        var role = await context.Roles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.Id == Id, cancellationToken);

        if (role == null)
        {
            return Result<RoleResponse>.Fail($"Role with ID {Id} was not found.", ErrorType.NotFound);
        }

        var permissions = role.Permissions
                .Select(p => new PermissionResponse(p.Id, p.PermissionName.ToString())).ToList();
        var response = new RoleResponse(role.Id, role.RoleName, permissions);
        return Result<RoleResponse>.Success(response);
    }



    public async Task<Result<List<RoleResponse>>> GetAllRoleAsync(CancellationToken cancellationToken)
    {
        var roles = await context.Roles
              .AsNoTracking()
              .Select(r => new RoleResponse
              (
                  r.Id,
                  r.RoleName,
                  r.Permissions.Select(p => new PermissionResponse
                  (
                      p.Id,
                      p.PermissionName.ToString()
                  )).ToList()
              )).ToListAsync(cancellationToken);

        if (roles is null || roles.Count == 0)
        {
            return Result<List<RoleResponse>>.Fail("Role have not created yet.", ErrorType.NotFound);
        }

        return Result<List<RoleResponse>>.Success(roles);
    }



    public async Task<Result<RoleResponse>> CreateRoleAsync(CreateRoleRequest request, CancellationToken cancellationToken)
    {
        var existingRole = await context.Roles
                 .Where(r => r.RoleName == request.RoleName)
                 .Select(r => new { r.RoleName })
                 .FirstOrDefaultAsync(cancellationToken);

        if (existingRole != null)
        {
            return Result<RoleResponse>.Fail("Role name is already used by another role", ErrorType.Conflict);
        }
        var permissionIds = request.PermissionIds?.Distinct().ToList() ?? [];
        List<Permission> validPermissions = [];
        if (permissionIds.Count != 0)
        {
            validPermissions = await context.Permissions
                .Where(p => permissionIds.Contains(p.Id))
                .ToListAsync(cancellationToken);

            if (validPermissions.Count != permissionIds.Count)
            {
                return Result<RoleResponse>.Fail("One or more specified permission IDs do not exist.", ErrorType.Validation);
            }
        }
        var role = new Role
        {
            RoleName = request.RoleName,
        };
        foreach (var permission in validPermissions)
        {
            role.Permissions.Add(permission);
        }
        await context.Roles.AddAsync(role, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var permissionsName = role.Permissions
                .Select(p => new PermissionResponse(p.Id, p.PermissionName.ToString())).ToList();
        var response = new RoleResponse(role.Id, role.RoleName, permissionsName);
        return Result<RoleResponse>.Success(response);
    }



    public async Task<Result<RoleResponse>> UpdateRoleAsync(UpdateRoleRequest request, int Id, CancellationToken cancellationToken)
    {
        var role = await context.Roles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.Id == Id, cancellationToken);

        if (role == null)
        {
            return Result<RoleResponse>.Fail($"Role with ID {Id} was not found.", ErrorType.NotFound);
        }

        var duplicateRole = await context.Roles
            .Where(r => r.Id != Id && r.RoleName == request.RoleName)
            .Select(r => new { r.RoleName })
            .FirstOrDefaultAsync(cancellationToken);

        if (duplicateRole != null)
        {
            return Result<RoleResponse>.Fail("Role name is already used by another role.", ErrorType.Conflict);
        }

        var permissionIds = request.PermissionIds?.Distinct().ToList() ?? [];
        List<Permission> newPermissions = [];

        if (permissionIds.Count != 0)
        {
            newPermissions = await context.Permissions
                .Where(p => permissionIds.Contains(p.Id))
                .ToListAsync(cancellationToken);

            if (newPermissions.Count != permissionIds.Count)
            {
                return Result<RoleResponse>.Fail("One or more specified permission IDs do not exist.", ErrorType.Validation);
            }
        }

        role.RoleName = request.RoleName;
        role.Permissions.Clear();
        foreach (var permission in newPermissions)
        {
            role.Permissions.Add(permission);
        }

        await context.SaveChangesAsync(cancellationToken);

        var assignedPermissionNames = role.Permissions
                .Select(p => new PermissionResponse(p.Id, p.PermissionName.ToString())).ToList();

        var response = new RoleResponse(role.Id, role.RoleName, assignedPermissionNames);
        return Result<RoleResponse>.Success(response);
    }



    public async Task<Result<bool>> DeleteRoleAsync(int Id, CancellationToken cancellationToken)
    {
        var role = await context.Roles.FirstOrDefaultAsync(r => r.Id == Id, cancellationToken);
        if (role == null)
        {
            return Result<bool>.Fail("Role not found", ErrorType.NotFound);
        }

        context.Roles.Remove(role);
        await context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
