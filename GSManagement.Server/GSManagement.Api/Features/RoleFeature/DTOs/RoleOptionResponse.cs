namespace GSManagement.Api.Features.RoleFeature.DTOs;

/// <summary>A role as a pick-list entry, for assigning roles to users.</summary>
public record RoleOptionResponse(int Id, string RoleName);
