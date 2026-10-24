namespace GSManagement.Domain.Entities;

public partial class Role
{
    /// <summary>
    /// The system admin role. It can't be deleted or renamed, and neither can
    /// the users who hold it (see UserService / RoleService).
    /// </summary>
    public const string AdminRoleName = "Admin";

    public int Id { get; set; }
    public string RoleName { get; set; } = null!;
    public string? Description { get; set; }
    public required DateTime CreatedAt { get; set; }
    public virtual ICollection<User> Users { get; set; } = [];
    public virtual ICollection<Permission> Permissions { get; set; } = [];
}

