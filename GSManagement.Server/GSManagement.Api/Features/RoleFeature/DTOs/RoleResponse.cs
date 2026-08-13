namespace GSManagement.Api.Features.RoleFeature.DTOs;

public record RoleResponse(int Id, string RoleName, IEnumerable<PermissionResponse> Permissions);
public record PermissionResponse(int Id, string PermissionName);