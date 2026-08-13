using System.ComponentModel.DataAnnotations;

namespace GSManagement.Api.Features.RoleFeature.DTOs;

public record CreateRoleRequest([Required] string RoleName, IEnumerable<int> PermissionIds);
