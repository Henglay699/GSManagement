namespace GSManagement.Domain.Entities;

public partial class User
{
    public int Id { get; set; }

    public string UserName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public bool IsActive { get; set; } = true;

    public string? ImageUrl { get; set; }

    public virtual ICollection<Role> Roles { get; set; } = new List<Role>();

    public List<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}