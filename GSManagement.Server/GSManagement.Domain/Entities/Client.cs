namespace GSManagement.Domain.Entities;

/// <summary>
/// A customer of Grateful Solutions: usually a garment factory (e.g. JR Apparel) whose imports
/// and exports we clear. Each client is looked after by its own operator(s), see
/// <see cref="ClientOperator"/>.
/// </summary>
public class Client
{
    public int Id { get; set; }

    /// <summary>Short code used on job numbers and filters, e.g. JR, JYX, VFL.</summary>
    public string? Code { get; set; }

    public required string CompanyName { get; set; }

    /// <summary>Company name in Khmer, as printed on customs letters.</summary>
    public string? CompanyNameKm { get; set; }

    /// <summary>Contact email. Optional: a client portal login can be added later.</summary>
    public string? Email { get; set; }

    /// <summary>Reserved for a client portal login; null until one is set up.</summary>
    public string? PasswordHash { get; set; }

    public required string Vat { get; set; }

    /// <summary>e.g. Garment factory, Trading company.</summary>
    public string? BusinessType { get; set; }

    public string? Address { get; set; }
    public string? ContactName { get; set; }
    public string? Phone { get; set; }

    /// <summary>QIP master list (CDC) number and how long it is valid.</summary>
    public string? CdcNo { get; set; }
    public DateOnly? CdcValidUntil { get; set; }

    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>The operators who handle this client: one primary, any number of backups.</summary>
    public ICollection<ClientOperator> Operators { get; set; } = [];
}
