using System.Reflection;
using GSManagement.Domain.Entities.Enums;
namespace GSManagement.Domain.Entities;

public class Permission
{
    public int Id { get; set; }
    public AppPermission PermissionName { get; set; }
    public string? Description { get; set; }
    public required PermissionModule Module { get; set; }
    public required DateTime CreatedAt { get; set; }
    public virtual ICollection<Role> Roles { get; set; } = [];
}

