using GSManagement.Api.Features.UserFeature.DTOs;
using GSManagement.Api.Hubs;
using GSManagement.Api.Shared.Models;
using GSManagement.Api.Shared.Storage;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using JwtTest.Middlewares.CheckPermission;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.UserFeature;

public class UserService(
    GSDbContext _context,
    IHubContext<UserHub> hubContext,
    IFileStorage fileStorage,
    UserAccessCache accessCache) : IUserService
{
    public const long MaxPhotoBytes = 5 * 1024 * 1024;

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
                u.ImageUrl,
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

    //------------------------------==--------------------------------------------
    public async Task<Result<PagedResult<UserResponse>>> GetUsersAsync(
        int pageNumber,
        int pageSize,
        string? searchTerm, CancellationToken ct)
    {

        var query = _context.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.ToLower();
            query = query.Where(u => u.UserName.ToLower().Contains(term)
                        || u.Email.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(ct);

        var users = await query
            .OrderByDescending(u => u.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserResponse
            (
                u.Id,
                u.UserName,
                u.Email,
                u.IsActive,
                u.ImageUrl,
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
            )).ToListAsync(ct);

        var result = new PagedResult<UserResponse>(users, totalCount, pageNumber, pageSize);
        return Result<PagedResult<UserResponse>>.Success(result);
    }


    //-------------------------------------==--------------------------------------------

    public async Task<List<UsersSelectionRespone>> GetUsersDataAsync(CancellationToken ct)
    {

        var users = await _context.Users
         .Select(u => new UsersSelectionRespone
         (
             u.Id,
             u.UserName,
             u.Email,
             u.ImageUrl,
             string.Join(",", u.Roles.Select(r => r.RoleName)) ?? string.Empty
         ))
         .ToListAsync();

        return users;
    }
    //-------------------------------------==--------------------------------------------
    public async Task<Result<UserResponse>> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken)
    {
        var existingUser = await _context.Users
                .Where(u => u.Email == request.Email || u.UserName == request.UserName)
                .Select(u => new { u.Email, u.UserName })
                .FirstOrDefaultAsync(cancellationToken);

        if (existingUser != null)
        {
            if (existingUser.Email.ToLower().Equals(request.Email, StringComparison.OrdinalIgnoreCase))
                return Result<UserResponse>.Fail("Email is already used by another user", ErrorType.Conflict);
            if (existingUser.UserName.ToLower().Equals(request.UserName, StringComparison.OrdinalIgnoreCase))
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
            Email = request.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password.Trim()),
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
            user.ImageUrl,
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


    //------------------------------==--------------------------------------------
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
        user.Email = request.Email.Trim().ToLower();
        user.IsActive = request.IsActive;


        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword.Trim());
        }

        user.Roles.Clear();
        foreach (var role in newRoles)
        {
            user.Roles.Add(role);
        }

        await _context.SaveChangesAsync(cancellationToken);
        // Roles or the active flag may have changed.
        await accessCache.InvalidateAsync(user.Id, cancellationToken);

        var assignedRoleNames = user.Roles.Select(r => r.RoleName).ToList();

        var response = new UserResponse(
            user.Id,
            user.UserName,
            user.Email,
            user.IsActive,
            user.ImageUrl,
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

    //------------------------------==--------------------------------------------
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
        await accessCache.InvalidateAsync(user.Id, cancellationToken);
        await fileStorage.DeleteByUrlAsync(user.ImageUrl, cancellationToken);
        await hubContext.Clients.All.SendAsync("UserDeleted", user.Id, cancellationToken);
        return Result<bool>.Success(true);
    }

    //------------------------------==--------------------------------------------
    public async Task<Result<UserPhotoResponse>> UploadPhotoAsync(int id, IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
            return Result<UserPhotoResponse>.Fail("Photo file is empty.", ErrorType.Validation);
        if (file.Length > MaxPhotoBytes)
            return Result<UserPhotoResponse>.Fail("Photo must be 5 MB or smaller.", ErrorType.Validation);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user == null)
            return Result<UserPhotoResponse>.Fail($"User with ID {id} was not found.", ErrorType.NotFound);

        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, cancellationToken);

        // Trust the file's bytes, not the client-supplied Content-Type.
        var format = DetectImageFormat(stream.GetBuffer().AsSpan(0, (int)stream.Length));
        if (format is null)
            return Result<UserPhotoResponse>.Fail("Only JPEG, PNG or WebP images are allowed.", ErrorType.Validation);

        stream.Position = 0;
        // A new key per upload, so browsers and the CDN never serve a stale cached photo.
        var key = $"users/{id}/{Guid.NewGuid():N}.{format.Value.Extension}";
        var newUrl = await fileStorage.UploadAsync(stream, key, format.Value.ContentType, cancellationToken);

        var oldUrl = user.ImageUrl;
        user.ImageUrl = newUrl;
        await _context.SaveChangesAsync(cancellationToken);
        await fileStorage.DeleteByUrlAsync(oldUrl, cancellationToken);

        await BroadcastUserUpdatedAsync(id, cancellationToken);
        return Result<UserPhotoResponse>.Success(new UserPhotoResponse(newUrl));
    }

    //------------------------------==--------------------------------------------
    public async Task<Result<bool>> RemovePhotoAsync(int id, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user == null)
            return Result<bool>.Fail($"User with ID {id} was not found.", ErrorType.NotFound);

        var oldUrl = user.ImageUrl;
        user.ImageUrl = null;
        await _context.SaveChangesAsync(cancellationToken);
        await fileStorage.DeleteByUrlAsync(oldUrl, cancellationToken);

        await BroadcastUserUpdatedAsync(id, cancellationToken);
        return Result<bool>.Success(true);
    }

    //------------------------------==--------------------------------------------
    // Self-service (My Profile): a user may only change their own name here.
    // Email, roles and the active flag stay admin-only (UpdateUserAsync).
    public async Task<Result<bool>> UpdateOwnNameAsync(int id, string userName, CancellationToken cancellationToken)
    {
        userName = userName.Trim();
        if (userName.Length == 0)
            return Result<bool>.Fail("Username is required.", ErrorType.Validation);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user == null)
            return Result<bool>.Fail("User not found.", ErrorType.NotFound);

        if (await _context.Users.AnyAsync(u => u.Id != id && u.UserName == userName, cancellationToken))
            return Result<bool>.Fail("Username is already used by another user.", ErrorType.Conflict);

        user.UserName = userName;
        await _context.SaveChangesAsync(cancellationToken);

        await BroadcastUserUpdatedAsync(id, cancellationToken);
        return Result<bool>.Success(true);
    }

    //------------------------------==--------------------------------------------
    public async Task<Result<bool>> ChangeOwnPasswordAsync(int id, string currentPassword, string newPassword, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(newPassword))
            return Result<bool>.Fail("New password is required.", ErrorType.Validation);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user == null)
            return Result<bool>.Fail("User not found.", ErrorType.NotFound);

        // Trimmed like login and the admin create/update paths do.
        if (!BCrypt.Net.BCrypt.Verify(currentPassword.Trim(), user.PasswordHash))
            return Result<bool>.Fail("Current password is incorrect.", ErrorType.Validation);
        if (BCrypt.Net.BCrypt.Verify(newPassword.Trim(), user.PasswordHash))
            return Result<bool>.Fail("New password must be different from the current one.", ErrorType.Validation);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword.Trim());
        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }

    private async Task BroadcastUserUpdatedAsync(int id, CancellationToken cancellationToken)
    {
        var updated = await GetUserByIdAsync(id, cancellationToken);
        if (updated.IsSuccess)
            await hubContext.Clients.All.SendAsync("UserUpdated", updated.Value, cancellationToken);
    }

    private static (string Extension, string ContentType)? DetectImageFormat(ReadOnlySpan<byte> bytes)
    {
        if (bytes.StartsWith((ReadOnlySpan<byte>)[0xFF, 0xD8, 0xFF]))
            return ("jpg", "image/jpeg");
        if (bytes.StartsWith((ReadOnlySpan<byte>)[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))
            return ("png", "image/png");
        if (bytes.Length >= 12 && bytes[..4].SequenceEqual("RIFF"u8) && bytes[8..12].SequenceEqual("WEBP"u8))
            return ("webp", "image/webp");
        return null;
    }
}
