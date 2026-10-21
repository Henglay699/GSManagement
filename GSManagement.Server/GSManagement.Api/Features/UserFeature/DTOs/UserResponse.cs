namespace GSManagement.Api.Features.UserFeature.DTOs;

public record UserResponse(int Id, string UserName, string Email, bool IsActive, string? ImageUrl, IEnumerable<RoleResponse> Roles);
public record UserPhotoResponse(string? ImageUrl);
public record RoleResponse(int Id, string RoleName, IEnumerable<PermissionResponse> Permissions);
public record PermissionResponse(int Id, string PermissionName);