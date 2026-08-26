namespace GSManagement.Api.Features.RoleFeature.DTOs;

public record RoleResponse(int Id, string RoleName, string Description, DateTime CreatedAt, IEnumerable<PermissionResponse> Permissions);
public record PermissionResponse(int Id, string PermissionName, string Module);