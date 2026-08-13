using System.ComponentModel.DataAnnotations;

namespace GSManagement.Api.Features.UserFeature.DTOs;

public record UpdateUserRequest(
    [Required] string UserName,
    [Required][EmailAddress] string Email,
    bool IsActive = true,
    string? NewPassword = null,
    string? ImageUrl = null,
    IEnumerable<int>? RoleIds = null);