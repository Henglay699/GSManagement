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
                .Select(p => new PermissionResponse(p.Id, p.PermissionName.ToString(), p.Module.ToString())).ToList();
        var response = new RoleResponse(role.Id, role.RoleName, role.Description!, role.CreatedAt, permissions);
        return Result<RoleResponse>.Success(response);
    }


    //------------------------------==--------------------------------------------
    public async Task<Result<PagedResult<RoleResponse>>> GetAllRoleAsync(
        int pageNumber,
        int pageSize,
        string? searchTerm,
        CancellationToken ct)
    {
        var query = context.Roles.Include(r => r.Permissions).AsNoTracking();
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.ToLower();
            query = query.Where(r => r.RoleName.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(ct);


        var roles = await query
              .OrderByDescending(r => r.Id)
              .Skip((pageNumber - 1) * pageSize)
              .Take(pageSize)
              .Select(r => new RoleResponse
              (
                  r.Id,
                  r.RoleName,
                  r.Description!,
                  r.CreatedAt,
                  r.Permissions.Select(p => new PermissionResponse
                  (
                      p.Id,
                      p.PermissionName.ToString(),
                      p.Module.ToString()
                  )).ToList()
              )).ToListAsync(ct);


        var results = new PagedResult<RoleResponse>(roles, totalCount, pageNumber, pageSize);
        return Result<PagedResult<RoleResponse>>.Success(results);
    }


    //------------------------------==--------------------------------------------
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
            Description = request.Description,
            CreatedAt = DateTime.Now
        };
        foreach (var permission in validPermissions)
        {
            role.Permissions.Add(permission);
        }
        await context.Roles.AddAsync(role, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var permissionsName = role.Permissions
                .Select(p => new PermissionResponse(p.Id, p.PermissionName.ToString(), p.Module.ToString())).ToList();
        var response = new RoleResponse(role.Id, role.RoleName, role.Description!, role.CreatedAt, permissionsName);
        return Result<RoleResponse>.Success(response);
    }


    //------------------------------==--------------------------------------------
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
        role.Description = request.Description;
        role.Permissions.Clear();
        foreach (var permission in newPermissions)
        {
            role.Permissions.Add(permission);
        }

        await context.SaveChangesAsync(cancellationToken);

        var assignedPermissionNames = role.Permissions
                .Select(p => new PermissionResponse(p.Id, p.PermissionName.ToString(), p.Module.ToString())).ToList();

        var response = new RoleResponse(role.Id, role.RoleName, role.Description, role.CreatedAt, assignedPermissionNames);
        return Result<RoleResponse>.Success(response);
    }


    //------------------------------==--------------------------------------------
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
