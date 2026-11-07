namespace GSManagement.Api.Features.ClientFeature.DTOs;

/// <summary>An operator assigned to a client.</summary>
public record ClientOperatorDto(int UserId, string UserName, string? ImageUrl, bool IsPrimary);

public record ClientDto(
    int Id,
    string? Code,
    string CompanyName,
    string? CompanyNameKm,
    string? Email,
    string Vat,
    string? BusinessType,
    string? Address,
    string? ContactName,
    string? Phone,
    string? CdcNo,
    DateOnly? CdcValidUntil,
    string? Notes,
    bool IsActive,
    DateTime CreatedAt,
    List<ClientOperatorDto> Operators,
    // The signed-in user is one of its operators.
    bool IsMine
);

/// <summary>Body for POST /api/clients and PUT /api/clients/{id}.</summary>
public record SaveClientDto(
    string? Code,
    string CompanyName,
    string? CompanyNameKm,
    string? Email,
    string Vat,
    string? BusinessType,
    string? Address,
    string? ContactName,
    string? Phone,
    string? CdcNo,
    DateOnly? CdcValidUntil,
    string? Notes,
    bool IsActive = true
);

/// <summary>Body for PUT /api/clients/{id}/operators: who handles the client.</summary>
public record AssignOperatorsDto(int? PrimaryUserId, List<int> BackupUserIds);

/// <summary>Someone who can be assigned to clients, with how many they already handle.</summary>
public record OperatorOptionDto(int Id, string UserName, string Email, string? ImageUrl, string Roles, int PrimaryCount, int BackupCount);

/// <summary>Query for GET /api/clients.</summary>
public class ClientQuery
{
    public string? Search { get; set; }
    /// <summary>"mine" = clients assigned to me; "all" = every client (needs ViewAllClients).</summary>
    public string? Scope { get; set; }
    /// <summary>Clients handled by this operator (managers only).</summary>
    public int? OperatorId { get; set; }
    /// <summary>Only clients with no primary operator yet (managers only).</summary>
    public bool Unassigned { get; set; }
    public bool IncludeInactive { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

/// <summary>Who is asking, and what their permissions let them see.</summary>
public record ClientViewer(int UserId, bool SeeAll, bool CanAssign);
