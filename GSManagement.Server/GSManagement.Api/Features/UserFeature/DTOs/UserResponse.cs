namespace GSManagement.Api.Features.UserFeature.DTOs;

public record UserResponse(int Id, string UserName, string Email, bool IsActive, IEnumerable<RoleResponse> Roles);
public record RoleResponse(int Id, string RoleName, IEnumerable<PermissionResponse> Permissions);
public record PermissionResponse(int Id, string PermissionName);