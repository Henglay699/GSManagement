namespace GSManagement.Domain.Entities;

public partial class Role
{
    public int Id { get; set; }
    public string RoleName { get; set; } = null!;
    public string? Description { get; set; }
    public required DateTime CreatedAt { get; set; }
    public virtual ICollection<User> Users { get; set; } = [];
    public virtual ICollection<Permission> Permissions { get; set; } = [];
}

