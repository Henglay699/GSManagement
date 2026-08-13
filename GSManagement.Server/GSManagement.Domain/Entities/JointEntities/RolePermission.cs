using System;
using System.Collections.Generic;
using System.Text;

namespace GSManagement.Domain.Entities.JointEntities;

public class RolePermission
{
    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;
    public int PermissionId { get; set; }
    public Permission Permission { get; set; } = null!;
}
