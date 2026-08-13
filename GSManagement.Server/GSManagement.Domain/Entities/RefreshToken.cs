namespace GSManagement.Domain.Entities;

public class RefreshToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public bool IsInVoked { get; set; } = false;
    public string DeviceId { get; set; } = null!;
    public DateTime ExpireDate { get; set; }
    public User? User { get; set; }
}
