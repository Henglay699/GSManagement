using GSManagement.Api.Features.UserFeature.DTOs;
using GSManagement.Api.Hubs;
using GSManagement.Api.Shared.Models;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.UserFeature;

public class UserService(GSDbContext _context, IHubContext<UserHub> hubContext) : IUserService
{
    public async Task<Result<UserResponse?>> GetUserByIdAsync(int Id, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == Id)
            .Select(u => new UserResponse
            (
                u.Id,
                u.UserName,
                u.Email,
                u.IsActive,
                u.Roles.Select(r => new RoleResponse
                (
                    r.Id,
                    r.RoleName,
                    r.Permissions.Select(p => new PermissionResponse
                    (
                        p.Id,
                        p.PermissionName.ToString()
                    ))
                )
            ))).FirstOrDefaultAsync(cancellationToken);
        if (user is null)
        {
            return Result<UserResponse?>.Fail("User not found.", ErrorType.NotFound);
        }
        return Result<UserResponse?>.Success(user);
    }


    public async Task<Result<List<UserResponse>>> GetUsersAsync(CancellationToken cancellationToken)
    {
        var users = await _context.Users.OrderByDescending(u => u.Id)
            .AsNoTracking()
            .Select(u => new UserResponse
            (
                u.Id,
                u.UserName,
                u.Email,
                u.IsActive,
                u.Roles.Select(r => new RoleResponse
                (
                    r.Id,
                    r.RoleName,
                    r.Permissions.Select(p => new PermissionResponse
                    (
                        p.Id,
                        p.PermissionName.ToString()
                    )).ToList()
                )).ToList()
            )).ToListAsync(cancellationToken);

        if (users is null || users.Count == 0)
        {
            return Result<List<UserResponse>>.Fail("No users is created yet.", ErrorType.None);
        }
        return Result<List<UserResponse>>.Success(users);
    }



    public async Task<Result<UserResponse>> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken)
    {
        var existingUser = await _context.Users
                .Where(u => u.Email == request.Email || u.UserName == request.UserName)
                .Select(u => new { u.Email, u.UserName })
                .FirstOrDefaultAsync(cancellationToken);

        if (existingUser != null)
        {
            if (existingUser.Email.ToLower().Equals(request.Email, StringComparison.CurrentCultureIgnoreCase))
                return Result<UserResponse>.Fail("Email is already used by another user", ErrorType.Conflict);
            if (existingUser.UserName.ToLower().Equals(request.UserName, StringComparison.CurrentCultureIgnoreCase))
                return Result<UserResponse>.Fail("Username is already used by another user", ErrorType.Conflict);
        }

        var roleIds = request.RoleIds?.Distinct().ToList() ?? [];
        List<Role> validRoles = [];
        if (roleIds.Count != 0)
        {
            validRoles = await _context.Roles
                .Where(r => roleIds.Contains(r.Id))
                .ToListAsync(cancellationToken);

            if (validRoles.Count != roleIds.Count)
            {
                return Result<UserResponse>.Fail("One or more specified role IDs do not exist.", ErrorType.Validation);
            }
        }

        var user = new User
        {
            UserName = request.UserName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
        };
        foreach (var role in validRoles)
        {
            user.Roles.Add(role);
        }
        await _context.Users.AddAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var response = new UserResponse(
            user.Id,
            user.UserName,
            user.Email,
            user.IsActive,
            user.Roles.Select(r => new RoleResponse(
                r.Id,
                r.RoleName,
                r.Permissions.Select(p => new PermissionResponse(
                    p.Id,
                    p.PermissionName.ToString()
                )).ToList()
            )).ToList()
        );

        await hubContext.Clients.All.SendAsync("UserCreated", response, cancellationToken);
        return Result<UserResponse>.Success(response);
    }



    public async Task<Result<UserResponse>> UpdateUserAsync(UpdateUserRequest request, int Id, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == Id, cancellationToken);

        if (user == null)
        {
            return Result<UserResponse>.Fail($"User with ID {Id} was not found.", ErrorType.NotFound);
        }

        var duplicateUser = await _context.Users
            .Where(u => u.Id != Id && (u.Email == request.Email || u.UserName == request.UserName))
            .Select(u => new { u.Email, u.UserName })
            .FirstOrDefaultAsync(cancellationToken);

        if (duplicateUser != null)
        {
            if (duplicateUser.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase))
                return Result<UserResponse>.Fail("Email is already used by another user.", ErrorType.Conflict);

            if (duplicateUser.UserName.Equals(request.UserName, StringComparison.OrdinalIgnoreCase))
                return Result<UserResponse>.Fail("Username is already used by another user.", ErrorType.Conflict);
        }

        var roleIds = request.RoleIds?.Distinct().ToList() ?? [];
        List<Role> newRoles = [];

        if (roleIds.Count != 0)
        {
            newRoles = await _context.Roles
                .Include(p => p.Permissions)
                .Where(r => roleIds.Contains(r.Id))
                .ToListAsync(cancellationToken);

            if (newRoles.Count != roleIds.Count)
            {
                return Result<UserResponse>.Fail("One or more specified role IDs do not exist.", ErrorType.NotFound);
            }
        }
        user.UserName = request.UserName;
        user.Email = request.Email;
        user.IsActive = request.IsActive;


        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        }

        user.Roles.Clear();
        foreach (var role in newRoles)
        {
            user.Roles.Add(role);
        }

        await _context.SaveChangesAsync(cancellationToken);

        var assignedRoleNames = user.Roles.Select(r => r.RoleName).ToList();

        var response = new UserResponse(
            user.Id,
            user.UserName,
            user.Email,
            user.IsActive,
            user.Roles.Select(r => new RoleResponse(
                r.Id,
                r.RoleName,
                r.Permissions.Select(p => new PermissionResponse(
                    p.Id,
                    p.PermissionName.ToString()
                )).ToList()
            )).ToList()
        );

        await hubContext.Clients.All.SendAsync("UserUpdated", response, cancellationToken);

        return Result<UserResponse>.Success(response);
    }

    public async Task<Result<bool>> DeleteUserAsync(int? Id, CancellationToken cancellationToken)
    {
        if (Id is null)
        {
            return Result<bool>.Fail("User ID must be provided.", ErrorType.Validation);
        }
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == Id, cancellationToken);
        if (user == null)
        {
            return Result<bool>.Fail("User not found", ErrorType.NotFound);
        }
        _context.Users.Remove(user);
        await _context.SaveChangesAsync(cancellationToken);
        await hubContext.Clients.All.SendAsync("UserDeleted", user.Id, cancellationToken);
        return Result<bool>.Success(true);
    }

}
