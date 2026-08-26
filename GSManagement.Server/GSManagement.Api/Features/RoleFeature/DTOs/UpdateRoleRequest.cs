using System.ComponentModel.DataAnnotations;

namespace GSManagement.Api.Features.RoleFeature.DTOs;

public record UpdateRoleRequest([Required] string RoleName, string Description, IEnumerable<int> PermissionIds);
