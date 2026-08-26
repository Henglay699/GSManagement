using System.ComponentModel.DataAnnotations;

namespace GSManagement.Api.Features.RoleFeature.DTOs;

public record CreateRoleRequest([Required] string RoleName, string Description, IEnumerable<int> PermissionIds);
