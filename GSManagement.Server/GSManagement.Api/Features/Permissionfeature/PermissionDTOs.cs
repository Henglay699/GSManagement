namespace GSManagement.Api.Features.Permissionfeature;

public record PermissionResponse(int Id, string PermissionName,string Description, DateTime CreatedAt, string Module);
