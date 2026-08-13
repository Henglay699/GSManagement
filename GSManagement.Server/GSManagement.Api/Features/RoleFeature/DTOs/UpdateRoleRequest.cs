using System.ComponentModel.DataAnnotations;

namespace GSManagement.Api.Features.RoleFeature.DTOs;

public record UpdateRoleRequest([Required] string RoleName, IEnumerable<int> PermissionIds);
