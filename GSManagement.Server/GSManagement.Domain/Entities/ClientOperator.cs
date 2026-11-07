namespace GSManagement.Domain.Entities;

/// <summary>
/// An operator assigned to a client. The primary operator owns the client's shipments; backups
/// cover when the primary is on leave. Operators without the ViewAllClients permission only see
/// the clients they are assigned to.
/// </summary>
public class ClientOperator
{
    public int ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public bool IsPrimary { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Who made the assignment (usually the Operations Manager).</summary>
    public int? AssignedById { get; set; }
}
